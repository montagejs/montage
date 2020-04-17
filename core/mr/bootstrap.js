/*global module: false, define, callbackApplication */
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define('mr', [], factory);
    } else if (typeof module === 'object' && module.exports) {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports,
        // like Node.
        module.exports = factory(require, exports, module);
    } else {
        // Browser globals (root is window)
        root.Montage = factory({}, {}, {});
    }
}(this, function (require, exports, module) {
    "use strict";

    // reassigning causes eval to not use lexical scope.
    var globalEval = eval,
        global = globalEval('this');

    //
    //
    //

    function upperCaseChar(_, c) {
        return c.toUpperCase();
    }

    var paramsCache,
        dataAttrPattern = /^data-(.*)$/,
        boostrapPattern = /^(.*)bootstrap.js(?:[\?\.]|$)/i,
        letterAfterDashPattern = /-([a-z])/g;

    function getParams() {
        var i, j,
            match, script, scripts,
            mrLocation, attr, name;

        if (!paramsCache) {
            paramsCache = {};
            // Find the <script> that loads us, so we can divine our
            // parameters from its attributes.
            scripts = document.getElementsByTagName("script");
            for (i = 0; i < scripts.length; i++) {
                script = scripts[i];
                if (script.src && (match = script.src.match(boostrapPattern))) {
                    mrLocation = match[1];
                }
                if (script.hasAttribute("data-mr-location")) {
                    mrLocation = resolve(window.location, script.getAttribute("data-mr-location"));
                }
                if (mrLocation) {
                    if (script.dataset) {
                        for (name in script.dataset) {
                            if (script.dataset.hasOwnProperty(name)) {
                                paramsCache[name] = script.dataset[name];
                            }
                        }
                    } else if (script.attributes) {
                        for (j = 0; j < script.attributes.length; j++) {
                            attr = script.attributes[j];
                            match = attr.name.match(dataAttrPattern);
                            if (match) {
                                paramsCache[match[1].replace(letterAfterDashPattern, upperCaseChar)] = attr.value;
                            }
                        }
                    }
                    // Permits multiple bootstrap.js <scripts>; by
                    // removing as they are discovered, next one
                    // finds itself.
                    script.parentNode.removeChild(script);
                    paramsCache.mrLocation = mrLocation;
                    break;
                }
            }
        }

        return paramsCache;
    }

    function load(location, loadCallback, errorCallback, finallyCallback) {
        var script;

        function finallyHandler() {
            if (finallyCallback) {
                finallyCallback(script);
            }

            // remove clutter
            if (script.parentNode) {
                script.parentNode.removeChild(script);
            }
        }

        if (typeof document !== "undefined") {

            script = document.createElement("script");
            script.setAttribute('async', '');
            script.setAttribute('src', location);
            script.onload = function () {
                if (loadCallback) {
                    loadCallback(script);
                }
                finallyHandler();
            };
            script.onerror = function (err) {
                if (errorCallback) {
                    errorCallback(err, script);
                }
                finallyHandler();
            };
            document.querySelector("head").appendChild(script);
        } else {
            errorCallback(new Error("document not supported"));
            finallyHandler();
        }
    }

    // mini-url library
    var isAbsolutePattern = /^[\w\-]+:/;
    function makeResolve() {
        var baseElement = document.querySelector("base"),
            existingBaseElement = baseElement;

        if (!existingBaseElement) {
            baseElement = document.createElement("base");
            baseElement.href = "";
        }

        return function (base, relative) {

            base = String(base);

            var resolved, restore,
                head = document.querySelector("head"),
                relativeElement = document.createElement("a");

            if (!existingBaseElement) {
                head.appendChild(baseElement);
            }

            if (!isAbsolutePattern.test(base)) {
                throw new Error("Can't resolve " + JSON.stringify(relative) + " relative to " + JSON.stringify(base));
            }

            restore = baseElement.href;
            baseElement.href = base;
            relativeElement.href = relative;
            resolved = relativeElement.href;
            baseElement.href = restore;
            if (!existingBaseElement) {
                head.removeChild(baseElement);
            }

            return resolved;
        };
    }

    var resolve = makeResolve();

    //
    //
    //

    var readyStatePattern = /interactive|complete/;
    var bootstrap = function (callback) {

        callback = callback || callbackApplication;

        var domLoaded, Require, Promise, URL,
            params = getParams();

        function callbackIfReady() {
            if (domLoaded && Require) {
                callback(Require, Promise, URL);
            }
        }

        // execute bootstrap scripts
        function allModulesLoaded() {
            Promise = bootRequire("promise");
            Require = bootRequire("require");
            URL = bootRequire("mini-url");
            callbackIfReady();
        }

        // observe dom loading and load scripts in parallel
        function domLoad() {
            // observe dom loaded
            document.removeEventListener("DOMContentLoaded", domLoad, true);
            domLoaded = true;
            callbackIfReady();
        }

        // miniature module system
        var bootModules = {};
        var definitions = {};
        function bootRequire(id) {
            if (!bootModules[id] && definitions[id]) {
                var exports = bootModules[id] = {};
                bootModules[id] = definitions[id](bootRequire, exports) || exports;
            }
            return bootModules[id];
        }

        // this permits bootstrap.js to be injected after DOMContentLoaded
        // http://jsperf.com/readystate-boolean-vs-regex/2
        if (readyStatePattern.test(document.readyState)) {
            domLoad();
        } else {
            document.addEventListener("DOMContentLoaded", domLoad, true);
        }

        // determine which scripts to load
        var pending = {
            "promise": "node_modules/bluebird/js/browser/bluebird.min.js",
            "require": "require.js",
            "require/browser": "browser.js",
        };

        // Handle preload
        // TODO rename to MontagePreload
        if (!global.preload) {
            var mrLocation = resolve(window.location, params.mrLocation);

            // Special Case bluebird for now:
            var onLoadBluebird = function () {
                //global.bootstrap cleans itself from window once all known are loaded. "bluebird" is not known, so needs to do it first
                global.bootstrap("bluebird", function (mrRequire, exports) {
                    return window.Promise;
                });

                global.bootstrap("promise", function (mrRequire, exports) {
                    return window.Promise;
                });
            };
            if (params.promiseLocation) {
                load(params.promiseLocation, onLoadBluebird);
            } else {
                // First assume the app was installed with npm 3+ and without
                // --legacy-bundling, in which case bluebird should be under
                // the app's node_modules
                load(resolve(window.location, pending.promise), onLoadBluebird, function () {
                    // If that failed, it's possible the app was installed with
                    // npm 2 or --legacy-bundling, in which case bluebird should
                    // be under mr's node_modules
                    load(resolve(mrLocation, pending.promise), onLoadBluebird);
                });
            }

            // Load other module and skip promise
            for (var id in pending) {
                if (pending.hasOwnProperty(id)) {
                    if (id !== 'promise') {
                        load(resolve(mrLocation, pending[id]));
                    }
                }
            }
        }

        // register module definitions for deferred, serial execution
        global.bootstrap = function (id, factory) {
            definitions[id] = factory;
            delete pending[id];
            for (id in pending) {
                if (pending.hasOwnProperty(id)) {
                    // this causes the function to exit if there are any remaining
                    // scripts loading, on the first iteration.  consider it
                    // equivalent to an array length check
                    return;
                }
            }
            // if we get past the for loop, bootstrapping is complete.  get rid
            // of the bootstrap function and proceed.
            delete global.bootstrap;
            allModulesLoaded();
        };

        // one module loaded for free, for use in require.js, browser.js
        global.bootstrap("mini-url", function (mrRequire, exports) {
            exports.resolve = resolve;
        });
    };

    var browser = {
        getParams: getParams,
        bootstrap: bootstrap
    };

    // Bootstrapping for multiple-platforms
    exports.getPlatform = function() {
        if (typeof window !== "undefined" && window && window.document) {
            return browser;
        } else if (typeof process !== "undefined") {
            return require("./node.js");
        } else {
            throw new Error("Platform not supported.");
        }
    };

    exports.Require = null;

    /**
     * Initializes Montage and creates the application singleton if
     * necessary.
     */
    exports.initMontageRequire = function() {
        var platform = exports.getPlatform();

        // Platform dependent
        return platform.bootstrap(function(mrRequire, Promise, URL) {

            var config = {},
                params = platform.getParams(),
                applicationModuleId = params.module || "",
                applicationLocation = URL.resolve(mrRequire.getLocation(), params.package || ".");

            // execute the preloading plan and stall the fallback module loader
            // until it has finished
            if (global.preload) {

                var bundleDefinitions = {};
                var getDefinition = function (name) {
                    return bundleDefinitions[name] =
                        bundleDefinitions[name] ||
                            Promise.resolve();
                };

                global.bundleLoaded = function (name) {
                    return getDefinition(name).resolve();
                };

                var preloading = {
                    promise: new Promise(function (resolve, reject) {
                        preloading.resolve = resolve;
                        preloading.reject = reject;
                    })
                };
                config.preloaded = preloading.promise;
                // preload bundles sequentially

                var preloaded = Promise.resolve();
                global.preload.forEach(function (bundleLocations) {
                    preloaded = preloaded.then(function () {
                        return Promise.all(bundleLocations.map(function (bundleLocation) {
                            load(bundleLocation);
                            return getDefinition(bundleLocation).promise;
                        }));
                    });
                });

                // then release the module loader to run normally
                preloading.resolve(preloaded.then(function () {
                    delete global.preload;
                    delete global.bundleLoaded;
                }));
            }

            mrRequire.loadPackage({
                location: params.mrLocation,
                hash: params.mrHash
            }, config).then(function (mrRequire) {
                mrRequire.inject("mini-url", URL);
                mrRequire.inject("promise", Promise);
                mrRequire.inject("require", mrRequire);

                if ("autoPackage" in params) {
                    mrRequire.injectPackageDescription(applicationLocation, {});
                }

                return mrRequire.loadPackage({
                    location: applicationLocation,
                    hash: params.applicationHash
                }).then(function (pkg) {

                    // Expose global require and mr
                    global.require = global.mr = pkg;

                    return pkg.async(applicationModuleId);
                });
            });
        });
    };

    if (typeof window !== "undefined") {
        if (global.__MONTAGE_REQUIRE_LOADED__) {
            console.warn("MontageRequire already loaded!");
        } else {
            global.__MONTAGE_REQUIRE_LOADED__ = true;
            exports.initMontageRequire();
        }
    } else {
        // may cause additional exports to be injected:
        exports.getPlatform();
    }
}));
