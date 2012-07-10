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
    });
});
