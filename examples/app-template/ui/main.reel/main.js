/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2012 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
var Montage = require("montage/core/core").Montage,
    Component = require("montage/ui/component").Component;

// and here's a bunch of requires just to show this requiring things and upping the count in the loader
require("montage/ui/button.reel");
require("montage/ui/input-checkbox.reel");

exports.Main = Montage.create(Component, {

    templateDidLoad: {
        value: function() {
            //console.log("main templateDidLoad")
        }
    },

    prepareForDraw: {
        value: function() {
            //console.log("main prepareForDraw")
        }
    }

});
