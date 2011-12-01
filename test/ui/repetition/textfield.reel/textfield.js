/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
exports = typeof exports !== "undefined" ? exports : {};

var Montage = require("montage").Montage;
var Component = require("montage/ui/component").Component;

var TextField = exports.TextField = Montage.create(Component, {
    hasTemplate: {value: true},

    text: {
        set: function(value) {
            this._text = value;
            this.needsDraw = true;
        },
        get: function() {
            return this._text;
        }
    },

    _text: {
        serializable: true,
        enumerable: false,
        value: "default text"
    },

    draw: {value: function() {
        this.element.value = this.text;
    }}
});
