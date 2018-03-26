/*jshint node:true, browser:false */
var FS = require("q-io/fs");
var MontageBoot = require("./montage");
var Require = require("mr");

var URL = require("url");
var htmlparser = require("htmlparser2");
var DomUtils = htmlparser.DomUtils;

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
    return loadPackage(directory)
    .then(function (require) {
        var id = program.slice(directory.length + 1);
        return require.async(id);
    });
}

// Exit code
var exitCode = 0;

exports.bootstrap = function () {
    var command = process.argv.slice(0, 3);
    var args = process.argv.slice(2);
    var program = args.shift();
    return FS.canonical(program).then(function (program) {
        return findPackage(program)
        .catch(function (error) {
            if (error.message === "Can't find package") {
                return loadFreeModule(program, command, args);
            } else {
                throw new Error(error);
            }
        }).then(function (directory) {
            return loadPackagedModule(directory, program, command, args);
        });
    }).catch(function (err) {
        console.error('Error', err, err.stack);
        exitCode = 1;
        process.exit(exitCode);
    });
};


MontageBoot.loadPackage = loadPackage;
function loadPackage(location, config) {

    if (location.slice(location.length - 1, location.length) !== "/") {
        location += "/";
    }

    config = config || {};
    config.overlays = ["node", "server", "montage"];
    config.location = URL.resolve(Require.getLocation(), location);

    return Require.loadPackage(config.location, config);
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

MontageBoot.TemplateLoader = function (config, load) {
    return function (id, module) {
        var html = id.match(/(.*\/)?(?=[^\/]+\.html$)/);
        var serialization = id.match(/(?=[^\/]+\.(?:json|mjson|meta)$)/); // XXX this is not necessarily a strong indicator of a serialization alone
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
                    // montage/ui/loader.reel/loader.html": Error: ENOENT: no such file or directory
                    console.log(error.message);
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

