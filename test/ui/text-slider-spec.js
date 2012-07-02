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
/*global require,exports,describe,it,expect,waits,runs */
var Montage = require("montage").Montage,
    TestPageLoader = require("support/testpageloader").TestPageLoader,
    ActionEventListener = require("montage/core/event/action-event-listener").ActionEventListener;

var testPage = TestPageLoader.queueTest("text-slider-test", function() {
    var test = testPage.test;

    describe("ui/text-slider-spec", function() {
        it("should load", function() {
            expect(testPage.loaded).toBe(true);
        });

        describe("text-slider", function() {
            it("can be created", function() {
                expect(test.number).toBeDefined();
            });

            it("increases when dragged right", function() {
                var oldValue = test.number.value;
                testPage.dragElementOffsetTo(test.number.element, 50, 0, null, function() {
                    expect(test.number.value).toBe(oldValue + 50);
                }, null);
            });
            it("decreases when dragged left", function() {
                var oldValue = test.number.value;
                testPage.dragElementOffsetTo(test.number.element, -50, 0, null, function() {
                    expect(test.number.value).toBe(oldValue - 50);
                }, null);
            });
            it("increases when dragged up", function() {
                var oldValue = test.number.value;
                testPage.dragElementOffsetTo(test.number.element, 0, -50, null, function() {
                    expect(test.number.value).toBe(oldValue + 50);
                }, null);
            });
            it("decreases when dragged down", function() {
                var oldValue = test.number.value;
                testPage.dragElementOffsetTo(test.number.element, 0, 50, null, function() {
                    expect(test.number.value).toBe(oldValue - 50);
                }, null);
            });
            it("it doesn't decrease when dragging up and left", function() {
                var element = test.number.element;
                var oldValue = test.number.value;

                testPage.mouseEvent({target: element}, "mousedown");

                // Mouse move doesn't happen instantly
                waits(10);
                runs(function() {
                    testPage.mouseEvent({
                        target: element,
                        clientX: element.offsetLeft,
                        clientY: element.offsetTop - 50
                    }, "mousemove");

                    expect(test.number.value).toBe(oldValue + 50);

                    waits(10);
                    runs(function() {
                        var eventInfo = testPage.mouseEvent({
                            target: element,
                            clientX: element.offsetLeft - 60,
                            clientY: element.offsetTop - 50
                        }, "mousemove");
                        // mouse up
                        testPage.mouseEvent(eventInfo, "mouseup");

                        // It should not be -60, even though the left magnitude
                        // is greater that the up magnitude here.
                        expect(test.number.value).toBe(oldValue + 50);


                    });
                });
            });

            describe("minValue", function() {
                it("restricts value", function() {
                    test.percent.value = -1;
                    expect(test.percent.value).toBe(0);
                });
            });
            describe("maxValue", function() {
                it("restricts value", function() {
                    test.percent.value = 101;
                    expect(test.percent.value).toBe(100);
                });
            });

            describe("text field", function() {
                it("appears when the text-slider is clicked", function() {
                    test.hex.value = 160;
                    test.hex.handlePress();
                    expect(test.hex.isEditing).toBe(true);
                    testPage.waitForDraw();
                    runs(function() {
                        expect(test.hex.element.className).toMatch("montage-TextSlider--editing");
                    });
                });
                it("increases when the up arrow is pressed", function() {
                    test.hex.handleInputKeydown({target: test.hex._inputElement, keyCode: 38});
                    expect(test.hex.value).toBe(161);
                    testPage.waitForDraw();
                    runs(function() {
                        expect(test.hex._inputElement.value).toBe("A1");
                    });
                });
                it("decreases when the down arrow is pressed", function() {
                    test.hex.handleInputKeydown({target: test.hex._inputElement, keyCode: 40});
                    expect(test.hex.value).toBe(160);
                    testPage.waitForDraw();
                    runs(function() {
                        expect(test.hex._inputElement.value).toBe("A0");
                    });
                });
                it("sets the value when enter is set", function() {
                    test.hex._inputElement.value = "2A";
                    test.hex.handleInputKeydown({target: test.hex._inputElement, keyCode: 13});
                    expect(test.hex.value).toBe(42);
                });
                it("ignored any entered value when Esc is pressed", function() {
                    test.hex.value = 160;
                    test.hex.handlePress();
                    test.hex._inputElement.value = "00";
                    test.hex.handleInputKeydown({target: test.hex._inputElement, keyCode: 27});
                    expect(test.hex.value).toBe(160);
                });
            });
        });
    });
});
