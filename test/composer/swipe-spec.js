/* <copyright>
Copyright (c) 2012, Motorola Mobility, Inc

All Rights Reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

  - Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
  - Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
  - Neither the name of Motorola Mobility nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
</copyright> */
var Montage = require("montage").Montage,
    TestPageLoader = require("support/testpageloader").TestPageLoader,
    Component = require("montage/ui/component").Component;

var testPage = TestPageLoader.queueTest("swipe", function() {
    describe("composer/swipe-spec", function() {
        it("should load", function() {
            expect(testPage.loaded).toBeTruthy();
        });

        describe("swipe right",function() {
            xit("should emit swipe event", function() {
                //simulate touch events
                spyOn(testPage.test, 'handleSwipe');
                testPage.touchEvent(EventInfo.create().initWithElementAndPosition(null, -100, 100), "touchstart", function() {
                    testPage.touchEvent(EventInfo.create().initWithElementAndPosition(null, -0, 100), "touchmove", function() {
                        testPage.touchEvent(EventInfo.create().initWithElementAndPosition(null, 100, 100), "touchend", function() {
                            expect(testPage.test.handleSwipe).toHaveBeenCalled();
                        });
                    });
                 });
            });
            xit("shouldn't emit swipe event if no move", function() {
                //simulate touch events
                spyOn(testPage.test, 'handleSwipe');
                testPage.touchEvent(EventInfo.create().initWithElementAndPosition(null, -100, 100), "touchstart", function() {
                    testPage.touchEvent(EventInfo.create().initWithElementAndPosition(null, -100, 100), "touchmove", function() {
                        testPage.touchEvent(EventInfo.create().initWithElementAndPosition(null, -100, 100), "touchend", function() {
                            expect(testPage.test.handleSwipe).not.toHaveBeenCalled();
                        });
                    });

                });
            });
        }
        );
    });
});
