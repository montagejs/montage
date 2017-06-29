/*global define */
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['exports', 'require', 'bluebird'], function (exports, require, bluebird) {
            factory((root.montage = exports), require, bluebird);
        });
    } else if (typeof exports === 'object') {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports,
        // like Node.
        factory(exports);
    } else {
        // Browser globals (root is window)
        factory((root.montage = {}));
    }
}(this, function (exports, Require, Promise) {

    "use strict";

    // reassigning causes eval to not use lexical scope.
    var globalEval = eval,
    /*jshint evil:true */
    global = globalEval('this'); 
    /*jshint evil:false */

    // Here we expose global for legacy mop support.
    // TODO move to mr cause it's loader role to expose
    // TODO make sure mop closure has it also cause it's mop role to expose
    global.global = global;

    //
    // Browser Platform 
    //

    var paramsCache,
        dataAttrPreffix = 'montage',
        bootstrapScriptName = 'montage',
        dataAttrPattern = /^data-(.*)$/,
        boostrapPattern = new RegExp('^(.*)' + bootstrapScriptName + '.js(?:[\?\.]|$)', 'i'),
        letterAfterDashPattern = /-([a-z])/g;

    function upperCaseChar(_, c) {
        return c.toUpperCase();
    }

    function getParams() {
        var i, j,
            match, script, scripts,
            scriptLocation, attr, name;

        if (!paramsCache) {
            paramsCache = {};
            // Find the <script> that loads us, so we can divine our
            // parameters from its attributes.
            scripts = document.getElementsByTagName("script");
            for (i = 0; i < scripts.length; i++) {
                script = scripts[i];
                if (script.src && (match = script.src.match(boostrapPattern))) {
                    scriptLocation = match[1];
                }
                if (script.hasAttribute("data-" + dataAttrPreffix + "-location")) {
                    scriptLocation = resolve(window.location, script.getAttribute("data-" + dataAttrPreffix + "-location"));
                }
                if (scriptLocation) {
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
                    paramsCache.bootstrapLocation = paramsCache[dataAttrPreffix + 'Location'] = scriptLocation;
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
            document.head.appendChild(script);
        } else {
            errorCallback(new Error("document not supported"));
            finallyHandler();
        }   
    }

    // mini-url library
    function makeResolve() {
            
        try {

            var testHost = "http://example.org",
                testPath = "/test.html",
                resolved = new URL(testPath, testHost).href;

            if (!resolved || resolved !== testHost + testPath) {
                throw new Error('NotSupported');
            }

            return function (base, relative) {
                return new URL(relative, base).href;
            };

        } catch (err) {

            console.log(err);

            var IS_ABSOLUTE_REG = /^[\w\-]+:/,
                head = document.querySelector("head"),
                currentBaseElement = head.querySelector("base"),
                baseElement = document.createElement("base"),
                relativeElement = document.createElement("a"),
                needsRestore = false;

                if(currentBaseElement) {
                    needsRestore = true;
                }
                else {
                    currentBaseElement = document.createElement("base");
                }

            // Optimization, we won't check ogain if there's a base tag.
            baseElement.href = "";

            return function (base, relative) {
                var restore;

                if (!needsRestore) {
                    head.appendChild(currentBaseElement);
                }

                base = String(base);
                if (IS_ABSOLUTE_REG.test(base) === false) {
                    throw new Error("Can't resolve from a relative location: " + JSON.stringify(base) + " " + JSON.stringify(relative));
                }
                if(needsRestore) {
                    restore = currentBaseElement.href;
                }
                currentBaseElement.href = base;
                relativeElement.href = relative;
                var resolved = relativeElement.href;
                if (needsRestore) {
                    currentBaseElement.href = restore;
                } else {
                    head.removeChild(currentBaseElement);
                }
                return resolved;
            };
        }
    }

    var readyStatePattern = /interactive|complete/;
    var bootstrap = function (callback) {

        callback = callback || callbackApplication;

        // determine which scripts to load
        var pending = {
            "promise": "node_modules/bluebird/js/browser/bluebird.min.js",
            "require": "node_modules/mr/require.js",
            "require/browser": "node_modules/mr/browser.js"
        };

        var domLoaded, Require, URL,
            resolve = makeResolve(),
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

        // register module definitions for deferred, serial execution
        function bootstrapModule(id, factory) {
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

        function bootstrapModulePromise(Promise) {
            bootstrapModule("bluebird", function (mrRequire, exports) {
                return Promise;
            });

            bootstrapModule("promise", function (mrRequire, exports) {
                return Promise;
            });
        }

        // Expose bootstrap
        global.bootstrap = bootstrapModule;

        // one module loaded for free, for use in require.js, browser.js
        bootstrapModule("mini-url", function (mrRequire, exports) {
            exports.resolve = resolve;
        });

        // load in parallel, but only if we're not using a preloaded cache.
        // otherwise, these scripts will be inlined after already
        if (!global.preload || !global.BUNDLE) {
            var bootstrapLocation = resolve(window.location, params.bootstrapLocation);

            if (Promise) {
                //global.bootstrap cleans itself from window once all known are loaded. "bluebird" is not known, so needs to do it first
                bootstrapModulePromise(Promise)
            } else {
                var promiseLocation = params.promiseLocation || resolve(bootstrapLocation, pending.promise);
                // Special Case bluebird for now:
                load(promiseLocation, function() {
                    bootstrapModulePromise((Promise = window.Promise));
                });   
            }

            // Load other module and skip promise
            for (var id in pending) {
                if (pending.hasOwnProperty(id)) {
                    if (id !== 'promise') { // Let special case load promise
                        load(resolve(bootstrapLocation, pending[id]));   
                    }
                }
            }       
        }
    };

    var browser = {
        getParams: getParams,
        bootstrap: bootstrap
    };

    //
    // External API
    //

    // Bootstrapping for multiple-platforms
    exports.getPlatform = function () {
        if (typeof window !== "undefined" && window && window.document) {
            return browser;
        } else if (typeof process !== "undefined") {
            return require("./node.js");
        } else {
            throw new Error("Platform not supported.");
        }
    };

    exports.initMontageApp = function (montageRequire, applicationRequire, params) {

        //exports.Require.delegate = this;

        var dependencies = [
            "core/core",
            "core/event/event-manager",
            "core/serialization/deserializer/montage-reviver",
            "core/logger"
        ];

        var Promise = montageRequire("core/promise").Promise;
        var deepLoadPromises = [];

        for(var i=0,iDependency;(iDependency = dependencies[i]);i++) {
          deepLoadPromises.push(montageRequire.deepLoad(iDependency));
        }

        return Promise.all(deepLoadPromises)
        .then(function () {

            for(var i=0,iDependency;(iDependency = dependencies[i]);i++) {
              montageRequire(iDependency);
            }

            var Montage = montageRequire("core/core").Montage;
            var EventManager = montageRequire("core/event/event-manager").EventManager;
            var MontageReviver = montageRequire("core/serialization/deserializer/montage-reviver").MontageReviver;
            var logger = montageRequire("core/logger").logger;

            var defaultEventManager, application;

            // Load the event-manager
            defaultEventManager = new EventManager().initWithWindow(window);

            // montageWillLoad is mostly for testing purposes
            if (typeof global.montageWillLoad === "function") {
                global.montageWillLoad();
            }

            // Load the application

            var appProto = applicationRequire.packageDescription.applicationPrototype,
                applicationLocation, appModulePromise;
            if (appProto) {
                applicationLocation = MontageReviver.parseObjectLocationId(appProto);
                appModulePromise = applicationRequire.async(applicationLocation.moduleId);
            } else {
                appModulePromise = montageRequire.async("core/application");
            }

            return appModulePromise.then(function (exports) {
                var Application = exports[(applicationLocation ? applicationLocation.objectName : "Application")];
                application = new Application();
                defaultEventManager.application = application;
                application.eventManager = defaultEventManager;

                return application._load(applicationRequire, function() {
                    if (params.module) {
                        // If a module was specified in the config then we initialize it now
                        applicationRequire.async(params.module);
                    }
                    if (typeof global.montageDidLoad === "function") {
                        global.montageDidLoad();
                    }
                });
            });

        });
    };

    /**
     * Initializes Montage and creates the application singleton if necessary.
     */
    exports.initMontage = function () {

        var platform = exports.getPlatform();

        // Platform dependent
        platform.bootstrap(function (Require, Promise, URL) {
            var params = platform.getParams();
            var config = {
                // This takes <base> into account
                location: Require.getLocation()
            };

            exports.Require = Require;

            var montageLocation = URL.resolve(config.location, params.montageLocation);
            var location = URL.resolve(config.location, params.package || ".");
            var applicationHash = params.applicationHash;

            if (typeof global.BUNDLE === "object") {
                var bundleDefinitions = {};
                var getDefinition = function (name) {
                     if(!bundleDefinitions[name]) {
                         var defer = bundleDefinitions[name] = {};
                         var deferPromise = new Promise(function(resolve, reject) {
                             defer.resolve = resolve;
                             defer.reject = reject;
                         });
                         defer.promise = deferPromise;
                         return defer;
                    }

                    return bundleDefinitions[name];
                };
                global.bundleLoaded = function (name) {
                    getDefinition(name).resolve();
                };

                var preloading = {};
                var preloadingPromise = new Promise(function(resolve, reject) {
                    preloading.resolve = resolve;
                    preloading.reject = reject;
                });
                preloading.promise = preloadingPromise;

                config.preloaded = preloading.promise;
                // preload bundles sequentially
                var preloaded = Promise.resolve();
                global.BUNDLE.forEach(function (bundleLocations) {
                    preloaded = preloaded.then(function () {
                        return Promise.all(bundleLocations.map(function (bundleLocation) {
                            browser.load(bundleLocation);
                            return getDefinition(bundleLocation).promise;
                        }));
                    });
                });
                // then release the module loader to run normally
                preloading.resolve(preloaded.then(function () {
                    delete global.BUNDLE;
                    delete global.bundleLoaded;
                }));
            }

            var applicationRequirePromise;

            if (!("remoteTrigger" in params)) {
                if ("autoPackage" in params) {
                    Require.injectPackageDescription(location, {
                        dependencies: {
                            montage: "*"
                        }
                    }, config);
                } else {
                    // handle explicit package.json location
                    if (location.slice(location.length - 5) === ".json") {
                        var packageDescriptionLocation = location;
                        location = URL.resolve(location, ".");
                        Require.injectPackageDescriptionLocation(
                            location,
                            packageDescriptionLocation,
                            config
                        );
                    }
                }
                applicationRequirePromise = Require.loadPackage({
                    location: location,
                    hash: applicationHash
                }, config);
            } else {
                // allows the bootstrapping to be remote controlled by the
                // parent window, with a dynamically generated package
                // description
                window.postMessage({
                    type: "montageReady"
                }, "*");

                var trigger = new Promise(function(resolve) {
                    var messageCallback = function (event) {
                        if (
                            params.remoteTrigger === event.origin &&
                            (event.source === window || event.source === window.parent)
                        ) {
                            switch (event.data.type) {
                            case "montageInit":
                                window.removeEventListener("message", messageCallback);
                                resolve([event.data.location, event.data.injections]);
                                break;
                            case "isMontageReady":
                                // allow the injector to query the state in case
                                // they missed the first message
                                window.postMessage({
                                    type: "montageReady"
                                }, "*");
                            }
                        }
                    };

                    window.addEventListener("message", messageCallback);
                });

                applicationRequirePromise = trigger.spread(function (location, injections) {
                    var promise = Require.loadPackage({
                        location: location,
                        hash: applicationHash
                    }, config);
                    if (injections) {
                        promise = promise.then(function (applicationRequire) {
                            location = URL.resolve(location, ".");
                            var packageDescriptions = injections.packageDescriptions,
                                packageDescriptionLocations = injections.packageDescriptionLocations,
                                mappings = injections.mappings,
                                dependencies = injections.dependencies,
                                index, injectionsLength;

                            if (packageDescriptions) {
                                injectionsLength = packageDescriptions.length;
                                for (index = 0; index < injectionsLength; index++) {
                                    applicationRequire.injectPackageDescription(
                                        packageDescriptions[index].location,
                                        packageDescriptions[index].description);
                                }
                            }

                            if (packageDescriptionLocations) {
                                injectionsLength = packageDescriptionLocations.length;
                                for (index = 0; index < injectionsLength; index++) {
                                    applicationRequire.injectPackageDescriptionLocation(
                                        packageDescriptionLocations[index].location,
                                        packageDescriptionLocations[index].descriptionLocation);
                                }
                            }

                            if (mappings) {
                                injectionsLength = mappings.length;
                                for (index = 0; index < injectionsLength; index++) {
                                    applicationRequire.injectMapping(
                                        mappings[index].dependency,
                                        mappings[index].name);
                                }
                            }

                            if (dependencies) {
                                injectionsLength = dependencies.length;
                                for (index = 0; index < injectionsLength; index++) {
                                    applicationRequire.injectDependency(
                                        dependencies[index].name,
                                        dependencies[index].version);
                                }
                            }

                            return applicationRequire;
                        });
                    }

                    return promise;
                });
            }

            applicationRequirePromise.then(function (applicationRequire) {
                return applicationRequire.loadPackage({
                    location: montageLocation,
                    hash: params.montageHash
                })
                .then(function (montageRequire) {
                    // load the promise package so we can inject the bootstrapped
                    // promise library back into it
                    var promiseLocation;
                    if (params.promiseLocation) {
                        promiseLocation = URL.resolve(Require.getLocation(), params.promiseLocation);
                    } else {
                        //promiseLocation = URL.resolve(montageLocation, "packages/mr/packages/q");
                        //node tools/build --features="core timers call_get" --browser
                        promiseLocation = URL.resolve(montageLocation, "node_modules/bluebird");
                    }

                    var result = [
                        montageRequire,
                        montageRequire.loadPackage({
                            location: promiseLocation,
                            hash: params.promiseHash
                        })
                    ];

                    return result;
                })
                .spread(function (montageRequire, promiseRequire) {

                    montageRequire.inject("core/mini-url", URL);
                    montageRequire.inject("core/promise", {Promise: Promise});
                    promiseRequire.inject("bluebird", Promise);
                    
                    // This prevents bluebird to be loaded twice by mousse's code
                    promiseRequire.inject("js/browser/bluebird", Promise);
                    
                    // install the linter, which loads on the first error
                    config.lint = function (module) {
                        montageRequire.async("jslint/lib/jslint")
                        .then(function (JSHINT) {
                            if (!JSHINT.JSHINT(module.text)) {
                                console.warn("JSHint Error: "+module.location);
                                JSHINT.JSHINT.errors.forEach(function (error) {
                                    if (error) {
                                        console.warn("Problem at line "+error.line+" character "+error.character+": "+error.reason);
                                        if (error.evidence) {
                                            console.warn("    " + error.evidence);
                                        }
                                    }
                                });
                            }
                        });
                    };

                    // Expose global require and mr
                    global.require = global.mr = applicationRequire;

                    return exports.initMontageApp(montageRequire, applicationRequire, params);
                });
            });
        });
    };

    if (typeof window !== "undefined") {
        if (global.__MONTAGE_LOADED__) {
            console.warn("Montage already loaded!");
        } else {
            global.__MONTAGE_LOADED__ = true;
            exports.initMontage();
        }
    } else {
        // may cause additional exports to be injected:
        exports.getPlatform();
    }

    return exports;
}));
