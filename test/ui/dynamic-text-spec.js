/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
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

    describe("DynamicText using html", function() {
        it("can be created", function() {
            expect(test.htmlText).toBeDefined();
        });
        it("wipes out it's content in initialization", function() {
            expect(testPage.getElementById("bar2")).toBeNull();
        });
        it("plain text value can be set", function() {
            test.htmlText.value = "foo";
            testPage.waitForDraw();
            runs(function() {
                expect(test.htmlText.element.textContent).toEqual("foo");
            })
        });
        it("plain text value can be set when allowedElements is set to null", function() {
            test.htmlText.allowedElements = null;
            test.htmlText.value = "bar";
            testPage.waitForDraw();
            runs(function() {
                expect(test.htmlText.element.textContent).toEqual("bar");
            })
        });
        it("html value can be set", function() {
            test.htmlText.allowedElements = ["span"];
            test.htmlText.value = "<span>bar</span>";
            testPage.waitForDraw();
            runs(function() {
                expect(test.htmlText.element.innerHTML).toEqual("<span>bar</span>");
            })
        });
        it("html value cannot be set if an element isn't allowed", function() {
            test.htmlText.allowedElements = ["span"];
            test.htmlText.value = '<span><a href="#out">bar</a></span>';
            testPage.waitForDraw();
            runs(function() {
                expect(test.htmlText.element.innerHTML).toEqual('');
            })
        });
    });

});
