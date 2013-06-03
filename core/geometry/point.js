/* <copyright>
Copyright (c) 2012, Motorola Mobility LLC.
All Rights Reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

* Redistributions of source code must retain the above copyright notice,
  this list of conditions and the following disclaimer.

* Redistributions in binary form must reproduce the above copyright notice,
  this list of conditions and the following disclaimer in the documentation
  and/or other materials provided with the distribution.

* Neither the name of Motorola Mobility LLC nor the names of its
  contributors may be used to endorse or promote products derived from this
  software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE
LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
POSSIBILITY OF SUCH DAMAGE.
</copyright> */
/**
	@module montage/core/geometry/point
    @requires montage/core/core
*/
var Montage = require("montage").Montage;
/**
 @class Point
 @extends Montage
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
