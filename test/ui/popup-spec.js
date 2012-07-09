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
