/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
var Montage = require("montage/core/core").Montage,
    Component = require("montage/ui/component").Component;

exports.StyleElement = Montage.create(Component, {
    hasTemplate: {value: false},

    bold: {
        get: function() {
            return this.element.style.fontWeight === "bold";
        },
        set: function(val) {
            this.element.style.fontWeight = (val) ? "bold" : "normal";
        }
    },
    underline: {
        get: function() {
            return this.element.style.textDecoration === "underline";
        },
        set: function(val) {
            this.element.style.textDecoration = (val) ? "underline" : "none";
        }
    },
    italic: {
        get: function() {
            return this.element.style.fontStyle === "italic";
        },
        set: function(val) {
            this.element.style.fontStyle = (val) ? "italic" : "normal";
        }
    }
});
