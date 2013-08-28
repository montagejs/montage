
/*
    Based in part on Motorola Mobility’s Montage
    Copyright (c) 2012, Motorola Mobility LLC. All Rights Reserved.
    3-Clause BSD License
    https://github.com/motorola-mobility/montage/blob/master/LICENSE.md
*/
/*jshint node:true */
var Require = require("./require");
require("./node"); // patches Require
var URL = require("url");
var Promise = require("q");
var FS = require("fs");
var PATH = require("path");

Require.overlays = ["node", "server", "montage"];

var bootstrap = function () {
    var command = process.argv.slice(0, 3);
    var args = process.argv.slice(2);
    var program = args.shift();
    FS.realpath(program, function (error, program) {
        if (error) {
            throw new Error(error);
        }
        findPackage(PATH.dirname(program), function (error, directory) {
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

function findPackage(directory, callback) {
    if (directory === PATH.dirname(directory)) {
        return callback("Can't find package");
    }
    var packageJson = PATH.join(directory, "package.json");
    FS.stat(packageJson, function (error, stat) {
        if (error || !stat.isFile()) {
            findPackage(PATH.dirname(directory), callback);
        } else {
            callback(null, directory);
        }
    });
}

var loadPackagedModule = function (directory, program, command, args) {
    loadPackage(directory)
    .then(function (require) {
        var id = program.slice(directory.length + 1);
        return require.async(id);
    })
    .done();
};

exports.loadPackage = loadPackage;
function loadPackage(location, config) {
    if (location.slice(location.length - 1, location.length) !== "/") {
        location += "/";
    }
    config = config || {};
    config.location = URL.resolve(Require.getLocation(), location);
    return Require.loadPackage(config.location, config);
}

var loadFreeModule = function (program, command, args) {
    program = URL.resolve("file:" + program, "");
    var directory = URL.resolve(program, "./");
    var descriptions = {};
    descriptions[directory] = Promise.resolve({});
    return Require.loadPackage(directory, {
        descriptions: descriptions
    })
    .then(function (require) {
        var id = program.slice(directory.length);
        return require.async(id);
    })
    .done();
};

if (require.main === module) {
    bootstrap();
}

