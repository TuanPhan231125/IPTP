import Capacitor
import UIKit
import WebKit
import Security
import AVFoundation
import MediaPlayer

class VibeBridgeViewController: CAPBridgeViewController {
    override func capacitorDidLoad() {
        bridge?.registerPluginInstance(FolderPickerPlugin())
        bridge?.registerPluginInstance(NativeAudioPlugin())
        bridge?.registerPluginInstance(CloudBridgePlugin())
    }
}

@objc(CloudBridgePlugin)
public class CloudBridgePlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "CloudBridgePlugin"
    public let jsName = "CloudBridge"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "saveConnection", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getConnection", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "clearConnection", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "openYouTube", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "pauseYouTube", returnType: CAPPluginReturnPromise)
    ]
    private var query: [String: Any] {
        [kSecClass as String: kSecClassGenericPassword,
         kSecAttrService as String: "tpugsound.cloud", kSecAttrAccount as String: "owner"]
    }
    @objc func saveConnection(_ call: CAPPluginCall) {
        guard let endpoint = call.getString("endpoint"), let url = URL(string: endpoint), url.scheme == "https",
              let token = call.getString("token"), !token.isEmpty else { call.reject("Invalid connection"); return }
        do {
            let data = try JSONSerialization.data(withJSONObject: ["endpoint": endpoint, "token": token])
            let status = SecItemUpdate(query as CFDictionary, [kSecValueData as String: data] as CFDictionary)
            if status == errSecItemNotFound {
                var entry = query
                entry[kSecValueData as String] = data
                entry[kSecAttrAccessible as String] = kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly
                guard SecItemAdd(entry as CFDictionary, nil) == errSecSuccess else { call.reject("Save failed"); return }
            } else if status != errSecSuccess { call.reject("Update failed"); return }
            call.resolve()
        } catch { call.reject("Save failed") }
    }
    @objc func getConnection(_ call: CAPPluginCall) {
        var request = query
        request[kSecReturnData as String] = true
        request[kSecMatchLimit as String] = kSecMatchLimitOne
        var result: CFTypeRef?
        if SecItemCopyMatching(request as CFDictionary, &result) == errSecSuccess,
           let data = result as? Data,
           let value = try? JSONSerialization.jsonObject(with: data) as? [String: String] {
            call.resolve(["endpoint": value["endpoint"] ?? "", "token": value["token"] ?? ""])
        } else { call.resolve(["endpoint": "", "token": ""]) }
    }
    @objc func clearConnection(_ call: CAPPluginCall) {
        SecItemDelete(query as CFDictionary)
        call.resolve()
    }
    @objc func openYouTube(_ call: CAPPluginCall) {
        let videoID = call.getString("videoId")
        let url = videoID.flatMap { URL(string: "https://m.youtube.com/watch?v=" + $0) } ?? URL(string: "https://m.youtube.com/")!
        DispatchQueue.main.async {
            guard let parent = self.bridge?.viewController else { call.reject("No parent"); return }
            if let controller = parent.children.first(where: { $0 is YouTubeViewController }) as? YouTubeViewController {
                controller.open(url)
                controller.maximize()
                call.resolve()
                return
            }
            let controller = YouTubeViewController(url: url)
            parent.addChild(controller)
            parent.view.addSubview(controller.view)
            controller.view.frame = parent.view.bounds
            controller.didMove(toParent: parent)
            call.resolve()
        }
    }
    @objc func pauseYouTube(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            if let parent = self.bridge?.viewController,
               let controller = parent.children.first(where: { $0 is YouTubeViewController }) as? YouTubeViewController {
                controller.pauseVideo()
            }
            call.resolve()
        }
    }
}

final class YouTubeViewController: UIViewController, WKNavigationDelegate, WKUIDelegate, WKScriptMessageHandler {
    private let url: URL
    private var webView: WKWebView!
    private var isMinimized = false
    private var panGesture: UIPanGestureRecognizer!
    
