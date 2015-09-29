/*global require,exports,describe,it,expect,waits,runs */
var Montage = require("montage").Montage;
var TestPageLoader = require("montage-testing/testpageloader").TestPageLoader;

TestPageLoader.queueTest("translate-composer-test", function(testPage) {
    var test;
    beforeEach(function() {
        test = testPage.test;
    });

    describe("composer/translate-composer-spec", function() {
        describe("TranslateComposer", function(){
            it("can be created", function() {
                expect(test.translateComposer).toBeDefined();
            });

            describe("translateX", function() {
                it("updates as the mouse moves", function() {
                    testPage.dragElementOffsetTo(test.example.element, 20, 0, null, null, function() {
                        expect(test.translateComposer.translateX).toBeGreaterThan(19);
                    });
                });
                it("can be set", function() {
                    test.translateComposer.translateX = 25;
                    expect(test.x).toBe("25px");
                });
            });
            describe("translateY", function() {
                it("updates as the mouse moves", function() {
                    testPage.dragElementOffsetTo(test.example.element, 0, 20, null, null, function() {
                        expect(test.translateComposer.translateY).toBeGreaterThan(19);
                    });
                });
                it("can be set", function() {
                    test.translateComposer.translateY = 5;
                    expect(test.y).toBe("5px");
                });
            });
            describe("maxTranslateX", function() {
                it("limits translateX", function() {
                    testPage.dragElementOffsetTo(test.example.element, 500, 0, null, null, function() {
                        runs(function() {
                            expect(test.translateComposer.translateX).not.toBeGreaterThan(350);
                        });
                    });
                });
            });
            describe("maxTranslateY", function() {
                it ("limits translateY", function() {
                    testPage.dragElementOffsetTo(test.example.element, 0, 500, null, null, function() {
                        runs(function() {
                            expect(test.translateComposer.translateY).not.toBeGreaterThan(350);
                        });
                    });
                });
            });

            describe("minTranslateX", function() {
                it ("limits translateX", function() {
                    testPage.dragElementOffsetTo(test.example.element, -500, 0, null, null, function() {
                        expect(test.translateComposer.translateX).not.toBeLessThan(20);
                    });
                });

                it("can be set to null and translateX has no minimum", function() {
                    var old = test.translateComposer.minTranslateX;
                    test.translateComposer.minTranslateX = null;
                    test.translateComposer.translateX = 0;
                    testPage.dragElementOffsetTo(test.example.element, -500, 0, null, null, function() {
                        expect(test.translateComposer.translateX).toBeLessThan(-400);
                        test.translateComposer.minTranslateX = old;
                    });
                });
            });

            describe("minTranslateY", function() {
                it("limits translateY", function() {
                    testPage.dragElementOffsetTo(test.example.element, 0, -500, null, null, function() {
                        expect(test.translateComposer.translateY).not.toBeLessThan(-40);
                    });
                });
            });

            describe("allowFloats", function() {
                it('only allows translate{X|Y} to be ints when false', function() {
                    test.translateComposer.translateX = 100.543;
                    test.translateComposer.translateY = -20.4;
                    expect(test.translateComposer.translateX).toBe(100);
                    expect(test.translateComposer.translateY).toBe(-20);
                });
                it('allows translate{X|Y} to be floats when true', function() {
                    test.translateComposer.allowFloats = true;
                    test.translateComposer.translateX = 100.543;
                    test.translateComposer.translateY = -20.4;
                    expect(test.translateComposer.translateX).toBe(100.543);
                    expect(test.translateComposer.translateY).toBe(-20.4);
                    test.translateComposer.allowFloats = false;
                });
            });

            describe("invertAxis", function() {
                it("causes translation in the opposite direction to pointer movement when true", function() {
                    test.translateComposer.translateX = 0;
                    test.translateComposer.translateY = 0;
                    test.translateComposer.invertAxis = true;

                    testPage.dragElementOffsetTo(test.example.element, -50, -50, null, null, function() {
                        expect(test.translateComposer.translateX).toBeGreaterThan(49);
                        expect(test.translateComposer.translateY).toBeGreaterThan(49);
                        test.translateComposer.invertAxis = false;
                    });
                });
            });

            describe("axis", function() {

                it("limits movement to horizonal when set to 'horizontal'", function() {
                    test.translateComposer.translateX = 0;
                    test.translateComposer.translateY = 0;
                    test.translateComposer.axis = "horizontal";

                    testPage.dragElementOffsetTo(test.example.element, 50, 50, null, null, function() {
                        runs(function() {
                            expect(test.translateComposer.translateX).toBeGreaterThan(49);
                            expect(test.translateComposer.translateY).toBe(-40);
                        });
                    });
                });
                it("limits movement to vertical when set to 'vertical'", function() {
                    test.translateComposer.translateX = 0;
                    test.translateComposer.translateY = 0;
                    test.translateComposer.axis = "vertical";

                    testPage.dragElementOffsetTo(test.example.element, 50, 50, null, null, function() {
                        runs(function() {
                            expect(test.translateComposer.translateX).toBe(20);
                            expect(test.translateComposer.translateY).toBeGreaterThan(9);
                        });
                    });
                });
                it("does not limit movement when set to an unknown value", function() {
                    test.translateComposer.translateX = 0;
                    test.translateComposer.translateY = 0;
                    test.translateComposer.axis = null;

                    testPage.dragElementOffsetTo(test.example.element, 50, 50, null, null, function() {
                        runs(function() {
                            expect(test.translateComposer.translateX).toBeGreaterThan(49);
                            expect(test.translateComposer.translateY).toBeGreaterThan(49);
                        });
                    });
                });
            });
            describe("pointerSpeedMultiplier", function() {
                it ("multiplies the translation values by 3 when set to 3", function() {
                    test.translateComposer.translateX = 0;
                    test.translateComposer.translateY = 0;
                    test.translateComposer.invertAxis = false;
                    test.translateComposer.pointerSpeedMultiplier = 3;

                    testPage.dragElementOffsetTo(test.example.element, 50, 50, null, null, function() {
                        expect(test.translateComposer.translateX).toBeGreaterThan(149);
                        expect(test.translateComposer.translateY).toBeGreaterThan(149);
                        test.translateComposer.pointerSpeedMultiplier = 1;

                    });
                });
            });
            describe("hasMomentum", function() {
                it("keeps translating after mouse is released", function() {
                    test.translateComposer.hasMomentum = true;
                    test.translateComposer.translateX = 0;
                    test.translateComposer.translateY = 0;
                    testPage.dragElementOffsetTo(test.example.element, 50, 50, null, null, function() {
                        waits(100);
                        runs(function(){
                            expect(test.translateComposer.translateX).toBeGreaterThan(55);
                            expect(test.translateComposer.translateY).toBeGreaterThan(55);
                            test.translateComposer.hasMomentum = false;
                        });
                    });
                });
                it("dispatches the translate event", function() {
                    test.translateComposer.hasMomentum = true;
                    test.translateComposer.translateX = 0;
                    test.translateComposer.translateY = 0;

                    var listener = jasmine.createSpy("handleTranslateEvent");
                    test.translateComposer.addEventListener("translate", listener);

                    testPage.dragElementOffsetTo(test.example.element, 50, 50, null, null, function() {
                        waits(100);
                        runs(function(){
                            expect(listener).toHaveBeenCalled();
                            test.translateComposer.hasMomentum = false;
                            test.translateComposer.removeEventListener("translate", listener);
                        });
                    });
                });
                it("keeps translating after mouse is released when inverted", function() {
                    test.translateComposer.hasMomentum = true;
                    test.translateComposer.invertAxis = true;
                    test.translateComposer.translateX = 0;
                    test.translateComposer.translateY = 0;

                    testPage.dragElementOffsetTo(test.example.element, 50, 50, null, null, function() {
                        waits(100);
                        runs(function(){
                            expect(test.translateComposer.translateX).toBeLessThan(45);
                            expect(test.translateComposer.translateY).toBeLessThan(45);
                            test.translateComposer.hasMomentum = false;
                            test.translateComposer.invertAxis = false;
                        });
                    });
                });
            });
            describe("translate event", function() {
                it ("should not dispatch a translate event by default", function() {
                    spyOn(test, 'handleTranslate').andCallThrough();

                    testPage.dragElementOffsetTo(test.example.element, 50, 50, null, null, function() {
                        expect(test.handleTranslate).not.toHaveBeenCalled();
                    });
                });
                it ("should dispatch a translate event if an object is listening for it", function() {
                    spyOn(test, 'handleTranslate').andCallThrough();
                    test.translateComposer.addEventListener("translate", test.handleTranslate, false);

                    testPage.dragElementOffsetTo(test.example.element, 50, 50, null, null, function() {
                        expect(test.handleTranslate).toHaveBeenCalled();
                    });
                });
            });
            describe("nested composer", function() {
                var inner, outer, outerComposer, innerComposer,outerListener,innerListener;
                beforeEach(function () {

                    inner = test.innermover;
                    innerComposer = test.innermoverComposer;
                    innerListener = jasmine.createSpy("handleTranslateEvent");
                    innerComposer.addEventListener("translate", innerListener);

                    outer = test.outermover;
                    outerComposer = test.outermoverComposer;
                    outerListener = jasmine.createSpy("handleTranslateEvent");
                    outerComposer.addEventListener("translate", outerListener);

                });

                afterEach(function () {
                    innerListener.reset();
                    innerComposer.removeEventListener("translate", innerListener);
                    outerListener.reset();
                    outerComposer.removeEventListener("translate", outerListener);
                });
                it ("should dispatch a translate if outer is interacted with", function() {
                    testPage.dragElementOffsetTo(outer.element, 50, 50, null, null, function() {
                        expect(outerListener).toHaveBeenCalled();
                    });
                });
                it ("should dispatch a translate if inner is interacted with", function() {
                    testPage.dragElementOffsetTo(inner.element, 50, 50, null, null, function() {
                        expect(innerListener).toHaveBeenCalled();
                    });
                });
                it ("should not dispatch a translate on the outer if inner is interacted with", function() {
                    testPage.dragElementOffsetTo(inner.element, 50, 50, null, null, function() {
                        expect(outerListener).not.toHaveBeenCalled();
                    });
                });
                it ("should not dispatch a translate on the outer even if the inner is on a different axis", function() {
                    innerComposer.axis = "horizontal";
                    outerComposer.axis = "vertical";

                    testPage.dragElementOffsetTo(inner.element, 0, -50, null, null, function() {
                        expect(outerListener).not.toHaveBeenCalled();
                    });
                });
            });
            describe("scrolling", function() {
                it ("should translate on a the wheel event used by this browser", function() {
                    spyOn(test, 'handleTranslate').andCallThrough();
                    test.translateComposer.addEventListener("translate", test.handleTranslate, false);
                    test.translateComposer.listenToWheelEvent = true;

                    var eventName = "mousewheel";
                    var deltaPropertyName = "wheelDeltaY";
                    if (typeof window.onwheel !== "undefined" || typeof window.WheelEvent !== "undefined" ){
                        eventName = "wheel";
                        deltaPropertyName = "deltaY";
                    }

                    var eventInfo = {target: test.example.element};
                    eventInfo[deltaPropertyName] = 6;

                    testPage.wheelEvent(eventInfo, eventName, function() {
                        expect(test.handleTranslate.callCount).toBe(1);
                        test.translateComposer.listenToWheelEvent = false;

                        // test how much we scroll by, learn amounts
                    });
                });
            });

        });
    });
});
var touchOptions = TestPageLoader.options("translate-composer-test", {timeoutLength: 10000}, function() {console.log("translate-composer-test touch callback");});
describe("translate-composer-test touch", function () {
    var testPage = TestPageLoader.testPage;
    it("should load", function() {
        console.group("translate-composer-touch-test");
        var frameLoaded = TestPageLoader.testPage.loadFrame(touchOptions).then(function(theTestPage) {
            theTestPage.window.Touch = function() {};
        });
        return testPage.loadTest(frameLoaded, touchOptions).then(function(theTestPage) {
            expect(theTestPage.loaded).toBe(true);
        });
    });

    describe("nested composer", function() {
        var test;
        beforeEach(function() {
            test = testPage.test;
        });

        var inner, outer, outerComposer, innerComposer,outerListener,innerListener,
            translateComposer, example;
        beforeEach(function () {

            inner = test.innermover;
            innerComposer = test.innermoverComposer;
            innerListener = jasmine.createSpy(" innerHandleTranslateEvent");
            innerComposer.addEventListener("translate", innerListener);

            outer = test.outermover;
            outerComposer = test.outermoverComposer;
            outerListener = jasmine.createSpy("outerHandleTranslateEvent");
            outerComposer.addEventListener("translate", outerListener);

            example = test.example;
            translateComposer = test.translateComposer;
        });

        afterEach(function () {
            innerListener.reset();
            innerComposer.removeEventListener("translate", innerListener);
            outerListener.reset();
            outerComposer.removeEventListener("translate", outerListener);
        });
        it ("should dispatch a translate on the outer if inner is on a different axis", function() {
            innerComposer.axis = "horizontal";
            outerComposer.axis = "vertical";

            var timeline = [{
                type: "touch",
                target: inner.element,
                identifier: 1,
                steps: [
                    { time: 0, touchstart: null },
                    { time: 1, touchmove: { dx: 25, dy: 0} },
                    { time: 2, touchmove: { dx: 25, dy: 0} },
                    { time: 4,  touchend: null }
                ]
            }, {
                type: "touch",
                target: outer.element,
                identifier: 2,
                steps: [
                    { time: 1, touchstart: null },
                    { time: 2, touchmove: { dx: 0, dy: 25} },
                    { time: 3, touchmove: { dx: 0, dy: 25} },
                    { time: 4, touchend: null }
                ]
            }];

            testPage.fireEventsOnTimeline(timeline, function(time) {
                if(time === 4) {
                    expect(outerListener).toHaveBeenCalled();
                    expect(innerListener).toHaveBeenCalled();
                }
            });
        });

        it ("should claim the pointer to the inner in a container->widget situation with a fast flick", function() {
            outerComposer.axis = "both";
            outerComposer.stealChildrenPointer = true;
            outerComposer.stealChildrenPointerThreshold = 100;
            innerComposer.axis = "both";
            innerComposer.stealChildrenPointer = false;

            var timeline = [{
                fakeTimeStamp: true,
                type: "touch",
                target: inner.element,
                identifier: 1,
                steps: [
                    { time: 0, touchstart: null },
                    { time: 1, touchmove: { dx: 25, dy: 0} },
                    { time: 2, touchend: null }
                ]
            }];

            testPage.fireEventsOnTimeline(timeline, function(time) {
                if(time === 1) {
                    var claimedByComponent = inner.eventManager.componentClaimingPointer(1);
                    expect(claimedByComponent).toBe(outerComposer);
                }
            });
        });

        it ("should claim the pointer to the inner in a container->widget situation with a fast flick but opposite directions", function() {
            outerComposer.axis = "vertical";
            outerComposer.stealChildrenPointer = true;
            outerComposer.stealChildrenPointerThreshold = 100;
            innerComposer.axis = "horizontal";
            innerComposer.stealChildrenPointer = false;

            var timeline = [{
                fakeTimeStamp: true,
                type: "touch",
                target: inner.element,
                identifier: 1,
                steps: [
                    { time: 0, touchstart: null },
                    { time: 1, touchmove: { dx: 25, dy: 0} },
                    { time: 2, touchend: null }
                ]
            }];

            testPage.fireEventsOnTimeline(timeline, function(time) {
                if(time === 1) {
                    var claimedByComponent = inner.eventManager.componentClaimingPointer(1);
                    expect(claimedByComponent).toBe(innerComposer);
                }
            });
        });

        it ("should claim the pointer to the inner in a container->container situation with a fast flick", function() {
            outerComposer.axis = "vertical";
            outerComposer.stealChildrenPointer = true;
            outerComposer.stealChildrenPointerThreshold = 100;
            innerComposer.axis = "vertical";
            innerComposer.stealChildrenPointer = true;
            innerComposer.stealChildrenPointerThreshold = 100;

            var timeline = [{
                fakeTimeStamp: true,
                type: "touch",
                target: inner.element,
                identifier: 1,
                steps: [
                    { time: 0, touchstart: null },
                    { time: 1, touchmove: { dx: 0, dy: 25} },
                    { time: 2, touchend: null }
                ]
            }];

            testPage.fireEventsOnTimeline(timeline, function(time) {
                if(time === 1) {
                    var claimedByComponent = inner.eventManager.componentClaimingPointer(1);
                    expect(claimedByComponent).toBe(innerComposer);
                }
            });
        });

        it ("should claim the pointer to the outer in a container->container situation with a slow flick", function() {
            outerComposer.axis = "vertical";
            outerComposer.stealChildrenPointer = true;
            outerComposer.stealChildrenPointerThreshold = 100;
            innerComposer.axis = "vertical";
            innerComposer.stealChildrenPointer = true;
            innerComposer.stealChildrenPointerThreshold = 100;

            var timeline = [{
                fakeTimeStamp: true,
                type: "touch",
                target: inner.element,
                identifier: 1,
                steps: [
                    { time: 0, touchstart: null },
                    { time: 150, touchmove: { dx: 0, dy: 25} },
                    { time: 151, touchend: null }
                ]
            }];

            testPage.fireEventsOnTimeline(timeline, function(time) {
                if(time === 1) {
                    var claimedByComponent = inner.eventManager.componentClaimingPointer(1);
                    expect(claimedByComponent).toBe(innerComposer);
                }
            });
        });

        it ("should claim the pointer to the outer in a container->container situation with a fast flick for the inner and outer", function() {
            outerComposer.axis = "vertical";
            outerComposer.stealChildrenPointer = true;
            outerComposer.stealChildrenPointerThreshold = 50;
            innerComposer.axis = "vertical";
            innerComposer.stealChildrenPointer = true;
            innerComposer.stealChildrenPointerThreshold = 100;

            var timeline = [{
                fakeTimeStamp: true,
                type: "touch",
                target: inner.element,
                identifier: 1,
                steps: [
                    { time: 0, touchstart: null },
                    { time: 1, touchmove: { dx: 0, dy: 25} },
                    { time: 2, touchend: null }
                ]
            }];

            testPage.fireEventsOnTimeline(timeline, function(time) {
                if(time === 1) {
                    var claimedByComponent = inner.eventManager.componentClaimingPointer(1);
                    expect(claimedByComponent).toBe(outerComposer);
                }
            });
        });

        it ("should claim the pointer to the inner in a container->container situation with a slow flick for the outer and fast for the inner", function() {
            outerComposer.axis = "vertical";
            outerComposer.stealChildrenPointer = true;
            outerComposer.stealChildrenPointerThreshold = 50;
            innerComposer.axis = "vertical";
            innerComposer.stealChildrenPointer = true;
            innerComposer.stealChildrenPointerThreshold = 100;

            var timeline = [{
                fakeTimeStamp: true,
                type: "touch",
                target: inner.element,
                identifier: 1,
                steps: [
                    { time: 0, touchstart: null },
                    { time: 75, touchmove: { dx: 0, dy: 25} },
                    { time: 76, touchend: null }
                ]
            }];

            testPage.fireEventsOnTimeline(timeline, function(time) {
                if(time === 1) {
                    var claimedByComponent = inner.eventManager.componentClaimingPointer(1);
                    expect(claimedByComponent).toBe(innerComposer);
                }
            });
        });

        it ("should claim the pointer in a widget situation with a slow flick", function() {
            translateComposer.axis = "vertical";
            translateComposer.stealChildrenPointer = false;

            var timeline = [{
                fakeTimeStamp: true,
                type: "touch",
                target: example.element,
                identifier: 1,
                steps: [
                    { time: 0, touchstart: null },
                    { time: 150, touchmove: { dx: 0, dy: 25} },
                    { time: 151, touchend: null }
                ]
            }];

            testPage.fireEventsOnTimeline(timeline, function(time) {
                if(time === 1) {
                    var claimedByComponent = inner.eventManager.componentClaimingPointer(1);
                    expect(claimedByComponent).toBe(translateComposer);
                }
            });
        });

        it ("should claim the pointer in a widget situation with a fast flick", function() {
            translateComposer.axis = "vertical";
            translateComposer.stealChildrenPointer = false;

            var timeline = [{
                fakeTimeStamp: true,
                type: "touch",
                target: example.element,
                identifier: 1,
                steps: [
                    { time: 0, touchstart: null },
                    { time: 1, touchmove: { dx: 0, dy: 25} },
                    { time: 2, touchend: null }
                ]
            }];

            testPage.fireEventsOnTimeline(timeline, function(time) {
                if(time === 1) {
                    var claimedByComponent = inner.eventManager.componentClaimingPointer(1);
                    expect(claimedByComponent).toBe(translateComposer);
                }
            });
        });

        it ("should claim the pointer in a container situation with a slow flick", function() {
            translateComposer.axis = "vertical";
            translateComposer.stealChildrenPointer = true;
            translateComposer.stealChildrenPointerThreshold = 100;

            var timeline = [{
                fakeTimeStamp: true,
                type: "touch",
                target: example.element,
                identifier: 1,
                steps: [
                    { time: 0, touchstart: null },
                    { time: 150, touchmove: { dx: 0, dy: 25} },
                    { time: 151, touchend: null }
                ]
            }];

            testPage.fireEventsOnTimeline(timeline, function(time) {
                if(time === 1) {
                    var claimedByComponent = inner.eventManager.componentClaimingPointer(1);
                    expect(claimedByComponent).toBe(translateComposer);
                }
            });
        });

        it ("should claim the pointer in a container situation with a fast flick", function() {
            translateComposer.axis = "vertical";
            translateComposer.stealChildrenPointer = true;
            translateComposer.stealChildrenPointerThreshold = 100;

            var timeline = [{
                fakeTimeStamp: true,
                type: "touch",
                target: example.element,
                identifier: 1,
                steps: [
                    { time: 0, touchstart: null },
                    { time: 1, touchmove: { dx: 0, dy: 25} },
                    { time: 2, touchend: null }
                ]
            }];

            testPage.fireEventsOnTimeline(timeline, function(time) {
                if(time === 1) {
                    var claimedByComponent = inner.eventManager.componentClaimingPointer(1);
                    expect(claimedByComponent).toBe(translateComposer);
                }
            });
        });
    });

    it("should unload", function() {
        TestPageLoader.testPage.unloadTest();
        console.groupEnd();
    });

});
