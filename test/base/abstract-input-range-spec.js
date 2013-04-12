/*global describe, it, expect */
var Montage = require("montage").Montage;
var AbstractInputRange = require("montage/ui/base/abstract-input-range").AbstractInputRange;
var MockDOM = require("mocks/dom");

AbstractInputRange.hasTemplate = false;

describe("test/base/abstract-input-range-spec", function () {
    describe("creation", function () {
        it("cannot be instantiated directly", function () {
            expect(function () {
                AbstractInputRange.create();
            }).toThrow();
        });
        it("can be instantiated as a subtype", function () {
            var InputRangeSubtype = Montage.create(AbstractInputRange, {});
            var anInputRangeSubtype = null;
            expect(function () {
                anInputRangeSubtype = InputRangeSubtype.create();
            }).not.toThrow();
            expect(anInputRangeSubtype).toBeDefined();
        });
    });
    describe("properties", function () {
        var InputRange = Montage.create(AbstractInputRange, {}),
            anInputRange;
        beforeEach(function () {
            anInputRange = InputRange.create();
            anInputRange.element = MockDOM.element();
        });
        it("should maintain disabled as the opposite of enabled", function () {
            anInputRange.enabled = true;
            expect(anInputRange.disabled).toBeFalsy();
            anInputRange.disabled = true;
            expect(anInputRange.enabled).toBeFalsy();
        });

        // Inspired by
        // http://www.w3.org/html/wg/drafts/html/master/forms.html#range-state-(type=range)

        describe("value", function() {
            it("should have correct default", function() {
                // is the minimum plus half the difference between the minimum and the maximum
                expect(anInputRange.value).toEqual(50);
            });
            it("should have correct default for non integer min value", function() {
                anInputRange.min = 60.2;
                expect(anInputRange.value).toEqual(anInputRange.min);
            });
            it("can be set", function() {
                anInputRange.value = 5;
                expect(anInputRange.value).toEqual(5);
            });
            it("can be negative", function() {
                anInputRange.min = -10;
                anInputRange.value = -2;
                expect(anInputRange.value).toEqual(-2);
            });
            it("can be set with a string", function() {
                anInputRange.value = "5";
                expect(anInputRange.value).toEqual(5);
            });
            it("can't be set with letters", function() {
                var previousValue = anInputRange.value;
                anInputRange.value = "hello";
                expect(anInputRange.value).not.toEqual("hello");
                expect(anInputRange.value).toEqual(previousValue);
            });
            describe("behavior", function() {
                it("value should take min into account", function() {
                    anInputRange.min = 10;
                    anInputRange.value = 0;
                    expect(anInputRange.value).toEqual(10);
                });
                it("value should take max into account", function() {
                    anInputRange.max = 20;
                    anInputRange.value = 25;
                    expect(anInputRange.value).toEqual(20);
                });
           });
        });
        describe("step", function() {
            it("should have correct default", function() {
                expect(anInputRange.step).toEqual("any");
            });
            it("can be set", function() {
                anInputRange.step = 2;
                expect(anInputRange.step).toEqual(2);
            });
            it("cannot be negative", function() {
                var previousValue = anInputRange.step;
                anInputRange.step = -2;
                expect(anInputRange.step).toEqual(previousValue);
            });
            it("can be set with a string", function() {
                anInputRange.step = "2";
                expect(anInputRange.step).toEqual(2);
            });
            it("can't be set with letters", function() {
                var previousValue = anInputRange.step;
                anInputRange.step = "hello";
                expect(anInputRange.step).not.toEqual("hello");
                expect(anInputRange.step).toEqual(previousValue);
            });
            describe("effect on value", function () {
                it("should be immediate if necessary", function () {
                    anInputRange.value = 2.2;
                    anInputRange.step = 1;
                    expect(anInputRange.value).toEqual(2);
                });
                it("should result in increments from min", function () {
                    anInputRange.min = 1.4;
                    anInputRange.value = 3;
                    anInputRange.step = 2;
                    expect(anInputRange.value).toEqual(3.4);
                });
                it("should resolve two larger value if two values are possible", function () {
                    anInputRange.min = 0;
                    anInputRange.max = 100;
                    anInputRange.value = 50;
                    anInputRange.step = 20;
                    expect(anInputRange.value).toEqual(60);
                });
            });
        });
        describe("min", function() {
            it("should have correct default", function() {
                expect(anInputRange.min).toEqual(0);
            });
            it("can be set", function() {
                anInputRange.min = 2;
                expect(anInputRange.min).toEqual(2);
            });
            it("can be negative", function() {
                anInputRange.min = -2;
                expect(anInputRange.min).toEqual(-2);
            });
            it("can be set with a string", function() {
                anInputRange.min = "2";
                expect(anInputRange.min).toEqual(2);
            });
            it("can't be set with letters", function() {
                var previousValue = anInputRange.min;
                anInputRange.min = "hello";
                expect(anInputRange.min).not.toEqual("hello");
                expect(anInputRange.min).toEqual(previousValue);
            });
            describe("behavior", function() {
                it("value should be unchanged if value already a greater than min", function() {
                    anInputRange.value = 6;
                    anInputRange.min = 2;
                    expect(anInputRange.value).toEqual(6);
                });
                it("value should be changed if value isn't greater than min", function() {
                    anInputRange.value = 1;
                    anInputRange.min = 2;
                    expect(anInputRange.value).toEqual(2);
                });
                it("value should be changed if value isn't greater than min if min is negative", function() {
                    anInputRange.min = -10;
                    anInputRange.value = -3;
                    anInputRange.min = -2;
                    expect(anInputRange.value).toEqual(-2);
                });
            });
        });
        describe("max", function() {
            it("should have correct default", function() {
                expect(anInputRange.max).toEqual(100);
            });
            it("can be set", function() {
                anInputRange.max = 2;
                expect(anInputRange.max).toEqual(2);
            });
            it("can be negative", function() {
                anInputRange.max = -2;
                expect(anInputRange.max).toEqual(-2);
            });
            it("can be set with a string", function() {
                anInputRange.max = "2";
                expect(anInputRange.max).toEqual(2);
            });
            it("can't be set with letters", function() {
                var previousValue = anInputRange.max;
                anInputRange.max = "hello";
                expect(anInputRange.max).not.toEqual("hello");
                expect(anInputRange.max).toEqual(previousValue);
            });
            describe("behavior", function() {
                it("value should be unchanged if value is already less than max", function() {
                    anInputRange.value = 2;
                    anInputRange.max = 6;
                    expect(anInputRange.value).toEqual(2);
                });
                it("value should be changed if value isn't less than max", function() {
                    anInputRange.value = 10;
                    anInputRange.max = 9;
                    expect(anInputRange.value).toEqual(9);
                });
            });
        });
        describe("draw", function () {
            var InputRange = Montage.create(AbstractInputRange, {}),
                anInputRange;
            beforeEach(function () {
                anInputRange = InputRange.create();
                anInputRange.element = MockDOM.element();
            });

            it("should be requested after enabled state is changed", function () {
                anInputRange.enabled = ! anInputRange.enabled;
                expect(anInputRange.needsDraw).toBeTruthy();
            });
            it("should be requested after value is changed", function () {
                anInputRange.value = "random";
                expect(anInputRange.needsDraw).toBeTruthy();
            });
            it("should be requested after min is changed", function () {
                anInputRange.min = true;
                expect(anInputRange.needsDraw).toBeTruthy();
            });
            it("should be requested after max is changed", function () {
                anInputRange.max = true;
                expect(anInputRange.needsDraw).toBeTruthy();
            });
        });
        describe("events", function () {
            var InputRange = Montage.create(AbstractInputRange, {}),
                anInputRange, anElement, listener;
            beforeEach(function () {
                anInputRange = InputRange.create();
                anElement = MockDOM.element();
                anInputRange.element = anElement;
                listener = {
                    handleEvent: function() {}
                }
            });
            it("should listen for translateStart only after prepareForActivationEvents", function() {
                var listeners,
                    em = anInputRange.eventManager;
                anInputRange._handleElement = anElement;

                anInputRange.enterDocument(true);

                listeners = em.registeredEventListenersForEventType_onTarget_("translateStart", anInputRange._translateComposer);
                expect(listeners).toBeNull();

                anInputRange.prepareForActivationEvents();

                listeners = em.registeredEventListenersForEventType_onTarget_("translateStart", anInputRange._translateComposer);
                expect(listeners[anInputRange.uuid].listener).toBe(anInputRange);
            });
            it("should listen for translate only after prepareForActivationEvents", function() {
                var listeners,
                    em = anInputRange.eventManager;
                anInputRange._handleElement = anElement;

                anInputRange.enterDocument(true);

                listeners = em.registeredEventListenersForEventType_onTarget_("translate", anInputRange._translateComposer);
                expect(listeners).toBeNull();

                anInputRange.prepareForActivationEvents();

                listeners = em.registeredEventListenersForEventType_onTarget_("translate", anInputRange._translateComposer);
                expect(listeners[anInputRange.uuid].listener).toBe(anInputRange);
            });
            it("should listen for translateEnd only after prepareForActivationEvents", function() {
                var listeners,
                    em = anInputRange.eventManager;
                anInputRange._handleElement = anElement;

                anInputRange.enterDocument(true);

                listeners = em.registeredEventListenersForEventType_onTarget_("translateEnd", anInputRange._translateComposer);
                expect(listeners).toBeNull();

                anInputRange.prepareForActivationEvents();

                listeners = em.registeredEventListenersForEventType_onTarget_("translateEnd", anInputRange._translateComposer);
                expect(listeners[anInputRange.uuid].listener).toBe(anInputRange);
            });
        });
    });
});


