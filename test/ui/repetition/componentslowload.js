/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2012 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
exports = typeof exports !== "undefined" ? exports : {};

var Montage = require("montage").Montage;
var Component = require("montage/ui/component").Component;

var ComponentSlowLoad = exports.ComponentSlowLoad = Montage.create(Component, {
    hasTemplate: {value: false},
    delay: {value: 100},

    // This code makes the first instantiated component to load after the second
    loadComponentTree: {value: function(callback) {
        setTimeout(callback, ComponentSlowLoad.delay);
        ComponentSlowLoad.delay -= 20;
    }}
});

