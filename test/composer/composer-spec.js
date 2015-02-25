var Montage = require("montage").Montage;
var TestPageLoader = require("montage-testing/testpageloader").TestPageLoader;
var EventInfo = require("montage-testing/testpageloader").EventInfo;

TestPageLoader.queueTest("composer-serialization", {src: "composer/composer-serialization-test-page.html", firstDraw: false}, function (testPage) {
    var test;
    beforeEach(function () {
        test = testPage.test;
    });
    describe("composer/composer-spec", function () {
        describe("serialized composer", function () {
            it("should have its load method called", function () {
                expect(testPage.test.simpleTestComposer._loadWasCalled).toBeTruthy();
            });
            it("should have its frame method called after setting needsFrame", function () {
                testPage.test.simpleTestComposer.needsFrame = true;
                spyOn(testPage.test.simpleTestComposer, "frame").andCallThrough();

                testPage.waitForDraw();

                runs(function (){
                    expect(testPage.test.simpleTestComposer.frame).toHaveBeenCalled();
                });

            });
//            it("should have its unload method called", function () {
//
//            });
        });
    });
});

TestPageLoader.queueTest("composer-serialization-lazyload", {src: "composer/composer-serialization-lazyload-test.html", firstDraw: false}, function (testPage) {
    var test;
    beforeEach(function () {
        test = testPage.test;
    });
    describe("composer/composer-spec", function () {
        describe("lazy load serialized composer", function () {
            it("load method should not have been called", function () {
                expect(test.simpleTestComposer._loadWasCalled).toBeFalsy();
            });
            it("load method should be called as the result of an activation event", function () {
                testPage.mouseEvent(new EventInfo().initWithElementAndPosition(test.dynamicText, 0, 0), "mousedown", function () {
                    expect(test.simpleTestComposer._loadWasCalled).toBeTruthy();
                });
            });
        });
    });
});

TestPageLoader.queueTest("composer-programmatic", {src: "composer/composer-test-page.html", firstDraw: false}, function (testPage) {
    var test;
    beforeEach(function () {
        test = testPage.test;
    });
    describe("composer/composer-spec", function () {
        describe("programmatically added composer", function () {
            it("should have its load method called", function () {
                expect(test.simpleTestComposer._loadWasCalled).toBeTruthy();
            });
            it("should have its frame method called after setting needsFrame", function () {
                test.simpleTestComposer.needsFrame = true;
                spyOn(test.simpleTestComposer, "frame").andCallThrough();

                testPage.waitForDraw();

                runs(function (){
                    expect(test.simpleTestComposer.frame).toHaveBeenCalled();
                });

            });
//            it("should have its unload method called", function () {
//
//            });
        });
    });
});

TestPageLoader.queueTest("composer-programmatic-lazyload", {src: "composer/composer-programmatic-lazyload.html", firstDraw: false}, function (testPage) {
    var test;
    beforeEach(function () {
        test = testPage.test;
    });
    describe("composer/composer-spec", function () {
        describe("lazy load serialized composer", function () {
            it("load method should not have been called", function () {
                expect(test.simpleTestComposer._loadWasCalled).toBeFalsy();
            });
            it("load method should be called as the result of an activation event", function () {
                testPage.mouseEvent(new EventInfo().initWithElementAndPosition(test.dynamicTextC.element, 0, 0), "mousedown", function () {
                    expect(test.simpleTestComposer._loadWasCalled).toBeTruthy();
                });
            });
        });
    });
});

TestPageLoader.queueTest("swipe-composer", {src:"composer/swipe/swipe.html", firstDraw: false}, function (testPage) {
    var test;
    beforeEach(function () {
        test = testPage.test;
    });
    describe("composer-spec", function () {
        describe("swipe right",function () {
            it("shouldn't emit swipe event or swipemove event if no move", function () {
                //simulate touch events
                spyOn(test, 'handleSwipe').andCallThrough();
                spyOn(test, 'handleSwipemove').andCallThrough();
                testPage.touchEvent(new EventInfo().initWithElementAndPosition(null, -100, 100), "touchstart", function () {
                    testPage.touchEvent(new EventInfo().initWithElementAndPosition(null, -100, 100), "touchmove", function () {
                        testPage.touchEvent(new EventInfo().initWithElementAndPosition(null, -100, 100), "touchend", function () {
                            expect(test.handleSwipemove).not.toHaveBeenCalled();
                            expect(test.handleSwipe).not.toHaveBeenCalled();
                        });
                    });

                });
            });

            it("should emit swipe event and swipemove event", function () {
                //simulate touch events
                spyOn(test, 'handleSwipe').andCallThrough();
                spyOn(test, 'handleSwipemove').andCallThrough();
                testPage.touchEvent(new EventInfo().initWithElementAndPosition(null, 0, 0), "touchstart", function () {
                    testPage.touchEvent(new EventInfo().initWithElementAndPosition(null, 0, 50), "touchmove", function () {
                        testPage.touchEvent(new EventInfo().initWithElementAndPosition(null, 0, 100), "touchmove", function () {
                            testPage.touchEvent(new EventInfo().initWithElementAndPosition(null, 50, 50), "touchend", function () {
                                expect(test.handleSwipemove).toHaveBeenCalled();
                                expect(test.handleSwipe).toHaveBeenCalled();
                            });
                        });
                    });
                 });
            });
        });
    });
});


