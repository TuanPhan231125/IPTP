import Capacitor
import UIKit
import WebKit
import Security
import SafariServices

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
        guard let id = call.getString("videoId"), id.range(of: "^[A-Za-z0-9_-]{11}$", options: .regularExpression) != nil,
              let url = URL(string: "https://m.youtube.com/watch?v=" + id) else { call.reject("Video ID không hợp lệ."); return }
        DispatchQueue.main.async {
            guard let parent = self.bridge?.viewController, parent.presentedViewController == nil else { call.reject("Đóng cửa sổ đang mở trước."); return }
            let controller = YouTubeViewController(url: url, filterAds: call.getBool("filterAds") ?? false)
            let navigation = UINavigationController(rootViewController: controller)
            navigation.modalPresentationStyle = .fullScreen
            parent.present(navigation, animated: true) { call.resolve() }
        }
    }
}
final class YouTubeViewController: UIViewController, WKNavigationDelegate {
    private let url: URL
    private let filterAds: Bool
    private var webView: WKWebView!
    init(url: URL, filterAds: Bool) { self.url = url; self.filterAds = filterAds; super.init(nibName: nil, bundle: nil) }
    required init?(coder: NSCoder) { fatalError("init(coder:) has not been implemented") }
    override func viewDidLoad() {
        super.viewDidLoad()
        title = "YouTube"
        navigationItem.leftBarButtonItem = UIBarButtonItem(title: "Đóng", style: .done, target: self, action: #selector(close))
        navigationItem.rightBarButtonItem = UIBarButtonItem(title: "Safari", style: .plain, target: self, action: #selector(openSafari))
        let config = WKWebViewConfiguration()
        config.websiteDataStore = .default()
        config.allowsInlineMediaPlayback = true
        webView = WKWebView(frame: .zero, configuration: config)
        webView.navigationDelegate = self
        webView.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(webView)
        NSLayoutConstraint.activate([webView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            webView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            webView.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor),
            webView.bottomAnchor.constraint(equalTo: view.bottomAnchor)])
        if filterAds {
            let rules = """
            [{"trigger":{"url-filter":"^https?://([^/]+\\\\.)?(doubleclick\\\\.net|googlesyndication\\\\.com)/"},"action":{"type":"block"}}]
            """
            WKContentRuleListStore.default().compileContentRuleList(forIdentifier: "tpugsound-third-party-ads-v1", encodedContentRuleList: rules) { [weak self] list, _ in
                DispatchQueue.main.async {
                    guard let self = self else { return }
                    if let list = list { self.webView.configuration.userContentController.add(list) }
                    self.webView.load(URLRequest(url: self.url))
                }
            }
        } else { webView.load(URLRequest(url: url)) }
    }
    @objc private func close() { webView.loadHTMLString("", baseURL: nil); dismiss(animated: true) }
    @objc private func openSafari() { UIApplication.shared.open(webView.url ?? url) }
    func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        guard let target = navigationAction.request.url else { decisionHandler(.cancel); return }
        guard ["https", "http", "about"].contains(target.scheme ?? "") else { decisionHandler(.cancel); return }
        if target.host == "accounts.google.com" {
            // Google sign-in may reject embedded WebViews. Use the system browser.
            UIApplication.shared.open(url)
            decisionHandler(.cancel)
        } else { decisionHandler(.allow) }
    }
}

