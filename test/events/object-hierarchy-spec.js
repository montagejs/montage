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
var Montage = require("montage").Montage;
var Component = require("montage/ui/component").Component;
var TestPageLoader = require("support/testpageloader").TestPageLoader;

var testPage = TestPageLoader.queueTest("object-hierarchy-test", function() {
    describe("events/object-hierarchy-spec", function() {

        it("should load", function() {
            expect(testPage.loaded).toBeTruthy();
        });

        var eventManager, parent, testApplication, testMontage;

        beforeEach(function() {
            var testDocument = testPage.iframe.contentDocument;
            testMontage = testDocument.defaultView.montageRequire("montage").Montage,
            testApplication = testDocument.application;
            eventManager = testApplication.eventManager;
            eventManager.reset();
        });

        it("should have a parentProperty on a Montage object", function() {
            expect((Montage.create()).parentProperty).toBeDefined();
        });

        it("should have a parentProperty on a object", function() {
            expect((Object.create(Object.prototype)).parentProperty).toBeDefined();
        });

        it("should have a parentProperty on a object literal", function() {
            expect({}.parentProperty).toBeDefined();
        });

        describe("handling events throughout the object hierarchy", function() {


            var orphan, childFoo, childBar, grandchildFoo, bubbleEvent,
                orphanListener, childFooListener, childBarListener, grandchildFooListener,
                parentListener;

            beforeEach(function() {
                // We need to use the testMontage as the base so the global defaultEventManager is the testEventManager
                // from the test iframe, not the global defaultEventManager of the test
                parent = testMontage.create();

                orphan = testMontage.create();
                orphan.parentProperty = "parent";
                orphan.parent = null;

                childFoo = testMontage.create();
                childFoo.parentProperty = "foo";
                childFoo.foo = parent;

                childBar = testMontage.create();
                childBar.parentProperty = "bar";
                childBar.bar = parent;

                grandchildFoo = testMontage.create();
                grandchildFoo.parentProperty = "parent";
                grandchildFoo.parent = childFoo;

                bubbleEvent = window.document.createEvent("CustomEvent");
                bubbleEvent.initCustomEvent("bubbleEvent", true, false, null);
            });

            describe("during the capture phase", function() {

                it("should distribute the event to listeners observing the parent of the target object if the event does not bubble", function() {

                    bubbleEvent = window.document.createEvent("CustomEvent");
                    bubbleEvent.initCustomEvent("bubbleEvent", false, false, null);

                    parentListener = {
                        handleEvent: function() {}
                    };

                    parent.addEventListener("bubbleEvent", parentListener, true);

                    spyOn(parentListener, "handleEvent");
                    childFoo.dispatchEvent(bubbleEvent);

                    expect(parentListener.handleEvent).toHaveBeenCalled();
                });

                it("should distribute the event to listeners observing the target object", function() {

                    childFooListener = {
                        handleEvent: function(event) {
                           expect(event._event).toBe(bubbleEvent);
                        }
                    };

                    childFoo.addEventListener("bubbleEvent", childFooListener, true);

                    spyOn(childFooListener, "handleEvent");
                    childFoo.dispatchEvent(bubbleEvent);

                    expect(childFooListener.handleEvent).toHaveBeenCalled();
                });

                it("should distribute the event to listeners observing the parent of the target object", function() {

                    parentListener = {
                       handleEvent: function(event) {
                           expect(event._event).toBe(bubbleEvent);
                       }
                    };

                    parent.addEventListener("bubbleEvent", parentListener, true);

                    spyOn(parentListener, "handleEvent");
                    childFoo.dispatchEvent(bubbleEvent);

                    expect(parentListener.handleEvent).toHaveBeenCalled();
                });

                it("should distribute the event to listeners observing the application", function() {

                    var applicationListener = {
                        handleEvent: function(event) {
                            expect(event._event).toBe(bubbleEvent);
                        }
                    };

                    testApplication.addEventListener("bubbleEvent", applicationListener, true);

                    spyOn(applicationListener, "handleEvent");

                    childFoo.dispatchEvent(bubbleEvent);

                    expect(applicationListener.handleEvent).toHaveBeenCalled();
                });

                it("should distribute the event all listeners from the target to the top-most parent in order", function() {

                    var handledCount = 0;

                    childFooListener = {
                        handleEvent: function(event) {
                            expect(event._event).toBe(bubbleEvent);
                            expect(handledCount).toBe(1);
                            handledCount++;
                        }
                    };

                    parentListener = {
                        handleEvent: function(event) {
                            expect(event._event).toBe(bubbleEvent);
                            expect(handledCount).toBe(0);
                            handledCount++;
                        }
                    };

                    spyOn(childFooListener, "handleEvent");
                    spyOn(parentListener, "handleEvent");

                    parent.addEventListener("bubbleEvent", parentListener, true);
                    childFoo.addEventListener("bubbleEvent", childFooListener, true);

                    childFoo.dispatchEvent(bubbleEvent);

                    expect(childFooListener.handleEvent).toHaveBeenCalled();
                    expect(parentListener.handleEvent).toHaveBeenCalled();
                });

            });

            describe("during the bubble phase", function() {

                it("must not distribute the event to listeners observing the parent of the target object if the event does not bubble", function() {

                    bubbleEvent = window.document.createEvent("CustomEvent");
                    bubbleEvent.initCustomEvent("bubbleEvent", false, false, null);

                    parentListener = {
                        handleEvent: function() {}
                    };

                    parent.addEventListener("bubbleEvent", parentListener, false);

                    spyOn(parentListener, "handleEvent");
                    childFoo.dispatchEvent(bubbleEvent);

                    expect(parentListener.handleEvent).not.toHaveBeenCalled();
                });

                it("should distribute the event to listeners observing the target object", function() {

                    childFooListener = {
                        handleEvent: function(event) {
                            expect(event._event).toBe(bubbleEvent);
                        }
                    };

                    childFoo.addEventListener("bubbleEvent", childFooListener, false);

                    spyOn(childFooListener, "handleEvent");
                    childFoo.dispatchEvent(bubbleEvent);

                    expect(childFooListener.handleEvent).toHaveBeenCalled();
                });

                it("should distribute the event to listeners observing the parent of the target object", function() {

                    parentListener = {
                        handleEvent: function(event) {
                            expect(event._event).toBe(bubbleEvent);
                        }
                    };

                    parent.addEventListener("bubbleEvent", parentListener, false);

                    spyOn(parentListener, "handleEvent");
                    childFoo.dispatchEvent(bubbleEvent);

                    expect(parentListener.handleEvent).toHaveBeenCalled();
                });

                it("should distribute the event to listeners observing the application", function() {

                    var applicationListener = {
                        handleEvent: function(event) {
                            expect(event._event).toBe(bubbleEvent);
                        }
                    };

                    testApplication.addEventListener("bubbleEvent", applicationListener, false);

                    spyOn(applicationListener, "handleEvent");
                    childFoo.dispatchEvent(bubbleEvent);

                    expect(applicationListener.handleEvent).toHaveBeenCalled();
                });

                it("should distribute the event all listeners from the target to the top-most parent in order", function() {

                    var handledCount = 0;

                    childFooListener = {
                        handleEvent: function(event) {
                            expect(event._event).toBe(bubbleEvent);
                            expect(handledCount).toBe(0);
                            handledCount++;
                        }
                    };

                    parentListener = {
                        handleEvent: function(event) {
                            expect(event._event).toBe(bubbleEvent);
                            expect(handledCount).toBe(1);
                            handledCount++;
                        }
                    };

                    spyOn(childFooListener, "handleEvent");
                    spyOn(parentListener, "handleEvent");

                    parent.addEventListener("bubbleEvent", parentListener, false);
                    childFoo.addEventListener("bubbleEvent", childFooListener, false);

                    childFoo.dispatchEvent(bubbleEvent);

                    expect(childFooListener.handleEvent).toHaveBeenCalled();
                    expect(parentListener.handleEvent).toHaveBeenCalled();
                });

            });

            it("should distribute the event to the entire chain of registered event listeners in the expected order", function() {
                var handledCount = 0;

                parentListener = {
                    captureBubbleEvent: function(event) {
                        expect(event._event).toBe(bubbleEvent);
                        expect(handledCount).toBe(0);
                        handledCount++;
                    },

                    handleEvent: function(event) {
                        expect(event._event).toBe(bubbleEvent);
                        expect(handledCount).toBe(5);
                        handledCount++;
                    }
                };

                childFooListener = {
                    captureBubbleEvent: function(event) {
                        expect(event._event).toBe(bubbleEvent);
                        expect(handledCount).toBe(1);
                        handledCount++;
                    },

                    handleEvent: function(event) {
                        expect(event._event).toBe(bubbleEvent);
                        expect(handledCount).toBe(4);
                        handledCount++;
                    }
                };

                grandchildFooListener = {
                    captureBubbleEvent: function(event) {
                        expect(event._event).toBe(bubbleEvent);
                        expect(handledCount).toBe(2);
                        handledCount++;
                    },

                    handleEvent: function(event) {
                        expect(event._event).toBe(bubbleEvent);
                        expect(handledCount).toBe(3);
                        handledCount++;
                    }
                };


                spyOn(parentListener, "handleEvent");
                spyOn(parentListener, "captureBubbleEvent");

                spyOn(childFooListener, "handleEvent");
                spyOn(childFooListener, "captureBubbleEvent");

                spyOn(grandchildFooListener, "handleEvent");
                spyOn(grandchildFooListener, "captureBubbleEvent");

                parent.addEventListener("bubbleEvent", parentListener, true);
                parent.addEventListener("bubbleEvent", parentListener, false);

                childFoo.addEventListener("bubbleEvent", childFooListener, true);
                childFoo.addEventListener("bubbleEvent", childFooListener, false);

                grandchildFoo.addEventListener("bubbleEvent", grandchildFooListener, true);
                grandchildFoo.addEventListener("bubbleEvent", grandchildFooListener, false);

                grandchildFoo.dispatchEvent(bubbleEvent);

                expect(parentListener.captureBubbleEvent).toHaveBeenCalled();
                expect(childFooListener.captureBubbleEvent).toHaveBeenCalled();
                expect(grandchildFooListener.captureBubbleEvent).toHaveBeenCalled();
                expect(grandchildFooListener.handleEvent).toHaveBeenCalled();
                expect(childFooListener.handleEvent).toHaveBeenCalled();
                expect(parentListener.handleEvent).toHaveBeenCalled();
            });

        });

        describe("handling events throughout the component hierarchy", function() {

            var parent, child, bubbleEvent;

            beforeEach(function() {
                parent = testPage.test.component1;
                child = parent.childComponents[0];

                bubbleEvent = window.document.createEvent("CustomEvent");
                bubbleEvent.initCustomEvent("bubbleEvent", true, false, null);
            });

            it("should have a default parentProperty on all components", function() {
                expect((Component.create()).parentProperty).toBe("parentComponent");
            });

            describe("during the capture phase", function() {

                it("should distribute the event to listeners observing the parent of the target object if the event does not bubble", function() {

                    bubbleEvent = window.document.createEvent("CustomEvent");
                    bubbleEvent.initCustomEvent("bubbleEvent", false, false, null);

                    var parentListener = {
                        handleEvent: function() {}
                    };

                    parent.addEventListener("bubbleEvent", parentListener, true);

                    spyOn(parentListener, "handleEvent");
                    child.dispatchEvent(bubbleEvent);

                    expect(parentListener.handleEvent).toHaveBeenCalled();
                });

                it("should distribute the event to listeners observing the target component", function() {

                    var childListener = {
                        handleEvent: function(event) {
                           expect(event._event).toBe(bubbleEvent);
                        }
                    };

                    child.addEventListener("bubbleEvent", childListener, true);

                    spyOn(childListener, "handleEvent");
                    child.dispatchEvent(bubbleEvent);

                    expect(childListener.handleEvent).toHaveBeenCalled();
                });

                it("should distribute the event to listeners observing the parent of the target object", function() {

                    var parentListener = {
                       handleEvent: function(event) {
                           expect(event._event).toBe(bubbleEvent);
                       }
                    };

                    parent.addEventListener("bubbleEvent", parentListener, true);

                    spyOn(parentListener, "handleEvent");
                    child.dispatchEvent(bubbleEvent);

                    expect(parentListener.handleEvent).toHaveBeenCalled();
                });

                it("should distribute the event to listeners observing the application", function() {

                    var applicationListener = {
                        handleEvent: function(event) {
                            expect(event._event).toBe(bubbleEvent);
                        }
                    };

                    testApplication.addEventListener("bubbleEvent", applicationListener, true);

                    spyOn(applicationListener, "handleEvent");
                    child.dispatchEvent(bubbleEvent);

                    expect(applicationListener.handleEvent).toHaveBeenCalled();
                });

                it("should distribute the event all listeners from the target to the top-most parent in order", function() {

                    var handledCount = 0;

                    var childListener = {
                        handleEvent: function(event) {
                            expect(event._event).toBe(bubbleEvent);
                            expect(handledCount).toBe(1);
                            handledCount++;
                        }
                    };

                    var parentListener = {
                        handleEvent: function(event) {
                            expect(event._event).toBe(bubbleEvent);
                            expect(handledCount).toBe(0);
                            handledCount++;
                        }
                    };

                    spyOn(childListener, "handleEvent");
                    spyOn(parentListener, "handleEvent");

                    parent.addEventListener("bubbleEvent", parentListener, true);
                    child.addEventListener("bubbleEvent", childListener, true);

                    child.dispatchEvent(bubbleEvent);

                    expect(childListener.handleEvent).toHaveBeenCalled();
                    expect(parentListener.handleEvent).toHaveBeenCalled();
                });

            });

            describe("during the bubble phase", function() {

                it("must not distribute the event to listeners observing the parent of the target object if the event does not bubble", function() {

                    bubbleEvent = window.document.createEvent("CustomEvent");
                    bubbleEvent.initCustomEvent("bubbleEvent", false, false, null);

                    var parentListener = {
                        handleEvent: function() {
                        }
                    };

                    parent.addEventListener("bubbleEvent", parentListener, false);

                    spyOn(parentListener, "handleEvent");
                    child.dispatchEvent(bubbleEvent);

                    expect(parentListener.handleEvent).not.toHaveBeenCalled();
                });

                it("should distribute the event to listeners observing the target object", function() {

                    var childListener = {
                        handleEvent: function(event) {
                            expect(event._event).toBe(bubbleEvent);
                        }
                    };

                    child.addEventListener("bubbleEvent", childListener, false);

                    spyOn(childListener, "handleEvent");
                    child.dispatchEvent(bubbleEvent);

                    expect(childListener.handleEvent).toHaveBeenCalled();
                });

                it("should distribute the event to listeners observing the parent of the target object", function() {

                    var parentListener = {
                        handleEvent: function(event) {
                            expect(event._event).toBe(bubbleEvent);
                        }
                    };

                    parent.addEventListener("bubbleEvent", parentListener, false);

                    spyOn(parentListener, "handleEvent");
                    child.dispatchEvent(bubbleEvent);

                    expect(parentListener.handleEvent).toHaveBeenCalled();
                });

                it("should distribute the event to listeners observing the application", function() {

                    var applicationListener = {
                        handleEvent: function(event) {
                            expect(event._event).toBe(bubbleEvent);
                        }
                    };

                    testApplication.addEventListener("bubbleEvent", applicationListener, false);

                    spyOn(applicationListener, "handleEvent");
                    child.dispatchEvent(bubbleEvent);

                    expect(applicationListener.handleEvent).toHaveBeenCalled();
                });

                it("should distribute the event all listeners from the target to the top-most parent in order", function() {

                    var handledCount = 0;

                    var childListener = {
                        handleEvent: function(event) {
                            expect(event._event).toBe(bubbleEvent);
                            expect(handledCount).toBe(0);
                            handledCount++;
                        }
                    };

                    var parentListener = {
                        handleEvent: function(event) {
                            expect(event._event).toBe(bubbleEvent);
                            expect(handledCount).toBe(1);
                            handledCount++;
                        }
                    };

                    spyOn(childListener, "handleEvent");
                    spyOn(parentListener, "handleEvent");

                    parent.addEventListener("bubbleEvent", parentListener, false);
                    child.addEventListener("bubbleEvent", childListener, false);

                    child.dispatchEvent(bubbleEvent);

                    expect(childListener.handleEvent).toHaveBeenCalled();
                    expect(parentListener.handleEvent).toHaveBeenCalled();
                });

            });

            it("should distribute the event to the entire chain of registered event listeners in the expected order", function() {
                var handledCount = 0;

                var parentListener = {
                    captureBubbleEvent: function(event) {
                        expect(event._event).toBe(bubbleEvent);
                        expect(handledCount).toBe(0);
                        handledCount++;
                    },

                    handleEvent: function(event) {
                        expect(event._event).toBe(bubbleEvent);
                        expect(handledCount).toBe(5);
                        handledCount++;
                    }
                };

                var childListener = {
                    captureBubbleEvent: function(event) {
                        expect(event._event).toBe(bubbleEvent);
                        expect(handledCount).toBe(1);
                        handledCount++;
                    },

                    handleEvent: function(event) {
                        expect(event._event).toBe(bubbleEvent);
                        expect(handledCount).toBe(4);
                        handledCount++;
                    }
                };

                spyOn(parentListener, "handleEvent");
                spyOn(parentListener, "captureBubbleEvent");

                spyOn(childListener, "handleEvent");
                spyOn(childListener, "captureBubbleEvent");

                parent.addEventListener("bubbleEvent", parentListener, true);
                parent.addEventListener("bubbleEvent", parentListener, false);

                child.addEventListener("bubbleEvent", childListener, true);
                child.addEventListener("bubbleEvent", childListener, false);

                child.dispatchEvent(bubbleEvent);

                expect(parentListener.captureBubbleEvent).toHaveBeenCalled();
                expect(childListener.captureBubbleEvent).toHaveBeenCalled();
                expect(childListener.handleEvent).toHaveBeenCalled();
                expect(parentListener.handleEvent).toHaveBeenCalled();
            });

        });

    });
});
