/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */

(function (definition) {

    // Browser
    if (typeof bootstrap !== "undefined") {
        bootstrap("require/require", function (require, exports) {
            var Promise = require("core/promise").Promise;
            var URL = require("core/url");
            definition(exports, Promise, URL);
            require("require/browser");
        });

    // Node
    } else {
        var Promise = (require)("../core/promise").Promise;
        var URL = (require)("../core/url");
        definition(exports, Promise, URL);
        require("./node");
        if (require.main == module)
            exports.main();
    }

})(function (Require, Promise, URL) {

    if (!this)
        throw new Error("Require does not work in strict mode.");

    var global = this;
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
        config.exposedConfigs = config.exposedConfigs || [
            "paths",
            "mappings",
            "base",
            "location",
            "packageDescription",
            "packages",
            "modules",
            "module",
            "load",
            "loadPackage"
        ];
        config.makeLoader = config.makeLoader || Require.DefaultLoaderConstructor;
        config.load = config.load || config.makeLoader(config);
        config.makeCompiler = config.makeCompiler || Require.DefaultCompilerConstructor;
        config.compile = config.compile || config.makeCompiler(config);

        // Sandbox state:
        // Module instances: { exports, id, path, uri, factory, dependencies }
        var modules = config.modules = config.modules || {};
        // Mapping from canonical IDs to the initial top ID used to load module
        var urisToIds = {};

        function getModule(id) {
            if (!has(modules, id)) {
                modules[id] = {"id": id};
            }
            return modules[id];
        }
        config.module = getModule;

        function inject(id, exports) {
            var module = getModule(id)
            module.exports = exports;
            module.path = URL.resolve(config.location, id);
            module.directory = URL.resolve(module.path, ".");
        }

        // Ensures a module definition is loaded before returning or executing the callback.
        // Supports multiple calls for the same topId by registering callback as a listener if it has already been initiated.
        var loading = {};
        function load(topId, viaId) {
            if (!has(loading, topId)) {
                var module = getModule(topId);

                // instantiated or already loaded
                if (
                    module.factory !== void 0 ||
                    module.exports !== void 0
                ) {
                    loading[topId] = Promise.ref(module);
                // preloaded
                } else if (
                    module.path !== void 0 &&
                    module.factory !== void 0
                ) {
                    loading[topId] = Require.read(module.path)
                    .then(function (text) {
                        module.text = text;
                        config.compile(module);
                        return module;
                    });
                // load
                } else {

                    // Update the list of modules that need to load
                    Require.progress.requiredModules.push(
                        [config.location, topId].join("#")
                    );

                    loading[topId] = config.load(topId, module)
                    .then(function (definition) {
                        if (!definition) {
                            throw new Error("Can't load " + JSON.stringify(topId) + " via " + JSON.stringify(viaId));
                        }

                        // TODO lace the module through instead of receiving the definition
                        for (var name in definition) {
                            module[name] = definition[name];
                        }

                        // Progress update
                        Require.progress.loadedModules.push([
                            config.location,
                            topId
                        ].join("#"));

                        return module;
                    });

                }
            }
            return loading[topId];
        }

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
                return Promise.all((module.dependencies || [])
                .map(function (depId) {
                    depId = resolve(depId, id)
                    // create dependees array, purely for debug purposes
                    var module = getModule(depId);
                    var dependees = module.dependees = module.dependees || [];
                    dependees.push(id);
                    return deepLoad(depId, id, loading);
                }))
                .then(function () {
                    return module;
                })
            })
        }

        // Initializes a module by executing the factory function with a new module "exports" object.
        function initModule(topId) {
            var module = getModule(topId);
            // do not reinitialize modules
            if (module.exports !== void 0) {
                return module.exports;
            }
            // do not initialize modules that do not define a factory function
            if (module.factory === void 0) {
                Require.warn("Can't require module "+JSON.stringify(topId));
                throw new Error("Can't require module "+JSON.stringify(topId));
            }

            if (module.path !== void 0) {

                // HACK: look up canonical URI in previously initialized modules (different topId, same URI)
                // TODO: Handle this at higher level?
                var uri = URL.resolve(modules[topId].path, "");
                if (has(urisToIds, uri)) {
                    var canonicalId = urisToIds[uri];
                    modules[topId] = modules[canonicalId];
                    return modules[topId].exports;
                }
                urisToIds[uri] = topId;

                module.directory = URL.resolve(module.path, "."); // EXTENSION

            }

            module.exports = {};
            module.uri = uri; // EXTENSION

            var requireArg = makeRequire(topId);
            var exportsArg = module.exports;
            var moduleArg = module;

            // Execute the factory function:
            var returnValue = module.factory.call(global, requireArg, exportsArg, moduleArg);

            // Modules should never have a return value.
            if (returnValue !== void 0) {
                Require.warn('require: module "'+topId+'" returned a value.');
            }

            // Update the list of modules that are ready to use
            Require.progress.initializedModules.push([
                config.location,
                topId
            ].join("#"));

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
                return initModule(topId);
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

            require.load = load;
            require.deepLoad = deepLoad;
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

    // TODO: other engines
    function getStack() {
        var stack = new Error().stack;
        return stack && stack.split("\n").slice(1).map(function(l) {
            var m = l.match(/^    at (?:([\w\.]+) \()?([^()]+?)(?::(\d+))?(?::(\d+))?\)?$/);
            return m && { method : m[1], url : m[2], line : parseInt(m[3], 10), column : parseInt(m[4], 10) };
        });
    }

    function getCurrentScriptURL() {
        if (document.currentScript) {
            return document.currentScript.src || null;
        } else {
            var frames, last;
            return (frames = getStack()) && (last = frames.pop()) && last.url || null
        }
    }

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
                    var packageDescription = JSON.parse(json);
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
                    info[name] = layer[name];
                }
            }
        });
        delete description.overlay;

        // directories
        description.directories = description.directories || {};
        description.directories.lib = description.directories.lib === void 0 ? "." : description.directories.lib;
        var lib = description.directories.lib;
        // lib
        config.lib = location + "/" + lib;
        var packageRoot = description.directories.packages || "node_modules";
        packageRoot = URL.resolve(location, packageRoot + "/");

        // The default "main" module of a package has the same name as the
        // package.
        if (description.main === void 0)
            description.main = description.name;

        // main, injects a definition for the main module, with
        // only its path. makeRequire goes through special effort
        // in deepLoad to re-initialize this definition with the
        // loaded definition from the given path.
        modules[""] = {
            "id": "",
            "path": URL.resolve(location, description.main)
        };

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
            if (!Require.isAbsolute(mapping.location))
                mapping.location = URL.resolve(location + "/", mapping.location + "/");
        });

        config.mappings = mappings;

        return config;
    }

    // Helper functions:

    function has(object, property) {
        return Object.prototype.hasOwnProperty.call(object, property);
    };

    // Resolves CommonJS module IDs (not paths)
    function resolve(id, baseId) {
        id = String(id);
        if (id.charAt(0) == ".") {
            id = URL.resolve(URL.resolve(baseId, "."), id);
        }
        return URL.resolve(id, "");
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

    Require.base = function (path) {
        // matches Unix basename
        return String(path)
            .replace(/(.+?)\/+$/, "$1")
            .match(/([^\/]+$|^\/$|^$)/)[1];
    };

    // Tests whether the path or URL is a absolute.
    Require.isAbsolute = function(path) {
        var parsed = URL.parse(path);
        return parsed.authorityRoot || parsed.root;
    };

    // Extracts dependencies by parsing code and looking for "require" (currently using a simple regexp)
    Require.parseDependencies = function(factory) {
        var o = {};
        String(factory).replace(/(?:^|[^\w\$_.])require\s*\(\s*["']([^"']*)["']\s*\)/g, function(_, id) {
            o[id] = true;
        });
        return Object.keys(o);
    };

    // Executes a function asynchronously using whatever mechaism is available to the platform
    // Used to ensure asynchronicity even when loader doesn't support async.
    Require.executeAsynchronously = function(fn) {
        if (typeof setTimeout === "function") {
            setTimeout(fn, 1);
        } else {
            Require.warn("Require warning: Implement Require.executeAsynchronously(fn) for your platform.");
            fn();
        }
    };

    // Built-in compiler/preprocessor "middleware":

    Require.DependenciesCompiler = function(config, compile) {
        return function(def) {
            if (!def.dependencies && def.text !== void 0) {
                def.dependencies = Require.parseDependencies(def.text);
            }
            def = compile(def);
            if (def && !def.dependencies) {
                if (def.text || def.factory) {
                    def.dependencies = Require.parseDependencies(def.text || def.factory);
                } else {
                    def.dependencies = [];
                }
            }
            return def;
        };
    };

    // Support she-bang for shell scripts by commenting it out (it is never valid JavaScript syntax anyway)
    Require.ShebangCompiler = function(config, compile) {
        return function(def) {
            if (def.text) {
                def.text = def.text.replace(/^#!/, "//#!");
            }
            return compile(def);
        }
    };

    Require.LintCompiler = function(config, compile) {
        if (!config.lint) {
            return compile;
        }
        return function(definition) {
            try {
                return compile(definition);
            } catch (error) {
                config.lint(definition);
                throw error;
            }
        };
    }

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
                    Require.CachingLoader(
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

        var loadFromMappings = function (id, module) {
            var i, prefix
            for (i = 0; i < length; i++) {
                prefix = prefixes[i];
                if (
                    id === prefix ||
                    id.indexOf(prefix) === 0 &&
                    id.charAt(prefix.length) === "/"
                ) {
                    var mapping = mappings[prefix];
                    return loadFromMapping(prefix, mapping, id, module);
                }
            }
            return load(id, module);
        };

        var loadFromMapping = function (prefix, mapping, id, module) {
            return config.loadPackage(mapping)
            .then(function (pkg) {
                var rest = id.slice(prefix.length + 1);
                return pkg.deepLoad(rest)
                .then(function () {
                    return {
                        factory: function (require, exports, module) {
                            module.exports = pkg(rest);
                        },
                        path: pkg.location + "#" + rest // this is necessary for constructing unique URI's for chaching
                    };
                })
            });
        }

        return function (id, module) {
            if (Require.isAbsolute(id)) {
                return load(id, module);
            } else {
                // TODO: remove this when all code has been migrated off of the autonomous name-space problem
                if (id.indexOf(config.name) === 0 && id.charAt(config.name.length) === "/")
                    console.warn("Package reflexive module ignored:", id);
                // TODO fix this
                if (id === config.name) {
                    id = "";
                }
                // The package loader can inject some definitions for
                // aliases into the package configuration.  These will
                // only have path attributes and need to be replaced with
                // factories.  We intercept these aliases (usually the
                // package's main module, not found in its lib path) here.
                var module = config.module(id);
                if (module.exports || module.factory) {
                    return Promise.ref(module);
                } else if (module.path !== void 0) {
                    return load(module.path, module);
                } else {
                    return loadFromMappings(id, module);
                }
            }
        };
    };

    Require.ExtensionsLoader = function(config, load) {
        var extensions = config.extensions || ["js"];
        var loadExtension = extensions.reduceRight(function (next, extension) {
            return function (id, module) {
                return load(id + "." + extension, module)
                .fail(function (error) {
                    return next(id, module);
                });
            };
        }, load);
        return function(id, module) {
            var needsExtension = Require.base(id).indexOf(".") < 0;
            if (needsExtension) {
                return loadExtension(id, module);
            } else {
                return load(id, module);
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
        }, function (id) {
            throw new Error("Can't find " + JSON.stringify(id));
        });
        return function(id, module) {
            if (Require.isAbsolute(id)) {
                return load(id, module);
            } else {
                return loadFromPaths(id, module);
            }
        };
    };

    Require.CachingLoader = function (config, load) {
        var cache = {};
        return function (url, module) {
            // remove search, anchor
            url = URL.resolve(url, "");
            if (!has(cache, url)) {
                cache[url] = load(url, module);
            }
            return cache[url];
        };
    }

    Require.Loader = function (config) {
        return function (url, module) {
            return Require.read(url)
            .then(function (text) {
                return config.compile({
                    text: text,
                    path: url
                });
            });
        };
    };

    if (typeof console === "undefined") {
        console = {}
        console.log =
        console.warn =
        console.error = function () {};
    }

    Require.enableLogging = false;
    Require.log =
    Require.warn =
    Require.error = function () {
        if (Require.enableLogging)
            console.log.apply(console, arguments);
    };

});
