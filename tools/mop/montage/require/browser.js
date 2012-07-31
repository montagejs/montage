/* <copyright>
Copyright (c) 2012, Motorola Mobility LLC.
All Rights Reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

* Redistributions of source code must retain the above copyright notice,
  this list of conditions and the following disclaimer.

* Redistributions in binary form must reproduce the above copyright notice,
  this list of conditions and the following disclaimer in the documentation
  and/or other materials provided with the distribution.

* Neither the name of Motorola Mobility LLC nor the names of its
  contributors may be used to endorse or promote products derived from this
  software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE
LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
POSSIBILITY OF SUCH DAMAGE.
</copyright> */
/*global bootstrap */
bootstrap("require/browser", function (require) {

var Require = require("require/require"),
    Promise = require("core/promise").Promise,
    URL = require("core/mini-url"),
    GET = "GET",
    APPLICATION_JAVASCRIPT_MIMETYPE = "application/javascript",
    FILE_PROTOCOL = "file:",
    global = typeof global !== "undefined" ? global : window;

Require.getLocation = function() {
    return URL.resolve(window.location, ".");
};

Require.overlays = ["window", "browser", "montage"];

// Determine if an XMLHttpRequest was successful
// Some versions of WebKit return 0 for successful file:// URLs
function xhrSuccess(req) {
    return (req.status === 200 || (req.status === 0 && req.responseText));
}

// Due to crazy variabile availability of new and old XHR APIs across
// platforms, this implementation registers every known name for the event
// listeners.  The promise library ascertains that the returned promise
// is resolved only by the first event.
// http://dl.dropbox.com/u/131998/yui/misc/get/browser-capabilities.html
Require.read = function (url) {

    if (URL.resolve(window.location, url).indexOf(FILE_PROTOCOL) === 0) {
        throw new Error("XHR does not function for file: protocol");
    }

    var request = new XMLHttpRequest();
    var response = Promise.defer();

    function onload() {
        if (xhrSuccess(request)) {
            response.resolve(request.responseText);
        } else {
            onerror();
        }
    }

    function onerror() {
        response.reject("Can't XHR " + JSON.stringify(url));
    }

    try {
        request.open(GET, url, true);
        if (request.overrideMimeType) {
            request.overrideMimeType(APPLICATION_JAVASCRIPT_MIMETYPE);
        }
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

// By using a named "eval" most browsers will execute in the global scope.
// http://www.davidflanagan.com/2010/12/global-eval-in.html
// Unfortunately execScript doesn't always return the value of the evaluated expression (at least in Chrome)
var globalEval = /*this.execScript ||*/eval;
// For Firebug evaled code isn't debuggable otherwise
// http://code.google.com/p/fbug/issues/detail?id=2198
if (global.navigator && global.navigator.userAgent.indexOf("Firefox") >= 0) {
    globalEval = new Function("_", "return eval(_)");
}

var __FILE__String = "__FILE__",
    DoubleUnderscoreString = "__",
    globalEvalConstantA = "(function ",
    globalEvalConstantB = "(require, exports, module) {",
    globalEvalConstantC = "//*/\n})\n//@ sourceURL=";

Require.Compiler = function (config) {
    return function(module) {
        if (module.exports || module.factory || module.text === void 0)
            return module;
        if (config.define)
            throw new Error("Can't use eval to compile " + JSON.stringify(module.id));

        // Here we use a couple tricks to make debugging better in various browsers:
        // TODO: determine if these are all necessary / the best options
        // 1. name the function with something inteligible since some debuggers display the first part of each eval (Firebug)
        // 2. append the "//@ sourceURL=location" hack (Safari, Chrome, Firebug)
        //  * http://pmuellr.blogspot.com/2009/06/debugger-friendly.html
        //  * http://blog.getfirebug.com/2009/08/11/give-your-eval-a-name-with-sourceurl/
        //      TODO: investigate why this isn't working in Firebug.
        // 3. set displayName property on the factory function (Safari, Chrome)

        var displayName = __FILE__String+module.location.replace(/\.\w+$|\W/g, DoubleUnderscoreString);

        try {
            module.factory = globalEval(globalEvalConstantA+displayName+globalEvalConstantB+module.text+globalEvalConstantC+module.location);
        } catch (exception) {
            throw new SyntaxError("in " + module.location + ": " + exception.message);
        }

        // This should work and would be simpler, but Firebug does not show scripts executed via "new Function()" constructor.
        // TODO: sniff browser?
        // module.factory = new Function("require", "exports", "module", module.text + "\n//*/"+sourceURLComment);

        module.factory.displayName = displayName;
    }
};

Require.XhrLoader = function (config) {
    return function (url, module) {
        return Require.read(url)
        .then(function (text) {
            module.type = "javascript";
            module.text = text;
            module.location = url;
        });
    };
};

var definitions = {};
var getDefinition = function (hash, id) {
    definitions[hash] = definitions[hash] || {};
    definitions[hash][id] = definitions[hash][id] || Promise.defer();
    return definitions[hash][id];
};
define = function (hash, id, module) {
    getDefinition(hash, id).resolve(module);
};

Require.ScriptLoader = function (config) {
    var hash = config.packageDescription.hash;
    var preloaded = config.preloaded = config.preloaded || Promise.resolve();
    return function (location, module) {
        return preloaded.then(function () {

            // short-cut by predefinition
            if (definitions[hash] && definitions[hash][module.id]) {
                return definitions[hash][module.id].promise;
            }

            if (/\.js$/.test(location)) {
                location = location.replace(/\.js/, ".load.js");
            } else {
                location += ".load.js";
            }

            var script = document.createElement("script");
            script.onload = function() {
                script.parentNode.removeChild(script);
            };
            script.onerror = function (error) {
                script.parentNode.removeChild(script);
            };
            script.src = location;
            script.defer = true;
            document.getElementsByTagName("head")[0].appendChild(script);

            return getDefinition(hash, module.id).promise
        })
        .then(function (definition) {
            delete definitions[hash][module.id];
            for (var name in definition) {
                module[name] = definition[name];
            }
            module.location = location;
            module.directory = URL.resolve(location, ".");
        });
    };
};

// annotate loadPackageDescription such that preloaded descriptions can be
// retrieved from the definitions data
Require.loadPackageDescription = (function (loadPackageDescription) {
    return function (dependency, config) {
        if (
            definitions[dependency.hash] &&
            definitions[dependency.hash]["package.json"]
        ) {
            return definitions[dependency.hash]["package.json"]
                .promise.get("exports");
        } else {
            return loadPackageDescription(dependency, config);
        }
    };
})(Require.loadPackageDescription);

Require.makeLoader = function (config) {
    if (config.packageDescription.define) {
        Loader = Require.ScriptLoader;
    } else {
        Loader = Require.XhrLoader;
    }
    return Require.MappingsLoader(
        config,
        Require.ExtensionsLoader(
            config,
            Require.PathsLoader(
                config,
                Require.MemoizedLoader(
                    config,
                    Loader(config)
                )
            )
        )
    );
};

});
