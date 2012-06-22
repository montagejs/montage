/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2012 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
var Montage = require("montage").Montage,
    TestPageLoader = require("support/testpageloader").TestPageLoader,
    EventInfo = require("support/testpageloader").EventInfo,
    Popup = Popup = require("montage/ui/popup/popup.reel").Popup,
    ActionEventListener = require("montage/core/event/action-event-listener").ActionEventListener;


var testPage = TestPageLoader.queueTest("popup-test", function() {
    var test = testPage.test;

    var getElementPosition = function(obj) {
            var curleft = 0, curtop = 0, curHt = 0, curWd = 0;
            if (obj.offsetParent) {
                do {
                    curleft += obj.offsetLeft;
                    curtop += obj.offsetTop;
                    curHt += obj.offsetHeight;
                    curWd += obj.offsetWidth;
                } while ((obj = obj.offsetParent));
            }
            return {
                top: curtop,
                left: curleft,
                height: curHt,
                width: curWd
            };
            //return [curleft,curtop, curHt, curWd];
    };

    describe("ui/popup-spec", function() {
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

                /*
                it("non-modal popup is hidden when clicked outside the popup", function() {

                    var popup = test.popup;


                    expect(popup.displayed).toBe(false);
                    popup.show();

                    testPage.waitForDraw();
                    runs(function() {
                        expect(popup.displayed).toBe(true);
                        var eventInfo = Montage.create(EventInfo).initWithElementAndPosition(null, 1, 1);
                        console.log('about to click outside the popup');

                        testPage.mouseEvent(eventInfo, 'click', function(evt) {
                            popup.needsDraw = true;
                            testPage.waitForDraw();
                            runs(function() {
                                console.log('after drawing');
                                expect(popup.displayed).toBe(false);
                            });

                        });


                    });

                });
                */

            });


            it("is positioned relative to anchor by default", function() {
                var popup = test.popup;
                var anchor = popup.anchorElement, anchorHt, anchorWd, anchorPosition;

                var anchorPosition = getElementPosition(anchor);
                anchorHt = parseFloat(anchor.style.height || 0) || anchor.offsetHeight || 0;
                anchorWd = parseFloat(anchor.style.width || 0) || anchor.offsetWidth || 0;

                popup.addEventListener('show', function() {
                    console.log('show -');
                    var popupPosition = getElementPosition(popup.element);
                    expect(popupPosition.top).toBe(anchorPosition.top + anchorHt);

                    popup.hide();
                });

                popup.show();


            });



            it("is positioned at specified position", function() {
                var popup = test.popup;
                popup.position = {top: 1, left: 10};

                popup.addEventListener('show', function() {
                    var popupPosition = getElementPosition(popup.element);
                    console.log('show -', popupPosition);
                    expect(popupPosition.top).toBe(1);
                    expect(popupPosition.left).toBe(6);

                    popup.hide();
                });

                popup.show();


            });

        });

    });
});
