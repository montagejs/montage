/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2012 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
/*global bootstrap,montageDefine:true */
/*jshint -W015, evil:true, camelcase:false */


// polyfill:
// This method has been added to the ECMAScript 6 specification and may not be available in all JavaScript implementations yet. However, you can polyfill String.prototype.endsWith() with the following snippet:

if (!String.prototype.endsWith) {
	String.prototype.endsWith = function(search, this_len) {
		if (this_len === undefined || this_len > this.length) {
			this_len = this.length;
		}
		return this.substring(this_len - search.length, this_len) === search;
	};
}

bootstrap("require/browser", function (require) {

    var Require = require("require");
    var Promise = require("promise");
    var URL = require("mini-url");

    var GET = "GET";
    var APPLICATION_JAVASCRIPT_MIMETYPE = "application/javascript";
    var FILE_PROTOCOL = "file:";
    var JAVASCRIPT = "javascript";

    // By using a named "eval" most browsers will execute in the global scope.
    // http://www.davidflanagan.com/2010/12/global-eval-in.html
    // Unfortunately execScript doesn't always return the value of the evaluated expression (at least in Chrome)
    var globalEval = /*this.execScript ||*/eval;

    /*jshint evil:true */
    var global = globalEval('this');
    /*jshint evil:false */

    var location;
    Require.getLocation = function() {
        if (!location) {
            var base = document.querySelector("head > base");
            if (base) {
                location = base.href;
            } else {
                location = window.location;
            }
            location = URL.resolve(location, ".");
        }
        return location;
    };

    Require.overlays = ["window", "browser", "montage"];

    // Due to crazy variabile availability of new and old XHR APIs across
    // platforms, this implementation registers every known name for the event
    // listeners.  The promise library ascertains that the returned promise
    // is resolved only by the first event.
    // http://dl.dropbox.com/u/131998/yui/misc/get/browser-capabilities.html
    var xhrPool = [];
    function onload(event) {
        var xhr = event.target,
            module = xhr.module;
        // Determine if an XMLHttpRequest was successful
        // Some versions of WebKit return 0 for successful file:// URLs
        if (xhr.status === 200 || (xhr.status === 0 && xhr.responseText)) {
            if (module) {
                module.type = JAVASCRIPT;
                module.text = xhr.responseText;
                module.location = xhr.url;
            }
            xhr.resolve(xhr.responseText);
            onload.xhrPool.push(xhr);
        } else {
            xhr.onerror(event);
        }
    }
    onload.xhrPool = xhrPool;

    var jsIndexPrefix = '/index.js',
        jsPreffix = '.js';
    function onerror(event) {
      var xhr = event.target,
          url = xhr.url;

        // Re-use xhr on read on .js failure if not /index.js file and
        // retry on /index.js dynamically.
        if (
            url.indexOf(jsPreffix) === url.length - 3 && // ends in .js
            url.indexOf(jsIndexPrefix) !== url.length - 9 // does not end in /index.js
        ) {
            xhr.url = xhr.url.replace(jsPreffix, jsIndexPrefix);
            if (xhr.module) {
                xhr.module.location = xhr.url;
            }
            xhr.open(GET, xhr.url, true);
            xhr.send(null);
        } else {
            xhr.reject(new Error("Can't XHR " + JSON.stringify(url)));
            onerror.xhrPool.push(xhr);
            //This clears the response from memory
            xhr.abort();
            xhr.url = null;
            xhr.module = null;
        }
    }
    onerror.xhrPool = xhrPool;

    function RequireRead(url, module) {
        var xhr = RequireRead.xhrPool.length && RequireRead.xhrPool.pop();

        if (!xhr) {
            xhr = new RequireRead.XMLHttpRequest();
            if (xhr.overrideMimeType) {
                xhr.overrideMimeType(APPLICATION_JAVASCRIPT_MIMETYPE);
            }
            xhr.onload = RequireRead.onload;
            xhr.onerror = RequireRead.onerror;
            function promiseHandler(resolve, reject) {
                promiseHandler.xhr.resolve = resolve;
                promiseHandler.xhr.reject = reject;
            };
            promiseHandler.xhr = xhr;
            xhr.promiseHandler = promiseHandler;
        }

        xhr.url = url;
        xhr.module = module;
        xhr.open(RequireRead.GET, url, true);
        xhr.send(null);

        return new RequireRead.Promise(xhr.promiseHandler);
    }

    //Caching on closer symbol in scope to speed up
    Require.read = RequireRead;
    RequireRead.xhrPool = xhrPool;
    RequireRead.XMLHttpRequest = XMLHttpRequest;
    RequireRead.onload = onload;
    RequireRead.onerror = onerror;
    RequireRead.GET = GET;
    RequireRead.Promise = Promise;

    // For Firebug, evaled code wasn't debuggable otherwise
    // http://code.google.com/p/fbug/issues/detail?id=2198
    // if (global.navigator && global.navigator.userAgent.indexOf("Firefox") >= 0) {
    //     globalEval = new Function("return eval(arguments[0])");
    // }

    var DoubleUnderscore = "__",
        Underscore = "_",
        globalEvalConstantA = "(function ",
        globalEvalConstantB = "(require, exports, module, global) {",
        globalEvalConstantC = "//*/\n})\n//# sourceURL=",
        globalConcatenator = [globalEvalConstantA,undefined,globalEvalConstantB,undefined,globalEvalConstantC,undefined],
        nameRegex = /[^\w\d]/g,
        supportsTemplateLiterals = false;
        try {
            eval("`foo`");
            supportsTemplateLiterals = true;
        }
        catch (e) {}


    Require.Compiler = function (config) {
        return function(module) {
            if (module.location && (module.location.endsWith(".meta") || module.location.endsWith(".mjson"))) {
                return module;
            }

            if (module.factory || module.text === void 0) {
                return module;
            }
            if (config.useScriptInjection) {
                throw new Error("Can't use eval.");
            }

            // Here we use a couple tricks to make debugging better in various browsers:
            // TODO: determine if these are all necessary / the best options
            // 1. name the function with something inteligible since some debuggers display the first part of each eval (Firebug)
            // 2. append the "//# sourceURL=location" hack (Safari, Chrome, Firebug)
            //  * http://pmuellr.blogspot.com/2009/06/debugger-friendly.html
            //  * http://blog.getfirebug.com/2009/08/11/give-your-eval-a-name-with-sourceurl/
            //      TODO: investigate why this isn't working in Firebug.
            // 3. set displayName property on the factory function (Safari, Chrome)

            // Prevent method to start with number to avoid Unexpected number
            if(!supportsTemplateLiterals) {
                globalConcatenator[1] = [DoubleUnderscore, module.require.config.name, Underscore, module.id].join('').replace(nameRegex, Underscore);
                globalConcatenator[3] = module.text;
                globalConcatenator[5] = module.location;

                module.factory = globalEval(globalConcatenator.join(''));
                module.factory.displayName = globalConcatenator[1];
                module.text = globalConcatenator[1] = globalConcatenator[3] = globalConcatenator[5] = null;
            }
            else {
                var displayName = (`${DoubleUnderscore}${module.require.config.name}${Underscore}${module.id}`.replace(nameRegex, Underscore));
                module.factory = globalEval(`${globalEvalConstantA}${displayName}${globalEvalConstantB}${module.text}${globalEvalConstantC}${module.location}`);
                module.factory.displayName = displayName;
            }

        };
    };

    Require.XhrLoader = function (config) {
        return function (url, module) {
            return config.read(url, module)
            .then(function (text) {
                 module.type = JAVASCRIPT;
                 module.text = text;
                 module.location = url;
            });
        };
    };

    var definitions = {};
    var getDefinition = function (hash, id) {
        var defHash = definitions[hash] = definitions[hash] || {};
        if (!defHash[id]) {
            var promiseResolve;
            defHash[id] = new Promise(function(resolve, reject) {
                promiseResolve = resolve;
            });
            defHash[id].resolve = promiseResolve;
        }
        return defHash[id];
    };

    var loadIfNotPreloaded = function (location, definition, preloaded) {
        var loadScript = Require.delegate && Require.delegate.loadScript || Require.loadScript;
        // The package.json might come in a preloading bundle. If so, we do not
        // want to issue a script injection. However, if by the time preloading
        // has finished the package.json has not arrived, we will need to kick off
        // a request for the requested script.
        if (preloaded && preloaded.isPending()) {
            preloaded
            .then(function () {
                if (definition.isPending()) {
                    loadScript(location);
                }
            });
        } else if (definition.isPending()) {
            // otherwise preloading has already completed and we don't have the
            // module, so load it
            loadScript(location);
        }
    };

    // global
    montageDefine = function (hash, id, module) {
        getDefinition(hash, id).resolve(module);
    };

    Require.loadScript = function (location) {
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
    };

    Require.ScriptLoader = function (config) {
        var hash = config.packageDescription.hash;
        return function (location, module) {
            /*
                Equivallent to:

                return Promise.try(function () {...});

                without the need to be dependent on non-standard Promise.try method
            */
            return new Promise(function(resolve, reject) {
                resolve((function () {

                    // short-cut by predefinition
                    if (definitions[hash] && definitions[hash][module.id]) {
                        return definitions[hash][module.id];
                    }

                    if (/\.js$/.test(location)) {
                        location = location.replace(/\.js$/, ".load.js");
                    } else {
                        location += ".load.js";
                    }

                    var definition = getDefinition(hash, module.id);
                    loadIfNotPreloaded(location, definition, config.preloaded);

                    return definition;
                })());
            })
            // return Promise.try(function () {

            //     // short-cut by predefinition
            //     if (definitions[hash] && definitions[hash][module.id]) {
            //         return definitions[hash][module.id];
            //     }

            //     if (/\.js$/.test(location)) {
            //         location = location.replace(/\.js$/, ".load.js");
            //     } else {
            //         location += ".load.js";
            //     }

            //     var definition = getDefinition(hash, module.id);
            //     loadIfNotPreloaded(location, definition, config.preloaded);

            //     return definition;
            // })
            .then(function (definition) {
                /*jshint -W089 */
                delete definitions[hash][module.id];
                for (var name in definition) {
                    module[name] = definition[name];
                }
                module.location = location;
                module.directory = URL.resolve(location, ".");
                /*jshint +W089 */
            });
        };
    };

    // old version
    var loadPackageDescription = Require.loadPackageDescription;
    Require.loadPackageDescription = function (dependency, config) {
        if (dependency.hash) { // use script injection
            var definition = getDefinition(dependency.hash, "package.json");
            var location = URL.resolve(dependency.location, "package.json.load.js");

            loadIfNotPreloaded(location, definition, config.preloaded);

            return definition.get("exports");
        } else {
            // fall back to normal means
            return loadPackageDescription(dependency, config);
        }
    };

    Require.makeLoader = function (config) {
        var Loader;
        if (config.useScriptInjection) {
            Loader = Require.ScriptLoader;
        } else {
            Loader = Require.XhrLoader;
        }
        return Require.ReelLoader(config,
            Require.MappingsLoader(
                config,
                Require.LocationLoader(
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
