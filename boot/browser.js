
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

