import Foundation
import Capacitor
import AVFoundation
import MediaPlayer

@objc(NativeAudioPlugin)
public class NativeAudioPlugin: CAPPlugin {
    private var player: AVPlayer?
    private var playerItem: AVPlayerItem?
    private var timeObserver: Any?
    private var queue: [String] = []
    private var currentIndex: Int = -1
    private let bookmarkKey = "vibeplayer_folder_bookmark"
    private var accessedURL: URL?
    
    override public func load() {
        setupAudioSession()
        setupRemoteCommands()
        setupNotifications()
    }
    
    private func setupAudioSession() {
        do {
            let session = AVAudioSession.sharedInstance()
            try session.setCategory(.playback, mode: .default, options: [])
            try session.setActive(true)
        } catch {
            print("[VibePlayer] Audio session error: \(error)")
        }
    }
    
    private func setupRemoteCommands() {
        let center = MPRemoteCommandCenter.shared()
        
        center.playCommand.isEnabled = true
        center.playCommand.addTarget { [weak self] _ in
            self?.player?.play()
            self?.notifyJS("stateChange", data: ["isPlaying": true])
            return .success
        }
        
        center.pauseCommand.isEnabled = true
        center.pauseCommand.addTarget { [weak self] _ in
            self?.player?.pause()
            self?.notifyJS("stateChange", data: ["isPlaying": false])
            return .success
        }
        
        center.togglePlayPauseCommand.isEnabled = true
        center.togglePlayPauseCommand.addTarget { [weak self] _ in
            guard let self = self, let player = self.player else { return .commandFailed }
            if player.rate > 0 {
                player.pause()
                self.notifyJS("stateChange", data: ["isPlaying": false])
            } else {
                player.play()
                self.notifyJS("stateChange", data: ["isPlaying": true])
            }
            return .success
        }
        
        center.nextTrackCommand.isEnabled = true
        center.nextTrackCommand.addTarget { [weak self] _ in
            self?.notifyJS("remoteCommand", data: ["command": "next"])
            return .success
        }
        
        center.previousTrackCommand.isEnabled = true
        center.previousTrackCommand.addTarget { [weak self] _ in
            self?.notifyJS("remoteCommand", data: ["command": "prev"])
            return .success
        }
        
        center.changePlaybackPositionCommand.isEnabled = true
        center.changePlaybackPositionCommand.addTarget { [weak self] event in
            guard let posEvent = event as? MPChangePlaybackPositionCommandEvent else { return .commandFailed }
            self?.player?.seek(to: CMTime(seconds: posEvent.positionTime, preferredTimescale: 1000))
            self?.notifyJS("stateChange", data: ["currentTime": posEvent.positionTime])
            return .success
        }
    }
    
