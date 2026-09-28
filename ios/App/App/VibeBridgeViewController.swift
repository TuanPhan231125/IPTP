import Capacitor
import UIKit
import WebKit
import Security

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
        CAPPluginMethod(name: "openYouTube", returnType: CAPPluginReturnPromise)
    ]
    private var query: [String: Any] {
        [kSecClass as String: kSecClassGenericPassword,
         kSecAttrService as String: "tpugsound.cloud", kSecAttrAccount as String: "owner"]
    }
    @objc func saveConnection(_ call: CAPPluginCall) {
        guard let endpoint = call.getString("endpoint"), let url = URL(string: endpoint), url.scheme == "https",
              let token = call.getString("token"), !token.isEmpty else { call.reject("Kết nối không hợp lệ."); return }
        do {
            let data = try JSONSerialization.data(withJSONObject: ["endpoint": endpoint, "token": token])
            let status = SecItemUpdate(query as CFDictionary, [kSecValueData as String: data] as CFDictionary)
            if status == errSecItemNotFound {
                var entry = query
                entry[kSecValueData as String] = data
                entry[kSecAttrAccessible as String] = kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly
                guard SecItemAdd(entry as CFDictionary, nil) == errSecSuccess else { call.reject("Không lưu được kết nối vào Keychain."); return }
            } else if status != errSecSuccess { call.reject("Không cập nhật được Keychain."); return }
            call.resolve()
        } catch { call.reject("Không lưu được kết nối.") }
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
        guard videoID == nil || videoID!.range(of: "^[A-Za-z0-9_-]{11}$", options: .regularExpression) != nil else {
            call.reject("Video ID không hợp lệ.")
            return
        }
        let url = videoID.flatMap { URL(string: "https://m.youtube.com/watch?v=" + $0) } ?? URL(string: "https://m.youtube.com/")!
        DispatchQueue.main.async {
            guard let parent = self.bridge?.viewController else { call.reject("Không tìm thấy màn hình ứng dụng."); return }
            if let controller = parent.presentedViewController as? YouTubeViewController {
                controller.open(url)
                call.resolve()
                return
            }
            guard parent.presentedViewController == nil else { call.reject("Đóng cửa sổ đang mở trước."); return }
            let controller = YouTubeViewController(url: url)
            controller.onReturnToLocal = { [weak self] in
                self?.notifyListeners("youtubeDismissed", data: ["destination": "local"])
            }
            controller.modalPresentationStyle = .fullScreen
            parent.present(controller, animated: false) { call.resolve() }
        }
    }
}
final class YouTubeViewController: UIViewController, WKNavigationDelegate, WKUIDelegate, UIGestureRecognizerDelegate {
    private let url: URL
    private var webView: WKWebView!
    private var didShowGoogleWarning = false
    var onReturnToLocal: (() -> Void)?
    init(url: URL) { self.url = url; super.init(nibName: nil, bundle: nil) }
    required init?(coder: NSCoder) { fatalError("init(coder:) has not been implemented") }
    override func viewDidLoad() {
        super.viewDidLoad()
        let config = WKWebViewConfiguration()
        config.websiteDataStore = .default()
        config.allowsInlineMediaPlayback = true
        config.preferences.javaScriptCanOpenWindowsAutomatically = true
        webView = WKWebView(frame: .zero, configuration: config)
        webView.navigationDelegate = self
        webView.uiDelegate = self
        webView.allowsBackForwardNavigationGestures = false
        webView.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(webView)
        NSLayoutConstraint.activate([webView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            webView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            webView.topAnchor.constraint(equalTo: view.topAnchor),
            webView.bottomAnchor.constraint(equalTo: view.bottomAnchor)])
        let returnGesture = UIScreenEdgePanGestureRecognizer(target: self, action: #selector(handleReturnGesture(_:)))
        returnGesture.edges = .left
        returnGesture.delegate = self
        returnGesture.cancelsTouchesInView = false
        view.addGestureRecognizer(returnGesture)
        open(url)
    }
    override func viewDidAppear(_ animated: Bool) {
        super.viewDidAppear(animated)
        if !UserDefaults.standard.bool(forKey: "tpugsound.didSeeLocalGesture") {
            UserDefaults.standard.set(true, forKey: "tpugsound.didSeeLocalGesture")
            showMessage("Vuốt từ mép trái để mở Nhạc local")
        }
    }
    func open(_ destination: URL) { webView?.load(URLRequest(url: destination)) }
    @objc private func handleReturnGesture(_ gesture: UIScreenEdgePanGestureRecognizer) {
        guard gesture.state == .ended else { return }
        let translation = gesture.translation(in: view).x
        let velocity = gesture.velocity(in: view).x
        guard translation > 90 || velocity > 500 else { return }
        onReturnToLocal?()
        dismiss(animated: false)
    }
    private func showMessage(_ message: String) {
        let label = UILabel()
        label.text = message
        label.textColor = .white
        label.backgroundColor = UIColor.black.withAlphaComponent(0.78)
        label.font = .preferredFont(forTextStyle: .footnote)
        label.textAlignment = .center
        label.numberOfLines = 2
        label.layer.cornerRadius = 14
        label.clipsToBounds = true
        label.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(label)
        NSLayoutConstraint.activate([label.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            label.bottomAnchor.constraint(equalTo: view.safeAreaLayoutGuide.bottomAnchor, constant: -24),
            label.leadingAnchor.constraint(greaterThanOrEqualTo: view.leadingAnchor, constant: 28),
            label.trailingAnchor.constraint(lessThanOrEqualTo: view.trailingAnchor, constant: -28),
            label.heightAnchor.constraint(greaterThanOrEqualToConstant: 44)])
        UIView.animate(withDuration: 0.25, delay: 3.2, options: .curveEaseOut) { label.alpha = 0 } completion: { _ in label.removeFromSuperview() }
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
    func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation?, withError error: Error) {
        if webView.url?.host?.contains("google") == true { showMessage("Google không thể đăng nhập trong cửa sổ này. Hãy thử lại sau hoặc dùng YouTube chính chủ.") }
    }
    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation?) {
        guard !didShowGoogleWarning, webView.url?.host?.contains("google") == true else { return }
        webView.evaluateJavaScript("document.body ? document.body.innerText.toLowerCase().slice(0, 5000) : ''") { [weak self] value, _ in
            guard let self = self, let text = value as? String else { return }
            let blockedMessages = ["disallowed_useragent", "this browser or app may not be secure", "không thể đăng nhập", "trình duyệt hoặc ứng dụng này có thể không an toàn"]
            guard blockedMessages.contains(where: text.contains) else { return }
            self.didShowGoogleWarning = true
            self.showMessage("Google không cho đăng nhập trong cửa sổ này. Hãy dùng YouTube chính chủ.")
        }
    }
    func gestureRecognizer(_ gestureRecognizer: UIGestureRecognizer, shouldRecognizeSimultaneouslyWith otherGestureRecognizer: UIGestureRecognizer) -> Bool {
        true
    }
}

