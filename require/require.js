/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */

(function (definition) {

    // Boostrapping Browser
    if (typeof bootstrap !== "undefined") {
        bootstrap("require/require", function (require, exports) {
            var Promise = require("core/promise").Promise;
            var URL = require("core/mini-url");
            definition(exports, Promise, URL);
            require("require/browser");
        });

    // Node Server
    } else if (typeof process !== "undefined") {
        var Promise = (require)("../core/promise").Promise;
        var URL = (require)("../core/url");
        definition(exports, Promise, URL);
        require("./node");
        if (require.main == module)
            exports.main();

    } else {
        throw new Error("Can't support require on this platform");
    }

})(function (Require, Promise, URL) {

    if (!this)
        throw new Error("Require does not work in strict mode.");

    var globalEval = eval; // reassigning causes eval to not use lexical scope.

    // Non-CommonJS speced extensions should be marked with an "// EXTENSION" comment.

    // Sandbox is an instance of the loader system. Different sandboxes will have different instances of modules.
    // Returns the root "require" function. If this root "require()" function is called the loader will be in synchronous mode.
    // To get asynchronous loading you MUST call the root "require.async()". In async mode all subsequent calls to "require()" will
    // be asynchronously loaded, and synchronously executed.
    Require.Sandbox = function(config) {
        // Configuration defaults:
        config = config || {};
        config.location = URL.resolve(config.location || Require.getLocation(), ".");
        config.lib = URL.resolve(config.location, config.lib || ".");
        config.paths = config.paths || [config.lib];
        config.mappings = config.mappings || {}; // EXTENSION
        config.exposedConfigs = config.exposedConfigs || Require.defaultExposedConfigs;
        config.makeLoader = config.makeLoader || Require.DefaultLoaderConstructor;
        config.load = config.load || config.makeLoader(config);
        config.makeCompiler = config.makeCompiler || Require.DefaultCompilerConstructor;
        config.compile = config.compile || config.makeCompiler(config);

        // Sandbox state:
        // Modules: { exports, id, location, directory, factory, dependencies, dependees, text, type }
        var modules = config.modules = config.modules || {};
        // Mapping from canonical IDs to the initial top ID used to load module
        var locationsToIds = {};

        function getModule(id) {
            if (!has(modules, id)) {
                modules[id] = {
                    id: id,
                    display: config.location + "#" + id // EXTENSION
                };
            }
            return modules[id];
        }
        config.module = getModule;

        function inject(id, exports) {
            var module = getModule(id)
            module.exports = exports;
            module.location = URL.resolve(config.location, id);
            module.directory = URL.resolve(module.location, ".");
        }

        // Ensures a module definition is loaded, compiled, analyzed
        var load = memoize(function (topId, viaId) {
            var module = getModule(topId);
            return Promise.call(function () {
                // already loaded, already instantiated, or redirection
                if (
                    module.factory !== void 0 ||
                    module.exports !== void 0 ||
                    module.redirect !== void 0
                ) {
                    return module;
                // load
                } else {
                    Require.progress.requiredModules.push(module.display);
                    return Promise.call(config.load, null, topId, module)
                    .then(function () {
                        Require.progress.loadedModules.push(module.display);
                        return module;
                    });
                }
            })
            .then(function (module) {
                // analyze dependencies
                config.compile(module);
                var dependencies = module.dependencies = module.dependencies || [];
                if (module.redirect !== void 0) {
                    dependencies.push(module.redirect);
                }
                return module;
            });
        });

        // Load a module definition, and the definitions of its transitive
        // dependencies
        function deepLoad(id, viaId, loading) {
            // this is a memo of modules already being loaded so we don’t
            // data-lock on a cycle of dependencies.
            loading = loading || {};
            // has this all happened before?  will it happen again?
            if (has(loading, id))
                return; // break the cycle of violence.
            loading[id] = true; // this has happened before
            return load(id, viaId)
            .then(function (module) {
                // load the transitive dependencies using the magic of
                // recursion.
                return Promise.all(module.dependencies.map(function (depId) {
                    depId = resolve(depId, id)
                    // create dependees set, purely for debug purposes
                    var module = getModule(depId);
                    var dependees = module.dependees = module.dependees || {};
                    dependees[id] = true;
                    return deepLoad(depId, id, loading);
                }))
                .then(function () {
                    return module;
                })
            })
        }

        // Initializes a module by executing the factory function with a new module "exports" object.
        function getExports(topId, viaId) {
            var module = getModule(topId);

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
                throw new Error("Can't require module " + JSON.stringify(topId) + " via " + JSON.stringify(viaId));
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
                console.warn('require: module "'+topId+'" returned a value.');
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
                    continue
                } else if (id1 === "") {
                    return name;
                } else {
                    return name + "/" + id1;
                }
            }
            if (internal) {
                return null;
            } else {
                throw new Error("Can't identify " + id2 + " from " + require2.location);
            }
        }

        // Creates a unique require function for each module that encapsulates that module's id for resolving relative module IDs against.
        function makeRequire(viaId) {

            // Main synchronously executing "require()" function
            var require = function(id) {
                var topId = resolve(id, viaId);
                return getExports(topId, viaId);
            };

            // Asynchronous "require.async()" which ensures async executation (even with synchronous loaders)
            require.async = function(id, callback) {
                var topId = resolve(id, viaId);
                return deepLoad(topId, viaId)
                .then(function () {
                    return require(topId);
                })
                .then(function (exports) {
                    callback && callback(exports);
                    return exports;
                }, function (reason, error, rejection) {
                    if (callback) {
                        console.error(error.stack);
                    }
                    return rejection;
                });
            };

            require.resolve = function (id) {
                return resolve(id, viaId);
            };

            require.load = load;
            require.deepLoad = deepLoad;
            require.loadPackage = config.loadPackage;
            require.identify = identify;
            require.inject = inject;
            require.progress = Require.progress;

            config.exposedConfigs.forEach(function(name) {
                require[name] = config[name];
            });

            require.config = config;

            return require;
        }

        return makeRequire("");
    };

    Require.progress = {
        requiredModules: [],
        loadedModules: [],
        initializedModules: []
    };

    Require.PackageSandbox = function (location, config) {
        location = URL.resolve(location, ".");
        config = config || {};
        var loadingPackages = config.loadingPackages = config.loadingPackages || {};
        var loadedPackages = config.packages = {};

        config.getPackage = function (dependency) {
            dependency = Dependency(dependency);
            // TODO handle other kinds of dependency
            var location = dependency.location;
            if (!loadedPackages[location])
                throw new Error("Dependency is not loaded: " + JSON.stringify(location));
            return loadedPackages[location];
        };

        config.loadPackage = function (dependency) {
            dependency = Dependency(dependency);
            // TODO handle other kinds of dependency
            var location = URL.resolve(dependency.location, ".");
            if (!loadingPackages[location]) {
                var jsonPath = URL.resolve(location, 'package.json');
                loadingPackages[location] = Require.read(jsonPath)
                .then(function (json) {
                    try {
                        var packageDescription = JSON.parse(json);
                    } catch (exception) {
                        throw new SyntaxError("in " + JSON.stringify(jsonPath) + ": " + exception.message);
                    }
                    var subconfig = configurePackage(
                        location,
                        packageDescription,
                        config
                    );
                    var pkg = Require.Sandbox(subconfig);
                    loadedPackages[location] = pkg;
                    return pkg;
                });
            }
            return loadingPackages[location];
        };

        var _require = config.loadPackage(location);
        _require.location = location;
        _require.async = function (id, callback) {
            return _require.then(function (require) {
                return require.async(id, callback);
            });
        };

        return _require;
    };

    function Dependency(dependency) {
        if (typeof dependency === "string") {
            dependency = {"location": dependency};
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
        // explicitly mask definitions and modules, which must
        // not apply to child packages
        var modules = config.modules = config.modules || {};

        // overlay
        var overlay = description.overlay || {};
        Require.overlays.forEach(function (engine) {
            if (overlay[engine]) {
                layer = overlay[engine];
                for (var name in layer) {
                    description[name] = layer[name];
                }
            }
        });
        delete description.overlay;

        // directories
        description.directories = description.directories || {};
        description.directories.lib = description.directories.lib === void 0 ? "." : description.directories.lib;
        var lib = description.directories.lib;
        // lib
        config.lib = URL.resolve(location, "./" + lib);
        var packageRoot = description.directories.packages || "node_modules";
        packageRoot = URL.resolve(location, packageRoot + "/");

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
            var versionPredicateString = dependencies[name];
            // TODO (version presently ignored for debug mode)
            if (!mappings[name]) {
                mappings[name] = {"location": URL.resolve(
                    packageRoot,
                    name + "/"
                )};
            }
        });
        Object.keys(mappings).forEach(function (name) {
            var mapping = mappings[name] = Dependency(mappings[name]);
            if (!/\/$/.test(mapping.location))
                mapping.location += "/";
            if (!Require.isAbsolute(mapping.location))
                mapping.location = URL.resolve(location, mapping.location);
        });

        config.mappings = mappings;

        return config;
    }

    // Helper functions:

    function has(object, property) {
        return Object.prototype.hasOwnProperty.call(object, property);
    };

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
    };

    // ES5 shim:

    // ES5 15.4.3.2
    if (!Array.isArray) {
        Array.isArray = function(obj) {
            return Object.prototype.toString.call(obj) == "[object Array]";
        };
    }
    // ES5 15.2.3.14
    if (!Object.keys) {
        Object.keys = function(object) {
            var keys = [];
            for (var name in object) {
                if (Object.prototype.hasOwnProperty.call(object, name)) {
                    keys.push(name);
                }
            }
            return keys;
        };
    }

    Require.base = function (location) {
        // matches Unix basename
        return String(location)
            .replace(/(.+?)\/+$/, "$1")
            .match(/([^\/]+$|^\/$|^$)/)[1];
    };

    // Tests whether the location or URL is a absolute.
    Require.isAbsolute = function(location) {
        return /^\w+:/.test(location);
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

    // Support she-bang for shell scripts by commenting it out (it is never valid JavaScript syntax anyway)
    Require.ShebangCompiler = function(config, compile) {
        return function (module) {
            if (module.text) {
                module.text = module.text.replace(/^#!/, "//#!");
            }
            compile(module);
        }
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
    }

    Require.defaultExposedConfigs = [
        "paths",
        "mappings",
        "location",
        "packageDescription",
        "packages",
        "modules",
        "module"
    ];

    Require.DefaultCompilerConstructor = function(config) {
        return Require.ShebangCompiler(
            config,
            Require.DependenciesCompiler(
                config,
                Require.LintCompiler(
                    config,
                    Require.Compiler(config)
                )
            )
        );
    };

    // Built-in loader "middleware":

    Require.DefaultLoaderConstructor = function(config) {
        return Require.MappingsLoader(
            config,
            Require.ExtensionsLoader(
                config,
                Require.PathsLoader(
                    config,
                    Require.MemoizedLoader(
                        config,
                        Require.Loader(config)
                    )
                )
            )
        );
    };

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
            var i, prefix
            for (i = 0; i < length; i++) {
                prefix = prefixes[i];
                if (
                    id === prefix ||
                    id.indexOf(prefix) === 0 &&
                    id.charAt(prefix.length) === "/"
                ) {
                    var mapping = mappings[prefix];
                    var rest = id.slice(prefix.length + 1);
                    return config.loadPackage(mapping)
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
                .fail(function (error) {
                    return next(id, module);
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
        }
    }

    // Attempts to load using multiple base paths (or one absolute path) with a single loader.
    Require.PathsLoader = function(config, load) {
        var loadFromPaths = config.paths.reduceRight(function (next, path) {
            return function (id, module) {
                var newId = URL.resolve(path, id);
                return load(newId, module)
                .fail(function () {
                    return next(id, module);
                });
            };
        }, function (id, module) {
            throw new Error("Can't find " + JSON.stringify(id) + " from paths " + JSON.stringify(config.paths) + " in package at " + JSON.stringify(config.location));
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

    Require.Loader = function (config, load) {
        return function (url, module) {
            return Require.read(url)
            .then(function (text) {
                module.type = "javascript";
                module.text = text;
                module.location = url;
            }, function (reason, error, rejection) {
                // This is a hook that allows a Loader to be chained to a
                // fallback, such as the NodeLoader, if a local module can’t be
                // found.
                if (load) {
                    return load(url, module);
                } else {
                    return rejection;
                }
            });
        };
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

});
