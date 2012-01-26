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

/**
* A Delegate to position the popup using custom logic
*/
var TestPopupPositionDelegate = Montage.create(Montage, {
    positionPopup: {
       value: function(popup, anchor, anchorPosition) {
           if(anchor && anchorPosition) {
               if(window.innerHeight > 500 ){
                   return {
                       top: 10,
                       left: anchorPosition[0]
                   };                   
               } else {
                   return {
                       bottom: 10,
                       left: anchorPosition[0]
                   };
               }
           }
           return {top: 0, left: 0};
       }
    }
});
var TestPopupPositionDelegate = Montage.create(TestPopupPositionDelegate);

var testPage = TestPageLoader.queueTest("popuptest", function() {
    var test = testPage.test;
    describe("ui/popup-spec", function() {
        it("should load", function() {
            expect(testPage.loaded).toBeTruthy();
        });

        describe("once loaded", function() {
            describe("position delegate", function() {
                it("should call the position popup to continually determine position", function() {
                    testPage.resizeTo(800, 600);
                    var popup = test.testPopup.popup;
                    if(!popup) {
                        popup = Popup.create();
                        popup.content = testPage.testPopup;
                        popup.anchor = testPage.popupButton.element;
                        popup.delegate = TestPopupPositionDelegate;
                    }
                    popup.show();
                    
                    testPage.waitForDraw(2);
                    runs(function() {                        
                        var popupPosition = EventInfo.positionOfElement(test.testPopup.popup.element);
                        expect(popupPosition.y).toBe(10);
                        
                        testPage.resize(800,400);
                        testPage.waitForDraw(2);
                        runs(function() {
                            popupPosition = EventInfo.positionOfElement(test.testPopup.popup.element);
                            expect(popupPosition.y).toBe(320);
                        });
                    });
                });
            });
        });
    });
});
