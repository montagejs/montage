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

// -    uses discovery module to find packages, their configuration,
//      and their deep dependencies
// -    uses reader to get the contents of each package
// -    constructs a seed for all project consistent hashes based
//      on the consistent hash of the build system itself
// -    use transfomer to transform the package contents
//      using file-extension based build chains and also
//      multi-file bundling
// -    reconfigures each package's dependencies based on the build
//      locations
// -    constructs a manifest for every package
// -    writes the new package builds

var Q = require("q");
var FS = require("q-fs");
var readCatalog = require("./read").readCatalog;
var discover = require("./discover").discover;
var transform = require("./transform").transform;
var bundle = require("./bundle").bundle;

exports.build = build;
function build(applications, options, catalog) {
    options = options || {};
    catalog = catalog || {};
    if (!Array.isArray(applications)) {
        applications = [applications];
    }
    var applicationConfigs = [];
    return Q.fcall(function () {
        if (options.force) {
            return "";
        } else {
            return buildSystemHash();
        }
    })
    .then(function (seed) {
        options.seed = seed;
        // discover all applications
        return applications.reduce(function (previous, application) {
            return Q.when(previous, function () {
                return discover(application, options, catalog);
            }).then(function (config) {
                applicationConfigs.push(config);
            })
        }, Q.resolve());
    })
    // then read the entire catalog
    .then(function () {
        return readCatalog(catalog, options);
    })
    // then build each application application
    .then(function (catalog) {
        if (options.shared) {
            return buildShared(catalog, options);
        } else {
            return buildIndependent(catalog, options, applicationConfigs);
        }
    })
}

function buildShared(catalog, options) {
    // in serial: do not parallize at the risk of making
    // the console output confusing (at the expense of working
    // faster)
    catalog = relocateShared(catalog, options);
    var done;
    var deepBuild = DeepBuilder(options);
    Object.keys(catalog).forEach(function (location) {
        done = Q.when(done, function () {
            return deepBuild(catalog[location], catalog);
        });
    });
    return done;
}

function buildIndependent(catalog, options, applications) {
    var done;
    var deepBuild = DeepBuilder(options);
    applications.forEach(function (application) {
        done = Q.when(done, function () {
            var recatalog = relocateIndependent(catalog, options, application);
            return deepBuild(recatalog[application.location], recatalog);
        });
    });
    return done;
}

exports.DeepBuilder = DeepBuilder;
function DeepBuilder(options) {
    var building = {};

    function deepBuild(config, catalog) {
        var location = config.location;

        if (building[location])
            return config;

        // construct a built version location

        return building[location] =
        FS.isFile(FS.join(config.buildLocation, 'package.json'))
        .then(function (isFile) {

            if (isFile && !options.force) {
                console.log('Skipping', config.buildLocation, 'from', FS.relativeFromDirectory(config.location) || ".");
                return;
            }

            // build all dependencies
            var selfBuilt = buildPackage(config, catalog, options);
            var dependenciesBuilt = Object.keys(config.mappings).map(function (id) {
                var mapping = config.mappings[id];
                var subconfig = catalog[mapping.location];
                return deepBuild(subconfig, catalog);
            });

            return Q.all(dependenciesBuilt)
            .then(function () {
                return selfBuilt;
            });

        })
        .then(function () {
            return link(config);
        });
    }

    return deepBuild;
}

function buildPackage(config, catalog, options) {
    console.log('Building', config.buildLocation, 'from', FS.relativeFromDirectory(config.location));

    // reconfigure
    config.contents['package.json'].utf8 = JSON.stringify(reconfig(config, catalog));

    return Q.fcall(function () {
        //console.log('Transforming', config.buildLocation);
        return transform(config, catalog, options);
    })
    .then(function () {
        //console.log('Bundling', config.buildLocation);
        return bundle(config, catalog, options);
    })
    .then(function () {
        //console.log('Writing', config.buildLocation);
        return write(config);
    })
    .then(function () {
        //console.log('Manifesting', config.buildLocation);
        return manifest(config, catalog, options);
    })
}

function write(config) {
    var done = Q.resolve();
    var contents = config.contents;
    return Q.all(Object.keys(contents).map(function (name) {
        var file = contents[name];
        if (file.remove)
            return;
        var buildName = FS.join(config.buildLocation, name);
        var directory = FS.directory(buildName);
        return Q.fcall(function () {
            return FS.makeTree(directory)
        })
        .then(function () {
            return file.write(buildName)
            .fail(function (reason, error) {
                console.log("    (error) " + reason, error);
            });
        });
    }));
}

function link(config) {
    return Q.fcall(function () {
        if (config.linkLocation === void 0)
            return;
        if (config.buildLocation === config.linkLocation)
            return;
        var linked = FS.remove(config.linkLocation)
        .fail(function () {
            // don't freak out if it didn't exist
        })
        .then(function () {
            console.log("Linking", config.linkLocation, "to", config.buildLocation);
            return FS.symbolicCopy(config.buildLocation, config.linkLocation)
        });
    })
    .then(function () {
        // create package@version/ link to package@hash/
        if (config.versionLocation === void 0)
            return;
        // delete the old one if it exists
        FS.remove(config.versionLocation)
        .fail(function () {}) // don't complain if it didn't exist
        // then make the new one
        .then(function () {
            console.log("Linking", config.versionLocation, "to", config.buildLocation);
            return FS.symbolicCopy(config.buildLocation, config.versionLocation);
        })
    });
}

