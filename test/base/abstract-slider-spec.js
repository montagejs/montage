/*global describe, it, expect */
var Montage = require("montage").Montage;
var AbstractSlider = require("montage/ui/base/abstract-slider").AbstractSlider;
var MockDOM = require("mocks/dom");

AbstractSlider.hasTemplate = false;

describe("test/base/abstract-slider-spec", function () {
    describe("creation", function () {
        it("cannot be instantiated directly", function () {
            expect(function () {
                AbstractSlider.create();
            }).toThrow();
        });
        it("can be instantiated as a subtype", function () {
            var SliderSubtype = Montage.create(AbstractSlider, {});
            var aSliderSubtype = null;
            expect(function () {
                aSliderSubtype = SliderSubtype.create();
            }).not.toThrow();
            expect(aSliderSubtype).toBeDefined();
        });
    });
    describe("properties", function () {
        var Slider = Montage.create(AbstractSlider, {}),
            aSlider;
        beforeEach(function () {
            aSlider = Slider.create();
            aSlider.element = MockDOM.element();
        });
        it("should maintain disabled as the opposite of enabled", function () {
            aSlider.enabled = true;
            expect(aSlider.disabled).toBeFalsy();
            aSlider.disabled = true;
            expect(aSlider.enabled).toBeFalsy();
        });

        // Inspired by
        // http://www.w3.org/html/wg/drafts/html/master/forms.html#range-state-(type=range)

        describe("value", function() {
            it("should have correct default", function() {
                // is the minimum plus half the difference between the minimum and the maximum
                expect(aSlider.value).toEqual(50);
            });
            it("should have correct default for non integer min value", function() {
                aSlider.min = 60.2;
                expect(aSlider.value).toEqual(aSlider.min);
            });
            it("can be set", function() {
                aSlider.value = 5;
                expect(aSlider.value).toEqual(5);
            });
            it("can be negative", function() {
                aSlider.min = -10;
                aSlider.value = -2;
                expect(aSlider.value).toEqual(-2);
            });
            it("can be set with a string", function() {
                aSlider.value = "5";
                expect(aSlider.value).toEqual(5);
            });
            it("can't be set with letters", function() {
                var previousValue = aSlider.value;
                aSlider.value = "hello";
                expect(aSlider.value).not.toEqual("hello");
                expect(aSlider.value).toEqual(previousValue);
            });
            describe("behavior", function() {
                it("value should take min into account", function() {
                    aSlider.min = 10;
                    aSlider.value = 0;
                    expect(aSlider.value).toEqual(10);
                });
                it("value should take max into account", function() {
                    aSlider.max = 20;
                    aSlider.value = 25;
                    expect(aSlider.value).toEqual(20);
                });
            });
        });
        describe("step", function() {
            it("should have correct default", function() {
                expect(aSlider.step).toEqual("any");
            });
            it("can be set", function() {
                aSlider.step = 2;
                expect(aSlider.step).toEqual(2);
            });
            it("cannot be negative", function() {
                var previousValue = aSlider.step;
                aSlider.step = -2;
                expect(aSlider.step).toEqual(previousValue);
            });
            it("can be set with a string", function() {
                aSlider.step = "2";
                expect(aSlider.step).toEqual(2);
            });
            it("can't be set with letters", function() {
                var previousValue = aSlider.step;
                aSlider.step = "hello";
                expect(aSlider.step).not.toEqual("hello");
                expect(aSlider.step).toEqual(previousValue);
            });
            describe("effect on value", function () {
                it("should be immediate if necessary", function () {
                    aSlider.value = 2.2;
                    aSlider.step = 1;
                    expect(aSlider.value).toEqual(2);
                });
                it("should result in increments from min", function () {
                    aSlider.min = 1.4;
                    aSlider.value = 3;
                    aSlider.step = 2;
                    expect(aSlider.value).toEqual(3.4);
                });
                it("should resolve two larger value if two values are possible", function () {
                    aSlider.min = 0;
                    aSlider.max = 100;
                    aSlider.value = 50;
                    aSlider.step = 20;
                    expect(aSlider.value).toEqual(60);
                });
            });
        });
        describe("min", function() {
            it("should have correct default", function() {
                expect(aSlider.min).toEqual(0);
            });
            it("can be set", function() {
                aSlider.min = 2;
                expect(aSlider.min).toEqual(2);
            });
            it("can be negative", function() {
                aSlider.min = -2;
                expect(aSlider.min).toEqual(-2);
            });
            it("can be set with a string", function() {
                aSlider.min = "2";
                expect(aSlider.min).toEqual(2);
            });
            it("can't be set with letters", function() {
                var previousValue = aSlider.min;
                aSlider.min = "hello";
                expect(aSlider.min).not.toEqual("hello");
                expect(aSlider.min).toEqual(previousValue);
            });
            describe("behavior", function() {
                it("value should be unchanged if value already a greater than min", function() {
                    aSlider.value = 6;
                    aSlider.min = 2;
                    expect(aSlider.value).toEqual(6);
                });
                it("value should be changed if value isn't greater than min", function() {
                    aSlider.value = 1;
                    aSlider.min = 2;
                    expect(aSlider.value).toEqual(2);
                });
                it("value should be changed if value isn't greater than min if min is negative", function() {
                    aSlider.min = -10;
                    aSlider.value = -3;
                    aSlider.min = -2;
                    expect(aSlider.value).toEqual(-2);
                });
            });
        });
        describe("max", function() {
            it("should have correct default", function() {
                expect(aSlider.max).toEqual(100);
            });
            it("can be set", function() {
                aSlider.max = 2;
                expect(aSlider.max).toEqual(2);
            });
            it("can be negative", function() {
                aSlider.max = -2;
                expect(aSlider.max).toEqual(-2);
            });
            it("can be set with a string", function() {
                aSlider.max = "2";
                expect(aSlider.max).toEqual(2);
            });
            it("can't be set with letters", function() {
                var previousValue = aSlider.max;
                aSlider.max = "hello";
                expect(aSlider.max).not.toEqual("hello");
                expect(aSlider.max).toEqual(previousValue);
            });
            describe("behavior", function() {
                it("value should be unchanged if value is already less than max", function() {
                    aSlider.value = 2;
                    aSlider.max = 6;
                    expect(aSlider.value).toEqual(2);
                });
                it("value should be changed if value isn't less than max", function() {
                    aSlider.value = 10;
                    aSlider.max = 9;
                    expect(aSlider.value).toEqual(9);
                });
            });
        });
        describe("after enterDocument", function () {
            var Slider = Montage.create(AbstractSlider, {}),
                aSlider, anElement;
            beforeEach(function () {
                aSlider = Slider.create();
                anElement = MockDOM.element();
                aSlider.element = anElement;
            });
            describe("it should continue to work", function () {
                beforeEach(function () {
                    aSlider.enterDocument(true);
                });
                it("should allow value to change", function () {
                    expect(function() {
                        aSlider.value = 30;
                    }).not.toThrow();
                    expect(aSlider.value).toEqual(30);
                });
            });
            describe("it should correctly initialize defaults from the placeholder element", function () {
                describe("when the properties are not set", function () {
                    beforeEach(function () {
                        anElement.setAttribute("value", 80);
                        anElement.setAttribute("min", -100);
                        anElement.setAttribute("max", 999);
                        anElement.setAttribute("step", 10);
                        aSlider.enterDocument(true);
                    });
                    it("should get the value from the placeholder element", function () {
                        expect(aSlider.value).toEqual(80);
                    });
                    it("should get the min from the placeholder element", function () {
                        expect(aSlider.min).toEqual(-100);
                    });
                    it("should get the max from the placeholder element", function () {
                        expect(aSlider.max).toEqual(999);
                    });
                    it("should get the step from the placeholder element", function () {
                        expect(aSlider.step).toEqual(10);
                    });
                });
                describe("when the properties are set beforehand", function () {
                    beforeEach(function () {
                        anElement.setAttribute("value", 80);
                        anElement.setAttribute("min", -100);
                        anElement.setAttribute("max", 999);
                        anElement.setAttribute("step", 10);
                        aSlider.value = 85;
                        aSlider.min = -105;
                        aSlider.max = 888;
                        aSlider.step = 5;
                        aSlider.enterDocument(true);
                    });
                    it("should not get the value from the placeholder element", function () {
                        expect(aSlider.value).toEqual(85);
                    });
                    it("should not get the min from the placeholder element", function () {
                        expect(aSlider.min).toEqual(-105);
                    });
                    it("should not get the max from the placeholder element", function () {
                        expect(aSlider.max).toEqual(888);
                    });
                    it("should not get the step from the placeholder element", function () {
                        expect(aSlider.step).toEqual(5);
                    });
                    it("should delete _propertyNamesUsed after enterDocument", function () {
                        expect(aSlider._propertyNamesUsed).not.toBeDefined();
                    });
                });
            });

        });
        describe("draw", function () {
            var Slider = Montage.create(AbstractSlider, {}),
                aSlider;
            beforeEach(function () {
                aSlider = Slider.create();
                aSlider.element = MockDOM.element();
            });

            it("should be requested after enabled state is changed", function () {
                aSlider.enabled = ! aSlider.enabled;
                expect(aSlider.needsDraw).toBeTruthy();
            });
            it("should be requested after value is changed", function () {
                aSlider.value = "random";
                expect(aSlider.needsDraw).toBeTruthy();
            });
            it("should be requested after min is changed", function () {
                aSlider.min = true;
                expect(aSlider.needsDraw).toBeTruthy();
            });
            it("should be requested after max is changed", function () {
                aSlider.max = true;
                expect(aSlider.needsDraw).toBeTruthy();
            });
        });
        describe("events", function () {
            var Slider = Montage.create(AbstractSlider, {}),
                aSlider, anElement, listener;
            beforeEach(function () {
                aSlider = Slider.create();
                anElement = MockDOM.element();
                aSlider.element = anElement;
                listener = {
                    handleEvent: function() {}
                };
            });
            it("should listen for translateStart only after prepareForActivationEvents", function() {
                var listeners,
                    em = aSlider.eventManager;

                aSlider._inputRangeThumbSliderElement = anElement;
                aSlider.enterDocument(true);

                listeners = em.registeredEventListenersForEventType_onTarget_("translateStart", aSlider._translateComposer);
                expect(listeners).toBeNull();

                aSlider.prepareForActivationEvents();

                listeners = em.registeredEventListenersForEventType_onTarget_("translateStart", aSlider._translateComposer);
                expect(listeners[aSlider.uuid].listener).toBe(aSlider);
            });
            it("should listen for translate only after prepareForActivationEvents", function() {
                var listeners,
                    em = aSlider.eventManager;
                aSlider._inputRangeThumbSliderElement = anElement;

                aSlider.enterDocument(true);

                listeners = em.registeredEventListenersForEventType_onTarget_("translate", aSlider._translateComposer);
                expect(listeners).toBeNull();

                aSlider.prepareForActivationEvents();

                listeners = em.registeredEventListenersForEventType_onTarget_("translate", aSlider._translateComposer);
                expect(listeners[aSlider.uuid].listener).toBe(aSlider);
            });
            it("should listen for translateEnd only after prepareForActivationEvents", function() {
                var listeners,
                    em = aSlider.eventManager;
                aSlider._inputRangeThumbSliderElement = anElement;

                aSlider.enterDocument(true);

                listeners = em.registeredEventListenersForEventType_onTarget_("translateEnd", aSlider._translateComposer);
                expect(listeners).toBeNull();

                aSlider.prepareForActivationEvents();

                listeners = em.registeredEventListenersForEventType_onTarget_("translateEnd", aSlider._translateComposer);
                expect(listeners[aSlider.uuid].listener).toBe(aSlider);
            });
        });
    });
});


