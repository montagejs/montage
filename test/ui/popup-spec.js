/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
var Montage = require("montage").Montage,
    TestPageLoader = require("support/testpageloader").TestPageLoader,
    EventInfo = require("support/testpageloader").EventInfo,
    Popup = Popup = require("montage/ui/popup/popup.reel").Popup,
    ActionEventListener = require("montage/core/event/action-event-listener").ActionEventListener;


var testPage = TestPageLoader.queueTest("popuptest", {newWindow: true}, function() {
    var test = testPage.test;
    describe("ui/popup-spec", function() {
        it("should load", function() {
            expect(testPage.loaded).toBeTruthy();
        });

        describe("once loaded", function() {
            describe("Popup", function() {
                it("should position based on delegate logic", function() {
                    testPage.testWindow.resizeTo(800, 600);
                    test.showPopup();

                    testPage.waitForDraw(2);
                    runs(function() {
                        var popupPosition = EventInfo.positionOfElement(test.testPopup.popup.element);
                        expect(popupPosition.y).toBe(10);
                    });
                });
                it("should continually determine position at every resize", function() {
                    testPage.testWindow.resizeTo(800,400);
                    testPage.waitForDraw(1);
                    runs(function() {
                        popupPosition = EventInfo.positionOfElement(test.testPopup.popup.element);
                        expect(popupPosition.y).toBe(122);
                    });
                });
            });
        });
    });
});
