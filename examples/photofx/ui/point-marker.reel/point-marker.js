/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2012 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
var Montage = require("montage").Montage;
var Component = require("montage/ui/component").Component;

exports.PointMarker = Montage.create(Component, {

    _x: {
        value: null
    },

    x: {
        get: function() {
            return this._x;
        },
        set: function(value) {
            if (value === this._x) {
                return;
            }

            this._x = value;
            this.needsDraw = true;
        },
        serializable: true
    },

    _y: {
        value: null
    },

    y: {
        get: function() {
            return this._y;
        },
        set: function(value) {
            if (value === this._y) {
                return;
            }

            this._y = value;
            this.needsDraw = true;
        },
        serializable: true
    },

    willDraw: {
        value: function() {
            this._width = this.element.offsetWidth;
            this._height = this.element.offsetHeight;
        }
    },

    draw: {
        value: function() {

            if (null === this.x || null === this.y) {
                this.element.classList.add("montage-hidden");
            } else {
                this.element.classList.remove("montage-hidden");
            }

            this.element.style.left = Math.floor(this.x - this._width/2)+ "px";
            this.element.style.top = Math.floor(this.y - this._height/2) + "px";
        }
    }

});
