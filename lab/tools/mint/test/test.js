#!/usr/bin/env node
/*jshint node:true */
var mint = require("../mint"),
    assert = require("assert");

process.chdir(__dirname);


assert.ok(!("non-existsing-file" in mint.run(["non-existsing-file"])), "doesn't lint non-existsing file");

var result = mint.run(["ok.js"]);
assert.ok("ok.js" in result, "lints existing file");
assert.equal(result["ok.js"].length, 0, "ok.js has no problems");


var result = mint.run(["copyright.js"]);
assert.equal(result["copyright.js"][0].problem, "no copyright comment (or wrong copyright year)", "lints copyright statement");

var result = mint.run(["globals.js"]);
assert.equal(result["globals.js"][0].problem, "'something' is not defined and is probably creating a global", "checks for implied globals");