//TestPageLoader.queueTest("Slider-test", function(testPage) {
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
//    var testSlider = function(component, value) {
//        expect(component).toBeDefined();
//        expect(click(component)).toHaveBeenCalled();
//        expect(component.label).toBe(value);
//    };
//
//    describe("test/Slider/Slider-spec", function() {
//
//        describe("Slider", function(){
//
//            it("can be created from a div element", function(){
//                testSlider(test.divSlider, "div Slider");
//            });
//            it("can be created from an input element", function(){
//                testSlider(test.inputSlider, "input Slider");
//            });
//            it("can be created from a Slider element", function(){
//                testSlider(test.SliderSlider, "Slider Slider");
//            });
//
//            it("fires a 'hold' event when the Slider is pressed for a long time", function() {
//                var el = test.inputSlider.element;
//                var holdListener = testPage.addListener(test.inputSlider, null, "hold");
//                var actionListener = testPage.addListener(test.inputSlider, null, "action");
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
//                    expect(test.disabledSlider.disabled).toBe(true);
//                    expect(click(test.disabledSlider)).not.toHaveBeenCalled();
//                    expect(test.disabledinput.disabled).toBe(true);
//                    expect(click(test.disabledinput)).not.toHaveBeenCalled();
//                    expect(test.inputSlider.disabled).toBe(false);
//                });
//                it("can be set", function(){
//                    expect(test.disabledSlider.disabled).toBe(true);
//                    test.disabledSlider.disabled = false;
//                    expect(test.disabledSlider.disabled).toBe(false);
//                    // TODO click the Slider and check that it wasn't pressed
//
//                    expect(test.disabledinput.disabled).toBe(true);
//                    test.disabledinput.disabled = false;
//                    expect(test.disabledinput.disabled).toBe(false);
//                    // TODO click the Slider and check that it wasn't pressed
//                });
//                it("can can be set in the serialization", function(){
//                    expect(test.disabledinputszn.disabled).toBe(true);
//                    // TODO check Slider pressibility
//                });
//                it("is the inverse of the enabled property", function(){
//                    expect(test.enabledinputszn.disabled).toBe(false);
//                    expect(test.enabledinputszn.enabled).toBe(true);
//                    test.enabledinputszn.enabled = false;
//                    expect(test.enabledinputszn.disabled).toBe(true);
//                    expect(test.enabledinputszn.enabled).toBe(false);
//                    // TODO click the Slider and check that it wasn't pressed
//                });
//            });
//
//            describe("label property", function() {
//                it("is set from the serialization on a Slider", function() {
//                    expect(test.Sliderlabelszn.label).toBe("pass");
//                    testPage.waitForDraw();
//                    runs(function(){
//                        expect(test.Sliderlabelszn.element.firstChild.data).toBe("pass");
//                    });
//                });
//                it("is set from the serialization on an input", function() {
//                    expect(test.inputlabelszn.label).toBe("pass");
//                    expect(test.inputlabelszn.element.value).toBe("pass");
//                });
//                it("sets the value on an input", function() {
//                    expect(test.inputSlider.label).toBe("input Slider");
//                    test.inputSlider.label = "label pass";
//                    expect(test.inputSlider.label).toBe("label pass");
//                    expect(test.inputSlider.value).toBe("label pass");
//                    test.inputSlider.label = "input Slider";
//                });
//                it("sets the first child on a non-input element", function() {
//                    expect(test.SliderSlider.label).toBe("Slider Slider");
//                    test.SliderSlider.label = "label pass";
//                    expect(test.SliderSlider.label).toBe("label pass");
//
//                    testPage.waitForDraw();
//                    runs(function(){
//                        expect(test.SliderSlider.element.firstChild.data).toBe("label pass");
//                        test.SliderSlider.label = "Slider Slider";
//                    });
//                });
//            });
//
//            describe("value property", function() {
//                it("is set from the value on an input", function() {
//                    expect(test.inputSlider.element.value).toBe("input Slider");
//                    expect(test.inputSlider.value).toBe("input Slider");
//                });
//                it("is set by the label property in the serialization", function() {
//                    expect(test.inputlabelszn.label).toBe("pass");
//                    //expect(test.inputlabelszn.value).toBe("pass");
//                });
//                it("sets the label property when using an input element", function() {
//                    expect(test.inputSlider.label).toBe("input Slider");
//                    test.inputSlider.value = "value pass";
//                    expect(test.inputSlider.value).toBe("value pass");
//                    expect(test.inputSlider.label).toBe("value pass");
//                    test.inputSlider.value = "input Slider";
//                });
//                it("doesn't set the label property when using a non-input element", function() {
//                    expect(test.SliderSlider.label).toBe("Slider Slider");
//                    test.SliderSlider.value = "value fail";
//                    expect(test.SliderSlider.label).toBe("Slider Slider");
//                    testPage.waitForDraw();
//                    runs(function(){
//                        expect(test.SliderSlider.element.firstChild.data).toBe("Slider Slider");
//                        test.SliderSlider.value = "Slider Slider";
//                    });
//                });
//
//            });
//
//
//            describe("action event detail property", function() {
//                var detailSlider, testHandler;
//                beforeEach(function() {
//                    detailSlider = test.detailSlider;
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
//                    detailSlider.addEventListener("action", testHandler.handler, false);
//
//                    testPage.clickOrTouch({target: detailSlider.element});
//                    expect(testHandler.handler).toHaveBeenCalled();
//                    expect(testHandler.event.detail).toBeNull();
//                });
//                it("is is populated if used in a binding", function() {
//                    spyOn(testHandler, 'handler').andCallThrough();
//                    detailSlider.addEventListener("action", testHandler.handler, false);
//                    Bindings.defineBinding(detailSlider, "detail.get('prop')", {
//                        "<->": "valueToBeBound",
//                        "source": testHandler
//                    });
//
//                    testPage.clickOrTouch({target: detailSlider.element});
//                    expect(testHandler.handler).toHaveBeenCalled();
//                    expect(testHandler.event.detail.get("prop")).toEqual(testHandler.valueToBeBound);
//                    //cleanup
//                    Bindings.cancelBindings(detailSlider);
//                });
//                it("is is populated if used programatically", function() {
//                    spyOn(testHandler, 'handler').andCallThrough();
//                    detailSlider.addEventListener("action", testHandler.handler, false);
//                    detailSlider.detail.set("prop2", "anotherValue");
//
//                    testPage.clickOrTouch({target: detailSlider.element});
//                    expect(testHandler.handler).toHaveBeenCalled();
//                    expect(testHandler.event.detail.get("prop2")).toEqual("anotherValue");
//                });
//            });
//
//
//            it("responds when child elements are clicked on", function(){
//                expect(click(test.Slidernested, test.Slidernested.element.firstChild)).toHaveBeenCalled();
//            });
//
//            it("supports converters for label", function(){
//                test.converterSlider.label = "pass";
//                expect(test.converterSlider.label).toBe("PASS");
//                testPage.waitForDraw();
//                runs(function(){
//                    expect(test.converterSlider.element.value).toBe("PASS");
//                });
//            });
//
//            // TODO should be transplanted to the press-composer-spec
//            // it("correctly releases the pointer", function() {
//            //     var l = testPage.addListener(test.scroll_Slider);
//
//            //     testpage.mouseEvent({target: test.scroll_Slider.element}, "mousedown");;
//            //     expect(test.scroll_Slider.active).toBe(true);
//            //     test.scroll_Slider.surrenderPointer(test.scroll_Slider._observedPointer, null);
//            //     expect(test.scroll_Slider.active).toBe(false);
//            //     testPage.mouseEvent({target: test.scroll_Slider.element}, "mouseup");;
//
//            //     expect(l).not.toHaveBeenCalled();
//
//            // });
//
//            if (window.Touch) {
//
//                describe("when supporting touch events", function() {
//
//                    it("should dispatch an action event when a touchend follows a touchstart on a Slider", function() {
//
//                    });
//
//                });
//
//            } else {
//
//                describe("when supporting mouse events", function() {
//                    it("dispatches an action event when a mouseup follows a mousedown", function() {
//                        expect(click(test.inputSlider)).toHaveBeenCalled();
//                    });
//
//                    it("does not dispatch an action event when a mouseup occurs after not previously receiving a mousedown", function() {
//                        // reset interaction
//                        // test.inputSlider._endInteraction();
//                        var l = testPage.addListener(test.inputSlider);
//                        testPage.mouseEvent({target: test.inputSlider.element}, "mouseup");;
//                        expect(l).not.toHaveBeenCalled();
//                    });
//
//                    it("does not dispatch an action event when a mouseup occurs away from the Slider after a mousedown on a Slider", function() {
//                        var l = testPage.addListener(test.inputSlider);
//
//                        testpage.mouseEvent({target: test.inputSlider.element}, "mousedown");;
//                        // Mouse up somewhere else
//                        testPage.mouseEvent({target: test.divSlider.element}, "mouseup");;
//
//                        expect(l).not.toHaveBeenCalled();
//                    });
//                });
//            }
//
//            var testSlider = function(component, value) {
//                expect(component).toBeDefined();
//                expect(click(component)).toHaveBeenCalled();
//                expect(component.label).toBe(value);
//            };
//
//            describe("inside a scroll view", function() {
//                it("fires an action event when clicked", function() {
//                    testSlider(test.scroll_Slider, "scroll Slider");
//                });
//                it("doesn't fire an action event when scroller is dragged", function() {
//                    var el = test.scroll_Slider.element;
//                    var scroll_el = test.scroll.element;
//
//                    var listener = testPage.addListener(test.scroll_Slider);
//
//                    var press_composer = test.scroll_Slider.composerList[0];
//
//                    // mousedown
//                    testPage.mouseEvent({target: el}, "mousedown");
//
//                    expect(test.scroll_Slider.active).toBe(true);
//                    expect(test.scroll_Slider.eventManager.isPointerClaimedByComponent(press_composer._observedPointer, press_composer)).toBe(true);
//
//                    // Mouse move doesn't happen instantly
//                    waits(10);
//                    runs(function() {
//                        // mouse move up
//                        var moveEvent = document.createEvent("MouseEvent");
//                        // Dispatch to scroll view, but use the coordinates from the
//                        // Slider
//                        moveEvent.initMouseEvent("mousemove", true, true, scroll_el.view, null,
//                                el.offsetLeft, el.offsetTop - 100,
//                                el.offsetLeft, el.offsetTop - 100,
//                                false, false, false, false,
//                                0, null);
//                        scroll_el.dispatchEvent(moveEvent);
//
//                        expect(test.scroll_Slider.active).toBe(false);
//                        expect(test.scroll_Slider.eventManager.isPointerClaimedByComponent(press_composer._observedPointer, press_composer)).toBe(false);
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
