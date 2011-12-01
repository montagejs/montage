/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
var Montage = require("montage").Montage,
    TestPageLoader = require("support/testpageloader").TestPageLoader,
    ActionEventListener = require("montage/core/event/action-event-listener").ActionEventListener;

var testPage = TestPageLoader.queueTest("buttontest", function() {
    describe("ui/button-spec", function() {
        it("should load", function() {
            expect(testPage.loaded).toBeTruthy();
        });

        describe("once loaded", function() {

            if (window.Touch) {

                describe("when supporting touch events", function() {

                    it("should dispatch an action event when a touchend follows a touchstart on a button", function() {

                    });

                });

            } else {

                describe("when supporting mouse events", function() {
                    it("should dispatch an action event when a mouseup follows a mousedown on a button", function() {
                        var test = testPage.test;
                        test.buttonComponent.needsDraw = true;
                        // wait for draw
                        testPage.waitForDraw();
                        runs(function() {
                            var buttonSpy = {
                                doSomething: function(event) {
                                    alert("action!")
                                }
                            }
                            spyOn(buttonSpy, 'doSomething');

                            var actionListener = Montage.create(ActionEventListener).initWithHandler_action_(buttonSpy, "doSomething");
                            test.buttonComponent.addEventListener("action", actionListener);

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

                        var test = testPage.test;
                        test.buttonComponent.needsDraw = true;
                        // wait for draw
                        testPage.waitForDraw();
                        runs(function() {

                            var buttonSpy = {
                                doSomething: function(event) {
                                    throw "This button should not have dispatched an action"
                                }
                            }
                            spyOn(buttonSpy, 'doSomething');

                            var actionListener = Montage.create(ActionEventListener).initWithHandler_action_(buttonSpy, "doSomething");
                            test.buttonComponent.addEventListener("action", actionListener);

                            var upEvent = document.createEvent("MouseEvent");
                            upEvent.initMouseEvent("mouseup", true, true, test.buttonElement.view, null,
                                    test.buttonElement.offsetLeft, test.buttonElement.offsetTop,
                                    test.buttonElement.offsetLeft, test.buttonElement.offsetTop,
                                    false, false, false, false,
                                    test.buttonElement, null);
                            test.buttonElement.dispatchEvent(upEvent);
                            expect(buttonSpy.doSomething).not.toHaveBeenCalled();
                        });

                    })

                    it("must not dispatch an action event when a mouseup occurs away from the button after a mousedown on a button", function() {

                        var test = testPage.test;
                        test.buttonComponent.needsDraw = true;
                        // wait for draw
                        testPage.waitForDraw();
                        runs(function() {

                            var buttonSpy = {
                                doSomething: function(event) {
                                    alert("action!")
                                }
                            }
                            spyOn(buttonSpy, 'doSomething');

                            var actionListener = Montage.create(ActionEventListener).initWithHandler_action_(buttonSpy, "doSomething");
                            test.buttonComponent.addEventListener("action", actionListener);

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

                });

            }

        });
    });
});
