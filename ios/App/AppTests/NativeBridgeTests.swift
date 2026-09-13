import XCTest
import UIKit
import WebKit
import Capacitor
@testable import App

final class NativeBridgeTests: XCTestCase {
    @MainActor
    func testRealStoryboardRegistersPluginsAndJavaScriptCallsSwift() throws {
        let controller = try XCTUnwrap(UIApplication.shared.windows.first(where: { $0.isKeyWindow })?.rootViewController as? VibeBridgeViewController,
                                       "Main.storyboard must launch VibeBridgeViewController, not the Capacitor base class")
        controller.loadViewIfNeeded()
        let bridge = try XCTUnwrap(controller.bridge)
        XCTAssertTrue(bridge.plugin(withName: "FolderPicker") is FolderPickerPlugin)
        XCTAssertTrue(bridge.plugin(withName: "CloudBridge") is CloudBridgePlugin)
        let audio = try XCTUnwrap(bridge.plugin(withName: "NativeAudio") as? NativeAudioPlugin)
        for method in ["setQueue", "play", "pause", "next", "previous", "seek", "setShuffle", "setRepeat", "stop", "getState", "updateQueue", "showVideo", "setSleepTimer", "getHistory"] {
            XCTAssertTrue(audio.pluginMethods.contains(where: { $0.name == method }), "Missing bridge export: \(method)")
            XCTAssertTrue(audio.responds(to: NSSelectorFromString(method + ":")), "Missing Swift selector: \(method)")
        }
        let webView = try XCTUnwrap(controller.webView)
        let loaded = XCTNSPredicateExpectation(predicate: NSPredicate { _, _ in webView.url != nil && !webView.isLoading }, object: nil)
        wait(for: [loaded], timeout: 40)

        let script = """
        window.__nativeSmoke = null;
        (async () => {
          const call = (plugin, method, args = {}) => window.Capacitor.nativePromise(plugin, method, args);
          const bookmark = await call('FolderPicker', 'checkBookmark');
          const initial = await call('NativeAudio', 'getState');
          await call('NativeAudio', 'updateQueue', {songs: []});
          await call('NativeAudio', 'setSleepTimer', {minutes: 15});
          const timer = await call('NativeAudio', 'getState');
          const history = await call('NativeAudio', 'getHistory');
          const connection = await call('CloudBridge', 'getConnection');
          await call('NativeAudio', 'setShuffle', {enabled: true});
          await call('NativeAudio', 'setRepeat', {mode: 'all'});
          const configured = await call('NativeAudio', 'getState');
          let invalidQueueRejected = false;
          try { await call('NativeAudio', 'setQueue', {songs: [], startIndex: 0}); }
          catch (e) { invalidQueueRejected = e.code === 'PLAYBACK'; }
          await call('NativeAudio', 'stop');
          window.__nativeSmoke = {ok: true, bookmark, initial, configured, invalidQueueRejected, timer, history, connection};
        })().catch(e => { window.__nativeSmoke = {ok: false, message: e.message}; });
        true;
        """
        _ = try evaluate(script, in: webView)
        var result: [String: Any]?
        let deadline = Date().addingTimeInterval(20)
        while result == nil && Date() < deadline {
            result = try evaluate("window.__nativeSmoke", in: webView) as? [String: Any]
            if result == nil { RunLoop.main.run(until: Date().addingTimeInterval(0.1)) }
        }
        let report = try XCTUnwrap(result, "JavaScript/native roundtrip timed out")
        XCTAssertEqual(report["ok"] as? Bool, true, "\(report)")
        XCTAssertEqual((report["initial"] as? [String: Any])?["apiVersion"] as? Int, 1)
        XCTAssertEqual((report["bookmark"] as? [String: Any])?["hasBookmark"] as? Bool, false)
        XCTAssertEqual((report["configured"] as? [String: Any])?["shuffle"] as? Bool, true)
        XCTAssertEqual((report["configured"] as? [String: Any])?["repeatMode"] as? String, "all")
        XCTAssertEqual(report["invalidQueueRejected"] as? Bool, true)
        XCTAssertGreaterThan((report["timer"] as? [String: Any])?["sleepRemaining"] as? Double ?? 0, 890)
    }

    @MainActor
    private func evaluate(_ script: String, in webView: WKWebView) throws -> Any? {
        let completed = expectation(description: "JavaScript evaluated")
        var result: Any?
        var scriptError: Error?
        webView.evaluateJavaScript(script) { value, error in
            result = value
            scriptError = error
            completed.fulfill()
        }
        wait(for: [completed], timeout: 10)
        if let error = scriptError { throw error }
        return result
    }
}
