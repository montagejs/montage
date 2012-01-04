/* <copyright>
Copyright (c) 2012, Motorola Mobility, Inc

All Rights Reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

  - Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
  - Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
  - Neither the name of Motorola Mobility nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
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
