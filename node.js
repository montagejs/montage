/*jshint node:true, browser:false */

var FS = require("q-io/fs");

var Require = require("mr/node");
var Promise = require("q");
var URL = require("url");
var Config = require("./boot/config");

var htmlparser = require("htmlparser2");
var DomUtils = htmlparser.DomUtils;

module.exports = Require;

Require.overlays = ["node", "montage"];

Require.makeCompiler = Config.makeCompiler;

var makeLoader = Config.makeLoader;
Require.makeLoader = function (config) {
    return Require.TemplateLoader(
        config,
        makeLoader(config)
    );
};

/**
 * For loading in Node, we use a TemplateLoader to find serialization
 * dependencies.  We do not use this in the Browser version because we want
 * these to be loaded lazily.  The Node loader is used for bundling.
 */
Require.TemplateLoader = function (config, load) {
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

function parseHtmlDependencies(text, location) {
    var dependencies = [];
    var dom = parseHtml(text);
    collectHtmlDependencies(dom, dependencies);
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

function parsePrototypeForModule(prototype) {
    return prototype.replace(/\[[^\]]+\]$/, "");
}

