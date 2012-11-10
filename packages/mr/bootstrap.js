(function () {
    "use strict";

    // The global context object
    var global = new Function("return this")();

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

        // this permits bootstrap.js to be injected after domready
        document.addEventListener("DOMContentLoaded", domLoad, true);
        if (document.readyState === "complete") {
            domLoad();
        }

        // determine which scripts to load
        var pending = {
            "require": "require.js",
            "require/browser": "browser.js",
            "promise": "packages/q/q.js"
        };

        // TODO preloading of optimized bundles
        for (var id in pending) {
            (function (location) {
                var script = document.createElement("script");
                script.src = resolve(params.bootstrapLocation, location);
                script.onload = function () {
                    // remove clutter
                    script.parentNode.removeChild(script);
                };
                document.querySelector("head").appendChild(script);
            })(pending[id]);
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
                definitions[id](bootRequire, exports);
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
            bootstrapFound,
            attr,
            name;
        if (!params) {
            params = {};
            // Find the <script> that loads us, so we can divine our
            // parameters from its attributes.
            var scripts = document.getElementsByTagName("script");
            for (i = 0; i < scripts.length; i++) {
                script = scripts[i];
                bootstrapFound = false;
                if (script.src && (match = script.src.match(/^(.*)bootstrap.js(?:[\?\.]|$)/i))) {
                    params.bootstrapLocation = match[1];
                    bootstrapFound = true;
                }
                if (script.hasAttribute("data-bootstrap")) {
                    params.bootstrapLocation = script.getAttribute("data-bootstrap");
                    bootstrapFound = true;
                }
                if (bootstrapFound) {
                    if (script.dataset) {
                        for (name in script.dataset) {
                            params[name] = script.dataset[name];
                        }
                    } else if (script.attributes) {
                        for (j = 0; j < script.attributes.length; j++) {
                            attr = script.attributes[j];
                            match = attr.name.match(/^data-(.*)$/);
                            if (match) {
                                params[match[1]] = attr.value;
                            }
                        }
                    }
                    // Permits multiple bootstrap.js <scripts>; by
                    // removing as they are discovered, next one
                    // finds itself.
                    script.parentNode.removeChild(script);
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
                throw new Error("Can't resolve from a relative location: " + JSON.stringify(base) + " " + JSON.stringify(relative));
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

    bootstrap(function onbootstrap(Require, Promise, URL) {
        var params = getParams();

        var applicationLocation = URL.resolve(window.location, params.package || ".");
        var moduleId = params.module || "";

        Require.loadPackage({
            location: params.bootstrapLocation,
            hash: params.bootstrapHash
        })
        .then(function (bootstrapRequire) {

            bootstrapRequire.inject("mini-url", URL);
            bootstrapRequire.inject("promise", Promise);
            bootstrapRequire.inject("require", Require);

            return bootstrapRequire.loadPackage({
                name: "q",
                hash: params.qHash
            })
            .then(function (qRequire) {

                qRequire.inject("q", Promise);

                if ("autoPackage" in params) {
                    bootstrapRequire.injectPackageDescription(applicationLocation, {});
                }

                return bootstrapRequire.loadPackage({
                    location: applicationLocation,
                    hash: params.applicationHash
                })
                .invoke('async', moduleId)
            });

        })
        .end();

    });

})();
