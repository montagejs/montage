var parentWindow = window.opener;

// Let's switch to the parent application package context
require.loadPackage(parentWindow.require.location)
.then(function(require) {
    var loadInfo = window.loadInfo,
        module = loadInfo.module,
        name = loadInfo.name,
        callback = loadInfo.callback;

    // Switching the package context back to the parent application
    // Fixe me: transition to .mr only
    window.require = window.mr = require;

    return require.async("montage/ui/component")
    .then(function(exports) {
        return require.async("montage/ui/loader.reel")
        .then(function (exports) {
            var mainComponent = exports["Loader"].create();
            mainComponent.mainModule = module;
            mainComponent.mainName = name;
            mainComponent.element = window.document.body;
            mainComponent.attachToParentComponent();
            mainComponent.needsDraw = true;

            if (callback) {
                mainComponent.addEventListener("componentLoaded", function(event) {
                    mainComponent.removeEventListener("componentLoaded", arguments.callee);
                    callback(window, event.detail);
                });
            }
        });
    });

})
.done();

