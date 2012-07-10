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

var FS = require("q-fs");
var Hash = require("./hash").Hash;
var Promise = require("../montage/core/promise").Promise;
var jsdom = require("jsdom").jsdom;
var domToHtml = require("jsdom/lib/jsdom/browser/domtohtml").domToHtml;
var Node = require("jsdom").level(1).Node;
var Montage = require("../montage/montage");
var URL = require("../montage/core/url");
var minifyJavascript = require("./uglify").uglify;
var minifyHtml = require("html-minifier").minify;
var File = require("./file").File;

// called once per package
// @param config package configuration
// @param catalog package configuration catalog by location
// @param options universal options
exports.bundle = function (config, catalog, options) {
    if (!options.optimize)
        return;
    if (config.bundle === false || config.bundle === undefined)
        return;

    if (config.bundle === true) {
        config.bundle = [];
    }
    if (!Array.isArray(config.bundle)) {
        throw new Error(
            "package.json \"bundle\" must be true or an array of bundle " +
            "module identifiers"
        );
    }

    var contents = config.contents;

    // find the montage package
    var montages = Object.keys(catalog)
    .map(function (location) {
        return catalog[location];
    })
    .filter(function (config) {
        return config.name === 'montage';
    });
    if (montages.length === 0) {
        throw new Error("No version of Montage included in Application, " + config.location);
    } else if (montages.length > 1) {
        console.warn("    (warn) Multiple versions of Montage:");
        montages.forEach(function (montage) {
            console.log("        " + montage.location);
        });
    }
    config.montagePackage = montages.pop();

    return Promise.all(
        Object.keys(contents).map(function (name) {
            // bundle all html that boots montage
            var file = contents[name];
            var extension = FS.extension(name);
            if (extension === ".html") {
                return bundleHtml(file, config, catalog, options);
            }
        })
    );
};

function bundleHtml(file, config, catalog, options) {
    var document;
    var pending = [];
    try {
        document = jsdom(file.content.toString("utf-8"), null, {
            "features": {
                "FetchExternalResources": false,
                "ProcessExternalResources": false
            }
        });
    } catch (exception) {
        console.warn("    (warn) HTML parse error: " + file.shortName);
    }
    var result;
    if (document) {
        visitMontageScripts(document, function (script) {
            if (result) {
                console.warn("    (warn) Multiple montage.js scripts: " + file.shortName);
                return;
            }
            result = loadScript(script, file, config)
            .then(function () {
                collectBootstrapBundle(config, catalog, options);
                return Promise.call(function () {
                    return config.bundle.reduce(function (procede, bundle, index) {
                        return procede.then(function () {
                            return preloadBundle(bundle, '' + (index + 1), config, catalog, options);
                        });
                    }, Promise.resolve());
                })
                .then(function () {
                    return bundleScript(script, file, config, catalog, options);
                })
            })
            .then(function () {
                // rewrite the document
                file.utf8 = minifyHtml("<!doctype html>\n" + document.outerHTML, {
                    removeComments: true,
                    collapseBooleanLiterals: true,
                    //collapseWhitespace: true,
                    removeAttributeQuotes: true,
                    removeRedundantAttributes: true,
                    removeEmptyAttributes: true
                });
            })
        });
    }
    return result || Promise.resolve();
}

function visit(element, visitor) {
    visitor(element);
    element = element.firstChild;
    while (element) {
        visit(element, visitor);
        element = element.nextSibling;
    }
}

function visitMontageScripts(element, visitor) {
    visit(element, function (node) {
        if (node.nodeType == Node.ELEMENT_NODE) {
            if (node.tagName === "SCRIPT") {
                if (node.hasAttribute("src")) {
                    var src = node.getAttribute("src");
                    if (src.match(/^(.*)montage.js(?:[\?\.]|$)/i)) {
                        visitor(node);
                    }
                }
            }
        }
    });
}

function loadScript(script, file, config) {
    var packageLocation = URL.resolve(URL.resolve("file:", file.name), "./");
    if (script.hasAttribute("data-package")) {
        packageLocation = URL.resolve(packageLocation, script.getAttribute("data-package"));
    }
    return Montage.loadPackage(config.montagePackage.location)
    .then(function (montageRequire) {
        return Promise.all([
            "core/event/event-manager",
            "core/deserializer",
            "core/event/binding",
        ].map(montageRequire.deepLoad))
        .then(function () {
            return montageRequire.loadPackage(packageLocation)
        })
        .then(function (applicationRequire) {
            config.require = applicationRequire;
            if (script.hasAttribute("data-module")) {
                return applicationRequire.deepLoad(script.getAttribute("data-module"));
            } else {
                return applicationRequire.deepLoad(file.shortName);
            }
        })
    });
}

