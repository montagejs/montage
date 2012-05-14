/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
/*global require,exports,describe,it,expect */
var Montage = require("montage").Montage,
    TestPageLoader = require("support/testpageloader").TestPageLoader;

var testPage = TestPageLoader.queueTest("dynamic-element-test", function() {
    var test = testPage.test;

    describe("ui/dynamic-element-spec", function() {
        it("should load", function() {
            expect(testPage.loaded).toBe(true);
        });


        describe("DynamicElement setting innerHTML", function() {
            it("can be created", function() {
                expect(test.dynamicElement).toBeDefined();
            });
            it("wipes out it's content in initialization", function() {
                expect(testPage.getElementById("bar2")).toBeNull();
            });
            it("plain text value can be set", function() {
                test.dynamicElement.innerHTML = "foo";
                testPage.waitForDraw();
                runs(function() {
                    expect(test.dynamicElement.element.textContent).toEqual("foo");
                })
            });
            it("plain text value can be set when allowedElements is set to null", function() {
                test.dynamicElement.allowedTagNames = null;
                test.dynamicElement.innerHTML = "bar";
                testPage.waitForDraw();
                runs(function() {
                    expect(test.dynamicElement.element.textContent).toEqual("bar");
                })
            });
            it("null value can be set when allowedElements is set to null", function() {
                test.dynamicElement.allowedTagNames = null;
                test.dynamicElement.innerHTML = null;
                testPage.waitForDraw();
                runs(function() {
                    expect(test.dynamicElement.element.textContent).toEqual("");
                })
            });
            it("plain text value can be set when allowedElements is set to a single tag", function() {
                test.dynamicElement.allowedTagNames = ["b"];
                test.dynamicElement.innerHTML = "bar";
                testPage.waitForDraw();
                runs(function() {
                    expect(test.dynamicElement.element.textContent).toEqual("bar");
                    expect(test.dynamicElement._contentNode).toBeNull();
                })
            });
            it("null value can be set when allowedElements is set to a single tag", function() {
                test.dynamicElement.allowedTagNames = ["b"];
                test.dynamicElement.innerHTML = null;
                testPage.waitForDraw();
                runs(function() {
                    expect(test.dynamicElement.element.textContent).toEqual("");
                    expect(test.dynamicElement._contentNode).toBeNull();
                })
            });
            it("html value can be set", function() {
                test.dynamicElement.allowedTagNames = ["span"];
                test.dynamicElement.innerHTML = "<span>bar</span>";
                testPage.waitForDraw();
                runs(function() {
                    expect(test.dynamicElement.element.innerHTML).toEqual("<span>bar</span>");
                })
            });
            it("html value cannot be set if allowedTagNames is an empty array", function() {
                test.dynamicElement.allowedTagNames = [];
                test.dynamicElement.innerHTML = '<span>bar</span>';
                testPage.waitForDraw();
                runs(function() {
                    expect(test.dynamicElement.element.innerHTML).toEqual('');
                })
            });
            it("html value cannot be set if an element isn't allowed", function() {
                test.dynamicElement.allowedTagNames = ["span"];
                test.dynamicElement.innerHTML = '<span><a href="#out">bar</a></span>';
                testPage.waitForDraw();
                runs(function() {
                    expect(test.dynamicElement.element.innerHTML).toEqual('');
                })
            });
            it("html value can be set with multiple allowed tags", function() {
                test.dynamicElement.allowedTagNames = ["span", "a"];
                test.dynamicElement.innerHTML = '<span><a href="#out">bar</a></span>';
                testPage.waitForDraw();
                runs(function() {
                    expect(test.dynamicElement.element.innerHTML).toEqual('<span><a href="#out">bar</a></span>');
                })
            });
        });
    });
});
