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
    TestPageLoader = require("support/testpageloader").TestPageLoader,
    ActionEventListener = require("montage/core/event/action-event-listener").ActionEventListener;

var testPage = TestPageLoader.queueTest("checktest", function() {
    var test = testPage.test;

    var click = function(component, el, fn) {
        el = el || component.element;

        var listener = testPage.addListener(component, fn);
        testPage.clickOrTouch({target: el});
        // Return this so that it can be checked in tha calling function.
        return listener;
    };
    var change = function(el) {
        var changeEvent = document.createEvent("HTMLEvents");
        changeEvent.initEvent("change", true, true);
        el.dispatchEvent(changeEvent);
        return changeEvent;
    };

    describe("ui/check-spec", function() {
        it("should load", function() {
            expect(testPage.loaded).toBe(true);
        });

        describe("checkbox", function(){
            describe("checked property", function() {
                it("is false if there is no `checked` attribute", function() {
                    expect(test.check1.checked).toBe(false);
                });
                it("is true if the `checked` attribute is set", function() {
                    expect(test.check2.checked).toBe(true);
                });

                it("can be set to false from the serialization", function() {
                    expect(test.check_szn1.checked).toBe(false);
                });
                it("can be set to true from the serialization", function() {
                    expect(test.check_szn2.checked).toBe(true);
                });

                it("can be set to true and checks the checkbox", function() {
                    runs(function() {
                        test.check1.checked = true;
                        expect(test.check1.checked).toBe(true);
                    });

                    testPage.waitForDraw();

                    runs(function(){
                        expect(test.check1.element.checked).toBe(true);
                    });

                });
                it("can be set to false and unchecks the checkbox", function() {
                    runs(function() {
                        test.check2.checked = false;
                        expect(test.check2.checked).toBe(false);
                    });

                    testPage.waitForDraw();

                    runs(function(){
                        expect(test.check2.element.checked).toBe(false);
                    });
                });

                describe("one-way binding", function() {
                    it("starts checked", function() {
                        runs(function() {
                            expect(test.check_bound1.element.checked).toBe(true);
                            expect(test.check_bound2.element.checked).toBe(true);

                            click(test.check_bound2);
                     });
                    });
                    it("unchecks both one way", function() {
                        testPage.waitForDraw();
                        runs(function() {
                            expect(test.check_bound1.element.checked).toBe(false);
                            expect(test.check_bound2.element.checked).toBe(false);

                            click(test.check_bound2);
                        });
                    });
                    it("checks both one way", function() {
                        testPage.waitForDraw();
                        runs(function() {
                            expect(test.check_bound1.element.checked).toBe(true);
                            expect(test.check_bound2.element.checked).toBe(true);

                            click(test.check_bound1);
                        });
                    });
                    it("doesn't bind the other way (unchecked)", function() {
                        testPage.waitForDraw();
                        runs(function() {
                            expect(test.check_bound1.element.checked).toBe(false);
                            expect(test.check_bound2.element.checked).toBe(true);

                            click(test.check_bound1);
                        });
                    });
                    it("doesn't bind the other way (checked)", function() {
                        testPage.waitForDraw();
                        runs(function() {
                            expect(test.check_bound1.element.checked).toBe(true);
                            expect(test.check_bound2.element.checked).toBe(true);

                            click(test.check_bound2);
                        });
                    });
                    it("unchecks both", function() {
                        testPage.waitForDraw();
                        runs(function() {
                            expect(test.check_bound1.element.checked).toBe(false);
                            expect(test.check_bound2.element.checked).toBe(false);
                        });
                    });
                });
            });

            it("checks when the label is clicked", function() {
                expect(test.check1.checked).toBe(true);


                var listener = testPage.addListener(test.check1);
                testPage.mouseEvent({target: testPage.getElementById("label")}, "click");;
                expect(listener).toHaveBeenCalled();
                expect(test.check1.checked).toBe(false);
            })

            describe("action event", function() {
                it("should fire when clicked", function() {
                    expect(click(test.check1)).toHaveBeenCalled();
                });
            });

            describe("inside a scroll view", function() {
                it("fires an action event when clicked", function() {
                    expect(test.scroll_check.checked).toBe(false);

                    expect(click(test.scroll_check)).toHaveBeenCalled();
                    expect(test.scroll_check.checked).toBe(true);
                });
                it("checks when the label is clicked", function() {
                    expect(test.scroll_check.checked).toBe(true);


                    var listener = testPage.addListener(test.scroll_check);
                    testPage.mouseEvent({target: testPage.getElementById("scroll_label")}, "click");;
                    expect(listener).toHaveBeenCalled();
                    expect(test.scroll_check.checked).toBe(false);
                })
                it("doesn't fire an action event when scroller is dragged", function() {
                    var el = test.scroll_check.element;
                    var scroll_el = test.scroll.element;

                    var listener = testPage.addListener(test.scroll_check);

                    var press_composer = test.scroll_check.composerList[0];

                    // mousedown
                    testPage.mouseEvent({target: el}, "mousedown");

                    expect(test.scroll_check.checked).toBe(false);
                    expect(test.scroll_check.eventManager.isPointerClaimedByComponent(press_composer._observedPointer, press_composer)).toBe(true);

                    // Mouse move doesn't happen instantly
                    waits(10);
                    runs(function() {
                        // mouse move up
                        var moveEvent = document.createEvent("MouseEvent");
                        // Dispatch to scroll view, but use the coordinates from the
                        // button
                        moveEvent.initMouseEvent("mousemove", true, true, scroll_el.view, null,
                                el.offsetLeft, el.offsetTop - 100,
                                el.offsetLeft, el.offsetTop - 100,
                                false, false, false, false,
                                0, null);
                        scroll_el.dispatchEvent(moveEvent);

                        expect(test.scroll_check.checked).toBe(false);
                        expect(test.scroll_check.eventManager.isPointerClaimedByComponent(press_composer._observedPointer, press_composer)).toBe(false);

                        // mouse up
                        testPage.mouseEvent({target: el}, "mouseup");;
                        testPage.mouseEvent({target: el}, "click");;

                        expect(listener).not.toHaveBeenCalled();
                        expect(test.scroll_check.checked).toBe(false);
                    });

                });
            });

        });

        // The radio button uses the check-input class, which is pretty much
        // fully tested above. So fewer tests here.
        describe("radio button", function() {
            describe("checked property", function() {
                it("changes when the radio button is clicked", function() {
                    runs(function() {
                        expect(test.radio1.checked).toBe(false);

                        click(test.radio1);

                        expect(test.radio1.checked).toBe(true);
                    });
                });
            });
            describe("action event", function() {
                it("should fire when clicked", function() {
                    expect(click(test.radio2)).toHaveBeenCalled();
                });
                it("should not fire when another radio button in the same group is clicked", function() {
                    click(test.radio2);

                    var buttonSpy = {
                        doSomething: function(event) {
                            return 1+1;
                        }
                    };
                    spyOn(buttonSpy, 'doSomething');

                    var actionListener = Montage.create(ActionEventListener).initWithHandler_action_(buttonSpy, "doSomething");
                    test.radio1.addEventListener("action", actionListener);

                    click(test.radio3);
                    expect(buttonSpy.doSomething).not.toHaveBeenCalled();
                });
            });
        });
    });
});
