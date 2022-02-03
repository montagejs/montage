/*
    Based in part on Motorola Mobility’s Montage
    Copyright (c) 2012, Motorola Mobility LLC. All Rights Reserved.
    3-Clause BSD License
    https://github.com/motorola-mobility/montage/blob/master/LICENSE.md
*/
/*jshint node:true */
const Require = require("./require"),
    Promise = require("bluebird"),
    PromiseResolve = Promise.resolve,
    PromiseReject = Promise.reject,
    NodeModule = require("module"),
    FS = require("fs"),
    URL = require("fast-url-parser"),
    URLResolve = URL.resolve,
    CWD = process.cwd(),
    _RequireGetLocation =  (CWD + "/"),
    PATH = require("path"),
    nativeModule = module /* the one provided by native nore require loading this */,
    // esm = require("esm"),
    emptyFactory = function () {
    },
    NodeBuilInModules = NodeModule.builtinModules;

/*
    URL.replace();

    would make all modules use fast-url-parser automatically in the application.
    But what fast-url-parser provides isn't compatible with the url module in node 14+
*/

Require.getLocation = function getLocation() {
    return _RequireGetLocation;
    // return  (CWD + "/");
    // return URLResolve("file:///", CWD + "/");
};

Require.locationToPath = function locationToPath(location) {
    /*
        When this is called, location always starts by file://, followed by /some/path...
        So instead of using the generic URL.parse(), we can handle it directly in a simpler
        and faster way.
    */
    return location.substring(6);
    // var parsed = URL.parse(location);
    // return parsed.path;
};

Require.filePathToLocation = function filePathToLocation(path) {
    return URLResolve(Require.getLocation(), path);
};

Require.directoryPathToLocation = function directoryPathToLocation(path) {
    if (!/\/$/.test(path)) {
        path += "/";
    }
    path = Require.filePathToLocation(path);
    return path;
};

var jsIndexPrefix = '/index.js',
    jsPreffix = '.js',
    utf8 = "utf-8";
Require.read = function read(location, module) {

    try {
        return PromiseResolve(FS.readFileSync(location, utf8));
    } catch (error) {

        if (
            location.includes(jsPreffix) && // is .js
            !location.includes(jsIndexPrefix) // is not /index.js
        ) {

            try {
                // Attempt to read if file index.js exists there
                var text = FS.readFileSync((location = location.replace(jsPreffix, jsIndexPrefix)), utf8);

                //We found a folder/index.js, we need to update the module to reflect that somehow
                module.location = location;
                module.redirect = `${module.id}/index`;
                return PromiseResolve(text);
            } catch (error) {
                return PromiseReject(error);
            }
        } else {
            return PromiseReject(error);
        }
    }
};

// Compiles module text into a function.
// Can be overriden by the platform to make the engine aware of the source path. Uses sourceURL hack by default.
var defaultFactoryStart = "(function(require,exports,module,global,__filename,__dirname){";
Require.Compiler = function Compiler(config) {
    const globalEval = eval;

    var factoryStart, scopeNames;
    if(config.scope) {
        scopeNames = Object.keys(config.scope);

        if(scopeNames) {
            names = ["require", "exports", "module", "global", "__filename", "__dirname"];
            names.push.apply(names, scopeNames);
            factoryStart = `(function(${names.join(",")}){`;
        }
    }

    if(!factoryStart) {
        factoryStart = defaultFactoryStart;
    }
    // config.scope = config.scope || {};
    // var names = ["require", "exports", "module", "global", "__filename", "__dirname"];
    // var scopeNames = Object.keys(config.scope);
    // names.push.apply(names, scopeNames);
    return function node_Compiler(module) {

        // var location = module.location;
        // if (location && location.endsWith(".mjson") || module.factory) {
        //     return module;
        // }

        if (
            module.text !== void 0 &&
            module.type === "javascript"
        ) {
            const factory = globalEval(`${factoryStart}${module.text}\n//*/\n})\n//@ sourceURL=${module.location}`);

            if(scopeNames && scopeNames.length) {

                module.factory = function (require, exports, module, global, __filename, __dirname) {
                        arguments[4] = __filename;
                        arguments[5] = __dirname;

                        Array.prototype.push.apply(arguments, scopeNames.map(function (name) {
                            return config.scope[name];
                        }));
                        return factory.apply(this, arguments);
                    }
            } else {
                module.factory = factory;
            }
            // new Function will have its body reevaluated at every call, hence using eval instead
            // https://developer.mozilla.org/en/JavaScript/Reference/Functions_and_function_scope
            //module.factory = new Function("require", "exports", "module", module.text + "\n//*/\n//@ sourceURL="+module.path);
        }
    };
};

//Temporary: only doing this in node as this regex doesn't work in WebKit
Require.detect_ES6_export_regex = /(?<=^([^"]|"[^"]*")*)export /;
Require.Loader = function Loader(config, load) {
    const supportsES6 = Loader.supportsES6;

    return function (location, module) {
        return config.read(location, module)
        .then(function (text) {

            if(supportsES6 && /*faster*/(text.includes("export ")) && /*eliminate if in quotes*/(text.match(Require.detect_ES6_export_regex))) {

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
/*
    This is causing confusion if true in uuid/dist/v3.js in the behavior of _interopRequireDefault()
*/
Require.Loader.supportsES6 = false;

Require.NodeLoader = function NodeLoader(config) {
    return function nodeLoad(location, module) {
        var id;
        if(NodeBuilInModules.indexOf(module.id) !== -1) {
            id = module.id;
        } else {
            id = location.slice(config.location.length);
            id = id.substr(0,id.lastIndexOf('.'));
            module.location = location;
        }
        module.type = "native";
        module.exports = require(id);
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
        return PromiseReject(new Error("Can't find package"));
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
    path = PATH.resolve(CWD, path);
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
