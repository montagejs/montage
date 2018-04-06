/*global describe, it, expect */
var Montage = require("montage").Montage;
var Slider = require("montage/ui/slider.reel").Slider;

describe("test/ui/slider-spec", function () {
    describe("creation", function () {
        it("can be instantiated as a subtype", function () {
            var SliderSubtype = Slider.specialize( {});
            var aSliderSubtype = null;
            expect(function () {
                aSliderSubtype = new SliderSubtype();
            }).not.toThrow();
            expect(aSliderSubtype).toBeDefined();
        });
    });
    describe("properties", function () {
        var SpecializedSlider = Slider.specialize( {}),
            aSlider;
        beforeEach(function () {
            aSlider = new SpecializedSlider();
            aSlider.element = document.createElement('div');
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
            it("should be true after translateStart", function () {
                //Incomplete sequence...
                try {
                    aSlider.handleTranslateStart(new Event("mockEvent"));
                }
                catch (e) {};
                expect(aSlider.active).toBeTruthy();
            });
            it("should be false after translateEnd", function () {
                //Incomplete sequence...
                try {
                    aSlider.handleTranslateEnd(new Event("mockEvent"));
                }
                catch (e) {};
                expect(aSlider.active).toBeFalsy();
            });
            it("should add active class when set to true", function () {
                aSlider.active = true;
                expect(aSlider.classList.contains("montage--active")).toBeTruthy();
            });
            it("should remove active class when set to false", function () {
                aSlider.active = true;
                aSlider.active = false;
                expect(aSlider.classList.contains("montage--active")).toBeFalsy();
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
    });
    describe("objectDescriptor", function () {
        it("can be created", function (done) {
            var objectDescriptorPromise = Slider.objectDescriptor;
            objectDescriptorPromise.then(function (objectDescriptor) {
                expect(objectDescriptor).not.toBeNull();
            }, function (err) {
                fail(err);
            }).finally(function () {
                done();
            });
        });
    });
});
