/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2012 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */

var args = process.argv.slice(3);
var options = {};
options.templateName = process.argv[2];

if (args.length === 0) {
    usage();
    process.exit();
}

options.minitHome = process.argv[1].split("/").slice(0, -1).join("/") + "/";

var fs = require("fs");

function usage() {
    console.log("Missing arguments.");
    console.log("Usage: " + process.argv[1] + " template_name name [<variables>]");
}
var templatePath = options.minitHome + "templates/" + options.templateName
var Template = require(templatePath).Template;
var templateStats = fs.statSync(templatePath);
if (templateStats.isDirectory()) {
    var aTemplate = Template.newWithNameAndOptions(templatePath, options);
    aTemplate.process(args);
} else {
    console.log("Invalid arguments.");
    console.log("Missing template directory: " + templatePath);
}