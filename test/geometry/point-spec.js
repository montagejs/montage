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
var Montage = require("montage").Montage,
    Point = require("montage/core/geometry/point").Point;


describe("geometry/point-spec",
function () {
    describe("create",
    function () {
        describe("no arguments",
        function () {
            var point;

            beforeEach(function () {
                point = new Point();
            });

            it("should be origin",
            function () {
                expect(point).not.toBeNull();
                expect(point.x).toBe(0);
                expect(point.y).toBe(0);
            });
        });
        describe("with x and y",
        function () {
            var point;

            beforeEach(function () {
                point = new Point().init(10, 20);
            });

            it("should be (x, y)",
            function () {
                expect(point).not.toBeNull();
                expect(point.x).toBe(10);
                expect(point.y).toBe(20);
            });
        });

    });
    describe("interpolate between points",
    function () {
        describe("(0, 0) and (0, 0)",
        function () {
            var points;

            beforeEach(function () {
                points = [new Point().init(0, 0), new Point().init(0, 0)];
            });

            it("is correct positions",
            function () {
                var newPoint = Point.interpolate(.75, points[0], points[1]);
                expect(newPoint.x).toBe(0);
                expect(newPoint.y).toBe(0);
                newPoint = Point.interpolate(-.75, points[0], points[1]);
                expect(newPoint.x).toBe(0);
                expect(newPoint.y).toBe(0);
            });
        });
        describe("arbitrary",
        function () {
            var points;

            beforeEach(function () {
                points = [new Point().init(10, -10), new Point().init(-20, 10)];
            });

            it("is correct positions",
            function () {
                var newPoint = Point.interpolate(.25, points[0], points[1]);
                expect(newPoint.x).toBe(2.5);
                expect(newPoint.y).toBe(-5);
                newPoint = Point.interpolate( -.25, points[0], points[1]);
                expect(newPoint.x).toBe(17.5);
                expect(newPoint.y).toBe(-15);
            });
        });
        describe("arbitrary with specified precision",
        function () {
            var points;

            beforeEach(function () {
                points = [new Point().init(.315, 0), new Point().init(.54, .75)];
            });

            it("is correct positions",
            function () {
                var newPoint = Point.interpolate(.25, points[0], points[1]);
                expect(newPoint.x).toBe(.37125);
                newPoint = Point.interpolate(.25, points[0], points[1], 10);
                expect(newPoint.x).toBe(.4);
                newPoint = Point.interpolate(.25, points[0], points[1], 1000);
                expect(newPoint.x).toBe(.371);
                newPoint = Point.interpolate(.25, points[0], points[1], 1000000);
                expect(newPoint.x).toBe(.37125);
             });
        });
    });
});
