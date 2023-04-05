/*
    Based in part on Motorola Mobility’s Montage
    Copyright (c) 2012, Motorola Mobility LLC. All Rights Reserved.
    3-Clause BSD License
    https://github.com/motorola-mobility/montage/blob/master/LICENSE.md
*/
/*jshint node:true */
var Require = require("./require"),
    Promise = require("bluebird"),
    FS = require("fs"),
    URL = require("url"),
    PATH = require("path"),
    globalEval = eval,
    // esm = require("esm"),
    emptyFactory = function () {
    };

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

var jsIndexPrefix = '/index.js',
    jsPreffix = '.js';
Require.read = function read(location, module) {
    return new Promise(function (resolve, reject) {
        var path = Require.locationToPath(location);
        FS.readFile(path, "utf-8", function (error, text) {
            if (error) {
                // Re-use xhr on read on .js failure if not /index.js file and
                // retry on /index.js dynamically.
                if (
                    path.indexOf(jsPreffix) !== -1 && // is .js
                        path.indexOf(jsIndexPrefix) === -1 // is not /index.js
                ) {
                    path = path.replace(jsPreffix, jsIndexPrefix);

                    // Attempt to read if file exists
                    FS.readFile(path, "utf-8", function (error, text) {
                        if (error) {
                            reject(new Error(error));
                        } else {
                            //We found a folder/index.js, we need to update the module to reflect that somehow
                            module.location = location.replace(jsPreffix, jsIndexPrefix);
                            module.redirect = module.id;
                            module.redirect += "/index";
                            resolve(text);
                        }
                    });
                } else {
                    reject(new Error(error));
                }
            } else {
                resolve(text);
            }
        });
    });
};

// Compiles module text into a function.
// Can be overriden by the platform to make the engine aware of the source path. Uses sourceURL hack by default.
Require.Compiler = function Compiler(config) {
    config.scope = config.scope || {};
    var names = ["require", "exports", "module", "global", "__filename", "__dirname"];
    var scopeNames = Object.keys(config.scope);
    names.push.apply(names, scopeNames);
    return function (module) {

        if (module.location && (module.location.endsWith(".meta") || module.location.endsWith(".mjson"))) {
            return module;
        }

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
            module.factory = function (require, exports, module, global, __filename, __dirname) {
                /*
                    __filename and __dirname are passed starting with file://
                    This not what's node default value is, so before eventually fixing this where it's sent
                    we do it here for now
                */
               arguments[4] = __filename.substring(7);
               arguments[5] = __dirname.substring(7);
                if(scopeNames.length) {
                    Array.prototype.push.apply(arguments, scopeNames.map(function (name) {
                        return config.scope[name];
                    }));
                }
                return factory.apply(this, arguments);
            };
            // new Function will have its body reevaluated at every call, hence using eval instead
            // https://developer.mozilla.org/en/JavaScript/Reference/Functions_and_function_scope
            //module.factory = new Function("require", "exports", "module", module.text + "\n//*/\n//@ sourceURL="+module.path);
        }
    };
};

//Temporary: only doing this in node as this regex doesn't work in WebKit
Require.detect_ES6_export_regex = /(?<=^([^"]|"[^"]*")*)export /;
Require.Loader = function Loader(config, load) {
    return function (location, module) {
        return config.read(location, module)
        .then(function (text) {

            if(/*faster*/(text.indexOf("export ") !== -1) && /*eliminate if in quotes*/(text.match(Require.detect_ES6_export_regex))) {

                return import(location).then(function(esModule) {
                    module.type = Require.ES_MODULE_TYPE;
                    module.exports = esModule;
                    module.factory = emptyFactory;
                    //module.factory.displayName = displayName;
                });


            } else {
                module.type = "javascript";
                module.text = text;
            }
            //module.location is now possibly changed by read if it encounters the pattern of
            //folder/index.js when it couldn't find folder.js, so we don't want to override that.
            //module.location = location;
        }, function (reason, error, rejection) {
            return load(location, module);
        });
    };
};

Require.NodeLoader = function NodeLoader(config) {
    return function nodeLoad(location, module) {
        var id = location.slice(config.location.length);
        id = id.substr(0,id.lastIndexOf('.'));
        module.type = "native";
        module.exports = require(id);
        module.location = location;
        return module;
    };
};

Require.makeLoader = function makeLoader(config) {
    return Require.ReelLoader(config,
        Require.MappingsLoader(
            config,
            Require.LocationLoader(
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
