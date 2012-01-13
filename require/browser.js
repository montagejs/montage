/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
bootstrap("require/browser", function (require) {

var CJS = require("require/require");
var Promise = require("core/promise").Promise;
var URL = require("core/url");

var global = typeof global !== "undefined" ? global : window;

CJS.pwd = function() {
    return URL.resolve(window.location, ".");
};

CJS.overlays = ["browser"];

// Due to crazy variabile availability of new and old XHR APIs across
// platforms, this implementation registers every known name for the event
// listeners.  The promise library ascertains that the returned promise
// is resolved only by the first event.
// http://dl.dropbox.com/u/131998/yui/misc/get/browser-capabilities.html
CJS.read = function (url, options) {
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
        options && options.overrideMimeType && request.overrideMimeType &&
            request.overrideMimeType(options.overrideMimeType);
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

function XHRLoader(config) {
    return function(url, callback) {
        CJS.read(url, {
            overrideMimeType: "application/javascript"
        }).then(function (content) {
            if (/^\s*define\s*\(/.test(content)) {
                CJS.console.log("Detected async module definition, load with script loader instead.");
                callback(null);
            } else {
                callback(config.compile({ text : content, path : url }));
            }
        }, function (error) {
            console.warn(error);
            callback(null);
        });
    };
}

function CachingXHRLoader(config) {
    return CJS.CachingLoader(config, XHRLoader(config));
}

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

CJS.BrowserCompiler = function(config) {
    return function(def) {
        if (def.factory)
            return def;

        // Here we use a couple tricks to make debugging better in various browsers:
        // TODO: determine if these are all necessary / the best options
        // 1. name the function with something inteligible since some debuggers display the first part of each eval (Firebug)
        // 2. append the "//@ sourceURL=path" hack (Safari, Chrome, Firebug)
        //  * http://pmuellr.blogspot.com/2009/06/debugger-friendly.html
        //  * http://blog.getfirebug.com/2009/08/11/give-your-eval-a-name-with-sourceurl/
        //      TODO: investigate why this isn't working in Firebug.
        // 3. set displayName property on the factory function (Safari, Chrome)

        var displayName = "__FILE__"+def.path.replace(/\.\w+$|\W/g, "__");
        var sourceURLComment = "\n//@ sourceURL="+def.path;

        def.factory = globalEval("(function "+displayName+"(require, exports, module) {"+def.text+"//*/\n})"+sourceURLComment);

        // This should work and would be better, but Firebug does not show scripts executed via "new Function()" constructor.
        // TODO: sniff browser?
        // def.factory = new Function("require", "exports", "module", def.text + "\n//*/"+sourceURLComment);

        delete def.text;

        def.factory.displayName = displayName;

        return def;
    }
}

CJS.DefaultCompilerConstructor = function(config) {
    return CJS.DefaultCompilerMiddleware(config, CJS.BrowserCompiler(config));
}

// Try multiple paths
// Try XHRLoader then ScriptLoader
// ScriptLoader should probably always come after XHRLoader in case it's an unwrapped module
CJS.DefaultLoaderConstructor = function(config) {
    return CJS.Mappings(
        config,
        CJS.Extensions(
            config,
            CJS.Paths(
                config,
                CachingXHRLoader(config)
            )
        )
    );
}

});
