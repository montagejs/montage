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


var testPage = TestPageLoader.queueTest("popup-test", function() {
    var test = testPage.test;
    describe("ui/popup-spec1", function() {
        it("should load", function() {
            expect(testPage.loaded).toBeTruthy();
        });

        describe("once loaded", function() {
            
            describe("Popup", function() {
                
                it("show/hide works", function() {
                    
                    var popup = test.popup;
                    expect(popup.displayed).toBe(false);
                    popup.show();
                          
                    testPage.waitForDraw();
                    runs(function() {
                        //console.log('after initial show', popup.element);
                        expect(popup.element.classList.contains("montage-invisible")).toBe(false);                          
                        popup.hide();
                        testPage.waitForDraw();
                        runs(function() {
                            //console.log('after first hide');
                            expect(popup.element.classList.contains("montage-invisible")).toBe(true);                              
                            popup.show();
                            testPage.waitForDraw();
                            runs(function() {
                                //console.log('after show 1', popup.element); 
                                // if this fails, it means that the popup.draw is not called after it was hidden once                           
                                expect(popup.element.classList.contains("montage-invisible")).toBe(false);
                            });                                                               
                        });
                    });

                });                
                
            });
        });
    });
});
