/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2012 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
/*global require,exports,describe,it,expect */
var Montage = require("montage").Montage,
    TestPageLoader = require("support/testpageloader").TestPageLoader;

var testPage = TestPageLoader.queueTest("dynamic-text-test", function() {
    var test = testPage.test;

    describe("ui/dynamic-text-spec", function() {
        it("should load", function() {
            expect(testPage.loaded).toBe(true);
        });

        describe("DynamicText", function() {
            it("wipes out it's content in initialization", function() {
                expect(testPage.getElementById("bar")).toBeNull();
            });
        });

        describe("DynamicText using plain text", function() {
            it("can be created", function() {
                expect(test.plainText).toBeDefined();
            });
            it("value can be set", function() {
                test.plainText.value = "foo";
                testPage.waitForDraw();
                runs(function() {
                    expect(test.plainText.element.textContent).toEqual("foo");
                })
            });
            it("value can be reset", function() {
                test.plainText.value = "";
                testPage.waitForDraw();
                runs(function() {
                    expect(test.plainText.element.textContent).toEqual("");
                })
            });
        });

    });

});
