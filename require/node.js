
var Require = require("./require");
var URL = require("../core/url");
var Promise = require("../core/promise").Promise;
var FS = require("fs");

var globalEval = eval;

Require.getLocation = function () {
    return URL.resolve("file:///", process.cwd() + "/");
};

var urlToPath = function (url) {
    var parsed = URL.parse(url);
    return parsed.path;
};

Require.read = function (url) {
    var deferred = Promise.defer();
    var path = urlToPath(url);
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
Require.Compiler = function (config) {
    config.scope = config.scope || {};
    var names = ["require", "exports", "module"];
    var scopeNames = Object.keys(config.scope);
    names.push.apply(names, scopeNames);
    return function(module) {
        if (module.factory)
            return module;
        if (!module.factory && module.text !== void 0) {
            var factory = globalEval(
                "(function(" + names.join(",") + "){" +
                module.text +
                "\n//*/\n})\n//@ sourceURL=" + module.path
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
        return module;
    };
};

Require.DefaultLoaderConstructor = function(config) {
    return Require.MappingsLoader(
        config,
        Require.ExtensionsLoader(
            config,
            Require.PathsLoader(
                config,
                Require.CachingLoader(
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

Require.NodeLoader = function (config) {
    return function (url, module) {
        var id = url.slice(config.location.length);
        return {
            type: "native",
            exports: require(id),
            path: url
        }
    };
}

Require.main = function () {
    var require = Require.Sandbox();
    require.async(process.argv[2]).end();
};

Require.overlays = ["node", "server", "montage"];

if (require.main === module) {
    Require.main();
}

