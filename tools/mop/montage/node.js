/* <copyright>
Copyright (c) 2012, Motorola Mobility LLC.
All Rights Reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

* Redistributions of source code must retain the above copyright notice,
  this list of conditions and the following disclaimer.

* Redistributions in binary form must reproduce the above copyright notice,
  this list of conditions and the following disclaimer in the documentation
  and/or other materials provided with the distribution.

* Neither the name of Motorola Mobility LLC nor the names of its
  contributors may be used to endorse or promote products derived from this
  software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE
LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
POSSIBILITY OF SUCH DAMAGE.
</copyright> */

var FS = require("fs");
var PATH = require("path");

var MontageBoot = require("./montage");

var Require = require("./require/require");
var Promise = require("./core/promise");
var URL = require("./core/url");

var jsdom = require("jsdom").jsdom;
var Node = require("jsdom").level(1).Node;
var domToHtml = require("jsdom/lib/jsdom/browser/domtohtml").domToHtml;

exports.bootstrap = function (callback) {
    var command = process.argv.slice(0, 3);
    var args = process.argv.slice(2);
    var program = args.shift();
    FS.realpath(program, function (error, program) {
        if (error) {
            throw new Error(error);
        }
        findPackage(program, function (error, directory) {
            if (error === "Can't find package") {
                loadFreeModule(program, command, args);
            } else if (error) {
                throw new Error(error);
            } else {
                loadPackagedModule(directory, program, command, args);
            }
        });
    });
};

var findPackage = function (path, callback) {
    var directory = PATH.dirname(path);
    if (directory === path)
        return callback("Can't find package");
    var packageJson = PATH.join(directory, "package.json");
    FS.stat(path, function (error, stat) {
        if (error) callback(error);
        if (stat.isFile()) {
            callback(null, directory);
        } else {
            findPackage(directory, callback);
        }
    });
}

var loadFreeModule = function (program, command, args) {
    throw new Error("Can't load module that is not in a package");
};

var loadPackagedModule = function (directory, program, command, args) {
    MontageBoot.loadPackage(directory)
    .then(function (require) {
        var id = program.slice(directory.length + 1);
        return require.async(id);
    })
    .end();
};

MontageBoot.loadPackage = function (location, config) {

    if (location.slice(location.length - 1, location.length) !== "/") {
        location += "/";
    }

    config = config || {};

    config.location = URL.resolve(Require.getLocation(), location);

    // setup the reel loader
    config.makeLoader = function (config) {
        return MontageBoot.ReelLoader(
            config,
            Require.makeLoader(config)
        );
    };

    // setup serialization compiler
    config.makeCompiler = function (config) {
        return MontageBoot.TemplateCompiler(
            config,
            MontageBoot.SerializationCompiler(
                config,
                Require.makeCompiler(config)
            )
        );
    };

    return Require.loadPackage(config.location, config);
};

MontageBoot.TemplateLoader = function (config, load) {
    return function(id, module) {
        var html = id.match(/(.*\/)?(?=[^\/]+\.html$)/);
        var serialization = id.match(/(?=[^\/]+\.json$)/); // XXX this is not necessarily a strong indicator of a serialization alone
        var reelModule = id.match(/(.*\/)?([^\/]+)\.reel\/\2/);
        if (html) {
            return load(id, module)
            .then(function () {
                module.dependencies = parseHtmlDependencies(module.text, module.location);
                return module;
            });
        } else if (serialization) {
            return load(id, module)
            .then(function () {
                module.dependencies = collectSerializationDependencies(module.text, []);
                return module;
            });
        } else if (reelModule) {
            return load(id, module)
            .then(function () {
                var reelHtml = URL.resolve(module.location, reelModule[2] + ".html");
                return Require.isFile(reelHtml)
                .then(function (isFile) {
                    if (isFile) {
                        module.extraDependencies = [id + ".html"];
                    }
                })
            });
        } else {
            return load(id, module);
        }
    };
};

// add the TemplateLoader to the middleware chain
Require.makeLoader = (function (makeLoader) {
    return function (config) {
        return MontageBoot.TemplateLoader(config, makeLoader(config));
    };
})(Require.makeLoader);

var parseHtmlDependencies = function (text, location) {
    var dependencies = [];
    var document = jsdom(text, null, {
        "features": {
            "FetchExternalResources": false,
            "ProcessExternalResources": false
        }
    });
    collectHtmlDependencies(document, dependencies);
    return dependencies;
};

var collectHtmlDependencies = function (document, dependencies) {
    visit(document, function (element) {
        if (element.nodeType == Node.ELEMENT_NODE) {
            if (element.tagName === "SCRIPT") {
                if (element.getAttribute("type") === "text/montage-serialization") {
                    collectSerializationDependencies(getText(element), dependencies);
                }
            } else if (element.tagName === "LINK") {
                if (element.getAttribute("type") === "text/montage-serialization") {
                    dependencies.push(element.getAttribute("href"));
                }
            }
        }
    });
};

function visit(element, visitor) {
    var pruned;
    var prune = function () {
        pruned = true;
    };
    visitor(element, prune);
    if (pruned) {
        return;
    }
    element = element.firstChild;
    while (element) {
        visit(element, visitor);
        element = element.nextSibling;
    }
}

function getText(element) {
    return domToHtml(element._childNodes, true, true);
}

var collectSerializationDependencies = function (text, dependencies) {
    var serialization = JSON.parse(text);
    Object.keys(serialization).forEach(function (label) {
        var description = serialization[label];
        if (description.lazy) {
            return;
        }
        if (typeof description.module === "string") { // XXX deprecated
            dependencies.push(description.module);
        }
        if (typeof description.prototype === "string") {
            dependencies.push(parsePrototypeForModule(description.prototype));
        }
    });
    return dependencies;
};

function parsePrototypeForModule(prototype) {
    return prototype.replace(/\[[^\]]+\]$/, "");
}

