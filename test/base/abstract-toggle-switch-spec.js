var Montage = require("montage").Montage;
var AbstractToggleSwitch = require("montage/ui/base/abstract-toggle-switch").AbstractToggleSwitch;
var MockDOM = require("mocks/dom");

AbstractToggleSwitch.prototype.hasTemplate = false;

describe("test/base/abstract-toggle-switch-spec", function () {
    var ToggleSwitch = AbstractToggleSwitch.specialize({}),
        aToggleSwitch;

    beforeEach(function () {
        aToggleSwitch = new ToggleSwitch();
        aToggleSwitch.element = MockDOM.element();
        aToggleSwitch.needsDraw = false;
    });

    describe("creation", function () {
        it("cannot be instantiated directly", function () {
            expect(function () {
                new AbstractToggleSwitch();
            }).toThrow();
        });

        it("can be instantiated as a subtype", function () {
            expect(aToggleSwitch).toBeDefined();
        });
    });

    describe("properties", function () {
        describe("enabled", function () {
            it("should not toggle when enabled is false and there is a press", function () {
                aToggleSwitch.checked = false;
                aToggleSwitch.enabled = false;
                aToggleSwitch.prepareForActivationEvents();

                aToggleSwitch._pressComposer.dispatchEventNamed("pressStart");
                aToggleSwitch._pressComposer.dispatchEventNamed("press");
                expect(aToggleSwitch.checked).toBe(false);
            });

            it("should add the corresponding class name to classList when enabled is false", function () {
                aToggleSwitch.enabled = false;
                expect(aToggleSwitch.classList.contains("montage--disabled")).toBe(true);
            });
        });

        describe("checked", function () {
            it("should update classList to reflect when it is checked", function () {
                aToggleSwitch.checked = false;
                expect(aToggleSwitch.classList.contains("montage-ToggleSwitch--checked")).toBe(false);
                aToggleSwitch.checked = true;
                expect(aToggleSwitch.classList.contains("montage-ToggleSwitch--checked")).toBe(true);
            });
        });
    });

    describe("draw", function () {
        it("should be requested after changing checked state", function () {
            aToggleSwitch.checked = true;
            expect(aToggleSwitch.needsDraw).toBeTruthy();
        });
        it("should be requested after changing enabled state", function () {
            aToggleSwitch.enabled = false;
            expect(aToggleSwitch.needsDraw).toBeTruthy();
        });
    });

    describe("blueprint", function () {
        it("can be created", function () {
            var blueprintPromise = AbstractToggleSwitch.blueprint;
            return blueprintPromise.then(function (blueprint) {
                expect(blueprint).not.toBeNull();
            });
        });
    });
});
