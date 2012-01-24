/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
var Montage = require("montage").Montage,
    TestPageLoader = require("support/testpageloader").TestPageLoader,
    ActionEventListener = require("montage/core/event/action-event-listener").ActionEventListener;

var testPage = TestPageLoader.queueTest("checktest", function() {
    var test = testPage.test;

    var click = function(component, el, fn) {
        el = el || component.element;
        var buttonSpy = {
            doSomething: fn || function(event) {
                return 1+1;
            }
        };
        spyOn(buttonSpy, 'doSomething');

        var actionListener = Montage.create(ActionEventListener).initWithHandler_action_(buttonSpy, "doSomething");
        component.addEventListener("action", actionListener);

        // Faking a click doesn't actually do anything, so we
        // have to set the checkedness, and trigger the change
        // event manually.
        el.checked = !el.checked;
        change(el);

        // Return this so that it can be checked in tha calling function.
        return buttonSpy.doSomething;
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
                        testPage.waitForDraw();
                    });
                    it("unchecks both one way", function() {
                        runs(function() {
                            expect(test.check_bound1.element.checked).toBe(false);
                            expect(test.check_bound2.element.checked).toBe(false);

                            click(test.check_bound2);
                        });
                        testPage.waitForDraw();
                    });
                    it("checks both one way", function() {
                        runs(function() {
                            expect(test.check_bound1.element.checked).toBe(true);
                            expect(test.check_bound2.element.checked).toBe(true);

                            click(test.check_bound1);
                        });
                        testPage.waitForDraw();
                    });
                    it("doesn't bind the other way (unchecked)", function() {
                        runs(function() {
                            expect(test.check_bound1.element.checked).toBe(false);
                            expect(test.check_bound2.element.checked).toBe(true);

                            click(test.check_bound1);
                        });
                        testPage.waitForDraw();
                    });
                    it("doesn't bind the other way (checked)", function() {
                        runs(function() {
                            expect(test.check_bound1.element.checked).toBe(true);
                            expect(test.check_bound2.element.checked).toBe(true);

                            click(test.check_bound2);
                        });
                        testPage.waitForDraw();
                    });
                    it("unchecks both", function() {
                        runs(function() {
                            expect(test.check_bound1.element.checked).toBe(false);
                            expect(test.check_bound2.element.checked).toBe(false);
                        });
                    });
                });
            });

            describe("action event", function() {
                it("should fire when clicked", function() {
                    expect(click(test.check1)).toHaveBeenCalled();
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
