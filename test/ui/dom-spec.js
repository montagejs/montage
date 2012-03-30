/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
var Montage = require("montage").Montage,
    TestPageLoader = require("support/testpageloader").TestPageLoader,
    Point = require("montage/core/geometry/point").Point,
    convertPointFromNodeToPage = require("montage/ui/dom").convertPointFromNodeToPage,
    convertPointFromPageToNode = require("montage/ui/dom").convertPointFromPageToNode;

var testPage = TestPageLoader.queueTest("dom", function() {
    describe("ui/dom-spec", function() {
        describe("convertPointFromNodeToPage parameter passing", function() {
            it("should not fail if no node passed", function() {
                var result;
                expect(function() {
                    result = convertPointFromNodeToPage(Point.create().init(0,0));
                }).not.toThrow();
                expect(result).toBeNull();
            });
            it("should not fail if null node passed", function() {
                var result;
                expect(function() {
                    result = convertPointFromNodeToPage(null,Point.create().init(0,0));
                }).not.toThrow();
                expect(result).toBeNull();
            });
            it("should not fail if all null passed", function() {
                var result;
                expect(function() {
                    result = convertPointFromNodeToPage(null, null);
                }).not.toThrow();
                expect(result).toBeNull();
            });
        });
        describe("convertPointFromPageToNode parameter passing", function() {
            it("should not fail if no node passed", function() {
                var result;
                expect(function() {
                    result = convertPointFromPageToNode(Point.create().init(0,0));
                }).not.toThrow();
                expect(result).toBeNull();
            });
            it("should not fail if null node passed", function() {
                var result;
                expect(function() {
                    result = convertPointFromPageToNode(null,Point.create().init(0,0));
                }).not.toThrow();
                expect(result).toBeNull();
            });
            it("should not fail if all null passed", function() {
                var result;
                expect(function() {
                    result = convertPointFromNodeToPage(null, null);
                }).not.toThrow();
                expect(result).toBeNull();
            });
        });
        describe("convertPointFrom functions", function() {
            describe("heading", function() {
                it("should return correct position", function() {
                    testConvertPoint(testPage.test.convertPoint1, 46,36,61,236);
                });
            });
            describe("paragraph", function() {
                it("should return correct position", function() {
                    testConvertPoint(testPage.test.convertPoint2, 46,43,61,243);
                });

                describe("including a link", function() {
                    it("should return correct position", function() {
                        testConvertPoint(testPage.test.convertPoint3, 46,43,61,243);
                    });
                })

                describe("including a link with border", function() {
                    it("should return correct position", function() {
                        testConvertPoint(testPage.test.convertPoint4, 46,43,61,243);
                    });
                });

                describe("translated", function() {
                    describe("including a link with border", function() {
                        it("should return correct position", function() {
                            testConvertPoint(testPage.test.convertPoint5, 56,43,71,243);
                        });
                    });
                    describe("including a link with border and a break", function() {
                        it("should return correct position", function() {
                            testConvertPoint(testPage.test.convertPoint6, 56,43,71,243);
                        });
                    });
                    describe(", rotated, and scaled including a link with border and a break", function() {
                        it("should return correct position", function() {
                            testConvertPoint(testPage.test.convertPoint7, 56,53,3,82);
                        });
                    });
                });
            });
        });

        describe("classList element property of an HTML element", function() {
            it("should return the class", function() {
                expect(function() {
                    testPage.test.html.classList;
                }).not.toThrow();
                expect(testPage.test.html.classList.item(0)).toEqual("classOne");
            });
        });

        describe("classList element property of an SVG element", function() {
            it("should return the class", function() {
                expect(function() {
                    testPage.test.svg.classList;
                }).not.toThrow();
                expect(testPage.test.svg.classList.item(0)).toEqual("classTwo");
            });
        });
   });
});

var testConvertPoint = function(element, x1, y1, x2, y2) {
    var point1, point2;
    point1 = convertPointFromNodeToPage(element, Point.create().init(0, 0));
    expect(Math.round(point1.x)).toEqual(x1);
    expect(Math.round(point1.y)).toEqual(y1);

    point2 = convertPointFromPageToNode(element, point1);
    expect(Math.round(point2.x)).toEqual(0);
    expect(Math.round(point2.y)).toEqual(0);

    point1 = convertPointFromNodeToPage(element, Point.create().init(15, 200));
    expect(Math.round(point1.x)).toEqual(x2);
    expect(Math.round(point1.y)).toEqual(y2);

    point2 = convertPointFromPageToNode(element, point1);
    expect(Math.round(point2.x)).toEqual(15);
    expect(Math.round(point2.y)).toEqual(200);
}
