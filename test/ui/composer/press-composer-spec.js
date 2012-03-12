/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
/*global require,exports,describe,it,expect,waits,runs */
var Montage = require("montage").Montage,
    TestPageLoader = require("support/testpageloader").TestPageLoader,
    PressComposer = require("montage/ui/composer/press-composer").PressComposer;

var testPage = TestPageLoader.queueTest("press-composer-test", function() {
    var test = testPage.test;

    describe("ui/composer/press-composer-spec", function() {
        it("should load", function() {
            expect(testPage.loaded).toBe(true);
        });

        describe("PressComposer", function(){
            it("should fire pressstart on mousedown/touchstart", function() {
                var listener = testPage.addListener(test.press_composer, null, "pressstart");

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
                var cancelListener = testPage.addListener(test.press_composer, null, "presscancel");

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
                it("should fire presscancel when the mouse is released elsewhere", function() {
                    var pressListener = testPage.addListener(test.press_composer, null, "press");
                    var cancelListener = testPage.addListener(test.press_composer, null, "presscancel");

                    testPage.mouseEvent({target: test.example.element}, "mousedown");
                    testPage.mouseEvent({target: testPage.document}, "mouseup");

                    expect(pressListener).not.toHaveBeenCalled();
                    expect(cancelListener).toHaveBeenCalled();
                    expect(test.press_composer.state).toBe(PressComposer.UNPRESSED);
                });
            }

            it("should fire presscancel when surrenderPointer is called", function() {
                var pressListener = testPage.addListener(test.press_composer, null, "press");
                var cancelListener = testPage.addListener(test.press_composer, null, "presscancel");

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
                    var cancelListener = testPage.addListener(test.press_composer, null, "presscancel");

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
                    var cancelListener = testPage.addListener(test.press_composer, null, "presscancel");

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
                    var cancelListener = testPage.addListener(test.press_composer, null, "presscancel");

                    expect(test.press_composer.cancelPress()).toBe(false);

                    expect(cancelListener).not.toHaveBeenCalled();
                    expect(test.press_composer.state).toBe(PressComposer.UNPRESSED);
                });
            });

            describe("longpress", function() {
                it("is fired after longpressTimeout", function() {
                    var listener = testPage.addListener(test.press_composer, null, "longpress");

                    if (window.Touch) {
                        testPage.touchEvent({target: test.example.element}, "touchstart");
                    } else {
                        testPage.mouseEvent({target: test.example.element}, "mousedown");
                    }

                    waits(test.press_composer.longpressTimeout);
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
                    var longListener = testPage.addListener(test.press_composer, null, "longpress");

                    if (window.Touch) {
                        testPage.touchEvent({target: test.example.element}, "touchstart");
                    } else {
                        testPage.mouseEvent({target: test.example.element}, "mousedown");
                    }

                    waits(test.press_composer.longpressTimeout - 100);
                    runs(function() {
                        expect(longListener).not.toHaveBeenCalled();

                        if (window.Touch) {
                            testPage.touchEvent({target: test.example.element}, "touchend");
                        } else {
                            testPage.mouseEvent({target: test.example.element}, "mouseup");
                        }
                    });
                });

                describe("longpressTimeout", function() {
                    it("can be changed", function() {
                        var listener = testPage.addListener(test.press_composer, null, "longpress");
                        var timeout = test.press_composer.longpressTimeout - 500;
                        test.press_composer.longpressTimeout = timeout;

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
    });
});