/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
var Montage = require("montage").Montage;
var Component = require("montage/ui/component").Component;

exports.ColorPicker = Montage.create(Component, {

    _currentColor: {
        enumerable: false,
        value: null
    },

    currentColor: {
        enumerable: false,
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
        enumerable: false,
        value: null
    },

    prepareForDraw: {
        value: function() {
            document.application.addEventListener("colorpick", this, false);
        }
    },

    handleColorpick: {
        value: function(event) {
            var self = this;
            this._deferredColor = event.color;

            // Deferring accepting a color as a bit of a performance optimization to improve magnifier drawing
            if (!this._colorPickTimeout) {
                this._colorPickTimeout = setTimeout(function() {
                    self.currentColor = self._deferredColor;
                    self._colorPickTimeout = null;
                }, 100);
            }
        }
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
