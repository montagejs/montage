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
        var problems = [];
        for (var g in jshint.implieds) {
            var impliedGlobal = jshint.implieds[g];
            problems.push({
                line: impliedGlobal.line[0],
                problem: "'" + impliedGlobal.name + "' is not defined and is probably creating a global",
                solution: "add `var` or a comment `/*global " + impliedGlobal.name + " */`"
            });
        }
        return problems;
    }
    return false;
};

// problem: no copyrght comment
exports.copyright = function(path, source) {
    var statement = "/* <copyright>\n"+
" This file contains proprietary software owned by Motorola Mobility, Inc.<br/>\n"+
" No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>\n"+
" (c) Copyright 2012 Motorola Mobility, Inc.  All Rights Reserved.\n"+
" </copyright> */";

    if (source.indexOf(statement) !== 0) {
        return [{line: 0, problem: "no copyright comment (or wrong copyright year)", solution: "add this to the begining of the file:`\n" + statement + "\n`"}];
    }
    return false;
};