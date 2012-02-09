/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
var Montage = require("montage").Montage,
    TestPageLoader = require("support/testpageloader").TestPageLoader;

var testPage = TestPageLoader.queueTest("application-as-application", {src: "ui/application/as-application.html"}, function() {
    describe("ui/application-spec", function() {
        describe("Application used in application label", function() {
            it("should draw correctly", function() {
                expect(testPage.test).toBeDefined();
            });
            it("should be THE application", function() {
                expect(testPage.test.theOne).toEqual("true");
            });
        });
   });
});
var testPage = TestPageLoader.queueTest("application-as-owner", {src: "ui/application/as-owner.html"}, function() {
    describe("ui/application-spec", function() {
        describe("Application used in owner label", function() {
            it("should draw correctly", function() {
                expect(testPage.test).toBeDefined();
            });
        });
   });
});
