#import <Capacitor/Capacitor.h>

CAP_PLUGIN(FolderPickerPlugin, "FolderPicker",
    CAP_PLUGIN_METHOD(checkBookmark, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(pickFolder, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(scanFolder, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(clearBookmark, CAPPluginReturnPromise);
)
