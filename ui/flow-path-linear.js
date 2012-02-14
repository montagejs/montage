/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */

var Montage = require("montage").Montage;

var FlowPathLinear = exports.FlowPathLinear = Montage.create(Montage, {

    _variable: {
        enumerable: false,
        value: "time"
    },

    variable: {
        get: function () {
            return this._variable;
        },
        set: function (value) {
            switch (value) {
                case "speed":
                case "index":
                    this._variable = value;
                    break;
                default:
                    this._variable = "time";
            }
            this._updatePath();
        }
    },

    _origin: {
        enumerable: false,
        value: 0
    },

    origin: {
        get: function () {
            return this._origin;
        },
        set: function (value) {
            this._origin = value;
            this._updatePath();
        }
    },

    _multiplier: {
        enumerable: false,
        value: 1
    },

    multiplier: {
        get: function () {
            return this._multiplier;
        },
        set: function (value) {
            this._multiplier = value;
            this._updatePath();
        }
    },

    _path: {
        enumerable: false,
        value: "0"
    },

    path: {
        get: function () {
            return this._path;
        },
        set: function (value) {
            this._path = value;
        }
    },

    _updatePath: {
        enumerable: false,
        value: function () {
            this.path = "slide."+this._variable+"*("+this._multiplier+")-("+this._origin+")";
        }
    }
});
