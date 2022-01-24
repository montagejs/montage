/*
    Based in part on Motorola Mobility’s Montage
    Copyright (c) 2012, Motorola Mobility LLC. All Rights Reserved.
    3-Clause BSD License
    https://github.com/motorola-mobility/montage/blob/master/LICENSE.md


    Bookmark: https://glebbahmutov.com/blog/subfolders-as-dependencies/
    Bookmark for requiring modules that import/export with ES6:
    https://github.com/babel/babel/tree/master/packages/babel-plugin-transform-modules-commonjs
*/


function locationByRemovingLastURLComponentKeepingSlash(location) {
    return location ? location.substring(0,location.lastIndexOf("/")+1) : location;
}


/*global bootstrap, define, global */
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
        var Promise = (require)("bluebird");
        var URL = (require)("fast-url-parser");
        definition(exports, Promise, URL);
        (require)("./node");
    } else {
        throw new Error("Can't support require on this platform");
    }

})(function (Require, Promise, URL) {

    "use strict";

    // reassigning causes eval to not use lexical scope.
    var URLResolve = URL.resolve,
        ObjectKeys = Object.keys,
        ObjectCreate = Object.create,
        PromiseAll = Promise.all,
        globalEval = eval,
        /*jshint evil:true */
        global = globalEval('this');
        /*jshint evil:false */

    // Non-CommonJS speced extensions should be marked with an "// EXTENSION"
    // comment.
    var Map;
    if (!global.Map) {
        Map = function _Map() {
            this._content = ObjectCreate(null);
        };
        Map.prototype.constructor = Map;
        Map.prototype.set = function(key,value) {
            this._content[key] = value;
            return this;
        };
        Map.prototype.get = function(key) {
            return this.hasOwnProperty.call(this._content,key) ? this._content[key] : null;
        };
        Map.prototype.has = function(key) {
            return  key in this._content;
        };
    }
    else {
        Map = global.Map;
    }

    var Module = function Module(id, require) {
            this.id = id;
            this.require = require;
            this.dependencies = undefined;
            return this;
        },
        ModuleProto = Module.prototype;

        ModuleProto.id = null;
        ModuleProto.display = null;
        ModuleProto.require = null;
        ModuleProto.factory = void 0;
        ModuleProto.exports = void 0;
        ModuleProto.redirect = void 0;
        ModuleProto.location = null;
        ModuleProto.directory = null;
        ModuleProto.injected = false;
        ModuleProto.mappingRedirect = void 0;
        ModuleProto.type = null;
        ModuleProto.text = void 0;

    // for debug
    // ModuleProto.dependees = null;
    ModuleProto.extraDependencies = void 0;
    ModuleProto.uuid = null;
    ModuleProto._json = undefined;

    // Object.defineProperty(ModuleProto,"text", {
    //     get: function() {
    //         return this._text;
    //     },
    //     set: function(value) {
    //         this._text = value;
    //     }
    // });

    Object.defineProperty(ModuleProto,"json", {
        get: function() {
            return this._json || (this._json = this.parsedText || (this.text ? JSON.parse(this.text) : null))
        }
    });
    function normalizeId(id, config) {
        var result;
        if ((result = normalizeId.cache.get(id)) === undefined) {
            result = normalizeId.pattern.exec(id);
            result = ( result
                ? config && config.mappings[id]
                    ? id
                    : result[1]
                : id);
            normalizeId.cache.set(id, result);

        }
        return result;
    }
    normalizeId.cache = new Map();
    normalizeId.pattern = /^(.*)\.js$/;

    var __memoizeCallResultForKey = function __memoizeCallResultForKey(cache, result, key) {
        return cache.set(key, result) && result;
    };

    function _cacheMemoize(callback, cache) {

        var _memoize = function _memoize(key, arg) {
            return cache.get(key) || __memoizeCallResultForKey(cache, callback(key, arg), key) ;
        };

        return cache.set(callback,_memoize) && _memoize;
    }

    function memoize(callback, cache) {
        return cache.get(callback) || _cacheMemoize(callback, cache);
    }

    // We need to find the best time to flush _resolveStringtoArray and _resolved once their content isn't needed anymore
    var _resolved = new Map();
    var _resolveStringtoArray = new Map();
    var _target = [];

    function _resolveItem(source, part, target, EMPTY_STRING, DOT, DOT_DOT) {
        /*jshint -W035 */
        if (part === EMPTY_STRING || part === DOT) {
        } else if (part === DOT_DOT) {
            if (target.length) {
                target.pop();
            }
        } else {
            target.push(part);
        }
        /*jshint +W035 */
    }

    var EMPTY_STRING = "",
        SLASH = "/",
        DOT = ".",
        DOT_DOT = "..";

    function _cacheResolve(_id, baseId, resolved, baseIdMap) {
        var id, i, ii, source, parts, resolveItem = _resolveItem, result, target = _target, _EMPTY_STRING = EMPTY_STRING, _DOT = DOT, _DOT_DOT = DOT_DOT;

        target.length = 0;

        id = String(_id);
        source = _resolveStringtoArray.get(id) || (_resolveStringtoArray.set(id, (source = id.split(SLASH))) && source);
        parts = _resolveStringtoArray.get(baseId) || (_resolveStringtoArray.set(baseId,(parts = baseId.split(SLASH))) && parts);

        if (source.length && source[0] === DOT || source[0] === DOT_DOT) {
            for (i = 0, ii = parts.length-1; i < ii; i++) {
                resolveItem(parts, parts[i], target, _EMPTY_STRING, _DOT, _DOT_DOT);
            }
        }
        for (i = 0, ii = source.length; i < ii; i++) {
            resolveItem(source, source[i], target, _EMPTY_STRING, _DOT, _DOT_DOT);
        }

        return (baseIdMap || ( resolved.set(baseId, (baseIdMap = new Map())) && baseIdMap)).set(id, (result = target.join(SLASH))) && result;

    }

    function resolve(id, baseId) {
        if (id === EMPTY_STRING && baseId === EMPTY_STRING) {
            return EMPTY_STRING;
        } else {
            var resolved = _resolved.get(id) || (_resolved.set(id, (resolved = new Map())) && resolved),
                baseIdMap = resolved.get(baseId);

            return (baseIdMap && baseIdMap.get(id)) || _cacheResolve(id, baseId, resolved, baseIdMap);
        }
    }

    var NODE_MODULES_SLASH = "node_modules/";
    var SLASH_NODE_MODULES_SLASH = "/node_modules/";
    function findLongestDependencyPath(packageName, parent, packageLock) {
        var pathParts = parent.split("/"),
            directory = NODE_MODULES_SLASH,
            bestDirectory = null,
            i = 0,
            part;
        while (packageLock && packageLock.dependencies) {
            if (packageName in packageLock.dependencies) {
                bestDirectory = directory;
            }
            i += 2;  // skip node_modules
            part = pathParts[i];
            directory += part;
            directory += SLASH_NODE_MODULES_SLASH;
            packageLock = packageLock.dependencies[part];
        }
        if (bestDirectory) {
            bestDirectory += packageName;
        }
        return bestDirectory;
    }

    var isRelativePattern = /\/$/;
    function normalizeDependency(dependency, config, name) {
        var configPath, dependencyPath;

        config = config || {};
        if (typeof dependency === "string") {
            dependency = {
                location: dependency
            };
        }
        if (dependency.main) {
            dependency.location = config.mainPackageLocation;
        } else if (dependency.name) {
            // if the named dependency has already been found at another
            // location, refer to the same eventual instance
            // TODO this has to add a test on version
            if (config.registry && config.registry.has(dependency.name)) {
                dependency.location = config.registry.get(dependency.name);
            } else if (config.packageLock) {
                //There's a bug in node where config.location starts with file://
                //and config.mainPackageLocation doesn't.
                //So looking for lastIndexOf() then adding length to workaround,
                //But needs to figure out
                //why config.mainPackageLocation in node doesn't start by file:// ??
                //BUG: configPath = config.location.slice(config.mainPackageLocation.length - 1);
                configPath = config.location.slice(config.location.lastIndexOf(config.mainPackageLocation)+config.mainPackageLocation.length - 1);
                dependencyPath = findLongestDependencyPath(dependency.name, configPath, config.packageLock);
                if (dependencyPath) {
                    dependency.location = URLResolve(config.mainPackageLocation, dependencyPath);
                }
            } else if (!dependency.location && config.packagesDirectory) {
                // default location
                dependency.location = URLResolve(
                    config.packagesDirectory,
                    dependency.name + "/"
                );
            }
        }

        if (!dependency.location) {
            return dependency; // partially completed
        }

        // make sure the dependency location has a trailing slash so that
        // relative urls will resolve properly
        if (!isRelativePattern.test(dependency.location)) {
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
            dependency.location = URLResolve(
                config.location,
                dependency.location
            );
        }

        // register the package name so the location can be reused
        if (dependency.name) {
            config.registry.set(dependency.name,dependency.location);
        }

        return dependency;
    }

    function processMappingDependencies(dependencies, mappings) {
        if (dependencies) {
            for(var i=0, keys = ObjectKeys(dependencies), name;(name = keys[i]);i++) {
                if (!mappings[name]) {
                    // dependencies are equivalent to name and version mappings,
                    // though the version predicate string is presently ignored
                    // (TODO)
                    mappings[name] = {
                        name: name,
                        version: dependencies[name]
                    };
                }
            }
        }
    }

    function configurePackage(location, description, parent) {

        if (!isRelativePattern.test(location)) {
            location += "/";
        }

        /*
            TODO: Refactor so that config creation is not duplicated here.
        */
        var config = ObjectCreate(parent);
        config.name = description.name;
        config.location = location || Require.getLocation();
        config.packageDescription = description;
        config.useScriptInjection = description.useScriptInjection;
        config.normalizeId = normalizeId;
        config.resolve = resolve;


        if (description.production !== void 0) {
            config.production = description.production;
        }

        // explicitly mask definitions and modules, which must
        // not apply to child packages
        var modules = config.modules = config.modules || ObjectCreate(null);

        var registry = config.registry;
        if (config.name !== void 0 && !registry.has(config.name)) {
            registry.set(config.name,config.location);
        }

        // overlay
        var redirects,
            overlay = description.overlay || {};

        if (typeof process === "undefined") {
            // but first, convert "browser" field, as pioneered by Browserify, to
            // an overlay
            if (typeof description.browser === "string") {
                overlay.browser = {
                    redirects: {"": description.browser}
                };
            } else if (typeof description.browser === "object") {
                var bk, bkValue, iBk, countBk,
                    browser = description.browser,
                    browserKeys = ObjectKeys(browser);

                overlay.browser = {redirects:{}};
                redirects = overlay.browser.redirects;
                for(iBk=0;(bk = browserKeys[iBk]);iBk++) {
                    if (browser[bk] !== false) {
                        bkValue = browser[bk];

                        // if target is a relative path, then resolve
                        // otherwise we assume target is a module
                        if (bkValue[0] === '.') {
                            bkValue = URLResolve(location, bkValue);
                            bkValue = bkValue.stringByRemovingPrefix(location);
                        }

                        // if (bkValue.lastIndexOf('.') !== -1) {
                        //     //kValue = bkValue.stringByRemovingSuffix(".js");
                        //Will remove if present
                        bkValue = bkValue.stringByRemovingPathExtension();
                        //}


                    } else {
                        //From https://github.com/defunctzombie/node-browser-resolve/blob/master/index.js
                        //UNTESTED
                        bkValue = config.normalizeId(__dirname + '/empty.js');
                    }


                    if (bk[0] === '/' || bk[0] === '.') {
                        // if begins with / ../ or ./ then we must resolve to a full path
                        bk = URLResolve(location, bk);

                        //Now remove location and file extension.
                        bk = URLResolve(location, bk);
                        bk = bk.stringByRemovingPrefix(location);
                        bk = bk.stringByRemovingPathExtension();
                    }

                    redirects[bk] = bkValue;

                }
                // overlay.browser = {
                //     redirects: description.browser
                // };
            }
        }

        // overlay continued...
        var layer, overlays, engine, name;
        overlays = config.overlays = config.overlays || Require.overlays;
        for(var i=0, countI=overlays.length;i<countI;i++) {
            if (layer = overlay[(engine = overlays[i])]) {
                for (name in layer) {
                    if (layer.hasOwnProperty(name)) {
                        description[name] = layer[name];
                    }
                }
            }
        }
        delete description.overlay;

        config.packagesDirectory = URLResolve(location, "node_modules/");

        // The default "main" module of a package is 'index' by default.
        description.main = description.main || 'index';


        // mappings, link this package to other packages.
        var mappings = description.mappings || ObjectCreate(null);
        // dependencies, devDependencies if not in production
        processMappingDependencies(description.dependencies,mappings);
        if (!config.production) {
            processMappingDependencies(description.devDependencies,mappings);
        }

        // mappings
        for(var m=0, mKeys = ObjectKeys(mappings);(name = mKeys[m]);m++) {
            mappings[name] = normalizeDependency(
                mappings[name],
                config,
                name
            );
        }
        config.mappings = mappings;

        // main, injects a definition for the main module, with
        // only its path. makeRequire goes through special effort
        // in deepLoad to re-initialize this definition with the
        // loaded definition from the given path.
        modules[""] = {
            id: "",
            redirect: config.normalizeId(config.resolve(description.main, ""), config),
            location: config.location
        };

        //Deal with redirects
        redirects = description.redirects;
        if (redirects !== void 0) {
            for (name in redirects) {
                if (redirects.hasOwnProperty(name)) {
                    modules[name] = {
                        id: name,
                        redirect: config.normalizeId(config.resolve(redirects[name], name), config),
                        location: URLResolve(location, name)
                    };
                }
            }
        }

        return config;
    }

    //
    //
    //

    var isLowercasePattern = /^[a-z]+$/;
    Require.lowercaseModuleId = function lowercaseModuleId(id) {
        return isLowercasePattern.test(id) ? id : id.toLowerCase();
    }

    var defaultModuleTypes = new Set(["html", "mjson"]);
    //Require.detect_ES6_export_regex = /(?<=^([^"]|"[^"]*")*)export /;
    Require.makeRequire = function (config) {
        var require, requireForId;

        // Configuration defaults:
        config = config || {};
        config.cache = config.cache || new Map();
        //config.rootLocation = URLResolve(config.rootLocation || Require.getLocation(), "./");
        config.rootLocation = locationByRemovingLastURLComponentKeepingSlash(config.rootLocation || Require.getLocation());
       //config.location = URLResolve(config.location || config.rootLocation, "./");
        config.location = locationByRemovingLastURLComponentKeepingSlash(config.location || config.rootLocation);
        config.paths = config.paths || [config.location];
        config.mappings = config.mappings || ObjectCreate(null); // EXTENSION
        config.exposedConfigs = config.exposedConfigs || Require.exposedConfigs;
        config.moduleTypes = config.moduleTypes ? new Set(config.moduleTypes) :  defaultModuleTypes;
        config.makeLoader = config.makeLoader || Require.makeLoader;
        config.load = config.load || config.makeLoader(config);
        config.makeCompiler = config.makeCompiler || Require.makeCompiler;
        config.executeCompiler = config.executeCompiler || Require.executeCompiler;
        config.compile = config.compile || config.makeCompiler(config);
        config.parseDependencies = config.parseDependencies || Require.parseDependencies;
        config.read = config.read || Require.read;
        config.strategy = config.strategy || 'nested';
        config.requireById = config.requireById || new Map();
        config.normalizeId = normalizeId;
        config.resolve = resolve;

        // Modules: { exports, id, location, directory, factory, dependencies,
        // dependees, text, type }
        var modules = config.modules = config.modules || ObjectCreate(null);

        // produces an entry in the module state table, which gets built
        // up through loading and execution, ultimately serving as the
        // ``module`` free variable inside the corresponding module.
        function _createLowercaseModuleDescriptor(id, lookupId) {
            return (modules[lookupId] = new Module(id, require));

            /*
                .display isn't used anywhere. If it ends up missing, we can always bring it back as a getter
                so only execute the code then.
            */
            // aModule.display = (config.name || config.location); // EXTENSION
            // aModule.display += "/"; // EXTENSION
            // aModule.display += id; // EXTENSION
       }

        function _getLowercaseModuleDescriptor(id) {
             var lookupId = Require.lowercaseModuleId(id);
            return modules[lookupId] || _createLowercaseModuleDescriptor(id, lookupId);
        }

        function getModuleDescriptor(id) {
            return modules[id] || _getLowercaseModuleDescriptor(id);
        }


        // for preloading modules by their id and exports, useful to
        // prevent wasteful multiple instantiation if a module was loaded
        // in the bootstrapping process and can be trivially injected into
        // the system.
        function inject(id, exports) {
            var module = getModuleDescriptor(id),
                prefix = extractPrefixFromInjectId(id),
                mapping,
                mappingRedirect;

            if (prefix) {
                mapping = config.mappings[prefix];
                if (id.length > prefix.length) {
                    mappingRedirect = id.slice(prefix.length + 1);
                    module.location = URLResolve(mapping.location, mappingRedirect);
                    // Make sure the submodule is aware of this injection
                    if (typeof mapping.mappingRequire === "undefined") {
                        config.loadPackage(mapping, config)
                            .then(function (mappingRequire) {
                                mapping.mappingRequire = mappingRequire;
                                mappingRequire.inject(mappingRedirect, exports);
                            });
                    } else {
                        mapping.mappingRequire.inject(mappingRedirect, exports);
                    }
                } else {
                    module.location = mapping.location;
                }
            } else {
                module.location = URLResolve(config.location, id);
            }

            module.exports = exports;
            //module.directory = URLResolve(module.location, "./");
            module.directory = locationByRemovingLastURLComponentKeepingSlash(module.location);
            module.injected = true;
            module.redirect = void 0;
            module.mappingRedirect = void 0;
            module.error = void 0;
            // delete module.redirect;
            // delete module.mappingRedirect;
        }

        function extractPrefixFromInjectId(id) {
            var mappings = config.mappings,
                prefixes = ObjectKeys(mappings),
                length = prefixes.length,
                i,
                prefix;
            for (i = 0; i < length; i++) {
                prefix = prefixes[i];
                if (
                    id === prefix ||
                    id.indexOf(prefix) === 0 &&
                    id.charAt(prefix.length) === "/"
                ) {
                    return prefix;
                }
            }
        }

        // Ensures a module definition is loaded, compiled, analyzed
        var load = memoize(function (topId, viaId) {
            var module = getModuleDescriptor(topId),

                // if not already loaded, already instantiated, or
                // configured as a redirection to another module
                promise = (
                    module.factory === void 0 &&
                    module.exports === void 0 &&
                    module.redirect === void 0)
                    ? config.load(topId, module)
                    : undefined;

            // // if not already loaded, already instantiated, or
            // // configured as a redirection to another module
            // if (
            //     module.factory === void 0 &&
            //         module.exports === void 0 &&
            //             module.redirect === void 0
            // ) {
            //     promise = config.load(topId, module);
            // }

            if(!promise || typeof promise.then !== "function") {
                try {
                    load_compile(config, module);
                    return Promise.resolve(undefined);
                } catch(error) {
                    return Promise.reject(error);
                }
            } else {
                return promise
                .then(function () {
                    return load_compile(config, module);
                },function (error) {
                    return Promise.reject(error);
                });
            }

        }, config.cache);

        function load_compile(config, module) {
                if(!module.exports) {
                    // compile and analyze dependencies
                    config.compile(module);
                }
                if (module.redirect !== void 0) {
                    (module.dependencies || (module.dependencies = [])).push(module.redirect);
                }
                if (module.extraDependencies !== void 0) {
                    module.dependencies = module.dependencies || [];
                    Array.prototype.push.apply(module.dependencies, module.extraDependencies);
                }
                return;

        }

        // Load a module definition, and the definitions of its transitive
        // dependencies
        function deepLoad(topId, viaId, loading) {

            // this is a memo of modules already being loaded so we don’t
            // data-lock on a cycle of dependencies.
            if(!loading) {
                loading =  ObjectCreate(null);
            }
            //loading = loading || (config.loading = ObjectCreate(null));
            // has this all happened before?  will it happen again?
            // if (topId in _loading) {
            //     return null; // break the cycle of violence.
            // }
            return (loading[topId])
                ? null // break the cycle of violence.
                : (loading[topId] = true)
                // this has happened before
                && load(topId, viaId)
                .then(function deepLoadThen() {
                    //console.log(config.name +": deepLoadThen("+topId+","+viaId+")");

                    // load the transitive dependencies using the magic of
                    // recursion.
                    var module = getModuleDescriptor(topId),
                        dependencies = module.dependencies;

                    if (dependencies) {
                        var scopedConfig = config,
                            i = 0,
                            countI = dependencies.length,
                            iFirstPromise = null,
                            promises, iPromise,
                            scopedTopId = module.redirect || topId,
                            scopedLoading = loading,
                            scopedDeepLoad = deepLoad;


                        for(; i < countI; i++) {
                            // create dependees set, purely for debug purposes
                            // if (true) {
                            //     var iModule = getModuleDescriptor(depId);
                            //     var dependees = iModule.dependees = iModule.dependees || {};
                            //     dependees[topId] = true;
                            // }
                            if ((iPromise = scopedDeepLoad(scopedConfig.normalizeId(scopedConfig.resolve(dependencies[i], scopedTopId), scopedConfig), scopedTopId, scopedLoading))) {
                                /* jshint expr: true */


                                !iFirstPromise
                                ? iFirstPromise = iPromise
                                : !promises
                                    ? promises = [iFirstPromise, iPromise]
                                    : promises.push(iPromise);

                                /* jshint expr: false */
                            }
                        }
                        return promises
                            ? Promise.all(promises)
                            : iFirstPromise;
                            // return promises ? (promises.push === void 0 ? promises :
                            //     Promise.all(promises)) : null;
                    }
                    return null;

            }, function (error) {
                    getModuleDescriptor(topId).error = error;
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
            return (module.redirect !== void 0)
                ? getExports(module.redirect, viaId)
                // handle cross-package linkage
                : (module.mappingRedirect !== void 0)
                    ? module.mappingRequire(module.mappingRedirect, viaId)
                    // do not reinitialize modules
                    : (module.exports !== void 0)
                        ? module.exports
                        : executeModuleCompiler(module, config, topId, viaId);

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

            return executeModuleCompiler(module, config, topId);
        }


        // call module's config executeCompiler to get the "exports" object set
        function executeModuleCompiler(module, config, topId, viaId) {
            // do not initialize modules that do not define a factory function
            if (module.factory === void 0) {
                throw new Error(
                    "Can't require module " + JSON.stringify(topId) +
                    " via " + JSON.stringify(viaId)
                );
            }

            module.directory = locationByRemovingLastURLComponentKeepingSlash(module.location);

            try {
                // Execute the factory function:
                var returnValue = config.executeCompiler(module.factory, requireForId(topId), (module.exports = {}), module);
            } catch (_error) {
                // Delete the exports so that the factory is run again if this
                // module is required again
                //delete module.exports;
                module.exports = void 0;
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
            seen = seen || new Map();
            if (seen.has(location)) {
                return null; // break the cycle of violence.
            }
            seen.set(location,true);
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
                    name += "/";
                    name += id1;
                    return name;
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
            var require = function require(id) {
                //console.log(config.name +" - require("+id+")");
                //return getExports(/*topId*/require.normalizeId(require.resolve(id, viaId), config), viaId);
                return getExports(/*topId*/require.resolve(id, viaId), viaId);
            };
            require.viaId = viaId;
            require.normalizeId = config.normalizeId;
            require.resolve = config.resolve;

            // Asynchronous "require.async()" which ensures async executation
            // (even with synchronous loaders)
            require.async = function(id) {
                var topId = config.normalizeId(config.resolve(id, viaId), config);
                return deepLoad(topId, viaId).then(function () {
                    return require(topId);
                });
            };

            require.resolve = function (id) {
                return config.normalizeId(config.resolve(id, viaId), config);
            };

            // XXX deprecated
            // require.getModule = getModuleDescriptor; // XXX deprecated, use:
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

            var exposedConfigs = config.exposedConfigs;
            for(var i = 0, countI = exposedConfigs.length; i < countI; i++) {
                require[exposedConfigs[i]] = config[exposedConfigs[i]];
            }

            require.config = config;

            require.read = config.read;

            return require;
        }

        /*
            In all environments:
                - browser in development
                - browser after running mop
                - in node (we don't use mop there yet)
            this allows us to load bluebird only once, which is done in bootsrtapping, but can be required after.
        */
        if(config.name === "montage") {
            inject("bluebird", Promise);
        }

        config.requireForId = requireForId = memoize(makeRequire,config.requireById);

        require = makeRequire("");


        var globalModule = modules["global"] = new Module("global",require);
        // globalModule.id = "global";
        //Commening out .display as it isn't used anywhere
        //globalModule.display = "global";
        globalModule.exports = global;
        // globalModule.require = require;

        return require;
    };

    Require.injectPackageDescription = function (location, description, config) {
        var descriptions =
            config.descriptions =
                config.descriptions || {};
        descriptions[location] = Promise.resolve(description);
    };

    Require.injectLoadedPackageDescription = function (location, packageDescription, config, require) {
        var subconfig = configurePackage(
            location,
            packageDescription,
            config
        );
        var pkg;
        if (typeof require === "function") {
            pkg = require;
        } else {
            if (Require.delegate && Require.delegate.willCreatePackage) {
                pkg = Require.delegate.willCreatePackage(location, packageDescription, subconfig);
            }
            if (!pkg) {
                pkg = Require.makeRequire(subconfig);
                if (Require.delegate && Require.delegate.didCreatePackage) {
                    Require.delegate.didCreatePackage(subconfig);
                }

            }
        }
        config.packages[location] = pkg;
        return pkg;
    };

    Require.injectPackageDescriptionLocation = function (location, descriptionLocation, config) {
        var descriptionLocations =
            config.descriptionLocations =
                config.descriptionLocations || {};
        descriptionLocations[location] = descriptionLocation;
    };

    Require.loadPackageDescription = function (dependency, config) {
        var location = dependency.location,
            descriptions, promise;

        descriptions =
            config.descriptions =
                config.descriptions || {};
        if (descriptions[location] !== void 0) {
            return descriptions[location];
        }
        promise = tryPackage(location, dependency, config);
        descriptions[location] = promise;
        return promise.then(function (result) {
            // Dependency location may change while being loaded, cache
            // the description at its final location too
            descriptions[dependency.location] = promise;
            return result;
        });
    };


    // 'node_modules' character codes reversed
    var nmChars = [ 115, 101, 108, 117, 100, 111, 109, 95, 101, 100, 111, 110 ];
    var nmLen = nmChars.length;
    var CHAR_FORWARD_SLASH = 47;
    /**
     * Generate the next location that a node_module could be located at.
     * The next pair of /node_modules/ path parts are replaced with a single
     * /node_modules/, resulting in the same location, one package up.
     * This is more or less equivalent to doing
     * `location.replace(/node_modules\/[^/]+\/node_modules/, "node_modules")`,
     * except that the replacement is made from the end of the string rather
     * than the front, and performs better than regex.
     * @param {string} location
     * @return {string|null}
     */
    var nextModuleLocation = function (location) {
        var end = location.length - 1,
            rest = end,
            p = 0,
            nmFound = 0,
            i, code;
        for (i = end; i >= 0 && nmFound < 2; --i) {
            code = location.charCodeAt(i);
            if (code === CHAR_FORWARD_SLASH) {
                if (p === nmLen) {
                    nmFound++;
                } else if (nmFound === 0) {
                    rest = i + 1;
                }
                p = 0;
            } else if (p !== -1) {
                if (nmChars[p] === code) {
                    ++p;
                } else {
                    p = -1;
                }
            }
        }
        if (nmFound === 2) {
            return location.substring(0, i + nmLen + 3) + location.substring(rest);
        }
        return null;
    };

    /**
     * Try loading a package.json file. If the package.json cannot be read
     * at the given location, the next possible package location is tried
     * until all possibilities are exhausted.
     *
     * This is what provides support for projects installed with npm 3+.
     */
    var tryPackage = function (location, dependency, config) {
        var descriptionLocations, descriptionLocation;


        descriptionLocations = config.descriptionLocations = config.descriptionLocations || {};
        if (descriptionLocations[location]) {
            descriptionLocation = descriptionLocations[location];
        } else {
            descriptionLocation = URLResolve(location, "package.json");
        }

        var promise;

        if (Require.delegate && typeof Require.delegate.requireWillLoadPackageDescriptionAtLocation === "function") {
            promise = Require.delegate.requireWillLoadPackageDescriptionAtLocation(descriptionLocation,dependency, config);
        }
        if (!promise) {
            promise = (config.read || Require.read)(descriptionLocation);
        }
        return promise.then(function (content) {
            dependency.location = location;
            try {
                return typeof content === "object" ? content : JSON.parse(content);
            } catch (error) {
                error.message = "Loading package description at '" + location + "' failed cause: " + error.message + " in " + JSON.stringify(descriptionLocation);
                throw error;
            }
        }, function (err) {
            var nextLocation = nextModuleLocation(location);
            if (nextLocation) {
                return tryPackage(nextLocation, dependency, config);
            } else {
                throw err;
            }
        });
    };

    Require.loadPackageLock = function (dependency, config) {
        config = config || {};
        var read = config.read || Require.read,
            packageLockLocation = URLResolve(dependency.location, "package-lock.json");
        return read(packageLockLocation)
        .then(function (content) {
            try {
                return typeof content === "object" ? content : JSON.parse(content);
            } catch (error) {
                error.message = "Unable to parse package-lock.json at '" + dependency.location + "'";
                throw error;
            }
        }, function (error) {
            return null;
        });
    };

    Require.loadPackage = function (dependency, config, packageDescription) {
        config = config || {
            location: URLResolve(Require.getLocation(), dependency)
        };

        dependency = normalizeDependency(dependency, config);
        if (!dependency.location) {
            throw new Error("Can't find dependency: " + JSON.stringify(dependency));
        }
        config = ObjectCreate(config || null);

        var location = dependency.location,
            loadingPackages = config.loadingPackages = config.loadingPackages || {},
            loadedPackages = config.packages = {},
            registry = config.registry = config.registry || new Map();


        config.mainPackageLocation = config.mainPackageLocation || location;

        config.hasPackage = function (dependency) {
            if(!dependency) {
                return false;
            }
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
                    // loadPackageDescription may have mutated dependency.location
                    var pkg = Require.injectLoadedPackageDescription(dependency.location, packageDescription, config);
                    var rewriteLocation = location !== dependency.location;
                    if (rewriteLocation) {
                        loadingPackages[dependency.location] = loadingPackages[location];
                        // config.packages[dependency.location] is set by injectLoadedPackageDescription
                        config.packages[location] = config.packages[dependency.location];
                    }
                    return pkg;
                });
            }
            return loadingPackages[location];
        };

        var pkg;
        if (typeof packageDescription === "object") {
            pkg = Require.injectLoadedPackageDescription(location, packageDescription, config);
        } else {
            if (config.preloaded) {
                pkg = config.loadPackage(dependency);
            } else {
                pkg = Require.loadPackageLock(dependency, config)
                .then(function (packageLock) {
                    if (packageLock) {
                        config.packageLock = packageLock;
                    }
                    return config.loadPackage(dependency);
                });
            }
        }
        if (typeof pkg.then === "function") {
            pkg = pkg.then(function (pkg) {
                pkg.registry = registry;
                return pkg;
            });
        } else {
            pkg.registry = registry;
        }
        pkg.location = location;
        pkg.async = function (id, callback) {
            return pkg.then(function (require) {
                return require.async(id, callback);
            });
        };

        return pkg;
    };

    // Resolves CommonJS module IDs (not paths)
    Require.resolve = resolve;

    var extensionPattern = /\.([^\/\.]+)$/;
    Require.extension = function (path) {

        return path.substring(path.lastIndexOf(".")+1);
        // var match = extensionPattern.exec(path);
        // if (match) {
        //     return match[1];
        // }
    };

    // Tests whether the location or URL is a absolute.
    var isAbsolutePattern = /^[\w\-]+:/;
    Require.isAbsolute = function isAbsolute(location) {
        return location.charAt(0) === "/" || (location.indexOf("://") !== -1);
        // return isAbsolutePattern.test(location);
    };

    // Extracts dependencies by parsing code and looking for "require" (currently using a simple regexp)
    //var requirePattern = /(?:^|[^\w\"\'\$_.])require\s*\(\s*["']([^"']*)["']\s*\)/g,

    //This revised regex excludes cases where require() is itself within a litteral string
    var requirePattern = /(?:^|[^\w\$_.]|)require\s*\(\s*["']([^"']*)["']\s*\)(?:[^"'])/g,

    //var requirePattern = /(?:|[^\"\/*\n/])require\s*\(\s*["']([^"']*)["']\s*\)/g,
        // escapeSimpleComment = /\/\/(.*)$/gm,
        // escapeMultiComment = /\/\*([\s\S]*?)\*\//g,
        commentsCombined = /\/\/(.*)$|\/\*([\s\S]*?)\*\//gm;


    // Require.parseDependencies = function parseDependencies(factory) {
    //     var o = {};
    //     String(factory).replace(requirePattern, function(_, id) {
    //         o[id] = true;
    //     });
    //     return ObjectKeys(o);
    // };

    // Require.parseDependencies = function parseDependencies(factory) {
    //     var o = [];
    //     String(factory).replace(requirePattern, function(_, id) {
    //         if (o.indexOf(id) === -1) {
    //             o.push(id);
    //         }
    //     });
    //     return o;
    // };

    Require.parseDependencies = function parseDependencies(factory) {

        // Clear commented require calls
        factory = factory.replace(commentsCombined, '');

        var o = null, myArray;
        while ((myArray = requirePattern.exec(factory)) !== null) {
            (o || (o = [])).push(myArray[1]);
        }
        return o;
    };

    // Built-in compiler/preprocessor "middleware":

    Require.DependenciesCompiler = function DependenciesCompiler(config, compile) {
        return function(module) {
            if (module.dependencies === undefined  && module.parsedText === void 0 && module.location.endsWith("js") && module.text !== void 0) {
                module.dependencies = config.parseDependencies(module.text);
            }
            compile(module);
            if (module && module.dependencies === undefined && module.type !== Require.ES_MODULE_TYPE) {
                if (module.text || module.factory) {
                    module.dependencies = Require.parseDependencies(module.text || module.factory);
                }
            }
            //module.text = null;
            return module;
        };
    };

    // Support she-bang for shell scripts by commenting it out (it is never
    // valid JavaScript syntax anyway)
    var shebangPattern = /^#!/;
    var shebangCommented = "//#!";
    Require.ShebangCompiler = function ShebangCompiler(config, compile) {
        return function (module) {
            if (module.text) {
                module.text = module.text.replace(shebangPattern, shebangCommented);
            }
            compile(module);
            //module.text = null;
        };
    };

    Require.LintCompiler = function LintCompiler(config, compile) {
        return function(module) {
            try {
                compile(module);
            } catch (error) {
                error.message = error.message + " in " + module.location;
                console.log(error);
                if (config.lint) {
                    Promise.resolve().then(function () {
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

    var syncCompilerChain;

    //The ShebangCompiler doesn't make sense on the client side
    if (typeof window !== "undefined") {
        syncCompilerChain = function(config) {
            return Require.SerializationCompiler(
                config,
                Require.TemplateCompiler(
                    config,
                    Require.JsonCompiler(
                        config,
                        Require.DependenciesCompiler(
                            config,
                            Require.DelegateCompiler(
                                config,
                                Require.LintCompiler(
                                    config,
                                    Require.Compiler(config)
                                )
                            )
                        )
                    )
                )
            );
        };
    }
    else {
        syncCompilerChain = function(config) {
            return Require.SerializationCompiler(
                config,
                Require.TemplateCompiler(
                    config,
                    Require.JsonCompiler(
                        config,
                        Require.ShebangCompiler(
                            config,
                            Require.DependenciesCompiler(
                                config,
                                Require.DelegateCompiler(
                                    config,
                                    Require.LintCompiler(
                                        config,
                                        Require.Compiler(config)
                                    )
                                )
                            )
                        )
                    )
                )
            );
        };
    }

    Require.makeCompiler = function makeCompiler(config) {
        return function (module) {
            //return Promise.resolve(syncCompilerChain(config)(module));
            return syncCompilerChain(config)(module);
        };
    };

    Require.DelegateCompiler = function DelegateCompiler(config, compile) {
        if ( Require.delegate && typeof Require.delegate.Compiler === "function") {
            return Require.delegate.Compiler(config, compile);
        } else {
            return function(module) {
                var result = compile(module);
                return result;
            };
        }
    };

    var jsonPattern = /\.json$/;
    Require.JsonCompiler = function JsonCompiler(config, compile) {
        return function (module) {
            var json = module.location
                ?  module.location.match(jsonPattern)
                : false;

            if (json) {
                if (typeof module.exports !== "object" && (module.parsedText || typeof module.text === "string")) {
                    module.exports = module.parsedText || JSON.parse(module.text);
                }
                //module.text = null;
                return module;
            } else {
                var result = compile(module);
                //module.text = null;
                return result;
            }
        };
    };

    /**
     * Allows the reel's html file to be loaded via require.
     *
     * @see Compiler middleware in require/require.js
     * @param config
     * @param compile
     */
    var directoryExpression = /(.*\/)?(?=[^\/]+)/,
        dotHTML = ".html",
        dotHTMLLoadJs = ".html.load.js";

    Require.TemplateCompiler = function TemplateCompiler(config, compile) {
        return function(module) {
            var location = module.location;

            if (!location) {
                return;
            }

            if (location.endsWith(dotHTML) || location.endsWith(dotHTMLLoadJs)) {
                var match = location.match(directoryExpression);

                if (match) {
                    module.exports = {
                        directory: match[1],
                        content: module.text
                    };

                    return module;
                    /*
                        To work on preloading html with serialization resources via compiler in montage.js
                    */
                    // return compile(module);
                }
            }

            compile(module);
        };
    };

    var MontageMetadata = function(require, id, name, isInstance) {
        this.require = require;
        this.module = id;
        this.property = name;
        if (typeof isInstance !== undefined) {
            this.isInstance = isInstance;
        }
        //this.aliases = [name];
        return this;
    };

    MontageMetadata.prototype = {
        get moduleId() {
            return this.module;
        },
        get packageName() {
            return this.require.config.name;
        },
        get objectName() {
            return this.property;
        },
        get aliases() {
            return this._aliases || (this._aliases = [this.property]);
        },
        _aliases: null,
        isInstance: false
    };


    var _MONTAGE_METADATA = "_montage_metadata",
        reverseReelExpression = /((.*)\.reel)\/\2$/,
        reverseReelFunction = function($0, $1) {
            return $1;
        };

    Require.executeCompiler = function executeCompiler(factory, require, exports, module) {
        //module.directory = module.location.substring(0,module.location.lastIndexOf("/")+1);

        /*
            //module.filename = URLResolve(module.location, module.location);

            In both browser and node, module.filename ends up being equal to module.location which is already a full URL
        */

        // Execute the factory function:
        // TODO use config.scope
        return factory(
            require,            // require
            (module.exports = exports || {}),     // exports
            module,             // module
            global,
            module.location,     // __filename
            module.directory     // __dirname
        );
        // return factory.call(global,
        //     require,            // require
        //     exports,     // exports
        //     module,             // module
        //     global,
        //     module.filename,     // __filename
        //     module.directory     // __dirname
        // );

    };


    Require.SerializationCompiler = function SerializationCompiler(config, compile) {
        return function(module) {
            compile(module);
            if (!module.factory) {
                return;
            }
            var defaultFactory = module.factory;
            module.factory = function(require, exports, module) {
                //call it to validate:
                try {
                    var moduleExports = config.executeCompiler(defaultFactory, require, exports, module);
                } catch (e) {
                    if (e instanceof SyntaxError) {
                        config.lint(module);
                    } else {
                        throw e;
                    }
                }

                if (moduleExports) {
                    return moduleExports;
                }

                Require.createModuleMetadata(module, require, exports);

            };

            return module;
        };
    };

    Require.createModuleMetadata = function createModuleMetadata(module, require, exports) {
        /*
            In order to not create object._montage_metadata for third party frameworks that have no need for it, we test for wether objects on exports expose a getInfoForObject() function
        */
        var currentExports = module.exports || exports,
            keys = currentExports ? ObjectKeys(currentExports) : null;

        if(keys) {
            var i,
                object,
                name,
                _Object = Object;

            for (i = 0, name; (name = keys[i]); i++) {
                // avoid attempting to initialize a non-object
                if (((object = currentExports[name]) instanceof _Object)) {
                    // avoid attempting to reinitialize an aliased property
                    //jshint -W106
                    if (object.hasOwnProperty(_MONTAGE_METADATA) && !object._montage_metadata.isInstance) {
                        object._montage_metadata.aliases.push(name);
                        //object._montage_metadata.objectName = name;
                        //jshint +W106
                    } else if ((typeof object.getInfoForObject === "function" || typeof object.constructor.getInfoForObject === "function" ) && !_Object.isSealed(object)) {

                        object._montage_metadata = new MontageMetadata(require, module.id.indexOf(".reel") !== -1 ? module.id.replace(reverseReelExpression, reverseReelFunction) : module.id, name,/*isInstance*/(typeof object !== "function"));
                    }
                }
            }
        }

    };

    if(typeof exports !== "undefined") {
        exports.createModuleMetadata = Require.createModuleMetadata;
    }

    // Built-in loader "middleware":

    // Using mappings hash to load modules that match a mapping.
    Require.MappingsLoader = function MappingsLoader(config, load) {
        var mappings = config.mappings || (config.mappings = ObjectCreate(null)),
            configName = config.name;

        // finds a mapping to follow, if any
        return function (id, module) {

            /*
                It looks like this is never used, plus a module id can't start by a / nor it is a uri/file url as that's what Require.isAbsolute tests for
            */
            // if (Require.isAbsolute(id)) {
            //     return load(id, module);
            // }

            // TODO: remove this when all code has been migrated off of the autonomous name-space problem
            if (
                configName !== void 0 &&
                id.charAt(configName.length) === "/" &&
                id.indexOf(configName) === 0

            ) {
                console.warn("Package reflexive module ignored:", id);
            }

            /*
            var prefixes = ObjectKeys(mappings),
            length = prefixes.length,
            i, prefix;
            for (i = 0; i < length; i++) {
                prefix = prefixes[i];
                if (
                    id === prefix || (
                        id.indexOf(prefix) === 0 &&
                            id.charAt(prefix.length) === "/"
                    )
                ) {
                    return config.loadPackage(mappings[prefix], config).then(loadMapping);
                }
            }
            */

            var aPackage, prefix;
            //It's more likely to require a package+path than the package name itself.
            // if(
            //     (aPackage = (mappings.hasOwnProperty((prefix = id.substring(0,id.indexOf("/"))))
            //         ? mappings[prefix]
            //         : (mappings.hasOwnProperty((prefix = id))
            //             ? mappings[prefix]
            //             : null)))
            // ) {
            if((aPackage = (mappings[(prefix = id.substring(0,id.indexOf("/")))] || mappings[(prefix = id)]))) {
                return config.loadPackage(aPackage, config)
                    .then(function loadMapping(mappingRequire) {
                        var rest = id.slice(prefix.length + 1);
                        mappings[prefix].mappingRequire = mappingRequire;
                        module.mappingRedirect = rest;
                        module.mappingRequire = mappingRequire;
                        return mappingRequire.deepLoad(rest, config.location);
                        /*
                            TODO/FixMe:

                            There's a bug where if a module id contains a path
                            that happens to be the name of a top level package,
                            the rest of the path after that part is tried to be loaded
                            from that package, ignoring anything before that,

                            This is where I discovered that bug, the actual cause
                            might be somewhere else.
                        */
                        //return mappingRequire.deepLoad(rest, mappingRequire.config.location);

                    }
                )
            }

            return load(id, module);
        };
    };

    Require.LocationLoader = function LocationLoader(config, load) {
        var configModuleTypes = config.moduleTypes,
            configLocation = config.location,
            configDelegate = config.delegate;
        function locationLoader(id, module) {
            var location, result,
                path = id,
                config = locationLoader.config,
                extension = Require.extension(id);
            if (
                !extension || (
                    extension !== "js" &&
                        extension !== "json" &&
                            !configModuleTypes.has(extension)
                )
            ) {
                path += ".js";
            }

            location = module.location = URLResolve(configLocation, path);
            if (configDelegate && configDelegate.packageWillLoadModuleAtLocation) {
                result = configDelegate.packageWillLoadModuleAtLocation(module,location);
            }
            return result ? result : load(location, module);
        }
        locationLoader.config = config;
        return locationLoader;
    };

    Require.MemoizedLoader = function (config, load) {
        //return memoize(load, config.cache);
        return load;
    };

    /**
     * Allows reel directories to load the contained eponymous JavaScript
     * module.
     * @see Loader middleware in require/require.js
     * @param config
     * @param loader the next loader in the chain
     */
    var _reelExpression = /([^\/]+)\.reel$/,
        _dotREEL = ".reel";
    Require.ReelLoader = function ReelLoader(config, load) {
        var reelExpression = _reelExpression,
            dotREEL = _dotREEL;

        return function reelLoader(id, module) {
            if (id.endsWith(dotREEL)) {
                module.redirect = id;
                module.redirect += SLASH;
                module.redirect += reelExpression.exec(id)[1];
                return module;
            } else {
                return load(id, module);
            }
        };
    };

    Require.ES_MODULE_TYPE = "javascript-module";

});
