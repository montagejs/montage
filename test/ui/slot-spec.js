/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
var Montage = require("montage").Montage,
    TestPageLoader = require("support/testpageloader").TestPageLoader;

var testPage = TestPageLoader.queueTest("slot-test", function() {
    describe("ui/slot-spec", function() {
        it("should load", function() {
            expect(testPage.loaded).toBeTruthy();
        });

        var slot;

        beforeEach(function() {
            console.log("CLEAR!")
            slot = testPage.test.slot;
            slot.content = null;
        });

        describe("when first loaded", function() {
            it("it should have no initial content", function() {
                expect(slot.content).toBeNull();
                expect(slot.element.childNodes.length).toEqual(0);
            });
        });

        describe("when inserting a component", function() {

            // TODO it's a shame that the state of all the components is preserved from spec to spec
            // that means that once this componentWithNoElement is put into a slot and given an element
            // it will have an element for all subsequent specs.
            // This means the order of the specs matter; I find this a little troubling.
            it("should give the incoming component an element if it has none", function() {
                var content = testPage.test.componentWithNoElement;

                slot.content = content;
                testPage.waitForDraw();

                runs(function() {
                    expect(content.element).toBeTruthy();
                });
            });

            it("must not replace the incoming component's element if it is already set", function() {
                var content = testPage.test.componentInPageWithElement,
                    originalElement = content.element;

                slot.content = content;
                testPage.waitForDraw();

                runs(function() {
                    console.log(content.element, originalElement)
                    expect(content.element).toBe(originalElement);
                });
            });

            it("should append the incoming component's element if there was no content", function() {
                var content = testPage.test.componentWithNoElement;

                slot.content = content;
                testPage.waitForDraw();

                runs(function() {
                    expect(slot.element.firstElementChild).toBe(content.element);
                });
            });

            it("should set the incoming component's parentComponent to be the slot", function() {
                testPage.waitForDraw();
                runs(function() {

                    var content = testPage.test.componentWithNoElement;

                    slot.content = content;
                    testPage.waitForDraw();

                    runs(function() {
                        expect(content.parentComponent).toBe(slot);
                    });
                });
            });

            it("should set the component as a childComponent of the slot", function() {
                testPage.waitForDraw();
                runs(function() {
                    var content = testPage.test.componentWithNoElement;

                    slot.content = content;

                    testPage.waitForDraw();

                    runs(function() {
                        expect(slot.childComponents).toContain(content);
                    });
                });
            });

        });

        describe("when removing a component", function() {

            var originalContent;

            beforeEach(function() {
                originalContent = testPage.test.componentWithNoElement;
                slot.content = originalContent;
            });

            it("should properly remove the current content inside the slot", function() {
                slot.content = null;
                testPage.waitForDraw();

                runs(function() {
                    expect(slot.element.childElementCount).toBe(0);
                    expect(originalContent.parentComponent).toBe(null);
                });
            });



        });

    });
});
