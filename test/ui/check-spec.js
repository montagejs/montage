/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
var Montage = require("montage").Montage,
    TestPageLoader = require("support/testpageloader").TestPageLoader,
    ActionEventListener = require("montage/core/event/action-event-listener").ActionEventListener;

var testPage = TestPageLoader.queueTest("checktest", function() {
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

    describe("ui/check-spec", function() {
        it("should load", function() {
            expect(testPage.loaded).toBe(true);
        });

        describe("checkbox", function(){
            describe("checked property", function() {
                it("is false if there is no `checked` attribute", function() {
                    expect(test.check1.checked).toBe(false);
                });
                it("is true if the `checked` attribute is set", function() {
                    expect(test.check2.checked).toBe(true);
                });
                it("can be set to true", function() {
                    runs(function() {
                        test.check1.checked = true;
                        expect(test.check1.checked).toBe(true);
                    });

                    testPage.waitForDraw();

                    runs(function(){
                        expect(test.check1.element.checked).toBe(true);
                    });

                });
                it("can be set to false", function() {
                    runs(function() {
                        test.check2.checked = false;
                        expect(test.check2.checked).toBe(false);
                    });

                    testPage.waitForDraw();

                    runs(function(){
                        expect(test.check2.element.checked).toBe(false);
                    });
                });
            });

        });

        describe("radio button", function() {

        });
    });
});
