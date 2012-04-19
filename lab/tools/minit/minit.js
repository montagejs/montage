#!/usr/bin/env node
/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2012 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */

var fs = require("fs");
var path = require("path");

var args = process.argv.slice(3);
var options = {};
options.templateName = process.argv[2];

options.minitHome = process.argv[1].split("/").slice(0, -1).join("/") + "/";

if (args.length === 0) {
    usage();
    process.exit();
}

var templatePath = path.join(options.minitHome, "templates", options.templateName);
var Template = require(templatePath).Template;
var templateStats = fs.statSync(templatePath);
if (templateStats.isDirectory()) {
    var aTemplate = Template.newWithNameAndOptions(templatePath, options);
    aTemplate.process(args);
} else {
    console.log("Invalid arguments.");
    console.log("Missing template directory: " + templatePath);
}

function usage() {
    console.log("Missing arguments.");
    var fileNames = fs.readdirSync(path.join(options.minitHome,"templates"));
    fileNames.forEach(function(filename) {
        var stats = fs.statSync(path.join(options.minitHome,"templates",filename));
        if (stats.isDirectory()) {
            console.log("Usage: ./minit.js " + filename + " " + require("./templates/" + filename).Template.usage());
        }
    });
}
