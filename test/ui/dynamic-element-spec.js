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

        describe("DynamicElement", function() {

            describe("setting innerHTML", function() {
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

            describe("using classList", function() {
                describe("with bindings", function() {
                    it("should correctly initialize from a template", function() {
                        expect(test.dynamicElementClassList.element.classList.contains("class1")).toBeTruthy();
                        expect(test.dynamicElementClassList.element.classList.contains("class2")).toBeFalsy();
                    });
                    it("should reflect changes to the classList's properties", function() {
                        test.class1 = false;
                        test.class2 = true;
                        testPage.waitForDraw();
                        runs(function() {
                            expect(test.dynamicElementClassList.element.classList.contains("class1")).toBeFalsy();
                            expect(test.dynamicElementClassList.element.classList.contains("class2")).toBeTruthy();
                        })
                    });
                    it("should be possible to bind to a new class", function() {
                        Object.defineBinding(test.dynamicElementClassList, "classList.newClass", {boundObject: test, boundObjectPropertyPath: "class2", oneway: true});
                        testPage.waitForDraw();
                        runs(function() {
                            expect(test.dynamicElementClassList.element.classList.contains("newClass")).toBeTruthy();
                        })
                    });
                });
                describe("with programmatic API", function() {
                    it("should correctly add a class", function() {
                        test.dynamicElementClassList.classList.add("myclass");
                        testPage.waitForDraw();
                        runs(function() {
                            expect(test.dynamicElementClassList.element.classList.contains("myclass")).toBeTruthy();
                        })
                    });
                    it("should correctly remove a class", function() {
                        test.dynamicElementClassList.classList.remove("myclass");
                        testPage.waitForDraw();
                        runs(function() {
                            expect(test.dynamicElementClassList.element.classList.contains("myclass")).toBeFalsy();
                        })
                    });
                    it("should correctly toggle a class", function() {
                        test.dynamicElementClassList.classList.toggle("myclass");
                        testPage.waitForDraw();
                        runs(function() {
                            expect(test.dynamicElementClassList.element.classList.contains("myclass")).toBeTruthy();
                        })
                    });
                    it("should correctly report contains state of a class", function() {
                        expect(test.dynamicElementClassList.classList.contains("myclass")).toBeTruthy();
                    });
                });
                describe("with classes in original element", function() {
                    it("should correctly add a class based on markup", function() {
                        expect(test.dynamicElementClassInMarkup.classList.contains("markupClass1")).toBeTruthy();
                        expect(test.dynamicElementClassInMarkup.classList.contains("markupClass2")).toBeTruthy();
                    });
                    it("should be able to change those classes as if they were added via the component", function() {
                        test.dynamicElementClassInMarkup.classList.toggle("markupClass1");
                        testPage.waitForDraw();
                        runs(function() {
                            expect(test.dynamicElementClassInMarkup.element.classList.contains("markupClass1")).toBeFalsy();
                        })
                    });
                });
            });

        });
    });
});
