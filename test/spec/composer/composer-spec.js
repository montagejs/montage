var Montage = require("montage").Montage;
var TestPageLoader = require("montage-testing/testpageloader").TestPageLoader;
var EventInfo = require("montage-testing/testpageloader").EventInfo;

TestPageLoader.queueTest("composer-serialization", {src: "spec/composer/composer-serialization-test-page.html", firstDraw: false}, function (testPage) {
    var test;
    beforeEach(function () {
        test = testPage.test;
    });
    describe("composer/composer-spec", function () {
        describe("serialized composer", function () {
            it("should have its load method called", function () {
                expect(testPage.test.simpleTestComposer._loadWasCalled).toBeTruthy();
            });

            it("should have its frame method called after setting needsFrame", function (done) {
                testPage.test.simpleTestComposer.needsFrame = true;
                spyOn(testPage.test.simpleTestComposer, "frame").and.callThrough();

                testPage.waitForDraw().then(function () {
                    expect(testPage.test.simpleTestComposer.frame).toHaveBeenCalled();
                    done();
                });

            });

//            it("should have its unload method called", function () {
//
//            });
        });
    });
});

TestPageLoader.queueTest("composer-serialization-lazyload", {src: "spec/composer/composer-serialization-lazyload-test.html", firstDraw: false}, function (testPage) {
    var test;
    beforeEach(function () {
        test = testPage.test;
    });
    describe("composer/composer-spec", function () {
        describe("lazy load serialized composer", function () {
            it("load method should not have been called", function () {
                expect(test.simpleTestComposer._loadWasCalled).toBeFalsy();
            });
            
            xit("load method should be called as the result of an activation event", function (done) {
                testPage.mouseEvent(new EventInfo().initWithElementAndPosition(test.dynamicText, 0, 0), "mousedown", function () {
                    expect(test.simpleTestComposer._loadWasCalled).toBeTruthy();
                    done();
                });
            });
        });
    });
});

TestPageLoader.queueTest("composer-programmatic", {src: "spec/composer/composer-test-page.html", firstDraw: false}, function (testPage) {
    var test;
    beforeEach(function () {
        test = testPage.test;
    });
    describe("composer/composer-spec", function () {
        describe("programmatically added composer", function () {
            it("should have its load method called", function () {
                expect(test.simpleTestComposer._loadWasCalled).toBeTruthy();
            });
            it("should have its frame method called after setting needsFrame", function (done) {
                test.simpleTestComposer.needsFrame = true;
                spyOn(test.simpleTestComposer, "frame").and.callThrough();
                testPage.waitForDraw().then(function () {
                    expect(test.simpleTestComposer.frame).toHaveBeenCalled();
                    done();
                });

            });
//            it("should have its unload method called", function () {
//
//            });
        });
    });
});

TestPageLoader.queueTest("composer-programmatic-lazyload", {src: "spec/composer/composer-programmatic-lazyload.html", firstDraw: false}, function (testPage) {
    var test;
    beforeEach(function () {
        test = testPage.test;
    });
    describe("composer/composer-spec", function () {
        describe("lazy load serialized composer", function () {
            it("load method should not have been called", function () {
                expect(test.simpleTestComposer._loadWasCalled).toBeFalsy();
            });
            xit("load method should be called as the result of an activation event", function () {
                testPage.mouseEvent(new EventInfo().initWithElementAndPosition(test.dynamicTextC.element, 0, 0), "mousedown", function () {
                    expect(test.simpleTestComposer._loadWasCalled).toBeTruthy();
                });
            });
        });
    });
});

