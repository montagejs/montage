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

var Q = require("q");
var FS = require("q-fs");
var CSSOM = require("cssom");
var URL = require("url");
var jsdom = require("jsdom").jsdom;
var jshint = require("./jshint").JSHINT;
var minifyJavascript = require("./uglify").uglify;
var minifyHtml = require("html-minifier").minify;
var domToHtml = require("jsdom/lib/jsdom/browser/domtohtml").domToHtml;
var Node = require("jsdom").level(1).Node;
var MontageRequire = require("../montage/require/require");
var File = require("./file").File;

exports.transform = function (config, catalog, options) {
    // analyze reference counts for inlinable resources like images and css
    // compile and analyze individual files
    var contents = config.contents;
    return Q.all(Object.keys(contents).map(function (name) {
        var file = contents[name];
        var extension = FS.extension(name).slice(1);
        if (name === "package.json") {
            return transformPackageDescription(
                file,
                options,
                config
            );
        } else if (transforms[extension]) {
            return transforms[extension](
                file,
                function (url) {
                    return rebase(url, file, catalog, options);
                },
                options,
                config
            );
        }
    }));
};

var transformPackageDescription = function (file, options, config) {
    var json = JSON.parse(file.utf8)
    var moduleContent;
    if (json.if) {
        moduleContent = (
            "{factory: function (require, exports, module) {\n" +
            "var config = require.config, merge = require.merge;\n" +
            MontageRequire.compilePackageDescriptionFunction(json, file.name) +
            "module.exports = description;\n" +
            "}}\n"
        )
    } else {
        moduleContent = "{exports: " + file.utf8 + "}";
    }
    var definedContent = (
        "define(" +
            JSON.stringify(config.hash.slice(0, 7)) + "," +
            JSON.stringify(file.shortName) + "," +
            moduleContent +
        ")"
    );
    var definedName = file.shortName + '.load.js';
    var definedFile = new File({
        name: FS.join(config.location, definedName),
        shortName: definedName,
        utf8: definedContent,
        package: config.location
    });
    config.contents[definedFile.shortName] = definedFile;
    options.contents[definedFile.name] = definedFile;

    if (options.optimize) {
        try {
            definedFile.utf8 = minifyJavascript(definedFile.utf8, file.shortName);
        } catch (exception) {
            if (exception instanceof SyntaxError) {
                console.warn("    (warn) package.json minification error: " + file.shortName);
            } else {
                throw exception;
            }
        }
    }
};

