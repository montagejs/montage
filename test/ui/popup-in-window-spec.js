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


var testPage = TestPageLoader.queueTest("popup-in-window-test", {newWindow: true}, function() {
    var test = testPage.test;

    describe("ui/popup-in-window-spec", function() {
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
                        //console.log('popupPosition with 800,600', popupPosition);
                        expect(popupPosition.y).toBe(10);
                    });
                });
                it("should continually determine position at every resize", function() {
                    testPage.testWindow.resizeTo(800,400);
                    testPage.waitForDraw(1);
                    runs(function() {
                        var element = test.testPopup.popup.element;
                        popupPosition = EventInfo.positionOfElement(element);
                        //console.log('popupPosition with 800,400', popupPosition);
                        expect(element.offsetHeight).toBe(118);
                        expect(popupPosition.y).toBe(222);
                    });
                });
            });
        });
    });
});
