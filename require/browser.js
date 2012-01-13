/* <copyright>
Copyright (c) 2012, Motorola Mobility, Inc

All Rights Reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

  - Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
  - Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
  - Neither the name of Motorola Mobility nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
</copyright> */
bootstrap("require/browser", function (require) {

var CJS = require("require/require");
var Promise = require("core/promise").Promise;
var URL = require("core/url");

var global = typeof global !== "undefined" ? global : window;

CJS.pwd = function() {
    return URL.resolve(window.location, ".");
};

function ScriptLoader(config) {
    var pendingDefinitions = [];
    var pendingScripts = {};

    window.define._subscribe(function(definition) {
        if (definition.path && pendingScripts[definition.path]) {
            pendingDefinitions.push(definition);
        } else {
            console.log("Ignoring "+definition.path + " (possibly concurrent )")
        }
    });

    return function(url, callback) {
        if (!callback) {
            CJS.console.warn("ScriptLoader does not support synchronous loading ("+url+").");
            return null;
        }

        // Firefox does not fire script tag events correct for scripts loaded from file://
        // This only runs if loaded from file://
        // TODO: make a configuration option to run only in debug mode?
        if (HACK_checkFirefoxFileURL(url)) {
            callback(null);
            return;
        }

        var normalUrl = URL.resolve(url, "");
        pendingScripts[normalUrl] = true;

        var script = document.createElement("script");
        script.onload = function() {
            if (pendingDefinitions.length === 0) {
                // Script tags seem to fire onload even for 404 status code in some browsers (Chrome, Safari).
                // CJS.console.warn("No pending script definitions.");
            } else if (pendingDefinitions.length > 1) {
                CJS.console.warn("Support for multiple script definitions per file is not yet implemented.");
            }
            var definition = pendingDefinitions.pop();
            if (definition) {
                finish(config.compile(definition))
            } else {
                finish(null);
            }
        }
        script.onerror = function() {
            if (pendingDefinitions.length !== 0) {
                CJS.console.warn("Extra pending script definitions!");
            }
            finish(null);
        }
        script.src = url;
        document.getElementsByTagName("head")[0].appendChild(script);

        function finish(result) {
            pendingScripts[normalUrl] = false;
            script.parentNode.removeChild(script);
            callback(result);
        }
    }
}

function HACK_checkFirefoxFileURL(url) {
    if (window.navigator.userAgent.indexOf("Firefox") >= 0) {
        var protocol = url.match(/^([a-zA-Z]+:\/\/)?/)[1];
        if (protocol === "file://" || (!protocol && window.location.protocol === "file:")) {
            try {
                var req = new XMLHttpRequest();
                req.open("GET", url, false);
                req.send();
                return !xhrSuccess(req);
            } catch (e) {
                return true;
            }
        }
    }
    return false;
}

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

function CachingScriptLoader(config) {
    return CJS.CachingLoader(config, ScriptLoader(config));
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
    var loaders = [];
    if (config.xhr !== false)
        loaders.push(CachingXHRLoader(config));
    if (config.script !== false)
        loaders.push(CachingScriptLoader(config));
    return CJS.Mappings(
        config,
        CJS.Extensions(
            config,
            CJS.Paths(
                config,
                CJS.Multi(
                    config,
                    loaders
                )
            )
        )
    );
}

});
