/* global define, exports, require, process, window, document, bootstrap, Reflect, customElements, MontageElement*/
(function (root, factory) {
    if (typeof bootstrap === 'function') {
        // Montage. Register module.
        bootstrap("bootstrap", function (bootRequire, exports) {
            var Promise = bootRequire("promise").Promise;
            var URL = bootRequire("mini-url");
            factory(exports, Promise, URL, bootRequire);
        });
    } else if (typeof exports === 'object' && typeof exports.nodeName !== 'string') {
        // CommonJS
        var Promise = (require)("bluebird");
        var URL = (require)('url');
        var mr = (require)('mr');
        factory(exports, Promise, URL, mr);
    } else if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['exports', 'bluebird'], function (exports, bluebird) {
            factory((root.Montage = exports), bluebird);
        });
    } else {
        // Browser globals
        factory((root.Montage = {}), null, root.URL, root.mr);
    }
}(this, function (exports, Promise, miniURL, mr) {
    "use strict";

    // reassigning causes eval to not use lexical scope.
    var globalEval = eval,
        /*jshint evil:true */
        global = globalEval('this');
        /*jshint evil:false */

    function loadScript(location, callback) {
        var script;
        callback = callback || function noop() {};
        function finallyHandler() {
            // remove clutter
            if (script.parentNode) {
                script.parentNode.removeChild(script);   
            }
        }

        if (typeof document !== "undefined") {
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
        } else if (typeof require === 'function') {
            var module;
            try {
                module = require(location);
                callback(null, module);
            } catch (err) {
                callback(err, module);
            }
        } else {
            throw new Error("Platform not supported");
        }   
    }

    exports.initBrowser = function initBrowser() {
        
        return  {

            resolveUrl: (function makeResolveUrl() {

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
            }()),

            _location: null,

            getLocation: function () {
                var location = this._location;

                if (!location) {
                    var base = document.querySelector("head > base");
                    location = base ? base.href :  window.location;
                }

                return location;
            },

            _params: null,

            getParams: function getParams() {
                var params = this._params;

                if (!params) {
                    params = this._params = {};
                    
                    // Find the <script> that loads us, so we can divine our
                    // parameters from its attributes.
                    var i, j, match, script, attr, name,
                        paramNamespace = 'montage',
                        boostrapScript ='montage(.*).js',
                        boostrapAttrPattern = /^data-(.*)$/,
                        boostrapPattern = new RegExp('^(.*)' + boostrapScript + '(?:[\?\.]|$)', 'i'),
                        letterAfterDashPattern = /-([a-z])/g,
                        scripts = document.getElementsByTagName("script"),
                        upperCaseChar = function upperCaseChar(_, c) {
                            return c.toUpperCase();
                        };

                    for (i = 0; i < scripts.length; i++) {
                        script = scripts[i];
                        if (script.src && (match = script.src.match(boostrapPattern))) {
                            params.location = this.resolveUrl(this.getLocation(), match[1]);
                        }
                        if (script.hasAttribute("data-" + paramNamespace + "-location")) {
                            params.location = script.getAttribute("data-" + paramNamespace + "-location");
                        }
                        if (params.location) {

                            if (script.dataset) {
                                for (name in script.dataset) {
                                    if (script.dataset.hasOwnProperty(name)) {
                                        params[name] = script.dataset[name];
                                    }
                                }
                            } else if (script.attributes) {
                                for (j = 0; j < script.attributes.length; j++) {
                                    attr = script.attributes[j];
                                    match = attr.name.match(boostrapAttrPattern);
                                    if (match) {
                                        params[match[1].replace(letterAfterDashPattern, upperCaseChar)] = attr.value;
                                    }
                                }
                            }

                            // Legacy
                            params.location = this.resolveUrl(this.getLocation(), params.location);
                            params.packagesLocation = this.resolveUrl(params.location , '../../');

                            params[paramNamespace + 'Location'] = params.location;
                            params[paramNamespace + 'Hash'] = params.hash;

                            // Permits multiple bootstrap.js <scripts>; by
                            // removing as they are discovered, next one
                            // finds itself.
                            script.parentNode.removeChild(script);
                            break;
                        }
                    }
                }

                return params;
            },
            
            loadPackage: function (dependency, config, packageDescription) {
                return mr.loadPackage(dependency, config, packageDescription);
            },

            bootstrap: function (callback) {

                var self = this,
                    params = self.getParams(),
                    resolveUrl = this.resolveUrl;

                // determine which scripts to load
                var dependencies = {
                    "mini-url": {
                        // Preloaded
                        "shim": function (bootRequire, exports) {
                            return {
                                resolve: resolveUrl
                            };
                        }
                    },
                    "promise": {
                        "exports": Promise,
                        "global": "Promise",
                        "export": "Promise",
                        "location": "node_modules/bluebird/js/browser/bluebird.min.js",
                    },
                    "require": {
                        "exports": mr, // Preloaded
                        //location: "./require.js"
                        "location": "node_modules/mr/require.js",
                    }
                };

                function moduleHasExport(module) {
                    return module.exports !== null && module.exports !== void 0;
                }

                function bootModule(id) {
                    //console.log('bootModule', id, factory);

                    if (!dependencies.hasOwnProperty(id)) {
                        return;
                    }

                    var module = dependencies[id];

                    if (
                        module && 
                            moduleHasExport(module) === false && 
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
                    var mrPromise = bootModule("promise").Promise,
                        miniURL = bootModule("mini-url"),
                        mrRequire = bootModule("require");

                    callback(mrRequire, mrPromise, miniURL);
                }

                // This define if the script should be loaded has "nested" of "flat" dependencies in packagesLocation.
                // Change to "nested" for npm 2 support or add data-packages-strategy="nested" on montage.js script tag.
                var defaultStrategy = params.packagesStrategy || 'nested'; 

                function bootstrapModuleScript(module, strategy) {
                    module.strategy = strategy || defaultStrategy; 
                    var locationRoot = strategy === "flat" ? params.packagesLocation : params.location;
                    module.script = resolveUrl(locationRoot, module.location);
                    loadScript(module.script, function (err, script) {
                        if (err) {
                            if (module.strategy === defaultStrategy) {
                                var nextStrategy = module.strategy === 'flat' ? 'nested' : 'flat';
                                bootstrapModuleScript(module, nextStrategy);
                            } else {
                                throw err;
                            }
                        } else if (module.export || module.global) {
                            defaultStrategy = module.strategy;
                            bootstrapModule(module.id, function (bootRequire, exports) {
                                if (module.export) {
                                    exports[module.export] = global[module.global]; 
                                } else {
                                    return global[module.global];
                                }
                            });
                        } else if (!module.factory && !module.exports) {
                            throw new Error('Unable to load module ' + module.id);
                        }
                    });
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
                        if (moduleHasExport(module)) {
                            bootstrapModule(module.id, module.exports);
                        } else if (typeof module.shim !== "undefined") {
                            bootstrapModule(module.id, module.shim);
                        } else {
                            bootstrapModuleScript(module);
                        }
                    }
                } 
            }
        };
    };

    exports.initNodeJS = function initServer() {

        var PATH = require("path"),
            FS  = require("fs");

        return  {

            _location: null,

            getLocation: function () {
                var location = this.location;
                if (!location) {
                    location = "file://" + process.cwd();
                }

                return location;
            },

            _params: null,

            getParams: function () {
                var params = this._params;

                if (!params) {

                    var paramNamespace = 'montage',
                        location = this.getLocation(),
                        paramCommand = 'bin/' + paramNamespace;

                    params = this._params = {};
                    params.location = params[paramNamespace + 'Location'] = location;
                    // Detect command line
                    if (
                        typeof process !== "undefined" && 
                            typeof process.argv !== "undefined"
                    ) {
                        
                        var command, module, modulePackage,
                            args = process.argv.slice(1);

                        command = args.shift() || "";

                        // Detect /bin/mr usage
                        if (command.indexOf(paramCommand) === command.length - paramCommand.length) {
                            module = args.shift() || "";

                            if (module.slice(module.length - 1, module.length) !== "/") {
                                module += "/";
                            }

                            params.module = PATH.basename(module);
                            params.package = PATH.dirname(FS.realpathSync(module)) + "/";  
                        }
                    }
                }

                return params; 
            },
            
            loadPackage: function (dependency, config, packageDescription) {
                return mr.loadPackage(dependency, config, packageDescription);
            },

            bootstrap: function (callback) {

                var self = this,
                    params = self.getParams();

                mr.delegate = exports;

                if (params.package) {
                    callback(mr, Promise, miniURL);
                }
            }
        };
    };

    var platform;
    exports.getPlatform = function () {
        if (platform) {
            return platform;
        } else if (typeof window !== "undefined" && window && window.document) {
            platform = exports.initBrowser();
        } else if (typeof exports === 'object' && typeof exports.nodeName !== 'string') {
            platform = exports.initNodeJS();
        } else {
            throw new Error("Platform not supported.");
        }
        return platform;
    };

    exports.loadPackage = function (dependency, config, packageDescription) {
        var platform = exports.getPlatform();
        return platform.loadPackage(dependency, config, packageDescription);
    };

    exports.initMontageCustomElement = function () {

        if (
            typeof customElements === 'undefined' || 
                typeof Reflect === 'undefined'
        ) {
            return void 0;
        }

        function makeCustomElementConstructor(superConstructor) {
            var constructor = function () {
                return Reflect.construct(
                    HTMLElement, [], constructor
                );
            };
            Object.setPrototypeOf(
                constructor.prototype, (superConstructor || HTMLElement).prototype
            );
            Object.setPrototypeOf(constructor, superConstructor || HTMLElement);
            return constructor;
        }

        var MontageElement = makeCustomElementConstructor();

        function defineMontageElement(name, options) {
            if (!customElements.get(name)) {
                var customElementConstructor = makeCustomElementConstructor(MontageElement);
                customElementConstructor.componentConstructor = options.constructor;
                customElementConstructor.observedAttributes = options.observedAttributes;
                customElements.define(name, customElementConstructor);
            }
        }

        MontageElement.pendingCustomElements = new Map();

        MontageElement.define = function (name, constructor, options) {
            if (options && typeof options === 'object') {
                options.constructor = constructor;
            } else {
                options = { constructor: constructor };
            }

            if (this.isApplicationReady) {
                defineMontageElement(name, options);
            } else {
                this.pendingCustomElements.set(name, options);
            }
        };

        MontageElement.applicationReady = function (application, reviver) {
            MontageElement.prototype.findProxyForElement = reviver.findProxyForElement;
            this.application = application;

            this.pendingCustomElements.forEach(function (constructor, name) {
                defineMontageElement(name, constructor);
            });

            this.pendingCustomElements.clear();
        };

        Object.defineProperties(MontageElement.prototype, {

            isApplicationReady: {
                get: function () {
                    return !!this.application;
                },
                configurable: false
            },

            application: {
                get: function () {
                    return MontageElement.application;
                },
                configurable: false
            },

            componentConstructor: {
                get: function () {
                    return this.constructor.componentConstructor;
                },
                configurable: false
            },

            observedAttributes: {
                get: function () {
                    return this.constructor.observedAttributes;
                },
                configurable: false
            }
        });

        MontageElement.prototype.connectedCallback = function () {
            if (!this._instance) {
                var component = this.instantiateComponent();
                this._instance = component;

                return this.findParentComponent().then(function (parentComponent) {
                    parentComponent.addChildComponent(component);
                    component._canDrawOutsideDocument = true;
                    component.needsDraw = true;
                });
            }
        };

        MontageElement.prototype.disconnectedCallback = function () {
            //TODO
        };

        MontageElement.prototype.findParentComponent = function () {
            var eventManager = this.application.eventManager,
                anElement = this,
                parentComponent,
                aParentNode,
                candidate;

            while ((aParentNode = anElement.parentNode) !== null &&
                !(candidate = eventManager.eventHandlerForElement(aParentNode))) {
                anElement = aParentNode;
            }

            return global.Promise.resolve(candidate) || this.getRootComponent();
        };

        MontageElement.prototype.getRootComponent = function () {
            if (!MontageElement.rootComponentPromise) {
                MontageElement.rootComponentPromise = global.mr.async("montage/ui/component")
                    .then(function (exports) {
                        return exports.__root__;
                    });
            }

            return MontageElement.rootComponentPromise;
        };

        MontageElement.prototype.instantiateComponent = function () {
            var component = new this.componentConstructor();
            this.bootstrapComponent(component);
            component.element = document.createElement("div");
            return component;
        };

        MontageElement.prototype.bootstrapComponent = function (component) {
            var shadowRoot = this.attachShadow({ mode: 'open' }),
                mainEnterDocument = component.enterDocument,
                mainTemplateDidLoad = component.templateDidLoad,
                proxyElement = this.findProxyForElement(this);
            
            if (proxyElement) {
                var observedAttributes = this.observedAttributes,
                    observedAttribute,
                    self = this,
                    length;

                if (observedAttributes && (length = observedAttributes.length)) {
                    for (var i = 0; i < length; i++) {
                        observedAttribute = observedAttributes[i];
                        component.defineBinding(observedAttribute, {
                            "<->": "" + observedAttribute, source: proxyElement
                        });
                    }
                }
            }
                
            this.application.eventManager.registerTargetForActivation(shadowRoot);

            component.templateDidLoad = function () {
                var resources = component.getResources();

                if (resources) {
                    self.injectResourcesWithinCustomElement(
                        resources.styles,
                        shadowRoot
                    );

                    self.injectResourcesWithinCustomElement(
                        resources.scripts,
                        shadowRoot
                    );
                }

                this.templateDidLoad = mainTemplateDidLoad;

                if (typeof this.templateDidLoad === "function") {
                    this.templateDidLoad();
                }
            };

            component.enterDocument = function (firstTime) {
                shadowRoot.appendChild(this.element);
                this.enterDocument = mainEnterDocument;

                if (typeof this.enterDocument === "function") {
                    this.enterDocument(firstTime);
                }
            };
        };

        MontageElement.prototype.injectResourcesWithinCustomElement = function (resources, shadowRoot) {
            if (resources && resources.length) {
                for (var i = 0, length = resources.length; i < length; i++) {
                    shadowRoot.appendChild(resources[i]);
                }
            }
        };

        global.MontageElement = MontageElement;
    };

    /**
     * Initializes Montage and creates the application singleton if
     * necessary.
     */
    exports.initMontage = function() {
        var platform = exports.getPlatform();
        return platform.bootstrap(function (mrRequire, mrPromise, miniURL) {

            var config = {},
                params = platform.getParams(),
                location = params.location,
                applicationModuleId = params.module || "",
                applicationLocation = miniURL.resolve(platform.getLocation(), params.package || ".");
            
            // Exports mrRequire as Require
            exports.Require = mrRequire;

            // execute the preloading plan and stall the fallback module loader
            // until it has finished
            if (global.preload) {

                var bundleDefinitions = {};
                var getDefinition = function (name) {
                    return (bundleDefinitions[name] = bundleDefinitions[name] || Promise.resolve());
                };
                
                global.bundleLoaded = function (name) {
                    return getDefinition(name).resolve();
                };
                
                var preloading = Promise.resolve();
                config.preloaded = preloading.promise;

                // preload bundles sequentially
                var preloaded = mrPromise.resolve();
                global.preload.forEach(function (bundleLocations) {
                    preloaded = preloaded.then(function () {
                        return mrPromise.all(bundleLocations.map(function (bundleLocation) {
                            loadScript(bundleLocation);
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

            var applicationRequirePromise;

            if (!("remoteTrigger" in params)) {


                // TODO need test
                if ("autoPackage" in params) {
                    mrRequire.injectPackageDescription(location, {
                        dependencies: {
                            montage: "*"
                        }
                    }, config);
                } else {

                    // handle explicit package.json location
                    if (applicationLocation.slice(applicationLocation.length - 5) === ".json") {
                        var packageDescriptionLocation = location;
                        applicationLocation = miniURL.resolve(applicationLocation, ".");
                    }
                }
                applicationRequirePromise = mrRequire.loadPackage({
                    location: applicationLocation,
                    hash: params.applicationHash
                }, config);

            // TODO need test
            } else {

                // allows the bootstrapping to be remote controlled by the
                // parent window, with a dynamically generated package
                // description
                window.postMessage({
                    type: "montageReady"
                }, "*");

                var trigger = new mrPromise(function(resolve) {
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

                
                // TODO need test
                applicationRequirePromise = trigger.spread(function (location, injections) {
                    var promise = mrRequire.loadPackage({
                        location: applicationLocation,
                        hash: params.applicationHash
                    }, config);
                    if (injections) {
                        promise = promise.then(function (applicationRequire) {
                            location = miniURL.resolve(location, ".");
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

            return applicationRequirePromise.then(function (applicationRequire) {
                return applicationRequire.loadPackage({
                    location: params.montageLocation,
                    hash: params.montageHash
                })
                .then(function (montageRequire) {
                    montageRequire.inject("core/mini-url", miniURL);
                    montageRequire.inject("core/promise", {
                        Promise: mrPromise
                    });

                    // Expose global require and mr
                    global.mr = applicationRequire;

                    // install the linter, which loads on the first error
                    config.lint = function (module) {
                        montageRequire.async("core/jshint")
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

                    var dependencies = [
                        "core/core",
                        "core/event/event-manager",
                        "core/serialization/deserializer/montage-reviver",
                        "core/logger"
                    ];

                    var deepLoadPromises = dependencies.map(function (dependency) {
                        return montageRequire.deepLoad(dependency);
                    });

                    return mrPromise.all(deepLoadPromises).then(function () {
                        var Montage = montageRequire("core/core").Montage;
                        var EventManager = montageRequire("core/event/event-manager").EventManager;
                        var defaultEventManager = montageRequire("core/event/event-manager").defaultEventManager;
                        var MontageDeserializer = montageRequire("core/serialization/deserializer/montage-deserializer").MontageDeserializer;    
                        var MontageReviver = montageRequire("core/serialization/deserializer/montage-reviver").MontageReviver;
                        var logger = montageRequire("core/logger").logger;
                            

                        exports.MontageDeserializer = new MontageDeserializer; // Create instance once only

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
                            var application = new Application();
                            defaultEventManager.application = application;
                            application.eventManager = defaultEventManager;

                            return application._load(applicationRequire, function() {
                                
                                // If a module was specified in the config then we initialize it now
                                if (applicationModuleId) {
                                    applicationRequire.async(applicationModuleId);
                                }

                                if (typeof global.montageDidLoad === "function") {
                                    global.montageDidLoad();
                                }

                                if (typeof window !== "undefined" && window && window.MontageElement) {
                                    MontageElement.applicationReady(application, MontageReviver);
                                }
                            });
                        });
                    });
                });
            // Will throw error if there is one
            }).done();
        });
    };

    exports.getMontageDeserializer = function getMontageDeserializer() {

        // Existing instance
        if (exports.MontageDeserializer) {
            return Promise.resolve(exports.MontageDeserializer);
        }

        // Pending instance
        if (getMontageDeserializer._promise) {
            return getMontageDeserializer._promise;
        }

        // Load instance
        var platform = exports.getPlatform(),
            params = platform.getParams();

        return (getMontageDeserializer._promise = exports.loadPackage(params.montageLocation, {
            mainPackageLocation: params.location
        }).then(function (mr) {
            return mr.async("./core/serialization/deserializer/montage-deserializer").then(function (module) {
                return (exports.MontageDeserializer = new module.MontageDeserializer());
            });
        }));
    }

    exports.compileMJSONFile = function (mjson, require, moduleId) {
        return exports.getMontageDeserializer().then(function (deserializer) {
            deserializer.init(mjson, require, void 0, require.location + moduleId);
            return deserializer.deserializeObject();  
        });
    };

    if (
        typeof window !== "undefined" || 
            (typeof module === 'object' && module.exports &&
                typeof require !== "undefined")
    ) {
        if (global.__MONTAGE_LOADED__) {
            console.warn("Montage already loaded!");
        } else {
            global.__MONTAGE_LOADED__ = true;
            exports.initMontage();
            exports.initMontageCustomElement();
        }
    } else {
        // may cause additional exports to be injected:
        exports.getPlatform();
    }

    return exports;
}));