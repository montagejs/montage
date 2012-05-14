/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
var Montage = require("montage/core/core").Montage,
    Component = require("montage/ui/component").Component;

exports.StyleElement = Montage.create(Component, {
    hasTemplate: {value: false},

    _bold: {
        value: false
    },
    bold: {
        get: function() {
            return this._bold;
        },
        set: function(val) {
            this._bold = !!val;
            this.needsDraw = true;
        }
    },
    _underline: {
        value: false
    },
    underline: {
        get: function() {
            return this._underline;
        },
        set: function(val) {
            this._underline = !!val;
            this.needsDraw = true;
        }
    },
    _italic: {
        value: false
    },
    italic: {
        get: function() {
            return this._italic;
        },
        set: function(val) {
            this._italic = !!val;
            this.needsDraw = true;
        }
    },

    draw: {
        value: function() {
            this.element.style.fontWeight = (this._bold) ? "bold" : "normal";
            this.element.style.textDecoration = (this._underline) ? "underline" : "none";
            this.element.style.fontStyle = (this._italic) ? "italic" : "normal";
        }
    }
});
