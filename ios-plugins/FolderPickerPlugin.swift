import Foundation
import Capacitor
import UniformTypeIdentifiers
import MobileCoreServices

@objc(FolderPickerPlugin)
public class FolderPickerPlugin: CAPPlugin, UIDocumentPickerDelegate {
    private var savedCall: CAPPluginCall?
    
    // Key for storing bookmark in UserDefaults
    private let bookmarkKey = "vibeplayer_folder_bookmark"
    
    /// Check if a folder bookmark exists and is still valid
    @objc func checkBookmark(_ call: CAPPluginCall) {
        guard let bookmarkData = UserDefaults.standard.data(forKey: bookmarkKey) else {
            call.resolve(["hasBookmark": false])
            return
        }
        
        do {
            var isStale = false
            let url = try URL(resolvingBookmarkData: bookmarkData, 
                            options: .withoutUI, 
                            relativeTo: nil, 
                            bookmarkDataIsStale: &isStale)
            
            if isStale {
                // Try to refresh bookmark
                if url.startAccessingSecurityScopedResource() {
                    let newBookmark = try url.bookmarkData(options: .minimalBookmark, 
                                                          includingResourceValuesForKeys: nil, 
                                                          relativeTo: nil)
                    UserDefaults.standard.set(newBookmark, forKey: bookmarkKey)
                    url.stopAccessingSecurityScopedResource()
                }
            }
            
            call.resolve(["hasBookmark": true, "path": url.path])
        } catch {
            UserDefaults.standard.removeObject(forKey: bookmarkKey)
            call.resolve(["hasBookmark": false, "error": error.localizedDescription])
        }
    }
    
    /// Open folder picker UI
    @objc func pickFolder(_ call: CAPPluginCall) {
        savedCall = call
        
        DispatchQueue.main.async {
            let picker: UIDocumentPickerViewController
            if #available(iOS 14.0, *) {
                picker = UIDocumentPickerViewController(forOpeningContentTypes: [.folder])
            } else {
                picker = UIDocumentPickerViewController(documentTypes: ["public.folder"], in: .open)
            }
            picker.delegate = self
            picker.allowsMultipleSelection = false
            self.bridge?.viewController?.present(picker, animated: true)
        }
    }
    
    /// Scan the bookmarked folder for media files
    @objc func scanFolder(_ call: CAPPluginCall) {
        guard let bookmarkData = UserDefaults.standard.data(forKey: bookmarkKey) else {
            call.reject("No folder bookmark found")
            return
        }
        
        do {
            var isStale = false
            let url = try URL(resolvingBookmarkData: bookmarkData,
                            options: .withoutUI,
                            relativeTo: nil,
                            bookmarkDataIsStale: &isStale)
            
            guard url.startAccessingSecurityScopedResource() else {
                call.reject("Cannot access folder - permission denied")
                return
            }
            
            defer { url.stopAccessingSecurityScopedResource() }
            
            let mediaExtensions = Set(["mp3", "m4a", "wav", "aac", "mp4", "mov", "m4v"])
            var files: [[String: Any]] = []
            
            let fileManager = FileManager.default
            if let enumerator = fileManager.enumerator(at: url, 
                                                       includingPropertiesForKeys: [.fileSizeKey, .nameKey],
                                                       options: [.skipsHiddenFiles]) {
                for case let fileURL as URL in enumerator {
                    let ext = fileURL.pathExtension.lowercased()
                    if mediaExtensions.contains(ext) {
                        let attributes = try? fileManager.attributesOfItem(atPath: fileURL.path)
                        let fileSize = (attributes?[.size] as? Int) ?? 0
                        let audioExts = Set(["mp3", "m4a", "wav", "aac"])
                        
                        files.append([
                            "name": fileURL.lastPathComponent,
                            "path": fileURL.path,
                            "extension": ext,
                            "size": fileSize,
                            "type": audioExts.contains(ext) ? "audio" : "video"
                        ])
                    }
                }
            }
            
            call.resolve(["files": files, "folderPath": url.path])
        } catch {
            call.reject("Error scanning folder: \(error.localizedDescription)")
        }
    }
    
    /// Clear the saved bookmark
    @objc func clearBookmark(_ call: CAPPluginCall) {
        UserDefaults.standard.removeObject(forKey: bookmarkKey)
        call.resolve()
    }
    
    // MARK: - UIDocumentPickerDelegate
    
    public func documentPicker(_ controller: UIDocumentPickerViewController, didPickDocumentsAt urls: [URL]) {
        guard let url = urls.first, let call = savedCall else {
            savedCall?.reject("No folder selected")
            savedCall = nil
            return
        }
        
        // Start accessing security-scoped resource
        guard url.startAccessingSecurityScopedResource() else {
            call.reject("Cannot access selected folder")
            savedCall = nil
            return
        }
        
        do {
            // Create bookmark
            let bookmarkData = try url.bookmarkData(options: .minimalBookmark,
                                                    includingResourceValuesForKeys: nil,
                                                    relativeTo: nil)
            UserDefaults.standard.set(bookmarkData, forKey: bookmarkKey)
            url.stopAccessingSecurityScopedResource()
            
            call.resolve(["path": url.path, "success": true])
        } catch {
            url.stopAccessingSecurityScopedResource()
            call.reject("Error creating bookmark: \(error.localizedDescription)")
        }
        
        savedCall = nil
    }
    
    public func documentPickerWasCancelled(_ controller: UIDocumentPickerViewController) {
        savedCall?.reject("User cancelled folder selection")
        savedCall = nil
    }
}
