/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2012 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
/*global bootstrap,define */
(function (definition) {

    // Boostrapping Browser
    if (typeof bootstrap !== "undefined") {

        // Window
        if (typeof window !== "undefined") {
            bootstrap("require/require", function (require, exports) {
                var Promise = require("core/promise").Promise;
                var URL = require("core/mini-url");
                var nextTick = require("core/next-tick").nextTick;
                definition(exports, Promise, URL, nextTick);
                require("require/browser");
            });

        // Worker
        } else {
            bootstrap("require/require", function (require, exports) {
                var Promise = require("core/promise").Promise;
                var URL = require("core/url");
                var nextTick = require("core/next-tick").nextTick;
                definition(exports, Promise, URL, nextTick);
            });
        }

    // Node Server
    } else if (typeof process !== "undefined") {
        var Promise = (require)("../core/promise").Promise;
        var URL = (require)("../core/url");
        definition(exports, Promise, URL, process.nextTick);
        require("./if");
        require("./node");
        if (require.main == module)
            exports.main();

    } else {
        throw new Error("Can't support require on this platform");
    }

})(function (Require, Promise, URL, nextTick) {

    if (!this)
        throw new Error("Require does not work in strict mode.");

    var globalEval = eval; // reassigning causes eval to not use lexical scope.

    // Non-CommonJS speced extensions should be marked with an "// EXTENSION"
    // comment.

    Require.makeRequire = function (config) {
        var require;

        // Configuration defaults:
        config = config || {};
        config.location = URL.resolve(config.location || Require.getLocation(), ".");
        config.lib = URL.resolve(config.location, config.lib || ".");
        config.paths = config.paths || [config.lib];
        config.mappings = config.mappings || {}; // EXTENSION
        config.exposedConfigs = config.exposedConfigs || Require.exposedConfigs;
        config.makeLoader = config.makeLoader || Require.makeLoader;
        config.load = config.load || config.makeLoader(config);
        config.makeCompiler = config.makeCompiler || Require.makeCompiler;
        config.compile = config.compile || config.makeCompiler(config);

        // Modules: { exports, id, location, directory, factory, dependencies,
        // dependees, text, type }
        var modules = config.modules = config.modules || {};

        // produces an entry in the module state table, which gets built
        // up through loading and execution, ultimately serving as the
        // ``module`` free variable inside the corresponding module.
        function getModuleDescriptor(id) {
            if (!has(modules, id)) {
                modules[id] = {
                    id: id,
                    display: config.location + "#" + id, // EXTENSION
                    require: require
                };
            }
            return modules[id];
        }

        // for preloading modules by their id and exports, useful to
        // prevent wasteful multiple instantiation if a module was loaded
        // in the bootstrapping process and can be trivially injected into
        // the system.
        function inject(id, exports) {
            var module = getModuleDescriptor(id);
            module.exports = exports;
            module.location = URL.resolve(config.location, id);
            module.directory = URL.resolve(module.location, ".");
        }

        // Ensures a module definition is loaded, compiled, analyzed
        var load = memoize(function (topId, viaId) {
            var module = getModuleDescriptor(topId);
            return Promise.call(function () {
                // if not already loaded, already instantiated, or
                // configured as a redirection to another module
                if (
                    module.factory === void 0 &&
                    module.exports === void 0 &&
                    module.redirect === void 0
                ) {
                    // load and
                    // trace progress
                    Require.progress.requiredModules.push(module.display);
                    return Promise.call(config.load, null, topId, module)
                    .then(function () {
                        Require.progress.loadedModules.push(module.display);
                    });
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
            if (has(loading, topId))
                return; // break the cycle of violence.
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
            });
        }

        // Initializes a module by executing the factory function with a new
        // module "exports" object.
        function getExports(topId, viaId) {
            var module = getModuleDescriptor(topId);

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

            module.directory = URL.resolve(module.location, "."); // EXTENSION
            module.exports = {};

            // Execute the factory function:
            var returnValue = module.factory.call(
                // in the context of the module:
                void 0, // this (defaults to global)
                makeRequire(topId), // require
                module.exports, // exports
                module // module
            );

            // Modules should never have a return value.
            if (returnValue !== void 0) {
                console.warn(
                    "require: module " + JSON.stringify(topId) +
                    " returned a value."
                );
            }

            // Update the list of modules that are ready to use
            Require.progress.initializedModules.push(module.display);

            return module.exports;
        }

        // Finds the internal identifier for a module in a subpackage
        // The ``internal`` boolean parameter causes the function to return
        // null instead of throwing an exception.  I’m guessing that
        // throwing exceptions *and* being recursive would be too much
        // performance evil for one function.
        function identify(id2, require2, internal) {
            if (require2.location === config.location)
                return id2;
            var locations = {};
            for (var name in config.mappings) {
                var mapping = config.mappings[name];
                var location = mapping.location;
                var candidate = config.getPackage(location);
                var id1 = candidate.identify(id2, require2, true);
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
            require.async = function(id, callback) {
                var topId = resolve(id, viaId);
                var module = getModuleDescriptor(id);
                return deepLoad(topId, viaId)
                // conconditionally require the module, but if there's an
                // error, throw it in a separate turn so it gets logged
                .then(function () {
                    return require(topId);
                }, function (reason, error) {
                    nextTick(function () {
                        throw error;
                    });
                    return require(topId);
                })
                // handle the callback if provided, by breaking out of the
                // promise system using nextTick
                .then(function (exports) {
                    if (callback) {
                        nextTick(function () {
                            callback(exports);
                        });
                    }
                    return exports;
                }, function (reason, error, rejection) {
                    if (callback) {
                        nextTick(function() {
                            throw error;
                        });
                    }
                    return rejection;
                });
            };

            require.resolve = function (id) {
                return resolve(id, viaId);
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

            require.getPackage = function (dependency) {
                return config.getPackage(dependency, config);
            };

            require.injectPackageDescription = function (location, description) {
                Require.injectPackageDescription(location, description, config);
            };

            require.injectPackageDescriptionLocation = function (location, descriptionLocation) {
                Require.injectPackageDescriptionLocation(location, descriptionLocation, config);
            };

            require.identify = identify;
            require.inject = inject;
            require.progress = Require.progress;

            config.exposedConfigs.forEach(function(name) {
                require[name] = config[name];
            });

            require.config = config;

            // for internal use
            require.read = Require.read;
            require.merge = Require.merge;

            return require;
        }

        require = makeRequire("");
        return require;
    };

    Require.progress = {
        requiredModules: [],
        loadedModules: [],
        initializedModules: []
    };

    Require.injectPackageDescription = function (location, description, config) {
        var descriptions =
            config.descriptions =
                config.descriptions || {};
        descriptions[location] = Promise.call(function () {
            return description;
        });
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
            descriptions[location] = Require.read(descriptionLocation)
            .then(function (json) {
                try {
                    var object = JSON.parse(json);
                    object.descriptionLocation = descriptionLocation;
                    return object;
                } catch (exception) {
                    throw new SyntaxError(
                        "in " + JSON.stringify(descriptionLocation) + ": " +
                        exception.message
                    );
                }
            });
        }
        return descriptions[location];
    };

    Require.loadPackage = function (dependency, config) {
        dependency = normalizeDependency(dependency, config);
        var location = dependency.location;
        config = config || {};
        var loadingPackages = config.loadingPackages = config.loadingPackages || {};
        var loadedPackages = config.packages = {};
        var registry = config.registry = config.registry || Object.create(null);

        config.getPackage = function (dependency) {
            dependency = normalizeDependency(dependency, config);
            var location = dependency.location;
            if (!loadedPackages[location]) {
                throw new Error(
                    "Dependency is not loaded: " + JSON.stringify(location)
                );
            }
            return loadedPackages[location];
        };

        config.loadPackage = function (dependency, viaConfig) {
            dependency = normalizeDependency(dependency, viaConfig);
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
        // if the named dependency has already been found at another
        // location, refer to the same eventual instance
        if (
            dependency.name !== void 0 &&
            config.registry !== void 0 &&
            config.registry[dependency.name]
        ) {
            dependency.location = config.registry[dependency.name];
        }
        // default location
        if (dependency.location === void 0) {
            if (
                config.packagesDirectory === void 0 ||
                dependency.name === void 0
            ) {
                throw new Error(
                    "name or location required for dependency: " +
                    JSON.stringify(dependency) + " from " + config.location +
                    " unless already found by name."
                );
            }
            dependency.location = URL.resolve(
                config.packagesDirectory,
                dependency.name + "/"
            );
        }
        // make sure the dependency location has a trailing slash so that
        // relative urls will resolve properly
        if (!/\/$/.test(dependency.location)) {
            dependency.location += "/";
        }
        // resolve the location relative to the current package
        if (!Require.isAbsolute(dependency.location)) {
            if (config.location === void 0) {
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
        if (dependency.name !== void 0) {
            config.registry[dependency.name] = dependency.location;
        }
        return dependency;
    }

    function configurePackage(location, description, parent) {

        if (!/\/$/.test(location)) {
            location += "/";
        }

        // this should not occur in production since it has already been
        // collapsed by the optimizer.  this is important because we do not
        // bother to load require/if (where collapsePackageDescription is
        // defined) if the application has been optimized.
        if (description["if"]) {
            description = Require.collapsePackageDescription(
                description,
                parent,
                description.descriptionLocation
            );
        }

        var config = Object.create(parent);
        config.name = description.name;
        config.location = location || Require.getLocation();
        config.packageDescription = description;
        // explicitly mask definitions and modules, which must
        // not apply to child packages
        var modules = config.modules = config.modules || {};

        var registry = config.registry;
        if (config.name !== void 0 && !registry[config.name]) {
            registry[config.name] = config.location;
        }

        // overlay (deprecated in favor of "if" blocks)
        var overlay = description.overlay || {};
        var layer;
        Require.overlays.forEach(function (engine) {
            if (overlay[engine]) {
                var layer = overlay[engine];
                for (var name in layer) {
                    description[name] = layer[name];
                }
            }
        });
        delete description.overlay;

        // directories
        description.directories = description.directories || {};
        description.directories.lib =
            description.directories.lib === void 0 ? "." : description.directories.lib;
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
                redirect: description.main,
                location: config.location
            };

            modules[description.name] = {
                id: description.name,
                redirect: "",
                location: URL.resolve(location, description.name)
            };

        }

        // mappings, link this package to other packages.
        var mappings = description.mappings || {};
        // dependencies
        var dependencies = description.dependencies || {};
        Object.keys(dependencies).forEach(function (name) {
            if (!mappings[name]) {
                // dependencies are equivalent to name and version mappings,
                // though the version predicate string is presently ignored
                // (TODO)
                mappings[name] = {
                    name: name,
                    version: dependencies[name]
                };
            } else if (typeof console === "object") {
                console.warn(
                    "Dependency for " + JSON.stringify(name) + " " +
                    "overriden by mapping in " + JSON.stringify(location)
                );
            }
        });
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
            var part = source[i];
            if (part === "" || part === ".") {
            } else if (part === "..") {
                if (target.length) {
                    target.pop();
                }
            } else {
                target.push(part);
            }
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
                module.dependencies = Require.parseDependencies(module.text);
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
        if (!config.lint) {
            return compile;
        }
        return function(module) {
            try {
                compile(module);
            } catch (error) {
                config.lint(module);
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
            var json = module.id.match(/\.json$/);
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
        config.name = config.name || "";

        var mappings = config.mappings;
        var prefixes = Object.keys(mappings);
        var length = prefixes.length;

        // finds a mapping to follow, if any
        return function (id, module) {
            if (Require.isAbsolute(id)) {
                return load(id, module);
            }
            // TODO: remove this when all code has been migrated off of the autonomous name-space problem
            if (id.indexOf(config.name) === 0 && id.charAt(config.name.length) === "/") {
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
                    var mapping = mappings[prefix];
                    var rest = id.slice(prefix.length + 1);
                    return config.loadPackage(mapping, config)
                    .then(function (mappingRequire) {
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
                .fail(function (reason, error, rejection) {
                    if (/^Can't find /.test(reason)) {
                        return next(id, module);
                    } else {
                        return rejection;
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
                .fail(function (reason, error, rejection) {
                    if (/^Can't find /.test(reason)) {
                        return next(id, module);
                    } else {
                        return rejection;
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

    var memoize = function (callback, cache) {
        cache = cache || {};
        return function (key, arg) {
            if (!has(cache, key)) {
                cache[key] = Promise.call(callback, null, key, arg);
            }
            return cache[key];
        };
    };

    // this is used to collapse package descriptions with "if" blocks.  In
    // development it is used by require/if.collapsePackageDescription.  In
    // optimization, package.json gets replaced with a package.json.load.js
    // that is created with require/if.compilePackageDescriptionModule.  The
    // compiled package.json conditionally uses Require.merge at run-time in
    // production.
    var array_push = Array.prototype.push;
    Require.merge = function (object, patch) {
        Object.keys(patch).forEach(function (key) {
            var change = patch[key];
            if (change === null) {
                delete object[key];
            } else if (Array.isArray(change)) {
                var array = object[key] = object[key] || [];
                array_push.apply(array, change);
            } else if (typeof change === "object") {
                // at this point we could extend this to recognize
                // different kinds of patching algorithms like !:set,add,delete
                // and //!:splices,splices:[[0, 0, 1, 2]]
                object[key] = object[key] || {};
                Require.merge(object[key], change);
            } else {
                object[key] = change;
            }
        });
        return object;
    };

});
