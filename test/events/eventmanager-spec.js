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
    Serializer = require("montage/core/serialization").Serializer,
    Deserializer = require("montage/core/serialization").Deserializer,
    TestPageLoader = require("montage-testing/testpageloader").TestPageLoader,
    EventInfo = require("montage-testing/testpageloader").EventInfo,
    MontageReviver = require("montage/core/serialization/deserializer/montage-reviver").MontageReviver,
    UUID = require("montage/core/uuid");

var global = typeof global !== "undefined" ? global : window;

TestPageLoader.queueTest("eventmanagertest/eventmanagertest", function(testPage) {
    describe("events/eventmanager-spec", function() {

        var NONE = Event.NONE,
            CAPTURING_PHASE = Event.CAPTURING_PHASE,
            AT_TARGET = Event.AT_TARGET,
            BUBBLING_PHASE = Event.BUBBLING_PHASE;

        var testDocument, eventManager;

        beforeEach(function() {
            var testWindow = testPage.iframe.contentWindow;
            eventManager = testWindow.montageRequire("core/application").application.eventManager;

            testDocument = testPage.iframe.contentDocument;

            eventManager.reset();
        });

        describe("when determining handler method names", function() {

            it('should correctly prefix the eventType with "capture" for the capture phase event handler method', function() {
                expect(eventManager.methodNameForCapturePhaseOfEventType("mousedown")).toBe("captureMousedown");
            });

            it('should correctly prefix the eventType with "handle" for the bubble phase event handler method', function() {
                expect(eventManager.methodNameForBubblePhaseOfEventType("mousedown")).toBe("handleMousedown");
            });

            it("must not alter inner capitalization of capture phase event handler method names", function() {
                expect(eventManager.methodNameForCapturePhaseOfEventType("DOMContentReady")).toBe("captureDOMContentReady");
            });

            it("must not alter inner capitalization of bubble phase event handler method names", function() {
                expect(eventManager.methodNameForBubblePhaseOfEventType("DOMContentReady")).toBe("handleDOMContentReady");
            });

            it("should inject the specified target identifier as part of the bubble phase event handler method name", function() {
                expect(eventManager.methodNameForBubblePhaseOfEventType("click", "testButton")).toBe("handleTestButtonClick");
            });

            it("should inject the specified target identifier as part of the capture phase event handler method name", function() {
                expect(eventManager.methodNameForCapturePhaseOfEventType("click", "testButton")).toBe("captureTestButtonClick");
            });
        });

        describe("when registering a window", function() {
            it("should be installed as the defaultManager in the current window", function() {
                expect(eventManager).toBeTruthy();
            });
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
                expect(testWindow.document.body.addEventListener).toBeDefined();

                eventManager.registerWindow(testWindow);

                expect(testWindow.defaultEventManager).toEqual(eventManager);
            });
        });

        describe("when adding event listeners", function() {
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

                testPage.mouseEvent(new EventInfo().initWithElement(testDocument.documentElement), "click", function() {
                    expect(clickSpy.handleClick).toHaveBeenCalled();
                    expect(inlineCalled).toBeTruthy();
                });
            });

        });

        describe("when distributing an event", function() {

            describe("with respect to the currentTarget property", function() {

                it("must set the currentTarget as null after distribution", function() {
                    var event;
                    var eventSpy = {
                        handleEvent: function(evt) {
                            event = evt;
                        }
                    };

                    spyOn(eventSpy, 'handleEvent').andCallThrough();

                    testDocument.addEventListener("mousedown", eventSpy, false);

                    testPage.mouseEvent(new EventInfo().initWithElement(testDocument), "mousedown", function() {
                        expect(eventSpy.handleEvent).toHaveBeenCalled();
                    });

                    expect(event.currentTarget).toBeNull();
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

                    testPage.mouseEvent(new EventInfo().initWithElement(testDocument.documentElement), "mousedown", function() {
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

                    testPage.mouseEvent(new EventInfo().initWithElement(testDocument.documentElement), "mousedown", function() {
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

                        testPage.mouseEvent(new EventInfo().initWithElement(testDocument.documentElement), "mousedown", function() {
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

                        testPage.mouseEvent(new EventInfo().initWithElement(testDocument.documentElement), "mousedown", function() {
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

                        testPage.mouseEvent(new EventInfo().initWithElement(testDocument.documentElement), "mousedown", function() {
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

                        testPage.mouseEvent(new EventInfo().initWithElement(testDocument.documentElement), "mousedown", function() {
                            expect(eventSpy.handleDocumentMousedown).not.toHaveBeenCalled();
                        });

                        delete testDocument.identifier;
                    });
                });
            });

        });

        describe("serialization", function() {
            it("should call \"listeners\" deserialization unit", function() {
                var sourceObject = new Target(),
                    handlerObject = new Montage(),
                    serializer = new Serializer().initWithRequire(require),
                    deserializer = new Deserializer(),
                    actionListener = new ActionEventListener().initWithHandler_action_(handlerObject, "doSomething");

                sourceObject.addEventListener("action", actionListener, false);

                var serialization = serializer.serializeObject(sourceObject);
                var labels = {};
                labels.actioneventlistener = handlerObject;

                deserializer.init(
                    serialization, require);
                spyOn(MontageReviver._unitRevivers, "listeners").andCallThrough();

                return deserializer.deserialize(labels)
                .then(function(objects) {
                    object = objects.root;
                    expect(MontageReviver._unitRevivers.listeners).toHaveBeenCalled();
                });
             });
        });

        describe("Target", function () {
            var target, testEvent;
            beforeEach(function () {
                target = new Target();
                testEvent = document.createEvent("CustomEvent");
                testEvent.initCustomEvent("test", true, true);
            });

            describe("dispatchEvent", function () {
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

            describe("dispatchEventNamed", function () {
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
