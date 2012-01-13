/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
var Montage = require("montage").Montage,
    ActionEventListener = require("montage/core/event/action-event-listener").ActionEventListener,
    Serializer = require("montage/core/serializer").Serializer,
    Deserializer = require("montage/core/deserializer").Deserializer,
    TestPageLoader = require("support/testpageloader").TestPageLoader,
    EventInfo = require("support/testpageloader").EventInfo,
    ChangeTypes = require("montage/core/event/mutable-event").ChangeTypes;

var global = typeof global !== "undefined" ? global : window;

var testPage = TestPageLoader.queueTest("eventmanagertest", function() {
    describe("events/eventmanager-spec", function() {
        it("should load", function() {
            expect(testPage.loaded).toBeTruthy();
        });

        var testDocument, eventManager;

        beforeEach(function() {
            testDocument = testPage.iframe.contentDocument;
            eventManager = testDocument.application.eventManager;
            eventManager.reset();
        });

        describe("when determining handler method names", function() {

            it('should correctly prefix the eventType with "capture" for the capture phase event handler method', function() {
                expect(eventManager.methodNameForCapturePhaseOfEventType_("mousedown")).toBe("captureMousedown");
            });

            it('should correctly prefix the eventType with "handle" for the bubble phase event handler method', function() {
                expect(eventManager.methodNameForBubblePhaseOfEventType_("mousedown")).toBe("handleMousedown");
            });

            it("must not alter inner capitalization of capture phase event handler method names", function() {
                expect(eventManager.methodNameForCapturePhaseOfEventType_("DOMContentReady")).toBe("captureDOMContentReady");
            });

            it("must not alter inner capitalization of bubble phase event handler method names", function() {
                expect(eventManager.methodNameForBubblePhaseOfEventType_("DOMContentReady")).toBe("handleDOMContentReady");
            });

            it("should inject the specified target identifier as part of the bubble phase event handler method name", function() {
                expect(eventManager.methodNameForBubblePhaseOfEventType_("click", "testButton")).toBe("handleTestButtonClick");
            });

            it("should inject the specified target identifier as part of the capture phase event handler method name", function() {
                expect(eventManager.methodNameForCapturePhaseOfEventType_("click", "testButton")).toBe("captureTestButtonClick");
            });
        });

        describe("when registering a window", function() {

            it("should be installed as the defaultManager in the current window", function() {
                expect(eventManager).toBeTruthy();
            });

            it("should have overridden the addEventListener for window", function() {
                var testWindow = testDocument.defaultView;
                expect(testWindow.nativeAddEventListener).toBeTruthy();
                expect(testWindow.nativeAddEventListener).toNotBe(testWindow.addEventListener);
            });

            it("should have overridden the addEventListener for document", function() {
                expect(testDocument.nativeAddEventListener).toBeTruthy();
                expect(testDocument.nativeAddEventListener).toNotBe(testDocument.addEventListener);
            });

            it("should have overridden the addEventListener for Element", function() {
                var testElement = testDocument.defaultView.Element.prototype;
                expect(testElement.nativeAddEventListener).toBeTruthy();
                expect(testElement.nativeAddEventListener).toNotBe(testElement.addEventListener);
            });

            it("should have overridden the addEventListener for XMLHttpRequest", function() {
                var request = testDocument.defaultView.XMLHttpRequest.prototype;
                expect(request.nativeAddEventListener).toBeTruthy();
                expect(request.nativeAddEventListener).toNotBe(request.addEventListener);
            });

            it("should have overridden the removeEventListener for window", function() {
                var testWindow = testDocument.defaultView;
                expect(testWindow.nativeRemoveEventListener).toBeTruthy();
                expect(testWindow.nativeRemoveEventListener).toNotBe(testWindow.removeEventListener);
            });

            it("should have overridden the removeEventListener for document", function() {
                expect(testDocument.nativeRemoveEventListener).toBeTruthy();
                expect(testDocument.nativeRemoveEventListener).toNotBe(testDocument.removeEventListener);
            });

            it("should have overridden the removeEventListener for Element", function() {
                var testElement = testDocument.defaultView.Element.prototype;
                expect(testElement.nativeRemoveEventListener).toBeTruthy();
                expect(testElement.nativeRemoveEventListener).toNotBe(testElement.removeEventListener);
            });

            it("should have overridden the removeEventListener for XMLHttpRequest", function() {
                var request = testDocument.defaultView.XMLHttpRequest.prototype;
                expect(request.nativeRemoveEventListener).toBeTruthy();
                expect(request.nativeRemoveEventListener).toNotBe(request.removeEventListener);
            });
        });

        describe("when adding event listeners", function() {

            it("should record that the listener cares about an event on the target", function() {
                var listener = Montage.create();
                testDocument.addEventListener("mousedown", listener, false);

                var listenerEntry = eventManager.registeredEventListeners["mousedown"][testDocument.uuid].listeners[listener.uuid];
                expect(listenerEntry.bubble).toBe(true);
                expect(listenerEntry.capture).toBe(false);
                expect(listenerEntry.listener).toBe(listener);
            });

            it("should add a native event listener when the first listener for an eventType is added for a target", function() {
                var listener = {},
                        eventType = Montage.generateUID();

                testDocument.addEventListener(eventType, listener, false);

                var originalHandler = eventManager.handleEvent;
                var handleEventCalled = false;
                eventManager.handleEvent = function() {
                    handleEventCalled = true;
                };

                var newEvent = document.createEvent("CustomEvent");
                newEvent.initCustomEvent(eventType, true, true, null);
                testDocument.dispatchEvent(newEvent);

                eventManager.handleEvent = originalHandler;
                expect(handleEventCalled).toBe(true);
            });

            it("should present an event to any listeners watching for that event type on a specific target", function() {
                var clickSpy = {
                    handleClick: function(event) {
                    }
                };
                spyOn(clickSpy, 'handleClick');

                testDocument.addEventListener("click", clickSpy, false);

                testPage.mouseEvent(EventInfo.create().initWithElement(testDocument.documentElement), "click", function() {
                    expect(clickSpy.handleClick).toHaveBeenCalled();
                });
            });
             //Firefox doesn't allow objects as DOM 0 event listener
            if (global.navigator && global.navigator.userAgent.indexOf("Firefox") === -1) {
                it("should not interfere with inline DOM 0 event listener objects", function() {
                    var inlineClickSpy = {
                        handleEvent: function(event) {
                        }
                    };
                    spyOn(inlineClickSpy, 'handleEvent');

                    testDocument.onclick = inlineClickSpy;

                    var clickSpy = {
                        handleClick: function(event) {
                        }
                    };
                    spyOn(clickSpy, 'handleClick');
                    testDocument.addEventListener("click", clickSpy, false);

                    testPage.mouseEvent(EventInfo.create().initWithElement(testDocument.documentElement), "click", function() {
                        expect(clickSpy.handleClick).toHaveBeenCalled();
                        expect(inlineClickSpy.handleEvent).toHaveBeenCalled();
                    });
                });
            }


            it("should not interfere with inline DOM 0 event listener function", function() {

                var inlineCalled = false;

                var inlineClickSpy = function() {
                    inlineCalled = true;
                };
                testDocument.onclick = inlineClickSpy;

                var clickSpy = {
                    handleClick: function(event) {
                    }
                };
                spyOn(clickSpy, 'handleClick');
                testDocument.addEventListener("click", clickSpy, false);

                testPage.mouseEvent(EventInfo.create().initWithElement(testDocument.documentElement), "click", function() {
                    expect(clickSpy.handleClick).toHaveBeenCalled();
                    expect(inlineCalled).toBeTruthy();
                });
            });

        });

        describe("when reporting registered event listeners", function() {

            it("should be able to report all the listeners registered for a specific eventType, regardless of target", function() {
                var docEventSpy = {};
                testDocument.addEventListener("foo", docEventSpy, false);

                var rootEventSpy = {};
                testDocument.documentElement.addEventListener("foo", rootEventSpy, false);

                var listeners = eventManager.registeredEventListenersForEventType_("foo"),
                        docListenerEntry = listeners[docEventSpy.uuid],
                        rootListenerEntry = listeners[rootEventSpy.uuid];

                expect(docListenerEntry).toBeTruthy();
                expect(rootListenerEntry).toBeTruthy();

                expect(docListenerEntry.capture).toBeFalsy();
                expect(rootListenerEntry.capture).toBeFalsy();

                expect(docListenerEntry.bubble).toBeTruthy();
                expect(rootListenerEntry.bubble).toBeTruthy();

                expect(docListenerEntry.listener).toBe(docEventSpy);
                expect(rootListenerEntry.listener).toBe(rootEventSpy);
            });

            it("should be able to report all the listeners registered for a specific eventType on a specific target", function() {
                var docEventSpy = {};
                testDocument.addEventListener("bar", docEventSpy, false);

                var rootEventSpy = {};
                testDocument.documentElement.addEventListener("bar", rootEventSpy, false);

                var listeners = eventManager.registeredEventListenersForEventType_onTarget_("bar", testDocument),
                        docListenerEntry = listeners[docEventSpy.uuid],
                        rootListenerEntry = listeners[rootEventSpy.uuid];

                expect(docListenerEntry).toBeTruthy();
                expect(rootListenerEntry).toBeFalsy();

                expect(docListenerEntry.capture).toBeFalsy();
                expect(docListenerEntry.bubble).toBeTruthy();
                expect(docListenerEntry.listener).toBe(docEventSpy);
            });

        });

        describe("when removing event listeners", function() {

            it("should correctly remove a registered event listener", function() {
                var listener = {},
                        listener2 = {};

                // Add two so we don't stop observing this event completely
                // when we remove one of the listeners
                testDocument.addEventListener("mousedown", listener, false);
                testDocument.addEventListener("mousedown", listener2, false);

                testDocument.removeEventListener("mousedown", listener2, false);

                var listeners = eventManager.registeredEventListenersForEventType_("mousedown");
                expect(listeners[listener.uuid]).toBeTruthy();
                expect(listeners[listener2.uuid]).toBeFalsy();
            });

            it("should remove a registered eventType when the last listener is removed", function() {
                var listener = {},
                        eventType = Montage.generateUID();

                testDocument.addEventListener(eventType, listener, false);
                testDocument.removeEventListener(eventType, listener, false);

                var listeners = eventManager.registeredEventListenersForEventType_(eventType);
                expect(listeners).toBeNull();
            });

            it("should remove the native event listener when the last listener for an eventType is removed", function() {
                var listener = {},
                        eventType = Montage.generateUID();

                testDocument.addEventListener(eventType, listener, false);
                testDocument.removeEventListener(eventType, listener, false);

                var originalHandler = eventManager.handleEvent;
                var handleEventCalled = false;
                eventManager.handleEvent = function() {
                    handleEventCalled = true;
                };

                var newEvent = document.createEvent("CustomEvent");
                newEvent.initCustomEvent(eventType, true, true, null);
                testDocument.dispatchEvent(newEvent);

                eventManager.handleEvent = originalHandler;
                expect(handleEventCalled).toBe(false);
            });

            it("should remove all registered listeners after being reset", function() {
                var listener = {},
                        listener2 = {},
                        eventType = Montage.generateUID(),
                        eventType2 = Montage.generateUID();

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

            it("should still respond to activationEvent event type events even if the last interested listener is removed for an activationEvent event type", function() {
                var activationTarget = testPage.test.activationTarget;
                activationTarget.prepareForActivationEvents = function() {};

                spyOn(activationTarget, "prepareForActivationEvents");

                var otherListener = function() {};

                testDocument.addEventListener("mousedown", otherListener, false);
                testDocument.removeEventListener("mousedown", otherListener, false);


                testPage.mouseEvent(EventInfo.create().initWithElement(activationTarget.element), "mousedown", function() {
                    expect(activationTarget.prepareForActivationEvents).toHaveBeenCalled();
                });
            });
        });

        describe("when distributing an event", function() {

            describe("with respect to phases", function() {

                it("should present the event to any listeners along the propagation path registered in the capture phase first", function() {

                    var captureCalled = false,
                            bubbleCalled = false;

                    var mousedownCaptureSpy = {
                        captureMousedown: function() {
                            expect(bubbleCalled).toBe(false);
                            captureCalled = true;
                        }
                    };

                    var mousedownBubbleSpy = {
                        handleMousedown: function() {
                            expect(captureCalled).toBe(true);
                            bubbleCalled = true;
                        }
                    };

                    spyOn(mousedownCaptureSpy, 'captureMousedown').andCallThrough();
                    spyOn(mousedownBubbleSpy, 'handleMousedown').andCallThrough();

                    testDocument.addEventListener("mousedown", mousedownCaptureSpy, true);
                    testDocument.addEventListener("mousedown", mousedownBubbleSpy, false);

                    testPage.mouseEvent(EventInfo.create().initWithElement(testDocument.documentElement), "mousedown", function() {
                        expect(mousedownCaptureSpy.captureMousedown).toHaveBeenCalled();
                        expect(mousedownBubbleSpy.handleMousedown).toHaveBeenCalled();
                    });

                });

                it("should present an event to capture listeners in the capture phase based on the DOM hierarchy from top to target, not in the order they registered", function() {

                    var calledHandlers = [];

                    var windowSpy = {
                        captureMousedown: function() {
                            expect(calledHandlers.length).toBe(0);
                            calledHandlers.push(this);
                        }
                    };
                    spyOn(windowSpy, 'captureMousedown').andCallThrough();

                    var documentSpy = {
                        captureMousedown: function() {
                            expect(calledHandlers.length).toBe(1);
                            calledHandlers.push(this);
                        }
                    };
                    spyOn(documentSpy, 'captureMousedown').andCallThrough();

                    var bodySpy = {
                        captureMousedown: function() {
                            expect(calledHandlers.length).toBe(2);
                            calledHandlers.push(this);
                        }
                    };
                    spyOn(bodySpy, 'captureMousedown').andCallThrough();

                    var parentSpy = {
                        captureMousedown: function() {
                            expect(calledHandlers.length).toBe(3);
                            calledHandlers.push(this);
                        }
                    };
                    spyOn(parentSpy, 'captureMousedown').andCallThrough();

                    var targetSpy = {
                        captureMousedown: function() {
                            expect(calledHandlers.length).toBe(4);
                            calledHandlers.push(this);
                        }
                    };
                    spyOn(targetSpy, 'captureMousedown').andCallThrough();


                    var target = testDocument.getElementById("element");

                    // We install these in the reverse order we expect them to be called in to ensure it's not the order
                    target.addEventListener("mousedown", targetSpy, true);
                    target.parentNode.addEventListener("mousedown", parentSpy, true);
                    testDocument.body.addEventListener("mousedown", bodySpy, true);
                    testDocument.addEventListener("mousedown", documentSpy, true);
                    testDocument.defaultView.addEventListener("mousedown", windowSpy, true);

                    testPage.mouseEvent(EventInfo.create().initWithElement(target), "mousedown", function() {
                        expect(windowSpy.captureMousedown).toHaveBeenCalled();
                        expect(documentSpy.captureMousedown).toHaveBeenCalled();
                        expect(bodySpy.captureMousedown).toHaveBeenCalled();
                        expect(parentSpy.captureMousedown).toHaveBeenCalled();
                        expect(targetSpy.captureMousedown).toHaveBeenCalled();
                    });
                });

                it("should present an event to bubble listeners in the capture phase based on the DOM hierarchy from target to top, not in the order they registered", function() {

                    var calledHandlers = [];

                    var targetSpy = {
                        handleMousedown: function() {
                            expect(calledHandlers.length).toBe(0);
                            calledHandlers.push(this);
                        }
                    };
                    spyOn(targetSpy, 'handleMousedown').andCallThrough();

                    var parentSpy = {
                        handleMousedown: function() {
                            expect(calledHandlers.length).toBe(1);
                            calledHandlers.push(this);
                        }
                    };
                    spyOn(parentSpy, 'handleMousedown').andCallThrough();

                    var bodySpy = {
                        handleMousedown: function() {
                            expect(calledHandlers.length).toBe(2);
                            calledHandlers.push(this);
                        }
                    };
                    spyOn(bodySpy, 'handleMousedown').andCallThrough();

                    var documentSpy = {
                        handleMousedown: function() {
                            expect(calledHandlers.length).toBe(3);
                            calledHandlers.push(this);
                        }
                    };
                    spyOn(documentSpy, 'handleMousedown').andCallThrough();

                    var windowSpy = {
                        handleMousedown: function() {
                            expect(calledHandlers.length).toBe(4);
                            calledHandlers.push(this);
                        }
                    };
                    spyOn(windowSpy, 'handleMousedown').andCallThrough();

                    var target = testDocument.getElementById("element");

                    // We install these in the reverse order we expect them to be called in to ensure it's not the order
                    testDocument.defaultView.addEventListener("mousedown", windowSpy, false);
                    testDocument.addEventListener("mousedown", documentSpy, false);
                    testDocument.body.addEventListener("mousedown", bodySpy, false);
                    target.parentNode.addEventListener("mousedown", parentSpy, false);
                    target.addEventListener("mousedown", targetSpy, false);

                    testPage.mouseEvent(EventInfo.create().initWithElement(target), "mousedown", function() {
                        expect(windowSpy.handleMousedown).toHaveBeenCalled();
                        expect(documentSpy.handleMousedown).toHaveBeenCalled();
                        expect(bodySpy.handleMousedown).toHaveBeenCalled();
                        expect(parentSpy.handleMousedown).toHaveBeenCalled();
                        expect(targetSpy.handleMousedown).toHaveBeenCalled();
                    });
                });

                it("must not present the event to the generic handler in a phase the listener has not registered in", function() {

                    var eventCaptureSpy = {
                        handleEvent: function(event) {
                            expect(event.eventPhase).toBe(event.CAPTURING_PHASE);
                        }
                    };

                    var eventBubbleSpy = {
                        handleEvent: function(event) {
                            expect(event.eventPhase).toBe(event.BUBBLING_PHASE);
                        }
                    };

                    spyOn(eventCaptureSpy, 'handleEvent').andCallThrough();
                    spyOn(eventBubbleSpy, 'handleEvent').andCallThrough();

                    testDocument.addEventListener("mousedown", eventCaptureSpy, true);
                    testDocument.addEventListener("mousedown", eventBubbleSpy, false);

                    testPage.mouseEvent(EventInfo.create().initWithElement(testDocument.documentElement), "mousedown", function() {
                        expect(eventCaptureSpy.handleEvent).toHaveBeenCalled();
                        expect(eventBubbleSpy.handleEvent).toHaveBeenCalled();
                    });
                });

                it("should present the event at the CAPTURING_PHASE when the current target is triggered during the capture phase and the current target is not the proximal target", function() {

                    var eventSpy = {
                        handleEvent: function(event) {
                            expect(event.eventPhase).toBe(event.CAPTURING_PHASE);
                        }
                    };

                    spyOn(eventSpy, 'handleEvent').andCallThrough();

                    testDocument.addEventListener("mousedown", eventSpy, true);

                    testPage.mouseEvent(EventInfo.create().initWithElement(testDocument.documentElement), "mousedown", function() {
                        expect(eventSpy.handleEvent).toHaveBeenCalled();
                    });

                });

                it("should present the event at the AT_TARGET when the current target is the proximal target when the listener registered for the capture phase", function() {
                    var eventSpy = {
                        handleEvent: function(event) {
                            expect(event.eventPhase).toBe(event.AT_TARGET);
                        }
                    };

                    spyOn(eventSpy, 'handleEvent').andCallThrough();

                    testDocument.addEventListener("mousedown", eventSpy, true);

                    testPage.mouseEvent(EventInfo.create().initWithElement(testDocument), "mousedown", function() {
                        expect(eventSpy.handleEvent).toHaveBeenCalled();
                    });

                });

                it("should present the event at the AT_TARGET when the current target is the proximal target when the listener registered for the bubble phase", function() {
                    var eventSpy = {
                        handleEvent: function(event) {
                            expect(event.eventPhase).toBe(event.AT_TARGET);
                        }
                    };

                    spyOn(eventSpy, 'handleEvent').andCallThrough();

                    testDocument.addEventListener("mousedown", eventSpy, false);

                    testPage.mouseEvent(EventInfo.create().initWithElement(testDocument), "mousedown", function() {
                        expect(eventSpy.handleEvent).toHaveBeenCalled();
                    });

                });

                it("should present the event at the BUBBLING_PHASE during the bubble phase and the current target is not the proximal target", function() {

                    var eventSpy = {
                        handleEvent: function(event) {
                            expect(event.eventPhase).toBe(event.BUBBLING_PHASE);
                        }
                    };

                    spyOn(eventSpy, 'handleEvent').andCallThrough();

                    testDocument.addEventListener("mousedown", eventSpy, false);

                    testPage.mouseEvent(EventInfo.create().initWithElement(testDocument.body), "mousedown", function() {
                        expect(eventSpy.handleEvent).toHaveBeenCalled();
                    });

                });

            });

            describe("with respect to handler method names", function() {

                it("must not present the event to a generic handler function if a more specific eventType handler method is available", function() {

                    var eventSpy = {
                        handleMousedown: function() {
                        },

                        handleEvent: function() {
                        }
                    };

                    spyOn(eventSpy, 'handleMousedown');
                    spyOn(eventSpy, 'handleEvent');

                    testDocument.addEventListener("mousedown", eventSpy, false);

                    testPage.mouseEvent(EventInfo.create().initWithElement(testDocument.documentElement), "mousedown", function() {
                        expect(eventSpy.handleMousedown).toHaveBeenCalled();
                        expect(eventSpy.handleEvent).not.toHaveBeenCalled();
                    });

                });

                it("should present the event to the generic handler if no specific handler is present, in either event phase", function() {

                    var handledEventCount = 0;
                    var eventSpy = {
                        handleEvent: function() {
                            handledEventCount++;
                        }
                    };

                    spyOn(eventSpy, 'handleEvent').andCallThrough();

                    testDocument.addEventListener("mousedown", eventSpy, false);
                    testDocument.addEventListener("mousedown", eventSpy, true);

                    testPage.mouseEvent(EventInfo.create().initWithElement(testDocument.documentElement), "mousedown", function() {
                        expect(eventSpy.handleEvent).toHaveBeenCalled();
                        expect(handledEventCount).toBe(2);
                    });

                });

                describe("involving identifiers", function() {

                    beforeEach(function() {
                        testDocument.documentElement.identifier = "foo";
                    });

                    afterEach(function() {
                        delete testDocument.documentElement.identifier;
                    })

                    it("should handle the event using the identifier from the original target as part of the handler method name, for listeners on the original target", function() {
                        var eventSpy = {
                            handleFooMousedown: function() {}
                        };

                        spyOn(eventSpy, 'handleFooMousedown');

                        testDocument.documentElement.addEventListener("mousedown", eventSpy, false);

                        testPage.mouseEvent(EventInfo.create().initWithElement(testDocument.documentElement), "mousedown", function() {
                            expect(eventSpy.handleFooMousedown).toHaveBeenCalled();
                        });
                    });

                    it("should handle the event using the identifier from the original target as part of the handler method name, for listeners along the distribution chain", function() {
                        var eventSpy = {
                            handleFooMousedown: function() {}
                        };

                        spyOn(eventSpy, 'handleFooMousedown');

                        testDocument.identifier = "document";
                        testDocument.addEventListener("mousedown", eventSpy, false);

                        testPage.mouseEvent(EventInfo.create().initWithElement(testDocument.documentElement), "mousedown", function() {
                            expect(eventSpy.handleFooMousedown).toHaveBeenCalled();
                        });

                        delete testDocument.identifier;
                    });

                    it("should handle the event using a less specific handler if the original target has no identifier, even if the currentTarget has an identifier", function() {

                        var eventSpy = {

                            handleDocumentMousedown: function() {
                            },

                            handleMousedown: function() {
                            }
                        };

                        spyOn(eventSpy, 'handleDocumentMousedown');
                        spyOn(eventSpy, 'handleMousedown');

                        testDocument.identifier = "document";

                        testDocument.addEventListener("mousedown", eventSpy, false);

                        testPage.mouseEvent(EventInfo.create().initWithElement(testDocument.documentElement), "mousedown", function() {
                            expect(eventSpy.handleMousedown).toHaveBeenCalled();
                            expect(eventSpy.handleDocumentMousedown).not.toHaveBeenCalled();
                        });

                        delete testDocument.identifier;
                    });

                    it("must not handle the event using an identifier based handler based on the current target, if it is not also the original event target", function() {
                        var eventSpy = {
                            handleDocumentMousedown: function() {}
                        };

                        spyOn(eventSpy, 'handleDocumentMousedown');

                        testDocument.identifier = "document";
                        testDocument.addEventListener("mousedown", eventSpy, false);

                        testPage.mouseEvent(EventInfo.create().initWithElement(testDocument.documentElement), "mousedown", function() {
                            expect(eventSpy.handleDocumentMousedown).not.toHaveBeenCalled();
                        });

                        delete testDocument.identifier;
                    });
                });
            });

        });

        // TODO verify the desired behavior in edge cases
        describe("when determining where to install a native event listener", function() {

            it("should install listeners on a document if the requested target is a window", function() {
                var testWindow = testDocument.defaultView;
                var actualTarget = eventManager.actualDOMTargetForEventType_onTarget_("mousedown", testWindow);

                expect(actualTarget).toBe(testDocument);
            });

            it("should install listeners on a document if the requested target is a document", function() {
                var actualTarget = eventManager.actualDOMTargetForEventType_onTarget_("mousedown", testDocument);

                expect(actualTarget).toBe(testDocument);
            });

            it("should install listeners on a document if the requested target is an element", function() {
                var actualTarget = eventManager.actualDOMTargetForEventType_onTarget_("mousedown", testDocument.documentElement);

                expect(actualTarget).toBe(testDocument);
            });

            it("should install listeners on the specified target if the eventType is 'load'", function() {
                var actualTarget = eventManager.actualDOMTargetForEventType_onTarget_("load", testDocument.documentElement);
                expect(actualTarget).toBe(testDocument.documentElement);

                actualTarget = eventManager.actualDOMTargetForEventType_onTarget_("load", testDocument);
                expect(actualTarget).toBe(testDocument);

                var testWindow = testDocument.defaultView;
                actualTarget = eventManager.actualDOMTargetForEventType_onTarget_("load", testWindow);
                expect(actualTarget).toBe(testWindow);
            });

            it("should install listeners on the specified target if the eventType is 'resize'", function() {
                var actualTarget = eventManager.actualDOMTargetForEventType_onTarget_("resize", testDocument.documentElement);
                expect(actualTarget).toBe(testDocument.documentElement);

                actualTarget = eventManager.actualDOMTargetForEventType_onTarget_("resize", testDocument);
                expect(actualTarget).toBe(testDocument);

                var testWindow = testDocument.defaultView;
                actualTarget = eventManager.actualDOMTargetForEventType_onTarget_("resize", testWindow);
                expect(actualTarget).toBe(testWindow);
            });

        });
        describe("removing listeners", function() {
            it("should stop observing changes on objects", function() {
                var object = {x: 1};

                var changeSpy = {
                    handleEvent: function(event) {
                    }
                };
                spyOn(changeSpy, 'handleEvent');
                object.addEventListener("change@x", changeSpy, false);
                object.removeEventListener("change@x", changeSpy, false);

                object.x = 3;
                expect(changeSpy.handleEvent).wasNotCalled();
            });

            it("should stop observing changes on objects with a nested property path", function() {
                var object = {x: {y: 1}};

                var changeSpy = {
                    handleEvent: function(event) {
                    }
                };
                spyOn(changeSpy, 'handleEvent');
                object.addEventListener("change@x.y", changeSpy, false);
                object.removeEventListener("change@x.y", changeSpy, false);

                object.x.y = 3;
                expect(changeSpy.handleEvent).wasNotCalled();
            });
        });

        describe("when observing arrays", function() {

            var first, second, myArray, owner;

            beforeEach(function() {
                first = {foo: "hello"};
                second = {foo: "world"};
                myArray = [first, second];
                owner = {array : myArray};
            });

            it("should accept a value change from a non-array to an array, at an observed array index", function() {
                var array = [1, 2];
                var arrayValue = [22];

                // We really want to make sure that the addition of the listener for changes at this
                // index doesn't trip up the setProperty functionality when the value at
                // that index changes from a non-array to an array
                array.addEventListener("change@1", function() {
                });

                array.setProperty("1", arrayValue);

                expect(array[1]).toBe(arrayValue);
            });

            it("should report a value change at an array index on a shift", function() {
                var array = [1, 2];
                var change = false;
                var change0 = false;
                var change1 = false;

                array.addEventListener("change", function() {
                    change = true;
                });
                array.addEventListener("change@0", function() {
                    change0 = true;
                });
                array.addEventListener("change@1", function() {
                    change1 = true;
                });

                array.shift();
                expect(array.length).toBe(1);
                expect(change).toBeTruthy();
                expect(change0).toBeTruthy();
                expect(change1).toBeTruthy();
            });

            it("should report a value change at an array index on a splice", function() {
                var array = [1, 2];
                var change = false;
                var change0 = false;
                var change1 = false;

                array.addEventListener("change", function() {
                    change = true;
                });
                array.addEventListener("change@0", function() {
                    change0 = true;
                });
                array.addEventListener("change@1", function() {
                    change1 = true;
                });

                array.splice(0, 1);
                expect(array.length).toBe(1);
                expect(change).toBeTruthy();
                expect(change0).toBeTruthy();
                expect(change1).toBeTruthy();
            });

            describe("splice operations when reporting changes regarding length", function() {

                var array, changeType;

                beforeEach(function() {
                    array = [1,2];
                    changeType = null;

                    array.addEventListener("change", function(evt) {
                        changeType = evt.propertyChange;
                    });
                });

                it("should report a splice that yielded a net loss as a removal", function() {
                    array.splice(0, 1);
                    expect(changeType).toBe(ChangeTypes.REMOVAL);
                });

                it("should report a splice that yielded a no net gain or loss as a modification", function() {
                    array.splice(0, 1, "a");
                    expect(changeType).toBe(ChangeTypes.MODIFICATION);
                });

                it("should report a splice that yielded a net gain as a removal", function() {
                    array.splice(0, 1, "a", "b");
                    expect(changeType).toBe(ChangeTypes.ADDITION);
                });

            });

            it("should give the expected diff that resulted from popping from the array", function() {
                var array = [1, 2];

                var changeListener = {
                    handleEvent: function(event) {
                        expect(event.minus).toBe(2);
                        expect(event.plus).toBeUndefined();
                    }
                };

                spyOn(changeListener, "handleEvent").andCallThrough();
                array.addEventListener("change", changeListener);

                array.pop();

                expect(changeListener.handleEvent).toHaveBeenCalled();

            });

            it("should give the expected diff that resulted from popping from an array at the end of a property path", function() {
                var array = [1, 2];
                var foo = {bar: array};

                var changeListener = {
                    handleEvent: function(event) {
                        expect(event.minus).toBe(2);
                        expect(event.plus).toBe(array);
                    }
                };

                spyOn(changeListener, "handleEvent").andCallThrough();
                foo.addEventListener("change@bar", changeListener);

                array.pop();

                expect(changeListener.handleEvent).toHaveBeenCalled();

            });

            it("should observe all existing members of an array for changes at the property path beyond the array itself", function() {

                var changeListener = {
                    handleEvent: function(event) {

                    }
                };

                spyOn(changeListener, "handleEvent").andCallThrough();
                owner.addEventListener("change@array.foo", changeListener, false);

                first.foo = "goodbye";

                expect(changeListener.handleEvent).toHaveBeenCalled();
            });

            it("must stop observing removed members of an array for changes at the property path beyond the array itself", function() {

                var changeListener = {
                    handleEvent: function(event) {}
                };

                spyOn(changeListener, "handleEvent");

                owner.addEventListener("change@array.foo", changeListener, false);

                myArray.pop();
                second.foo = "earth";

                expect(changeListener.handleEvent.callCount).toBe(1);
            });

            it("should continue observing remaining members of an array for changes at the property path beyond the array itself after some members are removed", function() {

                var changeListener = {
                    handleEvent: function(event) {

                    }
                };

                spyOn(changeListener, "handleEvent").andCallThrough();
                owner.addEventListener("change@array.foo", changeListener, false);

                myArray.pop();

                first.foo = "goodbye";

                expect(changeListener.handleEvent).toHaveBeenCalled();
            });

            describe("adding members to an already observed array", function() {

                it("should start observing added members of an initially empty array for changes at the property path beyond the array itself", function() {

                    myArray = [];
                    owner.array = myArray;

                    var changeCount = 0;

                    var changeListener = {
                        handleEvent: function(event) {
                            changeCount++;

                            // This handler will be fired twice, once for the push, and then for the change@foo on
                            // the third object, this test is primarily for the second push change in detail.
                            // In both cases the event that is dispatched to the bindingListener is that the event
                            // affected "change@array.foo".
                            if (changeCount === 2) {
                                expect(event.type).toBe("change@array.foo");
                                expect(event.target).toBe(owner);

                                expect(event._event.plus).toBe("howdy");
                                expect(event._event.minus).toBe("hello");
                                expect(event._event.propertyName).toBe("foo");
                                expect(event._event.type).toBe("change@foo");
                            }

                        }
                    };

                    owner.addEventListener("change@array.foo", changeListener, false);

                    // This triggers a change at the array.foo path
                    myArray.push(first);

                    spyOn(changeListener, "handleEvent").andCallThrough();

                    // This should also trigger a change at the array.foo path, even though first was pushed after
                    // we installed the listener on owner
                    first.foo = "howdy";

                    expect(changeListener.handleEvent).toHaveBeenCalled();
                    expect(changeCount).toBe(2);
                });

                it("should start observing added members of an array that had some member initially for changes at the property path beyond the array itself", function() {

                    var changeCount = 0;

                    var changeListener = {
                        handleEvent: function(event) {
                            changeCount++;

                            // This handler will be fired twice, once for the push, and then for the change@foo on
                            // the third object, this test is primarily for the second push change in detail.
                            // In both cases the event that is dispatched to the bindingListener is that the event
                            // affected "change@array.foo".
                            if (changeCount === 2) {
                                expect(event.type).toBe("change@array.foo");
                                expect(event.target).toBe(owner);

                                expect(event._event.plus).toBe("howdy");
                                expect(event._event.minus).toBe("hey");
                                expect(event._event.propertyName).toBe("foo");
                                expect(event._event.type).toBe("change@foo");
                            }

                        }
                    };

                    var third = {foo: "hey"};

                    owner.addEventListener("change@array.foo", changeListener, false);

                    // This triggers a change at the array.foo path
                    myArray.push(third);

                    spyOn(changeListener, "handleEvent").andCallThrough();

                    // This should also trigger a change at the array.foo path, even though third was pushed after
                    // we installed the listener on owner
                    third.foo = "howdy";

                    expect(changeListener.handleEvent).toHaveBeenCalled();
                    expect(changeCount).toBe(2);
                });

                it("should start observing added members of an array that had some member initially for changes at the property path beyond the array itself", function() {

                    var changeCount = 0;

                    var changeListener = {
                        handleEvent: function(event) {
                            changeCount++;

                            // This handler will be fired twice, once for the push, and then for the change@foo on
                            // the third object, this test is primarily for the second push change in detail.
                            // In both cases the event that is dispatched to the bindingListener is that the event
                            // affected "change@array.foo".
                            if (changeCount === 2) {
                                expect(event.type).toBe("change@array.foo");
                                expect(event.target).toBe(owner);

                                expect(event._event.plus).toBe("howdy");
                                expect(event._event.minus).toBe("hey");
                                expect(event._event.propertyName).toBe("foo");
                                expect(event._event.type).toBe("change@foo");
                            }

                        }
                    };

                    var third = {foo: "hey"};

                    owner.addEventListener("change@array.foo", changeListener, false);

                    // This triggers a change at the array.foo path
                    myArray.push(third);

                    spyOn(changeListener, "handleEvent").andCallThrough();

                    // This should also trigger a change at the array.foo path, even though third was pushed after
                    // we installed the listener on owner
                    third.foo = "howdy";

                    expect(changeListener.handleEvent).toHaveBeenCalled();
                    expect(changeCount).toBe(2);
                });

                it("should start observing added members of an array for changes at the property path beyond the array itself, even if that path resolves to a value property", function() {

                    var changeCount = 0;

                    var changeListener = {
                        handleEvent: function(event) {
                            changeCount++;

                            // This handler will be fired twice, once for the push, and then for the change@foo on
                            // the third object, this test is primarily for the second push change in detail.
                            // In both cases the event that is dispatched to the bindingListener is that the event
                            // affected "change@array.foo".
                            if (changeCount === 2) {
                                expect(event.type).toBe("change@array.foo");
                                expect(event.target).toBe(owner);

                                expect(event._event.plus).toBe("howdy");
                                expect(event._event.minus).toBe("hey");
                                expect(event._event.propertyName).toBe("foo");
                                expect(event._event.type).toBe("change@foo");
                            }

                        }
                    };

                    var third = {};
                    Montage.defineProperties(third, {
                        foo: {
                            value: "hey"
                        }
                    });

                    owner.addEventListener("change@array.foo", changeListener, false);

                    // This triggers a change at the array.foo path
                    myArray.push(third);

                    spyOn(changeListener, "handleEvent").andCallThrough();

                    // This should also trigger a change at the array.foo path, even though third was pushed after
                    // we installed the listener on owner
                    third.foo = "howdy";

                    expect(changeListener.handleEvent).toHaveBeenCalled();
                    expect(changeCount).toBe(2);

                    // Expect that the value property was wrapped with a change-dispatching-setter
                    expect(typeof Object.getPropertyDescriptor(third, "foo").set).toBe("function");
                });

                it("should start observing added members of an array for changes at the property path beyond the array itself, even if that path resolves to a get/set property", function() {

                    var changeCount = 0;

                    var changeListener = {
                        handleEvent: function(event) {
                            changeCount++;

                            // This handler will be fired twice, once for the push, and then for the change@foo on
                            // the third object, this test is primarily for the second push change in detail.
                            // In both cases the event that is dispatched to the bindingListener is that the event
                            // affected "change@array.foo".
                            if (changeCount === 2) {
                                expect(event.type).toBe("change@array.foo");
                                expect(event.target).toBe(owner);

                                expect(event._event.plus).toBe("howdy");
                                expect(event._event.minus).toBe("hey");
                                expect(event._event.propertyName).toBe("foo");
                                expect(event._event.type).toBe("change@foo");
                            }

                        }
                    };

                    var third = {};

                    var fooSetter = function(value) {
                        this._foo = value;
                    };

                    Montage.defineProperties(third, {
                        _foo: {
                            value: "hey"
                        },

                        foo: {
                            get: function() {
                                return this._foo;
                            },
                            set: fooSetter
                        }
                    });

                    owner.addEventListener("change@array.foo", changeListener, false);

                    // This triggers a change at the array.foo path
                    myArray.push(third);

                    spyOn(changeListener, "handleEvent").andCallThrough();

                    // This should also trigger a change at the array.foo path, even though third was pushed after
                    // we installed the listener on owner
                    third.foo = "howdy";

                    expect(changeListener.handleEvent).toHaveBeenCalled();
                    expect(changeCount).toBe(2);

                    // Expect that the setter was wrapped with a change-dispatching-setter because it ended up being bound
                    expect(typeof Object.getPropertyDescriptor(third, "foo").set).not.toBe(fooSetter);
                });

            });

            it("should report a change for observers of 'count()' when the length changes", function() {
                var changeListener = {
                    handleEvent: function(event) {
                        expect(event.minus).toBe(2);
                        expect(event.plus).toBe(4);
                    }
                };

                spyOn(changeListener, "handleEvent").andCallThrough();

                myArray.addEventListener("change@count()", changeListener, true);

                myArray.push("hello", "again");

                expect(changeListener.handleEvent).toHaveBeenCalled();
            });

            it("TODO must not report a change for observers of 'count()' if a change on thre observed array does not change the length", function() {
                var changeListener = {
                    handleEvent: function(event) {}
                };

                spyOn(changeListener, "handleEvent").andCallThrough();

                myArray.addEventListener("change@count()", changeListener, true);

                myArray.sort();

                expect(changeListener.handleEvent).not.toHaveBeenCalled();
            });

        });

        it("should call a change listener targgeting an array position, that was created before that position existed, when the target is created", function() {
            // This tests makes sure that not only the change listeners targetting  existing elements are called.
            // Change listeners targetting non-existant elements should apply when the element (target) is created.
            var array = [];
            var change0 = 0;
            var change1 = 0;

            array.push([1, 2]);

            array.addEventListener("change@0", function() {
                change0++;
                //console.log("array.0 has changed");
            });
            array.addEventListener("change@1", function() {
                change1++;
                //console.log("array.1 has changed");
            });

            array.push([3, 4]);
            array[0].pop();
            array[1].pop();

            expect(change0).toBe(1); // called on array[0].pop()
            expect(change1).toBe(2); // called on array.push(...) and array[1].pop()
        });

        it("should call a change event listener on an array position when that position is changed via setProperty", function() {
            var array = [
                [1, 2]
            ];
            var newElement = [2, 3];
            var change0 = 0;

            array.addEventListener("change@0", function() {
                change0++;
                //console.log("array.0 has changed");
            });

            array.setProperty("0", newElement);
            expect(array[0]).toBe(newElement);
            expect(change0).toBe(1);
        });

        it("TODO should stop observing non-existent array elements when inside another array", function() {
            var array = [
                [0],
                [1]
            ];
            var change0 = 0;
            var change1 = 0;

            array.addEventListener("change@0.0", function() {
                change0++;
            });

            array.addEventListener("change@1.0", function() {
                change1++;
            });

            array.shift();
            array[0].pop();

            expect(change0).toBe(2); // called on array.shift() and array[0].pop()
            expect(change1).toBe(1); // called on array.shift()
        });

        it("should call a change event listener on an array sort", function() {
            var array = [2, 1],
                change0 = 0;

            array.addEventListener("change@0", function() {
                change0++;
            });

            array.sort();
            expect(change0).toBe(1);
        });

        describe("elements' event handler support", function() {
            var element = testPage.querySelector("#element");

            afterEach(function() {
                eventManager.unregisterEventHandlerForElement(element);
            });

            it("should install an event handler on an element", function() {
                var handler = {name: "handler"};

                eventManager.registerEventHandlerForElement(handler, element);
                expect(eventManager.eventHandlerForElement(element)).toBe(handler);
            });

            it("should uninstall an event handler on an element", function() {
                var handler = {name: "handler"};

                eventManager.registerEventHandlerForElement(handler, element);
                eventManager.unregisterEventHandlerForElement(element);
                expect(eventManager.eventHandlerForElement(element)).toBeUndefined();
                expect(eventManager._elementEventHandlerByUUID[handler.uuid]).toBeUndefined();
            });

            it("should override an element's previous event handler", function() {
                var handler1 = {name: "handler1"},
                    handler2 = {name: "handler2"};

                eventManager.registerEventHandlerForElement(handler1, element);
                expect(eventManager._elementEventHandlerByUUID[handler1.uuid]).toBeDefined();
                eventManager.registerEventHandlerForElement(handler2, element);
                expect(eventManager.eventHandlerForElement(element)).toBe(handler2);
                expect(eventManager._elementEventHandlerByUUID[handler1.uuid]).toBeUndefined();
            });

            it("should install an event handler on an element after the previous one has been uninstalled", function() {
                var handler1 = {name: "handler1"},
                    handler2 = {name: "handler2"};

                eventManager.registerEventHandlerForElement(handler1, element);
                eventManager.unregisterEventHandlerForElement(element);
                eventManager.registerEventHandlerForElement(handler2, element);
                 expect(eventManager.eventHandlerForElement(element)).toBe(handler2);
            });
        });

        describe("when observing objects", function() {

            it("should call a change listener observing a property that was null, but was eventually replaced with something not-null", function() {
                var object = {};
                var fooChangeCount = 0;

                object.foo = null;

                object.addEventListener("change@foo", function() {
                    fooChangeCount++;
                });

                object.foo = "bar";
                object.foo = null;
                object.foo = "baz";

                expect(fooChangeCount).toBe(3);
            });

            it("should call a change listener observing a deep propertyPath where some component along the path was null, but was eventually replaced with something not-null", function() {
                var object = {};
                var bazChangeCount = 0;

                object.foo = null;

                object.addEventListener("change@foo.bar.baz", function() {
                    bazChangeCount++;
                });

                object.foo = {};
                object.foo.bar = {};
                object.foo.bar.baz = "baz";
                object.foo.bar.baz = 42;

                //TODO should this be 4 or should it be 2....
                //basically do we want all the changes? or just changes that actually affect the object at the end of the path?
                expect(bazChangeCount).toBe(4);
            });

            it("should use any custom setter when setting the value of an observed property", function() {
                var MeaningfulObject = Montage.create(Montage, {

                    _foo: {
                        enumerable: false,
                        value: null
                    },

                    foo: {
                        enumerable: false,
                        set: function(value) {
                            this._foo = Math.min(42, value);
                        },
                        get: function() {
                            return this._foo;
                        }
                    }

                });

                var object = MeaningfulObject.create();

                var changeSpy = {
                    handleEvent: function(event) {
                        expect(event.plus).toBe(42);
                    }
                };
                spyOn(changeSpy, 'handleEvent').andCallThrough();

                object.addEventListener("change@foo", changeSpy);
                object.foo = 1000;

                expect(object.foo).toBe(42);
                expect(changeSpy.handleEvent).toHaveBeenCalled();
            });

            it("should preserve the enumerable attribute of properties it listens to", function() {
                var obj = {
                    enumerable: 2
                };
                Montage.defineProperty(obj, "notEnumerable", {enumerable: false, value: 2});

                obj.addEventListener("change@enumerable", function(){});
                obj.addEventListener("change@notEnumerable", function(){});

                expect(Object.getOwnPropertyDescriptor(obj, "enumerable").enumerable).toBe(true);
                expect(Object.getOwnPropertyDescriptor(obj, "notEnumerable").enumerable).toBe(false);
            });
        });

        describe("serialization", function() {
            it("should call \"listeners\" deserialization unit", function() {
                var sourceObject = Montage.create(),
                    handlerObject = Montage.create(),
                    serializer = Serializer.create().initWithRequire(require),
                    deserializer = Deserializer.create(),
                    actionListener = Montage.create(ActionEventListener).initWithHandler_action_(handlerObject, "doSomething");

                sourceObject.addEventListener("action", actionListener, false);

                var serialization = serializer.serializeObject(sourceObject);
                var labels = {};
                labels[handlerObject.uuid] = handlerObject;
                deserializer.initWithStringAndRequire(serialization, require);
                var object = null;
                spyOn(deserializer._indexedDeserializationUnits, "listeners").andCallThrough();
                deserializer.deserializeWithInstances(labels, function(objects) {
                    object = objects.root;
                });
                waitsFor(function() {
                    return object;
                });
                runs(function() {
                    expect(deserializer._indexedDeserializationUnits.listeners).toHaveBeenCalled();
                })
             });
        });
    });
});
