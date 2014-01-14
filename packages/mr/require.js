
/*
    Based in part on Motorola Mobility’s Montage
    Copyright (c) 2012, Motorola Mobility LLC. All Rights Reserved.
    3-Clause BSD License
    https://github.com/motorola-mobility/montage/blob/master/LICENSE.md
*/

/*global bootstrap,define */
(function (definition) {

    // Boostrapping Browser
    if (typeof bootstrap !== "undefined") {

        // Window
        if (typeof window !== "undefined") {
            bootstrap("require", function (require, exports) {
                var Promise = require("promise");
                var URL = require("mini-url");
                definition(exports, Promise, URL);
                require("require/browser");
            });

        // Worker
        } else {
            bootstrap("require", function (require, exports) {
                var Promise = require("promise").Promise;
                var URL = require("mini-url");
                definition(exports, Promise, URL);
            });
        }

    // Node Server
    } else if (typeof process !== "undefined") {
        // the parens trick the heuristic scanner for static dependencies, so
        // they are not pre-loaded by the asynchronous browser loader
        var Promise = (require)("q");
        var URL = (require)("url");
        definition(exports, Promise, URL);
        (require)("./node");
    } else {
        throw new Error("Can't support require on this platform");
    }

})(function (Require, Promise, URL) {

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
        config.paths = config.paths || [config.location];
        config.mappings = config.mappings || {}; // EXTENSION
        config.exposedConfigs = config.exposedConfigs || Require.exposedConfigs;
        config.moduleTypes = config.moduleTypes || [];
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
            return Promise.fcall(function () {
                // if not already loaded, already instantiated, or
                // configured as a redirection to another module
                if (
                    module.factory === void 0 &&
                    module.exports === void 0 &&
                    module.redirect === void 0
                ) {
                    return Promise.fcall(config.load, topId, module);
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
                return Promise.all(module.dependencies.map(function (depId) {
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
                var error = new Error(
                    "Can't require module " + JSON.stringify(module.id) +
                    " via " + JSON.stringify(viaId) +
                    " because " + module.error.message
                );
                error.cause = module.error;
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
                    " via " + JSON.stringify(viaId)
                );
            }

            module.directory = URL.resolve(module.location, "./"); // EXTENSION
            module.exports = {};

            var returnValue;
            try {
                // Execute the factory function:
                returnValue = module.factory.call(
                    // in the context of the module:
                    void 0, // this (defaults to global)
                    makeRequire(topId), // require
                    module.exports, // exports
                    module // module
                );
            } catch (_error) {
                // Delete the exports so that the factory is run again if this
                // module is required again
                delete module.exports;
                throw _error;
            }

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
        descriptions[location] = Promise.resolve(description);
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

        // but first, convert "browser" field, as pioneered by Browserify, to
        // an overlay
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
        config.overlays = config.overlays || Require.overlays;
        config.overlays.forEach(function (engine) {
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

        config.packagesDirectory = URL.resolve(location, "node_modules/");

        // The default "main" module of a package has the same name as the
        // package.
        if (description.main !== void 0) {

            // main, injects a definition for the main module, with
            // only its path. makeRequire goes through special effort
            // in deepLoad to re-initialize this definition with the
            // loaded definition from the given path.
            modules[""] = {
                id: "",
                redirect: normalizeId(resolve(description.main, "")),
                location: config.location
            };

        }

        //Deal with redirects
        var redirects = description.redirects;
        if (redirects !== void 0) {
            Object.keys(redirects).forEach(function (name) {
                modules[name] = {
                    id: name,
                    redirect: normalizeId(resolve(redirects[name], name)),
                    location: URL.resolve(location, name)
                };
            });
        }

        // mappings, link this package to other packages.
        var mappings = description.mappings || {};
        // dependencies, devDependencies if not in production
        [description.dependencies, !config.production ? description.devDependencies : null]
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

    var extensionPattern = /\.([^\/\.]+)$/;
    Require.extension = function (path) {
        var match = extensionPattern.exec(path);
        if (match) {
            return match[1];
        }
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
                    Promise.nextTick(function () {
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

    Require.LocationLoader = function (config, load) {
        return function (id, module) {
            var path = id;
            var extension = Require.extension(id);
            if (!extension || (
                extension !== "js" &&
                extension !== "json" &&
                config.moduleTypes.indexOf(extension) === -1
            )) {
                path += ".js";
            }
            var location = URL.resolve(config.location, path);
            return load(location, module);
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
                cache[key] = Promise.fcall(callback, key, arg);
            }
            return cache[key];
        };
    };

});
