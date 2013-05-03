var Montage = require("montage").Montage,
    AbstractRadioButton = require("montage/ui/base/abstract-radio-button").AbstractRadioButton,
    MockDOM = require("mocks/dom");

describe("test/base/abstract-radio-button-spec", function () {

    describe("creation", function () {
        it("cannot be instantiated directly", function () {
            expect(function () {
                AbstractRadioButton.create();
            }).toThrow();
        });

        it("can be instantiated as a subtype", function () {
            var InputRadioSubtype = Montage.create(AbstractRadioButton, {});
            var anInputRadioSubtype = null;
            expect(function () {
                anInputRadioSubtype = InputRadioSubtype.create();
            }).not.toThrow();
            expect(anInputRadioSubtype).toBeDefined();
        });
    });

    describe("properties", function () {
        var InputRadio = Montage.create(AbstractRadioButton, {}),
            anInputRadio;

        beforeEach(function () {
            anInputRadio = InputRadio.create();
            anInputRadio.element = MockDOM.element();
        });

        describe("checked", function () {
            beforeEach(function () {
                anInputRadio = InputRadio.create();
                anInputRadio.element = MockDOM.element();
                anInputRadio.checked = false;
                anInputRadio.prepareForActivationEvents();
            });

            it("should be true when the PressComposer fires a pressStart + press", function() {
                anInputRadio._pressComposer.dispatchEventNamed("pressStart");
                anInputRadio._pressComposer.dispatchEventNamed("press");

                expect(anInputRadio.checked).toBe(true);
            });

            it("should be false when the PressComposer fires a pressStart + pressCancel", function() {
                anInputRadio._pressComposer.dispatchEventNamed("pressStart");
                anInputRadio._pressComposer.dispatchEventNamed("pressCancel");

                expect(anInputRadio.checked).toBe(false);
            });

            it("should add the corresponding class name to classList when checked", function() {
                anInputRadio.checked = true;

                expect(anInputRadio.classList.contains("montage-InputRadio--checked")).toBe(true);
            });
        });

        describe("enabled", function () {
            beforeEach(function () {
                anInputRadio = InputRadio.create();
                anInputRadio.element = MockDOM.element();
                anInputRadio.checked = false;
                anInputRadio.prepareForActivationEvents();
            });

            it("should not get checked when enabled is false and PressComposer fires a press", function() {
                anInputRadio.enabled = false;

                anInputRadio._pressComposer.dispatchEventNamed("pressStart");
                anInputRadio._pressComposer.dispatchEventNamed("press");

                expect(anInputRadio.checked).toBe(false);
            });

            it("should not dispatch an action event when enabled is false and PressComposer fires a press", function() {
                var callback = jasmine.createSpy().andCallFake(function(event) {
                    expect(event.type).toEqual("action");
                });
                anInputRadio.addEventListener("action", callback, false);
                anInputRadio.enabled = false;

                anInputRadio._pressComposer.dispatchEventNamed("pressStart");
                anInputRadio._pressComposer.dispatchEventNamed("press");

                expect(callback).not.toHaveBeenCalled();
            });

            it("should add the corresponding class name to classList when enabled is false", function() {
                anInputRadio.enabled = false;

                expect(anInputRadio.classList.contains("montage--disabled")).toBe(true);
            });
        });

        describe("active", function () {
            beforeEach(function () {
                anInputRadio = InputRadio.create();
                anInputRadio.element = MockDOM.element();
                anInputRadio.checked = false;
                anInputRadio.prepareForActivationEvents();
            });

            it("should be true when the PressComposer fires a pressStart", function() {
                anInputRadio._pressComposer.dispatchEventNamed("pressStart");
                expect(anInputRadio.active).toBe(true);
            });

            it("should be false when the PressComposer fires a pressStart + press", function() {
                anInputRadio._pressComposer.dispatchEventNamed("pressStart");
                anInputRadio._pressComposer.dispatchEventNamed("press");
                expect(anInputRadio.active).toBe(false);
            });

            it("should be false when the PressComposer fires a pressStart + press while checked", function() {
                anInputRadio.checked = true;

                anInputRadio._pressComposer.dispatchEventNamed("pressStart");
                anInputRadio._pressComposer.dispatchEventNamed("press");

                expect(anInputRadio.active).toBe(false);
            });

            it("should be false when the PressComposer fires a pressStart + pressCancel", function() {
                anInputRadio._pressComposer.dispatchEventNamed("pressStart");
                anInputRadio._pressComposer.dispatchEventNamed("pressCancel");
                expect(anInputRadio.active).toBe(false);
            });

            it("should add the corresponding class name to classList when active", function() {
                anInputRadio.active = true;

                expect(anInputRadio.classList.contains("montage--active")).toBe(true);
            });
        });
    });

    describe("draw", function () {
        var InputRadio = Montage.create(AbstractRadioButton, {}),
            anInputRadio;

        beforeEach(function () {
            anInputRadio = InputRadio.create();
            anInputRadio.element = MockDOM.element();
        });

        it("should be requested after enabled state is changed", function () {
            anInputRadio.enabled = ! anInputRadio.enabled;
            expect(anInputRadio.needsDraw).toBeTruthy();
        });
        it("should be requested after active is changed", function () {
            anInputRadio.active = true;
            expect(anInputRadio.needsDraw).toBeTruthy();
        });
    });

    describe("events", function () {
        var InputRadio = Montage.create(AbstractRadioButton, {}),
            anInputRadio, anElement, listener;

        beforeEach(function () {
            anInputRadio = InputRadio.create();
            anElement = MockDOM.element();
            listener = {
                handleEvent: function() {}
            };
        });
        it("should listen for press only after prepareForActivationEvents", function() {
            var listeners,
                em = anInputRadio.eventManager;

            listeners = em.registeredEventListenersForEventType_onTarget_("press", anInputRadio);

            expect(listeners).toBeNull();

            anInputRadio.prepareForActivationEvents();

            listeners = em.registeredEventListenersForEventType_onTarget_("press", anInputRadio._pressComposer);
            expect(listeners[anInputRadio.uuid].listener).toBe(anInputRadio);
        });
        describe("once prepareForActivationEvents is called", function () {
            beforeEach(function () {
                anInputRadio.prepareForActivationEvents();
            });
            it("should fire an 'action' event when the PressComposer fires a pressStart + press", function() {
                var callback = jasmine.createSpy().andCallFake(function(event) {
                    expect(event.type).toEqual("action");
                });
                anInputRadio.addEventListener("action", callback, false);

                anInputRadio._pressComposer.dispatchEventNamed("pressStart");
                anInputRadio._pressComposer.dispatchEventNamed("press");

                expect(callback).toHaveBeenCalled();
            });

            it("should not fire an 'action' event when the PressComposer fires a pressStart + pressCancel", function() {
                var callback = jasmine.createSpy().andCallFake(function(event) {
                    expect(event.type).toEqual("action");
                });
                anInputRadio.addEventListener("action", callback, false);

                anInputRadio._pressComposer.dispatchEventNamed("pressStart");
                anInputRadio._pressComposer.dispatchEventNamed("pressCancel");

                expect(callback).not.toHaveBeenCalled();
            });

            it("should not fire an 'action' event when the PressComposer fires a pressStart + press and already checked", function() {
                var callback = jasmine.createSpy().andCallFake(function(event) {
                    expect(event.type).toEqual("action");
                });
                anInputRadio.addEventListener("action", callback, false);
                anInputRadio.checked = true;

                anInputRadio._pressComposer.dispatchEventNamed("pressStart");
                anInputRadio._pressComposer.dispatchEventNamed("press");

                expect(callback).not.toHaveBeenCalled();
            });

            it("should fire an 'action' event with the contents of the detail property", function() {
                var callback = jasmine.createSpy().andCallFake(function(event) {
                    expect(event.detail.get("foo")).toEqual("bar");
                });
                anInputRadio.addEventListener("action", callback, false);
                anInputRadio.detail.set("foo", "bar");

                anInputRadio._pressComposer.dispatchEventNamed("pressStart");
                anInputRadio._pressComposer.dispatchEventNamed("press");

                expect(callback).toHaveBeenCalled();
            });
        });
    });

});