var transforms = {

    html: function (file, rebase, options, config) {
        checkCopyright(file, options);
        return rebaseHtml(file.utf8, rebase, file.shortName, config, options)
        .then(function (html) {

            // file
            file.utf8 = html;

            // defineFile

            var root = file.shortName.match(/(.*\/)?(?=[^\/]+\.html$)/);
            var definedName = file.shortName + ".load.js";
            var definedContent = minifyJavascript(
                'define(' +
                    JSON.stringify(config.hash.slice(0, 7)) + ',' +
                    JSON.stringify(file.shortName) + ',' +
                    JSON.stringify({
                        text: html
                    }) +
                ')',
                file.shortName
            );
            var definedFile = new File({
                name: FS.join(config.location, definedName),
                shortName: definedName,
                utf8: definedContent,
                package: config.location
            });
            config.contents[definedFile.shortName] = definedFile;
            options.contents[definedFile.name] = definedFile;

        })
    },

    css: function (file, rebase, options) {
        checkCopyright(file, options);
        if (options.optimize) {
            return Q.call(rebaseCss, null, file.utf8, rebase, file.shortName)
            .then(function (css) {
                file.utf8 = css;
            }, function (exception) {
                console.warn("    (warn) CSS parse error: " + file.shortName);
                console.warn(exception.stack);
            })
        }
    },

    js: function (file, rebase, options, config) {

        checkCopyright(file, options);

        if (options.lint && !jshint(file.utf8))
            console.warn("    (warn) JSHints for: " + file.shortName);

        var id = file.shortName.replace(/\.js$/, "");
        var definedName = file.shortName.replace(/\.js$/, ".load.js");
        var dependencies = MontageRequire.parseDependencies(file.utf8);

        if (id.toLowerCase() !== id) {
            console.warn("    (warn) Module file name " + JSON.stringify(file.shortName) + " should be lower-case");
        }

        dependencies.forEach(function (dependency) {
            if (dependency.toLowerCase() !== dependency) {
                console.warn("    (warn) Module identifier " + JSON.stringify(dependency) + " should be lower-case in " + file.shortName);
            }
        });

        var definedContent = (
            "define(" +
                JSON.stringify(config.hash.slice(0, 7)) + "," +
                JSON.stringify(id) + "," +
                "{" +
                    "dependencies:" + JSON.stringify(dependencies) + "," +
                    "factory:function(require,exports,module){" +
                        file.utf8 +
                    "\n}" +
                "}" +
            ")"
        );
        var definedFile = new File({
            name: FS.join(config.location, definedName),
            shortName: definedName,
            utf8: definedContent,
            package: config.location
        });
        config.contents[definedFile.shortName] = definedFile;
        options.contents[definedFile.name] = definedFile;

        if (options.optimize) {
            try {
                file.utf8 = minifyJavascript(file.utf8.replace(/^#!/, "//#!"), file.shortName);
            } catch (exception) {
                console.warn("    (warn) JavaScript parse error: " + file.shortName);
            }
            try {
                definedFile.utf8 = minifyJavascript(definedContent.replace(/^#!/, "//#!"), definedFile.shortName);
            } catch (exception) {
                console.warn("    (warn) JavaScript parse error: " + definedFile.shortName);
            }
        }
    },

    json: function (file, rebase, options, config) {
        var content = file.utf8;

        var definedContent = (
            'define(' +
                JSON.stringify(config.hash.slice(0, 7)) + "," +
                JSON.stringify(file.shortName) + "," +
                "{exports: " + content + "}" +
            ')'
        );
        var definedName = file.shortName + '.load.js';
        var definedFile = new File({
            name: FS.join(config.location, definedName),
            shortName: definedName,
            utf8: definedContent,
            package: config.location
        });
        config.contents[definedFile.shortName] = definedFile;
        options.contents[definedFile.name] = definedFile;

        if (options.optimize) {
            try {
                file.utf8 = JSON.stringify(JSON.parse(content));
                definedFile.utf8 = minifyJavascript(definedFile.utf8, file.shortName);
            } catch (exception) {
                if (exception instanceof SyntaxError) {
                    console.warn("    (warn) JSON parse error: " + file.shortName);
                } else {
                    throw exception;
                }
            }
        }
    }

}

function rebase(url, file, catalog, options) {
    if (url === "#")
        return Q.resolve("#");
    if (url === "")
        return Q.resolve("");
    var parsed = URL.parse(url);
    // ignore fully qualified URL's
    if (parsed.protocol !== undefined && parsed.protocol !== "file:")
        return Q.resolve(url);
    // resolve the file name to a canonical identifier
    var relativeName = unescape(parsed.pathname);
    var name = FS.resolve(file.name, relativeName);
    return FS.canonical(name)
    .then(function (name) {
        // TODO symbolic linkage
        // grab the list of canonical file names to file data
        var contents = options.contents;
        if (!contents[name]) {
            console.warn(
                "    (warn) URL rebase error: " + file.shortName +
                " contains a reference to nonexistent " +
                JSON.stringify(relativeName)
            );
            return url;
        }
        // get the file metadata for the target
        var target = contents[name];
        var targetPackage = catalog[target.package];
        var filePackage = catalog[file.package];
        // compute its new absolute location
        var buildName = FS.join(targetPackage.buildLocation, target.shortName);
        // compute its new relative location
        var source = FS.join(filePackage.buildLocation, file.shortName);
        var relative = FS.relativeFromFile(source, buildName);
        return relative + (parsed.search || "");
    });
}

function visit(element, visitor) {
    visitor(element);
    element = element.firstChild;
    while (element) {
        visit(element, visitor);
        element = element.nextSibling;
    }
}

function rebaseAttribute(el, attribute, rebase) {
    if (el.hasAttribute(attribute)) {
        var value = el.getAttribute(attribute);
        return rebase(value).then(function (value) {
            el.setAttribute(attribute, value);
        })
    }
}

function rebaseCss(css, rebase, fileName) {
    var cssom = CSSOM.parse(css);
    return Q.all(cssom.cssRules.map(function (rule) {
        var style = rule.style;
        if (!style)
            return;
        var todo = [];
        var rebased = {};
        // lookup
        for (var i = 0, ii = style.length; i < ii; i++) {
            var key = style[i];
            var value = style[key];
            // potential but unlikely pattern matching hazard here
            value.replace(/url\(['"]?([^\)'"]+)['"]?\)/g, function (_, url) {
                todo.push(
                    rebase(url)
                    .then(function (newUrl) {
                        rebased[url] = newUrl;
                    }, function (error) {
                        rebased[url] = url;
                        if (/^Can't get canonical path /.test(error.message)) {
                            console.warn("    (warn) Can't find " + JSON.stringify(url) + " from " + JSON.stringify(fileName));
                        } else {
                            console.warn("    (warn) Can't rewrite URL " + JSON.stringify(url) + " in " + fileName + " because " + error);
                        }
                    })
                );
            });
        }
        return Q.all(todo).then(function () {
            for (var i = 0, ii = style.length; i < ii; i++) {
                var key = style[i];
                var value = style[key];
                style[key] = value.replace(/url\(['"]?([^\)'"]+)['"]?\)/g, function (_, url) {
                    return "url(" + rebased[url] + ")";
                });
            }
        });
    }))
    .then(function () {
        return "" + cssom;
    });
}

function readManifest(manifest, config, fileName) {
    var section = "CACHE";
    config.fallback = config.fallback || {};
    config.network = config.network || {};
    manifest.split(/\n/).forEach(function (line, lineNo) {
        line = line.replace(/#.*$/, ""); // remove comments
        line = line.replace(/\s*$/, ""); // remove following white space
        if (!line)
            return;
        var sectionMatch = /^(\w+):$/.exec(line);
        if (sectionMatch) {
            section = sectionMatch[1];
            return;
        }
        if (section === "FALLBACK") {
            var parts = line.split(/\s+/g);
            if (parts.length != 2) {
                console.warn("    (warn) manifest syntax error on line " + lineNo);
            }
            // TODO rebase these urls
            var from = parts[0];
            var to = parts[1];
            config.fallback[from] = to;
        } else if (section === "NETWORK") {
            // TODO note that these lines are ignored in favor of the * default,
            // or fix
            config.network[line] = true;
        }
    });
}

// TODO factor into smaller functions
function rebaseDocument(doc, rebase, fileName, config, options) {
    var pending = [];
    visit(doc, function (el) {
        if (el.nodeType == Node.ELEMENT_NODE) {
            pending.push(rebaseAttribute(el, "href", rebase));
            pending.push(rebaseAttribute(el, "src", rebase));
            if (el.tagName === "HTML") {
                if (el.hasAttribute("manifest")) {
                    var manifest = el.getAttribute("manifest");
                    var manifestLocation = FS.join(
                        FS.directory(fileName),
                        manifest
                    );
                    if (
                        config.contents[manifestLocation] &&
                        !config.contents[manifestLocation].remove
                    ) {
                        // read legacy fallback and network sections into
                        // package config
                        readManifest(
                            config.contents[manifestLocation].utf8,
                            config,
                            fileName
                        );
                        // get rid of old manifest files
                        config.contents[manifestLocation].remove = true;
                    } else {
                        console.warn(
                            "    (warn) Non-existant manifest URL " +
                            manifestLocation + " from " + fileName
                        );
                    }
                    el.removeAttribute("manifest");
                }
                if (config.mainfest) {
                    // write or rewrite proper manifest location
                    el.setAttribute(
                        "manifest",
                        FS.relativeFromFile(fileName, "appcache.manifest")
                    );
                }
            } else if (el.tagName === "STYLE") {
                pending.push(
                    Q.call(rebaseCss, null, getText(el), rebase, fileName)
                    .then(function (css) {
                        setText(el, css, doc);
                    }, function (exception) {
                        console.warn("    (warn) CSS parse error in HTML: " +  fileName);
                        console.warn(exception.stack);
                    })
                );
            } else if (el.tagName === "SCRIPT") {

                var type;
                if (el.hasAttribute("type")) {
                    type = el.getAttribute("type");
                } else {
                    type = "application/javascript";
                }

                if (
                    type === "application/javascript" ||
                    type === "text/javascript"
                ) {

                    // lint
                    if (options.lint) {

                        // content vs src
                        if (el.hasAttribute("src") && getText(el).strip() !== "") {
                            console.warn("    (warn) A script tag must only have either a src or content in " + fileName);
                        }

                        // mime type
                        if (type === "text/javascript") {
                            console.warn("    (warn) Proper MIME type for JavaScript is application/javascript and should be omitted in " + fileName);
                        } else if (el.hasAttribute("type")) {
                            console.warn("    (warn) Script MIME type should be omitted if application/javascript in " + fileName);
                        }

                        // content
                        if (!jshint(getText(el))) {
                            console.warn("    (warn) JSHints for <script>: " + fileName);
                        }

                    }

                    // remove attribute if it exists
                    if (el.hasAttribute("type")) {
                        el.removeAttribute("type");
                    }

                    // minify
                    if (options.optimize) {
                        setText(el, minifyJavascript(getText(el), fileName), doc);
                    }

                } else if (type === "text/m-objects") {

                    console.log("   (warn) Deprecated text/m-objects block in " + fileName + ". Use montage/serialization");

                } else if (type === "text/montage-serialization") {

                    // minify
                    try {
                        if (options.optimize) {
                            setText(el, JSON.stringify(JSON.parse(getText(el))), doc);
                        }
                    } catch (error) {
                        if (error instanceof SyntaxError) {
                            console.warn("    (warn) Syntax Error in Montage Serialization in " + fileName);
                        } else {
                            throw error;
                        }
                    }

                } else {
                    console.warn("    (warn) Unrecognized script type " + JSON.stringify(type) + " in " + fileName);
                }

            }
        }
    });
    return Q.all(pending);
}

function getText(el) {
    return domToHtml(el._childNodes, true, true);
}

function setText(el, text, doc) {
    el.innerHTML = "";
    el.appendChild(doc.createTextNode(text));
}

function rebaseHtml(html, rebase, fileName, config, options) {
    var document;
    try {
        document = jsdom(html, null, {
            "features": {
                "FetchExternalResources": false,
                "ProcessExternalResources": false
            }
        });
    } catch (exception) {
        console.warn("    (warn) HTML parse error: " + fileName);
    }
    if (document) {
        return rebaseDocument(document, rebase, fileName, config, options)
        .fail(function () {
            console.warn("    (warn) HTML rebase error: " + fileName);
            return html;
        })
        .then(function () {
            return minifyHtml("<!doctype html>\n" + document.outerHTML, {
                removeComments: true,
                collapseBooleanLiterals: true,
                //collapseWhitespace: true,
                removeAttributeQuotes: true,
                removeRedundantAttributes: true,
                removeEmptyAttributes: true
            });
        });
    }
}

var copyrightExpression = /copyright/i;
function checkCopyright(file, options) {
    if (options.copyright && !copyrightExpression.test(file.utf8)) {
        console.warn("    (warn) No mention of copyright: " + file.shortName);
    }
}

