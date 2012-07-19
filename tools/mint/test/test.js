#!/usr/bin/env node
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
/*jshint node:true */
var mint = require("../mint"),
    assert = require("assert");

process.chdir(__dirname);


assert.ok(!("non-existsing-file" in mint.run(["non-existsing-file"])), "doesn't lint non-existsing file");

var result = mint.run(["ok.js"]);
assert.ok("ok.js" in result, "lints existing file");
assert.equal(result["ok.js"].length, 0, "ok.js has no problems");

var result = mint.run(["dir"]);
assert.equal(result["dir/ok.js"].length, 0, "can lint in subdirectories");

mint.run(["ok.js"], null, null, function(filename, problems) {
    assert.equal(filename, "ok.js", "callback gets correct filename");
    assert.equal(problems.length, 0, "callback gets correct problems");
});

var result = mint.run(["copyright.js"]);
assert.equal(result["copyright.js"][0].problem, "no copyright comment (or wrong copyright year)", "lints copyright statement");

var result = mint.run(["globals.js"]);
assert.equal(result["globals.js"][0].problem, "'something' is not defined and is probably creating a global", "checks for implied globals");

console.log("done");
