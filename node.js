/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */

var FS = require("fs");
var PATH = require("path");

var MontageBoot = require("./montage");

var Require = require("./require/require");
var Promise = require("./core/promise");
var URL = require("./core/url");

exports.bootstrap = function (callback) {
    var command = process.argv.slice(0, 3);
    var args = process.argv.slice(2);
    var program = args.shift();
    FS.realpath(program, function (error, program) {
        if (error) {
            throw new Error(error);
        }
        findPackage(program, function (error, directory) {
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

MontageBoot.loadPackage = function (location, config) {
    var config = {};

    config.location = URL.resolve('file:/', location + '/');

    // setup the reel loader
    config.makeLoader = function (config) {
        return MontageBoot.ReelLoader(config,
            Require.DefaultLoaderConstructor(config));
    };

    // setup serialization compiler
    config.makeCompiler = function (config) {
        return MontageBoot.TemplateCompiler(config,
            MontageBoot.SerializationCompiler(config,
                Require.DefaultCompilerConstructor(config)));
    };

    return Require.PackageSandbox(config.location, config);
};

var findPackage = function (path, callback) {
    var directory = PATH.dirname(path);
    if (directory === path)
        return callback("Can't find package");
    var packageJson = PATH.join(directory, "package.json");
    FS.stat(path, function (error, stat) {
        if (error) callback(error);
        if (stat.isFile()) {
            callback(null, directory);
        } else {
            findPackage(directory, callback);
        }
    });
}

var loadFreeModule = function (program, command, args) {
    throw new Error("Can't load module that is not in a package");
};

var loadPackagedModule = function (directory, program, command, args) {
    MontageBoot.loadPackage(directory)
    .then(function (require) {
        var id = program.slice(directory.length + 1);
        return require.async(id);
    })
    .end();
};

