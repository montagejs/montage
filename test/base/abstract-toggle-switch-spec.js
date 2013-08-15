var Montage = require("montage").Montage;
var AbstractToggleSwitch = require("montage/ui/base/abstract-toggle-switch").AbstractToggleSwitch;
var MockDOM = require("mocks/dom");

AbstractToggleSwitch.prototype.hasTemplate = false;

describe("test/base/abstract-toggle-switch-spec", function() {
    describe("creation", function() {
        it("cannot be instantiated directly", function() {
            expect(function() {
                new AbstractToggleSwitch();
            }).toThrow();
        });

        it("can be instantiated as a subtype", function() {
            var ToggleSwitchSubtype = AbstractToggleSwitch.specialize({});
            var aSwitch;
            expect(function() {
                aSwitch = new ToggleSwitchSubtype();
            }).not.toThrow();
            expect(aSwitch).toBeDefined();
        });
    });
});
