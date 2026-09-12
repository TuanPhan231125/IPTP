#import <Capacitor/Capacitor.h>

CAP_PLUGIN(LocalFileServerPlugin, "LocalFileServer",
    CAP_PLUGIN_METHOD(getServerUrl, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(startFileServer, CAPPluginReturnPromise);
)
