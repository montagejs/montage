/*global require,exports,describe,it,expect */
var Montage = require("montage").Montage;
var TestPageLoader = require("support/testpageloader").TestPageLoader;
var Bindings = require("montage/core/bindings").Bindings;

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
                it("wipes out it's content in initialization if innerHTML is used", function() {
                    test.dynamicElement.innerHTML = void 0;
                    return testPage.nextDraw().then(function() {
                        expect(testPage.getElementById("bar2")).toBeNull();
                    });
                });
                it("plain text value can be set", function() {
                    test.dynamicElement.innerHTML = "foo";
                    return testPage.nextDraw().then(function() {
                        expect(test.dynamicElement.element.textContent).toEqual("foo");
                    })
                });
                it("plain text value can be set when allowedElements is set to null", function() {
                    test.dynamicElement.allowedTagNames = null;
                    test.dynamicElement.innerHTML = "bar";
                    return testPage.nextDraw().then(function() {
                        expect(test.dynamicElement.element.textContent).toEqual("bar");
                    })
                });
                it("null value can be set when allowedElements is set to null", function() {
                    test.dynamicElement.allowedTagNames = null;
                    test.dynamicElement.innerHTML = null;
                    return testPage.nextDraw().then(function() {
                        expect(test.dynamicElement.element.textContent).toEqual("");
                    })
                });
                it("plain text value can be set when allowedElements is set to a single tag", function() {
                    test.dynamicElement.allowedTagNames = ["b"];
                    test.dynamicElement.innerHTML = "bar";
                    return testPage.nextDraw().then(function() {
                        expect(test.dynamicElement.element.textContent).toEqual("bar");
                        expect(test.dynamicElement._contentNode).toBeNull();
                    })
                });
                it("null value can be set when allowedElements is set to a single tag", function() {
                    test.dynamicElement.allowedTagNames = ["b"];
                    test.dynamicElement.innerHTML = null;
                    return testPage.nextDraw().then(function() {
                        expect(test.dynamicElement.element.textContent).toEqual("");
                        expect(test.dynamicElement._contentNode).toBeNull();
                    })
                });
                it("html value can be set", function() {
                    test.dynamicElement.allowedTagNames = ["span"];
                    test.dynamicElement.innerHTML = "<span>bar</span>";
                    return testPage.nextDraw().then(function() {
                        expect(test.dynamicElement.element.innerHTML).toEqual("<span>bar</span>");
                    })
                });
                it("html value cannot be set if allowedTagNames is an empty array", function() {
                    test.dynamicElement.allowedTagNames = [];
                    test.dynamicElement.innerHTML = '<span>bar</span>';
                    return testPage.nextDraw().then(function() {
                        expect(test.dynamicElement.element.innerHTML).toEqual('');
                    })
                });
                it("html value cannot be set if an element isn't allowed", function() {
                    test.dynamicElement.allowedTagNames = ["span"];
                    test.dynamicElement.innerHTML = '<span><a href="#out">bar</a></span>';
                    return testPage.nextDraw().then(function() {
                        expect(test.dynamicElement.element.innerHTML).toEqual('');
                    })
                });
                it("html value can be set with multiple allowed tags", function() {
                    test.dynamicElement.allowedTagNames = ["span", "a"];
                    test.dynamicElement.innerHTML = '<span><a href="#out">bar</a></span>';
                    return testPage.nextDraw().then(function() {
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
                        return testPage.nextDraw().then(function() {
                            expect(test.dynamicElementClassList.element.classList.contains("class1")).toBeFalsy();
                            expect(test.dynamicElementClassList.element.classList.contains("class2")).toBeTruthy();
                        })
                    });
                    it("should be possible to bind to a new class", function() {
                        //test.class3 = true;
                        Bindings.defineBinding(test.dynamicElementClassList, "classList.has('newClass')", {
                            source: test,
                            "<-": "class3",
                            trace: true
                        });
                        test.class3 = true;
                        expect(test.dynamicElementClassList.classList.contains("newClass")).toBeTruthy();
                        return testPage.nextDraw().then(function() {
                            expect(test.dynamicElementClassList.element.classList.contains("newClass")).toBeTruthy();
                        })
                    });
                });
                describe("with programmatic API", function() {
                    it("should correctly add a class", function() {
                        test.dynamicElementClassList.classList.add("myclass");
                        return testPage.nextDraw().then(function() {
                            expect(test.dynamicElementClassList.element.classList.contains("myclass")).toBeTruthy();
                        })
                    });
                    it("should correctly remove a class", function() {
                        test.dynamicElementClassList.classList.remove("myclass");
                        return testPage.nextDraw().then(function() {
                            expect(test.dynamicElementClassList.element.classList.contains("myclass")).toBeFalsy();
                        })
                    });
                    it("should correctly toggle a class", function() {
                        test.dynamicElementClassList.classList.toggle("myclass");
                        return testPage.nextDraw().then(function() {
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
                        return testPage.nextDraw().then(function() {
                            expect(test.dynamicElementClassInMarkup.element.classList.contains("markupClass1")).toBeFalsy();
                        })
                    });
                });
            });

        });
    });
});
