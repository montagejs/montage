/*

To add a new linter simply add a new function to the exports object. It will
get passed 3 arguments:

    * path: the full path to the file
    * source: the contents of the file
    * jshint: the jshint.data() object

The linters must return `false` if there are no problems, or an array of
objects if there are. The objects must have the following properties:

    * line: the line number where the problem is
    * problem: a statement of the problem
    * solution: what the developer can do to fix the problem. Use backquotes (`)
      around code snippets that the developer can use
*/

/*
This function converts an index to a line number. Use with indexOf and regexps
that return an index.
*/
var indexToLine = function(string, index) {
    return string.substring(0, index).match(/\n/g).length + 1;
};

// problem: a selection from jshint
exports.jshint = function(path, source, jshint) {
    if (jshint.errors) {
        var problems = [];
        for (var i = 0, len = jshint.errors.length; i < len; i++) {
            if (!error) {
                break;
            }
            var error = jshint.errors[i];
            var prob = {
                line: error.line,
                problem: error.reason,
                solution: "JSHint error. Have a look through http://www.jshint.com/options/"
            };

            if (error.reason === "Trailing whitespace.") {
                prob.solution = "Set up your editor to strip trailing whitespace. https://docs.google.com/a/motorola.com/document/d/1NppSKu08BNoydjLSnZyqm3XHeDpOmNpcG-_BWblR6gk/edit#heading=h.v0m5pqzc0tdq";
            }

            problems.push(prob);
        }
        return problems;
    }
    return false;
};

// problem: undefined variables usage, hence creating globals
exports.globals = function(path, source, jshint) {
    if (jshint.implieds && jshint.implieds.length !== 0) {
        var problems = [], sourceLines = source.split("\n");
        for (var g in jshint.implieds) {
            var impliedGlobal = jshint.implieds[g],
                isSetOnLine = false;

            for (var l = 0, len = impliedGlobal.line.length; l < len; l++) {
                // heuristic: if the line contains an "=" then it's creating the
                // global, otherwise it's just using it
                // -1 because line 1 is index 0
                if (sourceLines[impliedGlobal.line[l] - 1].indexOf("=") !== -1) {
                    // console.log(path, l, impliedGlobal.line[l], impliedGlobal.name);
                    // console.log(sourceLines[impliedGlobal.line[l]-1]);
                    isSetOnLine = impliedGlobal.line[l];
                    break;
                }
            }

            if (isSetOnLine) {
                problems.push({
                    line: isSetOnLine,
                    problem: "'" + impliedGlobal.name + "' is not defined and probably creating a global",
                    solution: "add `var`.\n  If intentionally creating a global add `/*global " + impliedGlobal.name + " */` after the copyright statement"
                });
            } else {
                problems.push({
                    line: impliedGlobal.line[0],
                    problem: "'" + impliedGlobal.name + "' is not defined",
                    solution: "If intentionally using a global add `/*global " + impliedGlobal.name + " */` after the copyright statement"
                });
            }
        }
        return problems;
    }
    return false;
};

// problem: no copyrght comment
exports.copyright = function(path, source) {
var statement='/* <copyright>\n'+
'Copyright (c) 2012, Motorola Mobility LLC.\n'+
'All Rights Reserved.\n'+
'\n'+
'Redistribution and use in source and binary forms, with or without\n'+
'modification, are permitted provided that the following conditions are met:\n'+
'\n'+
'* Redistributions of source code must retain the above copyright notice,\n'+
'  this list of conditions and the following disclaimer.\n'+
'\n'+
'* Redistributions in binary form must reproduce the above copyright notice,\n'+
'  this list of conditions and the following disclaimer in the documentation\n'+
'  and/or other materials provided with the distribution.\n'+
'\n'+
'* Neither the name of Motorola Mobility LLC nor the names of its\n'+
'  contributors may be used to endorse or promote products derived from this\n'+
'  software without specific prior written permission.\n'+
'\n'+
'THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"\n'+
'AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE\n'+
'IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE\n'+
'ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE\n'+
'LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR\n'+
'CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF\n'+
'SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS\n'+
'INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN\n'+
'CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)\n'+
'ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE\n'+
'POSSIBILITY OF SUCH DAMAGE.\n'+
'</copyright> */';

    if (source.indexOf(statement) !== 0) {
        return [{line: 0, problem: "no copyright comment (or wrong copyright year)", solution: "add this to the begining of the file:`\n" + statement + "\n`"}];
    }
    return false;
};