    init(url: URL) { self.url = url; super.init(nibName: nil, bundle: nil) }
    required init?(coder: NSCoder) { fatalError() }
    
    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = .black
        try? AVAudioSession.sharedInstance().setCategory(.playback, mode: .default, options: [])
        try? AVAudioSession.sharedInstance().setActive(true)
        
        // 7. Tracker Blocker
        let blockRules = """
        [{
            "trigger": { "url-filter": "google-analytics\\\\.com|doubleclick\\\\.net|googlesyndication\\\\.com|youtube\\\\.com\\\\/ptracking" },
            "action": { "type": "block" }
        }]
        """
        WKContentRuleListStore.default().compileContentRuleList(forIdentifier: "TrackerBlocker", encodedContentRuleList: blockRules) { list, error in
            if let list = list { self.webView.configuration.userContentController.add(list) }
        }
        
        let config = WKWebViewConfiguration()
        config.websiteDataStore = .default()
        config.allowsInlineMediaPlayback = true
        config.allowsPictureInPictureMediaPlayback = true
        config.preferences.javaScriptCanOpenWindowsAutomatically = true
        
        let userController = WKUserContentController()
        userController.add(self, name: "ytInfo")
        
        // 6. Force Dark Mode & Hide Shorts
        let cssSource = #"""
            const style = document.createElement('style');
            style.textContent = `
                .ytp-ad-module, ytm-promoted-video-renderer, .video-ads,
                ytm-reel-shelf-renderer, ytm-shorts-lockup-view-model,
                .ytp-ad-overlay-container, ytm-companion-ad-renderer { display: none !important; }
            `;
            document.head.appendChild(style);
        """#
        userController.addUserScript(WKUserScript(source: cssSource, injectionTime: .atDocumentEnd, forMainFrameOnly: false))
        
        let jsSource = """
            document.cookie = 'PREF=f6=400; domain=.youtube.com; path=/';
            setInterval(() => {
                const skipButton = document.querySelector('.ytp-ad-skip-button, .ytp-skip-ad-button');
                if (skipButton) skipButton.click();
                const adVideo = document.querySelector('.ad-showing video');
                if (adVideo && !isNaN(adVideo.duration)) adVideo.currentTime = adVideo.duration;
            }, 500);

            let currentVideoId = null;
            let segments = [];
            let timeUpdateListener = null;

            function fetchSponsorSegments(videoId) {
                fetch("https://sponsor.ajay.app/api/skipSegments?videoID=" + videoId + "&categories=["sponsor","intro","outro"]")
                    .then(res => res.json())
                    .then(data => { segments = data.map(item => item.segment); })
                    .catch(err => {});
            }

            setInterval(() => {
                const urlParams = new URLSearchParams(window.location.search);
                const v = urlParams.get('v');
                if (v && v !== currentVideoId) {
                    currentVideoId = v; segments = []; fetchSponsorSegments(v);
                    const videoElement = document.querySelector('video');
                    if (videoElement && !timeUpdateListener) {
                        timeUpdateListener = () => {
                            if (!segments.length) return;
                            const t = videoElement.currentTime;
                            for (let seg of segments) {
                                if (t >= seg[0] && t < seg[1]) { videoElement.currentTime = seg[1]; break; }
                            }
                        };
                        videoElement.addEventListener('timeupdate', timeUpdateListener);
                    }
                }
                
                // 5. Control Center Sync
                const title = document.querySelector('.slim-video-metadata-title')?.innerText || '';
                const artist = document.querySelector('.slim-owner-channel-name')?.innerText || '';
                const src = document.querySelector('.video-thumbnail-img')?.src || '';
                if (title && title !== window.lastYtTitle) {
                    window.lastYtTitle = title;
                    window.webkit.messageHandlers.ytInfo.postMessage({title: title, artist: artist, src: src});
                }
            }, 1000);
            
