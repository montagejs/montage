/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
/*global require,exports,describe,it,expect */
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

var testPage = TestPageLoader.queueTest("application-test", {src: "ui/application-test/application-test.html"}, function() {
    var test = testPage.test;

    describe("ui/application-spec", function() {
        it("should load", function() {
            expect(testPage.loaded).toBe(true);
        });

    });
});

var testPage = TestPageLoader.queueTest("application-test-subtype", {src: "ui/application-test/application-test-subtype.html"}, function() {
    var test = testPage.test;

    describe("ui/application-spec", function() {
        it("should load", function() {
            expect(testPage.loaded).toBe(true);
        });

        describe("Application", function() {

            describe("subtyping", function() {
                it("should use defined subtype", function() {
                    expect(test.testedComponent.application.testProperty).toBeTruthy();
                });

            });
        });
    });
});
