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
/*global expect */
var Montage = require("montage").Montage,
        TestPageLoader = require("support/testpageloader").TestPageLoader;
        EventInfo = require("support/testpageloader").EventInfo;

var testPage = TestPageLoader.queueTest("slidertest", function() {
    describe("ui/slider-spec", function() {
        it("should load", function() {
            expect(testPage.loaded).toBeTruthy();
        });

        var testSlider, testSliderHandle;

        beforeEach(function() {
            testSlider = testPage.test.testSlider;
            testSlider.minValue = 0;
            testSlider.maxValue = 100;
            testSliderHandle = testSlider._handlerDragArea.firstElementChild;
        });

        describe("when interacted with", function() {
            it("should slide", function() {
                var origin = testSliderHandle.offsetLeft;
                var eventInfo = EventInfo.create().initWithElement(testSliderHandle);
                eventInfo = testPage.mouseEvent(eventInfo, "mousedown", function() {
                    eventInfo.move(25,0);
                    eventInfo = testPage.mouseEvent(eventInfo, "mousemove", function() {
                        expect(testSlider.value).toEqual(25*100/testSlider._width);
                        eventInfo.move(25,0);
                        eventInfo = testPage.mouseEvent(eventInfo, "mousemove", function() {
                            eventInfo = testPage.mouseEvent(eventInfo, "mouseup", function() {
                                // Regex. "px" on "0" is optional
                                expect(testSliderHandle.parentElement.style.webkitTransform).toMatch("translate3d\\("+(~~((25+25)*100)/testSlider._width)+"%, 0(px)?, 0(px)?\\)");
                            });
                        });

                    });
                });
            });
        });
    });
});
