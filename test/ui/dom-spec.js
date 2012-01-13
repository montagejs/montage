/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
var Montage = require("montage").Montage,
    TestPageLoader = require("support/testpageloader").TestPageLoader;

var testPage = TestPageLoader.queueTest("dom", function() {
    describe("ui/dom-spec", function() {

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