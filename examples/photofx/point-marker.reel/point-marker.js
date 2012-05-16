/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
var Montage = require("montage").Montage;
var Component = require("montage/ui/component").Component;

exports.PointMarker = Montage.create(Component, {

    _x: {
        enumerable: false,
        value: null
    },

    x: {
        enumerable: false,
        get: function() {
            return this._x;
        },
        set: Component.setPropertyAndNeedsDraw("_x")
    },

    _y: {
        enumerable: false,
        value: null
    },

    y: {
        enumerable: false,
        get: function() {
            return this._y;
        },
        set: Component.setPropertyAndNeedsDraw("_y")
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
