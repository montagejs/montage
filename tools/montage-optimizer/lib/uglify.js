/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */

var UGLIFY = require("uglify-js");
var PARSER = UGLIFY.parser;
var PROCESS = UGLIFY.uglify;

exports.uglify = uglify;
function uglify(source, fileName) {
    var ast = PARSER.parse(source); // parse code and get the initial AST
    ast = PROCESS.ast_mangle(ast); // get a new AST with mangled names
    ast = PROCESS.ast_squeeze(ast); // get an AST with compression optimizations
    return PROCESS.gen_code(ast); // compressed code here
}

