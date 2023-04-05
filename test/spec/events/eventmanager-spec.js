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
    Target = require("montage/core/target").Target,
    ActionEventListener = require("montage/core/event/action-event-listener").ActionEventListener,
    Serializer = require("montage/core/serialization/serializer/montage-serializer").MontageSerializer,
    Deserializer = require("montage/core/serialization/deserializer/montage-deserializer").MontageDeserializer,
    TestPageLoader = require("montage-testing/testpageloader").TestPageLoader,
    EventInfo = require("montage-testing/testpageloader").EventInfo,
    MontageReviver = require("montage/core/serialization/deserializer/montage-reviver").MontageReviver,
    UUID = require("montage/core/uuid");

var global = typeof global !== "undefined" ? global : window;

TestPageLoader.queueTest("eventmanagertest/eventmanagertest", function (testPage) {
    describe("events/eventmanager-spec", function () {

        var NONE = Event.NONE,
            CAPTURING_PHASE = Event.CAPTURING_PHASE,
            AT_TARGET = Event.AT_TARGET,
            BUBBLING_PHASE = Event.BUBBLING_PHASE;

        var testDocument, eventManager;

        beforeEach(function () {
            var testWindow = testPage.iframe.contentWindow;
            eventManager = testWindow.mr("montage/core/application").application.eventManager;

            testDocument = testPage.iframe.contentDocument;

            eventManager.reset();
        });

        describe("when determining handler method names", function () {

            it('should correctly prefix the eventType with "capture" for the capture phase event handler method', function () {
                expect(eventManager.methodNameForCapturePhaseOfEventType("mousedown")).toBe("captureMousedown");
            });

            it('should correctly prefix the eventType with "handle" for the bubble phase event handler method', function () {
                expect(eventManager.methodNameForBubblePhaseOfEventType("mousedown")).toBe("handleMousedown");
            });

            it("must not alter inner capitalization of capture phase event handler method names", function () {
                expect(eventManager.methodNameForCapturePhaseOfEventType("DOMContentReady")).toBe("captureDOMContentReady");
            });

            it("must not alter inner capitalization of bubble phase event handler method names", function () {
                expect(eventManager.methodNameForBubblePhaseOfEventType("DOMContentReady")).toBe("handleDOMContentReady");
            });

            it("should inject the specified target identifier as part of the bubble phase event handler method name", function () {
                expect(eventManager.methodNameForBubblePhaseOfEventType("click", "testButton")).toBe("handleTestButtonClick");
            });

            it("should inject the specified target identifier as part of the capture phase event handler method name", function () {
                expect(eventManager.methodNameForCapturePhaseOfEventType("click", "testButton")).toBe("captureTestButtonClick");
            });
        });

        describe("when registering a window", function () {

            it("should be installed as the defaultManager in the current window", function () {
                expect(eventManager).toBeTruthy();
            });

            it("should have overridden the addEventListener for window", function () {
                var testWindow = testDocument.defaultView;
                expect(testWindow.nativeAddEventListener).toBeTruthy();
                expect(testWindow.nativeAddEventListener).not.toBe(testWindow.addEventListener);
            });

            it("should have overridden the addEventListener for document", function () {
                expect(testDocument.nativeAddEventListener).toBeTruthy();
                expect(testDocument.nativeAddEventListener).not.toBe(testDocument.addEventListener);
            });

            it("should have overridden the addEventListener for Element", function () {
                var testElement = testDocument.defaultView.Element.prototype;
                expect(testElement.nativeAddEventListener).toBeTruthy();
                expect(testElement.nativeAddEventListener).not.toBe(testElement.addEventListener);
            });

            it("should have overridden the addEventListener for XMLHttpRequest", function () {
                var request = testDocument.defaultView.XMLHttpRequest.prototype;
                expect(request.nativeAddEventListener).toBeTruthy();
                expect(request.nativeAddEventListener).not.toBe(request.addEventListener);
            });

            it("should have overridden the addEventListener for EventTarget", function () {
                var request = testDocument.defaultView.EventTarget.prototype;
                expect(request.nativeAddEventListener).toBeTruthy();
                expect(request.nativeAddEventListener).not.toBe(request.addEventListener);
            });

            if (Worker) {
                it("should have overridden the addEventListener for Worker", function () {
                    var worker = testDocument.defaultView.Worker.prototype;
                    expect(worker.nativeAddEventListener).toBeTruthy();
                    expect(worker.nativeAddEventListener).not.toBe(worker.addEventListener);
                });
            }

            if (typeof window.MediaController !== "undefined") {
                it("should have overridden the addEventListener for MediaController", function () {
                    var mediaController = testDocument.defaultView.MediaController.prototype;
                    expect(mediaController.nativeAddEventListener).toBeTruthy();
                    expect(mediaController.nativeAddEventListener).not.toBe(mediaController.addEventListener);
                });
            }

            it("should have overridden the removeEventListener for window", function () {
                var testWindow = testDocument.defaultView;
                expect(testWindow.nativeRemoveEventListener).toBeTruthy();
                expect(testWindow.nativeRemoveEventListener).not.toBe(testWindow.removeEventListener);
            });

            it("should have overridden the removeEventListener for document", function () {
                expect(testDocument.nativeRemoveEventListener).toBeTruthy();
                expect(testDocument.nativeRemoveEventListener).not.toBe(testDocument.removeEventListener);
            });

            it("should have overridden the removeEventListener for Element", function () {
                var testElement = testDocument.defaultView.Element.prototype;
                expect(testElement.nativeRemoveEventListener).toBeTruthy();
                expect(testElement.nativeRemoveEventListener).not.toBe(testElement.removeEventListener);
            });

            it("should have overridden the removeEventListener for XMLHttpRequest", function () {
                var request = testDocument.defaultView.XMLHttpRequest.prototype;
                expect(request.nativeRemoveEventListener).toBeTruthy();
                expect(request.nativeRemoveEventListener).not.toBe(request.removeEventListener);
            });

            it("should have overridden the removeEventListener for EventTarget", function () {
                var request = testDocument.defaultView.EventTarget.prototype;
                expect(request.nativeRemoveEventListener).toBeTruthy();
                expect(request.nativeRemoveEventListener).not.toBe(request.removeEventListener);
            });

            if (Worker) {
                it("should have overridden the addEventListener for Worker", function () {
                    var worker = testDocument.defaultView.Worker.prototype;
                    expect(worker.nativeRemoveEventListener).toBeTruthy();
                    expect(worker.nativeRemoveEventListener).not.toBe(worker.removeEventListener);
                });
            }

            if (typeof window.MediaController !== "undefined") {
                it("should have overridden the addEventListener for MediaController", function () {
                    var mediaController = testDocument.defaultView.MediaController.prototype;
                    expect(mediaController.nativeRemoveEventListener).toBeTruthy();
                    expect(mediaController.nativeRemoveEventListener).not.toBe(mediaController.removeEventListener);
                });
            }
        });

        describe("when unregistering a window", function () {
            var testWindow;

            beforeEach(function () {
                testWindow = testPage.iframe.contentWindow;
            });

            afterEach(function () {
                // if there was an error in the test make sure that the window
                // is still registered
                if (!testWindow.defaultEventManager) {
                    eventManager.registerWindow(testWindow);
                }
            });

            it("removes the installed functions", function () {
                eventManager.unregisterWindow(testWindow);

                expect(testWindow.defaultEventManager).toBeUndefined();
                expect(testWindow.document.body.nativeAddEventListener).toBeUndefined();
                expect(testWindow.document.body.addEventListener).toBeDefined();
                expect(testWindow.document.body.nativeRemoveEventListener).toBeUndefined();
                expect(testWindow.document.body.removeEventListener).toBeDefined();

                eventManager.registerWindow(testWindow);

                expect(testWindow.defaultEventManager).toEqual(eventManager);
                expect(testWindow.document.body.nativeAddEventListener).toBeDefined();
                expect(testWindow.document.body.addEventListener).toBeDefined();
                expect(testWindow.document.body.nativeRemoveEventListener).toBeDefined();
                expect(testWindow.document.body.removeEventListener).toBeDefined();

                eventManager.unregisterWindow(testWindow);

                expect(testWindow.defaultEventManager).toBeUndefined();
                expect(testWindow.document.body.nativeAddEventListener).toBeUndefined();
                expect(testWindow.document.body.addEventListener).toBeDefined();
                expect(testWindow.document.body.nativeRemoveEventListener).toBeUndefined();
                expect(testWindow.document.body.removeEventListener).toBeDefined();
            });
        });

        describe("when adding event listeners", function () {

            it("should record that the listener cares about an event on the target", function () {
                var listener = new Montage();
                testDocument.addEventListener("mousedown", listener, false);

                expect(eventManager.registeredEventListenersForEventType_onTarget_phase_("mousedown",testDocument,false).listener).toEqual(listener);
                expect(eventManager.registeredEventListenersForEventType_onTarget_phase_("mousedown",testDocument,true)).toBeNull();
                testDocument.removeEventListener("mousedown", listener, false);

            });

            it("should not record a listener already listening to the same event type", function () {
                var listener = new Montage();
                testDocument.addEventListener("mousedown", listener, false);
                testDocument.addEventListener("mousedown", listener, false);

                expect(eventManager.registeredEventListenersForEventType_onTarget_phase_("mousedown", testDocument,false).listener).toEqual(listener);
            });

            it("should add a native event listener when the first listener for an eventType is added for a target", function () {
                var listener = {},
                    eventType = UUID.generate();

                testDocument.addEventListener(eventType, listener, false);

                var originalHandler = eventManager.handleEvent;
                var handleEventCalled = false;
                eventManager.handleEvent = function () {
                    handleEventCalled = true;
                };

                var newEvent = document.createEvent("CustomEvent");
                newEvent.initCustomEvent(eventType, true, true, null);
                testDocument.dispatchEvent(newEvent);

                eventManager.handleEvent = originalHandler;
                expect(handleEventCalled).toBe(true);
            });

            it("should present an event to any listeners watching for that event type on a specific target", function () {
                var clickSpy = {
                    handleClick: function (event) {
                    }
                };
                spyOn(clickSpy, 'handleClick');

                testDocument.addEventListener("click", clickSpy, false);

                testPage.mouseEvent(new EventInfo().initWithElement(testDocument.documentElement), "click", function () {
                    expect(clickSpy.handleClick).toHaveBeenCalled();
                });
            });

            it("should automatically remove a listener after first event delivery when once:true option is used", function () {
                var handleClickCalledCount = 0;
                    clickSpy = {
                    handleClick: function (event) {
                        handleClickCalledCount++;
                    }
                };

                testDocument.addEventListener("click", clickSpy, {capture: false, once: true});

                testPage.mouseEvent(new EventInfo().initWithElement(testDocument.documentElement), "click", function () {
                    expect(handleClickCalledCount).toEqual(1);
                });
                testPage.mouseEvent(new EventInfo().initWithElement(testDocument.documentElement), "click", function () {
                    expect(handleClickCalledCount).toEqual(1);
                });
            });


            it("should not interfere with inline DOM 0 event listener function", function () {

                var inlineCalled = false;

                var inlineClickSpy = function () {
                    inlineCalled = true;
                };
                testDocument.onclick = inlineClickSpy;

                var clickSpy = {
                    handleClick: function (event) {
                        console.log("handleClick(",event,") called");
                    }
                };
                spyOn(clickSpy, 'handleClick');
                testDocument.addEventListener("click", clickSpy, false);

                testPage.mouseEvent(new EventInfo().initWithElement(testDocument.documentElement), "click", function () {
                    expect(clickSpy.handleClick).toHaveBeenCalled();
                    expect(inlineCalled).toBeTruthy();
                });
            });

        });

        describe("when reporting registered event listeners", function () {

            it("should be able to report all the listeners registered for a specific eventType, regardless of target", function () {
                var docEventSpy = {};
                testDocument.addEventListener("foo", docEventSpy, false);

                var rootEventSpy = {};
                testDocument.documentElement.addEventListener("foo", rootEventSpy, false);

                var bubbleTestDocumentListeners = eventManager.registeredEventListenersForEventType_onTarget_phase_("foo",testDocument,false);
                var bubbleTestDocumentElementListeners = eventManager.registeredEventListenersForEventType_onTarget_phase_("foo",testDocument.documentElement,false);

                expect(bubbleTestDocumentListeners.listener).toEqual(docEventSpy);
                expect(bubbleTestDocumentElementListeners.listener).toEqual(rootEventSpy);

                var captureTestDocumentListeners = eventManager.registeredEventListenersForEventType_onTarget_phase_("foo",testDocument,true);
                var captureTestDocumentElementListeners = eventManager.registeredEventListenersForEventType_onTarget_phase_("foo",testDocument.documentElement,true);

                expect(captureTestDocumentListeners).toBeNull();
                expect(captureTestDocumentElementListeners).toBeNull();
            });

            it("should be able to report all the listeners registered for a specific eventType on a specific target", function () {
                var docEventSpy = {};
                testDocument.addEventListener("bar", docEventSpy, false);

                var rootEventSpy = {};
                testDocument.documentElement.addEventListener("bar", rootEventSpy, false);

                var listeners = eventManager.registeredEventListenersForEventType_onTarget_("bar", testDocument);

                expect(listeners).toEqual(docEventSpy);
                expect(listeners).toEqual(rootEventSpy);
            });

        });

        describe("when removing event listeners", function () {

            it("should correctly remove a registered event listener", function () {
                var listener = {},
                        listener2 = {};

                // Add two so we don't stop observing this event completely
                // when we remove one of the listeners
                testDocument.addEventListener("mousedown", listener, false);
                testDocument.addEventListener("mousedown", listener2, false);

                testDocument.removeEventListener("mousedown", listener2, false);

                var listeners = eventManager.registeredEventListenersForEventType_("mousedown");
                expect(listeners.has(listener)).toBeTruthy();
                expect(listeners.has(listener2)).toBeFalsy();
            });

            it("should remove a registered eventType when the last listener is removed", function () {
                var listener = {},
                    eventType = UUID.generate();

                testDocument.addEventListener(eventType, listener, false);
                testDocument.removeEventListener(eventType, listener, false);

                var listeners = eventManager.registeredEventListenersForEventType_(eventType);
                expect(listeners).toBeNull();
            });

            it("should remove the native event listener when the last listener for an eventType is removed", function () {
                var listener = {},
                    eventType = UUID.generate();

                testDocument.addEventListener(eventType, listener, false);
                testDocument.removeEventListener(eventType, listener, false);

                var originalHandler = eventManager.handleEvent;
                var handleEventCalled = false;
                eventManager.handleEvent = function () {
                    handleEventCalled = true;
                };

                var newEvent = document.createEvent("CustomEvent");
                newEvent.initCustomEvent(eventType, true, true, null);
                testDocument.dispatchEvent(newEvent);

                eventManager.handleEvent = originalHandler;
                expect(handleEventCalled).toBe(false);
            });

            it("should remove all registered listeners after being reset", function () {
                var listener = {},
                    listener2 = {},
                    eventType = UUID.generate(),
                    eventType2 = UUID.generate();

                testDocument.addEventListener(eventType, listener, false);
                testDocument.addEventListener(eventType, listener, true);

                testDocument.addEventListener(eventType2, listener, false);

                testDocument.defaultView.addEventListener(eventType2, listener2, false);
                testDocument.addEventListener(eventType2, listener2, false);

                eventManager.reset();
                var listenerEntries = eventManager.registeredEventListeners;
                expect(listenerEntries[eventType]).toBeFalsy();
                expect(listenerEntries[eventType2]).toBeFalsy();
            });

            xit("should still respond to activationEvent event type events even if the last interested listener is removed for an activationEvent event type", function () {
                var activationTarget = testPage.test.activationTarget;
                activationTarget.prepareForActivationEvents = function () {};

                spyOn(activationTarget, "prepareForActivationEvents");

                var otherListener = function () {};

                testDocument.addEventListener("mousedown", otherListener, false);
                testDocument.removeEventListener("mousedown", otherListener, false);


                testPage.mouseEvent(new EventInfo().initWithElement(activationTarget.element), "mousedown", function () {
                    expect(activationTarget.prepareForActivationEvents).toHaveBeenCalled();
                });
            });
        });

        describe("when distributing an event", function () {

            describe("with respect to phases", function () {

                it("should present the event to any listeners along the propagation path registered in the capture phase first", function () {

                    var captureCalled = false,
                            bubbleCalled = false;

                    var mousedownCaptureSpy = {
                        captureMousedown: function () {
                            expect(bubbleCalled).toBe(false);
                            captureCalled = true;
                        }
                    };

                    var mousedownBubbleSpy = {
                        handleMousedown: function () {
                            expect(captureCalled).toBe(true);
                            bubbleCalled = true;
                        }
                    };

                    spyOn(mousedownCaptureSpy, 'captureMousedown').and.callThrough();
                    spyOn(mousedownBubbleSpy, 'handleMousedown').and.callThrough();

                    //Introduce test for new options standard evolution
                    testDocument.addEventListener("mousedown", mousedownCaptureSpy, {capture: true});
                    testDocument.addEventListener("mousedown", mousedownBubbleSpy, false);

                    testPage.mouseEvent(new EventInfo().initWithElement(testDocument.documentElement), "mousedown", function () {
                        expect(mousedownCaptureSpy.captureMousedown).toHaveBeenCalled();
                        expect(mousedownBubbleSpy.handleMousedown).toHaveBeenCalled();
                    });

                });

                it("should present an event to capture listeners in the capture phase based on the DOM hierarchy from top to target, not in the order they registered", function () {

                    var calledHandlers = [];

                    var windowSpy = {
                        captureMousedown: function () {
                            expect(calledHandlers.length).toBe(0);
                            calledHandlers.push(this);
                        }
                    };
                    spyOn(windowSpy, 'captureMousedown').and.callThrough();

                    var documentSpy = {
                        captureMousedown: function () {
                            expect(calledHandlers.length).toBe(1);
                            calledHandlers.push(this);
                        }
                    };
                    spyOn(documentSpy, 'captureMousedown').and.callThrough();

                    var bodySpy = {
                        captureMousedown: function () {
                            expect(calledHandlers.length).toBe(2);
                            calledHandlers.push(this);
                        }
                    };
                    spyOn(bodySpy, 'captureMousedown').and.callThrough();

                    var parentSpy = {
                        captureMousedown: function () {
                            expect(calledHandlers.length).toBe(3);
                            calledHandlers.push(this);
                        }
                    };
                    spyOn(parentSpy, 'captureMousedown').and.callThrough();

                    var targetSpy = {
                        captureMousedown: function () {
                            expect(calledHandlers.length).toBe(4);
                            calledHandlers.push(this);
                        }
                    };
                    spyOn(targetSpy, 'captureMousedown').and.callThrough();


                    var target = testDocument.getElementById("element");
                    target.identifier = "target";
                    // We install these in the reverse order we expect them to be called in to ensure it's not the order
                    target.addEventListener("mousedown", targetSpy, true);
                    target.parentNode.addEventListener("mousedown", parentSpy, true);
                    target.parentNode.identifier = "parent";
                    testDocument.body.addEventListener("mousedown", bodySpy, true);
                    testDocument.body.identifier = "body";
                    testDocument.addEventListener("mousedown", documentSpy, true);
                    testDocument.identifier = "document";
                    testDocument.defaultView.addEventListener("mousedown", windowSpy, true);

                    testPage.mouseEvent(new EventInfo().initWithElement(target), "mousedown", function () {
                        expect(windowSpy.captureMousedown).toHaveBeenCalled();
                        expect(documentSpy.captureMousedown).toHaveBeenCalled();
                        expect(bodySpy.captureMousedown).toHaveBeenCalled();
                        expect(parentSpy.captureMousedown).toHaveBeenCalled();
                        expect(targetSpy.captureMousedown).toHaveBeenCalled();
                    });
                });

                it("should present an event to bubble listeners in the capture phase based on the DOM hierarchy from target to top, not in the order they registered", function () {

                    var calledHandlers = [];

                    var targetSpy = {
                        handleMousedown: function () {
                            expect(calledHandlers.length).toBe(0);
                            calledHandlers.push(this);
                        }
                    };
                    spyOn(targetSpy, 'handleMousedown').and.callThrough();

                    var parentSpy = {
                        handleMousedown: function () {
                            expect(calledHandlers.length).toBe(1);
                            calledHandlers.push(this);
                        }
                    };
                    spyOn(parentSpy, 'handleMousedown').and.callThrough();

                    var bodySpy = {
                        handleMousedown: function () {
                            expect(calledHandlers.length).toBe(2);
                            calledHandlers.push(this);
                        }
                    };
                    spyOn(bodySpy, 'handleMousedown').and.callThrough();

                    var documentSpy = {
                        handleMousedown: function () {
                            expect(calledHandlers.length).toBe(3);
                            calledHandlers.push(this);
                        }
                    };
                    spyOn(documentSpy, 'handleMousedown').and.callThrough();

                    var windowSpy = {
                        handleMousedown: function () {
                            expect(calledHandlers.length).toBe(4);
                            calledHandlers.push(this);
                        }
                    };
                    spyOn(windowSpy, 'handleMousedown').and.callThrough();

                    var target = testDocument.getElementById("element");

                    // We install these in the reverse order we expect them to be called in to ensure it's not the order
                    testDocument.defaultView.addEventListener("mousedown", windowSpy, false);
                    testDocument.addEventListener("mousedown", documentSpy, false);
                    testDocument.body.addEventListener("mousedown", bodySpy, false);
                    target.parentNode.addEventListener("mousedown", parentSpy, false);
                    target.addEventListener("mousedown", targetSpy, false);

                    testPage.mouseEvent(new EventInfo().initWithElement(target), "mousedown", function () {
                        expect(windowSpy.handleMousedown).toHaveBeenCalled();
                        expect(documentSpy.handleMousedown).toHaveBeenCalled();
                        expect(bodySpy.handleMousedown).toHaveBeenCalled();
                        expect(parentSpy.handleMousedown).toHaveBeenCalled();
                        expect(targetSpy.handleMousedown).toHaveBeenCalled();
                    });
                });

                it ("should present an event to capture listeners that are functions themselves when the event is at target", function () {
                    var bubbleCalled = false;

                    testDocument.documentElement.addEventListener("mousedown", function (evt) {
                        expect(this).toBe(evt.currentTarget);
                        bubbleCalled = true;
                    }, true);

                    testPage.mouseEvent(new EventInfo().initWithElement(testDocument.documentElement), "mousedown", function () {
                        expect(bubbleCalled).toBeTruthy();
                    });
                });

                it ("should present an event to bubble listeners that are functions themselves during the capture phase", function () {
                    var bubbleCalled = false;

                    testDocument.addEventListener("mousedown", function (evt) {
                        expect(this).toBe(evt.currentTarget);
                        bubbleCalled = true;
                    }, true);

                    testPage.mouseEvent(new EventInfo().initWithElement(testDocument.documentElement), "mousedown", function () {
                        expect(bubbleCalled).toBeTruthy();
                    });
                });

                it ("should present an event to bubble listeners that are functions themselves when the event is at target", function () {
                    var bubbleCalled = false;

                    testDocument.documentElement.addEventListener("mousedown", function (evt) {
                        expect(this).toBe(evt.currentTarget);
                        bubbleCalled = true;
                    }, false);

                    testPage.mouseEvent(new EventInfo().initWithElement(testDocument.documentElement), "mousedown", function () {
                        expect(bubbleCalled).toBeTruthy();
                    });
                });

                it ("should present an event to bubble listeners that are functions themselves during the event phase", function () {
                    var bubbleCalled = false;

                    testDocument.addEventListener("mousedown", function (evt) {
                        expect(this).toBe(evt.currentTarget);
                        bubbleCalled = true;
                    }, false);

                    testPage.mouseEvent(new EventInfo().initWithElement(testDocument.documentElement), "mousedown", function () {
                        expect(bubbleCalled).toBeTruthy();
                    });
                });

                it("must not present the event to the generic handler in a phase the listener has not registered in", function () {

                    var eventCaptureSpy = {
                        handleEvent: function (event) {
                            expect(event.eventPhase).toBe(CAPTURING_PHASE);
                        }
                    };

                    var eventBubbleSpy = {
                        handleEvent: function (event) {
                            expect(event.eventPhase).toBe(BUBBLING_PHASE);
                        }
                    };

                    spyOn(eventCaptureSpy, 'handleEvent').and.callThrough();
                    spyOn(eventBubbleSpy, 'handleEvent').and.callThrough();

                    testDocument.addEventListener("mousedown", eventCaptureSpy, true);
                    testDocument.addEventListener("mousedown", eventBubbleSpy, false);

                    testPage.mouseEvent(new EventInfo().initWithElement(testDocument.documentElement), "mousedown", function () {
                        expect(eventCaptureSpy.handleEvent).toHaveBeenCalled();
                        expect(eventBubbleSpy.handleEvent).toHaveBeenCalled();
                    });
                });

                it("should present the event at the CAPTURING_PHASE when the current target is triggered during the capture phase and the current target is not the proximal target", function () {

                    var eventSpy = {
                        handleEvent: function (event) {
                            expect(event.eventPhase).toBe(CAPTURING_PHASE);
                        }
                    };

                    spyOn(eventSpy, 'handleEvent').and.callThrough();

                    testDocument.addEventListener("mousedown", eventSpy, true);

                    testPage.mouseEvent(new EventInfo().initWithElement(testDocument.documentElement), "mousedown", function () {
                        expect(eventSpy.handleEvent).toHaveBeenCalled();
                    });

                });

                it("should present the event at the AT_TARGET when the current target is the proximal target when the listener registered for the capture phase", function () {
                    var eventSpy = {
                        handleEvent: function (event) {
                            expect(event.eventPhase).toBe(AT_TARGET);
                        }
                    };

                    spyOn(eventSpy, 'handleEvent').and.callThrough();

                    testDocument.addEventListener("mousedown", eventSpy, true);

                    testPage.mouseEvent(new EventInfo().initWithElement(testDocument), "mousedown", function () {
                        expect(eventSpy.handleEvent).toHaveBeenCalled();
                    });

                });

                it("should present the event at the AT_TARGET when the current target is the proximal target when the listener registered for the bubble phase", function () {
                    var eventSpy = {
                        handleEvent: function (event) {
                            expect(event.eventPhase).toBe(AT_TARGET);
                        }
                    };

                    spyOn(eventSpy, 'handleEvent').and.callThrough();

                    testDocument.addEventListener("mousedown", eventSpy, false);

                    testPage.mouseEvent(new EventInfo().initWithElement(testDocument), "mousedown", function () {
                        expect(eventSpy.handleEvent).toHaveBeenCalled();
                    });

                });

                it("should present the event at the BUBBLING_PHASE during the bubble phase and the current target is not the proximal target", function () {

                    var eventSpy = {
                        handleEvent: function (event) {
                            expect(event.eventPhase).toBe(BUBBLING_PHASE);
                        }
                    };

                    spyOn(eventSpy, 'handleEvent').and.callThrough();

                    testDocument.addEventListener("mousedown", eventSpy, false);

                    testPage.mouseEvent(new EventInfo().initWithElement(testDocument.body), "mousedown", function () {
                        expect(eventSpy.handleEvent).toHaveBeenCalled();
                    });

                });

                it("must set the event phase as NONE after distribution", function () {
                    var event;
                    var eventSpy = {
                        handleEvent: function (evt) {
                            event = evt;
                        }
                    };

                    spyOn(eventSpy, 'handleEvent').and.callThrough();

                    testDocument.addEventListener("mousedown", eventSpy, false);

                    testPage.mouseEvent(new EventInfo().initWithElement(testDocument), "mousedown", function () {
                        expect(eventSpy.handleEvent).toHaveBeenCalled();
                    });

                    expect(event.eventPhase).toBe(NONE);
                });

                describe("adding listeners during distribution", function () {

                    it("should distribute the event if the added listener would receive the event after the point that it was added", function () {
                        var lateAddedRootListener = {
                            handleEvent: function () {

                            }
                        };

                        var bodyListener = {
                            handleEvent: function () {
                                testDocument.documentElement.addEventListener("mousedown", lateAddedRootListener, false);
                            }
                        };

                        spyOn(bodyListener, 'handleEvent').and.callThrough();
                        spyOn(lateAddedRootListener, 'handleEvent');

                        testDocument.body.addEventListener("mousedown", bodyListener, false);

                        testPage.mouseEvent(new EventInfo().initWithElement(testDocument.body), "mousedown", function () {
                            expect(lateAddedRootListener.handleEvent).toHaveBeenCalled();
                        });
                    });

                });

            });

            describe("with respect to the currentTarget property", function () {

                it("must set the currentTarget as null after distribution", function () {
                    var event;
                    var eventSpy = {
                        handleEvent: function (evt) {
                            event = evt;
                        }
                    };

                    spyOn(eventSpy, 'handleEvent').and.callThrough();

                    testDocument.addEventListener("mousedown", eventSpy, false);

                    testPage.mouseEvent(new EventInfo().initWithElement(testDocument), "mousedown", function () {
                        expect(eventSpy.handleEvent).toHaveBeenCalled();
                    });

                    expect(event.currentTarget).toBeNull();
                });

            });

            describe("with respect to handler method names", function () {

                it("must not present the event to a generic handler function if a more specific eventType handler method is available", function () {

                    var eventSpy = {
                        handleMousedown: function () {
                        },

                        handleEvent: function () {
                        }
                    };

                    spyOn(eventSpy, 'handleMousedown');
                    spyOn(eventSpy, 'handleEvent');

                    testDocument.addEventListener("mousedown", eventSpy, false);

                    testPage.mouseEvent(new EventInfo().initWithElement(testDocument.documentElement), "mousedown", function () {
                        expect(eventSpy.handleMousedown).toHaveBeenCalled();
                        expect(eventSpy.handleEvent).not.toHaveBeenCalled();
                    });

                });

                it("should present the event to the generic handler if no specific handler is present, in either event phase", function () {

                    var handledEventCount = 0;
                    var eventSpy = {
                        handleEvent: function () {
                            handledEventCount++;
                        }
                    };

                    spyOn(eventSpy, 'handleEvent').and.callThrough();

                    testDocument.addEventListener("mousedown", eventSpy, false);
                    testDocument.addEventListener("mousedown", eventSpy, true);

                    testPage.mouseEvent(new EventInfo().initWithElement(testDocument.documentElement), "mousedown", function () {
                        expect(eventSpy.handleEvent).toHaveBeenCalled();
                        expect(handledEventCount).toBe(2);
                    });

                });


                it("must apply Montage features to arbitrary objects inheriting from EventTarget", function () {

                    var eventSpy = {
                        handleSuccess: function (event) {
                        },
                        handleEvent: function (event) {
                        }
                    };

                    spyOn(eventSpy, 'handleSuccess');
                    spyOn(eventSpy, 'handleEvent');

                    var request = window.indexedDB.open("MyTestDatabase", 1);
                    request.addEventListener("success", eventSpy, false);

                    var DBDeleteRequest = window.indexedDB.deleteDatabase("MyTestDatabase");

                    DBDeleteRequest.onerror = function(event) {
                        expect(eventSpy.handleSuccess).toHaveBeenCalled();
                        expect(eventSpy.handleEvent).not.toHaveBeenCalled();
                    };

                    DBDeleteRequest.onsuccess = function(event) {
                      expect(eventSpy.handleSuccess).toHaveBeenCalled();
                      expect(eventSpy.handleEvent).not.toHaveBeenCalled();
                    };
                });


                describe("involving identifiers", function () {

                    beforeEach(function () {
                        testDocument.documentElement.identifier = "foo";
                    });

                    afterEach(function () {
                        delete testDocument.documentElement.identifier;
                    })

                    it("should handle the event using the identifier from the original target as part of the handler method name, for listeners on the original target", function () {
                        var eventSpy = {
                            handleFooMousedown: function () {}
                        };

                        spyOn(eventSpy, 'handleFooMousedown');

                        testDocument.documentElement.addEventListener("mousedown", eventSpy, false);

                        testPage.mouseEvent(new EventInfo().initWithElement(testDocument.documentElement), "mousedown", function () {
                            expect(eventSpy.handleFooMousedown).toHaveBeenCalled();
                        });
                    });

                    it("should handle the event using the identifier from the original target as part of the handler method name, for listeners along the distribution chain", function () {
                        var eventSpy = {
                            handleFooMousedown: function () {}
                        };

                        spyOn(eventSpy, 'handleFooMousedown');

                        testDocument.identifier = "document";
                        testDocument.addEventListener("mousedown", eventSpy, false);

                        testPage.mouseEvent(new EventInfo().initWithElement(testDocument.documentElement), "mousedown", function () {
                            expect(eventSpy.handleFooMousedown).toHaveBeenCalled();
                        });

                        delete testDocument.identifier;
                    });

                    it("should handle the event using the identifier from the current target as part of the handler method name, for listeners along the distribution chain", function () {
                        var eventSpy = {
                            handleDocumentMousedown: function () {
                            }
                        };

                        spyOn(eventSpy, 'handleDocumentMousedown');

                        testDocument.identifier = "document";
                        testDocument.addEventListener("mousedown", eventSpy, false);
                        var target = testDocument.getElementById("element");

                        testPage.mouseEvent(new EventInfo().initWithElement(target), "mousedown", function () {
                            expect(eventSpy.handleDocumentMousedown).toHaveBeenCalled();
                        });

                        delete testDocument.identifier;
                    });

                    it("should handle the event using the most specific currentTarget identifier handler even if the original target has no identifier", function () {

                        var eventSpy = {

                            handleDocumentMousedown: function () {
                            },

                            handleMousedown: function () {
                            }
                        };

                        spyOn(eventSpy, 'handleDocumentMousedown');
                        spyOn(eventSpy, 'handleMousedown');

                        testDocument.identifier = "document";

                        testDocument.addEventListener("mousedown", eventSpy, false);

                        testPage.mouseEvent(new EventInfo().initWithElement(testDocument.documentElement), "mousedown", function () {
                            expect(eventSpy.handleMousedown).not.toHaveBeenCalled();
                            expect(eventSpy.handleDocumentMousedown).toHaveBeenCalled();
                        });

                        delete testDocument.identifier;
                    });

                    it("must handle the event using an identifier based handler based on the current target if present, even if it is not also the original event target", function () {
                        var eventSpy = {
                            handleDocumentMousedown: function () {}
                        };

                        spyOn(eventSpy, 'handleDocumentMousedown');

                        testDocument.identifier = "document";
                        testDocument.addEventListener("mousedown", eventSpy, false);

                        testPage.mouseEvent(new EventInfo().initWithElement(testDocument.documentElement), "mousedown", function () {
                            expect(eventSpy.handleDocumentMousedown).toHaveBeenCalled();
                        });

                        delete testDocument.identifier;
                    });
                });
            });

            describe("dispatched from the document", function () {

                it("should distribute the event to listeners of the proximal target", function () {
                    var captureCalled = false,
                        bubbleCalled = false;

                    var fooCaptureSpy = {
                        captureFoo: function () {
                            expect(bubbleCalled).toBe(false);
                            captureCalled = true;
                        }
                    };

                    var fooBubbleSpy = {
                        handleFoo: function () {
                            expect(captureCalled).toBe(true);
                            bubbleCalled = true;
                        }
                    };

                    spyOn(fooCaptureSpy, 'captureFoo').and.callThrough();
                    spyOn(fooBubbleSpy, 'handleFoo').and.callThrough();

                    testDocument.addEventListener("foo", fooCaptureSpy, true);
                    testDocument.addEventListener("foo", fooBubbleSpy, false);

                    var event = testDocument.createEvent("CustomEvent");
                    event.initEvent("foo", true, true);
                    testDocument.dispatchEvent(event);

                    testDocument.removeEventListener("foo", fooCaptureSpy, true);
                    testDocument.removeEventListener("foo", fooBubbleSpy, false);

                    expect(fooCaptureSpy.captureFoo).toHaveBeenCalled();
                    expect(fooBubbleSpy.handleFoo).toHaveBeenCalled();
                });

                it("should distribute the event to listeners along the distribution chain", function () {
                    var captureCalled = false,
                        bubbleCalled = false;

                    var fooCaptureSpy = {
                        captureFoo: function () {
                            expect(bubbleCalled).toBe(false);
                            captureCalled = true;
                        }
                    };

                    var fooBubbleSpy = {
                        handleFoo: function () {
                            expect(captureCalled).toBe(true);
                            bubbleCalled = true;
                        }
                    };

                    spyOn(fooCaptureSpy, 'captureFoo').and.callThrough();
                    spyOn(fooBubbleSpy, 'handleFoo').and.callThrough();

                    testDocument.defaultView.addEventListener("foo", fooCaptureSpy, true);
                    testDocument.defaultView.addEventListener("foo", fooBubbleSpy, false);

                    var event = testDocument.createEvent("CustomEvent");
                    event.initEvent("foo", true, true);
                    testDocument.dispatchEvent(event);

                    testDocument.defaultView.removeEventListener("foo", fooCaptureSpy, true);
                    testDocument.defaultView.removeEventListener("foo", fooBubbleSpy, false);

                    expect(fooCaptureSpy.captureFoo).toHaveBeenCalled();
                    expect(fooBubbleSpy.handleFoo).toHaveBeenCalled();
                });
            });

            describe("dispatched from the window", function () {
                it("should distribute the event to listeners of the proximal target", function () {
                    var captureCalled = false,
                        bubbleCalled = false;

                    var fooCaptureSpy = {
                        captureFoo: function () {
                            expect(bubbleCalled).toBe(false);
                            captureCalled = true;
                        }
                    };

                    var fooBubbleSpy = {
                        handleFoo: function () {
                            expect(captureCalled).toBe(true);
                            bubbleCalled = true;
                        }
                    };

                    spyOn(fooCaptureSpy, 'captureFoo').and.callThrough();
                    spyOn(fooBubbleSpy, 'handleFoo').and.callThrough();

                    testDocument.defaultView.addEventListener("foo", fooCaptureSpy, true);
                    testDocument.defaultView.addEventListener("foo", fooBubbleSpy, false);

                    var event = testDocument.createEvent("CustomEvent");
                    event.initEvent("foo", true, true);
                    testDocument.defaultView.dispatchEvent(event);

                    testDocument.defaultView.removeEventListener("foo", fooCaptureSpy, true);
                    testDocument.defaultView.removeEventListener("foo", fooBubbleSpy, false);

                    expect(fooCaptureSpy.captureFoo).toHaveBeenCalled();
                    expect(fooBubbleSpy.handleFoo).toHaveBeenCalled();
                });
            });

        });

        // TODO verify the desired behavior in edge cases
        describe("when determining where to install a native event listener", function () {

            it("should install listeners on a document if the requested target is a window", function () {
                var testWindow = testDocument.defaultView;
                var actualTarget = eventManager.actualDOMTargetForEventTypeOnTarget("mousedown", testWindow);

                expect(actualTarget).toBe(testDocument);
            });

            it("should install listeners on a document if the requested target is a document", function () {
                var actualTarget = eventManager.actualDOMTargetForEventTypeOnTarget("mousedown", testDocument);

                expect(actualTarget).toBe(testDocument);
            });

            it("should install listeners on a document if the requested target is an element", function () {
                var actualTarget = eventManager.actualDOMTargetForEventTypeOnTarget("mousedown", testDocument.documentElement);

                expect(actualTarget).toBe(testDocument);
            });

            it("should install listeners on the specified target if the eventType is 'load'", function () {
                var actualTarget = eventManager.actualDOMTargetForEventTypeOnTarget("load", testDocument.documentElement);
                expect(actualTarget).toBe(testDocument.documentElement);

                actualTarget = eventManager.actualDOMTargetForEventTypeOnTarget("load", testDocument);
                expect(actualTarget).toBe(testDocument);

                var testWindow = testDocument.defaultView;
                actualTarget = eventManager.actualDOMTargetForEventTypeOnTarget("load", testWindow);
                expect(actualTarget).toBe(testWindow);
            });

            it("should install listeners on the specified target if the eventType is 'resize'", function () {
                var actualTarget = eventManager.actualDOMTargetForEventTypeOnTarget("resize", testDocument.documentElement);
                expect(actualTarget).toBe(testDocument.documentElement);

                actualTarget = eventManager.actualDOMTargetForEventTypeOnTarget("resize", testDocument);
                expect(actualTarget).toBe(testDocument);

                var testWindow = testDocument.defaultView;
                actualTarget = eventManager.actualDOMTargetForEventTypeOnTarget("resize", testWindow);
                expect(actualTarget).toBe(testWindow);
            });

        });

        describe("elements' event handler support", function () {
            var element;
            beforeEach(function () {
                element = testPage.querySelector("#element");
            });
            afterEach(function () {
                eventManager.unregisterEventHandlerForElement(element);
            });

            it("should install an event handler on an element", function () {
                var handler = {name: "handler"};

                eventManager.registerEventHandlerForElement(handler, element);
                expect(eventManager.eventHandlerForElement(element)).toBe(handler);
            });

            it("should uninstall an event handler on an element", function () {
                var handler = {name: "handler"};

                eventManager.registerEventHandlerForElement(handler, element);
                eventManager.unregisterEventHandlerForElement(element);
                expect(eventManager.eventHandlerForElement(element)).toBeUndefined();
                expect(eventManager._elementEventHandlerByElement.get(handler)).toBeUndefined();
            });

            it("should override an element's previous event handler", function () {
                var handler1 = {name: "handler1"},
                    handler2 = {name: "handler2"};

                eventManager.registerEventHandlerForElement(handler1, element);
                expect(eventManager._elementEventHandlerByElement.get(element)).toBeDefined();
                expect(eventManager.eventHandlerForElement(element)).toBe(handler1);
                eventManager.registerEventHandlerForElement(handler2, element);
                expect(eventManager.eventHandlerForElement(element)).toBe(handler2);
            });

            it("should install an event handler on an element after the previous one has been uninstalled", function () {
                var handler1 = {name: "handler1"},
                    handler2 = {name: "handler2"};

                eventManager.registerEventHandlerForElement(handler1, element);
                eventManager.unregisterEventHandlerForElement(element);
                eventManager.registerEventHandlerForElement(handler2, element);
                 expect(eventManager.eventHandlerForElement(element)).toBe(handler2);
            });
        });

        describe("serialization", function () {
            it("should call \"listeners\" deserialization unit", function (done) {
                var sourceObject = new Target(),
                    handlerObject = new Montage(),
                    serializer = new Serializer().initWithRequire(require),
                    deserializer = new Deserializer(),
                    actionListener = new ActionEventListener().initWithHandler_action_(handlerObject, "doSomething");

                sourceObject.addEventListener("action", actionListener, false);

                var serialization = serializer.serializeObject(sourceObject);
                var labels = {};
                labels.actioneventlistener = handlerObject;

                deserializer.init(serialization, require);

                var listenersUnit = MontageReviver._unitRevivers.get("listeners"),
                    listenersUnitCalled = false;
                MontageReviver._unitRevivers.set("listeners", function () {
                    MontageReviver._unitRevivers.set("listeners", listenersUnit);
                    listenersUnitCalled = true;
                });

                deserializer.deserialize(labels).then(function (objects) {
                    object = objects.root;
                    expect(listenersUnitCalled).toBe(true);
                    done();
                });
             });
        });

        describe("Target", function () {
            var target, testEvent;
            beforeEach(function () {
                target = new Target();
                testEvent = document.createEvent("CustomEvent");
                testEvent.initCustomEvent("test", true, true, null);
            });

            xdescribe("dispatchEvent", function () {
                it("returns false if the preventDefault was called on the event", function () {
                    target.addEventListener("test", function (event) {
                        event.preventDefault();
                    });

                    expect(target.dispatchEvent(testEvent)).toBe(false);
                });

                it("returns true if the preventDefault was not called on the event", function () {
                    target.addEventListener("test", function (event) {
                    });

                    expect(target.dispatchEvent(testEvent)).toBe(true);
                });
            });

            xdescribe("dispatchEventNamed", function () {
                it("returns false if the preventDefault was called on the event", function () {
                    target.addEventListener("test", function (event) {
                        event.preventDefault();
                    });

                    expect(target.dispatchEventNamed("test", true, true)).toBe(false);
                });

                it("returns true if the preventDefault was not called on the event", function () {
                    target.addEventListener("test", function (event) {
                    });

                    expect(target.dispatchEventNamed("test", true, true)).toBe(true);
                });
            });
        });
    });
});
