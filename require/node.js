/* <copyright>
Copyright (c) 2012, Motorola Mobility, Inc
All Rights Reserved.
BSD License.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

  - Redistributions of source code must retain the above copyright notice,
    this list of conditions and the following disclaimer.
  - Redistributions in binary form must reproduce the above copyright
    notice, this list of conditions and the following disclaimer in the
    documentation and/or other materials provided with the distribution.
  - Neither the name of Motorola Mobility nor the names of its contributors
    may be used to endorse or promote products derived from this software
    without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE
LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
POSSIBILITY OF SUCH DAMAGE.
</copyright> */

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

Require.read = function (location) {
    var deferred = Promise.defer();
    var path = urlToPath(location);
    FS.readFile(path, "utf-8", function (error, text) {
        if (error) {
            deferred.reject(new Error(error));
        } else {
            deferred.resolve(text);
        }
    });
    return deferred.promise;
};

Require.isFile = function (location) {
    var deferred = Promise.defer();
    var path = urlToPath(location);
    FS.stat(path, function (error, stat) {
        if (error) {
            deferred.resolve(false);
        } else {
            deferred.resolve(stat.isFile());
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

Require.Loader = function (config, load) {
    return function (url, module) {
        return Require.read(url)
        .then(function (text) {
            module.type = "javascript";
            module.text = text;
            module.location = url;
        }, function (reason, error, rejection) {
            return load(url, module);
        });
    };
};

Require.NodeLoader = function (config) {
    return function (url, module) {
        var id = url.slice(config.location.length);
        return {
            type: "native",
            exports: require(id),
            location: url
        }
    };
};

Require.makeLoader = function(config) {
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

Require.main = function () {
    var require = Require.Sandbox();
    require.async(process.argv[2]).end();
};

Require.overlays = ["node", "server", "montage"];

if (require.main === module) {
    Require.main();
}

