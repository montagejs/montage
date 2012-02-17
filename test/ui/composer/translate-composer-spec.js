/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
/*global require,exports,describe,it,expect,waits,runs */
var Montage = require("montage").Montage,
    TestPageLoader = require("support/testpageloader").TestPageLoader,
    ActionEventListener = require("montage/core/event/action-event-listener").ActionEventListener;

var testPage = TestPageLoader.queueTest("translate-composer-test", function() {
    var test = testPage.test;

    var dragElementOffsetTo = function(element, offsetX, offsetY, downCallback, moveCallback, upCallback) {
        // mousedown
        testPage.mouseEvent({target: element}, "mousedown");

        if (downCallback) {
            downCallback();
        }

        // Mouse move doesn't happen instantly
        waits(10);
        runs(function() {
            var eventInfo = testPage.mouseEvent({
                target: element,
                clientX: element.offsetLeft + offsetX,
                clientY: element.offsetTop + offsetY
            }, "mousemove");

            if (moveCallback) {
                moveCallback();
            }

            // mouse up
            testPage.mouseEvent(eventInfo, "mouseup");

            if (upCallback) {
                upCallback();
            }
        });
    };

    describe("ui/translate-composer-spec", function() {
        it("should load", function() {
            expect(testPage.loaded).toBe(true);
        });

        describe("TranslateComposer", function(){
            it("can be created", function() {
                expect(test.translate_composer).toBeDefined();
            });

            describe("translateX", function() {
                it("updates as the mouse moves", function() {
                    testPage.mouseEvent({target: test.example.element}, "mousedown");

                });
            });
            describe("translateX");
            describe("maxTranslateX");
            describe("maxTranslateY");
            describe("axis");

        });
    });
});