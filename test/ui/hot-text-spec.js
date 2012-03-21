/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
/*global require,exports,describe,it,expect,waits,runs */
var Montage = require("montage").Montage,
    TestPageLoader = require("support/testpageloader").TestPageLoader,
    ActionEventListener = require("montage/core/event/action-event-listener").ActionEventListener;

var testPage = TestPageLoader.queueTest("hot-text-test", function() {
    var test = testPage.test;

    describe("ui/hot-text-spec", function() {
        it("should load", function() {
            expect(testPage.loaded).toBe(true);
        });

        describe("hot-text", function() {
            it("can be created", function() {
                expect(test.number).toBeDefined();
            });

            it("increases when dragged right", function() {
                var oldValue = test.number.value;
                testPage.dragElementOffsetTo(test.number.element, 0, 50, null, function() {
                    expect(test.number.value).toBe(oldValue + 50);
                }, null);
            });
            it("decreases when dragged left", function() {
                var oldValue = test.number.value;
                testPage.dragElementOffsetTo(test.number.element, 0, -50, null, function() {
                    expect(test.number.value).toBe(oldValue - 50);
                }, null);
            });
            it("increases when dragged up", function() {
                var oldValue = test.number.value;
                testPage.dragElementOffsetTo(test.number.element, -50, 0, null, function() {
                    expect(test.number.value).toBe(oldValue + 50);
                }, null);
            });
            it("decreases when dragged down", function() {
                var oldValue = test.number.value;
                testPage.dragElementOffsetTo(test.number.element, 50, 0, null, function() {
                    expect(test.number.value).toBe(oldValue - 50);
                }, null);
            });
            it("it doesn't decrease when dragging up and left", function() {
                var element = test.number.element;
                var oldValue = test.number.value;

                testPage.mouseEvent({target: element}, "mousedown");

                // Mouse move doesn't happen instantly
                waits(10);
                runs(function() {
                    testPage.mouseEvent({
                        target: element,
                        clientX: element.offsetLeft,
                        clientY: element.offsetTop - 50
                    }, "mousemove");

                    expect(test.number.value).toBe(oldValue + 50);

                    waits(10);
                    runs(function() {
                        var eventInfo = testPage.mouseEvent({
                            target: element,
                            clientX: element.offsetLeft - 60,
                            clientY: element.offsetTop - 50
                        }, "mousemove");
                        // mouse up
                        testPage.mouseEvent(eventInfo, "mouseup");

                        // It should not be -60, even though the left magnitude
                        // is greater that the up magnitude here.
                        expect(test.number.value).toBe(oldValue + 50);


                    });
                });
            });
            it("increases when scrolled up", function() {

            });
            it("decreases when scrolled down", function() {

            });

            it("increases by more when shift is held", function() {

            });
        });
    });
});