/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */

var parentWindow = window.opener;

// Let's switch to the parent application package context
require.loadPackage(parentWindow.require.location).then(function(require) {
    var loadInfo = window.loadInfo,
        module = loadInfo.module,
        name = loadInfo.name,
        callback = loadInfo.callback;

    // Switching the package context back to the parent application
    window.require = require;

    require.async("montage/ui/component", function(exports) {
        require.async("montage/ui/loader.reel")
        .then(function (exports) {
            var mainComponent = exports["Loader"].create();
            mainComponent.mainModule = module;
            mainComponent.mainName = name;
            mainComponent.element = window.document.body;
            mainComponent.attachToParentComponent();
            mainComponent.needsDraw = true;

            if (callback) {
                mainComponent.addEventListener("load", function(event) {
                    mainComponent.removeEventListener("load", arguments.callee);
                    callback(window, event.detail);
                });
            }
        })
        .end();
    });
});
