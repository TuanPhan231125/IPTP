import Foundation

enum LibraryAccessError: LocalizedError {
    case noFolder, permissionDenied, invalidFolder, invalidFile

    var errorDescription: String? {
        switch self {
        case .noFolder: return "Bạn chưa chọn thư mục nhạc."
        case .permissionDenied: return "Không còn quyền đọc thư mục. Vui lòng chọn lại trong Tệp."
        case .invalidFolder: return "Thư mục không còn tồn tại hoặc chưa có trên iPhone."
        case .invalidFile: return "Bài hát không nằm trong thư mục đã chọn hoặc không còn trên iPhone."
        }
    }
}

/// Scanning and playback each own a lease. Changing folders does not revoke the
/// current player's access. Every successful start is paired with a stop.
final class FolderAccessLease {
    let url: URL

    init(url: URL) throws {
        guard url.startAccessingSecurityScopedResource() else {
            throw LibraryAccessError.permissionDenied
        }
        self.url = url
    }

    deinit { url.stopAccessingSecurityScopedResource() }

    func fileURL(for path: String) throws -> URL {
        let root = url.standardizedFileURL.resolvingSymlinksInPath().path
        let file = URL(fileURLWithPath: path).standardizedFileURL.resolvingSymlinksInPath()
        guard path.hasPrefix("/"), file.path.hasPrefix(root + "/"),
              FileManager.default.isReadableFile(atPath: file.path) else {
            throw LibraryAccessError.invalidFile
        }
        return file
    }
}

final class FolderAccessStore {
    static let shared = FolderAccessStore()
    private let bookmarkKey = "vibeplayer_folder_bookmark"
    private let lock = NSLock()

    func save(_ url: URL) throws {
        let access = try FolderAccessLease(url: url)
        guard try access.url.resourceValues(forKeys: [.isDirectoryKey]).isDirectory == true else {
            throw LibraryAccessError.invalidFolder
        }
        // Apple documents minimalBookmark for iOS directory access.
        let data = try access.url.bookmarkData(options: .minimalBookmark,
                                               includingResourceValuesForKeys: nil,
                                               relativeTo: nil)
        lock.lock()
        defer { lock.unlock() }
        UserDefaults.standard.set(data, forKey: bookmarkKey)
    }

    func acquire() throws -> FolderAccessLease {
        lock.lock()
        let data = UserDefaults.standard.data(forKey: bookmarkKey)
        lock.unlock()
        guard let bookmark = data else { throw LibraryAccessError.noFolder }
        var stale = false
        let url = try URL(resolvingBookmarkData: bookmark, options: [], relativeTo: nil,
                          bookmarkDataIsStale: &stale)
        let access = try FolderAccessLease(url: url)
        guard try access.url.resourceValues(forKeys: [.isDirectoryKey]).isDirectory == true else {
            throw LibraryAccessError.invalidFolder
        }
        if stale {
            let refreshed = try access.url.bookmarkData(options: .minimalBookmark,
                                                       includingResourceValuesForKeys: nil,
                                                       relativeTo: nil)
            lock.lock()
            if UserDefaults.standard.data(forKey: bookmarkKey) == bookmark {
                UserDefaults.standard.set(refreshed, forKey: bookmarkKey)
            }
            lock.unlock()
        }
        return access
    }

    func clear() {
        lock.lock()
        defer { lock.unlock() }
        UserDefaults.standard.removeObject(forKey: bookmarkKey)
    }
}