//TestPageLoader.queueTest("InputRange-test", function(testPage) {
//    var test;
//    beforeEach(function() {
//        test = testPage.test;
//    });
//
//    var click = function(component, el, fn) {
//        el = el || component.element;
//
//        var listener = testPage.addListener(component, fn);
//        testPage.clickOrTouch({target: el});
//        // Return this so that it can be checked in tha calling function.
//        return listener;
//    };
//    var testInputRange = function(component, value) {
//        expect(component).toBeDefined();
//        expect(click(component)).toHaveBeenCalled();
//        expect(component.label).toBe(value);
//    };
//
//    describe("test/InputRange/InputRange-spec", function() {
//
//        describe("InputRange", function(){
//
//            it("can be created from a div element", function(){
//                testInputRange(test.divInputRange, "div InputRange");
//            });
//            it("can be created from an input element", function(){
//                testInputRange(test.inputInputRange, "input InputRange");
//            });
//            it("can be created from a InputRange element", function(){
//                testInputRange(test.InputRangeInputRange, "InputRange InputRange");
//            });
//
//            it("fires a 'hold' event when the InputRange is pressed for a long time", function() {
//                var el = test.inputInputRange.element;
//                var holdListener = testPage.addListener(test.inputInputRange, null, "hold");
//                var actionListener = testPage.addListener(test.inputInputRange, null, "action");
//
//                testPage.mouseEvent({target: el}, "mousedown");
//
//                waits(1010);
//                runs(function() {
//                    testPage.mouseEvent({target: el}, "mouseup");
//                    testPage.mouseEvent({target: el}, "click");
//
//                    expect(holdListener).toHaveBeenCalled();
//                    expect(actionListener).not.toHaveBeenCalled();
//                });
//            });
//
//            describe("disabled property", function(){
//                it("is taken from the element's disabled attribute", function() {
//                    expect(test.disabledInputRange.disabled).toBe(true);
//                    expect(click(test.disabledInputRange)).not.toHaveBeenCalled();
//                    expect(test.disabledinput.disabled).toBe(true);
//                    expect(click(test.disabledinput)).not.toHaveBeenCalled();
//                    expect(test.inputInputRange.disabled).toBe(false);
//                });
//                it("can be set", function(){
//                    expect(test.disabledInputRange.disabled).toBe(true);
//                    test.disabledInputRange.disabled = false;
//                    expect(test.disabledInputRange.disabled).toBe(false);
//                    // TODO click the InputRange and check that it wasn't pressed
//
//                    expect(test.disabledinput.disabled).toBe(true);
//                    test.disabledinput.disabled = false;
//                    expect(test.disabledinput.disabled).toBe(false);
//                    // TODO click the InputRange and check that it wasn't pressed
//                });
//                it("can can be set in the serialization", function(){
//                    expect(test.disabledinputszn.disabled).toBe(true);
//                    // TODO check InputRange pressibility
//                });
//                it("is the inverse of the enabled property", function(){
//                    expect(test.enabledinputszn.disabled).toBe(false);
//                    expect(test.enabledinputszn.enabled).toBe(true);
//                    test.enabledinputszn.enabled = false;
//                    expect(test.enabledinputszn.disabled).toBe(true);
//                    expect(test.enabledinputszn.enabled).toBe(false);
//                    // TODO click the InputRange and check that it wasn't pressed
//                });
//            });
//
//            describe("label property", function() {
//                it("is set from the serialization on a InputRange", function() {
//                    expect(test.InputRangelabelszn.label).toBe("pass");
//                    testPage.waitForDraw();
//                    runs(function(){
//                        expect(test.InputRangelabelszn.element.firstChild.data).toBe("pass");
//                    });
//                });
//                it("is set from the serialization on an input", function() {
//                    expect(test.inputlabelszn.label).toBe("pass");
//                    expect(test.inputlabelszn.element.value).toBe("pass");
//                });
//                it("sets the value on an input", function() {
//                    expect(test.inputInputRange.label).toBe("input InputRange");
//                    test.inputInputRange.label = "label pass";
//                    expect(test.inputInputRange.label).toBe("label pass");
//                    expect(test.inputInputRange.value).toBe("label pass");
//                    test.inputInputRange.label = "input InputRange";
//                });
//                it("sets the first child on a non-input element", function() {
//                    expect(test.InputRangeInputRange.label).toBe("InputRange InputRange");
//                    test.InputRangeInputRange.label = "label pass";
//                    expect(test.InputRangeInputRange.label).toBe("label pass");
//
//                    testPage.waitForDraw();
//                    runs(function(){
//                        expect(test.InputRangeInputRange.element.firstChild.data).toBe("label pass");
//                        test.InputRangeInputRange.label = "InputRange InputRange";
//                    });
//                });
//            });
//
//            describe("value property", function() {
//                it("is set from the value on an input", function() {
//                    expect(test.inputInputRange.element.value).toBe("input InputRange");
//                    expect(test.inputInputRange.value).toBe("input InputRange");
//                });
//                it("is set by the label property in the serialization", function() {
//                    expect(test.inputlabelszn.label).toBe("pass");
//                    //expect(test.inputlabelszn.value).toBe("pass");
//                });
//                it("sets the label property when using an input element", function() {
//                    expect(test.inputInputRange.label).toBe("input InputRange");
//                    test.inputInputRange.value = "value pass";
//                    expect(test.inputInputRange.value).toBe("value pass");
//                    expect(test.inputInputRange.label).toBe("value pass");
//                    test.inputInputRange.value = "input InputRange";
//                });
//                it("doesn't set the label property when using a non-input element", function() {
//                    expect(test.InputRangeInputRange.label).toBe("InputRange InputRange");
//                    test.InputRangeInputRange.value = "value fail";
//                    expect(test.InputRangeInputRange.label).toBe("InputRange InputRange");
//                    testPage.waitForDraw();
//                    runs(function(){
//                        expect(test.InputRangeInputRange.element.firstChild.data).toBe("InputRange InputRange");
//                        test.InputRangeInputRange.value = "InputRange InputRange";
//                    });
//                });
//
//            });
//
//
//            describe("action event detail property", function() {
//                var detailInputRange, testHandler;
//                beforeEach(function() {
//                    detailInputRange = test.detailInputRange;
//                    testHandler = {
//                        handler: function(event) {
//                            testHandler.event = event;
//                        },
//                        event: null,
//                        valueToBeBound: "aValue"
//                    };
//                });
//                it("is undefined if not used", function() {
//                    spyOn(testHandler, 'handler').andCallThrough();
//                    detailInputRange.addEventListener("action", testHandler.handler, false);
//
//                    testPage.clickOrTouch({target: detailInputRange.element});
//                    expect(testHandler.handler).toHaveBeenCalled();
//                    expect(testHandler.event.detail).toBeNull();
//                });
//                it("is is populated if used in a binding", function() {
//                    spyOn(testHandler, 'handler').andCallThrough();
//                    detailInputRange.addEventListener("action", testHandler.handler, false);
//                    Bindings.defineBinding(detailInputRange, "detail.get('prop')", {
//                        "<->": "valueToBeBound",
//                        "source": testHandler
//                    });
//
//                    testPage.clickOrTouch({target: detailInputRange.element});
//                    expect(testHandler.handler).toHaveBeenCalled();
//                    expect(testHandler.event.detail.get("prop")).toEqual(testHandler.valueToBeBound);
//                    //cleanup
//                    Bindings.cancelBindings(detailInputRange);
//                });
//                it("is is populated if used programatically", function() {
//                    spyOn(testHandler, 'handler').andCallThrough();
//                    detailInputRange.addEventListener("action", testHandler.handler, false);
//                    detailInputRange.detail.set("prop2", "anotherValue");
//
//                    testPage.clickOrTouch({target: detailInputRange.element});
//                    expect(testHandler.handler).toHaveBeenCalled();
//                    expect(testHandler.event.detail.get("prop2")).toEqual("anotherValue");
//                });
//            });
//
//
//            it("responds when child elements are clicked on", function(){
//                expect(click(test.InputRangenested, test.InputRangenested.element.firstChild)).toHaveBeenCalled();
//            });
//
//            it("supports converters for label", function(){
//                test.converterInputRange.label = "pass";
//                expect(test.converterInputRange.label).toBe("PASS");
//                testPage.waitForDraw();
//                runs(function(){
//                    expect(test.converterInputRange.element.value).toBe("PASS");
//                });
//            });
//
//            // TODO should be transplanted to the press-composer-spec
//            // it("correctly releases the pointer", function() {
//            //     var l = testPage.addListener(test.scroll_InputRange);
//
//            //     testpage.mouseEvent({target: test.scroll_InputRange.element}, "mousedown");;
//            //     expect(test.scroll_InputRange.active).toBe(true);
//            //     test.scroll_InputRange.surrenderPointer(test.scroll_InputRange._observedPointer, null);
//            //     expect(test.scroll_InputRange.active).toBe(false);
//            //     testPage.mouseEvent({target: test.scroll_InputRange.element}, "mouseup");;
//
//            //     expect(l).not.toHaveBeenCalled();
//
//            // });
//
//            if (window.Touch) {
//
//                describe("when supporting touch events", function() {
//
//                    it("should dispatch an action event when a touchend follows a touchstart on a InputRange", function() {
//
//                    });
//
//                });
//
//            } else {
//
//                describe("when supporting mouse events", function() {
//                    it("dispatches an action event when a mouseup follows a mousedown", function() {
//                        expect(click(test.inputInputRange)).toHaveBeenCalled();
//                    });
//
//                    it("does not dispatch an action event when a mouseup occurs after not previously receiving a mousedown", function() {
//                        // reset interaction
//                        // test.inputInputRange._endInteraction();
//                        var l = testPage.addListener(test.inputInputRange);
//                        testPage.mouseEvent({target: test.inputInputRange.element}, "mouseup");;
//                        expect(l).not.toHaveBeenCalled();
//                    });
//
//                    it("does not dispatch an action event when a mouseup occurs away from the InputRange after a mousedown on a InputRange", function() {
//                        var l = testPage.addListener(test.inputInputRange);
//
//                        testpage.mouseEvent({target: test.inputInputRange.element}, "mousedown");;
//                        // Mouse up somewhere else
//                        testPage.mouseEvent({target: test.divInputRange.element}, "mouseup");;
//
//                        expect(l).not.toHaveBeenCalled();
//                    });
//                });
//            }
//
//            var testInputRange = function(component, value) {
//                expect(component).toBeDefined();
//                expect(click(component)).toHaveBeenCalled();
//                expect(component.label).toBe(value);
//            };
//
//            describe("inside a scroll view", function() {
//                it("fires an action event when clicked", function() {
//                    testInputRange(test.scroll_InputRange, "scroll InputRange");
//                });
//                it("doesn't fire an action event when scroller is dragged", function() {
//                    var el = test.scroll_InputRange.element;
//                    var scroll_el = test.scroll.element;
//
//                    var listener = testPage.addListener(test.scroll_InputRange);
//
//                    var press_composer = test.scroll_InputRange.composerList[0];
//
//                    // mousedown
//                    testPage.mouseEvent({target: el}, "mousedown");
//
//                    expect(test.scroll_InputRange.active).toBe(true);
//                    expect(test.scroll_InputRange.eventManager.isPointerClaimedByComponent(press_composer._observedPointer, press_composer)).toBe(true);
//
//                    // Mouse move doesn't happen instantly
//                    waits(10);
//                    runs(function() {
//                        // mouse move up
//                        var moveEvent = document.createEvent("MouseEvent");
//                        // Dispatch to scroll view, but use the coordinates from the
//                        // InputRange
//                        moveEvent.initMouseEvent("mousemove", true, true, scroll_el.view, null,
//                                el.offsetLeft, el.offsetTop - 100,
//                                el.offsetLeft, el.offsetTop - 100,
//                                false, false, false, false,
//                                0, null);
//                        scroll_el.dispatchEvent(moveEvent);
//
//                        expect(test.scroll_InputRange.active).toBe(false);
//                        expect(test.scroll_InputRange.eventManager.isPointerClaimedByComponent(press_composer._observedPointer, press_composer)).toBe(false);
//
//                        // mouse up
//                        testPage.mouseEvent({target: el}, "mouseup");;
//
//                        expect(listener).not.toHaveBeenCalled();
//                    });
//
//                });
//            });
//
//        });
//    });
//});
