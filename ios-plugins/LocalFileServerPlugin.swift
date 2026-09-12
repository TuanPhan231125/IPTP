import Foundation
import Capacitor
import GCDWebServer

@objc(LocalFileServerPlugin)
public class LocalFileServerPlugin: CAPPlugin {
    private var webServer: GCDWebServer?
    private let port: UInt = 8765
    private let bookmarkKey = "vibeplayer_folder_bookmark"
    
    // Track security-scoped access
    private var accessedURL: URL?
    
    override public func load() {
        startServer()
    }
    
    @objc func getServerUrl(_ call: CAPPluginCall) {
        if let server = webServer, server.isRunning {
            call.resolve(["url": "http://localhost:\(port)"])
        } else {
            startServer()
            call.resolve(["url": "http://localhost:\(port)"])
        }
    }
    
    @objc func startFileServer(_ call: CAPPluginCall) {
        startServer()
        call.resolve(["url": "http://localhost:\(port)", "running": webServer?.isRunning ?? false])
    }
    
    private func startServer() {
        guard webServer == nil || !(webServer?.isRunning ?? false) else { return }
        
        let server = GCDWebServer()
        
        // Handle file requests: /file?path=<encoded_path>
        server.addHandler(forMethod: "GET", pathRegex: "/file", request: GCDWebServerRequest.self) { [weak self] request in
            guard let path = request.query?["path"],
                  !path.isEmpty else {
                return GCDWebServerDataResponse(statusCode: 400)
            }
            
            // Ensure we have security-scoped access
            self?.ensureAccess()
            
            let fileURL = URL(fileURLWithPath: path)
            let fileManager = FileManager.default
            
            guard fileManager.fileExists(atPath: path) else {
                return GCDWebServerDataResponse(statusCode: 404)
            }
            
            // Determine content type
            let ext = fileURL.pathExtension.lowercased()
            let contentType: String
            switch ext {
            case "mp3": contentType = "audio/mpeg"
            case "m4a": contentType = "audio/mp4"
            case "wav": contentType = "audio/wav"
            case "aac": contentType = "audio/aac"
            case "mp4": contentType = "video/mp4"
            case "mov": contentType = "video/quicktime"
            case "m4v": contentType = "video/mp4"
            default: contentType = "application/octet-stream"
            }
            
            // Use GCDWebServerFileResponse for efficient streaming (supports Range requests)
            let response = GCDWebServerFileResponse(file: path, byteRange: request.hasByteRange ? request.byteRange : nil)
            response?.contentType = contentType
            response?.setValue("*", forAdditionalHeader: "Access-Control-Allow-Origin")
            return response ?? GCDWebServerDataResponse(statusCode: 500)
        }
        
        // CORS preflight
        server.addHandler(forMethod: "OPTIONS", pathRegex: "/.*", request: GCDWebServerRequest.self) { _ in
            let response = GCDWebServerResponse(statusCode: 200)
            response.setValue("*", forAdditionalHeader: "Access-Control-Allow-Origin")
            response.setValue("GET, OPTIONS", forAdditionalHeader: "Access-Control-Allow-Methods")
            response.setValue("Range", forAdditionalHeader: "Access-Control-Allow-Headers")
            return response
        }
        
        do {
            try server.start(options: [
                GCDWebServerOption_Port: port,
                GCDWebServerOption_BindToLocalhost: true,
                GCDWebServerOption_AutomaticallySuspendInBackground: false
            ])
            self.webServer = server
            print("[VibePlayer] Local file server started on port \(port)")
        } catch {
            print("[VibePlayer] Failed to start server: \(error)")
        }
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
            print("[VibePlayer] Failed to resolve bookmark for server: \(error)")
        }
    }
    
    deinit {
        accessedURL?.stopAccessingSecurityScopedResource()
        webServer?.stop()
    }
}
