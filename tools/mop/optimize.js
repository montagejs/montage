#!/usr/bin/env node
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