function bundleScript(script, file, config, catalog, options) {

    var montagePackage = config.montagePackage;

    var bundle = config.bootstrapBundle;
    var preload = (config.bundleBatches || [])
    .map(function (bundleBatch) {
        return bundleBatch.map(function (bundleFile) {
            return FS.relativeFromFile(file.name, bundleFile.name);
        });
    });
    // sentinel to notify montage.js that it need not xhr its bootstrap
    bundle.unshift("BUNDLE=" + JSON.stringify(preload) + ";");
    var bundleFile = createBundle(bundle, catalog[file.package], 'bundle-0-');
    console.log("Bundle:", bundleFile.shortName, bundleFile.content.length);

    var toBundle = FS.relativeFromFile(file.name, bundleFile.name);
    var toMontage = FS.relativeFromFile(
        FS.join(catalog[file.package].buildLocation, file.shortName),
        montagePackage.buildLocation
    ) + "/";

    // XXX should be relative path from the HTML file to the bundle at the root of the package
    script.setAttribute("src", toBundle);
    // XXX should be relative path to the build products from the application
    script.setAttribute("data-montage", toMontage);
    script.setAttribute("data-montage-hash", montagePackage.hash.slice(0, 7));
    script.setAttribute("data-application-hash", catalog[file.package].hash.slice(0, 7));

}

function preloadBundle(modules, label, config, catalog, options) {
    if (typeof modules === "string")
        modules = [modules];
    return Promise.all(modules.map(config.require.deepLoad))
    .then(function () {
        var bundle = collectBundle(config, [], catalog, options); // XXX

        var shards = shardBundle(bundle, config.shard || 1);

        var bundleBatch = shards.map(function (shard, index) {
            var shardFile = createBundle(shard, config, 'bundle-' + label + '-' + index + '-');
            // add a wee sentinel to the end to indicate that
            // the bundle has finished loading
            shardFile.utf8 += '\nbundleLoaded(' + JSON.stringify(shardFile.shortName) + ')';
            console.log("Bundle:", shardFile.shortName, shardFile.content.length);
            return shardFile;
        });

        config.bundleBatches = config.bundleBatches || [];
        config.bundleBatches.push(bundleBatch);
    });
}

function shardBundle(bundle, shardCount) {
    var shards = [];
    for (var i = 0; i < shardCount; i++) {
        shards.push({length: 0, parts: []});
    }
    bundle.sort(byDescendingLength);
    for (var i = 0; i < bundle.length; i++) {
        var part = bundle[i];
        shards[0].parts.push(part);
        shards[0].length += part.length;
        shards.sort(byLength);
    }
    return shards.filter(function (shard) {
        return shard.length;
    }).map(function (shard) {
        return shard.parts;
    });
}

var byLength = function (a, b) {
    return a.length - b.length;
}

var byDescendingLength = function (a, b) {
    return -(a.length - b.length);
}

function forEachModule(config, callback) {
    Object.keys(config.require.packages).forEach(function (location) {
        var inPackage = config.require.packages[location];
        var modules = inPackage.modules;
        Object.keys(modules).forEach(function (id) {
            var module = modules[id];
            callback(module);
        });
    });
}

function collectBootstrapBundle(config, catalog, options) {

    var montagePackage = config.montagePackage;

    var bundle = [
    // montage.js
        'montage.js',
    // bootstrapping modules
        'require/require.js',
        'require/browser.js',
        'core/promise.js',
        'core/next-tick.js'
    ].map(function (name) {
        return montagePackage.contents[name].utf8;
    });

    var montageRequire = config.require.getPackage({name: "montage"});

    // do not bundle these modules; they are covered by the bootstrapping
    montageRequire.getModuleDescriptor("core/next-tick").bundled = true;
    montageRequire.getModuleDescriptor("core/promise").bundled = true;
    montageRequire.getModuleDescriptor("core/mini-url").bundled = true;

    // defined modules
    config.bootstrapBundle = collectBundle(config, bundle, catalog, options);
}

function collectBundle(config, bundle, catalog, options) {
    bundle = bundle || [];
    Object.keys(config.require.packages).forEach(function (location) {
        var package = config.require.packages[location];
        if (package.bundled) return;
        package.bundled = true;
        var location = package.location.slice(5).replace(/\/$/, ""); // file:
        var packageConfig = catalog[location];
        bundle.push(packageConfig.contents['package.json.load.js'].utf8);
    });
    forEachModule(config, function (module) { // XXX
        if (module.bundled) return;
        module.bundled = true;
        if (module.location !== void 0 && module.type === "javascript") {
            var location = module.location.slice(5); // file:
            var relocation;
            if (/\.js$/.test(location)) {
                relocation = location.replace(/\.js/, ".load.js");
            } else if (/\.json$/.test(location)) {
                relocation = location + ".load.js";
            } else if (/\.html$/.test(location)) {
                relocation = location + ".load.js";
            }
            if (relocation in options.contents) {
                var module = options.contents[relocation];
                bundle.push(module.utf8);
            }
        }
    });
    return bundle;
}

function createBundle(bundle, config, prefix) {
    prefix = prefix || 'bundle-';

    bundle = minifyJavascript(bundle.join("\n;\n//*/\n"));
    var hash = Hash("sha256");
    hash.update(bundle);
    var digest = hash.digest();

    // add to the build products
    var name = prefix + digest.slice(0, 7) + '.js';

    return config.contents[name] = new File({
        name: FS.join(config.location, name),
        shortName: name,
        utf8: bundle,
        package: config.package
    })
}

