#!/usr/bin/env node
/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */

function usage() {
    console.log("Usage: mop [options] [<application> ...]");
    console.log("");
    console.log("    -f --force");
    console.log("    -t --target ./builds/");
    console.log("    -s --shared for overlapping dependencies to be shared");
    console.log("    -o --optimize 0 to disable optimizations");
    console.log("    -l --lint to enable linter warnings");
    console.log("    -c --copyright to enable copyright message check");
    console.log("    -m --manifest to force an application cache to be made");
    console.log("    -d --delimiter @ to use a different symbol");
    console.log("");
}

function version() {
    var config = require("./package.json")
    console.log(config.title + " version " + config.version);
    BUILD.buildSystemHash()
    .then(function (hash) {
        console.log(hash);
    })
    .end();
}

var Q = require("q");
var OPT = require("optimist")
var BUILD = require("./lib/build");

var argv = OPT
    .boolean([
        "f", "force",
        "l", "lint",
        "c", "copyright",
        "s", "shared",
        "m", "manifest",
        "b", "bundle",
        "h", "help",
        "v", "version"
    ])
    .default("optimize", "1")
    .alias("o", "optimize")
    .default("delimiter", "@")
    .alias("d", "delimiter")
    .argv;

if (argv.h || argv.help)
    return usage();
if (argv.v || argv.version)
    return version();

var force = argv.f || argv.force;
var lint = argv.l || argv.lint;
var shared = argv.s || argv.shared;
var manifest = argv.m || argv.manifest;
var buildLocation = argv.t || argv.target || "builds";
var copyright = argv.c || argv.copyright;
var optimize = +argv.optimize;
var bundle = argv.b || argv.bundle;
var delimiter = argv.delimiter;

Error.stackTraceLimit = 50;

BUILD.build(argv._.length ? argv._ : ".", {
    buildLocation: buildLocation,
    incremental: true,
    optimize: optimize > 0,
    bundle: !!bundle,
    lint: !!lint,
    copyright: !!copyright,
    shared: !!shared,
    manifest: !!manifest,
    force: !!force,
    delimiter: delimiter,
    engines: ["montage", "browser"],
    platform: "browser"
})
.end();

