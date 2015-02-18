/*global describe, it, expect, beforeEach, afterEach */
var Montage = require("montage").Montage,
    AbstractNumberField = require("montage/ui/base/abstract-number-field").AbstractNumberField,
    MockDOM = require("mocks/dom"),
    MockComponent = require("mocks/component"),
    MockEvent = require("mocks/event");

AbstractNumberField.prototype.hasTemplate = false;

describe("test/base/abstract-number-field-spec", function () {

    describe("creation", function () {
        it("cannot be instantiated directly", function () {
            expect(function () {
                new AbstractNumberField();
            }).toThrow();
        });

        it("can be instantiated as a subtype", function () {
            var NumberFieldSubtype = AbstractNumberField.specialize( {constructor: function NumberFieldSubtype() {}});
            var aNumberFieldSubtype = null;
            expect(function () {
                aNumberFieldSubtype = new NumberFieldSubtype();
            }).not.toThrow();
            expect(aNumberFieldSubtype).toBeDefined();
        });
    });

    describe("properties", function () {
        var NumberField = AbstractNumberField.specialize( {constructor: function NumberField() {}}),
            aNumberField;

        beforeEach(function () {
            aNumberField = new NumberField();
            aNumberField.element = MockDOM.element();
            aNumberField._numberFieldTextFieldComponent = MockComponent.component();
            aNumberField._numberFieldMinusComponent = MockComponent.component();
            aNumberField._numberFieldPlusComponent = MockComponent.component();
        });

        describe("value", function () {
            it("should have correct default", function () {
                expect(aNumberField.value).toEqual(0);
            });
            it("can be set", function () {
                aNumberField.value = 5;
                expect(aNumberField.value).toEqual(5);
            });
            it("can be negative", function () {
                aNumberField.value = -2;
                expect(aNumberField.value).toEqual(-2);
            });
            it("can be set with a string", function () {
                aNumberField.value = "5";
                expect(aNumberField.value).toEqual(5);
            });
            it("can't be set with letters", function () {
                var previousValue = aNumberField.value;
                aNumberField.value = "hello";
                expect(aNumberField.value).not.toEqual("hello");
                expect(aNumberField.value).toEqual(previousValue);
            });
            it("can be set to null", function () {
                aNumberField.value = null;
                expect(aNumberField.value).toEqual("");
            });
            it("can be set to undefined", function () {
                aNumberField.value = void 0;
                expect(aNumberField.value).toEqual("");
            });
            it("can be set to an object without valueOf", function () {
                aNumberField.value = Object.create(null);
                expect(aNumberField.value).toEqual("");
            });
            describe("behavior", function () {
                it("value shouldn't be affected by step", function () {
                    aNumberField.step = 2;
                    aNumberField.value = 5.5;
                    expect(aNumberField.value).toEqual(5.5);
                });
                it("value should take min into account", function () {
                    aNumberField.min = 10;
                    aNumberField.value = 0;
                    expect(aNumberField.value).toEqual(10);
                });
                it("value should take max into account", function () {
                    aNumberField.max = 20;
                    aNumberField.value = 25;
                    expect(aNumberField.value).toEqual(20);
                });
           });
        });
        describe("step", function () {
            it("should have correct default", function () {
                expect(aNumberField.step).toEqual(1);
            });
            it("can be set", function () {
                aNumberField.step = 2;
                expect(aNumberField.step).toEqual(2);
            });
            it("cannot be negative", function () {
                // Inspiration from:
                //  http://dev.w3.org/html5/spec/common-input-element-attributes.html#attr-input-step
                var previousValue = aNumberField.step;
                aNumberField.step = -2;
                expect(aNumberField.step).toEqual(previousValue);
            });
            it("can be set with a string", function () {
                aNumberField.step = "2";
                expect(aNumberField.step).toEqual(2);
            });
            it("can't be set with letters", function () {
                var previousValue = aNumberField.step;
                aNumberField.step = "hello";
                expect(aNumberField.step).not.toEqual("hello");
                expect(aNumberField.step).toEqual(previousValue);
            });
        });
        describe("min", function () {
            it("should have correct default", function () {
                expect(aNumberField.min).toEqual("any");
            });
            it("can be set", function () {
                aNumberField.min = 2;
                expect(aNumberField.min).toEqual(2);
            });
            it("can be negative", function () {
                aNumberField.min = -2;
                expect(aNumberField.min).toEqual(-2);
            });
            it("can be set with a string", function () {
                aNumberField.min = "2";
                expect(aNumberField.min).toEqual(2);
            });
            it("can't be set with letters", function () {
                var previousValue = aNumberField.min;
                aNumberField.min = "hello";
                expect(aNumberField.min).not.toEqual("hello");
                expect(aNumberField.min).toEqual(previousValue);
            });
            describe("behavior", function () {
                it("value should be unchanged if value already a greater than min", function () {
                    aNumberField.value = 6;
                    aNumberField.min = 2;
                    expect(aNumberField.value).toEqual(6);
                });
                it("value should be changed if value isn't greater than min", function () {
                    aNumberField.value = 1;
                    aNumberField.min = 2;
                    expect(aNumberField.value).toEqual(2);
                });
            });
        });
        describe("max", function () {
            it("should have correct default", function () {
                expect(aNumberField.max).toEqual("any");
            });
            it("can be set", function () {
                aNumberField.max = 2;
                expect(aNumberField.max).toEqual(2);
            });
            it("can be negative", function () {
                aNumberField.max = -2;
                expect(aNumberField.max).toEqual(-2);
            });
            it("can be set with a string", function () {
                aNumberField.max = "2";
                expect(aNumberField.max).toEqual(2);
            });
            it("can't be set with letters", function () {
                var previousValue = aNumberField.max;
                aNumberField.max = "hello";
                expect(aNumberField.max).not.toEqual("hello");
                expect(aNumberField.max).toEqual(previousValue);
            });
            describe("behavior", function () {
                it("value should be unchanged if value is already less than max", function () {
                    aNumberField.value = 2;
                    aNumberField.max = 6;
                    expect(aNumberField.value).toEqual(2);
                });
                it("value should be changed if value isn't less than max", function () {
                    aNumberField.value = 10;
                    aNumberField.max = 9;
                    expect(aNumberField.value).toEqual(9);
                });
            });
        });
        describe("when the properties are set beforehand", function () {
            beforeEach(function () {
                aNumberField.element.setAttribute("value", 80);
                aNumberField.element.setAttribute("min", -100);
                aNumberField.element.setAttribute("max", 999);
                aNumberField.element.setAttribute("step", 10);
                aNumberField.value = 85;
                aNumberField.min = -105;
                aNumberField.max = 888;
                aNumberField.step = 5;
                aNumberField.enterDocument(true);
            });
            it("should not get the value from the placeholder element", function () {
                expect(aNumberField.value).toEqual(85);
            });
            it("should not get the min from the placeholder element", function () {
                expect(aNumberField.min).toEqual(-105);
            });
            it("should not get the max from the placeholder element", function () {
                expect(aNumberField.max).toEqual(888);
            });
            it("should not get the step from the placeholder element", function () {
                expect(aNumberField.step).toEqual(5);
            });
            it("should delete _propertyNamesUsed after enterDocument", function () {
                expect(aNumberField._propertyNamesUsed).not.toBeDefined();
            });
        });

    });
    describe("interaction", function () {
        var NumberField = AbstractNumberField.specialize( {constructor: function NumberField() {}}),
            aNumberField;

        beforeEach(function () {
            aNumberField = new NumberField();
            aNumberField.element = MockDOM.element();
            aNumberField._numberFieldTextFieldComponent = MockComponent.component();
            aNumberField._numberFieldMinusComponent = MockComponent.component();
            aNumberField._numberFieldPlusComponent = MockComponent.component();
        });

        describe("textfield", function () {
            beforeEach(function () {
                aNumberField.value = 6;
            });
            it("should reset the value to previous if invalid", function () {
                aNumberField.value = 6;
                aNumberField._numberFieldTextFieldComponent.value = "abc";
                aNumberField.textFieldDidEndEditing();
                expect(aNumberField.value).toEqual(6);
                expect(aNumberField._numberFieldTextFieldComponent.value).toEqual(6);
            });
            it("should correctly handle leading digits", function () {
                aNumberField.value = 6;
                aNumberField._numberFieldTextFieldComponent.value = "4abc";
                aNumberField.textFieldDidEndEditing();
                expect(aNumberField.value).toEqual(4);
                expect(aNumberField._numberFieldTextFieldComponent.value).toEqual(4);
            });
            it("should strip letters even in the middle of the value", function () {
                aNumberField.value = 999;
                aNumberField._numberFieldTextFieldComponent.value = "9a99";
                aNumberField.textFieldDidEndEditing();
                expect(aNumberField.value).toEqual(9);
                expect(aNumberField._numberFieldTextFieldComponent.value).toEqual(9);
            });
        });
        describe("plus", function () {
            //http://www.w3.org/html/wg/drafts/html/master/forms.html#dom-input-stepup
            it("should increment by a unit of step", function () {
                aNumberField.min = "any";
                aNumberField.value = 6;
                aNumberField.step = 2;
                aNumberField.handlePlusAction();
                expect(aNumberField.value).toEqual(8);
            });
            it("should use min as the step base", function () {
                aNumberField.min = 1;
                aNumberField.value = 6;
                aNumberField.step = 2;
                aNumberField.handlePlusAction();
                expect(aNumberField.value).toEqual(7);
            });
            it("should snap to greater integral multiple", function () {
                aNumberField.value = 5.5;
                aNumberField.step = 2;
                aNumberField.handlePlusAction();
                expect(aNumberField.value).toEqual(6);
            });
            it("should not go above max", function () {
                aNumberField.min = 1;
                aNumberField.max = 11;
                aNumberField.value = 10.5;
                aNumberField.step = 3;
                aNumberField.handlePlusAction();
                expect(aNumberField.value).toEqual(11);
            });
            it("should increment by a unit of floating point step", function () {
                aNumberField.value = 0.3;
                aNumberField.min = 0;
                aNumberField.max = 1;
                aNumberField.step = 0.1;
                aNumberField.handlePlusAction();

                expect(aNumberField.value).toEqual(0.4);
            });
            it("should snap to greater floating point multiple", function () {
                aNumberField.value = 0.2;
                aNumberField.min = 0;
                aNumberField.max = 1;
                aNumberField.step = 0.125;
                aNumberField.handlePlusAction();

                expect(aNumberField.value).toEqual(0.25);
            });
        });
        describe("minus", function () {
            //http://www.w3.org/html/wg/drafts/html/master/forms.html#dom-input-stepup
            it("should decrement by a unit of step", function () {
                aNumberField.min = "any";
                aNumberField.value = 6;
                aNumberField.step = 2;
                aNumberField.handleMinusAction();
                expect(aNumberField.value).toEqual(4);
            });
            it("should use min as the step base", function () {
                aNumberField.min = 1;
                aNumberField.value = 6;
                aNumberField.step = 2;
                aNumberField.handleMinusAction();
                expect(aNumberField.value).toEqual(5);
            });
            it("should snap to lesser integral multiple", function () {
                aNumberField.value = 5.5;
                aNumberField.step = 2;
                aNumberField.handleMinusAction();
                expect(aNumberField.value).toEqual(4);
            });
            it("should not go below min", function () {
                aNumberField.min = 1;
                aNumberField.max = 10;
                aNumberField.value = 2.5;
                aNumberField.step = 3;
                aNumberField.handleMinusAction();
                expect(aNumberField.value).toEqual(1);
            });
            it("should decrement by a unit of floating point step", function () {
                aNumberField.value = 0.2;
                aNumberField.min = 0;
                aNumberField.max = 1;
                aNumberField.step = 0.1;
                aNumberField.handleMinusAction();

                expect(aNumberField.value).toEqual(0.1);
            });
            it("should snap to greater floating point multiple", function () {
                aNumberField.value = 0.3;
                aNumberField.min = 0;
                aNumberField.max = 1;
                aNumberField.step = 0.125;
                aNumberField.handleMinusAction();

                expect(aNumberField.value).toEqual(0.25);
            });
        });
    });

    describe("events", function () {
        var NumberField = AbstractNumberField.specialize( {constructor: function NumberField() {}}),
            aNumberField;

        beforeEach(function () {
            aNumberField = new NumberField();
            aNumberField.element = MockDOM.element();
            aNumberField._numberFieldTextFieldComponent = MockComponent.component();
            aNumberField._numberFieldMinusComponent = MockComponent.component();
            aNumberField._numberFieldPlusComponent = MockComponent.component();
        });

        describe("'action' event ", function () {
            it("should listen for 'action' event on the textfield after enterDocument", function () {
                expect(aNumberField._numberFieldTextFieldComponent.hasEventListener("action", aNumberField)).toBeFalsy();
                aNumberField.enterDocument(true);
                expect(aNumberField._numberFieldTextFieldComponent.hasEventListener("action", aNumberField)).toBeTruthy();
            });
            it("should listen for 'action' event on the textfield after enterDocument", function () {
                expect(aNumberField._numberFieldMinusComponent.hasEventListener("action", aNumberField)).toBeFalsy();
                aNumberField.enterDocument(true);
                expect(aNumberField._numberFieldMinusComponent.hasEventListener("action", aNumberField)).toBeTruthy();
            });
            it("should listen for 'action' event on the textfield after enterDocument", function () {
                expect(aNumberField._numberFieldPlusComponent.hasEventListener("action", aNumberField)).toBeFalsy();
                aNumberField.enterDocument(true);
                expect(aNumberField._numberFieldPlusComponent.hasEventListener("action", aNumberField)).toBeTruthy();
            });

            it("should fire an 'action' event when the textfield fires an action", function () {
                var callback = jasmine.createSpy("actionCallback").andCallFake(function (event) {
                        expect(event.type).toEqual("action");
                    }),
                    actionEvent = MockEvent.event("action", true, true, null);

                aNumberField.addEventListener("action", callback, false);
                aNumberField.enterDocument(true);
                aNumberField._numberFieldTextFieldComponent.dispatchEvent(actionEvent);

                expect(callback).toHaveBeenCalled();
            });

            it("should fire an 'action' event when the plus button fires an action", function () {
                var callback = jasmine.createSpy("actionCallback").andCallFake(function (event) {
                        expect(event.type).toEqual("action");
                    }),
                    actionEvent = MockEvent.event("action", true, true, null);

                aNumberField.addEventListener("action", callback, false);
                aNumberField.enterDocument(true);
                aNumberField._numberFieldPlusComponent.dispatchEvent(actionEvent);

                expect(callback).toHaveBeenCalled();
            });

            it("should fire an 'action' event when the minus button fires an action", function () {
                var callback = jasmine.createSpy("actionCallback").andCallFake(function (event) {
                        expect(event.type).toEqual("action");
                    }),
                    actionEvent = MockEvent.event("action", true, true, null);

                aNumberField.addEventListener("action", callback, false);
                aNumberField.enterDocument(true);
                aNumberField._numberFieldMinusComponent.dispatchEvent(actionEvent);

                expect(callback).toHaveBeenCalled();
            });
            it("should stop the propagation of 'action' events from the textfield", function () {
                var actionEvent = MockEvent.event("action", true, true, null);
                aNumberField.enterDocument(true);
                aNumberField._numberFieldTextFieldComponent.dispatchEvent(actionEvent);
                expect(actionEvent.propagationStopped).toBeTruthy();
            });

            it("should stop the propagation of 'action' events from the plus button", function () {
                var actionEvent = MockEvent.event("action", true, true, null);
                aNumberField.enterDocument(true);
                aNumberField._numberFieldPlusComponent.dispatchEvent(actionEvent);
                expect(actionEvent.propagationStopped).toBeTruthy();
            });

            it("should stop the propagation of 'action' events from the minus button", function () {
                var actionEvent = MockEvent.event("action", true, true, null);
                aNumberField.enterDocument(true);
                aNumberField._numberFieldMinusComponent.dispatchEvent(actionEvent);
                expect(actionEvent.propagationStopped).toBeTruthy();
            });
        });
    });
    describe("blueprint", function () {
        it("can be created", function () {
            var blueprintPromise = AbstractNumberField.blueprint;
            return blueprintPromise.then(function (blueprint) {
                expect(blueprint).not.toBeNull();
            });
        });
    });
});
