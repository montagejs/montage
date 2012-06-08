/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2012 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
/**
	@module montage/core/geometry/point
    @requires montage/core/core
*/
var Montage = require("montage").Montage;
/**
 @class module:montage/core/geometry/point.Point
 @extends module:montage/core/core.Montage
 */

exports.Point = Montage.create(Montage, /** @lends module:montage/core/geometry/point.Point# */ {
    init: {
        enumerable: false,
        value: function(x, y) {
            this.x = x === null ? 0 : x;
            this.y = y === null ? 0 : y;
            return this;
        }
    },
/**
    Interpolates between two points.
    @function
    @param {Axis} percent The interpolation percentage.
    @param {Axis} point0 The 0 interpolation point.
    @param {Axis} point1 The 1 interpolation point.
    @param {Axis} precision The interpolation precision.
    @returns Montage.create(Point).init(xValue, yValue)
    */
    interpolate: {
        enumerable: false,
        value: function(percent, point0, point1, precision) {
            var xValue,
                yValue;
            xValue = point0.x + (point1.x - point0.x) * percent;
            yValue = point0.y + (point1.y - point0.y) * percent;
            if (precision > 0) {
                xValue = Math.round(xValue * precision) / precision;
                yValue = Math.round(yValue * precision) / precision;
            }
            return exports.Point.create().init(xValue, yValue);
        }
    },
/**
        The x axis point.
        @type {Number}
        @default  0
    */
    x: {
        enumerable: true,
        value: 0
    },
/**
        The y axis point.
        @type {Number}
        @default  0
    */
    y: {
        enumerable: true,
        value: 0
    }
});
