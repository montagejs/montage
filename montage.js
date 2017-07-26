/*global define, module, console */
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define('montage', [], factory);
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
    /*jshint evil:true */
    global = globalEval('this'); 
    /*jshint evil:false */

    // Here we expose global for legacy mop support.
    // TODO move to mr cause it's loader role to expose
    // TODO make sure mop closure has it also cause it's mop role to expose
    global.global = global;

    var browser = {

        makeResolveUrl: function makeResolveUrl() {    

                var isAbsolutePattern = /^[\w\-]+:/,
                    baseElement = document.querySelector("base"),
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
            },

        load: function (location, callback) {
            var script;
            callback = callback || function noop() {};
            function finallyHandler() {
                // remove clutter
                if (script.parentNode) {
                    script.parentNode.removeChild(script);   
                }
            }
            script = document.createElement("script");
            script.setAttribute('async', '');
            script.setAttribute('src', location + '');
            script.onload = function () {
                callback(null, script);
                finallyHandler();
            };
            script.onerror = function (err) {
                callback(new Error("Can't load script " + JSON.stringify(location)), script);
                finallyHandler();
            };
            document.querySelector("head").appendChild(script);
        },

        getParams: function () {
            var i, j,
                match,
                script,
                montage,
                attr,
                name;
            if (!this._params) {
                this._params = {};
                // Find the <script> that loads us, so we can divine our
                // parameters from its attributes.
                var scripts = document.getElementsByTagName("script");
                for (i = 0; i < scripts.length; i++) {
                    script = scripts[i];
                    montage = false;
                    if (script.src && (match = script.src.match(/^(.*)montage.js(?:[\?\.]|$)/i))) {
                        this._params.montageLocation = match[1];
                        montage = true;
                    }
                    if (script.hasAttribute("data-montage-location")) {
                        this._params.montageLocation = script.getAttribute("data-montage-location");
                        montage = true;
                    }
                    if (montage) {
                        if (script.dataset) {
                            for (name in script.dataset) {
                                if (script.dataset.hasOwnProperty(name)) {
                                    this._params[name] = script.dataset[name];   
                                }
                            }
                        } else if (script.attributes) {
                            var dataRe = /^data-(.*)$/, // TODO cache RegEx
                                letterAfterDash = /-([a-z])/g,
                                upperCaseChar = function (_, c) {
                                    return c.toUpperCase();
                                };

                            for (j = 0; j < script.attributes.length; j++) {
                                attr = script.attributes[j];
                                match = attr.name.match(dataRe);
                                if (match) {
                                    this._params[match[1].replace(letterAfterDash, upperCaseChar)] = attr.value;
                                }
                            }
                        }
                        // Permits multiple montage.js <scripts>; by
                        // removing as they are discovered, next one
                        // finds itself.
                        script.parentNode.removeChild(script);
                        break;
                    }
                }
            }
            return this._params;
        },

        bootstrap: function (callback) {
            var self = this,
                params = self.getParams(),
                location = params.montageLocation,
                resolveUrl = this.makeResolveUrl();

            // determine which scripts to load
            var dependencies = {
                "mini-url": {
                    // Preloaded
                    shim: function (bootRequire, exports) {
                        return {
                            resolve: resolveUrl
                        };
                    }
                },
                "promise": {
                    global: "Promise",
                    location: "node_modules/bluebird/js/browser/bluebird.min.js",
                },
                "require": {
                    location: "node_modules/mr/require.js",
                },
                "require/browser": {
                    location: "node_modules/mr/browser.js",
                }
            };

            function bootModule(id) {
                //console.log('bootModule', id, factory);

                if (!dependencies.hasOwnProperty(id)) {
                    return;
                }

                var module = dependencies[id];

                if (
                    module && 
                        typeof module.exports === "undefined"  && 
                            typeof module.factory === "function"
                ) {
                    module.exports = module.factory(bootModule, (module.exports = {})) || module.exports;
                }

                return module.exports;
            }

            // Save initial bootstrap
            var initalBoostrap = global.bootstrap;

            // register module definitions for deferred, serial execution
            function bootstrapModule(id, factory) {
                //console.log('bootstrapModule', id, factory);

                if (!dependencies.hasOwnProperty(id)) {
                    return;
                }
                
                dependencies[id].factory = factory;
                
                for (id in dependencies) {
                    if (dependencies.hasOwnProperty(id)) {
                        // this causes the function to exit if there are any remaining
                        // scripts loading, on the first iteration.  consider it
                        // equivalent to an array length check
                        if (typeof dependencies[id].factory === "undefined") {
                            //console.log('waiting for', id);
                            return;
                        }
                    }
                }

                // if we get past the for loop, bootstrapping is complete.  get rid
                // of the bootstrap function and proceed.
                delete global.bootstrap;

                // Restore inital Boostrap
                if (initalBoostrap) {
                    global.bootstrap = initalBoostrap;   
                }

                // At least bootModule in order
                var mrPromise = bootModule("promise"),
                    miniURL = bootModule("mini-url"),
                    mrRequire = bootModule("require");

                callback(mrRequire, mrPromise, miniURL);
            }

            function bootstrapModuleScript(module, err, script) {
                if (err) {
                    // Fallback on flat strategy for missing nested module
                    if (module.strategy === 'nested') {
                        module.strategy = 'flat';
                        module.script = resolveUrl(resolveUrl(location, '../../'), module.location);
                        self.load(module.script, bootstrapModuleScript.bind(null, module));
                    } else {
                        throw err;   
                    }
                } else if (module.export || module.global) {

                    bootstrapModule(module.id, function (bootRequire, exports) {
                        if (module.export) {
                            exports[module.export] = global[module.global]; 
                        } else {
                            return global[module.global];
                        }
                    });
                }
            }

            // Expose bootstrap
            global.bootstrap = bootstrapModule;

            // Load other module and skip promise
            for (var id in dependencies) {
                if (dependencies.hasOwnProperty(id)) {
                    var module = dependencies[id],
                        paramModuleLocation = id + 'Location';

                    if (typeof module === 'string') {
                        module = {
                            id: id,
                            location: module
                        };
                    } else {
                        module.id = id;   
                    }

                    // Update dependency
                    dependencies[id] = module;  
                    // Update locatiom from param
                    module.location = params.hasOwnProperty(paramModuleLocation) ? params[paramModuleLocation] : module.location;

                    // Reset bad exports
                    if (module.exports !== null && module.exports !== void 0) {
                        bootstrapModule(module.id, module.exports);
                    } else if (typeof module.shim !== "undefined") {
                        bootstrapModule(module.id, module.shim);
                    } else {
                        module.strategy = "nested";
                        module.script = resolveUrl(location, module.location);
                        self.load(module.script, bootstrapModuleScript.bind(null, module));
                    }
                }
            }
        }
    };

    /**
     * Initializes Montage and creates the application singleton if
     * necessary.
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
                        montageRequire.async("jshint/dist/jshint")
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
                    //exports.Require.delegate = this;

                    var dependencies = [
                        "core/core",
                        "core/event/event-manager",
                        "core/serialization/deserializer/montage-reviver",
                        "core/logger"
                    ];

                    //var Promise = montageRequire("core/promise").Promise;
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
                        var defaultEventManager = montageRequire("core/event/event-manager").defaultEventManager;
                        var MontageReviver = montageRequire("core/serialization/deserializer/montage-reviver").MontageReviver;
                        var logger = montageRequire("core/logger").logger;

                        var application;

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
                });
            });
        });
    };

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