TestPageLoader.queueTest("swipe-composer", {src:"spec/composer/swipe/swipe.html", firstDraw: false}, function (testPage) {
    var test, swipeElement;
    beforeEach(function () {
        test = testPage.test;
        swipeElement = test.dummyComponent.element;
    });

    //FIXME: should be removed when will provide a pollyfil for the pointer events
    function dispatchPointerEvent(element, type, positionX, positionY) {
        var eventInit = {
            clientX: positionX,
            clientY: positionY,
            bubbles: true,
            pointerType: "mouse"
        };

        if (window.PointerEvent) {
            element.dispatchEvent(new PointerEvent(type, eventInit));
        } else if (window.MSPointerEvent && window.navigator.msPointerEnabled) {
            if (type === "pointerdown")  {
                type = "MSPointerDown";
            } else if (type === "pointermove") {
                type = "MSPointerMove";
            } else {
                type = "MSPointerUp";
            }
            element.dispatchEvent(new MSPointerEvent(type, eventInit));
        } else {
            if (type === "pointerdown") {
                type = "mousedown";
            } else if (type === "pointermove") {
                type = "mousemove";
            } else {
                type = "mouseup";
            }
            element.dispatchEvent(new MouseEvent(type, eventInit));
        }
    }

    describe("composer-spec", function () {
        describe("swipe right",function () {
            it("shouldn't emit swipe event or swipemove event if no move", function () {
                spyOn(test, 'handleSwipe').and.callThrough();
                dispatchPointerEvent(swipeElement, "pointerdown", -100, 100);
                dispatchPointerEvent(swipeElement, "pointermove", -100, 100);
                dispatchPointerEvent(swipeElement, "pointermove", -100, 100);
                dispatchPointerEvent(swipeElement, "pointerup", -100, 100);
                expect(test.handleSwipe).not.toHaveBeenCalled();
            });

            it("should emit swipe event and swipeDown event", function () {
                spyOn(test, 'handleSwipe').and.callThrough();
                dispatchPointerEvent(swipeElement, "pointerdown", 0, 0);
                dispatchPointerEvent(swipeElement, "pointermove", 0, 50);
                dispatchPointerEvent(swipeElement, "pointermove", 0, 80);
                dispatchPointerEvent(swipeElement, "pointerup", 0, 80);
                expect(test.handleSwipe).toHaveBeenCalled();

                var event = test.handleSwipe.calls.argsFor(0)[0];
                expect(event.direction).toBe('down');
                expect(event.angle).toBe(270);
                expect(event.distance).toBe(80);
            });

            it("should emit swipe event and swipeUp event", function () {
                spyOn(test, 'handleSwipe').and.callThrough();
                dispatchPointerEvent(swipeElement, "pointerdown", 50, 50);
                dispatchPointerEvent(swipeElement, "pointermove", 50, 40);
                dispatchPointerEvent(swipeElement, "pointermove", 50, 30);
                dispatchPointerEvent(swipeElement, "pointerup", 50, 30);
                expect(test.handleSwipe).toHaveBeenCalled();

                var event = test.handleSwipe.calls.argsFor(0)[0];
                expect(event.direction).toBe('up');
                expect(event.angle).toBe(90);
                expect(event.distance).toBe(20);
            });

            it("should emit swipe event and swipeRight event", function () {
                spyOn(test, 'handleSwipe').and.callThrough();
                dispatchPointerEvent(swipeElement, "pointerdown", 0, 0);
                dispatchPointerEvent(swipeElement, "pointermove", 50, 0);
                dispatchPointerEvent(swipeElement, "pointermove", 80, 0);
                dispatchPointerEvent(swipeElement, "pointerup", 80, 0);
                expect(test.handleSwipe).toHaveBeenCalled();

                var event = test.handleSwipe.calls.argsFor(0)[0];
                expect(event.direction).toBe('right');
                expect(event.angle).toBe(0);
                expect(event.distance).toBe(80);
            });

            it("should emit swipe event and swipeLeft event", function () {
                spyOn(test, 'handleSwipe').and.callThrough();
                dispatchPointerEvent(swipeElement, "pointerdown", 100, 0);
                dispatchPointerEvent(swipeElement, "pointermove", 80, 0);
                dispatchPointerEvent(swipeElement, "pointermove", 50, 0);
                dispatchPointerEvent(swipeElement, "pointerup", 50, 0);
                expect(test.handleSwipe).toHaveBeenCalled();

                var event = test.handleSwipe.calls.argsFor(0)[0];
                expect(event.direction).toBe('left');
                expect(event.angle).toBe(180);
                expect(event.distance).toBe(50);
            });
        });
    });
});
