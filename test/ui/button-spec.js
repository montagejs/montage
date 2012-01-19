/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
var Montage = require("montage").Montage,
    TestPageLoader = require("support/testpageloader").TestPageLoader,
    ActionEventListener = require("montage/core/event/action-event-listener").ActionEventListener;

var testPage = TestPageLoader.queueTest("buttontest", function() {
    var test = testPage.test;

    var mousedown = function(el) {
        var downEvent = document.createEvent("MouseEvent");
        downEvent.initMouseEvent("mousedown", true, true, el.view, null,
                el.offsetLeft, el.offsetTop,
                el.offsetLeft, el.offsetTop,
                false, false, false, false,
                el, null);
        el.dispatchEvent(downEvent);
        return downEvent;
    };
    var mouseup = function(el) {
        var upEvent = document.createEvent("MouseEvent");
        upEvent.initMouseEvent("mouseup", true, true, el.view, null,
                el.offsetLeft, el.offsetTop,
                el.offsetLeft, el.offsetTop,
                false, false, false, false,
                el, null);
        el.dispatchEvent(upEvent);
        return upEvent;
    };
    var click = function(component, el, fn) {
        el = el || component.element;
        var buttonSpy = {
            doSomething: fn || function(event) {
                return 1+1;
            }
        };
        spyOn(buttonSpy, 'doSomething');

        var actionListener = Montage.create(ActionEventListener).initWithHandler_action_(buttonSpy, "doSomething");
        component.addEventListener("action", actionListener);

        mousedown(el);
        mouseup(el);

        // Return this so that it can be checked in tha calling function.
        return buttonSpy.doSomething;
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


            it("responds when child elements are clicked on", function(){
                expect(click(test.buttonnested, test.buttonnested.element.firstChild)).toHaveBeenCalled();
            });

            it("supports converters for label", function(){
                expect(test.converterbutton.label).toBe("PASS");
                expect(test.converterbutton.element.value).toBe("PASS");
            });


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

                    it("does not dispatch an action event when a mouseup occurs after not previously receive a mousedown", function() {
                        var buttonSpy = {
                            doSomething: function(event) {
                                throw "This button should not have dispatched an action";
                            }
                        };
                        spyOn(buttonSpy, 'doSomething');

                        var actionListener = Montage.create(ActionEventListener).initWithHandler_action_(buttonSpy, "doSomething");
                        test.inputbutton.addEventListener("action", actionListener);

                        mousedown(test.inputbutton.element);
                        expect(buttonSpy.doSomething).not.toHaveBeenCalled();

                    });

                    it("does not dispatch an action event when a mouseup occurs away from the button after a mousedown on a button", function() {
                        var buttonSpy = {
                            doSomething: function(event) {
                                alert("action!");
                            }
                        };
                        spyOn(buttonSpy, 'doSomething');

                        var actionListener = Montage.create(ActionEventListener).initWithHandler_action_(buttonSpy, "doSomething");
                        test.inputbutton.addEventListener("action", actionListener);

                        mousedown(test.inputbutton.element);
                        // Mouse up somewhere else
                        mouseup(test.divbutton.element);

                        expect(buttonSpy.doSomething).not.toHaveBeenCalled();
                    });
                });

            }
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
