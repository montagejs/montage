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
/*global require,exports,describe,it,expect,runs */
var Montage = require("montage").Montage,
    TestPageLoader = require("support/testpageloader").TestPageLoader,
    ActionEventListener = require("montage/core/event/action-event-listener").ActionEventListener;

var testPage = TestPageLoader.queueTest("scroller-test", function() {
    var test = testPage.test;

    describe("ui/scroller-spec", function() {
        it("should load", function() {
            expect(testPage.loaded).toBe(true);
        });

        describe("Scroller", function(){
            it("can be created", function() {
                expect(test.scroller1).toBeDefined();
            });

            it("can be scrolled", function() {
                testPage.dragElementOffsetTo(test.scroller1.element, 0, -20, null, null, function() {
                    testPage.waitForDraw();
                    runs(function() {
                        expect(test.scroller1.scrollY).toBe(20);
                        expect(testPage.getElementById("list").parentNode.style.webkitTransform).toMatch("translate3d\\(0(px)?, -20px, 0(px)?\\)");
                    });

                });
            });

            describe("adding content", function() {
                var delegateSpy = {
                    didSetMaxScroll: function(event) {
                        var x = 2;
                    }
                };
                var delegate = spyOn(delegateSpy, 'didSetMaxScroll');

                test.scroller1.delegate = delegateSpy;

                var originalMaxY = test.scroller1._maxTranslateY;
                for (var i = 0; i < 5; i++) {
                    var li = document.createElement("li");
                    li.textContent = "new item " + i;
                    testPage.getElementById("list").appendChild(li);
                }

                it("calls didSetMaxScroll delegate", function() {
                    expect(delegate).toHaveBeenCalled();
                });

                it("can have the content expand", function() {
                    expect(test.scroller1._maxTranslateY).toBeGreaterThan(originalMaxY);
                });
            });
        });
    });
});
