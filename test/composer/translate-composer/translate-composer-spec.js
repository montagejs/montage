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
                expect(test.translate_composer).toBeDefined();
            });

            describe("translateX", function() {
                it("updates as the mouse moves", function() {
                    testPage.dragElementOffsetTo(test.example.element, 20, 0, null, null, function() {
                        expect(test.translate_composer.translateX).toBeGreaterThan(19);
                    });
                });
                it("can be set", function() {
                    test.translate_composer.translateX = 25;
                    expect(test.x).toBe("25px");
                });
            });
            describe("translateY", function() {
                it("updates as the mouse moves", function() {
                    testPage.dragElementOffsetTo(test.example.element, 0, 20, null, null, function() {
                        expect(test.translate_composer.translateY).toBeGreaterThan(19);
                    });
                });
                it("can be set", function() {
                    test.translate_composer.translateY = 5;
                    expect(test.y).toBe("5px");
                });
            });
            describe("maxTranslateX", function() {
                it("limits translateX", function() {
                    testPage.dragElementOffsetTo(test.example.element, 500, 0, null, null, function() {
                        runs(function() {
                            expect(test.translate_composer.translateX).not.toBeGreaterThan(350);
                        });
                    });
                });
            });
            describe("maxTranslateY", function() {
                it ("limits translateY", function() {
                    testPage.dragElementOffsetTo(test.example.element, 0, 500, null, null, function() {
                        runs(function() {
                            expect(test.translate_composer.translateY).not.toBeGreaterThan(350);
                        });
                    });
                });
            });

            describe("minTranslateX", function() {
                it ("limits translateX", function() {
                    testPage.dragElementOffsetTo(test.example.element, -500, 0, null, null, function() {
                        expect(test.translate_composer.translateX).not.toBeLessThan(20);
                    });
                });

                it("can be set to null and translateX has no minimum", function() {
                    var old = test.translate_composer.minTranslateX;
                    test.translate_composer.minTranslateX = null;
                    test.translate_composer.translateX = 0;
                    testPage.dragElementOffsetTo(test.example.element, -500, 0, null, null, function() {
                        expect(test.translate_composer.translateX).toBeLessThan(-400);
                        test.translate_composer.minTranslateX = old;
                    });
                });
            });

            describe("minTranslateY", function() {
                it("limits translateY", function() {
                    testPage.dragElementOffsetTo(test.example.element, 0, -500, null, null, function() {
                        expect(test.translate_composer.translateY).not.toBeLessThan(-40);
                    });
                });
            });

            describe("allowFloats", function() {
                it('only allows translate{X|Y} to be ints when false', function() {
                    test.translate_composer.translateX = 100.543;
                    test.translate_composer.translateY = -20.4;
                    expect(test.translate_composer.translateX).toBe(100);
                    expect(test.translate_composer.translateY).toBe(-20);
                });
                it('allows translate{X|Y} to be floats when true', function() {
                    test.translate_composer.allowFloats = true;
                    test.translate_composer.translateX = 100.543;
                    test.translate_composer.translateY = -20.4;
                    expect(test.translate_composer.translateX).toBe(100.543);
                    expect(test.translate_composer.translateY).toBe(-20.4);
                    test.translate_composer.allowFloats = false;
                });
            });

            describe("invertAxis", function() {
                it("causes translation in the opposite direction to pointer movement when true", function() {
                    test.translate_composer.translateX = 0;
                    test.translate_composer.translateY = 0;
                    test.translate_composer.invertAxis = true;

                    testPage.dragElementOffsetTo(test.example.element, -50, -50, null, null, function() {
                        expect(test.translate_composer.translateX).toBeGreaterThan(49);
                        expect(test.translate_composer.translateY).toBeGreaterThan(49);
                        test.translate_composer.invertAxis = false;
                    });
                });
            });

            describe("axis", function() {

                it("limits movement to horizonal when set to 'horizontal'", function() {
                    test.translate_composer.translateX = 0;
                    test.translate_composer.translateY = 0;
                    test.translate_composer.axis = "horizontal";

                    testPage.dragElementOffsetTo(test.example.element, 50, 50, null, null, function() {
                        runs(function() {
                            expect(test.translate_composer.translateX).toBeGreaterThan(49);
                            expect(test.translate_composer.translateY).toBe(-40);
                        });
                    });
                });
                it("limits movement to vertical when set to 'vertical'", function() {
                    test.translate_composer.translateX = 0;
                    test.translate_composer.translateY = 0;
                    test.translate_composer.axis = "vertical";

                    testPage.dragElementOffsetTo(test.example.element, 50, 50, null, null, function() {
                        runs(function() {
                            expect(test.translate_composer.translateX).toBe(20);
                            expect(test.translate_composer.translateY).toBeGreaterThan(9);
                        });
                    });
                });
                it("does not limit movement when set to an unknown value", function() {
                    test.translate_composer.translateX = 0;
                    test.translate_composer.translateY = 0;
                    test.translate_composer.axis = null;

                    testPage.dragElementOffsetTo(test.example.element, 50, 50, null, null, function() {
                        runs(function() {
                            expect(test.translate_composer.translateX).toBeGreaterThan(49);
                            expect(test.translate_composer.translateY).toBeGreaterThan(49);
                        });
                    });
                });
            });
            describe("pointerSpeedMultiplier", function() {
                it ("multiplies the translation values by 3 when set to 3", function() {
                    test.translate_composer.translateX = 0;
                    test.translate_composer.translateY = 0;
                    test.translate_composer.invertAxis = false;
                    test.translate_composer.pointerSpeedMultiplier = 3;

                    testPage.dragElementOffsetTo(test.example.element, 50, 50, null, null, function() {
                        expect(test.translate_composer.translateX).toBeGreaterThan(149);
                        expect(test.translate_composer.translateY).toBeGreaterThan(149);
                        test.translate_composer.pointerSpeedMultiplier = 1;

                    });
                });
            });
            describe("hasMomentum", function() {
                it("keeps translating after mouse is released", function() {
                    test.translate_composer.hasMomentum = true;
                    test.translate_composer.translateX = 0;
                    test.translate_composer.translateY = 0;
                    testPage.dragElementOffsetTo(test.example.element, 50, 50, null, null, function() {
                        waits(100);
                        runs(function(){
                            expect(test.translate_composer.translateX).toBeGreaterThan(55);
                            expect(test.translate_composer.translateY).toBeGreaterThan(55);
                            test.translate_composer.hasMomentum = false;
                        });
                    });
                });
                it("dispatches the translate event", function() {
                    test.translate_composer.hasMomentum = true;
                    test.translate_composer.translateX = 0;
                    test.translate_composer.translateY = 0;

                    var listener = jasmine.createSpy("handleTranslateEvent");
                    test.translate_composer.addEventListener("translate", listener);

                    testPage.dragElementOffsetTo(test.example.element, 50, 50, null, null, function() {
                        waits(100);
                        runs(function(){
                            expect(listener).toHaveBeenCalled();
                            test.translate_composer.hasMomentum = false;
                            test.translate_composer.removeEventListener("translate", listener);
                        });
                    });
                });
                it("keeps translating after mouse is released when inverted", function() {
                    test.translate_composer.hasMomentum = true;
                    test.translate_composer.invertAxis = true;
                    test.translate_composer.translateX = 0;
                    test.translate_composer.translateY = 0;

                    testPage.dragElementOffsetTo(test.example.element, 50, 50, null, null, function() {
                        waits(100);
                        runs(function(){
                            expect(test.translate_composer.translateX).toBeLessThan(45);
                            expect(test.translate_composer.translateY).toBeLessThan(45);
                            test.translate_composer.hasMomentum = false;
                            test.translate_composer.invertAxis = false;
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
                    test.translate_composer.addEventListener("translate", test.handleTranslate, false);

                    testPage.dragElementOffsetTo(test.example.element, 50, 50, null, null, function() {
                        expect(test.handleTranslate).toHaveBeenCalled();
                    });
                });
            });
            describe("nested composer", function() {
                var inner, outer, outerComposer, innerComposer,outerListener,innerListener;
                beforeEach(function () {

                    inner = test.innermover;
                    innerComposer = test.innermover_composer;
                    innerListener = jasmine.createSpy("handleTranslateEvent");
                    innerComposer.addEventListener("translate", innerListener);

                    outer = test.outermover;
                    outerComposer = test.outermover_composer;
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
                    test.translate_composer.addEventListener("translate", test.handleTranslate, false);

                    var eventName = "mousewheel";
                    var deltaPropertyName = "wheelDeltaY";
                    if ("onwheel" in document.createElement("div")) {
                        eventName = "wheel";
                        deltaPropertyName = "deltaY";
                    }

                    var eventInfo = {target: test.example.element};
                    eventInfo[deltaPropertyName] = 6;

                    testPage.wheelEvent(eventInfo, eventName, function() {
                       expect(test.handleTranslate.callCount).toBe(1);

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
        })
       return testPage.loadTest(frameLoaded, touchOptions).then(function(theTestPage) {
           expect(theTestPage.loaded).toBe(true);
       });
    });

    describe("nested composer", function() {
        var test;
        beforeEach(function() {
            test = testPage.test;
        });

        var inner, outer, outerComposer, innerComposer,outerListener,innerListener;
        beforeEach(function () {

            inner = test.innermover;
            innerComposer = test.innermover_composer;
            innerListener = jasmine.createSpy(" innerHandleTranslateEvent");
            innerComposer.addEventListener("translate", innerListener);

            outer = test.outermover;
            outerComposer = test.outermover_composer;
            outerListener = jasmine.createSpy("outerHandleTranslateEvent");
            outerComposer.addEventListener("translate", outerListener);

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
                type: "touch", target: inner.element, identifier: 1,
                steps: [
                    { time: 0, touchstart: null },
                    { time: 1, touchmove: { dx: 25, dy: 0} },
                    { time: 2, touchmove: { dx: 25, dy: 0} },
                    { time: 4,  touchend: null }
                ]}, {
                type: "touch", target: outer.element, identifier: 2,
                steps: [
                    { time: 1, touchstart: null },
                    { time: 2, touchmove: { dx: 0, dy: 25} },
                    { time: 3, touchmove: { dx: 0, dy: 25} },
                    { time: 4, touchend: null }
                ]}];

            testPage.fireEventsOnTimeline(timeline, function(time) {
                if(time === 4) {
                    expect(outerListener).toHaveBeenCalled();
                    expect(innerListener).toHaveBeenCalled();
                }
            });
        });

    });

    it("should unload", function() {
        TestPageLoader.testPage.unloadTest();
        console.groupEnd();
    });

});
