/*global describe, it, expect */
var Montage = require("montage").Montage;
var AbstractSlider = require("montage/ui/base/abstract-slider").AbstractSlider;
var MockDOM = require("mocks/dom");
var MockEvent = require("mocks/event");

AbstractSlider.prototype.hasTemplate = false;

describe("test/base/abstract-slider-spec", function () {
    describe("creation", function () {
        it("cannot be instantiated directly", function () {
            expect(function () {
                new AbstractSlider();
            }).toThrow();
        });
        it("can be instantiated as a subtype", function () {
            var SliderSubtype = AbstractSlider.specialize( {});
            var aSliderSubtype = null;
            expect(function () {
                aSliderSubtype = new SliderSubtype();
            }).not.toThrow();
            expect(aSliderSubtype).toBeDefined();
        });
    });
    describe("properties", function () {
        var Slider = AbstractSlider.specialize( {}),
            aSlider;
        beforeEach(function () {
            aSlider = new Slider();
            aSlider.element = MockDOM.element();
        });

        // Inspired by
        // http://www.w3.org/html/wg/drafts/html/master/forms.html#range-state-(type=range)

        describe("value", function () {
            it("should have correct default", function () {
                // is the minimum plus half the difference between the minimum and the maximum
                expect(aSlider.value).toEqual(50);
            });
            it("should have correct default for non integer min value", function () {
                aSlider.min = 60.2;
                expect(aSlider.value).toEqual(aSlider.min);
            });
            it("can be set", function () {
                aSlider.value = 5;
                expect(aSlider.value).toEqual(5);
            });
            it("can be negative", function () {
                aSlider.min = -10;
                aSlider.value = -2;
                expect(aSlider.value).toEqual(-2);
            });
            it("can be set with a string", function () {
                aSlider.value = "5";
                expect(aSlider.value).toEqual(5);
            });
            it("can't be set with letters", function () {
                var previousValue = aSlider.value;
                aSlider.value = "hello";
                expect(aSlider.value).not.toEqual("hello");
                expect(aSlider.value).toEqual(previousValue);
            });
            describe("behavior", function () {
                it("value should take min into account", function () {
                    aSlider.min = 10;
                    aSlider.value = 0;
                    expect(aSlider.value).toEqual(10);
                });
                it("value should take max into account", function () {
                    aSlider.max = 20;
                    aSlider.value = 25;
                    expect(aSlider.value).toEqual(20);
                });
            });
        });
        describe("active", function () {
            it("should have correct default", function () {
                expect(aSlider.active).toBeFalsy();
            });
            it("should be true after touchstart", function () {
                aSlider.handleTouchstart(MockEvent.event());
                expect(aSlider.active).toBeTruthy();
            });
            it("should be true after mousedown", function () {
                aSlider.handleMousedown(MockEvent.event());
                expect(aSlider.active).toBeTruthy();
            });
            it("should be false after mouseup", function () {
                aSlider.handleMouseup(MockEvent.event());
                expect(aSlider.active).toBeFalsy();
            });
            it("should be false after touchend", function () {
                aSlider.handleTouchend(MockEvent.event());
                expect(aSlider.active).toBeFalsy();
            });
            it("should be false after thumbTranslateEnd", function () {
                aSlider.handleThumbTranslateEnd();
                expect(aSlider.active).toBeFalsy();
            });
            it("should add active class when set to true", function () {
                aSlider.active = true;
                expect(aSlider.classList.contains("montage-Slider--active")).toBeTruthy();
            });
            it("should remove active class when set to false", function () {
                aSlider.active = true;
                aSlider.active = false;
                expect(aSlider.classList.contains("montage-Slider--active")).toBeFalsy();
            });
        });
        describe("step", function () {
            it("should have correct default", function () {
                expect(aSlider.step).toEqual("any");
            });
            it("can be set", function () {
                aSlider.step = 2;
                expect(aSlider.step).toEqual(2);
            });
            it("cannot be negative", function () {
                var previousValue = aSlider.step;
                aSlider.step = -2;
                expect(aSlider.step).toEqual(previousValue);
            });
            it("can be set with a string", function () {
                aSlider.step = "2";
                expect(aSlider.step).toEqual(2);
            });
            it("can't be set with letters", function () {
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
        describe("min", function () {
            it("should have correct default", function () {
                expect(aSlider.min).toEqual(0);
            });
            it("can be set", function () {
                aSlider.min = 2;
                expect(aSlider.min).toEqual(2);
            });
            it("can be negative", function () {
                aSlider.min = -2;
                expect(aSlider.min).toEqual(-2);
            });
            it("can be set with a string", function () {
                aSlider.min = "2";
                expect(aSlider.min).toEqual(2);
            });
            it("can't be set with letters", function () {
                var previousValue = aSlider.min;
                aSlider.min = "hello";
                expect(aSlider.min).not.toEqual("hello");
                expect(aSlider.min).toEqual(previousValue);
            });
            describe("behavior", function () {
                it("value should be unchanged if value already a greater than min", function () {
                    aSlider.value = 6;
                    aSlider.min = 2;
                    expect(aSlider.value).toEqual(6);
                });
                it("value should be changed if value isn't greater than min", function () {
                    aSlider.value = 1;
                    aSlider.min = 2;
                    expect(aSlider.value).toEqual(2);
                });
                it("value should be changed if value isn't greater than min if min is negative", function () {
                    aSlider.min = -10;
                    aSlider.value = -3;
                    aSlider.min = -2;
                    expect(aSlider.value).toEqual(-2);
                });
            });
        });
        describe("max", function () {
            it("should have correct default", function () {
                expect(aSlider.max).toEqual(100);
            });
            it("can be set", function () {
                aSlider.max = 2;
                expect(aSlider.max).toEqual(2);
            });
            it("can be negative", function () {
                aSlider.max = -2;
                expect(aSlider.max).toEqual(-2);
            });
            it("can be set with a string", function () {
                aSlider.max = "2";
                expect(aSlider.max).toEqual(2);
            });
            it("can't be set with letters", function () {
                var previousValue = aSlider.max;
                aSlider.max = "hello";
                expect(aSlider.max).not.toEqual("hello");
                expect(aSlider.max).toEqual(previousValue);
            });
            describe("behavior", function () {
                it("value should be unchanged if value is already less than max", function () {
                    aSlider.value = 2;
                    aSlider.max = 6;
                    expect(aSlider.value).toEqual(2);
                });
                it("value should be changed if value isn't less than max", function () {
                    aSlider.value = 10;
                    aSlider.max = 9;
                    expect(aSlider.value).toEqual(9);
                });
            });
        });
        describe("after enterDocument", function () {
            var Slider = AbstractSlider.specialize( {}),
                aSlider, anElement;
            beforeEach(function () {
                aSlider = new Slider();
                anElement = MockDOM.element();
                aSlider.element = anElement;
            });
            describe("it should continue to work", function () {
                beforeEach(function () {
                    aSlider.enterDocument(true);
                });
                it("should allow value to change", function () {
                    expect(function () {
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
            var Slider = AbstractSlider.specialize( {}),
                aSlider;
            beforeEach(function () {
                aSlider = new Slider();
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
            var Slider = AbstractSlider.specialize( {}),
                aSlider, anElement, listener;
            beforeEach(function () {
                aSlider = new Slider();
                anElement = MockDOM.element();
                aSlider.element = anElement;
                listener = {
                    handleEvent: function () {}
                };
            });
            it("should listen for translateStart only after prepareForActivationEvents", function () {
                var listeners,
                    em = aSlider.eventManager;
                aSlider._sliderThumbElement = anElement;

                aSlider.enterDocument(true);

                listeners = em.registeredEventListenersForEventType_onTarget_("translateStart", aSlider._translateComposer);
                expect(listeners).toBeNull();

                aSlider.prepareForActivationEvents();

                listeners = em.registeredEventListenersForEventType_onTarget_("translateStart", aSlider._translateComposer);
                expect(listeners[aSlider.uuid].listener).toBe(aSlider);
            });
            it("should listen for translate only after prepareForActivationEvents", function () {
                var listeners,
                    em = aSlider.eventManager;
                aSlider._sliderThumbElement = anElement;

                aSlider.enterDocument(true);

                listeners = em.registeredEventListenersForEventType_onTarget_("translate", aSlider._translateComposer);
                expect(listeners).toBeNull();

                aSlider.prepareForActivationEvents();

                listeners = em.registeredEventListenersForEventType_onTarget_("translate", aSlider._translateComposer);
                expect(listeners[aSlider.uuid].listener).toBe(aSlider);
            });
            it("should listen for translateEnd only after prepareForActivationEvents", function () {
                var listeners,
                    em = aSlider.eventManager;
                aSlider._sliderThumbElement = anElement;

                aSlider.enterDocument(true);

                listeners = em.registeredEventListenersForEventType_onTarget_("translateEnd", aSlider._translateComposer);
                expect(listeners).toBeNull();

                aSlider.prepareForActivationEvents();

                listeners = em.registeredEventListenersForEventType_onTarget_("translateEnd", aSlider._translateComposer);
                expect(listeners[aSlider.uuid].listener).toBe(aSlider);
            });
        });
    });
    describe("blueprint", function () {
        it("can be created", function () {
            var blueprintPromise = AbstractSlider.blueprint;
            return blueprintPromise.then(function (blueprint) {
                expect(blueprint).not.toBeNull();
            });
        });
    });
});
