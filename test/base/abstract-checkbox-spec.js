var Montage = require("montage").Montage,
    AbstractCheckbox = require("montage/ui/base/abstract-checkbox").AbstractCheckbox,
    MockDOM = require("mocks/dom");

describe("test/base/abstract-radio-button-spec", function () {

    describe("creation", function () {
        it("cannot be instantiated directly", function () {
            expect(function () {
                AbstractCheckbox.create();
            }).toThrow();
        });

        it("can be instantiated as a subtype", function () {
            var CheckboxSubtype = Montage.create(AbstractCheckbox, {});
            var anCheckboxSubtype = null;
            expect(function () {
                anCheckboxSubtype = CheckboxSubtype.create();
            }).not.toThrow();
            expect(anCheckboxSubtype).toBeDefined();
        });
    });

    describe("properties", function () {
        var Checkbox = Montage.create(AbstractCheckbox, {}),
            anCheckbox;

        beforeEach(function () {
            anCheckbox = Checkbox.create();
            anCheckbox.element = MockDOM.element();
        });

        describe("checked", function () {
            beforeEach(function () {
                anCheckbox = Checkbox.create();
                anCheckbox.element = MockDOM.element();
                anCheckbox.checked = false;
                anCheckbox.prepareForActivationEvents();
            });

            it("should be true when the PressComposer fires a pressStart + press", function() {
                anCheckbox._pressComposer.dispatchEventNamed("pressStart");
                anCheckbox._pressComposer.dispatchEventNamed("press");

                expect(anCheckbox.checked).toBe(true);
            });

            it("should be false when the PressComposer fires a pressStart + pressCancel", function() {
                anCheckbox._pressComposer.dispatchEventNamed("pressStart");
                anCheckbox._pressComposer.dispatchEventNamed("pressCancel");

                expect(anCheckbox.checked).toBe(false);
            });

            it("should toggle when the PressComposer fires a pressStart + press twice", function() {
                anCheckbox._pressComposer.dispatchEventNamed("pressStart");
                anCheckbox._pressComposer.dispatchEventNamed("press");
                expect(anCheckbox.checked).toBe(true);

                anCheckbox._pressComposer.dispatchEventNamed("pressStart");
                anCheckbox._pressComposer.dispatchEventNamed("press");
                expect(anCheckbox.checked).toBe(false);
            });

            it("should add the corresponding class name to classList when checked", function() {
                anCheckbox.checked = true;

                expect(anCheckbox.classList.contains("montage-Checkbox--checked")).toBe(true);
            });
        });

        describe("enabled", function () {
            beforeEach(function () {
                anCheckbox = Checkbox.create();
                anCheckbox.element = MockDOM.element();
                anCheckbox.checked = false;
                anCheckbox.prepareForActivationEvents();
            });

            it("should not get checked when enabled is false and PressComposer fires a press", function() {
                anCheckbox.enabled = false;

                anCheckbox._pressComposer.dispatchEventNamed("pressStart");
                anCheckbox._pressComposer.dispatchEventNamed("press");

                expect(anCheckbox.checked).toBe(false);
            });

            it("should not dispatch an action event when enabled is false and PressComposer fires a press", function() {
                var callback = jasmine.createSpy().andCallFake(function(event) {
                    expect(event.type).toEqual("action");
                });
                anCheckbox.addEventListener("action", callback, false);
                anCheckbox.enabled = false;

                anCheckbox._pressComposer.dispatchEventNamed("pressStart");
                anCheckbox._pressComposer.dispatchEventNamed("press");

                expect(callback).not.toHaveBeenCalled();
            });

            it("should add the corresponding class name to classList when enabled is false", function() {
                anCheckbox.enabled = false;

                expect(anCheckbox.classList.contains("montage--disabled")).toBe(true);
            });
        });

        describe("active", function () {
            beforeEach(function () {
                anCheckbox = Checkbox.create();
                anCheckbox.element = MockDOM.element();
                anCheckbox.checked = false;
                anCheckbox.prepareForActivationEvents();
            });

            it("should be true when the PressComposer fires a pressStart", function() {
                anCheckbox._pressComposer.dispatchEventNamed("pressStart");
                expect(anCheckbox.active).toBe(true);
            });

            it("should be false when the PressComposer fires a pressStart + press", function() {
                anCheckbox._pressComposer.dispatchEventNamed("pressStart");
                anCheckbox._pressComposer.dispatchEventNamed("press");
                expect(anCheckbox.active).toBe(false);
            });

            it("should be false when the PressComposer fires a pressStart + press while checked", function() {
                anCheckbox.checked = true;

                anCheckbox._pressComposer.dispatchEventNamed("pressStart");
                anCheckbox._pressComposer.dispatchEventNamed("press");

                expect(anCheckbox.active).toBe(false);
            });

            it("should be false when the PressComposer fires a pressStart + pressCancel", function() {
                anCheckbox._pressComposer.dispatchEventNamed("pressStart");
                anCheckbox._pressComposer.dispatchEventNamed("pressCancel");
                expect(anCheckbox.active).toBe(false);
            });

            it("should add the corresponding class name to classList when active", function() {
                anCheckbox.active = true;

                expect(anCheckbox.classList.contains("montage--active")).toBe(true);
            });
        });
    });

    describe("draw", function () {
        var Checkbox = Montage.create(AbstractCheckbox, {}),
            anCheckbox;

        beforeEach(function () {
            anCheckbox = Checkbox.create();
            anCheckbox.element = MockDOM.element();
        });

        it("should be requested after enabled state is changed", function () {
            anCheckbox.enabled = ! anCheckbox.enabled;
            expect(anCheckbox.needsDraw).toBeTruthy();
        });
        it("should be requested after active is changed", function () {
            anCheckbox.active = true;
            expect(anCheckbox.needsDraw).toBeTruthy();
        });
    });

    describe("events", function () {
        var Checkbox = Montage.create(AbstractCheckbox, {}),
            anCheckbox, anElement, listener;

        beforeEach(function () {
            anCheckbox = Checkbox.create();
            anElement = MockDOM.element();
            listener = {
                handleEvent: function() {}
            };
        });
        it("should listen for press only after prepareForActivationEvents", function() {
            var listeners,
                em = anCheckbox.eventManager;

            listeners = em.registeredEventListenersForEventType_onTarget_("press", anCheckbox);

            expect(listeners).toBeNull();

            anCheckbox.prepareForActivationEvents();

            listeners = em.registeredEventListenersForEventType_onTarget_("press", anCheckbox._pressComposer);
            expect(listeners[anCheckbox.uuid].listener).toBe(anCheckbox);
        });
        describe("once prepareForActivationEvents is called", function () {
            beforeEach(function () {
                anCheckbox.prepareForActivationEvents();
            });
            it("should fire an 'action' event when the PressComposer fires a pressStart + press", function() {
                var callback = jasmine.createSpy().andCallFake(function(event) {
                    expect(event.type).toEqual("action");
                });
                anCheckbox.addEventListener("action", callback, false);

                anCheckbox._pressComposer.dispatchEventNamed("pressStart");
                anCheckbox._pressComposer.dispatchEventNamed("press");

                expect(callback).toHaveBeenCalled();
            });

            it("should not fire an 'action' event when the PressComposer fires a pressStart + pressCancel", function() {
                var callback = jasmine.createSpy().andCallFake(function(event) {
                    expect(event.type).toEqual("action");
                });
                anCheckbox.addEventListener("action", callback, false);

                anCheckbox._pressComposer.dispatchEventNamed("pressStart");
                anCheckbox._pressComposer.dispatchEventNamed("pressCancel");

                expect(callback).not.toHaveBeenCalled();
            });

            it("should fire an 'action' event with the contents of the detail property", function() {
                var callback = jasmine.createSpy().andCallFake(function(event) {
                    expect(event.detail.get("foo")).toEqual("bar");
                });
                anCheckbox.addEventListener("action", callback, false);
                anCheckbox.detail.set("foo", "bar");

                anCheckbox._pressComposer.dispatchEventNamed("pressStart");
                anCheckbox._pressComposer.dispatchEventNamed("pressCancel");

                expect(callback).not.toHaveBeenCalled();
            });
        });
    });

});
