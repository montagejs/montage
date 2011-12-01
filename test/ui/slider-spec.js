/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
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
                                expect(testSliderHandle.parentElement.style.webkitTransform).toEqual("translate3d("+(~~((25+25)*100)/testSlider._width)+"%, 0px, 0px)");
                            });
                        });

                    });
                });
            });
        });
    });
});
