/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
var Montage = require("montage").Montage;
var Component = require("montage/ui/component").Component;
var TestPageLoader = require("support/testpageloader").TestPageLoader;

var testPage = TestPageLoader.queueTest("object-hierarchy-test", function() {
    describe("events/object-hierarchy-spec", function() {

        it("should load", function() {
            expect(testPage.loaded).toBeTruthy();
        });

        var eventManager, parent;

        beforeEach(function() {
            var testDocument = testPage.iframe.contentDocument;
            eventManager = testDocument.application.eventManager;
            eventManager.reset();

            parent = Montage.create();
        });

        it("should have a parentProperty", function() {
            expect(parent.parentProperty).toBeDefined();
        });

        describe("handling events throughout the object hierarchy", function() {

            var orphan, childFoo, childBar, grandchildFoo, bubbleEvent,
                orphanListener, childFooListener, childBarListener, grandchildFooListener,
                parentListener;

            beforeEach(function() {
                orphan = Montage.create();
                orphan.parentProperty = "parent";
                orphan.parent = null;

                childFoo = Montage.create();
                childFoo.parentProperty = "foo";
                childFoo.foo = parent;

                childBar = Montage.create();
                childBar.parentProperty = "bar";
                childBar.bar = parent;

                grandchildFoo = Montage.create();
                grandchildFoo.parentProperty = "parent";
                grandchildFoo.parent = childFoo;

                bubbleEvent = window.document.createEvent("CustomEvent");
                bubbleEvent.initCustomEvent("bubbleEvent", true, false, null);
            });

            describe("during the capture phase", function() {

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

                it("should distribute the event to the parent of the target object", function() {

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

                it("should distribute the event all registered bubble listeners from the target to the top-most parent in order", function() {

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

                it("should distribute the event to the parent of the target object", function() {

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

                it("should distribute the event all registered bubble listeners from the target to the top-most parent in order", function() {

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

    });
});
