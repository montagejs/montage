/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
bootstrap("require/browser", function (require) {

var Require = require("require/require");
var Promise = require("core/promise").Promise;
var URL = require("core/mini-url");

var global = typeof global !== "undefined" ? global : window;

Require.getLocation = function() {
    return URL.resolve(window.location, ".");
};

Require.overlays = ["browser", "montage"];

// Due to crazy variabile availability of new and old XHR APIs across
// platforms, this implementation registers every known name for the event
// listeners.  The promise library ascertains that the returned promise
// is resolved only by the first event.
// http://dl.dropbox.com/u/131998/yui/misc/get/browser-capabilities.html
Require.read = function (url) {

    if (URL.resolve(window.location, url).indexOf("file:") === 0) {
        throw new Error("XHR does not function for file: protocol");
    }

    var request = new XMLHttpRequest();
    var response = Promise.defer();

    function onload() {
        if (xhrSuccess(request)) {
            response.resolve(request.responseText);
        } else {
            response.reject("Can't XHR " + JSON.stringify(url));
        }
    }

    function onerror() {
        response.reject("Can't XHR " + JSON.stringify(url));
    }

    try {
        request.open("GET", url, true);
        request.overrideMimeType("application/javascript");
        request.onreadystatechange = function () {
            if (request.readyState === 4) {
                onload();
            }
        };
        request.onload = request.load = onload;
        request.onerror = request.error = onerror;
    } catch (exception) {
        response.reject(exception.message, exception);
    }

    request.send();
    return response.promise;
};

// Determine if an XMLHttpRequest was successful
// Some versions of WebKit return 0 for successful file:// URLs
function xhrSuccess(req) {
    return (req.status === 200 || (req.status === 0 && req.responseText));
}

// By using a named "eval" most browsers will execute in the global scope.
// http://www.davidflanagan.com/2010/12/global-eval-in.html
// Unfortunately execScript doesn't always return the value of the evaluated expression (at least in Chrome)
var globalEval = /*this.execScript ||*/eval;
// For Firebug evaled code isn't debuggable otherwise
// http://code.google.com/p/fbug/issues/detail?id=2198
if (global.navigator && global.navigator.userAgent.indexOf("Firefox") >= 0) {
    globalEval = new Function("evalString", "return eval(evalString)");
}

Require.Compiler = function (config) {
    return function(module) {
        if (module.factory || module.text === void 0)
            return module;

        // Here we use a couple tricks to make debugging better in various browsers:
        // TODO: determine if these are all necessary / the best options
        // 1. name the function with something inteligible since some debuggers display the first part of each eval (Firebug)
        // 2. append the "//@ sourceURL=location" hack (Safari, Chrome, Firebug)
        //  * http://pmuellr.blogspot.com/2009/06/debugger-friendly.html
        //  * http://blog.getfirebug.com/2009/08/11/give-your-eval-a-name-with-sourceurl/
        //      TODO: investigate why this isn't working in Firebug.
        // 3. set displayName property on the factory function (Safari, Chrome)

        var displayName = "__FILE__"+module.location.replace(/\.\w+$|\W/g, "__");

        module.factory = globalEval("(function "+displayName+"(require, exports, module) {"+module.text+"//*/\n})"+"\n//@ sourceURL="+module.location);

        // This should work and would be better, but Firebug does not show scripts executed via "new Function()" constructor.
        // TODO: sniff browser?
        // module.factory = new Function("require", "exports", "module", module.text + "\n//*/"+sourceURLComment);

        module.factory.displayName = displayName;

        return module;
    }
};

});
