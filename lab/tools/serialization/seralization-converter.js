/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2012 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */

var args = process.argv.slice(2);
var options = {};

do {
    var arg = args[0],
        argumentConsumed = false;

    switch (arg) {
        case "--dry-run":
        argumentConsumed = true;
        options.dryRun = true;
        break;
    }

    if (argumentConsumed) {
        args.shift();
    }
} while (argumentConsumed);


if (args.length === 0) {
    usage();
    process.exit();
}

var scriptDir = process.argv[1].split("/").slice(0, -1).join("/") + "/";

var fs = require("fs");
var convertModuleToPrototype = require(scriptDir + "convert-module-to-prototype").convertModuleToPrototype;

processFiles(args);

function usage() {
    console.log("Missing arguments.");
    console.log("Usage: " + process.argv[1] + " [--dry-run] <filename.html> | <directory>");
}

function processFiles(filenames) {
    filenames.forEach(function(filename) {
        var stats = fs.statSync(filename);

        if (stats.isFile() && /\.(html|json)$/.test(filename)) {
            processFile(filename);
        } else if (stats.isDirectory()) {
            processDirectory(filename);
        } else {
            //console.log("Warning: " + filename + " has unknown file type.");
        }
    });
}

function processDirectory(dirname) {
    fs.readdir(dirname, function(err, filenames) {
        if (err) throw err;
        filenames = filenames.map(function(value){return dirname+"/"+value}); // grunf..
        processFiles(filenames);
    });
}

function processFile(filename) {
    convertSerialization(filename);
}

function convertSerialization(filename) {
    fs.readFile(filename, function(err, data) {
        if (err) throw err;

        data = data.toString();

        var newContents = convertModuleToPrototype(data);

        if (newContents === data) {
            return;
        }

        if (options.dryRun) {
            console.log("Will rewrite " + filename + " with:");
            console.log(newContents);
        } else {
            fs.writeFile(filename, newContents, function (err) {
                if (err) {
                    console.log("Error writing to " + filename + ".");
                } else {
                    console.log("Converted: " + filename);
                }
            });
        }
    });
}
