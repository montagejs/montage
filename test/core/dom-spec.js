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
    TestPageLoader = require("montage-testing/testpageloader").TestPageLoader,
    Point = require("montage/core/geometry/point").Point,
    convertPointFromNodeToPage = require("montage/core/dom").convertPointFromNodeToPage,
    convertPointFromPageToNode = require("montage/core/dom").convertPointFromPageToNode;

TestPageLoader.queueTest("dom/dom", function (testPage) {
    describe("core/dom-spec", function () {
        describe("convertPointFromNodeToPage parameter passing", function () {
            it("should not fail if no node passed", function () {
                var result;
                expect(function () {
                    result = convertPointFromNodeToPage(new Point().init(0,0));
                }).not.toThrow();
                expect(result).toBeNull();
            });
            it("should not fail if null node passed", function () {
                var result;
                expect(function () {
                    result = convertPointFromNodeToPage(null,new Point().init(0,0));
                }).not.toThrow();
                expect(result).toBeNull();
            });
            it("should not fail if all null passed", function () {
                var result;
                expect(function () {
                    result = convertPointFromNodeToPage(null, null);
                }).not.toThrow();
                expect(result).toBeNull();
            });
        });
        describe("convertPointFromPageToNode parameter passing", function () {
            it("should not fail if no node passed", function () {
                var result;
                expect(function () {
                    result = convertPointFromPageToNode(new Point().init(0,0));
                }).not.toThrow();
                expect(result).toBeNull();
            });
            it("should not fail if null node passed", function () {
                var result;
                expect(function () {
                    result = convertPointFromPageToNode(null,new Point().init(0,0));
                }).not.toThrow();
                expect(result).toBeNull();
            });
            it("should not fail if all null passed", function () {
                var result;
                expect(function () {
                    result = convertPointFromNodeToPage(null, null);
                }).not.toThrow();
                expect(result).toBeNull();
            });
        });
        describe("convertPointFrom functions", function () {
            describe("heading", function () {
                it("should return correct position", function () {
                    testConvertPoint(testPage.test.convertPoint1, 46,36,61,236);
                });
            });
            describe("paragraph", function () {
                it("should return correct position", function () {
                    testConvertPoint(testPage.test.convertPoint2, 46,43,61,243);
                });

                describe("including a link", function () {
                    it("should return correct position", function () {
                        testConvertPoint(testPage.test.convertPoint3, 46,43,61,243);
                    });
                })

                describe("including a link with border", function () {
                    it("should return correct position", function () {
                        testConvertPoint(testPage.test.convertPoint4, 46,43,61,243);
                    });
                });

                describe("translated", function () {
                    describe("including a link with border", function () {
                        it("should return correct position", function () {
                            testConvertPoint(testPage.test.convertPoint5, 56,43,71,243);
                        });
                    });
                    describe("including a link with border and a break", function () {
                        it("should return correct position", function () {
                            testConvertPoint(testPage.test.convertPoint6, 56,43,71,243);
                        });
                    });
                    describe(", rotated, and scaled including a link with border and a break", function () {
                        it("should return correct position", function () {
                            testConvertPoint(testPage.test.convertPoint7, 56,53,3,82);
                        });
                    });
                });
            });
        });

        describe("classList element property of an HTML element", function () {
            it("should return the class", function () {
                expect(function () {
                    testPage.test.html.classList;
                }).not.toThrow();
                expect(testPage.test.html.classList.item(0)).toEqual("classOne");
            });
        });

        describe("classList element property of an SVG element", function () {
            it("should return the class", function () {
                expect(function () {
                    testPage.test.svg.classList;
                }).not.toThrow();
                expect(testPage.test.svg.classList.item(0)).toEqual("classTwo");
            });
        });
   });
});

var testConvertPoint = function (element, x1, y1, x2, y2) {
    var point1, point2;
    point1 = convertPointFromNodeToPage(element, new Point().init(0, 0));
    expect(Math.round(point1.x)).toEqual(x1);
    expect(Math.round(point1.y)).toEqual(y1);

    point2 = convertPointFromPageToNode(element, point1);
    expect(Math.round(point2.x)).toEqual(0);
    expect(Math.round(point2.y)).toEqual(0);

    point1 = convertPointFromNodeToPage(element, new Point().init(15, 200));
    expect(Math.round(point1.x)).toEqual(x2);
    expect(Math.round(point1.y)).toEqual(y2);

    point2 = convertPointFromPageToNode(element, point1);
    expect(Math.round(point2.x)).toEqual(15);
    expect(Math.round(point2.y)).toEqual(200);
}