function manifest(config, catalog, options) {
    if (!config.manifest && !options.manifest)
        return;

    // TODO change to manifest.appcache
    var manifestLocation = FS.join(config.buildLocation, "appcache.manifest");

    console.log("Generating manifest", manifestLocation);

    // manifest must be generated after the build
    // is complete so it accounts for transformations
    // that occurred
    var manifest = gatherManifest(config, config, catalog);
    var lines = ["CACHE MANIFEST"];
    if (config.version)
        lines.push("#version " + config.version);
    lines.push("#hash " + config.hash);
    lines.push.apply(lines, manifest.sort());
    var fallback = config.fallback || {};
    if (Object.keys(fallback).length) {
        lines.push("");
        lines.push("FALLBACK:");
        lines.push.apply(
            lines,
            Object.keys(fallback).map(function (from) {
                return from + " " + fallback[from];
            })
        );
    }

    // ignore provided network lines
    lines.push("");
    lines.push("NETWORK:");
    lines.push("*");

    var manifest = lines.map(function (line) {
        return line + "\n";
    }).join("");

    // manifest must be written after the build has
    // completed, so its old manifest can be overwritten
    return FS.write(manifestLocation, manifest)
}

// gathers a recursive manifest relative to the target build directory
function gatherManifest(base, config, catalog, manifest) {
    manifest = manifest || [];
    var relative = FS.relativeFromDirectory(base.buildLocation, config.buildLocation);
    manifest.push.apply(
        manifest,
        Object.keys(config.contents)
        .map(function (name) {
            return config.contents[name];
        })
        .filter(function (file) {
            return !file.remove;
        })
        .map(function (file) {
            return FS.join(relative, file.shortName);
        })
    );
    Object.keys(config.mappings).forEach(function (id) {
        var mapping = config.mappings[id];
        var subconfig = catalog[mapping.location];
        gatherManifest(base, subconfig, catalog, manifest);
    });
    return manifest;
}

function relocateShared(catalog, options) {
    var recatalog = {};
    var buildLocation = options.buildLocation || "builds";

    Object.keys(catalog).forEach(function (location) {
        var config = Object.create(catalog[location]);

        var name = config.name || FS.base(config.location);
        var smallHash = config.hash.slice(0, 7);
        config.buildLocation =
            config.linkLocation =
                FS.join(buildLocation, name);
        if (config.version) {
            config.versionLocation = config.buildLocation + options.delimiter + config.version;
        }
        if (options.incremental) {
            config.buildLocation += options.delimiter + smallHash;
        }

        recatalog[location] = config;
    })
    return recatalog;
}

function relocateIndependent(catalog, options, application) {
    var recatalog = {};
    var buildLocation = options.buildLocation || "builds";

    var config = Object.create(application);
    var name = config.name || FS.base(config.location);
    var smallHash = config.hash.slice(0, 7);
    config.buildLocation =
        config.linkLocation =
            FS.join(buildLocation, name);
    if (config.version) {
        config.versionLocation = config.buildLocation + options.delimiter + config.version;
    }
    if (options.incremental) {
        config.buildLocation += options.delimiter + smallHash;
    }
    recatalog[application.location] = config;

    // new base for dependencies
    buildLocation = FS.join(config.buildLocation, "packages");

    Object.keys(catalog).forEach(function (location) {
        if (location === application.location)
            return;

        var config = Object.create(catalog[location]);

        // compute the build location based on the current
        // location, version, and hash
        var smallHash = config.hash.slice(0, 7);
        config.buildLocation = FS.join(buildLocation, config.name + options.delimiter + smallHash);

        recatalog[location] = config;
    })
    return recatalog;
}

function reconfig(config, catalog) {
    var reconfig = {};
    reconfig.name = config.name;
    reconfig.version = config.version;
    reconfig.hash = config.hash.slice(0, 7);
    reconfig.if = config.if;
    reconfig.main = config.main;
    reconfig.redirects = config.redirects;
    if (config.directories.lib !== "lib") {
        reconfig.directories = reconfig.directories || {};
        reconfig.directories.lib = config.directories.lib;
    }
    var mappings = reconfig.mappings = {};
    Object.keys(config.mappings).forEach(function (name) {
        var mapping = catalog[config.mappings[name].location];
        mappings[name] = {
            hash: mapping.hash.slice(0, 7),
            location: FS.relativeFromDirectory(config.buildLocation, mapping.buildLocation)
        };
    });
    reconfig.define = true;
    return reconfig;
}

// Construct a hash of the build system itself, to seed the hashes of every
// package constructed by the build system.  This forces packages to be rebuit
// if the build system changes.
var _buildSystemHash;
exports.buildSystemHash = buildSystemHash;
function buildSystemHash(quiet) {
    if (!_buildSystemHash) {
        console.log("Computing build system hash");
        var catalog = {}
        _buildSystemHash = discover(__dirname + "/..", {
            "quiet": true
        }, catalog)
        .then(function () {
            return readCatalog(catalog);
        })
        .then(function () {
            for (var name in catalog) break;
            var config = catalog[name];
            return config.hash;
        });
    }
    return _buildSystemHash;
}

