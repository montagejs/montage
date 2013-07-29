
/*
    Based in part on Motorola Mobility’s Montage
    Copyright (c) 2012, Motorola Mobility LLC. All Rights Reserved.
    3-Clause BSD License
    https://github.com/motorola-mobility/montage/blob/master/LICENSE.md
*/
/*jshint node:true */
var Require = require("./require");
var Promise = require("q");
var FS = require("fs");
var URL = require("url");
var PATH = require("path");

var globalEval = eval;

Require.getLocation = function getLocation() {
    return URL.resolve("file:///", process.cwd() + "/");
};

Require.locationToPath = function locationToPath(location) {
    var parsed = URL.parse(location);
    return parsed.path;
};

Require.filePathToLocation = function filePathToLocation(path) {
    return URL.resolve(Require.getLocation(), path);
};

Require.directoryPathToLocation = function directoryPathToLocation(path) {
    if (!/\/$/.test(path)) {
        path += "/";
    }
    path = Require.filePathToLocation(path);
    return path;
};

Require.read = function read(location) {
    var deferred = Promise.defer();
    var path = Require.locationToPath(location);
    FS.readFile(path, "utf-8", function (error, text) {
        if (error) {
            deferred.reject(new Error(error));
        } else {
            deferred.resolve(text);
        }
    });
    return deferred.promise;
};

// Compiles module text into a function.
// Can be overriden by the platform to make the engine aware of the source path. Uses sourceURL hack by default.
Require.Compiler = function Compiler(config) {
    config.scope = config.scope || {};
    var names = ["require", "exports", "module"];
    var scopeNames = Object.keys(config.scope);
    names.push.apply(names, scopeNames);
    return function (module) {
        if (module.factory) {
            return module;
        } else if (
            module.text !== void 0 &&
            module.type === "javascript"
        ) {
            var factory = globalEval(
                "(function(" + names.join(",") + "){" +
                module.text +
                "\n//*/\n})\n//@ sourceURL=" + module.location
            );
            module.factory = function (require, exports, module) {
                Array.prototype.push.apply(arguments, scopeNames.map(function (name) {
                    return config.scope[name];
                }));
                return factory.apply(this, arguments);
            };
            // new Function will have its body reevaluated at every call, hence using eval instead
            // https://developer.mozilla.org/en/JavaScript/Reference/Functions_and_function_scope
            //module.factory = new Function("require", "exports", "module", module.text + "\n//*/\n//@ sourceURL="+module.path);
        }
    };
};

Require.Loader = function Loader(config, load) {
    return function (location, module) {
        return config.read(location)
        .then(function (text) {
            module.type = "javascript";
            module.text = text;
            module.location = location;
        }, function (reason, error, rejection) {
            return load(location, module);
        });
    };
};

Require.NodeLoader = function NodeLoader(config) {
    return function nodeLoad(location, module) {
        var id = location.slice(config.location.length);
        return {
            type: "native",
            exports: require(id),
            location: location
        };
    };
};

Require.makeLoader = function makeLoader(config) {
    return Require.MappingsLoader(
        config,
        Require.ExtensionsLoader(
            config,
            Require.PathsLoader(
                config,
                Require.MemoizedLoader(
                    config,
                    Require.Loader(
                        config,
                        Require.NodeLoader(config)
                    )
                )
            )
        )
    );
};

Require.findPackagePath = function findPackagePath(directory) {
    if (directory === PATH.dirname(directory)) {
        return Promise.reject(new Error("Can't find package"));
    }
    var packageJson = PATH.join(directory, "package.json");
    return Promise.ninvoke(FS, "stat", packageJson)
    .then(function (stat) {
        return stat.isFile();
    }, function (error) {
        return false;
    }).then(function (isFile) {
        if (isFile) {
            return directory;
        } else {
            return Require.findPackagePath(PATH.dirname(directory));
        }
    });
};

Require.findPackageLocationAndModuleId = function findPackageLocationAndModuleId(path) {
    path = PATH.resolve(process.cwd(), path);
    var directory = PATH.dirname(path);
    return Require.findPackagePath(directory)
    .then(function (packageDirectory) {
        var modulePath = PATH.relative(packageDirectory, path);
        modulePath = modulePath.replace(/\.js$/, "");
        return {
            location: Require.directoryPathToLocation(packageDirectory),
            id: modulePath
        };
    }, function (error) {
        throw new Error("Can't find package: " + path);
    });
};

