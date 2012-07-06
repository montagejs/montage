/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */

// This file is responsible for taking a catalog produced by the
// discover module and reading every file in each of those packages.
// Each file produces an object with the file's data and metadata,
// which is cross-referenced:
// -    by name relative to the package root in config.contents
// -    by canonical name in options.contents
// In the process, it produces a consistent hash and build location
// for each package based on a digest of every file,
// consistent hashes of each dependency, and the package's own
// configuration.

var Q = require("q");
var Hash = require("./hash").Hash;
var FS = require("q-fs");
var File = require("./file").File;

exports.readCatalog = readCatalog;
function readCatalog(catalog, options) {
    var done;
    options = options || {};
    options.readPackageMemo = {};
    options.contents = {};
    Object.keys(catalog).forEach(function (location) {
        var ready = readPackage(catalog[location], catalog, options);
        done = Q.when(done, function () {
            return ready;
        });
    });
    return Q.when(done, function () {
        return catalog;
    });
}

var escape = function (str) {
    return str.replace(/[-[\]{}()*+?.\\^$|,#\s]/g, "\\$&");
};

var glob2re = function (pattern) {
    var inner = pattern.replace(
        /(\*\*\/)|(\*)|(\?)|(.)/g,
        function (_, ss, s, q, other) {
            if (ss) {
                return "([^/]*/)*";
            } else if (s) {
                return "[^/]*?";
            } else if (q) {
                return "[^/]";
            } else {
                return escape(other);
            }
        }
    );
    var outer = new RegExp("^" + inner + "$");
    return outer;
};

var testRe = function (re) {
    return function (text) {
        return re.test(text);
    };
};

var composeOr = function (a, b) {
    return function () {
        return a.apply(this, arguments) || b.apply(this, arguments);
    };
};

var exclude = testRe(glob2re("**/.*"));

var makeFilter = function (config) {
    var _exclude = exclude;
    (config.exclude || []).forEach(function (pattern) {
        _exclude = composeOr(_exclude, testRe(glob2re(pattern)));
    });
    return function (name, stat) {
        if (FS.base(name) === "node_modules") {
            return null;
        } else if (_exclude(FS.relativeFromDirectory(config.location, name))) {
            if (stat.isDirectory()) {
                return null;
            } else {
                return false;
            }
        } else if (stat.isDirectory()) {
            return false;
        } else {
            return true;
        }
    };
};

exports.readPackage = readPackage;
function readPackage(config, catalog, options) {
    var memo = options.readPackageMemo = options.readPackageMemo || {};
    var location = config.location;
    var hash = Hash("sha256");

    hash.update(options.seed || "");

    // option variations
    hash.update([
        options.optimize,
        options.manifest,
        options.shared
    ].map(function (option) {
        return option ? "1" : "0";
    }).join(''));

    hash.update(options.delimiter || "@");

    var contents = {};
    if (!memo[location]) {
        memo[location] = FS.canonical(location)
        .then(function (location) {

            var filter = makeFilter(config);

            return memo[location] =
            FS.listTree(location, function (name, stat) {
                // do not traverse into packages
                if (name !== location && stat.isDirectory()) {
                    return FS.isFile(FS.join(name, "package.json"))
                    .then(function (isFile) {
                        if (isFile) {
                            return null;
                        } else {
                            return filter(name, stat);
                        }
                    });
                } else {
                    return filter(name, stat);
                }
            })

            .then(function (names) {
                // all of the file names in the package (IN ORDER)
                return names.reduce(function (finish, name) {
                    return FS.read(name, "b")
                    .then(function (content) {
                        if (typeof content !== "object") {
                            throw new Error("Assertion error, FS.read should return a promise for a string");
                        }
                        var shortName = FS.relativeFromDirectory(location, name);
                        options.contents[name] =
                        contents[shortName] = new File({
                            "name": name,
                            "shortName": shortName,
                            "content": content,
                            "package": config.location,
                        });
                        return finish.then(function () {
                            hash.update(shortName);
                            hash.update(content);
                            if (!/\.(html|js|json|css)$/.exec(name)) {
                                // save memory by relegating uninteresting
                                // files to the file system and copy them
                                // later instead of writing back from
                                // memory
                                contents[shortName].shelf();
                            }
                        });
                    });
                }, Q.resolve());
            })

            .then(function () {
                // update the hash of this module with its dependencies'
                // hashes
                var done;
                var mappings = config.mappings;
                Object.keys(mappings).sort().forEach(function (name) {
                    var location = mappings[name].location;
                    var readed = Q.when(FS.canonical(location), function (location) {
                        var mapping = catalog[location];
                        if (!mapping)
                            throw new Error("Cannot find mapping " + location + " in the catalog.");
                        return readPackage(mapping, catalog, options);
                    });
                    done = Q.when(done, function () {
                        return Q.when(readed, function (readed) {
                            hash.update(readed.hash);
                        });
                    });
                });
                return done;
            })

            .then(function () {
                config.contents = contents;
                // we have finished updating the hash; digest it
                config.hash = hash.digest();
                return config;
            });

        });
    }
    return memo[location];
}

