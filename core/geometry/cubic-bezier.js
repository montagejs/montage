/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2012 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
/**
	@module montage/core/geometry/cubic-bezier
    @requires montage/core/core
    @requires montage/core/geometry/point
*/
var Montage = require("montage").Montage;
var Point = require("core/geometry/point").Point;
/**
 @class module:montage/core/geometry/cubic-bezier.CubicBezier
 @extends module:montage/core/core.Montage
 */

var CubicBezier = exports.CubicBezier = Montage.create(Montage, /** @lends module:montage/core/geometry/cubic-bezier.CubicBezier# */{
/**
    @function
    @param {Array} controlPoints Control points.
    @returns itself
    */
    init: {
        enumerable: false,
        value: function(controlPoints) {
            if (controlPoints !== null) {
                if (controlPoints.length === 2) {
                    this.p1 = controlPoints[0];
                    this.p2 = controlPoints[1];
                } else if (controlPoints.length === 4) {
                    this.p0 = controlPoints[0];
                    this.p1 = controlPoints[1];
                    this.p2 = controlPoints[2];
                    this.p3 = controlPoints[3];
                }
            }
            return this;
        }
    },
/**
    @function
    @param {Number} t Control point.
    @returns itself or Montage.create(Point).init(this.p0.x * b1 + this.p1.x * b2 + this.p2.x * b3 + this.p3.x * b4,
                this.p0.y * b1 + this.p1.y * b2 + this.p2.y * b3 + this.p3.y * b4)
    */
    position: {
        enumerable: false,
        value: function(t) {
            if (t < 0 || t > 1) {
                return;
            }

            t = 1 - t;

            var b1 = t * t * t,
                b2 = 3 * t * t * (1 - t),
                b3 = 3 * t * (1 - t) * (1 - t),
                b4 = (1 - t) * (1 - t) * (1 - t);
            return Montage.create(Point).init(this.p0.x * b1 + this.p1.x * b2 + this.p2.x * b3 + this.p3.x * b4,
                this.p0.y * b1 + this.p1.y * b2 + this.p2.y * b3 + this.p3.y * b4);
        }
    },
/**
    @function
    @param {Number} t Control point.
    @returns CubicBezier.create(CubicBezier).init([this.p0, this.p01, this.p012, this.p0123])
    */
    split: {
        enumerable: false,
        value: function(t) {
            this.makeScaffolding(t);
            return CubicBezier.create(CubicBezier).init([this.p0, this.p01, this.p012, this.p0123]);
        }
    },
/**
    @function
    @param {Number} t Control point.
    @returns CubicBezier.create(CubicBezier).init([Montage.create(Point).init(this.p01.x / xScale, this.p01.y / yScale), Montage.create(Point).init(this.p012.x / xScale, this.p012.y / yScale)])
    */
    splitToTimingFunction: {
        enumerable: false,
        value: function(t) {
            this.makeScaffolding(t);
            // p0123 x and y are the scale
            var xScale = this.p0123.x,
                yScale = this.p0123.y;
            return CubicBezier.create(CubicBezier).init([Montage.create(Point).init(this.p01.x / xScale, this.p01.y / yScale), Montage.create(Point).init(this.p012.x / xScale, this.p012.y / yScale)]);
        }
    },
/**
    @function
    @param {Number} t Control point.
    */
    makeScaffolding: {
        enumerable: false,
        value: function(t) {

            t = 1 - t;

            var precision = 1000000;
            Montage.defineProperty(this, 'p01', {
                value: Point.interpolate(t, this.p0, this.p1, precision)
            });
            Montage.defineProperty(this, 'p12', {
                value: Point.interpolate(t, this.p1, this.p2, precision)
            });
            Montage.defineProperty(this, 'p23', {
                value: Point.interpolate(t, this.p2, this.p3, precision)
            });
            Montage.defineProperty(this, 'p012', {
                value: Point.interpolate(t, this.p01, this.p12, precision)
            });
            Montage.defineProperty(this, 'p123', {
                value: Point.interpolate(t, this.p12, this.p23, precision)
            });
            Montage.defineProperty(this, 'p0123', {
                value: Point.interpolate(t, this.p012, this.p123, precision)
            });
        }
    },
/**
        First control point in bezier curve.
        @type {Property}
        @default {Number} Montage.create(Point).init(0, 0)
    */
    p0: {
        enumerable: true,
        value: Montage.create(Point).init(0, 0)
    },
/**
        Second control point in bezier curve.
        @type {Property}
        @default {Number} Montage.create(Point).init(0, 0)
    */
    p1: {
        enumerable: true,
        value: Montage.create(Point).init(0, 0)
    },
/**
        Third control point in bezier curve.
        @type {Property}
        @default {Number} Montage.create(Point).init(1, 1)
    */
    p2: {
        enumerable: true,
        value: Montage.create(Point).init(1, 1)
    },
/**
        Fourth control point in bezier curve.
        @type {Property}
        @default {Number}M ontage.create(Point).init(1, 1)
    */
    p3: {
        enumerable: true,
        value: Montage.create(Point).init(1, 1)
    }
});
