(function (global) {
    "use strict";

    var bootstrap = function (callback) {
        var domLoaded, Require, Promise, URL;

        var params = getParams();

        // observe dom loading and load scripts in parallel

        // observe dom loaded
        function domLoad() {
            document.removeEventListener("DOMContentLoaded", domLoad, true);
            domLoaded = true;
            callbackIfReady();
        }

        // this permits bootstrap.js to be injected after DOMContentLoaded
        // http://jsperf.com/readystate-boolean-vs-regex/2
        if (/interactive|complete/.test(document.readyState)) {
            domLoad();
        } else {
            document.addEventListener("DOMContentLoaded", domLoad, true);
        }

        // determine which scripts to load
        var pending = {
            "require": "require.js",
            "require/browser": "browser.js",
            "promise": "packages/q/q.js"
        };

        /*jshint -W089 */
        if (!global.preload) {
            var mrLocation = resolve(window.location, params.mrLocation);
            for (var id in pending) {
                load(resolve(mrLocation, pending[id]));
            }
        }

        // register module definitions for deferred,
        // serial execution
        var definitions = {};
        global.bootstrap = function (id, factory) {
            definitions[id] = factory;
            delete pending[id];
            for (id in pending) {
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
        /*jshint +W089 */

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
            Promise = bootRequire("promise");
            Require = bootRequire("require");
            URL = bootRequire("mini-url");
            callbackIfReady();
        }

        function callbackIfReady() {
            if (domLoaded && Require) {
                callback(Require, Promise, URL);
            }
        }
    };

    var params;
    var getParams = function () {
        var i, j,
            match,
            script,
            mrLocation,
            attr,
            name;
        if (!params) {
            params = {};
            // Find the <script> that loads us, so we can divine our
            // parameters from its attributes.
            var scripts = document.getElementsByTagName("script");
            for (i = 0; i < scripts.length; i++) {
                script = scripts[i];
                if (script.src && (match = script.src.match(/^(.*)bootstrap.js(?:[\?\.]|$)/i))) {
                    mrLocation = match[1];
                }
                if (script.hasAttribute("data-mr-location")) {
                    mrLocation = resolve(window.location, script.getAttribute("data-mr-location"));
                }
                if (mrLocation) {
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
                    // Permits multiple bootstrap.js <scripts>; by
                    // removing as they are discovered, next one
                    // finds itself.
                    script.parentNode.removeChild(script);
                    params.mrLocation = mrLocation;
                    break;
                }
            }
        }
        return params;
    };

    // mini-url library
    var makeResolve = function () {
        var baseElement = document.querySelector("base");
        var existingBaseElement = baseElement;
        if (!existingBaseElement) {
            baseElement = document.createElement("base");
            baseElement.href = "";
        }
        var head = document.querySelector("head");
        var relativeElement = document.createElement("a");
        return function (base, relative) {
            if (!existingBaseElement) {
                head.appendChild(baseElement);
            }
            base = String(base);
            if (!/^[\w\-]+:/.test(base)) { // isAbsolute(base)
                throw new Error("Can't resolve " + JSON.stringify(relative) + " relative to " + JSON.stringify(base));
            }
            var restore = baseElement.href;
            baseElement.href = base;
            relativeElement.href = relative;
            var resolved = relativeElement.href;
            baseElement.href = restore;
            if (!existingBaseElement) {
                head.removeChild(baseElement);
            }
            return resolved;
        };
    };

    var resolve = makeResolve();

    var load = function (location) {
        var script = document.createElement("script");
        script.src = location;
        script.onload = function () {
            // remove clutter
            script.parentNode.removeChild(script);
        };
        document.querySelector("head").appendChild(script);
    };

    bootstrap(function onbootstrap(Require, Promise, URL) {
        var params = getParams();
        var config = {};

        var applicationLocation = URL.resolve(Require.getLocation(), params.package || ".");
        var moduleId = params.module || "";

        // execute the preloading plan and stall the fallback module loader
        // until it has finished
        if (global.preload) {
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

        Require.loadPackage({
            location: params.mrLocation,
            hash: params.mrHash
        }, config)
        .then(function (mrRequire) {

            mrRequire.inject("mini-url", URL);
            mrRequire.inject("promise", Promise);
            mrRequire.inject("require", Require);

            return mrRequire.loadPackage({
                name: "q",
                location: params.qLocation,
                hash: params.qHash
            })
            .then(function (qRequire) {

                qRequire.inject("q", Promise);

                if ("autoPackage" in params) {
                    mrRequire.injectPackageDescription(applicationLocation, {});
                }

                return mrRequire.loadPackage({
                    location: applicationLocation,
                    hash: params.applicationHash
                })
                .invoke('async', moduleId);
            });

        })
        .done();

    });

})(this);
