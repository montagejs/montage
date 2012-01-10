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

        mousedown(el);
        mouseup(el);

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
            expect(testPage.loaded).toBe(true);
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
                    console.log(test.enabledinputszn.disabled, test.enabledinputszn.enabled);
                    expect(test.enabledinputszn.disabled).toBe(false);
                    expect(test.enabledinputszn.enabled).toBe(true);
                    test.enabledinputszn.enabled = false;
                    expect(test.enabledinputszn.disabled).toBe(true);
                    expect(test.enabledinputszn.enabled).toBe(false);
                    // TODO click the button and check that it wasn't pressed
                });
            });

            describe("value", function() {
                it("is set from the serialization on a button", function() {
                    expect(test.buttonvalueszn.value).toBe("pass");
                    expect(test.buttonvalueszn.element.firstChild.data).toBe("pass");
                });
                it("is set from the serialization on an input", function() {
                    expect(test.inputvalueszn.value).toBe("pass");
                    expect(test.inputvalueszn.element.value).toBe("pass");
                });
            });


            it("responds when child elements are clicked on", function(){
                expect(click(test.nestedelement, test.nestedelement.element.firstChild)).toHaveBeenCalled();
            });

            it("supports converters for value", function(){
                expect(test.converterbutton.value).toBe("CONVERTED VALUE");
                expect(test.converterbutton.element.value).toBe("CONVERTED VALUE");
            });
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

                it("calls the action property if it has been set and is a function", function() {
                    var buttonSpy = {
                        doSomething: function(event) {
                            throw "This button should not have dispatched an action";
                        }
                    };
                    spyOn(buttonSpy, 'doSomething');
                    test.inputbutton.action = buttonSpy.doSomething;

                    mousedown(test.inputbutton.element);
                    mouseup(test.inputbutton.element);

                    expect(buttonSpy.doSomething).toHaveBeenCalled();
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
});
