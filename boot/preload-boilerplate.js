(function (modules) {

    // unpack module tuples into module objects
    for (var i = 0; i < modules.length; i++) {
        modules[i] = new Module(modules[i][0], modules[i][1]);
    }

    function Module(dependencies, factory) {
        this.dependencies = dependencies;
        this.factory = factory;
    }

    Module.prototype.require = function () {
        var module = this;
        if (!module.exports) {
            module.exports = {};
            function require(id) {
                var index = module.dependencies[id];
                var dependency = modules[index];
                if (!dependency)
                    throw new Error("Bundle is missing a dependency: " + id);
                return dependency.require();
            }
            module.exports = module.factory(require, module.exports, module) || module.exports;
        }
        return module.exports;
    };

    return modules[0].require();
})((function (global){return[[{"./browser":1,"mr/preload":3},function (require, exports, module){

// montage boot/preload
// --------------------


var bootstrap = require("./browser");
var preload = require("mr/preload");

module.exports = function bootstrapPreload(plan) {
    return bootstrap(preload(plan));
};

}],[{"mr/boot/script-params":4,"mr/browser":5,"url":6,"q":9,"./config":2},function (require, exports, module){

// montage boot/browser
// --------------------


if (typeof window !== "undefined") {

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

var params = require("mr/boot/script-params")("montage.js");
var Require = require("mr/browser");
var URL = require("url");
var Q = require("q");
var Config = require("./config");

Require.makeLoader = Config.makeLoader;
Require.makeCompiler = Config.makeCompiler;

window.global = window;

module.exports = bootstrap;
function bootstrap(preloaded) {

    var montageLocation = URL.resolve(Require.getLocation(), params.location);

    var config = {};

    config.location = "" + window.location;
    config.preloaded = preloaded;

    return getApplication(params, config)
    .then(function (applicationRequire) {
        return applicationRequire.loadPackage({
            location: montageLocation,
            hash: params.montageHash
        })
        .then(function (montageRequire) {
            montageRequire.inject("core/mini-url", URL);
            montageRequire.inject("core/promise", {Promise: Q});
            //promiseRequire.inject("q", Q);

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
            initialize(montageRequire, applicationRequire, params);
        });
    })

};

function getApplication(params, config) {

    var location = URL.resolve(config.location, params["package"] || ".");
    var applicationHash = require.applicationHash;

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

        return Require.loadPackage({
            location: location,
            hash: applicationHash
        }, config);

    } else {

        // allows the bootstrapping to be remote controlled by the
        // parent window, with a dynamically generated package
        // description
        var trigger = Q.defer();
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

        return trigger.promise.spread(function (location, injections) {
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
}

function initialize(montageRequire, applicationRequire, params) {
    var dependencies = [
        "core/core",
        "core/event/event-manager",
        "core/serialization/deserializer/montage-reviver",
        "core/logger"
    ];

    return Q.all(dependencies.map(montageRequire.deepLoad))
    .then(function () {

        dependencies.forEach(montageRequire);

        var Montage = montageRequire("core/core").Montage;
        var EventManager = montageRequire("core/event/event-manager").EventManager;
        var MontageReviver = montageRequire("core/serialization/deserializer/montage-reviver").MontageReviver;
        var logger = montageRequire("core/logger").logger

        var defaultEventManager, application;

        // Setup Promise's longStackTrace support option
        logger("Promise stacktrace support", function(state) {
            Q.longStackSupport = !!state;
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
                if (typeof global.montageDidLoad === "function") {
                    global.montageDidLoad();
                }
                if (params.module) {
                    // If a module was specified in the config then we initialize it now
                    return applicationRequire.async(params.module)
                }
            });
        })

    })
}

}],[{"mr/require":8},function (require, exports, module){

// montage boot/config
// -------------------


var Require = require("mr/require");

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
            exports = defaultFactory.call(this, require, exports, module);
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
            return exports;
        };
        return module;
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

// setup the reel loader
var makeLoader = Require.makeLoader;
exports.makeLoader = function (config) {
    return exports.ReelLoader(
        config,
        makeLoader(config)
    );
};

// set up serialization compiler
var makeCompiler = Require.makeCompiler;
exports.makeCompiler = function (config) {
    return exports.MetaCompiler(
        config,
        exports.SerializationCompiler(
            config,
            exports.TemplateCompiler(
                config,
                makeCompiler(config)
            )
        )
    );
};

}],[{"./script-injection":7,"q":9},function (require, exports, module){

// mr preload
// ----------


var load = require("./script-injection");
var Q = require("q");

module.exports = function preload(plan) {

    // Each bundle ends with a bundleLoaded(name) call.  We use these hooks to
    // synchronize the preloader.
    var bundleHooks = {};
    var getHook = function (name) {
        return bundleHooks[name] =
            bundleHooks[name] ||
                Q.defer();
    };
    global.bundleLoaded = function (name) {
        getHook(name).resolve();
    };

    // preload bundles sequentially
    var preloaded = plan.reduce(function (previous, bundleLocations) {
        return previous.then(function () {
            return Q.all(bundleLocations.map(function (bundleLocation) {
                load(bundleLocation);
                return getHook(bundleLocation).promise;
            }));
        });
    }, Q())
    .then(function () {
        // remove evidence of the evil we have done to the global scope
        delete global.bundleLoaded;
    });

    return preloaded;
};

}],[{"url":6},function (require, exports, module){

// mr boot/script-params
// ---------------------


var URL = require("url");

module.exports = getParams;
function getParams(scriptName) {
    var i, j,
        match,
        script,
        location,
        attr,
        name,
        re = new RegExp("^(.*)" + scriptName + "(?:[\\?\\.]|$)", "i");
    var params = {};
    // Find the <script> that loads us, so we can divine our parameters
    // from its attributes.
    var scripts = document.getElementsByTagName("script");
    for (i = 0; i < scripts.length; i++) {
        script = scripts[i];
        // There are two distinct ways that a bootstrapping script might be
        // identified.  In development, we can rely on the script name.  In
        // production, the script name is produced by the optimizer and does
        // not have a generic pattern.  However, the optimizer will drop a
        // `data-boot-location` property on the script instead.  This will also
        // serve to inform the boot script of the location of the loading
        // package, albeit Montage or Mr.
        if (script.src && (match = script.src.match(re))) {
            location = match[1];
        }
        if (script.hasAttribute("data-boot-location")) {
            location = URL.resolve(window.location, script.getAttribute("data-boot-location"));
        }
        if (location) {
            if (script.dataset) {
                for (name in script.dataset) {
                    if (script.dataset.hasOwnProperty(name)) {
                        params[name] = script.dataset[name];
                    }
                }
            } else if (script.attributes) {
                var dataRe = /^data-(.*)$/,
                    letterAfterDash = /-([a-z])/g,
                    /*jshint -W083 */
                    upperCaseChar = function (_, c) {
                        return c.toUpperCase();
                    };
                    /*jshint +W083 */

                for (j = 0; j < script.attributes.length; j++) {
                    attr = script.attributes[j];
                    match = attr.name.match(/^data-(.*)$/);
                    if (match) {
                        params[match[1].replace(letterAfterDash, upperCaseChar)] = attr.value;
                    }
                }
            }
            // Permits multiple boot <scripts>; by removing as they are
            // discovered, next one finds itself.
            script.parentNode.removeChild(script);
            params.location = location;
            break;
        }
    }
    return params;
}

}],[{"./require":8,"url":6,"q":9},function (require, exports, module){

// mr browser
// ----------

/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2012 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
/*global montageDefine:true */
/*jshint -W015, evil:true, camelcase:false */

var Require = require("./require");
var URL = require("url");
var Q = require("q");
var GET = "GET";
var APPLICATION_JAVASCRIPT_MIMETYPE = "application/javascript";
var FILE_PROTOCOL = "file:";

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
    var response = Q.defer();

    function onload() {
        if (xhrSuccess(request)) {
            response.resolve(request.responseText);
        } else {
            onerror();
        }
    }

    function onerror() {
        response.reject(new Error("Can't XHR " + JSON.stringify(url)));
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
        if (module.factory || module.text === void 0) {
            return module;
        }
        if (config.useScriptInjection) {
            throw new Error("Can't use eval.");
        }

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
            exception.message = exception.message + " in " + module.location;
            throw exception;
        }

        // This should work and would be simpler, but Firebug does not show scripts executed via "new Function()" constructor.
        // TODO: sniff browser?
        // module.factory = new Function("require", "exports", "module", module.text + "\n//*/"+sourceURLComment);

        module.factory.displayName = displayName;
    };
};

Require.XhrLoader = function (config) {
    return function (url, module) {
        return config.read(url)
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
    definitions[hash][id] = definitions[hash][id] || Q.defer();
    return definitions[hash][id];
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
        return Q.fcall(function () {

            // short-cut by predefinition
            if (definitions[hash] && definitions[hash][module.id]) {
                return definitions[hash][module.id].promise;
            }

            if (/\.js$/.test(location)) {
                location = location.replace(/\.js/, ".load.js");
            } else {
                location += ".load.js";
            }

            Require.loadScript(location);

            return getDefinition(hash, module.id).promise;
        })
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
        var definition = getDefinition(dependency.hash, "package.json").promise;
        var location = URL.resolve(dependency.location, "package.json.load.js");

        // The package.json might come in a preloading bundle. If so, we do not
        // want to issue a script injection. However, if by the time preloading
        // has finished the package.json has not arrived, we will need to kick off
        // a request for the package.json.load.js script.
        if (config.preloaded && config.preloaded.isPending()) {
            config.preloaded
            .then(function () {
                if (definition.isPending()) {
                    Require.loadScript(location);
                }
            })
            .done();
        } else if (definition.isPending()) {
            // otherwise preloading has already completed and we don't have the
            // package description, so load it
            Require.loadScript(location);
        }

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

module.exports = Require;

}],[{},function (require, exports, module){

// mr mini-url.js
// --------------


var head = document.querySelector("head"),
    baseElement = document.createElement("base"),
    relativeElement = document.createElement("a");

baseElement.href = "";

exports.resolve = function resolve(base, relative) {
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

}],[{},function (require, exports, module){

// mr script-injection
// -------------------


module.exports = load;

var head = document.querySelector("head");
function load(location) {
    var script = document.createElement("script");
    script.src = URL.resolve(params.mrLocation, location);
    script.onload = function () {
        // remove clutter
        script.parentNode.removeChild(script);
    };
    head.appendChild(script);
};

}],[{"q":9,"url":6},function (require, exports, module){

// mr require
// ----------


/*
    Based in part on Motorola Mobility’s Montage
    Copyright (c) 2012, Motorola Mobility LLC. All Rights Reserved.
    3-Clause BSD License
    https://github.com/motorola-mobility/montage/blob/master/LICENSE.md
*/

var Require = exports;
var Q = require("q");
var URL = require("url");

if (!this) {
    throw new Error("Require does not work in strict mode.");
}

var globalEval = eval; // reassigning causes eval to not use lexical scope.

// Non-CommonJS speced extensions should be marked with an "// EXTENSION"
// comment.

Require.makeRequire = function (config) {
    var require;

    // Configuration defaults:
    config = config || {};
    config.location = URL.resolve(config.location || Require.getLocation(), "./");
    config.lib = URL.resolve(config.location, config.lib || "./");
    config.paths = config.paths || [config.lib];
    config.mappings = config.mappings || {}; // EXTENSION
    config.exposedConfigs = config.exposedConfigs || Require.exposedConfigs;
    config.makeLoader = config.makeLoader || Require.makeLoader;
    config.load = config.load || config.makeLoader(config);
    config.makeCompiler = config.makeCompiler || Require.makeCompiler;
    config.compile = config.compile || config.makeCompiler(config);
    config.parseDependencies = config.parseDependencies || Require.parseDependencies;
    config.read = config.read || Require.read;

    // Modules: { exports, id, location, directory, factory, dependencies,
    // dependees, text, type }
    var modules = config.modules = config.modules || {};

    // produces an entry in the module state table, which gets built
    // up through loading and execution, ultimately serving as the
    // ``module`` free variable inside the corresponding module.
    function getModuleDescriptor(id) {
        var lookupId = id.toLowerCase();
        if (!has(modules, lookupId)) {
            modules[lookupId] = {
                id: id,
                display: (config.name || config.location) + "#" + id, // EXTENSION
                require: require
            };
        }
        return modules[lookupId];
    }

    // for preloading modules by their id and exports, useful to
    // prevent wasteful multiple instantiation if a module was loaded
    // in the bootstrapping process and can be trivially injected into
    // the system.
    function inject(id, exports) {
        var module = getModuleDescriptor(id);
        module.exports = exports;
        module.location = URL.resolve(config.location, id);
        module.directory = URL.resolve(module.location, "./");
        module.injected = true;
        delete module.redirect;
        delete module.mappingRedirect;
    }

    // Ensures a module definition is loaded, compiled, analyzed
    var load = memoize(function (topId, viaId) {
        var module = getModuleDescriptor(topId);
        return Q.fcall(function () {
            // if not already loaded, already instantiated, or
            // configured as a redirection to another module
            if (
                module.factory === void 0 &&
                module.exports === void 0 &&
                module.redirect === void 0
            ) {
                return Q.fcall(config.load, topId, module);
            }
        })
        .then(function () {
            // compile and analyze dependencies
            config.compile(module);
            var dependencies =
                module.dependencies =
                    module.dependencies || [];
            if (module.redirect !== void 0) {
                dependencies.push(module.redirect);
            }
            if (module.extraDependencies !== void 0) {
                Array.prototype.push.apply(module.dependencies, module.extraDependencies);
            }
        });
    });

    // Load a module definition, and the definitions of its transitive
    // dependencies
    function deepLoad(topId, viaId, loading) {
        var module = getModuleDescriptor(topId);
        // this is a memo of modules already being loaded so we don’t
        // data-lock on a cycle of dependencies.
        loading = loading || {};
        // has this all happened before?  will it happen again?
        if (has(loading, topId)) {
            return; // break the cycle of violence.
        }
        loading[topId] = true; // this has happened before
        return load(topId, viaId)
        .then(function () {
            // load the transitive dependencies using the magic of
            // recursion.
            return Q.all(module.dependencies.map(function (depId) {
                depId = resolve(depId, topId);
                // create dependees set, purely for debug purposes
                var module = getModuleDescriptor(depId);
                var dependees = module.dependees = module.dependees || {};
                dependees[topId] = true;
                return deepLoad(depId, topId, loading);
            }));
        }, function (error) {
            module.error = error;
        });
    }

    function lookup(topId, viaId) {
        topId = resolve(topId, viaId);
        var module = getModuleDescriptor(topId);

        // check for consistent case convention
        if (module.id !== topId) {
            throw new Error(
                "Can't require module " + JSON.stringify(module.id) +
                " by alternate spelling " + JSON.stringify(topId)
            );
        }

        // handle redirects
        if (module.redirect !== void 0) {
            return lookup(module.redirect, topId);
        }

        // handle cross-package linkage
        if (module.mappingRedirect !== void 0) {
            return module.mappingRequire.lookup(module.mappingRedirect, "");
        }

        return module;
    }

    // Initializes a module by executing the factory function with a new
    // module "exports" object.
    function getExports(topId, viaId) {
        var module = getModuleDescriptor(topId);

        // check for consistent case convention
        if (module.id !== topId) {
            throw new Error(
                "Can't require module " + JSON.stringify(module.id) +
                " by alternate spelling " + JSON.stringify(topId)
            );
        }

        // check for load error
        if (module.error) {
            var error = module.error;
            error.message = (
                "Can't require module " + JSON.stringify(module.id) +
                " via " + JSON.stringify(viaId) +
                " because " + error.message
            );
            throw error;
        }

        // handle redirects
        if (module.redirect !== void 0) {
            return getExports(module.redirect, viaId);
        }

        // handle cross-package linkage
        if (module.mappingRedirect !== void 0) {
            return module.mappingRequire(module.mappingRedirect, viaId);
        }

        // do not reinitialize modules
        if (module.exports !== void 0) {
            return module.exports;
        }

        // do not initialize modules that do not define a factory function
        if (module.factory === void 0) {
            throw new Error(
                "Can't require module " + JSON.stringify(topId) +
                " via " + JSON.stringify(viaId) + " " + JSON.stringify(module)
            );
        }

        module.directory = URL.resolve(module.location, "./"); // EXTENSION
        module.exports = {};

        // Execute the factory function:
        var returnValue = module.factory.call(
            // in the context of the module:
            void 0, // this (defaults to global)
            makeRequire(topId), // require
            module.exports, // exports
            module // module
        );

        // EXTENSION
        if (returnValue !== void 0) {
            module.exports = returnValue;
        }

        return module.exports;
    }

    // Finds the internal identifier for a module in a subpackage
    // The `seen` object is a memo of the packages we have seen to avoid
    // infinite recursion of cyclic package dependencies. It also causes
    // the function to return null instead of throwing an exception. I’m
    // guessing that throwing exceptions *and* being recursive would be
    // too much performance evil for one function.
    function identify(id2, require2, seen) {
        var location = config.location;
        if (require2.location === location) {
            return id2;
        }

        var internal = !!seen;
        seen = seen || {};
        if (has(seen, location)) {
            return null; // break the cycle of violence.
        }
        seen[location] = true;
        /*jshint -W089 */
        for (var name in config.mappings) {
            var mapping = config.mappings[name];
            location = mapping.location;
            if (!config.hasPackage(location)) {
                continue;
            }
            var candidate = config.getPackage(location);
            var id1 = candidate.identify(id2, require2, seen);
            if (id1 === null) {
                continue;
            } else if (id1 === "") {
                return name;
            } else {
                return name + "/" + id1;
            }
        }
        if (internal) {
            return null;
        } else {
            throw new Error(
                "Can't identify " + id2 + " from " + require2.location
            );
        }
        /*jshint +W089 */
    }

    // Creates a unique require function for each module that encapsulates
    // that module's id for resolving relative module IDs against.
    function makeRequire(viaId) {

        // Main synchronously executing "require()" function
        var require = function(id) {
            var topId = resolve(id, viaId);
            return getExports(topId, viaId);
        };

        // Asynchronous "require.async()" which ensures async executation
        // (even with synchronous loaders)
        require.async = function(id) {
            var topId = resolve(id, viaId);
            var module = getModuleDescriptor(id);
            return deepLoad(topId, viaId)
            .then(function () {
                return require(topId);
            });
        };

        require.resolve = function (id) {
            return normalizeId(resolve(id, viaId));
        };

        require.getModule = getModuleDescriptor; // XXX deprecated, use:
        require.getModuleDescriptor = getModuleDescriptor;
        require.lookup = lookup;
        require.load = load;
        require.deepLoad = deepLoad;

        require.loadPackage = function (dependency, givenConfig) {
            if (givenConfig) { // explicit configuration, fresh environment
                return Require.loadPackage(dependency, givenConfig);
            } else { // inherited environment
                return config.loadPackage(dependency, config);
            }
        };

        require.hasPackage = function (dependency) {
            return config.hasPackage(dependency);
        };

        require.getPackage = function (dependency) {
            return config.getPackage(dependency);
        };

        require.isMainPackage = function () {
            return require.location === config.mainPackageLocation;
        };

        require.injectPackageDescription = function (location, description) {
            Require.injectPackageDescription(location, description, config);
        };

        require.injectPackageDescriptionLocation = function (location, descriptionLocation) {
            Require.injectPackageDescriptionLocation(location, descriptionLocation, config);
        };

        require.injectMapping = function (dependency, name) {
            dependency = normalizeDependency(dependency, config, name);
            name = name || dependency.name;
            config.mappings[name] = dependency;
        };

        require.injectDependency = function (name) {
            require.injectMapping({name: name}, name);
        };

        require.identify = identify;
        require.inject = inject;

        config.exposedConfigs.forEach(function(name) {
            require[name] = config[name];
        });

        require.config = config;

        require.read = config.read;

        return require;
    }

    require = makeRequire("");
    return require;
};

Require.injectPackageDescription = function (location, description, config) {
    var descriptions =
        config.descriptions =
            config.descriptions || {};
    descriptions[location] = Q.resolve(description);
};

Require.injectPackageDescriptionLocation = function (location, descriptionLocation, config) {
    var descriptionLocations =
        config.descriptionLocations =
            config.descriptionLocations || {};
    descriptionLocations[location] = descriptionLocation;
};

Require.loadPackageDescription = function (dependency, config) {
    var location = dependency.location;
    var descriptions =
        config.descriptions =
            config.descriptions || {};
    if (descriptions[location] === void 0) {
        var descriptionLocations =
            config.descriptionLocations =
                config.descriptionLocations || {};
        var descriptionLocation;
        if (descriptionLocations[location]) {
            descriptionLocation = descriptionLocations[location];
        } else {
            descriptionLocation = URL.resolve(location, "package.json");
        }
        descriptions[location] = (config.read || Require.read)(descriptionLocation)
        .then(function (json) {
            try {
                return JSON.parse(json);
            } catch (error) {
                error.message = error.message + " in " + JSON.stringify(descriptionLocation);
                throw error;
            }
        });
    }
    return descriptions[location];
};

Require.loadPackage = function (dependency, config) {
    dependency = normalizeDependency(dependency, config);
    if (!dependency.location) {
        throw new Error("Can't find dependency: " + JSON.stringify(dependency));
    }
    var location = dependency.location;
    config = Object.create(config || null);
    var loadingPackages = config.loadingPackages = config.loadingPackages || {};
    var loadedPackages = config.packages = {};
    var registry = config.registry = config.registry || Object.create(null);
    config.mainPackageLocation = location;

    config.hasPackage = function (dependency) {
        dependency = normalizeDependency(dependency, config);
        if (!dependency.location) {
            return false;
        }
        var location = dependency.location;
        return !!loadedPackages[location];
    };

    config.getPackage = function (dependency) {
        dependency = normalizeDependency(dependency, config);
        if (!dependency.location) {
            throw new Error("Can't find dependency: " + JSON.stringify(dependency) + " from " + config.location);
        }
        var location = dependency.location;
        if (!loadedPackages[location]) {
            if (loadingPackages[location]) {
                throw new Error(
                    "Dependency has not finished loading: " + JSON.stringify(dependency)
                );
            } else {
                throw new Error(
                    "Dependency was not loaded: " + JSON.stringify(dependency)
                );
            }
        }
        return loadedPackages[location];
    };

    config.loadPackage = function (dependency, viaConfig) {
        dependency = normalizeDependency(dependency, viaConfig);
        if (!dependency.location) {
            throw new Error("Can't find dependency: " + JSON.stringify(dependency) + " from " + config.location);
        }
        var location = dependency.location;
        if (!loadingPackages[location]) {
            loadingPackages[location] = Require.loadPackageDescription(dependency, config)
            .then(function (packageDescription) {
                var subconfig = configurePackage(
                    location,
                    packageDescription,
                    config
                );
                var pkg = Require.makeRequire(subconfig);
                loadedPackages[location] = pkg;
                return pkg;
            });
            loadingPackages[location].done();
        }
        return loadingPackages[location];
    };

    var pkg = config.loadPackage(dependency);
    pkg.location = location;
    pkg.async = function (id, callback) {
        return pkg.then(function (require) {
            return require.async(id, callback);
        });
    };

    return pkg;
};

function normalizeDependency(dependency, config, name) {
    config = config || {};
    if (typeof dependency === "string") {
        dependency = {
            location: dependency
        };
    }
    if (dependency.main) {
        dependency.location = config.mainPackageLocation;
    }
    // if the named dependency has already been found at another
    // location, refer to the same eventual instance
    if (
        dependency.name &&
        config.registry &&
        config.registry[dependency.name]
    ) {
        dependency.location = config.registry[dependency.name];
    }
    // default location
    if (!dependency.location && config.packagesDirectory && dependency.name) {
        dependency.location = URL.resolve(
            config.packagesDirectory,
            dependency.name + "/"
        );
    }
    if (!dependency.location) {
        return dependency; // partially completed
    }
    // make sure the dependency location has a trailing slash so that
    // relative urls will resolve properly
    if (!/\/$/.test(dependency.location)) {
        dependency.location += "/";
    }
    // resolve the location relative to the current package
    if (!Require.isAbsolute(dependency.location)) {
        if (!config.location) {
            throw new Error(
                "Dependency locations must be fully qualified: " +
                JSON.stringify(dependency)
            );
        }
        dependency.location = URL.resolve(
            config.location,
            dependency.location
        );
    }
    // register the package name so the location can be reused
    if (dependency.name) {
        config.registry[dependency.name] = dependency.location;
    }
    return dependency;
}

function configurePackage(location, description, parent) {

    if (!/\/$/.test(location)) {
        location += "/";
    }

    var config = Object.create(parent);
    config.name = description.name;
    config.location = location || Require.getLocation();
    config.packageDescription = description;
    config.useScriptInjection = description.useScriptInjection;

    if (description.production !== void 0) {
        config.production = description.production;
    }

    // explicitly mask definitions and modules, which must
    // not apply to child packages
    var modules = config.modules = config.modules || {};

    var registry = config.registry;
    if (config.name !== void 0 && !registry[config.name]) {
        registry[config.name] = config.location;
    }

    // overlay
    var overlay = description.overlay || {};

    // but first, convert "browser" field, as pioneered by Browserify, to an
    // overlay
    if (typeof description.browser === "string") {
        overlay.browser = {
            redirects: {"": description.browser}
        };
    } else if (typeof description.browser === "object") {
        overlay.browser = {
            redirects: description.browser
        };
    }

    // overlay continued...
    var layer;
    (config.overlays || Require.overlays).forEach(function (engine) {
        /*jshint -W089 */
        if (overlay[engine]) {
            var layer = overlay[engine];
            for (var name in layer) {
                description[name] = layer[name];
            }
        }
        /*jshint +W089 */
    });
    delete description.overlay;

    // directories
    description.directories = description.directories || {};
    description.directories.lib =
        description.directories.lib === void 0 ? "./" : description.directories.lib;
    var lib = description.directories.lib;
    // lib
    config.lib = URL.resolve(location, "./" + lib);
    var packagesDirectory = description.directories.packages || "node_modules";
    packagesDirectory = URL.resolve(location, packagesDirectory + "/");
    config.packagesDirectory = packagesDirectory;

    // The default "main" module of a package has the same name as the
    // package.
    if (description.main !== void 0) {

        // main, injects a definition for the main module, with
        // only its path. makeRequire goes through special effort
        // in deepLoad to re-initialize this definition with the
        // loaded definition from the given path.
        modules[""] = {
            id: "",
            redirect: normalizeId(description.main),
            location: config.location
        };

        if (description.name !== modules[""].redirect) {
            modules[description.name] = {
                id: description.name,
                redirect: "",
                location: URL.resolve(location, description.name || "")
            };
        }

    }

    //Deal with redirects
    var redirects = description.redirects;
    if (redirects !== void 0) {
        Object.keys(redirects).forEach(function (name) {
            modules[name] = {
                id: name,
                redirect: redirects[name],
                location: URL.resolve(location, name)
            };
        });
    }

    // mappings, link this package to other packages.
    var mappings = description.mappings || {};
    // dependencies, devDependencies if not in production
    [description.dependencies, !config.production? description.devDependencies : null]
    .forEach(function (dependencies) {
        if (!dependencies) {
            return;
        }
        Object.keys(dependencies).forEach(function (name) {
            if (!mappings[name]) {
                // dependencies are equivalent to name and version mappings,
                // though the version predicate string is presently ignored
                // (TODO)
                mappings[name] = {
                    name: name,
                    version: dependencies[name]
                };
            }
        });
    });
    // mappings
    Object.keys(mappings).forEach(function (name) {
        var mapping = mappings[name] = normalizeDependency(
            mappings[name],
            config,
            name
        );
    });
    config.mappings = mappings;

    return config;
}

// Helper functions:

function has(object, property) {
    return Object.prototype.hasOwnProperty.call(object, property);
}

// Resolves CommonJS module IDs (not paths)
Require.resolve = resolve;
function resolve(id, baseId) {
    id = String(id);
    var source = id.split("/");
    var target = [];
    if (source.length && source[0] === "." || source[0] === "..") {
        var parts = baseId.split("/");
        parts.pop();
        source.unshift.apply(source, parts);
    }
    for (var i = 0, ii = source.length; i < ii; i++) {
        /*jshint -W035 */
        var part = source[i];
        if (part === "" || part === ".") {
        } else if (part === "..") {
            if (target.length) {
                target.pop();
            }
        } else {
            target.push(part);
        }
        /*jshint +W035 */
    }
    return target.join("/");
}

Require.base = function (location) {
    // matches Unix basename
    return String(location)
        .replace(/(.+?)\/+$/, "$1")
        .match(/([^\/]+$|^\/$|^$)/)[1];
};

// Tests whether the location or URL is a absolute.
Require.isAbsolute = function(location) {
    return (/^[\w\-]+:/).test(location);
};

// Extracts dependencies by parsing code and looking for "require" (currently using a simple regexp)
Require.parseDependencies = function(factory) {
    var o = {};
    String(factory).replace(/(?:^|[^\w\$_.])require\s*\(\s*["']([^"']*)["']\s*\)/g, function(_, id) {
        o[id] = true;
    });
    return Object.keys(o);
};

// Built-in compiler/preprocessor "middleware":

Require.DependenciesCompiler = function(config, compile) {
    return function(module) {
        if (!module.dependencies && module.text !== void 0) {
            module.dependencies = config.parseDependencies(module.text);
        }
        compile(module);
        if (module && !module.dependencies) {
            if (module.text || module.factory) {
                module.dependencies = Require.parseDependencies(module.text || module.factory);
            } else {
                module.dependencies = [];
            }
        }
        return module;
    };
};

// Support she-bang for shell scripts by commenting it out (it is never
// valid JavaScript syntax anyway)
Require.ShebangCompiler = function(config, compile) {
    return function (module) {
        if (module.text) {
            module.text = module.text.replace(/^#!/, "//#!");
        }
        compile(module);
    };
};

Require.LintCompiler = function(config, compile) {
    return function(module) {
        try {
            compile(module);
        } catch (error) {
            if (config.lint) {
                // TODO: use ASAP
                Q.nextTick(function () {
                    config.lint(module);
                });
            }
            throw error;
        }
    };
};

Require.exposedConfigs = [
    "paths",
    "mappings",
    "location",
    "packageDescription",
    "packages",
    "modules"
];

Require.makeCompiler = function(config) {
    return Require.JsonCompiler(
        config,
        Require.ShebangCompiler(
            config,
            Require.DependenciesCompiler(
                config,
                Require.LintCompiler(
                    config,
                    Require.Compiler(config)
                )
            )
        )
    );
};

Require.JsonCompiler = function (config, compile) {
    return function (module) {
        var json = (module.location || "").match(/\.json$/);
        if (json) {
            module.exports = JSON.parse(module.text);
            return module;
        } else {
            return compile(module);
        }
    };
};

// Built-in loader "middleware":

// Using mappings hash to load modules that match a mapping.
Require.MappingsLoader = function(config, load) {
    config.mappings = config.mappings || {};
    config.name = config.name;

    // finds a mapping to follow, if any
    return function (id, module) {
        var mappings = config.mappings;
        var prefixes = Object.keys(mappings);
        var length = prefixes.length;

        if (Require.isAbsolute(id)) {
            return load(id, module);
        }
        // TODO: remove this when all code has been migrated off of the autonomous name-space problem
        if (
            config.name !== void 0 &&
            id.indexOf(config.name) === 0 &&
            id.charAt(config.name.length) === "/"
        ) {
            console.warn("Package reflexive module ignored:", id);
        }
        var i, prefix;
        for (i = 0; i < length; i++) {
            prefix = prefixes[i];
            if (
                id === prefix ||
                id.indexOf(prefix) === 0 &&
                id.charAt(prefix.length) === "/"
            ) {
                /*jshint -W083 */
                var mapping = mappings[prefix];
                var rest = id.slice(prefix.length + 1);
                return config.loadPackage(mapping, config)
                .then(function (mappingRequire) {
                    /*jshint +W083 */
                    module.mappingRedirect = rest;
                    module.mappingRequire = mappingRequire;
                    return mappingRequire.deepLoad(rest, config.location);
                });
            }
        }
        return load(id, module);
    };
};

Require.ExtensionsLoader = function(config, load) {
    var extensions = config.extensions || ["js"];
    var loadWithExtension = extensions.reduceRight(function (next, extension) {
        return function (id, module) {
            return load(id + "." + extension, module)
            .fail(function (error) {
                if (/^Can't find /.test(error.message)) {
                    return next(id, module);
                } else {
                    throw error;
                }
            });
        };
    }, function (id, module) {
        throw new Error(
            "Can't find " + JSON.stringify(id) + " with extensions " +
            JSON.stringify(extensions) + " in package at " +
            JSON.stringify(config.location)
        );
    });
    return function (id, module) {
        if (Require.base(id).indexOf(".") !== -1) {
            // already has an extension
            return load(id, module);
        } else {
            return loadWithExtension(id, module);
        }
    };
};

// Attempts to load using multiple base paths (or one absolute path) with a
// single loader.
Require.PathsLoader = function(config, load) {
    var loadFromPaths = config.paths.reduceRight(function (next, path) {
        return function (id, module) {
            var newId = URL.resolve(path, id);
            return load(newId, module)
            .fail(function (error) {
                if (/^Can't find /.test(error.message)) {
                    return next(id, module);
                } else {
                    throw error;
                }
            });
        };
    }, function (id, module) {
        throw new Error(
            "Can't find " + JSON.stringify(id) + " from paths " +
            JSON.stringify(config.paths) + " in package at " +
            JSON.stringify(config.location)
        );
    });
    return function(id, module) {
        if (Require.isAbsolute(id)) {
            // already fully qualified
            return load(id, module);
        } else {
            return loadFromPaths(id, module);
        }
    };
};

Require.MemoizedLoader = function (config, load) {
    var cache = config.cache = config.cache || {};
    return memoize(load, cache);
};

var normalizeId = function (id) {
    var match = /^(.*)\.js$/.exec(id);
    if (match) {
        id = match[1];
    }
    return id;
};

var memoize = function (callback, cache) {
    cache = cache || {};
    return function (key, arg) {
        if (!has(cache, key)) {
            cache[key] = Q.fcall(callback, key, arg);
        }
        return cache[key];
    };
};

}],[{},function (require, exports, module){

// q q
// ---

// vim:ts=4:sts=4:sw=4:
/*!
 *
 * Copyright 2009-2012 Kris Kowal under the terms of the MIT
 * license found at http://github.com/kriskowal/q/raw/master/LICENSE
 *
 * With parts by Tyler Close
 * Copyright 2007-2009 Tyler Close under the terms of the MIT X license found
 * at http://www.opensource.org/licenses/mit-license.html
 * Forked at ref_send.js version: 2009-05-11
 *
 * With parts by Mark Miller
 * Copyright (C) 2011 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */

(function (definition) {
    // Turn off strict mode for this function so we can assign to global.Q
    /* jshint strict: false */

    // This file will function properly as a <script> tag, or a module
    // using CommonJS and NodeJS or RequireJS module formats.  In
    // Common/Node/RequireJS, the module exports the Q API and when
    // executed as a simple <script>, it creates a Q global instead.

    // Montage Require
    if (typeof bootstrap === "function") {
        bootstrap("promise", definition);

    // CommonJS
    } else if (typeof exports === "object") {
        module.exports = definition();

    // RequireJS
    } else if (typeof define === "function" && define.amd) {
        define(definition);

    // SES (Secure EcmaScript)
    } else if (typeof ses !== "undefined") {
        if (!ses.ok()) {
            return;
        } else {
            ses.makeQ = definition;
        }

    // <script>
    } else {
        Q = definition();
    }

})(function () {
"use strict";

var hasStacks = false;
try {
    throw new Error();
} catch (e) {
    hasStacks = !!e.stack;
}

// All code after this point will be filtered from stack traces reported
// by Q.
var qStartingLine = captureLine();
var qFileName;

// shims

// used for fallback in "allResolved"
var noop = function () {};

// Use the fastest possible means to execute a task in a future turn
// of the event loop.
var nextTick =(function () {
    // linked list of tasks (single, with head node)
    var head = {task: void 0, next: null};
    var tail = head;
    var flushing = false;
    var requestTick = void 0;
    var isNodeJS = false;

    function flush() {
        while (head.next) {
            head = head.next;
            var task = head.task;
            head.task = void 0;
            var domain = head.domain;

            if (domain) {
                head.domain = void 0;
                domain.enter();
            }

            try {
                task();

            } catch (e) {
                if (isNodeJS) {
                    // In node, uncaught exceptions are considered fatal errors.
                    // Re-throw them synchronously to interrupt flushing!

                    // Ensure continuation if the uncaught exception is suppressed
                    // listening "uncaughtException" events (as domains does).
                    // Continue in next event to avoid tick recursion.
                    domain && domain.exit();
                    setTimeout(flush, 0);
                    domain && domain.enter();

                    throw e;

                } else {
                    // In browsers, uncaught exceptions are not fatal.
                    // Re-throw them asynchronously to avoid slow-downs.
                    setTimeout(function() {
                       throw e;
                    }, 0);
                }
            }

            if (domain) {
                domain.exit();
            }
        }

        flushing = false;
    }

    nextTick = function (task) {
        tail = tail.next = {
            task: task,
            domain: isNodeJS && process.domain,
            next: null
        };

        if (!flushing) {
            flushing = true;
            requestTick();
        }
    };

    if (typeof process !== "undefined" && process.nextTick) {
        // Node.js before 0.9. Note that some fake-Node environments, like the
        // Mocha test runner, introduce a `process` global without a `nextTick`.
        isNodeJS = true;

        requestTick = function () {
            process.nextTick(flush);
        };

    } else if (typeof setImmediate === "function") {
        // In IE10, Node.js 0.9+, or https://github.com/NobleJS/setImmediate
        if (typeof window !== "undefined") {
            requestTick = setImmediate.bind(window, flush);
        } else {
            requestTick = function () {
                setImmediate(flush);
            };
        }

    } else if (typeof MessageChannel !== "undefined") {
        // modern browsers
        // http://www.nonblocking.io/2011/06/windownexttick.html
        var channel = new MessageChannel();
        channel.port1.onmessage = flush;
        requestTick = function () {
            channel.port2.postMessage(0);
        };

    } else {
        // old browsers
        requestTick = function () {
            setTimeout(flush, 0);
        };
    }

    return nextTick;
})();

// Attempt to make generics safe in the face of downstream
// modifications.
// There is no situation where this is necessary.
// If you need a security guarantee, these primordials need to be
// deeply frozen anyway, and if you don’t need a security guarantee,
// this is just plain paranoid.
// However, this does have the nice side-effect of reducing the size
// of the code by reducing x.call() to merely x(), eliminating many
// hard-to-minify characters.
// See Mark Miller’s explanation of what this does.
// http://wiki.ecmascript.org/doku.php?id=conventions:safe_meta_programming
function uncurryThis(f) {
    var call = Function.call;
    return function () {
        return call.apply(f, arguments);
    };
}
// This is equivalent, but slower:
// uncurryThis = Function_bind.bind(Function_bind.call);
// http://jsperf.com/uncurrythis

var array_slice = uncurryThis(Array.prototype.slice);

var array_reduce = uncurryThis(
    Array.prototype.reduce || function (callback, basis) {
        var index = 0,
            length = this.length;
        // concerning the initial value, if one is not provided
        if (arguments.length === 1) {
            // seek to the first value in the array, accounting
            // for the possibility that is is a sparse array
            do {
                if (index in this) {
                    basis = this[index++];
                    break;
                }
                if (++index >= length) {
                    throw new TypeError();
                }
            } while (1);
        }
        // reduce
        for (; index < length; index++) {
            // account for the possibility that the array is sparse
            if (index in this) {
                basis = callback(basis, this[index], index);
            }
        }
        return basis;
    }
);

var array_indexOf = uncurryThis(
    Array.prototype.indexOf || function (value) {
        // not a very good shim, but good enough for our one use of it
        for (var i = 0; i < this.length; i++) {
            if (this[i] === value) {
                return i;
            }
        }
        return -1;
    }
);

var array_map = uncurryThis(
    Array.prototype.map || function (callback, thisp) {
        var self = this;
        var collect = [];
        array_reduce(self, function (undefined, value, index) {
            collect.push(callback.call(thisp, value, index, self));
        }, void 0);
        return collect;
    }
);

var object_create = Object.create || function (prototype) {
    function Type() { }
    Type.prototype = prototype;
    return new Type();
};

var object_hasOwnProperty = uncurryThis(Object.prototype.hasOwnProperty);

var object_keys = Object.keys || function (object) {
    var keys = [];
    for (var key in object) {
        if (object_hasOwnProperty(object, key)) {
            keys.push(key);
        }
    }
    return keys;
};

var object_toString = uncurryThis(Object.prototype.toString);

function isObject(value) {
    return value === Object(value);
}

// generator related shims

// FIXME: Remove this function once ES6 generators are in SpiderMonkey.
function isStopIteration(exception) {
    return (
        object_toString(exception) === "[object StopIteration]" ||
        exception instanceof QReturnValue
    );
}

// FIXME: Remove this helper and Q.return once ES6 generators are in
// SpiderMonkey.
var QReturnValue;
if (typeof ReturnValue !== "undefined") {
    QReturnValue = ReturnValue;
} else {
    QReturnValue = function (value) {
        this.value = value;
    };
}

// Until V8 3.19 / Chromium 29 is released, SpiderMonkey is the only
// engine that has a deployed base of browsers that support generators.
// However, SM's generators use the Python-inspired semantics of
// outdated ES6 drafts.  We would like to support ES6, but we'd also
// like to make it possible to use generators in deployed browsers, so
// we also support Python-style generators.  At some point we can remove
// this block.
var hasES6Generators;
try {
    /* jshint evil: true, nonew: false */
    new Function("(function* (){ yield 1; })");
    hasES6Generators = true;
} catch (e) {
    hasES6Generators = false;
}

// long stack traces

var STACK_JUMP_SEPARATOR = "From previous event:";

function makeStackTraceLong(error, promise) {
    // If possible, transform the error stack trace by removing Node and Q
    // cruft, then concatenating with the stack trace of `promise`. See #57.
    if (hasStacks &&
        promise.stack &&
        typeof error === "object" &&
        error !== null &&
        error.stack &&
        error.stack.indexOf(STACK_JUMP_SEPARATOR) === -1
    ) {
        var stacks = [];
        for (var p = promise; !!p; p = p.source) {
            if (p.stack) {
                stacks.unshift(p.stack);
            }
        }
        stacks.unshift(error.stack);

        var concatedStacks = stacks.join("\n" + STACK_JUMP_SEPARATOR + "\n");
        error.stack = filterStackString(concatedStacks);
    }
}

function filterStackString(stackString) {
    var lines = stackString.split("\n");
    var desiredLines = [];
    for (var i = 0; i < lines.length; ++i) {
        var line = lines[i];

        if (!isInternalFrame(line) && !isNodeFrame(line) && line) {
            desiredLines.push(line);
        }
    }
    return desiredLines.join("\n");
}

function isNodeFrame(stackLine) {
    return stackLine.indexOf("(module.js:") !== -1 ||
           stackLine.indexOf("(node.js:") !== -1;
}

function getFileNameAndLineNumber(stackLine) {
    // Named functions: "at functionName (filename:lineNumber:columnNumber)"
    // In IE10 function name can have spaces ("Anonymous function") O_o
    var attempt1 = /at .+ \((.+):(\d+):(?:\d+)\)$/.exec(stackLine);
    if (attempt1) {
        return [attempt1[1], Number(attempt1[2])];
    }

    // Anonymous functions: "at filename:lineNumber:columnNumber"
    var attempt2 = /at ([^ ]+):(\d+):(?:\d+)$/.exec(stackLine);
    if (attempt2) {
        return [attempt2[1], Number(attempt2[2])];
    }

    // Firefox style: "function@filename:lineNumber or @filename:lineNumber"
    var attempt3 = /.*@(.+):(\d+)$/.exec(stackLine);
    if (attempt3) {
        return [attempt3[1], Number(attempt3[2])];
    }
}

function isInternalFrame(stackLine) {
    var fileNameAndLineNumber = getFileNameAndLineNumber(stackLine);

    if (!fileNameAndLineNumber) {
        return false;
    }

    var fileName = fileNameAndLineNumber[0];
    var lineNumber = fileNameAndLineNumber[1];

    return fileName === qFileName &&
        lineNumber >= qStartingLine &&
        lineNumber <= qEndingLine;
}

// discover own file name and line number range for filtering stack
// traces
function captureLine() {
    if (!hasStacks) {
        return;
    }

    try {
        throw new Error();
    } catch (e) {
        var lines = e.stack.split("\n");
        var firstLine = lines[0].indexOf("@") > 0 ? lines[1] : lines[2];
        var fileNameAndLineNumber = getFileNameAndLineNumber(firstLine);
        if (!fileNameAndLineNumber) {
            return;
        }

        qFileName = fileNameAndLineNumber[0];
        return fileNameAndLineNumber[1];
    }
}

function deprecate(callback, name, alternative) {
    return function () {
        if (typeof console !== "undefined" &&
            typeof console.warn === "function") {
            console.warn(name + " is deprecated, use " + alternative +
                         " instead.", new Error("").stack);
        }
        return callback.apply(callback, arguments);
    };
}

// end of shims
// beginning of real work

/**
 * Creates fulfilled promises from non-thenables,
 * Passes Q promises through,
 * Coerces other thenables to Q promises.
 */
function Q(value) {
    return resolve(value);
}

/**
 * Performs a task in a future turn of the event loop.
 * @param {Function} task
 */
Q.nextTick = nextTick;

/**
 * Controls whether or not long stack traces will be on
 */
Q.longStackSupport = false;

/**
 * Constructs a {promise, resolve, reject} object.
 *
 * `resolve` is a callback to invoke with a more resolved value for the
 * promise. To fulfill the promise, invoke `resolve` with any value that is
 * not a thenable. To reject the promise, invoke `resolve` with a rejected
 * thenable, or invoke `reject` with the reason directly. To resolve the
 * promise to another thenable, thus putting it in the same state, invoke
 * `resolve` with that other thenable.
 */
Q.defer = defer;
function defer() {
    // if "messages" is an "Array", that indicates that the promise has not yet
    // been resolved.  If it is "undefined", it has been resolved.  Each
    // element of the messages array is itself an array of complete arguments to
    // forward to the resolved promise.  We coerce the resolution value to a
    // promise using the `resolve` function because it handles both fully
    // non-thenable values and other thenables gracefully.
    var messages = [], progressListeners = [], resolvedPromise;

    var deferred = object_create(defer.prototype);
    var promise = object_create(Promise.prototype);

    promise.promiseDispatch = function (resolve, op, operands) {
        var args = array_slice(arguments);
        if (messages) {
            messages.push(args);
            if (op === "when" && operands[1]) { // progress operand
                progressListeners.push(operands[1]);
            }
        } else {
            nextTick(function () {
                resolvedPromise.promiseDispatch.apply(resolvedPromise, args);
            });
        }
    };

    // XXX deprecated
    promise.valueOf = deprecate(function () {
        if (messages) {
            return promise;
        }
        var nearerValue = nearer(resolvedPromise);
        if (isPromise(nearerValue)) {
            resolvedPromise = nearerValue; // shorten chain
        }
        return nearerValue;
    }, "valueOf", "inspect");

    promise.inspect = function () {
        if (!resolvedPromise) {
            return { state: "pending" };
        }
        return resolvedPromise.inspect();
    };

    if (Q.longStackSupport && hasStacks) {
        try {
            throw new Error();
        } catch (e) {
            // NOTE: don't try to use `Error.captureStackTrace` or transfer the
            // accessor around; that causes memory leaks as per GH-111. Just
            // reify the stack trace as a string ASAP.
            //
            // At the same time, cut off the first line; it's always just
            // "[object Promise]\n", as per the `toString`.
            promise.stack = e.stack.substring(e.stack.indexOf("\n") + 1);
        }
    }

    // NOTE: we do the checks for `resolvedPromise` in each method, instead of
    // consolidating them into `become`, since otherwise we'd create new
    // promises with the lines `become(whatever(value))`. See e.g. GH-252.

    function become(newPromise) {
        resolvedPromise = newPromise;
        promise.source = newPromise;

        array_reduce(messages, function (undefined, message) {
            nextTick(function () {
                newPromise.promiseDispatch.apply(newPromise, message);
            });
        }, void 0);

        messages = void 0;
        progressListeners = void 0;
    }

    deferred.promise = promise;
    deferred.resolve = function (value) {
        if (resolvedPromise) {
            return;
        }

        become(resolve(value));
    };

    deferred.fulfill = function (value) {
        if (resolvedPromise) {
            return;
        }

        become(fulfill(value));
    };
    deferred.reject = function (reason) {
        if (resolvedPromise) {
            return;
        }

        become(reject(reason));
    };
    deferred.notify = function (progress) {
        if (resolvedPromise) {
            return;
        }

        array_reduce(progressListeners, function (undefined, progressListener) {
            nextTick(function () {
                progressListener(progress);
            });
        }, void 0);
    };

    return deferred;
}

/**
 * Creates a Node-style callback that will resolve or reject the deferred
 * promise.
 * @returns a nodeback
 */
defer.prototype.makeNodeResolver = function () {
    var self = this;
    return function (error, value) {
        if (error) {
            self.reject(error);
        } else if (arguments.length > 2) {
            self.resolve(array_slice(arguments, 1));
        } else {
            self.resolve(value);
        }
    };
};

/**
 * @param resolver {Function} a function that returns nothing and accepts
 * the resolve, reject, and notify functions for a deferred.
 * @returns a promise that may be resolved with the given resolve and reject
 * functions, or rejected by a thrown exception in resolver
 */
Q.promise = promise;
function promise(resolver) {
    if (typeof resolver !== "function") {
        throw new TypeError("resolver must be a function.");
    }

    var deferred = defer();
    fcall(
        resolver,
        deferred.resolve,
        deferred.reject,
        deferred.notify
    ).fail(deferred.reject);
    return deferred.promise;
}

/**
 * Constructs a Promise with a promise descriptor object and optional fallback
 * function.  The descriptor contains methods like when(rejected), get(name),
 * set(name, value), post(name, args), and delete(name), which all
 * return either a value, a promise for a value, or a rejection.  The fallback
 * accepts the operation name, a resolver, and any further arguments that would
 * have been forwarded to the appropriate method above had a method been
 * provided with the proper name.  The API makes no guarantees about the nature
 * of the returned object, apart from that it is usable whereever promises are
 * bought and sold.
 */
Q.makePromise = Promise;
function Promise(descriptor, fallback, inspect) {
    if (fallback === void 0) {
        fallback = function (op) {
            return reject(new Error(
                "Promise does not support operation: " + op
            ));
        };
    }
    if (inspect === void 0) {
        inspect = function () {
            return {state: "unknown"};
        };
    }

    var promise = object_create(Promise.prototype);

    promise.promiseDispatch = function (resolve, op, args) {
        var result;
        try {
            if (descriptor[op]) {
                result = descriptor[op].apply(promise, args);
            } else {
                result = fallback.call(promise, op, args);
            }
        } catch (exception) {
            result = reject(exception);
        }
        if (resolve) {
            resolve(result);
        }
    };

    promise.inspect = inspect;

    // XXX deprecated `valueOf` and `exception` support
    if (inspect) {
        var inspected = inspect();
        if (inspected.state === "rejected") {
            promise.exception = inspected.reason;
        }

        promise.valueOf = deprecate(function () {
            var inspected = inspect();
            if (inspected.state === "pending" ||
                inspected.state === "rejected") {
                return promise;
            }
            return inspected.value;
        });
    }

    return promise;
}

Promise.prototype.then = function (fulfilled, rejected, progressed) {
    var self = this;
    var deferred = defer();
    var done = false;   // ensure the untrusted promise makes at most a
                        // single call to one of the callbacks

    function _fulfilled(value) {
        try {
            return typeof fulfilled === "function" ? fulfilled(value) : value;
        } catch (exception) {
            return reject(exception);
        }
    }

    function _rejected(exception) {
        if (typeof rejected === "function") {
            makeStackTraceLong(exception, self);
            try {
                return rejected(exception);
            } catch (newException) {
                return reject(newException);
            }
        }
        return reject(exception);
    }

    function _progressed(value) {
        return typeof progressed === "function" ? progressed(value) : value;
    }

    nextTick(function () {
        self.promiseDispatch(function (value) {
            if (done) {
                return;
            }
            done = true;

            deferred.resolve(_fulfilled(value));
        }, "when", [function (exception) {
            if (done) {
                return;
            }
            done = true;

            deferred.resolve(_rejected(exception));
        }]);
    });

    // Progress propagator need to be attached in the current tick.
    self.promiseDispatch(void 0, "when", [void 0, function (value) {
        var newValue;
        var threw = false;
        try {
            newValue = _progressed(value);
        } catch (e) {
            threw = true;
            if (Q.onerror) {
                Q.onerror(e);
            } else {
                throw e;
            }
        }

        if (!threw) {
            deferred.notify(newValue);
        }
    }]);

    return deferred.promise;
};

Promise.prototype.thenResolve = function (value) {
    return when(this, function () { return value; });
};

Promise.prototype.thenReject = function (reason) {
    return when(this, function () { throw reason; });
};

// Chainable methods
array_reduce(
    [
        "isFulfilled", "isRejected", "isPending",
        "dispatch",
        "when", "spread",
        "get", "set", "del", "delete",
        "post", "send", "mapply", "invoke", "mcall",
        "keys",
        "fapply", "fcall", "fbind",
        "all", "allResolved",
        "timeout", "delay",
        "catch", "finally", "fail", "fin", "progress", "done",
        "nfcall", "nfapply", "nfbind", "denodeify", "nbind",
        "npost", "nsend", "nmapply", "ninvoke", "nmcall",
        "nodeify"
    ],
    function (undefined, name) {
        Promise.prototype[name] = function () {
            return Q[name].apply(
                Q,
                [this].concat(array_slice(arguments))
            );
        };
    },
    void 0
);

Promise.prototype.toSource = function () {
    return this.toString();
};

Promise.prototype.toString = function () {
    return "[object Promise]";
};

/**
 * If an object is not a promise, it is as "near" as possible.
 * If a promise is rejected, it is as "near" as possible too.
 * If it’s a fulfilled promise, the fulfillment value is nearer.
 * If it’s a deferred promise and the deferred has been resolved, the
 * resolution is "nearer".
 * @param object
 * @returns most resolved (nearest) form of the object
 */

// XXX should we re-do this?
Q.nearer = nearer;
function nearer(value) {
    if (isPromise(value)) {
        var inspected = value.inspect();
        if (inspected.state === "fulfilled") {
            return inspected.value;
        }
    }
    return value;
}

/**
 * @returns whether the given object is a promise.
 * Otherwise it is a fulfilled value.
 */
Q.isPromise = isPromise;
function isPromise(object) {
    return isObject(object) &&
        typeof object.promiseDispatch === "function" &&
        typeof object.inspect === "function";
}

Q.isPromiseAlike = isPromiseAlike;
function isPromiseAlike(object) {
    return isObject(object) && typeof object.then === "function";
}

/**
 * @returns whether the given object is a pending promise, meaning not
 * fulfilled or rejected.
 */
Q.isPending = isPending;
function isPending(object) {
    return isPromise(object) && object.inspect().state === "pending";
}

/**
 * @returns whether the given object is a value or fulfilled
 * promise.
 */
Q.isFulfilled = isFulfilled;
function isFulfilled(object) {
    return !isPromise(object) || object.inspect().state === "fulfilled";
}

/**
 * @returns whether the given object is a rejected promise.
 */
Q.isRejected = isRejected;
function isRejected(object) {
    return isPromise(object) && object.inspect().state === "rejected";
}

//// BEGIN UNHANDLED REJECTION TRACKING

// This promise library consumes exceptions thrown in handlers so they can be
// handled by a subsequent promise.  The exceptions get added to this array when
// they are created, and removed when they are handled.  Note that in ES6 or
// shimmed environments, this would naturally be a `Set`.
var unhandledReasons = [];
var unhandledRejections = [];
var unhandledReasonsDisplayed = false;
var trackUnhandledRejections = true;
function displayUnhandledReasons() {
    if (
        !unhandledReasonsDisplayed &&
        typeof window !== "undefined" &&
        !window.Touch &&
        window.console
    ) {
        console.warn("[Q] Unhandled rejection reasons (should be empty):",
                     unhandledReasons);
    }

    unhandledReasonsDisplayed = true;
}

function logUnhandledReasons() {
    for (var i = 0; i < unhandledReasons.length; i++) {
        var reason = unhandledReasons[i];
        if (reason && typeof reason.stack !== "undefined") {
            console.warn("Unhandled rejection reason:", reason.stack);
        } else {
            console.warn("Unhandled rejection reason (no stack):", reason);
        }
    }
}

function resetUnhandledRejections() {
    unhandledReasons.length = 0;
    unhandledRejections.length = 0;
    unhandledReasonsDisplayed = false;

    if (!trackUnhandledRejections) {
        trackUnhandledRejections = true;

        // Show unhandled rejection reasons if Node exits without handling an
        // outstanding rejection.  (Note that Browserify presently produces a
        // `process` global without the `EventEmitter` `on` method.)
        if (typeof process !== "undefined" && process.on) {
            process.on("exit", logUnhandledReasons);
        }
    }
}

function trackRejection(promise, reason) {
    if (!trackUnhandledRejections) {
        return;
    }

    unhandledRejections.push(promise);
    unhandledReasons.push(reason);
    displayUnhandledReasons();
}

function untrackRejection(promise) {
    if (!trackUnhandledRejections) {
        return;
    }

    var at = array_indexOf(unhandledRejections, promise);
    if (at !== -1) {
        unhandledRejections.splice(at, 1);
        unhandledReasons.splice(at, 1);
    }
}

Q.resetUnhandledRejections = resetUnhandledRejections;

Q.getUnhandledReasons = function () {
    // Make a copy so that consumers can't interfere with our internal state.
    return unhandledReasons.slice();
};

Q.stopUnhandledRejectionTracking = function () {
    resetUnhandledRejections();
    if (typeof process !== "undefined" && process.on) {
        process.removeListener("exit", logUnhandledReasons);
    }
    trackUnhandledRejections = false;
};

resetUnhandledRejections();

//// END UNHANDLED REJECTION TRACKING

/**
 * Constructs a rejected promise.
 * @param reason value describing the failure
 */
Q.reject = reject;
function reject(reason) {
    var rejection = Promise({
        "when": function (rejected) {
            // note that the error has been handled
            if (rejected) {
                untrackRejection(this);
            }
            return rejected ? rejected(reason) : this;
        }
    }, function fallback() {
        return this;
    }, function inspect() {
        return { state: "rejected", reason: reason };
    });

    // Note that the reason has not been handled.
    trackRejection(rejection, reason);

    return rejection;
}

/**
 * Constructs a fulfilled promise for an immediate reference.
 * @param value immediate reference
 */
Q.fulfill = fulfill;
function fulfill(value) {
    return Promise({
        "when": function () {
            return value;
        },
        "get": function (name) {
            return value[name];
        },
        "set": function (name, rhs) {
            value[name] = rhs;
        },
        "delete": function (name) {
            delete value[name];
        },
        "post": function (name, args) {
            // Mark Miller proposes that post with no name should apply a
            // promised function.
            if (name === null || name === void 0) {
                return value.apply(void 0, args);
            } else {
                return value[name].apply(value, args);
            }
        },
        "apply": function (thisP, args) {
            return value.apply(thisP, args);
        },
        "keys": function () {
            return object_keys(value);
        }
    }, void 0, function inspect() {
        return { state: "fulfilled", value: value };
    });
}

/**
 * Constructs a promise for an immediate reference, passes promises through, or
 * coerces promises from different systems.
 * @param value immediate reference or promise
 */
Q.resolve = resolve;
function resolve(value) {
    // If the object is already a Promise, return it directly.  This enables
    // the resolve function to both be used to created references from objects,
    // but to tolerably coerce non-promises to promises.
    if (isPromise(value)) {
        return value;
    }

    // assimilate thenables
    if (isPromiseAlike(value)) {
        return coerce(value);
    } else {
        return fulfill(value);
    }
}

/**
 * Converts thenables to Q promises.
 * @param promise thenable promise
 * @returns a Q promise
 */
function coerce(promise) {
    var deferred = defer();
    nextTick(function () {
        try {
            promise.then(deferred.resolve, deferred.reject, deferred.notify);
        } catch (exception) {
            deferred.reject(exception);
        }
    });
    return deferred.promise;
}

/**
 * Annotates an object such that it will never be
 * transferred away from this process over any promise
 * communication channel.
 * @param object
 * @returns promise a wrapping of that object that
 * additionally responds to the "isDef" message
 * without a rejection.
 */
Q.master = master;
function master(object) {
    return Promise({
        "isDef": function () {}
    }, function fallback(op, args) {
        return dispatch(object, op, args);
    }, function () {
        return resolve(object).inspect();
    });
}

/**
 * Registers an observer on a promise.
 *
 * Guarantees:
 *
 * 1. that fulfilled and rejected will be called only once.
 * 2. that either the fulfilled callback or the rejected callback will be
 *    called, but not both.
 * 3. that fulfilled and rejected will not be called in this turn.
 *
 * @param value      promise or immediate reference to observe
 * @param fulfilled  function to be called with the fulfilled value
 * @param rejected   function to be called with the rejection exception
 * @param progressed function to be called on any progress notifications
 * @return promise for the return value from the invoked callback
 */
Q.when = when;
function when(value, fulfilled, rejected, progressed) {
    return Q(value).then(fulfilled, rejected, progressed);
}

/**
 * Spreads the values of a promised array of arguments into the
 * fulfillment callback.
 * @param fulfilled callback that receives variadic arguments from the
 * promised array
 * @param rejected callback that receives the exception if the promise
 * is rejected.
 * @returns a promise for the return value or thrown exception of
 * either callback.
 */
Q.spread = spread;
function spread(promise, fulfilled, rejected) {
    return when(promise, function (valuesOrPromises) {
        return all(valuesOrPromises).then(function (values) {
            return fulfilled.apply(void 0, values);
        }, rejected);
    }, rejected);
}

/**
 * The async function is a decorator for generator functions, turning
 * them into asynchronous generators.  Although generators are only part
 * of the newest ECMAScript 6 drafts, this code does not cause syntax
 * errors in older engines.  This code should continue to work and will
 * in fact improve over time as the language improves.
 *
 * ES6 generators are currently part of V8 version 3.19 with the
 * --harmony-generators runtime flag enabled.  SpiderMonkey has had them
 * for longer, but under an older Python-inspired form.  This function
 * works on both kinds of generators.
 *
 * Decorates a generator function such that:
 *  - it may yield promises
 *  - execution will continue when that promise is fulfilled
 *  - the value of the yield expression will be the fulfilled value
 *  - it returns a promise for the return value (when the generator
 *    stops iterating)
 *  - the decorated function returns a promise for the return value
 *    of the generator or the first rejected promise among those
 *    yielded.
 *  - if an error is thrown in the generator, it propagates through
 *    every following yield until it is caught, or until it escapes
 *    the generator function altogether, and is translated into a
 *    rejection for the promise returned by the decorated generator.
 */
Q.async = async;
function async(makeGenerator) {
    return function () {
        // when verb is "send", arg is a value
        // when verb is "throw", arg is an exception
        function continuer(verb, arg) {
            var result;
            if (hasES6Generators) {
                try {
                    result = generator[verb](arg);
                } catch (exception) {
                    return reject(exception);
                }
                if (result.done) {
                    return result.value;
                } else {
                    return when(result.value, callback, errback);
                }
            } else {
                // FIXME: Remove this case when SM does ES6 generators.
                try {
                    result = generator[verb](arg);
                } catch (exception) {
                    if (isStopIteration(exception)) {
                        return exception.value;
                    } else {
                        return reject(exception);
                    }
                }
                return when(result, callback, errback);
            }
        }
        var generator = makeGenerator.apply(this, arguments);
        var callback = continuer.bind(continuer, "send");
        var errback = continuer.bind(continuer, "throw");
        return callback();
    };
}

/**
 * The spawn function is a small wrapper around async that immediately
 * calls the generator and also ends the promise chain, so that any
 * unhandled errors are thrown instead of forwarded to the error
 * handler. This is useful because it's extremely common to run
 * generators at the top-level to work with libraries.
 */
Q.spawn = spawn;
function spawn(makeGenerator) {
    Q.done(Q.async(makeGenerator)());
}

// FIXME: Remove this interface once ES6 generators are in SpiderMonkey.
/**
 * Throws a ReturnValue exception to stop an asynchronous generator.
 *
 * This interface is a stop-gap measure to support generator return
 * values in older Firefox/SpiderMonkey.  In browsers that support ES6
 * generators like Chromium 29, just use "return" in your generator
 * functions.
 *
 * @param value the return value for the surrounding generator
 * @throws ReturnValue exception with the value.
 * @example
 * // ES6 style
 * Q.async(function* () {
 *      var foo = yield getFooPromise();
 *      var bar = yield getBarPromise();
 *      return foo + bar;
 * })
 * // Older SpiderMonkey style
 * Q.async(function () {
 *      var foo = yield getFooPromise();
 *      var bar = yield getBarPromise();
 *      Q.return(foo + bar);
 * })
 */
Q["return"] = _return;
function _return(value) {
    throw new QReturnValue(value);
}

/**
 * The promised function decorator ensures that any promise arguments
 * are settled and passed as values (`this` is also settled and passed
 * as a value).  It will also ensure that the result of a function is
 * always a promise.
 *
 * @example
 * var add = Q.promised(function (a, b) {
 *     return a + b;
 * });
 * add(Q.resolve(a), Q.resolve(B));
 *
 * @param {function} callback The function to decorate
 * @returns {function} a function that has been decorated.
 */
Q.promised = promised;
function promised(callback) {
    return function () {
        return spread([this, all(arguments)], function (self, args) {
            return callback.apply(self, args);
        });
    };
}

/**
 * sends a message to a value in a future turn
 * @param object* the recipient
 * @param op the name of the message operation, e.g., "when",
 * @param args further arguments to be forwarded to the operation
 * @returns result {Promise} a promise for the result of the operation
 */
Q.dispatch = dispatch;
function dispatch(object, op, args) {
    var deferred = defer();
    nextTick(function () {
        resolve(object).promiseDispatch(deferred.resolve, op, args);
    });
    return deferred.promise;
}

/**
 * Constructs a promise method that can be used to safely observe resolution of
 * a promise for an arbitrarily named method like "propfind" in a future turn.
 *
 * "dispatcher" constructs methods like "get(promise, name)" and "set(promise)".
 */
Q.dispatcher = dispatcher;
function dispatcher(op) {
    return function (object) {
        var args = array_slice(arguments, 1);
        return dispatch(object, op, args);
    };
}

/**
 * Gets the value of a property in a future turn.
 * @param object    promise or immediate reference for target object
 * @param name      name of property to get
 * @return promise for the property value
 */
Q.get = dispatcher("get");

/**
 * Sets the value of a property in a future turn.
 * @param object    promise or immediate reference for object object
 * @param name      name of property to set
 * @param value     new value of property
 * @return promise for the return value
 */
Q.set = dispatcher("set");

/**
 * Deletes a property in a future turn.
 * @param object    promise or immediate reference for target object
 * @param name      name of property to delete
 * @return promise for the return value
 */
Q["delete"] = // XXX experimental
Q.del = dispatcher("delete");

/**
 * Invokes a method in a future turn.
 * @param object    promise or immediate reference for target object
 * @param name      name of method to invoke
 * @param value     a value to post, typically an array of
 *                  invocation arguments for promises that
 *                  are ultimately backed with `resolve` values,
 *                  as opposed to those backed with URLs
 *                  wherein the posted value can be any
 *                  JSON serializable object.
 * @return promise for the return value
 */
// bound locally because it is used by other methods
var post = Q.post = dispatcher("post");
Q.mapply = post; // experimental

/**
 * Invokes a method in a future turn.
 * @param object    promise or immediate reference for target object
 * @param name      name of method to invoke
 * @param ...args   array of invocation arguments
 * @return promise for the return value
 */
Q.send = send;
Q.invoke = send; // synonyms
Q.mcall = send; // experimental
function send(value, name) {
    var args = array_slice(arguments, 2);
    return post(value, name, args);
}

/**
 * Applies the promised function in a future turn.
 * @param object    promise or immediate reference for target function
 * @param args      array of application arguments
 */
Q.fapply = fapply;
function fapply(value, args) {
    return dispatch(value, "apply", [void 0, args]);
}

/**
 * Calls the promised function in a future turn.
 * @param object    promise or immediate reference for target function
 * @param ...args   array of application arguments
 */
Q["try"] = fcall; // XXX experimental
Q.fcall = fcall;
function fcall(value) {
    var args = array_slice(arguments, 1);
    return fapply(value, args);
}

/**
 * Binds the promised function, transforming return values into a fulfilled
 * promise and thrown errors into a rejected one.
 * @param object    promise or immediate reference for target function
 * @param ...args   array of application arguments
 */
Q.fbind = fbind;
function fbind(value) {
    var args = array_slice(arguments, 1);
    return function fbound() {
        var allArgs = args.concat(array_slice(arguments));
        return dispatch(value, "apply", [this, allArgs]);
    };
}

/**
 * Requests the names of the owned properties of a promised
 * object in a future turn.
 * @param object    promise or immediate reference for target object
 * @return promise for the keys of the eventually settled object
 */
Q.keys = dispatcher("keys");

/**
 * Turns an array of promises into a promise for an array.  If any of
 * the promises gets rejected, the whole array is rejected immediately.
 * @param {Array*} an array (or promise for an array) of values (or
 * promises for values)
 * @returns a promise for an array of the corresponding values
 */
// By Mark Miller
// http://wiki.ecmascript.org/doku.php?id=strawman:concurrency&rev=1308776521#allfulfilled
Q.all = all;
function all(promises) {
    return when(promises, function (promises) {
        var countDown = 0;
        var deferred = defer();
        array_reduce(promises, function (undefined, promise, index) {
            var snapshot;
            if (
                isPromise(promise) &&
                (snapshot = promise.inspect()).state === "fulfilled"
            ) {
                promises[index] = snapshot.value;
            } else {
                ++countDown;
                when(promise, function (value) {
                    promises[index] = value;
                    if (--countDown === 0) {
                        deferred.resolve(promises);
                    }
                }, deferred.reject);
            }
        }, void 0);
        if (countDown === 0) {
            deferred.resolve(promises);
        }
        return deferred.promise;
    });
}

/**
 * Waits for all promises to be settled, either fulfilled or
 * rejected.  This is distinct from `all` since that would stop
 * waiting at the first rejection.  The promise returned by
 * `allResolved` will never be rejected.
 * @param promises a promise for an array (or an array) of promises
 * (or values)
 * @return a promise for an array of promises
 */
Q.allResolved = deprecate(allResolved, "allResolved", "allSettled");
function allResolved(promises) {
    return when(promises, function (promises) {
        promises = array_map(promises, resolve);
        return when(all(array_map(promises, function (promise) {
            return when(promise, noop, noop);
        })), function () {
            return promises;
        });
    });
}

Q.allSettled = allSettled;
function allSettled(values) {
    return when(values, function (values) {
        return all(array_map(values, function (value, i) {
            return when(
                value,
                function (fulfillmentValue) {
                    values[i] = { state: "fulfilled", value: fulfillmentValue };
                    return values[i];
                },
                function (reason) {
                    values[i] = { state: "rejected", reason: reason };
                    return values[i];
                }
            );
        })).thenResolve(values);
    });
}

/**
 * Captures the failure of a promise, giving an oportunity to recover
 * with a callback.  If the given promise is fulfilled, the returned
 * promise is fulfilled.
 * @param {Any*} promise for something
 * @param {Function} callback to fulfill the returned promise if the
 * given promise is rejected
 * @returns a promise for the return value of the callback
 */
Q["catch"] = // XXX experimental
Q.fail = fail;
function fail(promise, rejected) {
    return when(promise, void 0, rejected);
}

/**
 * Attaches a listener that can respond to progress notifications from a
 * promise's originating deferred. This listener receives the exact arguments
 * passed to ``deferred.notify``.
 * @param {Any*} promise for something
 * @param {Function} callback to receive any progress notifications
 * @returns the given promise, unchanged
 */
Q.progress = progress;
function progress(promise, progressed) {
    return when(promise, void 0, void 0, progressed);
}

/**
 * Provides an opportunity to observe the settling of a promise,
 * regardless of whether the promise is fulfilled or rejected.  Forwards
 * the resolution to the returned promise when the callback is done.
 * The callback can return a promise to defer completion.
 * @param {Any*} promise
 * @param {Function} callback to observe the resolution of the given
 * promise, takes no arguments.
 * @returns a promise for the resolution of the given promise when
 * ``fin`` is done.
 */
Q["finally"] = // XXX experimental
Q.fin = fin;
function fin(promise, callback) {
    return when(promise, function (value) {
        return when(callback(), function () {
            return value;
        });
    }, function (exception) {
        return when(callback(), function () {
            return reject(exception);
        });
    });
}

/**
 * Terminates a chain of promises, forcing rejections to be
 * thrown as exceptions.
 * @param {Any*} promise at the end of a chain of promises
 * @returns nothing
 */
Q.done = done;
function done(promise, fulfilled, rejected, progress) {
    var onUnhandledError = function (error) {
        // forward to a future turn so that ``when``
        // does not catch it and turn it into a rejection.
        nextTick(function () {
            makeStackTraceLong(error, promise);

            if (Q.onerror) {
                Q.onerror(error);
            } else {
                throw error;
            }
        });
    };

    // Avoid unnecessary `nextTick`ing via an unnecessary `when`.
    var promiseToHandle = fulfilled || rejected || progress ?
        when(promise, fulfilled, rejected, progress) :
        promise;

    if (typeof process === "object" && process && process.domain) {
        onUnhandledError = process.domain.bind(onUnhandledError);
    }
    fail(promiseToHandle, onUnhandledError);
}

/**
 * Causes a promise to be rejected if it does not get fulfilled before
 * some milliseconds time out.
 * @param {Any*} promise
 * @param {Number} milliseconds timeout
 * @param {String} custom error message (optional)
 * @returns a promise for the resolution of the given promise if it is
 * fulfilled before the timeout, otherwise rejected.
 */
Q.timeout = timeout;
function timeout(promise, ms, msg) {
    var deferred = defer();
    var timeoutId = setTimeout(function () {
        deferred.reject(new Error(msg || "Timed out after " + ms + " ms"));
    }, ms);

    when(promise, function (value) {
        clearTimeout(timeoutId);
        deferred.resolve(value);
    }, function (exception) {
        clearTimeout(timeoutId);
        deferred.reject(exception);
    }, deferred.notify);

    return deferred.promise;
}

/**
 * Returns a promise for the given value (or promised value) after some
 * milliseconds.
 * @param {Any*} promise
 * @param {Number} milliseconds
 * @returns a promise for the resolution of the given promise after some
 * time has elapsed.
 */
Q.delay = delay;
function delay(promise, timeout) {
    if (timeout === void 0) {
        timeout = promise;
        promise = void 0;
    }

    var deferred = defer();

    when(promise, undefined, undefined, deferred.notify);
    setTimeout(function () {
        deferred.resolve(promise);
    }, timeout);

    return deferred.promise;
}

/**
 * Passes a continuation to a Node function, which is called with the given
 * arguments provided as an array, and returns a promise.
 *
 *      Q.nfapply(FS.readFile, [__filename])
 *      .then(function (content) {
 *      })
 *
 */
Q.nfapply = nfapply;
function nfapply(callback, args) {
    var nodeArgs = array_slice(args);
    var deferred = defer();
    nodeArgs.push(deferred.makeNodeResolver());

    fapply(callback, nodeArgs).fail(deferred.reject);
    return deferred.promise;
}

/**
 * Passes a continuation to a Node function, which is called with the given
 * arguments provided individually, and returns a promise.
 *
 *      Q.nfcall(FS.readFile, __filename)
 *      .then(function (content) {
 *      })
 *
 */
Q.nfcall = nfcall;
function nfcall(callback/*, ...args */) {
    var nodeArgs = array_slice(arguments, 1);
    var deferred = defer();
    nodeArgs.push(deferred.makeNodeResolver());

    fapply(callback, nodeArgs).fail(deferred.reject);
    return deferred.promise;
}

/**
 * Wraps a NodeJS continuation passing function and returns an equivalent
 * version that returns a promise.
 *
 *      Q.nfbind(FS.readFile, __filename)("utf-8")
 *      .then(console.log)
 *      .done()
 *
 */
Q.nfbind = nfbind;
Q.denodeify = Q.nfbind; // synonyms
function nfbind(callback/*, ...args */) {
    var baseArgs = array_slice(arguments, 1);
    return function () {
        var nodeArgs = baseArgs.concat(array_slice(arguments));
        var deferred = defer();
        nodeArgs.push(deferred.makeNodeResolver());

        fapply(callback, nodeArgs).fail(deferred.reject);
        return deferred.promise;
    };
}

Q.nbind = nbind;
function nbind(callback, thisArg /*, ... args*/) {
    var baseArgs = array_slice(arguments, 2);
    return function () {
        var nodeArgs = baseArgs.concat(array_slice(arguments));
        var deferred = defer();
        nodeArgs.push(deferred.makeNodeResolver());

        function bound() {
            return callback.apply(thisArg, arguments);
        }

        fapply(bound, nodeArgs).fail(deferred.reject);
        return deferred.promise;
    };
}

/**
 * Calls a method of a Node-style object that accepts a Node-style
 * callback with a given array of arguments, plus a provided callback.
 * @param object an object that has the named method
 * @param {String} name name of the method of object
 * @param {Array} args arguments to pass to the method; the callback
 * will be provided by Q and appended to these arguments.
 * @returns a promise for the value or error
 */
Q.npost = npost;
Q.nmapply = npost; // synonyms
function npost(object, name, args) {
    var nodeArgs = array_slice(args || []);
    var deferred = defer();
    nodeArgs.push(deferred.makeNodeResolver());

    post(object, name, nodeArgs).fail(deferred.reject);
    return deferred.promise;
}

/**
 * Calls a method of a Node-style object that accepts a Node-style
 * callback, forwarding the given variadic arguments, plus a provided
 * callback argument.
 * @param object an object that has the named method
 * @param {String} name name of the method of object
 * @param ...args arguments to pass to the method; the callback will
 * be provided by Q and appended to these arguments.
 * @returns a promise for the value or error
 */
Q.nsend = nsend;
Q.ninvoke = Q.nsend; // synonyms
Q.nmcall = Q.nsend; // synonyms
function nsend(object, name /*, ...args*/) {
    var nodeArgs = array_slice(arguments, 2);
    var deferred = defer();
    nodeArgs.push(deferred.makeNodeResolver());
    post(object, name, nodeArgs).fail(deferred.reject);
    return deferred.promise;
}

Q.nodeify = nodeify;
function nodeify(promise, nodeback) {
    if (nodeback) {
        promise.then(function (value) {
            nextTick(function () {
                nodeback(null, value);
            });
        }, function (error) {
            nextTick(function () {
                nodeback(error);
            });
        });
    } else {
        return promise;
    }
}

// All code before this point will be filtered from stack traces.
var qEndingLine = captureLine();

return Q;

});
}]]})(this))