            Object.defineProperty(document, 'hidden', { get: () => false });
            Object.defineProperty(document, 'visibilityState', { get: () => 'visible' });
            document.addEventListener('visibilitychange', (e) => e.stopImmediatePropagation(), true);
            document.addEventListener('webkitvisibilitychange', (e) => e.stopImmediatePropagation(), true);
        """
        userController.addUserScript(WKUserScript(source: jsSource, injectionTime: .atDocumentStart, forMainFrameOnly: false))
        
        config.userContentController = userController
        webView = WKWebView(frame: .zero, configuration: config)
        webView.navigationDelegate = self
        webView.uiDelegate = self
        webView.allowsBackForwardNavigationGestures = true
        webView.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(webView)
        
        NSLayoutConstraint.activate([
            webView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            webView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            webView.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor),
            webView.bottomAnchor.constraint(equalTo: view.bottomAnchor)
        ])
        
        panGesture = UIPanGestureRecognizer(target: self, action: #selector(handlePan))
        view.addGestureRecognizer(panGesture)
        
        let tapGesture = UITapGestureRecognizer(target: self, action: #selector(handleTap))
        view.addGestureRecognizer(tapGesture)
        
        open(url)
    }
    
    func open(_ destination: URL) { webView?.load(URLRequest(url: destination)) }
    
    func pauseVideo() {
        webView?.evaluateJavaScript("document.querySelector('video')?.pause()")
    }
    
    func maximize() {
        guard isMinimized else { return }
        isMinimized = false
        UIView.animate(withDuration: 0.3) {
            self.view.frame = self.parent?.view.bounds ?? self.view.frame
            self.view.layer.cornerRadius = 0
            self.view.clipsToBounds = false
        }
    }
    
    func minimize() {
        guard !isMinimized else { return }
        isMinimized = true
        UIView.animate(withDuration: 0.3) {
            let pWidth = self.parent?.view.bounds.width ?? 400
            let pHeight = self.parent?.view.bounds.height ?? 800
            let width: CGFloat = 160
            let height: CGFloat = 90
            self.view.frame = CGRect(x: pWidth - width - 16, y: pHeight - height - 100, width: width, height: height)
            self.view.layer.cornerRadius = 12
            self.view.clipsToBounds = true
        }
    }
    
    @objc private func handleTap(_ gesture: UITapGestureRecognizer) {
        if isMinimized { maximize() }
    }
    
    @objc private func handlePan(_ gesture: UIPanGestureRecognizer) {
        let translation = gesture.translation(in: view.superview)
        let velocity = gesture.velocity(in: view.superview)
        
        if !isMinimized {
            if translation.y > 100 || velocity.y > 500 { minimize() }
        } else {
            if translation.x > 100 || translation.x < -100 {
                pauseVideo()
                view.removeFromSuperview()
                removeFromParent()
            }
        }
    }
    
    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        guard message.name == "ytInfo", let dict = message.body as? [String: String],
              let title = dict["title"], let artist = dict["artist"] else { return }
        var info: [String: Any] = [MPMediaItemPropertyTitle: title, MPMediaItemPropertyArtist: artist]
        if let src = dict["src"], let url = URL(string: src) {
            URLSession.shared.dataTask(with: url) { data, _, _ in
                if let data = data, let image = UIImage(data: data) {
                    info[MPMediaItemPropertyArtwork] = MPMediaItemArtwork(boundsSize: image.size) { _ in image }
                    MPNowPlayingInfoCenter.default().nowPlayingInfo = info
                }
            }.resume()
        } else {
            MPNowPlayingInfoCenter.default().nowPlayingInfo = info
        }
    }
    
    func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        guard let target = navigationAction.request.url else { decisionHandler(.cancel); return }
        guard ["https", "http", "about"].contains(target.scheme ?? "") else { decisionHandler(.cancel); return }
        decisionHandler(.allow)
    }
    func webView(_ webView: WKWebView, createWebViewWith configuration: WKWebViewConfiguration, for navigationAction: WKNavigationAction, windowFeatures: WKWindowFeatures) -> WKWebView? {
        if navigationAction.targetFrame == nil, let target = navigationAction.request.url { webView.load(URLRequest(url: target)) }
        return nil
    }
}
