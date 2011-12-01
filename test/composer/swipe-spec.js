/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
var Montage = require("montage").Montage,
    TestPageLoader = require("support/testpageloader").TestPageLoader,
    Component = require("montage/ui/component").Component;

var testPage = TestPageLoader.queueTest("swipe", function() {
    describe("composer/swipe-spec", function() {
        it("should load", function() {
            expect(testPage.loaded).toBeTruthy();
        });

        describe("swipe right",function() {
            xit("should emit swipe event", function() {
                //simulate touch events
                spyOn(testPage.test, 'handleSwipe');
                testPage.touchEvent(EventInfo.create().initWithElementAndPosition(null, -100, 100), "touchstart", function() {
                    testPage.touchEvent(EventInfo.create().initWithElementAndPosition(null, -0, 100), "touchmove", function() {
                        testPage.touchEvent(EventInfo.create().initWithElementAndPosition(null, 100, 100), "touchend", function() {
                            expect(testPage.test.handleSwipe).toHaveBeenCalled();
                        });
                    });
                 });
            });
            xit("shouldn't emit swipe event if no move", function() {
                //simulate touch events
                spyOn(testPage.test, 'handleSwipe');
                testPage.touchEvent(EventInfo.create().initWithElementAndPosition(null, -100, 100), "touchstart", function() {
                    testPage.touchEvent(EventInfo.create().initWithElementAndPosition(null, -100, 100), "touchmove", function() {
                        testPage.touchEvent(EventInfo.create().initWithElementAndPosition(null, -100, 100), "touchend", function() {
                            expect(testPage.test.handleSwipe).not.toHaveBeenCalled();
                        });
                    });

                });
            });
        }
        );
    });
});
