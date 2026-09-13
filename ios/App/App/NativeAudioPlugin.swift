import Foundation
import UIKit
import Capacitor
import AVFoundation
import MediaPlayer

@objc(NativeAudioPlugin)
public class NativeAudioPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "NativeAudioPlugin"
    public let jsName = "NativeAudio"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "setQueue", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "play", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "pause", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "next", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "previous", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "seek", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "setShuffle", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "setRepeat", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "stop", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getState", returnType: CAPPluginReturnPromise)
    ]

    private struct Track {
        let id: String
        let path: String
        let title: String
        let artist: String
        let album: String
        let duration: Double
        let coverArt: String?

        init?(_ value: JSObject) {
            guard let path = (value["url"] ?? value["path"]) as? String,
                  let id = value["id"] as? String, !id.isEmpty, path.hasPrefix("/") else { return nil }
            self.id = id
            self.path = path
            title = value["title"] as? String ?? URL(fileURLWithPath: path).deletingPathExtension().lastPathComponent
            artist = value["artist"] as? String ?? "Không rõ nghệ sĩ"
            album = value["album"] as? String ?? "Không rõ album"
            let seconds = value["duration"] as? Double ?? 0
            duration = seconds.isFinite ? max(0, seconds) : 0
            coverArt = value["coverArt"] as? String
        }
    }

    // The main queue owns playback, navigation and end-of-track handling,
    // including while iOS suspends the WebView.
    private let player = AVPlayer()
    private var tracks: [Track] = []
    private var index = -1
    private var access: FolderAccessLease?
    private var shuffle = false
    private var repeatMode = "off"
    private var wantsPlayback = false
    private var ended = false
    private var resumeAfterInterruption = false
    private var playbackError: String?
    private var timeObserver: Any?
    private var statusObserver: NSKeyValueObservation?
    private var itemObserver: NSKeyValueObservation?
    private var notifications: [NSObjectProtocol] = []
    private var remoteTargets: [(MPRemoteCommand, Any)] = []

    override public func load() {
        DispatchQueue.main.async {
            self.statusObserver = self.player.observe(\.timeControlStatus, options: [.new]) { [weak self] _, _ in
                DispatchQueue.main.async { self?.emitState() }
            }
            self.timeObserver = self.player.addPeriodicTimeObserver(
                forInterval: CMTime(seconds: 0.5, preferredTimescale: 600), queue: .main
            ) { [weak self] _ in self?.emitState() }
            self.installNotifications()
            self.installRemoteCommands()
        }
    }

    private var currentTrack: Track? { tracks.indices.contains(index) ? tracks[index] : nil }
    private var seconds: Double {
        let value = CMTimeGetSeconds(player.currentTime())
        return value.isFinite ? max(0, value) : 0
    }
    private var duration: Double {
        let value = CMTimeGetSeconds(player.currentItem?.duration ?? .zero)
        return value.isFinite && value > 0 ? value : currentTrack?.duration ?? 0
    }

    private func state() -> JSObject {
        var snapshot: JSObject = [
            "apiVersion": 1,
            "songId": NSNull(),
            "currentIndex": index, "isPlaying": player.rate > 0,
            "currentTime": seconds, "duration": duration,
            "shuffle": shuffle, "repeatMode": repeatMode,
            "error": NSNull()
        ]
        if let songID = currentTrack?.id { snapshot["songId"] = songID }
        if let error = playbackError { snapshot["error"] = error }
        return snapshot
    }

    private func emitState() {
        updateNowPlayingPosition()
        notifyListeners("stateChanged", data: state())
    }

    private func fail(_ error: Error) {
        wantsPlayback = false
        player.pause()
        playbackError = error.localizedDescription
        emitState()
    }

    private func run(_ call: CAPPluginCall, _ operation: @escaping () throws -> Void) {
        DispatchQueue.main.async {
            do {
                try operation()
                self.emitState()
                call.resolve(self.state())
            } catch {
                self.fail(error)
                call.reject(error.localizedDescription, "PLAYBACK")
            }
        }
    }

    @objc func getState(_ call: CAPPluginCall) {
        DispatchQueue.main.async { call.resolve(self.state()) }
    }

    @objc func setQueue(_ call: CAPPluginCall) {
        run(call) {
            guard let values = call.getArray("songs", JSObject.self), !values.isEmpty else {
                throw LibraryAccessError.invalidFile
            }
            let tracks = values.compactMap(Track.init)
            let startIndex = call.getInt("startIndex") ?? 0
            guard tracks.count == values.count, tracks.indices.contains(startIndex) else {
                throw LibraryAccessError.invalidFile
            }
            let newAccess = try FolderAccessStore.shared.acquire()
            _ = try newAccess.fileURL(for: tracks[startIndex].path)
            self.player.pause()
            self.player.replaceCurrentItem(with: nil)
            self.access = newAccess
            self.tracks = tracks
            try self.loadTrack(startIndex, autoplay: call.getBool("autoplay") ?? true)
        }
    }

    @objc func play(_ call: CAPPluginCall) { run(call) { try self.resumePlayback() } }
    @objc func pause(_ call: CAPPluginCall) { run(call) { self.pausePlayback() } }
    @objc func next(_ call: CAPPluginCall) { run(call) { try self.advance(1) } }
    @objc func previous(_ call: CAPPluginCall) { run(call) { try self.advance(-1) } }
    @objc func seek(_ call: CAPPluginCall) { run(call) { self.seekTo(call.getDouble("time") ?? 0) } }
    @objc func setShuffle(_ call: CAPPluginCall) { run(call) { self.shuffle = call.getBool("enabled") ?? false } }

    @objc func setRepeat(_ call: CAPPluginCall) {
        run(call) {
            guard let mode = call.getString("mode"), ["off", "all", "one"].contains(mode) else {
                throw NSError(domain: "VibePlayer", code: 1,
                              userInfo: [NSLocalizedDescriptionKey: "Chế độ lặp không hợp lệ."])
            }
            self.repeatMode = mode
        }
    }

    @objc func stop(_ call: CAPPluginCall) {
        run(call) {
            self.pausePlayback()
            self.itemObserver = nil
            self.player.replaceCurrentItem(with: nil)
            self.tracks = []
            self.index = -1
            self.access = nil
            self.ended = false
            self.playbackError = nil
            MPNowPlayingInfoCenter.default().nowPlayingInfo = nil
            try? AVAudioSession.sharedInstance().setActive(false, options: .notifyOthersOnDeactivation)
        }
    }

    private func activateSession() throws {
        let session = AVAudioSession.sharedInstance()
        try session.setCategory(.playback, mode: .default, options: [])
        try session.setActive(true)
    }

    private func loadTrack(_ newIndex: Int, autoplay: Bool) throws {
        guard tracks.indices.contains(newIndex), let access = access else { throw LibraryAccessError.invalidFile }
        let track = tracks[newIndex]
        let url = try access.fileURL(for: track.path)
        itemObserver = nil
        player.pause()
        let item = AVPlayerItem(url: url)
        index = newIndex
        ended = false
        playbackError = nil
        wantsPlayback = autoplay
        player.replaceCurrentItem(with: item)
        itemObserver = item.observe(\.status, options: [.initial, .new]) { [weak self] item, _ in
            DispatchQueue.main.async {
                guard let self = self, self.player.currentItem === item else { return }
                if item.status == .failed { self.fail(item.error ?? LibraryAccessError.invalidFile) }
                else { self.emitState() }
            }
        }
        updateNowPlayingTrack(track)
        if autoplay { try activateSession(); player.play() }
        emitState()
    }

    private func resumePlayback() throws {
        guard currentTrack != nil, let item = player.currentItem else { throw LibraryAccessError.invalidFile }
        if item.status == .failed { try loadTrack(index, autoplay: true); return }
        try activateSession()
        playbackError = nil
        wantsPlayback = true
        if ended { player.seek(to: .zero); ended = false }
        player.play()
    }

    private func pausePlayback() {
        wantsPlayback = false
        resumeAfterInterruption = false
        player.pause()
    }

    private func seekTo(_ value: Double) {
        guard currentTrack != nil, value.isFinite else { return }
        let time = min(max(0, value), duration > 0 ? duration : max(0, value))
        ended = false
        player.seek(to: CMTime(seconds: time, preferredTimescale: 600)) { [weak self] _ in
            DispatchQueue.main.async { self?.emitState() }
        }
    }

    private func advance(_ direction: Int, fromEnd: Bool = false) throws {
        guard currentTrack != nil else { return }
        if fromEnd && repeatMode == "one" { try loadTrack(index, autoplay: true); return }
        if direction < 0 && seconds > 3 { seekTo(0); return }
        var nextIndex = index + direction
        if shuffle && tracks.count > 1 {
            nextIndex = (index + Int.random(in: 1..<tracks.count)) % tracks.count
        } else if nextIndex >= tracks.count {
            if repeatMode == "all" { nextIndex = 0 }
            else { wantsPlayback = false; ended = fromEnd; player.pause(); emitState(); return }
        } else if nextIndex < 0 { nextIndex = tracks.count - 1 }
        try loadTrack(nextIndex, autoplay: true)
    }

    private func installNotifications() {
        let center = NotificationCenter.default
        notifications.append(center.addObserver(forName: .AVPlayerItemDidPlayToEndTime, object: nil, queue: .main) { [weak self] note in
            guard let self = self, let item = note.object as? AVPlayerItem, item === self.player.currentItem else { return }
            do { try self.advance(1, fromEnd: true) } catch { self.fail(error) }
        })
        notifications.append(center.addObserver(forName: .AVPlayerItemFailedToPlayToEndTime, object: nil, queue: .main) { [weak self] note in
            guard let self = self, let item = note.object as? AVPlayerItem, item === self.player.currentItem else { return }
            self.fail(item.error ?? LibraryAccessError.invalidFile)
        })
        notifications.append(center.addObserver(forName: AVAudioSession.interruptionNotification, object: nil, queue: .main) { [weak self] note in
            guard let self = self, let raw = note.userInfo?[AVAudioSessionInterruptionTypeKey] as? UInt,
                  let type = AVAudioSession.InterruptionType(rawValue: raw) else { return }
            if type == .began {
                self.resumeAfterInterruption = self.wantsPlayback
                self.wantsPlayback = false
                self.player.pause()
                self.emitState()
            } else {
                let options = AVAudioSession.InterruptionOptions(rawValue: note.userInfo?[AVAudioSessionInterruptionOptionKey] as? UInt ?? 0)
                let shouldResume = self.resumeAfterInterruption && options.contains(.shouldResume)
                self.resumeAfterInterruption = false
                if shouldResume {
                    do { try self.resumePlayback() } catch { self.fail(error) }
                }
                self.emitState()
            }
        })
        notifications.append(center.addObserver(forName: AVAudioSession.routeChangeNotification, object: nil, queue: .main) { [weak self] note in
            if let raw = note.userInfo?[AVAudioSessionRouteChangeReasonKey] as? UInt,
               AVAudioSession.RouteChangeReason(rawValue: raw) == .oldDeviceUnavailable {
                self?.pausePlayback()
                self?.emitState()
            }
        })
    }

    private func remote(_ command: MPRemoteCommand, _ action: @escaping (MPRemoteCommandEvent) throws -> Void) {
        command.isEnabled = true
        let target = command.addTarget { [weak self] event in
            let execute: () -> MPRemoteCommandHandlerStatus = {
                guard let self = self, self.currentTrack != nil else { return .noSuchContent }
                do { try action(event); self.emitState(); return .success }
                catch { self.fail(error); return .commandFailed }
            }
            if Thread.isMainThread { return execute() }
            return DispatchQueue.main.sync(execute: execute)
        }
        remoteTargets.append((command, target))
    }

    private func installRemoteCommands() {
        let center = MPRemoteCommandCenter.shared()
        remote(center.playCommand) { [weak self] _ in try self?.resumePlayback() }
        remote(center.pauseCommand) { [weak self] _ in self?.pausePlayback() }
        remote(center.togglePlayPauseCommand) { [weak self] _ in
            guard let self = self else { return }
            if self.wantsPlayback { self.pausePlayback() } else { try self.resumePlayback() }
        }
        remote(center.nextTrackCommand) { [weak self] _ in try self?.advance(1) }
        remote(center.previousTrackCommand) { [weak self] _ in try self?.advance(-1) }
        remote(center.changePlaybackPositionCommand) { [weak self] event in
            if let event = event as? MPChangePlaybackPositionCommandEvent { self?.seekTo(event.positionTime) }
        }
    }

    private func updateNowPlayingTrack(_ track: Track) {
        var info: [String: Any] = [MPMediaItemPropertyTitle: track.title,
                                   MPMediaItemPropertyArtist: track.artist,
                                   MPMediaItemPropertyAlbumTitle: track.album]
        if let cover = track.coverArt, cover.count < 128 * 1024,
           let comma = cover.firstIndex(of: ","),
           let data = Data(base64Encoded: String(cover[cover.index(after: comma)...])),
           let image = UIImage(data: data) {
            info[MPMediaItemPropertyArtwork] = MPMediaItemArtwork(boundsSize: image.size) { _ in image }
        }
        MPNowPlayingInfoCenter.default().nowPlayingInfo = info
        updateNowPlayingPosition()
    }

    private func updateNowPlayingPosition() {
        guard currentTrack != nil else { return }
        var info = MPNowPlayingInfoCenter.default().nowPlayingInfo ?? [:]
        info[MPNowPlayingInfoPropertyElapsedPlaybackTime] = seconds
        info[MPMediaItemPropertyPlaybackDuration] = duration
        info[MPNowPlayingInfoPropertyPlaybackRate] = player.rate
        MPNowPlayingInfoCenter.default().nowPlayingInfo = info
    }

    deinit {
        if let observer = timeObserver { player.removeTimeObserver(observer) }
        for observer in notifications { NotificationCenter.default.removeObserver(observer) }
        for (command, target) in remoteTargets { command.removeTarget(target) }
    }
}
