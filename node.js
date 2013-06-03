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

/*jshint node:true, browser:false */

var FS = require("q-io/fs");

var MontageBoot = require("./montage");

var Require = require("mr/require");
require("mr/node");
var Promise = require("q");
var URL = require("url");

var htmlparser = require("htmlparser2");
var DomUtils = htmlparser.DomUtils;

Require.overlays = ["node", "server", "montage"];

exports.bootstrap = function () {
    var command = process.argv.slice(0, 3);
    var args = process.argv.slice(2);
    var program = args.shift();
    return FS.canonical(program).then(function (program) {
        return findPackage(program)
        .fail(function (error) {
            if (error.message === "Can't find package") {
                loadFreeModule(program, command, args);
            } else {
                throw new Error(error);
            }
        })
        .then(function (directory) {
            return loadPackagedModule(directory, program, command, args);
        });
    });
};

var findPackage = function (path) {
    var directory = FS.directory(path);
    if (directory === path) {
        throw new Error("Can't find package");
    }
    var packageJson = FS.join(directory, "package.json");
    return FS.stat(path)
    .then(function (stat) {
        if (stat.isFile()) {
            return directory;
        } else {
            return findPackage(directory);
        }
    });
};

var loadFreeModule = function (program, command, args) {
    throw new Error("Can't load module that is not in a package");
};

var loadPackagedModule = function (directory, program, command, args) {
    return MontageBoot.loadPackage(directory)
    .then(function (require) {
        var id = program.slice(directory.length + 1);
        return require.async(id);
    })
    .done();
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
        var reelModule = id.match(/(.*\/)?([^\/]+)\.reel\/\2$/);
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
                return FS.stat(URL.parse(reelHtml).pathname)
                .then(function (stat) {
                    if (stat.isFile()) {
                        module.extraDependencies = [id + ".html"];
                    }
                }, function (error) {
                    // not a problem
                });
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

    var dom = parseHtml(text);
    collectHtmlDependencies(dom, dependencies);

    return dependencies;
};

var collectHtmlDependencies = function (dom, dependencies) {
    visit(dom, function (element) {
        if (DomUtils.isTag(element)) {
            if (element.name === "script") {
                if (getAttribute(element, "type") === "text/montage-serialization") {
                    collectSerializationDependencies(getText(element), dependencies);
                }
            } else if (element.name === "link") {
                if (getAttribute(element, "type") === "text/montage-serialization") {
                    dependencies.push(getAttribute(element, "href"));
                }
            }
        }
    });
};

function parseHtml(html) {
    var dom, error;

    var handler = new htmlparser.DomHandler(function (_error, _dom) {
        error = _error;
        dom = _dom;
    });

    // although these functions use callbacks they are actually synchronous
    var parser = new htmlparser.Parser(handler);
    parser.write(html);
    parser.done();

    if (error) {
        throw error;
    } else if (!dom) {
        throw new Error("HTML parsing did not complete");
    }

    // wrap the returned array in a pseudo-document object for consistency
    return {type: "document", children: dom};
}

function visit(element, visitor) {
    var pruned;
    var prune = function () {
        pruned = true;
    };
    visitor(element, prune);
    if (pruned) {
        return;
    }

    var children = element.children;
    var len = children ? children.length : 0;
    for (var i = 0; i < len; i++) {
        visit(children[i], visitor);
    }
}

function getAttribute(element, name) {
    return element.attribs ? element.attribs[name] : null;
}

function getText(element) {
    return DomUtils.getText(element);
}

var collectSerializationDependencies = function (text, dependencies) {
    var serialization = JSON.parse(text);
    Object.keys(serialization).forEach(function (label) {
        var description = serialization[label];
        if (description.lazy) {
            return;
        }
        if (typeof description.prototype === "string") {
            dependencies.push(parsePrototypeForModule(description.prototype));
        }
        if (typeof description.object === "string") {
            dependencies.push(parsePrototypeForModule(description.object));
        }
    });
    return dependencies;
};

function parsePrototypeForModule(prototype) {
    return prototype.replace(/\[[^\]]+\]$/, "");
}

