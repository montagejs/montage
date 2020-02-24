/*jshint node:true, worker:false */
/*global importScripts, PATH_TO_MONTAGE, self */

var worker;
(function (root, factory) {
    root.MontageWorker = factory({}, {}, {});
}(this, function (require, exports, module) {
    worker = {
        /********************
         * Resolve the url to a script given
         * the base and relative URL
         */
        makeResolve: function () {
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
                return function (base, relative) {
                    return base + relative;
                };
            }
        },

        /********************
         * Load a resource at the given location
         *
         * Note: On a browser the loadCallback is called with the
         *       <script> tag as the argument
         */
        load: function (location,loadCallback) {
            importScripts(location);
            if (loadCallback) {
                loadCallback(location);
            }
        },

        _initializeGlobalListeners: function () {
            var self = this,
                globalEvents = ["activate", "install", "message", "offline", "online","periodicsync", "sync"],
                nativeAddEventListener = global.addEventListener;

            global.__MontageGlobalListeners__ = new Map();

            globalEvents.forEach(function (eventName) {
                self._initializeGlobalListener(eventName);
            });

            Object.defineProperty(global, "addEventListener", {
                value: function () {
                    var eventName = arguments[0];
                    if (global.__MontageGlobalListeners__.has(eventName)) {
                        global.__MontageGlobalListeners__.get(eventName).push(arguments[1]);
                    } else {
                        return nativeAddEventListener.apply(global, arguments);
                    }
                }
            });
        },

        _initializeGlobalListener: function (eventName) {
            var self = this;
            global.__MontageGlobalListeners__.set(eventName, []);
            global.addEventListener(eventName, function (event) {
                var listeners = global.__MontageGlobalListeners__.get(eventName);
                listeners.forEach(function (listener) {
                    listener(event);
                });
            });
        },

        getParams: function () {
            var path;
            if (!this._params) {

                if (self.MontageParams) {
                    this._params = Object.assign({}, self.MontageParams);
                } else {
                    path = PATH_TO_MONTAGE;
                    if (!path) {
                        path = self.registration.scope.replace(/[^\/]*\.html$/, ""),
                        path = path.replace(/[^\/]*\/?$/, "");
                    }
                    this._params = {
                        montageLocation: path
                    };
                }
            }
            return this._params;
        },

        bootstrap: function (callback) {
            var Require, Promise, URL;

            var params = this.getParams();

            var resolve = this.makeResolve();

            function callbackIfReady() {
                if (Require && URL) {
                    callback(Require, Promise, URL);
                }
            }

            // determine which scripts to load
            var pending = {
                "require": "node_modules/mr/require.js",
                "require/worker": "node_modules/mr/worker.js",
                "promise": "node_modules/bluebird/js/browser/bluebird.min.js"
                // "shim-string": "core/shim/string.js" // needed for the `endsWith` function.
            };

            // miniature module system
            var definitions = {};
            var bootModules = {};
            function bootRequire(id) {
                if (!bootModules[id] && definitions[id]) {
                    var exports = bootModules[id] = {};
                    bootModules[id] = definitions[id](bootRequire, exports) || exports;
                }
                return bootModules[id];
            }

            // execute bootstrap scripts
            function allModulesLoaded() {
                URL = bootRequire("mini-url");
                Promise = bootRequire("promise");
                Require = bootRequire("require");
                exports.Require = Require;
                // if we get past the for loop, bootstrapping is complete.  get rid
                // of the bootstrap function and proceed.
                delete global.bootstrap;

                callbackIfReady();
            }

            // register module definitions for deferred,
            // serial execution
            global.bootstrap = function (id, factory) {
                definitions[id] = factory;
                delete pending[id];
                for (var module in pending) {
                    if (pending.hasOwnProperty(module)) {
                        // this causes the function to exit if there are any remaining
                        // scripts loading, on the first iteration.  consider it
                        // equivalent to an array length check
                        return;
                    }
                }


                allModulesLoaded();
            };

            this._initializeGlobalListeners();


            // load in parallel, but only if we're not using a preloaded cache.
            // otherwise, these scripts will be inlined after already
            if (typeof global.BUNDLE === "undefined") {
                var montageLocation = resolve(global.location, params.montageLocation);

                //Special Case bluebird for now:
                worker.load(resolve(montageLocation, pending.promise), function() {

                    delete pending.promise;

                    //global.bootstrap cleans itself from global once all known are loaded. "bluebird" is not known, so needs to do it first
                    global.bootstrap("bluebird", function (require, exports) {
                        return global.Promise;
                    });
                    global.bootstrap("promise", function (require, exports) {
                        return global.Promise;
                    });

                    global.bootstrap("mini-url", function (require, exports) {
                        exports.resolve = resolve;
                    });

                    for (var module in pending) {
                        if (pending.hasOwnProperty(module)) {
                            worker.load(resolve(montageLocation, pending[module]));
                        }
                    }
                });

            } else {

                global.nativePromise = global.Promise;
                Object.defineProperty(global, "Promise", {
                    configurable: true,
                    set: function(PromiseValue) {
                        Object.defineProperty(global, "Promise", {
                            value: PromiseValue
                        });

                        global.bootstrap("bluebird", function (require, exports) {
                            return global.Promise;
                        });
                        global.bootstrap("promise", function (require, exports) {
                            return global.Promise;
                        });
                    }
                });
                global.bootstrap("mini-url", function (require, exports) {
                    exports.resolve = resolve;
                });
            }

            // global.bootstrap("shim-string");

            // one module loaded for free, for use in require.js, worker.js


        },
        initMontage: function (montageRequire, applicationRequire, params) {
            var dependencies = [
                "core/core",
                "core/event/event-manager",
                "core/serialization/deserializer/montage-reviver",
                "core/logger"
            ];

            var Promise = montageRequire("core/promise").Promise;
            var deepLoadPromises = [];
            var self = this;

            for (var i = 0, iDependency; (iDependency = dependencies[i]); i++) {
                deepLoadPromises.push(montageRequire.deepLoad(iDependency));
            }

            //Suppress Bluebird unhandled rejection error
            Promise.onPossiblyUnhandledRejection(function(e, promise) {
                console.warn("[Bluebird] Unhandled Rejection: " + e.message);
                console.warn(e);
            });


            return Promise.all(deepLoadPromises).then(function () {
                for (var i = 0, iDependency; (iDependency = dependencies[i]); i++) {
                    montageRequire(iDependency);
                }

                // var Montage = montageRequire("core/core").Montage;
                // var EventManager = montageRequire("core/event/event-manager").EventManager;
                var defaultEventManager = montageRequire("core/event/event-manager").defaultEventManager;
                var MontageDeserializer = montageRequire("core/serialization/deserializer/montage-deserializer").MontageDeserializer;
                var MontageReviver = montageRequire("core/serialization/deserializer/montage-reviver").MontageReviver;
                // var logger = montageRequire("core/logger").logger;
                var application;

                exports.MontageDeserializer = MontageDeserializer;
                exports.Require.delegate = exports;

                // montageWillLoad is mostly for testing purposes
                if (typeof global.montageWillLoad === "function") {
                    global.montageWillLoad();
                }

                // Load the application

                var appProto = applicationRequire.packageDescription.workerApplicationPrototype,
                    applicationLocation, appModulePromise;


                if (appProto) {
                    applicationLocation = MontageReviver.parseObjectLocationId(appProto);
                    appModulePromise = applicationRequire.async(applicationLocation.moduleId);
                } else {
                    appModulePromise = montageRequire.async("core/worker-application");
                }


                return appModulePromise.then(function (exports) {
                    var WorkerApplication = exports[(applicationLocation ? applicationLocation.objectName : "WorkerApplication")];
                    application = new WorkerApplication();
                    defaultEventManager.application = application;
                    application.eventManager = defaultEventManager;

                    return application._load(applicationRequire, function () {
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
        }
    };

    exports.compileMJSONFile = function (mjson, require, moduleId) {
        var deserializer = new exports.MontageDeserializer();
        deserializer.init(mjson, require, void 0, require.location + moduleId);
        return deserializer.deserializeObject();
    };

    return exports;
}));



