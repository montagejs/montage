/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */

var Montage = require("montage").Montage;

var FlowPathSigmoid = exports.FlowPathSigmoid = Montage.create(Montage, {

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

    _smoothness: {
        enumerable: false,
        value: 0
    },

    smoothness: {
        get: function () {
            return this._smoothness;
        },
        set: function (value) {
            this._smoothness = value;
            this._updatePath();
        }
    },

    _scale: {
        enumerable: false,
        value: 0
    },

    scale: {
        get: function () {
            return this._scale;
        },
        set: function (value) {
            this._scale = value;
            this._updatePath();
        }
    },

    _width: {
        enumerable: false,
        value: 0
    },

    width: {
        get: function () {
            return this._width;
        },
        set: function (value) {
            this._width = value;
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

    _sigmoidCenter: {
        enumerable: false,
        value: 0
    },

    sigmoidCenter: {
        get: function () {
            return this._sigmoidCenter;
        },
        set: function (value) {
            this._sigmoidCenter = value;
            this._updatePath();
        }
    },

    _slope: {
        enumerable: false,
        value: 1
    },

    slope: {
        get: function () {
            return this._slope;
        },
        set: function (value) {
            this._slope = value;
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
            var s = "(slide."+this._variable+"-("+this._origin+"))";


/**            parseInt((a/(1+Math.pow(c, -(j*d)))-(a/2)+j*b)*1000)/1000;
            this.path = "parseInt(("+this._a+"/(1+Math.pow("+this._c+", -"+s+"*("+this._d+")))-(("+this._a+")/2)+"+s+"*("+this._b+"))*1000)/1000";*/
            this.path = "((("+this._width+")/(1+Math.pow(2, (("+this._sigmoidCenter+")-"+s+")/("+this._smoothness+"))))-("+(this._width/2)+")+"+s+"*("+this._slope+"))*("+this._scale+")";
        }
    }
});
