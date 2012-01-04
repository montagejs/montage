/* <copyright>
Copyright (c) 2012, Motorola Mobility, Inc

All Rights Reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

  - Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
  - Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
  - Neither the name of Motorola Mobility nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
</copyright> */
var Montage = require("montage").Montage,
    Point = require("montage/core/geometry/point").Point,
    CubicBezier = require("montage/core/geometry/cubic-bezier").CubicBezier;

describe("geometry/cubicbezier-spec",
function() {
    describe("creation with no args",
    function() {
        var cubicBezier;

        beforeEach(function() {
            cubicBezier = Montage.create(CubicBezier);
        });

        it("should be a linear CubicBezier",
        function() {
            expect(cubicBezier.p0).toEqual(Montage.create(Point).init(0, 0));
            expect(cubicBezier.p1).toEqual(Montage.create(Point).init(0, 0));
            expect(cubicBezier.p2).toEqual(Montage.create(Point).init(1, 1));
            expect(cubicBezier.p3).toEqual(Montage.create(Point).init(1, 1));
        });
    });
    describe("position along curve",
    function() {
        var cubicBezier;

        beforeEach(function() {
            cubicBezier = CubicBezier.create(CubicBezier).init([Montage.create(Point).init(.42, 0), Montage.create(Point).init(.58, 1)]);
        });

        it("is undefined @ t < 1 & t > 1",
        function() {
            expect(cubicBezier.position( - 1)).not.toBeDefined();
            expect(cubicBezier.position( 2)).not.toBeDefined();
        });

        it("is correct",
        function() {
            expect(cubicBezier.position(0)).toEqual(Montage.create(Point).init(0, 0));
            expect(cubicBezier.position(0.1)).toEqual(Montage.create(Point).init(.11871999999999998, .02799999999999999));
            expect(cubicBezier.position(0.5)).toEqual(Montage.create(Point).init(.5, .5));
            expect(cubicBezier.position(0.9)).toEqual(Montage.create(Point).init(.8812800000000001, .9720000000000001));
            expect(cubicBezier.position(1)).toEqual(Montage.create(Point).init(1, 1));
        });
    });
    describe("makeScaffolding for curve",
    function() {
        var cubicBezier;

        beforeEach(function() {
            cubicBezier = CubicBezier.create(CubicBezier).init([Montage.create(Point).init(.42, 0), Montage.create(Point).init(.58, 1)]);
            cubicBezier.makeScaffolding(.25);
        });

        it("is correct",
        function() {
            expect(cubicBezier.p01).toEqual(Montage.create(Point).init(.315, 0));
            expect(cubicBezier.p12).toEqual(Montage.create(Point).init(.54, .75));
            expect(cubicBezier.p23).toEqual(Montage.create(Point).init(.895, 1));
            expect(cubicBezier.p012).toEqual(Montage.create(Point).init(.48375, .5625));
            expect(cubicBezier.p123).toEqual(Montage.create(Point).init(.80625, .9375));
            expect(cubicBezier.p0123).toEqual(Montage.create(Point).init(.725625, .84375));
        });
    });
    describe("split for curve",
    function() {
        var cubicBezier;

        beforeEach(function() {
            cubicBezier = cubicBezier = CubicBezier.create(CubicBezier).init([Montage.create(Point).init(.42, 0), Montage.create(Point).init(.58, 1)]);
            cubicBezier = cubicBezier.split(.25);
        });

        it("is correct",
        function() {
            expect(cubicBezier.p0).toEqual(Montage.create(Point).init(0, 0));
            expect(cubicBezier.p1).toEqual(Montage.create(Point).init(.315, 0));
            expect(cubicBezier.p2).toEqual(Montage.create(Point).init(.48375, .5625));
            expect(cubicBezier.p3).toEqual(Montage.create(Point).init(.725625, .84375));
        });
    });
    describe("splitToTimingFunction for curve",
    function() {
        var cubicBezier;

        beforeEach(function() {
            cubicBezier = cubicBezier = CubicBezier.create(CubicBezier).init([Montage.create(Point).init(.42, 0), Montage.create(Point).init(.58, 1)]);
            cubicBezier = cubicBezier.splitToTimingFunction(.25);
        });

        it("is correct",
        function() {
            expect(cubicBezier.p0).toEqual(Montage.create(Point).init(0, 0));
            expect(cubicBezier.p1).toEqual(Montage.create(Point).init(.434108527131783, 0));
            expect(cubicBezier.p2).toEqual(Montage.create(Point).init(.6666666666666667, .6666666666666666));
            expect(cubicBezier.p3).toEqual(Montage.create(Point).init(1, 1));
        });
    });
});
