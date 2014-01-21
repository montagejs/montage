var Montage = require("montage").Montage,
    TestPageLoader = require("montage-testing/testpageloader").TestPageLoader,
    PressComposer = require("montage/composer/press-composer").PressComposer;

TestPageLoader.queueTest("press-composer-test/press-composer-test", function(testPage) {
    var test;
    beforeEach(function() {
        test = testPage.test;
    });

    describe("composer/press-composer-spec", function() {
        describe("PressComposer", function(){
            it("should fire pressStart on mousedown/touchstart", function() {
                var listener = testPage.addListener(test.press_composer, null, "pressStart");

                if (window.Touch) {
                    testPage.touchEvent({target: test.example.element}, "touchstart");
                } else {
                    testPage.mouseEvent({target: test.example.element}, "mousedown");
                }

                expect(listener).toHaveBeenCalled();
                expect(test.press_composer.state).toBe(PressComposer.PRESSED);
            });

            it("should fire press on mouseup/touchend", function() {
                var pressListener = testPage.addListener(test.press_composer, null, "press");
                var cancelListener = testPage.addListener(test.press_composer, null, "pressCancel");

                if (window.Touch) {
                    testPage.touchEvent({target: test.example.element}, "touchend");
                } else {
                    testPage.mouseEvent({target: test.example.element}, "mouseup");
                }

                expect(pressListener).toHaveBeenCalled();
                expect(cancelListener).not.toHaveBeenCalled();
                expect(test.press_composer.state).toBe(PressComposer.UNPRESSED);
            });

            // touchend's target is always the same as touch start, so this
            // test doesn't apply
            if (!window.Touch) {
                it("should fire pressCancel when the mouse is released elsewhere", function() {
                    var pressListener = testPage.addListener(test.press_composer, null, "press");
                    var cancelListener = testPage.addListener(test.press_composer, null, "pressCancel");

                    testPage.mouseEvent({target: test.example.element}, "mousedown");
                    testPage.mouseEvent({target: testPage.document}, "mouseup");

                    expect(pressListener).not.toHaveBeenCalled();
                    expect(cancelListener).toHaveBeenCalled();
                    expect(test.press_composer.state).toBe(PressComposer.UNPRESSED);
                });
            }

            it("should fire pressCancel when surrenderPointer is called", function() {
                var pressListener = testPage.addListener(test.press_composer, null, "press");
                var cancelListener = testPage.addListener(test.press_composer, null, "pressCancel");

                if (window.Touch) {
                    testPage.touchEvent({target: test.example.element}, "touchstart");
                } else {
                    testPage.mouseEvent({target: test.example.element}, "mousedown");
                }

                test.press_composer.surrenderPointer(-1, test.example);

                expect(pressListener).not.toHaveBeenCalled();
                expect(cancelListener).toHaveBeenCalled();
                expect(test.press_composer.state).toBe(PressComposer.CANCELLED);

                if (window.Touch) {
                    testPage.touchEvent({target: test.example.element}, "touchend");
                } else {
                    testPage.mouseEvent({target: test.example.element}, "mouseup");
                }

                expect(test.press_composer.state).toBe(PressComposer.UNPRESSED);

            });

            describe("delegate", function() {
                it("surrenderPointer should be called", function() {
                    var pressListener = testPage.addListener(test.press_composer, null, "press");
                    var cancelListener = testPage.addListener(test.press_composer, null, "pressCancel");

                    test.press_composer.delegate = {
                        surrenderPointer: function(pointer, component) {
                            return false;
                        }
                    };
                    spyOn(test.press_composer.delegate, 'surrenderPointer').andCallThrough();


                    if (window.Touch) {
                        testPage.touchEvent({target: test.example.element}, "touchstart");
                    } else {
                        testPage.mouseEvent({target: test.example.element}, "mousedown");
                    }

                    test.press_composer.surrenderPointer(-1, test.example);

                    expect(cancelListener).not.toHaveBeenCalled();
                    expect(test.press_composer.state).toBe(PressComposer.PRESSED);

                    if (window.Touch) {
                        testPage.touchEvent({target: test.example.element}, "touchend");
                    } else {
                        testPage.mouseEvent({target: test.example.element}, "mouseup");
                    }

                    expect(pressListener).toHaveBeenCalled();
                    expect(test.press_composer.state).toBe(PressComposer.UNPRESSED);
                });
            });

            describe("cancelPress", function() {
                it("cancels the active press and returns true", function() {
                    var pressListener = testPage.addListener(test.press_composer, null, "press");
                    var cancelListener = testPage.addListener(test.press_composer, null, "pressCancel");

                    if (window.Touch) {
                        testPage.touchEvent({target: test.example.element}, "touchstart");
                    } else {
                        testPage.mouseEvent({target: test.example.element}, "mousedown");
                    }

                    expect(test.press_composer.cancelPress()).toBe(true);

                    expect(pressListener).not.toHaveBeenCalled();
                    expect(cancelListener).toHaveBeenCalled();
                    expect(test.press_composer.state).toBe(PressComposer.UNPRESSED);
                });

                it("returns false if there is no active press", function() {
                    var cancelListener = testPage.addListener(test.press_composer, null, "pressCancel");

                    expect(test.press_composer.cancelPress()).toBe(false);

                    expect(cancelListener).not.toHaveBeenCalled();
                    expect(test.press_composer.state).toBe(PressComposer.UNPRESSED);
                });
            });

            describe("longPress", function() {
                it("is fired after longPressThreshold", function() {
                    var listener = testPage.addListener(test.press_composer, null, "longPress");

                    if (window.Touch) {
                        testPage.touchEvent({target: test.example.element}, "touchstart");
                    } else {
                        testPage.mouseEvent({target: test.example.element}, "mousedown");
                    }

                    waits(test.press_composer.longPressThreshold);
                    runs(function() {
                        expect(listener).toHaveBeenCalled();

                        if (window.Touch) {
                            testPage.touchEvent({target: test.example.element}, "touchend");
                        } else {
                            testPage.mouseEvent({target: test.example.element}, "mouseup");
                        }
                    });
                });

                it("isn't fired if the press is released before the timeout", function() {
                    var longListener = testPage.addListener(test.press_composer, null, "longPress");

                    if (window.Touch) {
                        testPage.touchEvent({target: test.example.element}, "touchstart");
                    } else {
                        testPage.mouseEvent({target: test.example.element}, "mousedown");
                    }

                    waits(test.press_composer.longPressThreshold - 100);
                    runs(function() {
                        expect(longListener).not.toHaveBeenCalled();

                        if (window.Touch) {
                            testPage.touchEvent({target: test.example.element}, "touchend");
                        } else {
                            testPage.mouseEvent({target: test.example.element}, "mouseup");
                        }
                    });
                });

                describe("longPressThreshold", function() {
                    it("can be changed", function() {
                        var listener = testPage.addListener(test.press_composer, null, "longPress");
                        var timeout = test.press_composer.longPressThreshold - 500;
                        test.press_composer.longPressThreshold = timeout;

                        if (window.Touch) {
                            testPage.touchEvent({target: test.example.element}, "touchstart");
                        } else {
                            testPage.mouseEvent({target: test.example.element}, "mousedown");
                        }

                        waits(timeout);
                        runs(function() {
                            expect(listener).toHaveBeenCalled();
                            if (window.Touch) {
                                testPage.touchEvent({target: test.example.element}, "touchend");
                            } else {
                                testPage.mouseEvent({target: test.example.element}, "mouseup");
                            }
                        });
                    });
                });
            });
        });

        describe("Nested PressComposers", function() {
            beforeEach(function() {
                test.outer_press_composer._endInteraction();
                test.inner_press_composer._endInteraction();
            });

            it("should fire pressStart for both composers", function() {
                var inner_listener = testPage.addListener(test.inner_press_composer, null, "pressStart"),
                    outer_listener = testPage.addListener(test.outer_press_composer, null, "pressStart");

                if (window.Touch) {
                    testPage.touchEvent({target: test.innerComponent.element}, "touchstart");
                    testPage.touchEvent({target: test.innerComponent.element}, "touchend");
                } else {
                    testPage.mouseEvent({target: test.innerComponent.element}, "mousedown");
                    testPage.mouseEvent({target: test.innerComponent.element}, "mouseup");
                }

                expect(inner_listener).toHaveBeenCalled();
                expect(outer_listener).toHaveBeenCalled();
            });

            it("should fire press for inner composer", function() {
                var inner_listener = testPage.addListener(test.inner_press_composer, null, "press"),
                    outer_listener = testPage.addListener(test.outer_press_composer, null, "press");

                if (window.Touch) {
                    testPage.touchEvent({target: test.innerComponent.element}, "touchstart");
                    testPage.touchEvent({target: test.innerComponent.element}, "touchend");
                } else {
                    testPage.mouseEvent({target: test.innerComponent.element}, "mousedown");
                    testPage.mouseEvent({target: test.innerComponent.element}, "mouseup");
                }

                expect(inner_listener).toHaveBeenCalled();
                expect(outer_listener).not.toHaveBeenCalled();
            });

            it("should fire pressCancel for outer composer", function() {
                var inner_listener = testPage.addListener(test.inner_press_composer, null, "pressCancel"),
                    outer_listener = testPage.addListener(test.outer_press_composer, null, "pressCancel");

                if (window.Touch) {
                    testPage.touchEvent({target: test.innerComponent.element}, "touchstart");
                    testPage.touchEvent({target: test.innerComponent.element}, "touchend");
                } else {
                    testPage.mouseEvent({target: test.innerComponent.element}, "mousedown");
                    testPage.mouseEvent({target: test.innerComponent.element}, "mouseup");
                }

                expect(outer_listener).toHaveBeenCalled();
                expect(inner_listener).not.toHaveBeenCalled();
            });

            // touchend's target is always the same as touch start, so this
            // test doesn't apply
            if (!window.Touch) {
                describe("outer_listener", function () {
                    var _endInteractionSpy;
                    beforeEach(function () {
                        _endInteractionSpy = spyOn(test.outer_press_composer, "_endInteraction")
                    });
                    it("should _endInteraction when the mouse is released elsewhere", function() {
                        testPage.mouseEvent({target: test.innerComponent.element}, "mousedown");
                        testPage.mouseEvent({target: testPage.document}, "mouseup");
                        expect(_endInteractionSpy).toHaveBeenCalled();
                     });
                    it("should _endInteraction when the mouse is released within the element but unclaimed", function() {
                        testPage.mouseEvent({target: test.innerComponent.element}, "mousedown");
                        testPage.mouseEvent({target: test.inner2Component.element}, "mouseup");
                        expect(_endInteractionSpy).toHaveBeenCalled();
                     });
                });
            }
        });
    });
});
