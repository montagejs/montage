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
/*global require,exports,describe,it,expect */
var Montage = require("montage").Montage,
    TestPageLoader = require("support/testpageloader").TestPageLoader;

var testPage = TestPageLoader.queueTest("input-range-test", function() {
    var test = testPage.test;

    describe("ui/input-range-spec", function() {
        it("should load", function() {
            expect(testPage.loaded).toBe(true);
        });

        describe("RangeInput", function() {
            it("can be created", function() {
                expect(test.range_input1).toBeDefined();
            });

            describe("value", function() {
                it("can be set from the serialization", function() {
                    expect(test.range_input2.value).toBe(1);
                });
            });

            it("can be changed", function() {
                expect(test.range_input1.value).toBe(0);

                var eventInfo = {
                    target: test.range_input1.element,
                    clientX: test.range_input1.element.offsetLeft + 30,
                    clientY: test.range_input1.element.offsetTop + 5
                };

                testPage.clickOrTouch(eventInfo);
                testPage.waitForDraw();
                runs(function() {
                    expect(test.range_input1.value).toBeGreaterThan(0);
                });

            });

            describe("inside a scroller", function() {
                it("can be changed", function() {
                    expect(test.scroll_range.value).toBe(0);

                    var eventInfo = {
                        target: test.scroll_range.element,
                        clientX: test.scroll_range.element.offsetLeft + 30,
                        clientY: test.scroll_range.element.offsetTop + 5
                    };

                    testPage.clickOrTouch(eventInfo);
                    testPage.waitForDraw();
                    runs(function() {
                        expect(test.range_input1.value).toBeGreaterThan(0);
                    });
                });

                it("doesn't surrender the pointer", function() {
                    var el, scroll_el, listener, originalValue;
                    el = test.scroll_range.element;
                    scroll_el = test.scroll.element;

                    // mousedown
                    testPage.mouseEvent({target: el}, "mousedown");

                    expect(test.scroll.eventManager.isPointerClaimedByComponent(test.scroll._observedPointer, test.scroll)).toBe(false);

                    // Mouse move doesn't happen instantly
                    waits(10);
                    runs(function() {
                        // mouse move up

                        var moveEvent = document.createEvent("MouseEvent");
                        // Dispatch to scroll view, but use the coordinates from the
                        // button
                        moveEvent.initMouseEvent("mousemove", true, true, scroll_el.view, null,
                                el.offsetLeft, el.offsetTop - 50,
                                el.offsetLeft, el.offsetTop - 50,
                                false, false, false, false,
                                0, null);
                        var valueBeforeScroll = test.scroll_range.value;
                        scroll_el.dispatchEvent(moveEvent);

                        expect(test.scroll_range.value).toBe(valueBeforeScroll);
                        expect(test.scroll.eventManager.isPointerClaimedByComponent(test.scroll._observedPointer, test.scroll)).toBe(false);

                        // mouse up
                        testPage.mouseEvent({target: el}, "mouseup");
                        testPage.mouseEvent({target: el}, "click");
                    });

                });
            });
        });
    });
});
