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
/*global BUNDLE */
if (typeof window !== "undefined") {

    // Workaround for window.Touch on desktop browsers
    if (!("ontouchstart" in window)) {
        window.Touch = null;
    }

    document._montageTiming = {}
    document._montageTiming.loadStartTime = Date.now();

    // Give a threshold before we decide we need to show the bootstrapper progress
    // Applications that use our loader will interact with this timeout
    // and class name to coordinate a nice loading experience. Applications that do not will
    // just go about business as usual and draw their content as soon as possible.
    window.addEventListener("DOMContentLoaded", function() {
        var bootstrappingDelay = 1000;
        document._montageStartBootstrappingTimeout = setTimeout(function() {
            document._montageStartBootstrappingTimeout = null;

            var root = document.documentElement;
            if(!!root.classList) {
                root.classList.add("montage-app-bootstrapping");
            } else {
                root.className = root.className + " montage-app-bootstrapping";
            }

            document._montageTiming.bootstrappingStartTime = Date.now();
        }, bootstrappingDelay);
    });

}

(function (definition) {
    if (typeof require !== "undefined") {
        // CommonJS / NodeJS
        definition.call(
            typeof global !== "undefined" ? global : this,
            require,
            exports,
            module
        );
    } else {
        // <script>
        definition({}, {}, {});
    }
})(function (require, exports, module) {

    // The global context object
    global = this;

    /**
     * Initializes Montage and creates the application singleton if
     * necessary.
     */
    exports.initMontage = function () {
        var platform = exports.getPlatform();

        // Platform dependent
        platform.bootstrap(function (Require, Promise, URL) {
            var params = platform.getParams();
            var config = platform.getConfig();

            var montageLocation = URL.resolve(Require.getLocation(), params.montageLocation);

            // setup the reel loader
            config.makeLoader = function (config) {
                return exports.ReelLoader(
                    config,
                    Require.makeLoader(config)
                );
            };

            // setup serialization compiler
            config.makeCompiler = function (config) {
                return exports.MetaCompiler(
                    config,
                    exports.SerializationCompiler(
                        config,
                        exports.TemplateCompiler(
                            config,
                            Require.makeCompiler(config)
                        )
                    )
                );
            };

            var location = URL.resolve(config.location, params["package"] || ".");
            var applicationHash = params.applicationHash;

            if (typeof BUNDLE === "object") {
                var bundleDefinitions = {};
                var getDefinition = function (name) {
                    return bundleDefinitions[name] =
                        bundleDefinitions[name] ||
                            Promise.defer();
                };
                global.bundleLoaded = function (name) {
                    getDefinition(name).resolve();
                };
                var preloading = Promise.defer();
                config.preloaded = preloading.promise;
                // preload bundles sequentially
                var preloaded = Promise.resolve();
                BUNDLE.forEach(function (bundleLocations) {
                    preloaded = preloaded.then(function () {
                        return Promise.all(bundleLocations.map(function (bundleLocation) {
                            browser.load(bundleLocation);
                            return getDefinition(bundleLocation).promise;
                        }));
                    });
                });
                // then release the module loader to run normally
                preloading.resolve(preloaded.then(function () {
                    delete BUNDLE;
                    delete bundleLoaded;
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
                var trigger = Promise.defer();
                window.postMessage({
                    type: "montageReady"
                }, "*");
                var messageCallback = function (event) {
                    if (
                        params.remoteTrigger === event.origin &&
                        (event.source === window || event.source === window.parent)
                    ) {
                        switch (event.data.type) {
                        case "montageInit":
                            window.removeEventListener("message", messageCallback);
                            trigger.resolve([event.data.location, event.data.injections]);
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

                applicationRequirePromise = trigger.promise.spread(function (location, injections) {
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

            applicationRequirePromise
            .then(function (applicationRequire) {
                applicationRequire.loadPackage({
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
                        promiseLocation = URL.resolve(montageLocation, "packages/mr/packages/q");
                    }

                    return [
                        montageRequire,
                        montageRequire.loadPackage({
                            location: promiseLocation,
                            hash: params.promiseHash
                        })
                    ];
                })
                .spread(function (montageRequire, promiseRequire) {
                    montageRequire.inject("core/mini-url", URL);
                    montageRequire.inject("core/promise", {Promise: Promise});
                    promiseRequire.inject("q", Promise);

                    // install the linter, which loads on the first error
                    config.lint = function (module) {
                        montageRequire.async("core/jshint")
                        .then(function (JSHINT) {
                            if (!JSHINT.JSHINT(module.text)) {
                                console.warn("JSHint Error: "+module.location);
                                JSHINT.JSHINT.errors.forEach(function(error) {
                                    if (error) {
                                        console.warn("Problem at line "+error.line+" character "+error.character+": "+error.reason);
                                        if (error.evidence) {
                                            console.warn("    " + error.evidence);
                                        }
                                    }
                                });
                            }
                        })
                        .done();
                    };

                    global.require = applicationRequire;
                    global.montageRequire = montageRequire;
                    platform.initMontage(montageRequire, applicationRequire, params);
                });
            })
            .done();

        });

    };

    /**
     Adds "_montage_metadata" property to all objects and function attached to
     the exports object.
     @see Compiler middleware in require/require.js
     @param config
     @param compiler
     */
    var reverseReelExpression = /((.*)\.reel)\/\2$/;
    var reverseReelFunction = function ($0, $1) { return $1 };
    exports.SerializationCompiler = function(config, compile) {
        return function(module) {
            compile(module);
            if (!module.factory)
                return;
            var defaultFactory = module.factory;
            module.factory = function(require, exports, module) {
                defaultFactory.call(this, require, exports, module);
                for (var name in exports) {
                    var object = exports[name];
                    // avoid attempting to initialize a non-object
                    if (!(object instanceof Object)) {
                    // avoid attempting to reinitialize an aliased property
                    } else if (object.hasOwnProperty("_montage_metadata") && !object._montage_metadata.isInstance) {
                        object._montage_metadata.aliases.push(name);
                        object._montage_metadata.objectName = name;
                    } else if (!Object.isSealed(object)) {
                        var id = module.id.replace(
                            reverseReelExpression,
                            reverseReelFunction
                        );
                        Object.defineProperty(
                            object,
                            "_montage_metadata",
                            {
                                value: {
                                    require: require,
                                    module: id,
                                    moduleId: id, // deprecated
                                    property: name,
                                    objectName: name, // deprecated
                                    aliases: [name],
                                    isInstance: false
                                }
                            }
                        );
                    }
                }
            };
            return module;
        };
    };

    /**
     * Allows reel directories to load the contained eponymous JavaScript
     * module.
     * @see Loader middleware in require/require.js
     * @param config
     * @param loader the next loader in the chain
     */
    var reelExpression = /([^\/]+)\.reel$/;
    exports.ReelLoader = function (config, load) {
        return function (id, module) {
            var match = reelExpression.exec(id);
            if (match) {
                module.redirect = id + "/" + match[1];
                return module;
            } else {
                return load(id, module);
            }
        };
    };

    /**
     * Allows the .meta files to be loaded as json
     * @see Compiler middleware in require/require.js
     * @param config
     * @param compile
     */
    var metaExpression = /\.meta/;
    exports.MetaCompiler = function (config, compile) {
        return function (module) {
            var json = (module.location || "").match(metaExpression);
            if (json) {
                module.exports = JSON.parse(module.text);
                return module;
            } else {
                return compile(module);
            }
        };
    };

    /**
     Allows the reel's html file to be loaded via require.
     @see Compiler middleware in require/require.js
     @param config
     @param compiler
     */
    exports.TemplateCompiler = function(config, compile) {
        return function(module) {
            if (!module.location)
                return;
            var match = module.location.match(/(.*\/)?(?=[^\/]+\.html(?:\.load\.js)?$)/);
            if (match) {
                module.dependencies = module.dependencies || [];
                module.exports = {
                    directory: match[1],
                    content: module.text
                };
                // XXX deprecated
                Object.defineProperty(module.exports, "root", {
                    get: function () {
                        if (typeof console === "object") {
                            console.warn("'root' property is deprecated on template modules.  Use 'directory' instead of root[1]");
                        }
                        return match;
                    }
                });
                return module;
            } else {
                compile(module);
            }
        };
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

    var browser = {

        // mini-url library
        makeResolve: function () {
            var head = document.querySelector("head"),
                baseElement = document.createElement("base"),
                relativeElement = document.createElement("a");

            baseElement.href = "";

            return function (base, relative) {
                var currentBaseElement = head.querySelector("base");
                if (!currentBaseElement) {
                    head.appendChild(baseElement);
                    currentBaseElement = baseElement;
                }
                base = String(base);
                if (!/^[\w\-]+:/.test(base)) { // isAbsolute(base)
                    throw new Error("Can't resolve from a relative location: " + JSON.stringify(base) + " " + JSON.stringify(relative));
                }
                var restore = currentBaseElement.href;
                currentBaseElement.href = base;
                relativeElement.href = relative;
                var resolved = relativeElement.href;
                currentBaseElement.href = restore;
                if (currentBaseElement === baseElement) {
                    head.removeChild(currentBaseElement);
                }
                return resolved;
            };
        },

        load: function (location) {
            var script = document.createElement("script");
            script.src = location;
            script.onload = function () {
                // remove clutter
                script.parentNode.removeChild(script);
            };
            document.getElementsByTagName("head")[0].appendChild(script);
        },

        getConfig: function() {
            return {
                location: "" + window.location
            };
        },

        getParams: function() {
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
                                this._params[name] = script.dataset[name];
                            }
                        } else if (script.attributes) {
                            var dataRe = /^data-(.*)$/,
                                letterAfterDash = /-([a-z])/g,
                                upperCaseChar = function (_, c) {
                                    return c.toUpperCase();
                                };

                            for (j = 0; j < script.attributes.length; j++) {
                                attr = script.attributes[j];
                                match = attr.name.match(/^data-(.*)$/);
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
            var base, Require, DOM, Promise, URL;

            var params = this.getParams();
            var resolve = this.makeResolve();

            // observe dom loading and load scripts in parallel

            // observe dom loaded
            function domLoad() {
                document.removeEventListener("DOMContentLoaded", domLoad, true);
                DOM = true;
                callbackIfReady();
            }

            // this permits montage.js to be injected after DOMContentLoaded
            // http://jsperf.com/readystate-boolean-vs-regex/2
            if (/interactive|complete/.test(document.readyState)) {
                domLoad();
            } else {
                document.addEventListener("DOMContentLoaded", domLoad, true);
            }

            // determine which scripts to load
            var pending = {
                "require": "packages/mr/require.js",
                "require/browser": "packages/mr/browser.js",
                "promise": "packages/mr/packages/q/q.js"
            };

            // load in parallel, but only if we're not using a preloaded cache.
            // otherwise, these scripts will be inlined after already
            if (typeof BUNDLE === "undefined") {
                var montageLocation = resolve(window.location, params.montageLocation);
                for (var id in pending) {
                    browser.load(resolve(montageLocation, pending[id]));
                }
            }

            // register module definitions for deferred,
            // serial execution
            var definitions = {};
            global.bootstrap = function (id, factory) {
                definitions[id] = factory;
                delete pending[id];
                for (var id in pending) {
                    // this causes the function to exit if there are any remaining
                    // scripts loading, on the first iteration.  consider it
                    // equivalent to an array length check
                    return;
                }
                // if we get past the for loop, bootstrapping is complete.  get rid
                // of the bootstrap function and proceed.
                delete global.bootstrap;
                allModulesLoaded();
            };

            // one module loaded for free, for use in require.js, browser.js
            global.bootstrap("mini-url", function (require, exports) {
                exports.resolve = resolve;
            });

            // miniature module system
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
                delete global.bootstrap;
                callbackIfReady();
            }

            function callbackIfReady() {
                if (DOM && Require) {
                    callback(Require, Promise, URL);
                }
            }

        },

        initMontage: function (montageRequire, applicationRequire, params) {

            var dependencies = [
                "core/core",
                "core/event/event-manager",
                "core/serialization/deserializer/montage-reviver",
                "core/logger"
            ];

            var Promise = montageRequire("core/promise").Promise;

            return Promise.all(dependencies.map(montageRequire.deepLoad))
            .then(function () {

                dependencies.forEach(montageRequire);

                var Montage = montageRequire("core/core").Montage;
                var EventManager = montageRequire("core/event/event-manager").EventManager;
                var MontageReviver = montageRequire("core/serialization/deserializer/montage-reviver").MontageReviver;
                var logger = montageRequire("core/logger").logger

                var defaultEventManager, application;

                // Setup Promise's longStackTrace support option
                logger("Promise stacktrace support", function(state) {
                    Promise.longStackSupport = !!state;
                });

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

                return appModulePromise.then(function(exports) {
                    var Application = exports[(applicationLocation ? applicationLocation.objectName : "Application")];
                    application = new Application();
                    Object.defineProperty(window.document, "application", {
                        get: Montage.deprecate(
                            null,
                            function () {
                                return exports.application
                            },
                            "document.application is deprecated, use require(\"montage/core/application\").application instead."
                            )
                    });
                    defaultEventManager.application = application;
                    application.eventManager = defaultEventManager;
                    application._load(applicationRequire, function() {
                        if (params.module) {
                            // If a module was specified in the config then we initialize it now
                            applicationRequire.async(params.module)
                            .done();
                        }
                        if (typeof global.montageDidLoad === "function") {
                            global.montageDidLoad();
                        }
                    });
                })

            })
            .done();

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

})
