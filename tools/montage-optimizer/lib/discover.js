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

// This file is responsible for discovering the locations and
// configuration packages, including their deep dependencies.  The
// result is a catalog mapping package locations to their
// configuration object, produced by normalizing the package's
// package.json data.

var Q = require("q");
var FS = require("q-fs");
var MontageRequire = require("../montage/require/require");

exports.discover = discover;

function discover(location, options, catalog, found) {
    options = options || {};
    found = found || {};
    var discoveries = options.discoveries = options.discoveries || {};
    if (!discoveries[location]) {
        discoveries[location] = loadConfig(location, options, found)
        .then(function (config) {
            //discoveries[config.location] = discoveries[location];
            catalog[config.location] = config;
            return discoverDependencies(config, options, catalog, found);
        })
        .then(function (config) {
            return config;
        });
    }
    return discoveries[location];
}

function discoverDependencies(config, options, catalog, found) {
    var deepDependencyLocations = config.deepDependencyLocations = {};

    if (!options.quiet) {
        console.log("Discovered", FS.relativeFromDirectory(config.location) || ".");
    }

    // find subpackages
    return config.directory("packages")
    .then(function (packages) {
        return FS.list(packages).then(function (names) {
            // discover installed packages
            return Q.all(names.map(function (name) {
                return FS.isFile(FS.join(packages, name, "package.json"))
                .then(function (isFile) {
                    if (isFile) {
                        found[name] = FS.join(packages, name);
                    }
                });
            }));
        });
    }, function (reason) {
        // ignore the case that there is no subpackages
        // directory
    })
    // by this point, all of the subpackages have been found
    .then(function () {
        var dependencies = config.dependencies || {};
        var mappings = config.mappings = config.mappings || {};

        var discoveries = [];
        var finish = Q.resolve();

        // discover all the name@version dependencies
        finish = Object.keys(dependencies)
        .reduce(function (finish, name) {
            return finish.then(function () {
                var discovering = discover(
                    FS.join(config.location, found[name]),
                    options,
                    catalog,
                    found
                ).then(function (config) {
                    mappings[name] = {"location": found[name]};
                    return config;
                })
                discoveries.push(discovering);
                return discovering;
            });
        }, finish);

        // discover name@path dependencies
        finish = Object.keys(mappings)
        .reduce(function (finish, name) {
            return finish.then(function () {
                var mapping = Dependency(mappings[name], name);
                var discovering = discover(
                    FS.join(config.location, mapping.location),
                    options,
                    catalog,
                    found
                ).then(function (config) {
                    mappings[name] = {"location": config.location};
                    return config;
                })
                discoveries.push(discovering);
                return discovering;
            });
        }, finish);

        return finish.then(function () {
            return discoveries;
        });

    })
    .then(function (discoveries) {
        return Q.all(discoveries.map(function (discovering) {
            return discovering.then(function (config) {

                // aggregate dependency locations
                deepDependencyLocations[config.location] = true;
                var subLocations = config.deepDependencyLocations;
                Object.keys(subLocations).forEach(function (location) {
                    deepDependencyLocations[location] = true;
                });

            }, function (error) {
                if (error.message.indexOf("Can't find ") === 0) {
                    throw new Error("Can't find dependency " + name + " of " + location);
                } else {
                    throw error;
                }
            });
        }))
    })
    .then(function () {
        //if (!options.quiet) {
        //    console.log("Found all dependencies of", FS.relativeFromDirectory(config.location) || ".");
        //}
        return config;
    });
}

function loadConfig(location, options, found) {
    return FS.canonical(location)
    .then(function (location) {
        // read package.json and configure the package
        var configName = FS.join(location, "package.json");
        return FS.read(configName, "r", "utf-8")
        .then(function (configContent) {
            var config = JSON.parse(configContent);
            return configure(location, config, options, found);
        }, function () {
            throw new Error(
                "Can't read package because it does not have " +
                "a package.json: " + JSON.stringify(location)
            );
        });
    }, function (error) {
        throw new Error("Can't find " + location);
    });
}

function configure(location, config, options, found) {
    options = options || {};

    // store the location, assuming it is canonical
    config.location = location;

    // support overlays
    if (config.overlay) {
        (options.engines || []).forEach(function (engine) {
            update(config, config.overlay[engine] || {});
            if (config.overlay[engine])
                config[engine] = true;
        });
        delete config.overlay;
    }

    // support directories
    config.directories = config.directories || {};
    // library root
    if (config.directories.lib === undefined)
        config.directories.lib = "lib";
    // packages root
    if (config.directories.packages === undefined) {
        if (config.dependencies) {
            config.directories.packages = "node_modules";
        } else {
            config.directories.packages = "..";
        }
    }

    // a utility for grabbing the name of a directory based
    // on its conventional name
    config.directory = function (name) {
        return FS.canonical(
            FS.join(location, this.directories[name] || name)
        );
    };

    return config;
}

function Dependency(dependency, name) {
    if (typeof dependency === "string") {
        if (dependency.indexOf("@") >= 0) {
            var parts = dependency.split("@");
            dependency = {
                "name": parts[0] || name,
                "version": parts[1],
                "registry": parts.slice(2).join("@") || undefined
            };
        } else {
            dependency = {"location": dependency};
        }
    }
    return dependency;
}

function update(target, source) {
    for (var name in source) {
        target[name] = source[name];
    }
}

