/**
 * @module montage/core/geometry/point
 * @requires montage/core/core
 */
var Montage = require("montage").Montage;

/**
 * @class Point
 * @extends Montage
 */

exports.Point = Montage.specialize( /** @lends Point# */ {
    init: {
        enumerable: false,
        value: function(x, y) {
            this.x = x === null ? 0 : x;
            this.y = y === null ? 0 : y;
            return this;
        }
    },

    /**
     * The x axis point.
     * @type {number}
     * @default  0
     */
    x: {
        enumerable: true,
        value: 0
    },

    /**
     * The y axis point.
     * @type {number}
     * @default  0
     */
    y: {
        enumerable: true,
        value: 0
    }

}, {

    /**
     * Interpolates between two points.
     * @function
     * @param {Axis} percent The interpolation percentage.
     * @param {Axis} point0 The 0 interpolation point.
     * @param {Axis} point1 The 1 interpolation point.
     * @param {Axis} precision The interpolation precision.
     * @returns new Point().init(xValue, yValue)
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
            return new exports.Point().init(xValue, yValue);
        }
    }

});

