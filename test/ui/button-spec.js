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
    TestPageLoader = require("support/testpageloader").TestPageLoader;

var testPage = TestPageLoader.queueTest("buttontest", function() {
    var test = testPage.test;

    var click = function(component, el, fn) {
        el = el || component.element;

        var listener = testPage.addListener(component, fn);
        testPage.clickOrTouch({target: el});
        // Return this so that it can be checked in tha calling function.
        return listener;
    };
    var testButton = function(component, value) {
        expect(component).toBeDefined();
        expect(click(component)).toHaveBeenCalled();
        expect(component.label).toBe(value);
    };

    describe("ui/button-spec", function() {
        it("should load", function() {
            expect(testPage.loaded).toBe(true);
        });

        describe("button", function(){

            it("can be created from a div element", function(){
                testButton(test.divbutton, "div button");
            });
            it("can be created from an input element", function(){
                testButton(test.inputbutton, "input button");
            });
            it("can be created from a button element", function(){
                testButton(test.buttonbutton, "button button");
            });

            it("fires a 'hold' event when the button is pressed for a long time", function() {
                var el = test.inputbutton.element;
                var holdListener = testPage.addListener(test.inputbutton, null, "hold");
                var actionListener = testPage.addListener(test.inputbutton, null, "action");

                testPage.mouseEvent({target: el}, "mousedown");

                waits(1010);
                runs(function() {
                    testPage.mouseEvent({target: el}, "mouseup");
                    testPage.mouseEvent({target: el}, "click");

                    expect(holdListener).toHaveBeenCalled();
                    expect(actionListener).not.toHaveBeenCalled();
                });
            });

            describe("disabled property", function(){
                it("is taken from the element's disabled attribute", function() {
                    expect(test.disabledbutton.disabled).toBe(true);
                    expect(click(test.disabledbutton)).not.toHaveBeenCalled();
                    expect(test.disabledinput.disabled).toBe(true);
                    expect(click(test.disabledinput)).not.toHaveBeenCalled();
                    expect(test.inputbutton.disabled).toBe(false);
                });
                it("can be set", function(){
                    expect(test.disabledbutton.disabled).toBe(true);
                    test.disabledbutton.disabled = false;
                    expect(test.disabledbutton.disabled).toBe(false);
                    // TODO click the button and check that it wasn't pressed

                    expect(test.disabledinput.disabled).toBe(true);
                    test.disabledinput.disabled = false;
                    expect(test.disabledinput.disabled).toBe(false);
                    // TODO click the button and check that it wasn't pressed
                });
                it("can can be set in the serialization", function(){
                    expect(test.disabledinputszn.disabled).toBe(true);
                    // TODO check button pressibility
                });
                it("is the inverse of the enabled property", function(){
                    expect(test.enabledinputszn.disabled).toBe(false);
                    expect(test.enabledinputszn.enabled).toBe(true);
                    test.enabledinputszn.enabled = false;
                    expect(test.enabledinputszn.disabled).toBe(true);
                    expect(test.enabledinputszn.enabled).toBe(false);
                    // TODO click the button and check that it wasn't pressed
                });
            });

            describe("label property", function() {
                it("is set from the serialization on a button", function() {
                    expect(test.buttonlabelszn.label).toBe("pass");
                    testPage.waitForDraw();
                    runs(function(){
                        expect(test.buttonlabelszn.element.firstChild.data).toBe("pass");
                    });
                });
                it("is set from the serialization on an input", function() {
                    expect(test.inputlabelszn.label).toBe("pass");
                    expect(test.inputlabelszn.element.value).toBe("pass");
                });
                it("sets the value on an input", function() {
                    expect(test.inputbutton.label).toBe("input button");
                    test.inputbutton.label = "label pass";
                    expect(test.inputbutton.label).toBe("label pass");
                    expect(test.inputbutton.value).toBe("label pass");
                    test.inputbutton.label = "input button";
                });
                it("sets the first child on a non-input element", function() {
                    expect(test.buttonbutton.label).toBe("button button");
                    test.buttonbutton.label = "label pass";
                    expect(test.buttonbutton.label).toBe("label pass");

                    testPage.waitForDraw();
                    runs(function(){
                        expect(test.buttonbutton.element.firstChild.data).toBe("label pass");
                        test.buttonbutton.label = "button button";
                    });
                });
            });

            describe("value property", function() {
                it("is set from the value on an input", function() {
                    expect(test.inputbutton.element.value).toBe("input button");
                    expect(test.inputbutton.value).toBe("input button");
                });
                it("is set by the label property in the serialization", function() {
                    expect(test.inputlabelszn.label).toBe("pass");
                    //expect(test.inputlabelszn.value).toBe("pass");
                });
                it("sets the label property when using an input element", function() {
                    expect(test.inputbutton.label).toBe("input button");
                    test.inputbutton.value = "value pass";
                    expect(test.inputbutton.value).toBe("value pass");
                    expect(test.inputbutton.label).toBe("value pass");
                    test.inputbutton.value = "input button";
                });
                it("doesn't set the label property when using a non-input element", function() {
                    expect(test.buttonbutton.label).toBe("button button");
                    test.buttonbutton.value = "value fail";
                    expect(test.buttonbutton.label).toBe("button button");
                    testPage.waitForDraw();
                    runs(function(){
                        expect(test.buttonbutton.element.firstChild.data).toBe("button button");
                        test.buttonbutton.value = "button button";
                    });
                });

            });


            describe("action event detail property", function() {
                var detailButton = test.detailbutton,
                    testHandler;
                beforeEach(function() {
                    testHandler = {
                        handler: function(event) {
                            testHandler.event = event;
                        },
                        event: null,
                        valueToBeBound: "aValue"
                    };
                });
                it("is undefined if not used", function() {
                    spyOn(testHandler, 'handler').andCallThrough();
                    detailButton.addEventListener("action", testHandler.handler, false);

                    testPage.clickOrTouch({target: detailButton.element});
                    expect(testHandler.handler).toHaveBeenCalled();
                    expect(testHandler.event.detail).not.toBeDefined();
                });
                it("is is populated if used in a binding", function() {
                    spyOn(testHandler, 'handler').andCallThrough();
                    detailButton.addEventListener("action", testHandler.handler, false);
                    Object.defineBinding(detailButton, "detail.prop", {
                        boundObject: testHandler,
                        boundObjectPropertyPath: "valueToBeBound"
                    });

                    testPage.clickOrTouch({target: detailButton.element});
                    expect(testHandler.handler).toHaveBeenCalled();
                    expect(testHandler.event.detail.prop).toEqual(testHandler.valueToBeBound);
                    //cleanup
                    Object.deleteBindings(detailButton);
                });
                it("is is populated if used programatically", function() {
                    spyOn(testHandler, 'handler').andCallThrough();
                    detailButton.addEventListener("action", testHandler.handler, false);
                    detailButton.detail.set("prop2", "anotherValue");

                    testPage.clickOrTouch({target: detailButton.element});
                    expect(testHandler.handler).toHaveBeenCalled();
                    expect(testHandler.event.detail.prop2).toEqual("anotherValue");
                });
            });


            it("responds when child elements are clicked on", function(){
                expect(click(test.buttonnested, test.buttonnested.element.firstChild)).toHaveBeenCalled();
            });

            it("supports converters for label", function(){
                expect(test.converterbutton.label).toBe("PASS");
                expect(test.converterbutton.element.value).toBe("PASS");
            });

            // TODO should be transplanted to the press-composer-spec
            // it("correctly releases the pointer", function() {
            //     var l = testPage.addListener(test.scroll_button);

            //     testpage.mouseEvent({target: test.scroll_button.element}, "mousedown");;
            //     expect(test.scroll_button.active).toBe(true);
            //     test.scroll_button.surrenderPointer(test.scroll_button._observedPointer, null);
            //     expect(test.scroll_button.active).toBe(false);
            //     testPage.mouseEvent({target: test.scroll_button.element}, "mouseup");;

            //     expect(l).not.toHaveBeenCalled();

            // });

            if (window.Touch) {

                describe("when supporting touch events", function() {

                    it("should dispatch an action event when a touchend follows a touchstart on a button", function() {

                    });

                });

            } else {

                describe("when supporting mouse events", function() {
                    it("dispatches an action event when a mouseup follows a mousedown", function() {
                        expect(click(test.inputbutton)).toHaveBeenCalled();
                    });

                    it("does not dispatch an action event when a mouseup occurs after not previously receiving a mousedown", function() {
                        // reset interaction
                        // test.inputbutton._endInteraction();
                        var l = testPage.addListener(test.inputbutton);
                        testPage.mouseEvent({target: test.inputbutton.element}, "mouseup");;
                        expect(l).not.toHaveBeenCalled();
                    });

                    it("does not dispatch an action event when a mouseup occurs away from the button after a mousedown on a button", function() {
                        var l = testPage.addListener(test.inputbutton);

                        testpage.mouseEvent({target: test.inputbutton.element}, "mousedown");;
                        // Mouse up somewhere else
                        testPage.mouseEvent({target: test.divbutton.element}, "mouseup");;

                        expect(l).not.toHaveBeenCalled();
                    });
                });
            }

            describe("inside a scroll view", function() {
                it("fires an action event when clicked", function() {
                    testButton(test.scroll_button, "scroll button");
                });
                it("doesn't fire an action event when scroller is dragged", function() {
                    var el = test.scroll_button.element;
                    var scroll_el = test.scroll.element;

                    var listener = testPage.addListener(test.scroll_button);

                    var press_composer = test.scroll_button.composerList[0];

                    // mousedown
                    testPage.mouseEvent({target: el}, "mousedown");

                    expect(test.scroll_button.active).toBe(true);
                    expect(test.scroll_button.eventManager.isPointerClaimedByComponent(press_composer._observedPointer, press_composer)).toBe(true);

                    // Mouse move doesn't happen instantly
                    waits(10);
                    runs(function() {
                        // mouse move up
                        var moveEvent = document.createEvent("MouseEvent");
                        // Dispatch to scroll view, but use the coordinates from the
                        // button
                        moveEvent.initMouseEvent("mousemove", true, true, scroll_el.view, null,
                                el.offsetLeft, el.offsetTop - 100,
                                el.offsetLeft, el.offsetTop - 100,
                                false, false, false, false,
                                0, null);
                        scroll_el.dispatchEvent(moveEvent);

                        expect(test.scroll_button.active).toBe(false);
                        expect(test.scroll_button.eventManager.isPointerClaimedByComponent(press_composer._observedPointer, press_composer)).toBe(false);

                        // mouse up
                        testPage.mouseEvent({target: el}, "mouseup");;

                        expect(listener).not.toHaveBeenCalled();
                    });

                });
            });
        });

        describe("toggle button", function() {
            it("alternates between unpressed and pressed", function() {
                expect(test.toggleinput.pressed).toBe(false);
                expect(test.toggleinput.label).toBe("off");

                click(test.toggleinput);
                expect(test.toggleinput.pressed).toBe(true);
                expect(test.toggleinput.label).toBe("on");

                click(test.toggleinput);
                expect(test.toggleinput.pressed).toBe(false);
                expect(test.toggleinput.label).toBe("off");
            });

            describe("toggle()", function() {
                it("swaps the state", function() {
                    test.toggleinput.pressed = false;
                    test.toggleinput.toggle();
                    expect(test.toggleinput.pressed).toBe(true);
                    test.toggleinput.toggle();
                    expect(test.toggleinput.pressed).toBe(false);
                    test.toggleinput.toggle();
                    expect(test.toggleinput.pressed).toBe(true);
                });
            });

            describe("label property", function() {
                it("alternates between unpressed and pressed", function() {
                    test.toggleinput.pressed = false;

                    // The expectations are in a closure because the draw can
                    // happen at any point after we click on the button
                    var checker = function(e) {
                        return function(){
                            expect(test.toggleinput.pressed).toBe(e);
                            expect(test.toggleinput.element.value).toBe((e)?"on":"off");
                        };
                    };

                    runs(checker(false));

                    runs(function(){ click(test.toggleinput); });
                    testPage.waitForDraw();
                    runs(checker(true));
                });
                it("changes pressed state when set to unpressedLabel or pressedLabel", function(){
                    test.toggleinput.pressed = false;
                    test.toggleinput.label = "on";
                    expect(test.toggleinput.pressed).toBe(true);
                    test.toggleinput.label = "off";
                    expect(test.toggleinput.pressed).toBe(false);
                });
                it("doesn't change pressed state when set to a non-matching string", function(){
                   expect(test.toggleinput.pressed).toBe(false);
                   test.toggleinput.label = "random";
                   expect(test.toggleinput.pressed).toBe(false);
                   expect(test.toggleinput.label).toBe("random");

                   test.toggleinput.pressed = true;
                   expect(test.toggleinput.label).toBe("on");
                });
            });
            describe("unpressedLabel", function() {
                it("is set as the value when the button is unpressed", function() {
                    test.toggleinput.pressed = false;
                    expect(test.toggleinput.label).toBe("off");
                    test.toggleinput.unpressedLabel = "unpressed";
                    expect(test.toggleinput.label).toBe("unpressed");

                    testPage.waitForDraw();
                    runs(function(){
                        expect(test.toggleinput.element.value).toBe("unpressed");
                    });
                });
                it("is taken from `value` on init if the button is unpressed and unpressedLabel isn't set", function() {
                    expect(test.toggleinput2.unpressedLabel).toBe(test.toggleinput2.label);
                });
            });

            describe("pressedLabel", function() {
                it("is set as the value when the button is pressed", function() {
                    test.toggleinput.pressed = true;
                    expect(test.toggleinput.label).toBe("on");
                    test.toggleinput.pressedLabel = "pressed";
                    expect(test.toggleinput.label).toBe("pressed");

                    testPage.waitForDraw();
                    runs(function(){
                        expect(test.toggleinput.element.value).toBe("pressed");
                    });
                });
                it("is taken from `value` on init if the button is pressed and pressedLabel isn't set", function() {
                    expect(test.toggleinput3.pressedLabel).toBe(test.toggleinput3.label);
                });
            });

            describe("pressedClass", function() {
                it("is not in the classList when the button is unpressed", function() {
                    test.toggleinput.pressed = false;

                    testPage.waitForDraw();
                    runs(function(){
                        expect(test.toggleinput.element.className).not.toContain("pressed");
                    });
                });
                it("is added to the classList when the button is pressed", function() {
                    test.toggleinput.pressed = true;

                    testPage.waitForDraw();
                    runs(function(){
                        expect(test.toggleinput.element.className).toContain("pressed");
                    });
                });
            });
        });
    });
});
