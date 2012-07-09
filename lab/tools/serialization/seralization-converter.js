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
