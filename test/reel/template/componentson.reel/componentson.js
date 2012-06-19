/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2012 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
exports = typeof exports !== "undefined" ? exports : {};

var Montage = require("montage").Montage;
var Component = require("montage/ui/component").Component;
var ComponentFather = require("reel/template/componentfather.reel").ComponentFather;

var ComponentSon = exports.ComponentSon = Montage.create(ComponentFather, {
    templateModuleId: {value: "../componentfather.reel/componentfather.html"},
    
    draw: {
        value: function() {
            this._element.textContent = "Component Son";
        }
    }
});
