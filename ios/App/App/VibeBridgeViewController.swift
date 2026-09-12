import Capacitor

class VibeBridgeViewController: CAPBridgeViewController {
    override func capacitorDidLoad() {
        bridge?.registerPluginInstance(FolderPickerPlugin())
        bridge?.registerPluginInstance(NativeAudioPlugin())
    }
}
