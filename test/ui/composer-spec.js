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
    TestPageLoader = require("support/testpageloader").TestPageLoader;

var serializationTestPage = TestPageLoader.queueTest("composer-serialization", {src: "ui/composer/composer-serialization-test-page.html", firstDraw: false}, function() {
    describe("ui/composer-spec", function() {
        it("should load", function() {
            expect(serializationTestPage.loaded).toBeTruthy();
        });

        describe("serialized composer", function() {
            it("should have its load method called", function() {
                expect(serializationTestPage.test.simpleTestComposer._loadWasCalled).toBeTruthy();
            });
            it("should have its frame method called after setting needsFrame", function() {
                serializationTestPage.test.simpleTestComposer.needsFrame = true;
                spyOn(serializationTestPage.test.simpleTestComposer, "frame").andCallThrough();

                serializationTestPage.waitForDraw();

                runs(function(){
                    expect(serializationTestPage.test.simpleTestComposer.frame).toHaveBeenCalled();
                });

            });
//            it("should have its unload method called", function() {
//
//            });
        });
    });
});

var serializationLazyLoadTestPage = TestPageLoader.queueTest("composer-serialization", {src: "ui/composer/composer-serialization-lazyload-test.html", firstDraw: false}, function() {
    describe("ui/composer-spec", function() {
        it("should load", function() {
            expect(serializationLazyLoadTestPage.loaded).toBeTruthy();
        });

        describe("lazy load serialized composer", function() {
            it("load method should not have been called", function() {
                expect(serializationLazyLoadTestPage.test.simpleTestComposer._loadWasCalled).toBeFalsy();
            });
            it("load method should be called as the result of an activation event", function() {
                serializationLazyLoadTestPage.mouseEvent(EventInfo.create().initWithElementAndPosition(serializationLazyLoadTestPage.test.dynamicText, 0, 0), "mousedown", function() {
                    expect(serializationLazyLoadTestPage.test.simpleTestComposer._loadWasCalled).toBeTruthy();
                });
            });
        });
    });
});

var simpleTestPage = TestPageLoader.queueTest("composer-programmatic", {src: "ui/composer/composer-test-page.html", firstDraw: false}, function() {
    describe("ui/composer-spec", function() {
        it("should load", function() {
            expect(simpleTestPage.loaded).toBeTruthy();
        });

        describe("programmatically added composer", function() {
            it("should have its load method called", function() {
                expect(simpleTestPage.test.simpleTestComposer._loadWasCalled).toBeTruthy();
            });
            it("should have its frame method called after setting needsFrame", function() {
                simpleTestPage.test.simpleTestComposer.needsFrame = true;
                spyOn(simpleTestPage.test.simpleTestComposer, "frame").andCallThrough();

                simpleTestPage.waitForDraw();

                runs(function(){
                    expect(simpleTestPage.test.simpleTestComposer.frame).toHaveBeenCalled();
                });

            });
//            it("should have its unload method called", function() {
//
//            });
        });
    });
});

var programmaticLazyLoadTestPage = TestPageLoader.queueTest("composer-serialization", {src: "ui/composer/composer-programmatic-lazyload.html", firstDraw: false}, function() {
    describe("ui/composer-spec", function() {
        it("should load", function() {
            expect(programmaticLazyLoadTestPage.loaded).toBeTruthy();
        });

        describe("lazy load serialized composer", function() {
            it("load method should not have been called", function() {
                expect(programmaticLazyLoadTestPage.test.simpleTestComposer._loadWasCalled).toBeFalsy();
            });
            it("load method should be called as the result of an activation event", function() {
                programmaticLazyLoadTestPage.mouseEvent(EventInfo.create().initWithElementAndPosition(programmaticLazyLoadTestPage.test.dynamicTextC.element, 0, 0), "mousedown", function() {
                    expect(programmaticLazyLoadTestPage.test.simpleTestComposer._loadWasCalled).toBeTruthy();
                });
            });
        });
    });
});

var swipeTestPage = TestPageLoader.queueTest("swipe-composer", {src:"ui/composer/swipe/swipe.html", firstDraw: false}, function() {
    describe("ui/composer-spec", function() {
        it("should load", function() {
            expect(swipeTestPage.loaded).toBeTruthy();
        });

        describe("swipe right",function() {
            it("shouldn't emit swipe event or swipemove event if no move", function() {
                //simulate touch events
                spyOn(swipeTestPage.test, 'handleSwipe').andCallThrough();
                spyOn(swipeTestPage.test, 'handleSwipemove').andCallThrough();
                swipeTestPage.touchEvent(EventInfo.create().initWithElementAndPosition(null, -100, 100), "touchstart", function() {
                    swipeTestPage.touchEvent(EventInfo.create().initWithElementAndPosition(null, -100, 100), "touchmove", function() {
                        swipeTestPage.touchEvent(EventInfo.create().initWithElementAndPosition(null, -100, 100), "touchend", function() {
                            expect(swipeTestPage.test.handleSwipemove).not.toHaveBeenCalled();
                            expect(swipeTestPage.test.handleSwipe).not.toHaveBeenCalled();
                        });
                    });

                });
            });

            it("should emit swipe event and swipemove event", function() {
                //simulate touch events
                spyOn(swipeTestPage.test, 'handleSwipe').andCallThrough();
                spyOn(swipeTestPage.test, 'handleSwipemove').andCallThrough();
                swipeTestPage.touchEvent(EventInfo.create().initWithElementAndPosition(null, 0, 0), "touchstart", function() {
                    swipeTestPage.touchEvent(EventInfo.create().initWithElementAndPosition(null, 0, 50), "touchmove", function() {
                        swipeTestPage.touchEvent(EventInfo.create().initWithElementAndPosition(null, 0, 100), "touchmove", function() {
                            swipeTestPage.touchEvent(EventInfo.create().initWithElementAndPosition(null, 50, 50), "touchend", function() {
                                expect(swipeTestPage.test.handleSwipemove).toHaveBeenCalled();
                                expect(swipeTestPage.test.handleSwipe).toHaveBeenCalled();
                            });
                        });
                    });
                 });
            });
        });
    });
});


