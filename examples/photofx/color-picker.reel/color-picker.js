/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2012 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
var Montage = require("montage").Montage;
var Component = require("montage/ui/component").Component;

exports.ColorPicker = Montage.create(Component, {

    x: {
        value: null
    },

    y: {
        value: null
    },

    _currentColor: {
        value: null
    },

    currentColor: {
        get: function() {
            return this._currentColor;
        },
        set: function(value) {
            if (value === this._currentColor) {
                return;
            }

            this._currentColor = value;

            this.needsDraw = true;
        }
    },

    colorWell: {
        value: null
    },

    draw: {
        value: function() {
            var style = this.colorWell.style,
                currentColor;

            if (this.currentColor) {
                currentColor = this._currentColor;
                 style.backgroundColor = "rgb(" + currentColor[0] + "," + currentColor[1] + "," + currentColor[2] + ")";
            } else {
                style.backgroundColor = "rgb(0,0,0)";
            }
        }
    }

});
