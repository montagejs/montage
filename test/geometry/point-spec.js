/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2012 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
var Montage = require("montage").Montage,
    Point = require("montage/core/geometry/point").Point;


describe("geometry/point-spec",
function() {
    describe("create",
    function() {
        describe("no arguments",
        function() {
            var point;

            beforeEach(function() {
                point = Montage.create(Point);
            });

            it("should be origin",
            function() {
                expect(point).not.toBeNull();
                expect(point.x).toBe(0);
                expect(point.y).toBe(0);
            });
        });
        describe("with x and y",
        function() {
            var point;

            beforeEach(function() {
                point = Montage.create(Point).init(10, 20);
            });

            it("should be (x, y)",
            function() {
                expect(point).not.toBeNull();
                expect(point.x).toBe(10);
                expect(point.y).toBe(20);
            });
        });

    });
    describe("interpolate between points",
    function() {
        describe("(0, 0) and (0, 0)",
        function() {
            var points;

            beforeEach(function() {
                points = [Montage.create(Point).init(0, 0), Montage.create(Point).init(0, 0)];
            });

            it("is correct positions",
            function() {
                var newPoint = Point.interpolate(.75, points[0], points[1]);
                expect(newPoint.x).toBe(0);
                expect(newPoint.y).toBe(0);
                newPoint = Point.interpolate(-.75, points[0], points[1]);
                expect(newPoint.x).toBe(0);
                expect(newPoint.y).toBe(0);
            });
        });
        describe("arbitrary",
        function() {
            var points;

            beforeEach(function() {
                points = [Montage.create(Point).init(10, -10), Montage.create(Point).init(-20, 10)];
            });

            it("is correct positions",
            function() {
                var newPoint = Point.interpolate(.25, points[0], points[1]);
                expect(newPoint.x).toBe(2.5);
                expect(newPoint.y).toBe(-5);
                newPoint = Point.interpolate( -.25, points[0], points[1]);
                expect(newPoint.x).toBe(17.5);
                expect(newPoint.y).toBe(-15);
            });
        });
        describe("arbitrary with specified precision",
        function() {
            var points;

            beforeEach(function() {
                points = [Montage.create(Point).init(.315, 0), Montage.create(Point).init(.54, .75)];
            });

            it("is correct positions",
            function() {
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
