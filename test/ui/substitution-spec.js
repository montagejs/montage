var Montage = require("montage").Montage,
    TestPageLoader = require("montage-testing/testpageloader").TestPageLoader;

TestPageLoader.queueTest("substitution-test/substitution-test", function(testPage) {
    describe("ui/substitution-spec", function() {
        var templateObjects;

        beforeEach(function() {
            templateObjects = testPage.test.templateObjects;
        });

        describe("pure dom arguments", function() {
            it("should not have dom content when switchValue is not defined", function() {
                var substitution = templateObjects.substitution1;

                expect(substitution.element.childNodes.length).toBe(0);
            });

            it("should have its switchElements configured", function() {
                var substitution = templateObjects.substitution1,
                    switchElementsKeys = Object.keys(substitution._switchElements);

                expect(switchElementsKeys.length).toBe(2);
                expect(switchElementsKeys).toHave("one");
                expect(switchElementsKeys).toHave("two");
            });

            it("should change its DOM content when switchValue is initially set", function() {
                var substitution = templateObjects.substitution1;

                substitution.switchValue = "one";

                testPage.waitForComponentDraw(substitution);
                runs(function() {
                    var title = substitution.element.querySelector(".title1");

                    expect(title).toBeDefined();
                });
            });

            it("should contain the content of the defined switchValue", function() {
                var substitution = templateObjects.substitution2,
                    title;

                title = substitution.element.querySelector(".title1");

                expect(title).toBeDefined();
            });

            it("should switch to the new content when switchValue is changed", function() {
                var substitution = templateObjects.substitution2;

                substitution.switchValue = "two";

                testPage.waitForComponentDraw(substitution);
                runs(function() {
                    var title = substitution.element.querySelector(".title2");

                    expect(title).toBeDefined();
                });
            });

            it("should switch to a content that was previously shown and removed", function() {
                var substitution = templateObjects.substitution2;

                substitution.switchValue = "one";

                testPage.waitForComponentDraw(substitution);
                runs(function() {
                    var title = substitution.element.querySelector(".title1");

                    expect(title).toBeDefined();
                });
            });
        });

        describe("arguments with components", function() {
            it("should draw components when switchValue is initially set", function() {
                var substitution = templateObjects.substitution3,
                    one = templateObjects.one3;

                one.value = "Title 1a";
                substitution.switchValue = "one";

                testPage.waitForComponentDraw(substitution);
                runs(function() {
                    expect(one.element.textContent).toBe("Title 1a");
                });
            });

            it("should draw a component that was previously removed", function() {
                var substitution = templateObjects.substitution3,
                    one = templateObjects.one3;

                substitution.switchValue = "two";

                testPage.waitForComponentDraw(substitution);
                runs(function() {
                    one.value = "Title 1b";

                    substitution.switchValue = "one";

                    testPage.waitForComponentDraw(substitution);
                    runs(function() {
                        expect(one.element.textContent).toBe("Title 1b");
                    });
                });
            });
        });

        describe("programmatic api", function() {
            it("should accept a new element to switch", function() {
                var substitution = templateObjects.substitution4,
                    element;

                element = document.createElement("div");
                element.textContent = "one";
                element.className = "one";

                substitution.addSwitchElement("one", element);
                expect(substitution._switchElements.one).toBe(element);
            });

            it("should switch to a programmaticaly added element", function() {
                var substitution = templateObjects.substitution4;

                substitution.switchValue = "one";

                testPage.waitForComponentDraw(substitution);
                runs(function() {
                    var one = substitution.element.querySelector(".one");

                    expect(one).toBeDefined();
                });
            });

            it("should not accept elements that have a parent node", function() {
                var substitution = templateObjects.substitution4,
                    text = templateObjects.text1;

                element = text.element;

                try {
                    substitution.addSwitchElement("two", element);
                    expect("test").toBe("fail");
                } catch (ex) {
                    expect(substitution._switchElements.two).toBeUndefined();
                }
            });
        });
    });
});
