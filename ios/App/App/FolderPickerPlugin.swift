import Foundation
import UIKit
import Capacitor
import AVFoundation
import ImageIO
import UniformTypeIdentifiers

@objc(FolderPickerPlugin)
public class FolderPickerPlugin: CAPPlugin, CAPBridgedPlugin, UIDocumentPickerDelegate {
    public let identifier = "FolderPickerPlugin"
    public let jsName = "FolderPicker"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "checkBookmark", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "pickFolder", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "scanFolder", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "clearBookmark", returnType: CAPPluginReturnPromise)
    ]
    private var pickerCall: CAPPluginCall?
    private let scanQueue = DispatchQueue(label: "com.vibeplayer.library", qos: .userInitiated)
    private let mediaExtensions: Set<String> = ["mp3", "m4a", "wav", "aac", "flac", "aiff", "aif", "caf", "alac", "mp4", "mov", "m4v", "3gp", "3g2", "ac3", "eac3", "ogg", "opus", "webm", "mkv", "avi", "wma"]

    @objc func checkBookmark(_ call: CAPPluginCall) {
        scanQueue.async {
            let folders = FolderAccessStore.shared.list()
            call.resolve(["hasBookmark": !folders.isEmpty])

        }
    }

    @objc func pickFolder(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            guard self.pickerCall == nil else {
                call.reject("Hộp chọn thư mục đang mở.")
                return
            }
            guard let controller = self.bridge?.viewController else {
                call.reject("Không thể mở hộp chọn thư mục.")
                return
            }
            self.pickerCall = call
            let picker: UIDocumentPickerViewController
            if #available(iOS 14.0, *) {
                picker = UIDocumentPickerViewController(forOpeningContentTypes: [.folder], asCopy: false)
            } else {
                picker = UIDocumentPickerViewController(documentTypes: ["public.folder"], in: .open)
            }
            picker.delegate = self
            picker.allowsMultipleSelection = false
            controller.present(picker, animated: true)
        }
    }

    public func documentPicker(_ controller: UIDocumentPickerViewController,
                               didPickDocumentsAt urls: [URL]) {
        guard let call = pickerCall else { return }
        pickerCall = nil
        guard let url = urls.first else {
            call.reject("Không có thư mục được chọn.")
            return
        }
        do {
            try FolderAccessStore.shared.save(url)
            call.resolve(["success": true, "path": url.path])
        } catch { call.reject(error.localizedDescription) }
    }

    public func documentPickerWasCancelled(_ controller: UIDocumentPickerViewController) {
        pickerCall?.reject("User cancelled folder selection", "CANCELLED")
        pickerCall = nil
    }

    @objc func clearBookmark(_ call: CAPPluginCall) {
        FolderAccessStore.shared.clear(id: call.getString("folderId"))
        call.resolve()
    }

    @objc func scanFolder(_ call: CAPPluginCall) {
        scanQueue.async {
            var files: [[String: Any]] = []
            var folders: [[String: Any]] = []
            var seen = Set<String>()
            var artworkBudget = 6 * 1024 * 1024
            for folder in FolderAccessStore.shared.list() {
                var info: [String: Any] = ["id": folder.id, "name": folder.name, "path": folder.path]
                do {
                    let access = try FolderAccessStore.shared.acquire(id: folder.id)
                    info["path"] = access.url.path
                    var paths: [URL] = []
                    var enumerationError: Error?
                    var coordinationError: NSError?
                    NSFileCoordinator().coordinate(readingItemAt: access.url, options: [], error: &coordinationError) { root in
                        if let enumerator = FileManager.default.enumerator(at: root,
                            includingPropertiesForKeys: [.isRegularFileKey, .isSymbolicLinkKey],
                            options: [.skipsHiddenFiles, .skipsPackageDescendants],
                            errorHandler: { _, error in enumerationError = error; return true }) {
                            for case let file as URL in enumerator {
                                let values = try? file.resourceValues(forKeys: [.isRegularFileKey, .isSymbolicLinkKey])
                                guard self.mediaExtensions.contains(file.pathExtension.lowercased()),
                                      values?.isRegularFile == true, values?.isSymbolicLink != true,
                                      (try? access.fileURL(for: file.path)) != nil else { continue }
                                paths.append(file)
                            }
                        } else { enumerationError = LibraryAccessError.invalidFolder }
                    }
                    if let error = coordinationError { throw error }
                    if let error = enumerationError { info["error"] = error.localizedDescription }
                    for url in paths.sorted(by: { $0.path < $1.path }) where seen.insert(url.path).inserted {
                        autoreleasepool {
                            var file = self.describe(url, artworkBudget: &artworkBudget)
                            let relative = String(url.path.dropFirst(access.url.path.count + 1))
                            file["id"] = folder.id + ":" + relative
                            file["folderId"] = folder.id
                            file["folderName"] = folder.name
                            file["relativePath"] = relative
                            files.append(file)
                        }
                    }
                } catch { info["error"] = error.localizedDescription }
                folders.append(info)
            }
            call.resolve(["files": files, "folders": folders])
        }
    }

    private func describe(_ url: URL, artworkBudget: inout Int) -> [String: Any] {
        var file: [String: Any] = [
            "id": url.path, "name": url.lastPathComponent, "path": url.path,
            "extension": url.pathExtension.lowercased(), "type": "audio",
            "title": url.deletingPathExtension().lastPathComponent,
            "artist": "Không rõ nghệ sĩ", "album": "Không rõ album",
            "size": (try? url.resourceValues(forKeys: [.fileSizeKey]).fileSize) ?? 0,
            "duration": 0, "coverArt": NSNull()
        ]
        var coordinationError: NSError?
        NSFileCoordinator().coordinate(readingItemAt: url, options: [], error: &coordinationError) { readableURL in
            let asset = AVURLAsset(url: readableURL)
            file["playable"] = asset.isPlayable
            file["type"] = asset.tracks(withMediaType: .video).isEmpty ? "audio" : "video"
            if !asset.isPlayable { file["playbackIssue"] = "iOS không giải mã được tệp này. Đổi sang AAC/ALAC/FLAC hoặc H.264/HEVC trong MP4." }
            let metadata = asset.commonMetadata
            for (key, field) in [(AVMetadataKey.commonKeyTitle, "title"),
                                 (AVMetadataKey.commonKeyArtist, "artist"),
                                 (AVMetadataKey.commonKeyAlbumName, "album")] {
                if let value = metadata.first(where: { $0.commonKey == key })?.stringValue,
                   !value.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
                    file[field] = value
                }
            }
            let duration = CMTimeGetSeconds(asset.duration)
            if duration.isFinite && duration > 0 { file["duration"] = duration }
            if artworkBudget > 0,
               let imageData = metadata.first(where: { $0.commonKey == .commonKeyArtwork })?.dataValue,
               let cover = Self.thumbnail(imageData), cover.utf8.count <= artworkBudget {
                file["coverArt"] = cover
                artworkBudget -= cover.utf8.count
            }
        }
        if let error = coordinationError { file["playable"] = false; file["playbackIssue"] = error.localizedDescription }
        return file
    }

    private static func thumbnail(_ data: Data) -> String? {
        guard let source = CGImageSourceCreateWithData(data as CFData, nil),
              let image = CGImageSourceCreateThumbnailAtIndex(source, 0, [
                kCGImageSourceCreateThumbnailFromImageAlways: true,
                kCGImageSourceCreateThumbnailWithTransform: true,
                kCGImageSourceThumbnailMaxPixelSize: 256,
                kCGImageSourceShouldCacheImmediately: true
              ] as CFDictionary),
              let jpeg = UIImage(cgImage: image).jpegData(compressionQuality: 0.6),
              jpeg.count <= 32 * 1024 else { return nil }
        return "data:image/jpeg;base64," + jpeg.base64EncodedString()
    }
}
