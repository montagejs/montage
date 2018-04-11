var AbstractControl = require("montage/ui/base/abstract-control").AbstractControl;

AbstractControl.prototype.hasTemplate = false;

describe("test/base/abstract-control-spec", function () {
    var control;
    beforeEach(function () {
        control = new AbstractControl();
    });

    describe("dispatchActionEvent", function () {
        it("returns false if the preventDefault was called on the event", function () {
            control.addEventListener("action", function (event) {
                event.preventDefault();
            });

            expect(control.dispatchActionEvent()).toBe(false);
        });

        it("returns true if the preventDefault was not called on the event", function () {
            control.addEventListener("action");

            expect(control.dispatchActionEvent()).toBe(true);
        });

        it("dispatches an event with the detail property of the control", function () {
            control.addEventListener("action", function (event) {
                expect(event.detail.get("test")).toBe("pass");
            });
            control.detail.set("test", "pass");
            control.dispatchActionEvent();
        });
    });

});
