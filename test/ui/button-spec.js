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

    var click = function(component, el) {
        el = el || component.element;
        var buttonSpy = {
            doSomething: function(event) {
                return 1+1;
            }
        };
        spyOn(buttonSpy, 'doSomething');

        var actionListener = Montage.create(ActionEventListener).initWithHandler_action_(buttonSpy, "doSomething");
        component.addEventListener("action", actionListener);

        var downEvent = document.createEvent("MouseEvent");
        downEvent.initMouseEvent("mousedown", true, true, el.view, null,
                el.offsetLeft, el.offsetTop,
                el.offsetLeft, el.offsetTop,
                false, false, false, false,
                el, null);
        el.dispatchEvent(downEvent);

        var upEvent = document.createEvent("MouseEvent");
        upEvent.initMouseEvent("mouseup", true, true, el.view, null,
                el.offsetLeft, el.offsetTop,
                el.offsetLeft, el.offsetTop,
                false, false, false, false,
                el, null);
        el.dispatchEvent(upEvent);

        // Return this so that it can be checked in tha calling function.
        return buttonSpy.doSomething;
    };
    var testButton = function(component, value) {
        expect(component).toBeDefined();
        expect(click(component)).toHaveBeenCalled();
        expect(component.value).toBe(value);
    };

    describe("ui/button-spec", function() {
        it("should load", function() {
            expect(testPage.loaded).toBeTruthy();
        });

        it("can create a button from a div element", function(){
            testButton(test.divbutton, "div button");
        });
        it("can create a button from an input element", function(){
            testButton(test.inputbutton, "input button");
        });
        it("can create a button from a button element", function(){
            testButton(test.buttonbutton, "button button");
        });

        describe("button", function(){
            describe("disabled property", function(){
                it("is taken from the element's disabled attribute", function() {
                    expect(test.disabledbutton.disabled).toBe(true);
                    expect(click(test.disabledbutton)).not.toHaveBeenCalled();
                    expect(test.disabledinput.disabled).toBe(true);
                    expect(click(test.disabledinput)).not.toHaveBeenCalled();
                    expect(test.inputbutton.disabled).toBe(false);
                });
                it("can be set", function(){
                    var orig;
                    orig = !!test.disabledbutton.disabled;
                    test.disabledbutton.disabled = !orig;
                    expect(test.disabledbutton.disabled).toBe(!orig);
                    // TODO click the button and check that it wasn't pressed

                    orig = !!test.disabledinput.disabled;
                    test.disabledinput.disabled = !orig;
                    expect(test.disabledinput.disabled).toBe(!orig);
                    // TODO click the button and check that it wasn't pressed
                });
                it("can can be set in the serialization", function(){
                    expect(test.disabledinputszn.disabled).toBe(true);
                    // TODO check button pressibility
                });
                it("is the inverse of the enabled property", function(){
                    expect(test.enabledinputszn.disabled).toBe(false);

                    orig = !!test.disabledinput.enabled;
                    test.disabledinput.enabled = !orig;
                    expect(test.disabledinput.enabled).toBe(!orig);
                    // TODO click the button and check that it wasn't pressed
                });
            });

            it("responds when child elements are clicked on", function(){
                expect(click(test.nestedelement, test.nestedelement.element.firstChild)).toHaveBeenCalled();
            });

            it("supports converters for value", function(){
                expect(test.converterbutton.value).toBe("CONVERTED VALUE");
            });
        });

        if (window.Touch) {

            describe("when supporting touch events", function() {

                it("should dispatch an action event when a touchend follows a touchstart on a button", function() {

                });

            });

        } else {

            describe("when supporting mouse events", function() {
                it("should dispatch an action event when a mouseup follows a mousedown on a button", function() {
                    test.inputbutton.needsDraw = true;
                    // wait for draw
                    testPage.waitForDraw();
                    runs(function() {
                        var buttonSpy = {
                            doSomething: function(event) {
                                alert("action!");
                            }
                        };
                        spyOn(buttonSpy, 'doSomething');

                        var actionListener = Montage.create(ActionEventListener).initWithHandler_action_(buttonSpy, "doSomething");
                        test.inputbutton.addEventListener("action", actionListener);

                        var downEvent = document.createEvent("MouseEvent");
                        downEvent.initMouseEvent("mousedown", true, true, test.buttonElement.view, null,
                                test.buttonElement.offsetLeft, test.buttonElement.offsetTop,
                                test.buttonElement.offsetLeft, test.buttonElement.offsetTop,
                                false, false, false, false,
                                test.buttonElement, null);
                        test.buttonElement.dispatchEvent(downEvent);

                        var upEvent = document.createEvent("MouseEvent");
                        upEvent.initMouseEvent("mouseup", true, true, test.buttonElement.view, null,
                                test.buttonElement.offsetLeft, test.buttonElement.offsetTop,
                                test.buttonElement.offsetLeft, test.buttonElement.offsetTop,
                                false, false, false, false,
                                test.buttonElement, null);
                        test.buttonElement.dispatchEvent(upEvent);
                        expect(buttonSpy.doSomething).toHaveBeenCalled();
                    });

                });

                it("must not dispatch an action event when a mouseup occurs on a button that did not previously receive a mousedown", function() {

                    test.inputbutton.needsDraw = true;
                    // wait for draw
                    testPage.waitForDraw();
                    runs(function() {

                        var buttonSpy = {
                            doSomething: function(event) {
                                throw "This button should not have dispatched an action";
                            }
                        };
                        spyOn(buttonSpy, 'doSomething');

                        var actionListener = Montage.create(ActionEventListener).initWithHandler_action_(buttonSpy, "doSomething");
                        test.inputbutton.addEventListener("action", actionListener);

                        var upEvent = document.createEvent("MouseEvent");
                        upEvent.initMouseEvent("mouseup", true, true, test.buttonElement.view, null,
                                test.buttonElement.offsetLeft, test.buttonElement.offsetTop,
                                test.buttonElement.offsetLeft, test.buttonElement.offsetTop,
                                false, false, false, false,
                                test.buttonElement, null);
                        test.buttonElement.dispatchEvent(upEvent);
                        expect(buttonSpy.doSomething).not.toHaveBeenCalled();
                    });

                });

                it("must not dispatch an action event when a mouseup occurs away from the button after a mousedown on a button", function() {

                    test.inputbutton.needsDraw = true;
                    // wait for draw
                    testPage.waitForDraw();
                    runs(function() {

                        var buttonSpy = {
                            doSomething: function(event) {
                                alert("action!");
                            }
                        };
                        spyOn(buttonSpy, 'doSomething');

                        var actionListener = Montage.create(ActionEventListener).initWithHandler_action_(buttonSpy, "doSomething");
                        test.inputbutton.addEventListener("action", actionListener);

                        var downEvent = document.createEvent("MouseEvent");
                        downEvent.initMouseEvent("mousedown", true, true, test.buttonElement.view, null,
                                test.buttonElement.offsetLeft, test.buttonElement.offsetTop,
                                test.buttonElement.offsetLeft, test.buttonElement.offsetTop,
                                false, false, false, false,
                                test.buttonElement, null);
                        test.buttonElement.dispatchEvent(downEvent);

                        var upEvent = document.createEvent("MouseEvent");
                        upEvent.initMouseEvent("mouseup", true, true, test.buttonElement.view, null,
                                test.buttonElement.offsetLeft, test.buttonElement.offsetTop + 200,
                                test.buttonElement.offsetLeft, test.buttonElement.offsetTop + 200,
                                false, false, false, false,
                                document, null);
                        document.dispatchEvent(upEvent);
                        expect(buttonSpy.doSomething).not.toHaveBeenCalled();
                    });

                });

                //////////////////////

            });

        }

    });
});
