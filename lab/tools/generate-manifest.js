#!/usr/bin/env node

var fs = require("fs"),
    path = require("path");

var manifest = {files: {}};

function usage() {
    console.log("Usage: generate-manifest [ directory... ]");
}

function main(dirPath, fileNames, files) {
    for (var i = 0, len = fileNames.length; i < len; i++) {
        var name = fileNames[i];
        if (name.lastIndexOf("/") === name.length - 1) {
            name = name.substr(0, name.length - 1);
        }
        var filePath = path.join(dirPath, name);

        var stats = fs.statSync(filePath);
        if (stats.isDirectory()) {
            var newFiles = files[name] = {
                directory: true,
                files: {}
            };

            main(filePath, fs.readdirSync(filePath), newFiles.files);
        } else {
            files[name] = null;
        }
    }

    return files;
}

var argv = process.argv;
if (argv.length > 2 && argv[2] === "--help") {
    usage();
} else {
    var directories = argv.slice(2);
    if (directories.length === 0) {
        directories = fs.readdirSync(".");
    }

    main("", directories, manifest.files);
    fs.writeFileSync("manifest.json", JSON.stringify(manifest), "utf8");
    console.log("Wrote manfiest.json");
}