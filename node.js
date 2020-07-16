/*jshint node:true, browser:false */
var Require = require("./core/mr/require");
var FS = require("./core/promise-io/fs");
var MontageBoot = require("./montage");

var URL = require("url");
var htmlparser = require("htmlparser2");
var DomUtils = htmlparser.DomUtils;
var PATH = require("path");

function findPackage(path) {
    var directory = FS.directory(path);
    if (directory === path) {
        throw new Error("Can't find package");
    }
    var packageJson = FS.join(directory, "package.json");
    return FS.stat(packageJson).then(function (stat) {
        if (stat.isFile()) {
            return directory;
        } else {
            return findPackage(directory);
        }
    });
}

function loadFreeModule(/*program, command, args*/) {
    throw new Error("Can't load module that is not in a package");
}

function loadPackagedModule(directory, program/*, command, args*/) {
    return MontageBoot.loadPackage(directory)
    .then(function (require) {
        var id = program.slice(directory.length + 1);
        return require.async(id);
    });
}

exports.bootstrap = function () {
    var command = process.argv.slice(0, 3);
    var args = process.argv.slice(2);
    var program = args.shift();
    return FS.canonical(program).then(function (program) {
        return findPackage(program)
        .catch(function (error) {
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

MontageBoot.loadPackage = function (location, config) {

    if (location.slice(location.length - 1, location.length) !== "/") {
        location += "/";
    }

    config = config || {};
    config.overlays = ["node", "server", "montage"];
    config.location = URL.resolve(Require.getLocation(), location);

    //The equivalent is done in montage.js for the browser:
    //install the linter, which loads on the first error
    function lint(module) {
        if(!lint.JSHINT) {
            lint.JSHINT = require("jshint");
        }
        if (!lint.JSHINT.JSHINT(module.text)) {
            console.warn("JSHint Error: "+module.location);
            lint.JSHINT.JSHINT.errors.forEach(function (error) {
                if (error) {
                    console.warn("Problem at line "+error.line+" character "+error.character+": "+error.reason);
                    if (error.evidence) {
                        console.warn("    " + error.evidence);
                    }
                }
            });
        }
    };
    config.lint = lint;


    return Require.loadPackage(config.location, config);
};

function getMontageMontageDeserializer() {
    if (getMontageMontageDeserializer._promise) {
        return getMontageMontageDeserializer._promise;
    }

    return (getMontageMontageDeserializer._promise = MontageBoot.loadPackage(PATH.join(__dirname, "."))
        .then(function (mr) {
            return mr.async("./core/serialization/deserializer/montage-deserializer")
            .then(function (MontageDeserializerModule) {
                return (MontageBoot.MontageDeserializer =
                    MontageDeserializerModule.MontageDeserializer
                );
            });
    }));
}

Require.delegate = MontageBoot;

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

function parsePrototypeForModule(prototype) {
    return prototype.replace(/\[[^\]]+\]$/, "");
}

function collectSerializationDependencies(text, dependencies) {
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
}

function collectHtmlDependencies(dom, dependencies) {
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
}

function parseHtmlDependencies(text/*, location*/) {
    var dependencies = [];
    var dom = parseHtml(text);
    collectHtmlDependencies(dom, dependencies);
    return dependencies;
}

var html_regex = /(.*\/)?(?=[^\/]+\.html$)/,
    json_regex = /(?=[^\/]+\.json$)/,
    mjson_regex = /(?=[^\/]+\.(?:mjson|meta)$)/,
    reel_regex = /(.*\/)?([^\/]+)\.reel\/\2$/;
MontageBoot.TemplateLoader = function (config, load) {
    return function (moduleId, module) {

        //Adding support for modules like:
        //"prototype": "spec/serialization/bindings-spec[Type]",

        var bracketIndex = moduleId.indexOf("["),
            id;

        if (bracketIndex > 0) {
            id = moduleId.substr(0, bracketIndex);
        }
        else {
            id = moduleId;
        }

        var html = id.match(html_regex);
        var serialization = id.match(json_regex); // XXX this is not necessarily a strong indicator of a serialization alone
        var meta = id.match(mjson_regex);
        var reelModule = id.match(reel_regex);
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
        } else if (meta) {
            return load(id, module);
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
                    // montage/ui/loader.reel/loader.html": Error: ENOENT: no such file or directory
                    console.log(error.message);
                });
            });
        } else {
            return load(id, module);
        }
    };
};


Object.defineProperties(global,
    {
        _performance: {
            value: undefined
        },
        performance: {
            get: function() {
                return this._performance || (this._performance = require('perf_hooks').performance);
            }
        }
    }
);

// add the TemplateLoader to the middleware chain
Require.makeLoader = (function (makeLoader) {
    return function (config) {
        return MontageBoot.TemplateLoader(config, makeLoader(config));
    };
})(Require.makeLoader);

