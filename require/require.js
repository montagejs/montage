/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
bootstrap("require/require", function (require, CJS) {

    var Promise = require("core/promise").Promise;
    var URL = require("core/url");

    var global = (function () {return this})();
    var globalEval = eval; // reassigning causes eval to not use lexical scope.

    // Non-CommonJS speced extensions should be marked with an "// EXTENSION" comment.

    // Sandbox is an instance of the loader system. Different sandboxes will have different instances of modules.
    // Returns the root "require" function. If this root "require()" function is called the loader will be in synchronous mode.
    // To get asynchronous loading you MUST call the root "require.async()". In async mode all subsequent calls to "require()" will
    // be asynchronously loaded, and synchronously executed.
    CJS.Sandbox = function(config) {
        // Configuration defaults:
        config = config || {};
        config.location = URL.resolve(config.location || CJS.pwd(), ".");
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
            "getModule",
            "load",
            "loadPackage"
        ];
        config.makeLoader = config.makeLoader || CJS.DefaultLoaderConstructor;
        config.load = config.load || config.makeLoader(config);
        config.makeCompiler = config.makeCompiler || CJS.DefaultCompilerConstructor;
        config.compile = config.compile || config.makeCompiler(config);

        // Sandbox state:
        // Module instances: { exports, id, path, uri, factory, dependencies }
        var modules = config.modules;
        // Mapping from canonical IDs to the initial top ID used to load module
        var urisToIds = {};

        function getModule(id) {
            if (!has(modules, id)) {
                modules[id] = {"id": id};
            }
            return modules[id];
        }
        config.getModule = getModule;

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
                    loading[topId] = CJS.read(module.path)
                    .then(function (text) {
                        module.text = text;
                        config.compile(module);
                        return module;
                    });
                // load
                } else {

                    // Update the list of modules that need to load
                    CJS.progress.requiredModules.push(
                        [config.location, topId].join("#")
                    );

                    var result = Promise.defer();
                    loading[topId] = result.promise;
                    if (topId == "montage/undefined") debugger;
                    config.load(topId, function(definition) {
                        if (!definition) {
                            result.reject("Can't find module " + JSON.stringify(topId) + " via " + JSON.stringify(viaId));
                        }
                        // TODO lace the module through instead of receiving the definition
                        for (var name in definition) {
                            module[name] = definition[name];
                        }

                        // Progress update
                        CJS.progress.loadedModules.push([
                            config.location,
                            topId
                        ].join("#"));

                        result.resolve(module);
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
                CJS.warn("Can't require module "+JSON.stringify(topId));
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
                CJS.warn('require: module "'+topId+'" returned a value.');
            }

            // Update the list of modules that are ready to use
            CJS.progress.initializedModules.push([
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
                if (id == "montage/undefined") debugger;
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
            require.progress = CJS.progress;

            config.exposedConfigs.forEach(function(name) {
                require[name] = config[name];
            });

            require.config = config;

            return require;
        }

        return makeRequire("");
    };

    CJS.progress = {
        requiredModules: [],
        loadedModules: [],
        initializedModules: []
    };

    function makeDefine() {
        var subscribers = [];
        var define = function() {
            var definition = parseDefine(Array.prototype.slice.call(arguments));
            definition.path = getCurrentScriptURL();
            for (var i = 0; i < subscribers.length; i++) {
                if (typeof subscribers[i] === "function") {
                    subscribers[i](definition);
                }
            }
        }
        // API for loaders to "subscribe" to define calls
        define._subscribe = function(subscriber) {
            subscribers.push(subscriber);
        }
        return define;
    }

    function parseDefine(args) {
        var definition = {};

        // optional: module id
        if (typeof args[0] === "string") {
            definition.id = args.shift();
        }
        // optional: module dependencies
        if (Array.isArray(args[0])) {
            definition.dependencies = args.shift();
        }
        // required: module factory or exports object
        if (typeof args[0] === "function") {
            definition.factory = args.shift();
        } else if (typeof args[0] === "object") {
            var exportsObject = args.shift();
            definition.factory = function(require, exports, module) {
                module.exports = exportsObject;
            };
        }

        if (args.length > 0 || typeof definition.factory !== "function") {
            CJS.console.warn("Invalid module definition: ", args);
        }

        return definition;
    }

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

    if (!global.define) {
        global.define = makeDefine();
    } else {
        CJS.warn("define already exists.");
    }

    CJS.PackageSandbox = function (location, config) {
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
                loadingPackages[location] = CJS.read(jsonPath)
                .then(function (json) {
                    var packageDescription = JSON.parse(json);
                    var subconfig = configurePackage(
                        location,
                        packageDescription,
                        config
                    );
                    var pkg = CJS.Sandbox(subconfig);
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
        config.location = location;
        config.packageDescription = description;
        // explicitly mask definitions and modules, which must
        // not apply to child packages
        var modules = config.modules = config.modules || {};

        // overlay
        var overlay = description.overlay || {};
        CJS.overlays.forEach(function (engine) {
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
            if (!CJS.isAbsolute(mapping.location))
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

    CJS.base = function (path) {
        // matches Unix basename
        return String(path)
            .replace(/(.+?)\/+$/, "$1")
            .match(/([^\/]+$|^\/$|^$)/)[1];
    };

    // Tests whether the path or URL is a absolute.
    CJS.isAbsolute = function(path) {
        var parsed = URL.parse(path);
        return parsed.authorityRoot || parsed.root;
    };

    // Extracts dependencies by parsing code and looking for "require" (currently using a simple regexp)
    CJS.parseDependencies = function(factory) {
        var o = {};
        String(factory).replace(/(?:^|[^\w\$_.])require\s*\(\s*["']([^"']*)["']\s*\)/g, function(_, id) {
            o[id] = true;
        });
        return Object.keys(o);
    };

    // Executes a function asynchronously using whatever mechaism is available to the platform
    // Used to ensure asynchronicity even when loader doesn't support async.
    CJS.executeAsynchronously = function(fn) {
        if (typeof setTimeout === "function") {
            setTimeout(fn, 1);
        } else {
            CJS.warn("CJS warning: Implement CJS.executeAsynchronously(fn) for your platform.");
            fn();
        }
    };

    // Built-in compiler/preprocessor "middleware":

    CJS.ParseDependencies = function(config, compile) {
        return function(def) {
            if (!def.dependencies && def.text !== void 0) {
                def.dependencies = CJS.parseDependencies(def.text);
            }
            def = compile(def);
            if (def && !def.dependencies) {
                if (def.text || def.factory) {
                    def.dependencies = CJS.parseDependencies(def.text || def.factory);
                } else {
                    def.dependencies = [];
                }
            }
            return def;
        };
    };

    // Support she-bang for shell scripts by commenting it out (it is never valid JavaScript syntax anyway)
    CJS.StripShebang = function(config, compile) {
        return function(def) {
            if (def.text) {
                def.text = def.text.replace(/^#!/, "//#!");
            }
            return compile(def);
        }
    };

    CJS.Lint = function(config, compile) {
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

    CJS.DefaultCompilerMiddleware = function(config, compile) {
        return CJS.StripShebang(config,
                   CJS.ParseDependencies(config,
                       CJS.Lint(config, compile)));
    };

    CJS.DefaultCompilerConstructor = function(config) {
        return CJS.DefaultCompilerMiddleware(config, CJS.NewFunctionCompiler(config));
    };

    // Built-in loader "middleware":

    // Attempts to load using multiple loaders until one of them works:
    CJS.Multi = function(config, loaders) {
        return function(id, callback) {
            return tryEachSyncOrAsync(loaders, function(load, resultCallback) {
                return load(id, resultCallback);
            }, callback);
        };
    };

    // Attempts to load using multiple base paths (or one absolute path) with a single loader.
    CJS.Paths = function(config, load) {
        return function(id, callback) {
            var paths = CJS.isAbsolute(id) ?
                [id] :
                config.paths.map(function(path) {
                    return URL.resolve(path, id);
                });

            return tryEachSyncOrAsync(paths, function(path, resultCallback) {
                return load(path, resultCallback);
            }, callback);
        };
    };

    // Using mappings hash to load modules that match a mapping.
    CJS.Mappings = function(config, next) {
        config.mappings = config.mappings || {};
        config.name = config.name || "";
        return function(id, callback) {
            if (CJS.isAbsolute(id))
                return next(id, callback);
            // TODO: remove this when all code has been migrated off of the autonomous name-space problem
            if (id.indexOf(config.name) === 0 && id.charAt(config.name.length) === "/")
                console.warn("Package reflexive module ignored:", id);
            if (id === config.name) {
                id = "";
            }
            // The package loader can inject some definitions for
            // aliases into the package configuration.  These will
            // only have path attributes and need to be replaced with
            // factories.  We intercept these aliases (usually the
            // package's main module, not found in its lib path) here.
            var module = config.getModule(id);
            if (module.exports || module.factory) {
                return callback(module);
            }
            if (module.path !== void 0) {
                return next(module.path, callback);
            }
            return tryEachSyncOrAsync(Object.keys(config.mappings), function(candidate, resultCallback) {
                if (
                    id === candidate ||
                    id.indexOf(candidate) === 0 && id.charAt(candidate.length) === "/"
                ) {
                    var location = config.mappings[candidate].location;
                    return config.loadPackage(location)
                    .then(function (pkg) {
                        var rest = id.slice(candidate.length + 1);
                        pkg.deepLoad(rest)
                        .then(function (result) {
                            resultCallback({
                                "factory": function (require, exports, module) {
                                    module.exports = pkg(rest);
                                },
                                "path": location + "#" + rest // this is necessary for constructing unique URI's for chaching
                            });
                        })
                        .end();
                    }, function (reason) {
                        return resultCallback ? resultCallback(null) : null;
                    });
                } else {
                    return resultCallback ? resultCallback(null) : null;
                }
            }, function (result) {
                if (result) {
                    if (callback) {
                        callback(result);
                    } else {
                        return result;
                    }
                } else {
                    return next(id, callback);
                }
            });
        };
    };

    CJS.Extensions = function(config, load) {
        var extensions = config.extensions || ["js"];
        return function(id, callback) {
            var needsExtension = CJS.base(id).indexOf(".") < 0;
            return tryEachSyncOrAsync(extensions, function(extension, resultCallback) {
                if (needsExtension)
                    return load(id + "." + extension, resultCallback);
                else
                    return load(id, resultCallback);
            }, callback);
        }
    }

    // Special helper function that iterates over each item calling iteratorCallback until success (calls completeCallback
    // with a truthy value, or returns a truthy value otherwise). Useful in "middleware" like Paths, Multi, etc.
    function tryEachSyncOrAsync(items, iteratorCallback, completeCallback) {
        items.reduceRight(function (nextCallback, item) {
            return function () {
                iteratorCallback(item, function (result) {
                    if (result) {
                        completeCallback(result);
                    } else {
                        nextCallback(null);
                    }
                })
            };
        }, completeCallback)(null);
    };

    CJS.CachingLoader = function(config, load) {
        var cache = {};
        var pending = {};
        return function(url, callback) {
            url = URL.resolve(url, "");

            if (has(cache, url)) {
                return callback ? callback(cache[url]) : cache[url];
            }

            if (has(pending, url)) {
                pending[url].push(callback);
            } else {
                pending[url] = [callback];
                load(url, function(definition) {
                    cache[url] = definition;
                    pending[url].forEach(function(pendingCallback) {
                        pendingCallback(definition);
                    });
                });
            }
        }
    }

    if (typeof console === "undefined") {
        console = {}
        console.log =
        console.warn =
        console.error = function () {};
    }

    CJS.enableLogging = false;
    CJS.log =
    CJS.warn =
    CJS.error = function () {
        if (CJS.enableLogging)
            console.log.apply(console, arguments);
    };

});
