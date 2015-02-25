/* <copyright>
Copyright (c) 2012, Motorola Mobility LLC.
All Rights Reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

* Redistributions of source code must retain the above copyright notice,
  this list of conditions and the following disclaimer.

* Redistributions in binary form must reproduce the above copyright notice,
  this list of conditions and the following disclaimer in the documentation
  and/or other materials provided with the distribution.

* Neither the name of Motorola Mobility LLC nor the names of its
  contributors may be used to endorse or promote products derived from this
  software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE
LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
POSSIBILITY OF SUCH DAMAGE.
</copyright> */
var Montage = require("montage").Montage,
    TestPageLoader = require("montage-testing/testpageloader").TestPageLoader;

TestPageLoader.queueTest("slot-test/slot-test", function (testPage) {
    describe("ui/slot-spec", function () {
        var slot;

        beforeEach(function () {
            slot = testPage.test.slot;
            slot.content = null;
        });

        describe("when first loaded", function () {
            it("it should have no initial content", function () {
                expect(slot.content).toEqual(null);
                expect(slot.element.childNodes.length).toEqual(0);
            });
        });

        describe("when inserting a component", function () {

            // TODO it's a shame that the state of all the components is preserved from spec to spec
            // that means that once this componentWithNoElement is put into a slot and given an element
            // it will have an element for all subsequent specs.
            // This means the order of the specs matter; I find this a little troubling.
            it("should give the incoming component an element if it has none", function () {
                var content = testPage.test.componentWithNoElement;

                slot.content = content;
                testPage.waitForDraw();

                runs(function () {
                    expect(content.element).toBeTruthy();
                });
            });

            it("must not replace the incoming component's element if it is already set", function () {
                var content = testPage.test.componentInPageWithElement,
                    originalElement = content.element;

                slot.content = content;
                testPage.waitForDraw();

                runs(function () {
                    //console.log(content.element, originalElement)
                    expect(content.element).toBe(originalElement);
                });
            });

            it("should draw a component that has an element but the element is not part of the DOM when the slot content is set", function () {
                var content = testPage.test.componentInPageWithElement;
                slot.content = null;
                testpage.waitForDraw();

                runs(function () {
                    slot.content = content;
                    content.value = "This is new text";
                    testPage.waitForDraw();

                    runs(function () {
                        expect(slot.element.childNodes.length).toEqual(1);
                        expect(slot.element.childNodes[0].textContent).toBe("This is new text");
                    });
                });
            });

            it("should append the incoming component's element if there was no content", function () {
                var content = testPage.test.componentWithNoElement;

                slot.content = content;
                testPage.waitForDraw();

                runs(function () {
                    expect(slot.element.firstElementChild).toBe(content.element);
                });
            });

            it("should set the incoming component's parentComponent to be the slot", function () {
                testPage.waitForDraw();
                runs(function () {

                    var content = testPage.test.componentWithNoElement;

                    slot.content = content;
                    testPage.waitForDraw();

                    runs(function () {
                        expect(content.parentComponent).toBe(slot);
                    });
                });
            });

            it("should set the component as a childComponent of the slot", function () {
                testPage.waitForDraw();
                runs(function () {
                    var content = testPage.test.componentWithNoElement;

                    slot.content = content;

                    testPage.waitForDraw();

                    runs(function () {
                        expect(slot.childComponents).toContain(content);
                    });
                });
            });

            it("accessing the content property should return an element if an element was initially set", function () {
                testPage.waitForDraw();
                runs(function () {
                    var content = testPage.test.bazContent;

                    slot.content = content;

                    testPage.waitForDraw();

                    runs(function () {
                        expect(slot.content).toEqual(content);
                    });
                });
            });

            it("accessing the content property should return a component if a component was initially set", function () {
                testPage.waitForDraw();
                runs(function () {
                    var content = testPage.test.componentInPageWithElement;

                    slot.content = content;

                    testPage.waitForDraw();

                    runs(function () {
                        expect(slot.content).toEqual(content);
                    });
                });
            });

        });

        describe("when removing a component", function () {

            var originalContent;

            beforeEach(function () {
                originalContent = testPage.test.componentWithNoElement;
                slot.content = originalContent;
            });

            it("should properly remove the current content inside the slot", function () {
                slot.content = null;
                testPage.waitForDraw();

                runs(function () {
                    expect(slot.element.childElementCount).toBe(0);
                    expect(originalContent.parentComponent).toBe(null);
                });
            });



        });

    });
});
