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
    private let audioExtensions: Set<String> = ["mp3", "m4a", "wav", "aac"]

    @objc func checkBookmark(_ call: CAPPluginCall) {
        scanQueue.async {
            do {
                let access = try FolderAccessStore.shared.acquire()
                call.resolve(["hasBookmark": true, "path": access.url.path])
            } catch LibraryAccessError.noFolder {
                call.resolve(["hasBookmark": false])
            } catch {
                call.resolve(["hasBookmark": false, "error": error.localizedDescription])
            }
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
        FolderAccessStore.shared.clear()
        call.resolve()
    }

    @objc func scanFolder(_ call: CAPPluginCall) {
        scanQueue.async {
            do {
                let access = try FolderAccessStore.shared.acquire()
                var paths: [URL] = []
                var enumerationError: Error?
                var coordinationError: NSError?
                NSFileCoordinator().coordinate(readingItemAt: access.url, options: [],
                                                error: &coordinationError) { folder in
                    let keys: [URLResourceKey] = [.isRegularFileKey, .fileSizeKey]
                    guard let enumerator = FileManager.default.enumerator(
                        at: folder, includingPropertiesForKeys: keys,
                        options: [.skipsHiddenFiles, .skipsPackageDescendants],
                        errorHandler: { _, error in enumerationError = error; return true }
                    ) else {
                        enumerationError = LibraryAccessError.invalidFolder
                        return
                    }
                    for case let file as URL in enumerator {
                        guard self.audioExtensions.contains(file.pathExtension.lowercased()),
                              (try? file.resourceValues(forKeys: [.isRegularFileKey]).isRegularFile) == true
                        else { continue }
                        paths.append(file)
                    }
                }
                if let error = coordinationError { throw error }
                if paths.isEmpty, let error = enumerationError { throw error }
                paths.sort { $0.path.localizedStandardCompare($1.path) == .orderedAscending }
                var files: [[String: Any]] = []
                // Bound bridge memory. Only small cover thumbnails are encoded;
                // the original music files always stay in the selected folder.
                var artworkBudget = 6 * 1024 * 1024
                for url in paths {
                    autoreleasepool {
                        files.append(self.describe(url, artworkBudget: &artworkBudget))
                    }
                }
                var result: [String: Any] = ["files": files, "folderPath": access.url.path]
                if let error = enumerationError { result["warning"] = error.localizedDescription }
                call.resolve(result)
            } catch { call.reject(error.localizedDescription, "FOLDER_ACCESS") }
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
