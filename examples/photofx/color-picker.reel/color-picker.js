/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
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
        enumerable: false,
        value: null
    },

    currentColor: {
        enumerable: false,
        get: function() {
            return this._currentColor;
        },
        set: Component.setPropertyAndNeedsDraw("_currentColor")
    },

    colorWell: {
        enumerable: false,
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
