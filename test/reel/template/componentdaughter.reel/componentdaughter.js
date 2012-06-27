/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2012 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
exports = typeof exports !== "undefined" ? exports : {};

var Montage = require("montage").Montage;
var ComponentMother = require("reel/template/componentmother.reel").ComponentMother;


var ComponentDaughter = exports.ComponentDaughter = Montage.create(ComponentMother, {
});