    private func setupNotifications() {
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(handleInterruption),
            name: AVAudioSession.interruptionNotification,
            object: nil
        )
        
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(handleRouteChange),
            name: AVAudioSession.routeChangeNotification,
            object: nil
        )
    }
    
    @objc private func handleInterruption(_ notification: Notification) {
        guard let info = notification.userInfo,
              let typeValue = info[AVAudioSessionInterruptionTypeKey] as? UInt,
              let type = AVAudioSession.InterruptionType(rawValue: typeValue) else { return }
        
        switch type {
        case .began:
            notifyJS("stateChange", data: ["isPlaying": false])
        case .ended:
            if let optionsValue = info[AVAudioSessionInterruptionOptionKey] as? UInt {
                let options = AVAudioSession.InterruptionOptions(rawValue: optionsValue)
                if options.contains(.shouldResume) {
                    player?.play()
                    notifyJS("stateChange", data: ["isPlaying": true])
                }
            }
        @unknown default:
            break
        }
    }
    
    @objc private func handleRouteChange(_ notification: Notification) {
        guard let info = notification.userInfo,
              let reasonValue = info[AVAudioSessionRouteChangeReasonKey] as? UInt,
              let reason = AVAudioSession.RouteChangeReason(rawValue: reasonValue) else { return }
        
        if reason == .oldDeviceUnavailable {
            // Headphones unplugged - pause
            player?.pause()
            notifyJS("stateChange", data: ["isPlaying": false])
        }
    }
    
    // MARK: - Plugin Methods
    
    @objc func play(_ call: CAPPluginCall) {
        guard let path = call.getString("path") else {
            call.reject("Missing path")
            return
        }
        
        ensureAccess()
        
        let fileURL = URL(fileURLWithPath: path)
        playerItem = AVPlayerItem(url: fileURL)
        
        if player == nil {
            player = AVPlayer(playerItem: playerItem)
        } else {
            player?.replaceCurrentItem(with: playerItem)
        }
        
        // Observe when item finishes
        NotificationCenter.default.removeObserver(self, name: .AVPlayerItemDidPlayToEndTime, object: nil)
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(itemDidFinishPlaying),
            name: .AVPlayerItemDidPlayToEndTime,
            object: playerItem
        )
        
        // Time observer
        if let obs = timeObserver {
            player?.removeTimeObserver(obs)
        }
        timeObserver = player?.addPeriodicTimeObserver(
            forInterval: CMTime(seconds: 0.5, preferredTimescale: 1000),
            queue: .main
        ) { [weak self] time in
            let current = CMTimeGetSeconds(time)
            let dur = CMTimeGetSeconds(self?.playerItem?.duration ?? .zero)
            if current.isFinite && dur.isFinite {
                self?.notifyJS("timeUpdate", data: [
                    "currentTime": current,
                    "duration": dur
                ])
            }
        }
        
        player?.play()
        
        // Get duration async
        let title = call.getString("title") ?? fileURL.deletingPathExtension().lastPathComponent
        let artist = call.getString("artist") ?? ""
        
        playerItem?.asset.loadValuesAsynchronously(forKeys: ["duration"]) { [weak self] in
            DispatchQueue.main.async {
                let dur = CMTimeGetSeconds(self?.playerItem?.duration ?? .zero)
                self?.updateNowPlayingInfo(title: title, artist: artist, duration: dur)
                call.resolve(["playing": true, "duration": dur.isFinite ? dur : 0])
            }
        }
    }
    
    @objc func pause(_ call: CAPPluginCall) {
        player?.pause()
        updateNowPlayingState(playing: false)
        call.resolve(["playing": false])
    }
    
    @objc func resume(_ call: CAPPluginCall) {
        player?.play()
        updateNowPlayingState(playing: true)
        call.resolve(["playing": true])
    }
    
    @objc func seek(_ call: CAPPluginCall) {
        let time = call.getDouble("time") ?? 0
        player?.seek(to: CMTime(seconds: time, preferredTimescale: 1000)) { [weak self] _ in
            self?.updateNowPlayingElapsed(time: time)
            call.resolve()
        }
    }
    
    @objc func stop(_ call: CAPPluginCall) {
        player?.pause()
        player?.replaceCurrentItem(with: nil)
        if let obs = timeObserver {
            player?.removeTimeObserver(obs)
            timeObserver = nil
        }
        MPNowPlayingInfoCenter.default().nowPlayingInfo = nil
        call.resolve()
    }
    
    @objc func getState(_ call: CAPPluginCall) {
        let isPlaying = player?.rate ?? 0 > 0
        let current = CMTimeGetSeconds(player?.currentTime() ?? .zero)
        let dur = CMTimeGetSeconds(playerItem?.duration ?? .zero)
        call.resolve([
            "isPlaying": isPlaying,
            "currentTime": current.isFinite ? current : 0,
            "duration": dur.isFinite ? dur : 0
        ])
    }
    
    // MARK: - Helpers
    
    @objc private func itemDidFinishPlaying(_ notification: Notification) {
        notifyJS("trackEnded", data: [:])
    }
    
    private func notifyJS(_ eventName: String, data: [String: Any]) {
        notifyListeners(eventName, data: data)
    }
    
    private func updateNowPlayingInfo(title: String, artist: String, duration: Double) {
        var info = [String: Any]()
        info[MPMediaItemPropertyTitle] = title
        info[MPMediaItemPropertyArtist] = artist
        info[MPMediaItemPropertyPlaybackDuration] = duration
        info[MPNowPlayingInfoPropertyElapsedPlaybackTime] = CMTimeGetSeconds(player?.currentTime() ?? .zero)
        info[MPNowPlayingInfoPropertyPlaybackRate] = player?.rate ?? 0
        MPNowPlayingInfoCenter.default().nowPlayingInfo = info
    }
    
    private func updateNowPlayingState(playing: Bool) {
        var info = MPNowPlayingInfoCenter.default().nowPlayingInfo ?? [:]
        info[MPNowPlayingInfoPropertyElapsedPlaybackTime] = CMTimeGetSeconds(player?.currentTime() ?? .zero)
        info[MPNowPlayingInfoPropertyPlaybackRate] = playing ? 1.0 : 0.0
        MPNowPlayingInfoCenter.default().nowPlayingInfo = info
    }
    
    private func updateNowPlayingElapsed(time: Double) {
        var info = MPNowPlayingInfoCenter.default().nowPlayingInfo ?? [:]
        info[MPNowPlayingInfoPropertyElapsedPlaybackTime] = time
        MPNowPlayingInfoCenter.default().nowPlayingInfo = info
    }
    
    private func ensureAccess() {
        if accessedURL != nil { return }
        guard let bookmarkData = UserDefaults.standard.data(forKey: bookmarkKey) else { return }
        do {
            var isStale = false
            let url = try URL(resolvingBookmarkData: bookmarkData,
                            options: .withoutUI,
                            relativeTo: nil,
                            bookmarkDataIsStale: &isStale)
            if url.startAccessingSecurityScopedResource() {
                accessedURL = url
            }
        } catch {
            print("[VibePlayer] Bookmark error: \(error)")
        }
    }
    
    deinit {
        if let obs = timeObserver {
            player?.removeTimeObserver(obs)
        }
        accessedURL?.stopAccessingSecurityScopedResource()
        NotificationCenter.default.removeObserver(self)
    }
}