exports.jsdoc = function(path, source) {
    var problems = [], line;
    var i, len;

    // from Deserializer
    var findObjectNameRegExp =/([^\/]+?)(\.reel)?$/;
    var toCamelCaseRegExp = /(?:^|-)([^\-])/g;
    var replaceToCamelCase = function(_, g1) { return g1.toUpperCase(); };

    var module = source.match(/@module "?([a-z0-9\-\.\/]+)/i);
    if (!module || module.length != 2) {
        return [{line: 0, problem: "no module JSDoc found. Cannot complete JSDoc linting", solution: 'Add `@module "..."` JSDoc comment'}];
    }

    if (path.indexOf(module[1]) === -1) {
        line = source.substring(0, module.index).match(/\n/g).length + 1;
        return [{
            line: indexToLine(source, module.index),
            problem: "@module JSDoc does not match file location",
            solution: "correct `"+module[0]+"` JSDoc to match file location"
        }];
    }

    ///

    module = module[1];
    findObjectNameRegExp.test(module);
    var klass = RegExp.$1.replace(toCamelCaseRegExp, replaceToCamelCase);
    var atKlass;
    if (module.indexOf(".") !== -1) {
        atKlass = '@class module:"'+ module +'".'+ klass;
    } else {
        atKlass = '@class module:'+ module +'.'+ klass;
    }

    if (source.indexOf(atKlass)  === -1) {
        problems.push({
            line: 0,
            problem: "cannot find "+klass+" @class JSDoc",
            solution: 'add `'+ atKlass +'` JSDoc'});
    }

    ///

    var classes = source.match(/@class [^ ]*/g) || [];
    for (i = 0, len = classes.length; i < len; i++) {
        klass = classes[i];
        if (klass.indexOf(module) === -1) {
            line = indexToLine(source, source.indexOf(klass));
            problems.push({
                line: line,
                problem: "@class is not in module '" + module + "'",
                solution: 'correct module of `' + klass + '` to `'+ module + '`'});

        }
    }
    var lends = source.match(/@lends [^ ]*/g) || [];
    for (i = 0, len = lends.length; i < len; i++) {
        var lend = lends[i];
        if (lend.indexOf(module) === -1) {
            line = indexToLine(source, source.indexOf(lend));
            problems.push({
                line: line,
                problem: "@lends is not in module '" + module + "'",
                solution: 'correct module of `' + lend + '` to `'+ module + '`'});

        }
    }

    var unquotedReelIndex = source.indexOf(".reel.");
    if (unquotedReelIndex !== -1) {
        problems.push({
            line: indexToLine(source, unquotedReelIndex),
            problem: ".reel is not quoted",
            solution: 'Quote .reel paths in JSDoc, e.g. module:"montage/ui/button.reel".Button'
        });
    }

    source.replace(/(?:^|[^\w\$_.])require\s*\(\s*["']([^"']*)["']\s*\)/g, function(_, id, index) {
        var req = (id.indexOf(".") !== -1) ? '@requires "montage/'+id+'"' : '@requires montage/'+id;
        if (id === "montage") {
            req = "@requires montage";
        }
        if (source.indexOf(req) === -1) {
            problems.push({
                line: indexToLine(source, index),
                problem: "no @requires for " + id,
                solution: "add `" + req + "`"
            });
        }
    });

    return problems;
};


exports.tabs = function(path, source) {
    var index;
    if ((index = source.indexOf("\t")) !== -1) {
        return [{line: indexToLine(source, index), problem: "Tab character found (there may be more)", solution: "Replace all tabs with four spaces `    `"}];
    }
    return false;
};
