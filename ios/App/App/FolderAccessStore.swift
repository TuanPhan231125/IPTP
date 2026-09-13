import Foundation

enum LibraryAccessError: LocalizedError {
    case noFolder, permissionDenied, invalidFolder, invalidFile
    var errorDescription: String? {
        switch self {
        case .noFolder: return "Bạn chưa chọn thư mục nhạc."
        case .permissionDenied: return "Không còn quyền đọc thư mục. Vui lòng chọn lại trong Tệp."
        case .invalidFolder: return "Thư mục không còn tồn tại hoặc chưa có trên iPhone."
        case .invalidFile: return "Không đọc được tệp hoặc tệp nằm ngoài thư mục đã chọn."
        }
    }
}
final class FolderAccessLease {
    let url: URL
    init(url: URL) throws {
        guard url.startAccessingSecurityScopedResource() else { throw LibraryAccessError.permissionDenied }
        self.url = url
    }
    deinit { url.stopAccessingSecurityScopedResource() }
    func fileURL(for path: String) throws -> URL {
        let root = url.standardizedFileURL.resolvingSymlinksInPath().path
        let file = URL(fileURLWithPath: path).standardizedFileURL.resolvingSymlinksInPath()
        guard path.hasPrefix("/"), file.path.hasPrefix(root + "/"),
              FileManager.default.isReadableFile(atPath: file.path) else { throw LibraryAccessError.invalidFile }
        return file
    }
}
struct LibraryFolder: Codable {
    var id: String
    var name: String
    var path: String
    var bookmark: Data
    var active: Bool
}
final class FolderAccessStore {
    static let shared = FolderAccessStore()
    private let key = "tpugsound.folders.v2"
    private let lock = NSRecursiveLock()
    private func records() -> [LibraryFolder] {
        if let data = UserDefaults.standard.data(forKey: key),
           let items = try? JSONDecoder().decode([LibraryFolder].self, from: data) { return items }
        if let data = UserDefaults.standard.data(forKey: "vibeplayer_folder_bookmark") {
            var stale = false
            if let url = try? URL(resolvingBookmarkData: data, options: [], relativeTo: nil, bookmarkDataIsStale: &stale) {
                let items = [LibraryFolder(id: "legacy", name: url.lastPathComponent, path: url.path, bookmark: data, active: true)]
                persist(items)
                return items
            }
        }
        return []
    }
    private func persist(_ items: [LibraryFolder]) {
        if let data = try? JSONEncoder().encode(items) { UserDefaults.standard.set(data, forKey: key) }
    }
    func list() -> [LibraryFolder] {
        lock.lock(); defer { lock.unlock() }
        return records().filter { $0.active }
    }
    @discardableResult func save(_ url: URL) throws -> String {
        let access = try FolderAccessLease(url: url)
        guard try access.url.resourceValues(forKeys: [.isDirectoryKey]).isDirectory == true else { throw LibraryAccessError.invalidFolder }
        let data = try url.bookmarkData(options: .minimalBookmark, includingResourceValuesForKeys: nil, relativeTo: nil)
        lock.lock(); defer { lock.unlock() }
        var items = records()
        let i = items.firstIndex { $0.path == url.path }
        let id = i.map { items[$0].id } ?? UUID().uuidString
        let item = LibraryFolder(id: id, name: url.lastPathComponent, path: url.path, bookmark: data, active: true)
        if let i = i { items[i] = item } else { items.append(item) }
        persist(items)
        return id
    }
    func acquire(id: String? = nil) throws -> FolderAccessLease {
        lock.lock(); defer { lock.unlock() }
        var items = records()
        guard let i = items.firstIndex(where: { $0.active && (id == nil || $0.id == id) }) else { throw LibraryAccessError.noFolder }
        var stale = false
        let url = try URL(resolvingBookmarkData: items[i].bookmark, options: [], relativeTo: nil, bookmarkDataIsStale: &stale)
        let access = try FolderAccessLease(url: url)
        guard try url.resourceValues(forKeys: [.isDirectoryKey]).isDirectory == true else { throw LibraryAccessError.invalidFolder }
        if stale {
            items[i].bookmark = try url.bookmarkData(options: .minimalBookmark, includingResourceValuesForKeys: nil, relativeTo: nil)
            items[i].path = url.path
            persist(items)
        }
        return access
    }
    func acquire(for path: String, folderID: String?) throws -> FolderAccessLease {
        if let id = folderID, !id.isEmpty {
            let access = try acquire(id: id)
            _ = try access.fileURL(for: path)
            return access
        }
        for folder in list() {
            if let access = try? acquire(id: folder.id), (try? access.fileURL(for: path)) != nil { return access }
        }
        throw LibraryAccessError.invalidFile
    }
    func clear(id: String? = nil) {
        lock.lock(); defer { lock.unlock() }
        var items = records()
        for i in items.indices where id == nil || items[i].id == id { items[i].active = false }
        persist(items)
        UserDefaults.standard.removeObject(forKey: "vibeplayer_folder_bookmark")
    }
}

