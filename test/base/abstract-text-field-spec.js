var Montage = require("montage").Montage,
    AbstractTextField = require("montage/ui/base/abstract-text-field").AbstractTextField,
    MockDOM = require("mocks/dom");

describe("test/base/abstract-text-field-spec", function () {

    describe("creation", function () {
        it("cannot be instantiated directly", function () {
            expect(function () {
                AbstractTextField.create();
            }).toThrow();
        });

        it("can be instantiated as a subtype", function () {
            var TextFieldSubtype = Montage.create(AbstractTextField, {});
            var aTextFieldSubtype = null;
            expect(function () {
                aTextFieldSubtype = TextFieldSubtype.create();
            }).not.toThrow();
            expect(aTextFieldSubtype).toBeDefined();
        });
    });

    describe("properties", function () {
        var TextField = Montage.create(AbstractTextField, {}),
            aTextField;

        beforeEach(function () {
            aTextField = TextField.create();
            aTextField.element = MockDOM.element();
        });

        describe("value", function () {
            beforeEach(function () {
                aTextField = TextField.create();
                aTextField.element = MockDOM.element();
                aTextField.enterDocument(true);
            });

            it("should be the value of the element when input is fired", function() {
                aTextField.element.value = "A text";

                var anEvent = document.createEvent("CustomEvent");
                anEvent.initCustomEvent("input", true, true, null);
                aTextField.element.dispatchEvent(anEvent);

                expect(aTextField.value).toBe("A text");
            });

            it("should be the value of the element when change is fired", function() {
                aTextField.element.value = "A text";

                var anEvent = document.createEvent("CustomEvent");
                anEvent.initCustomEvent("change", true, true, null);
                aTextField.element.dispatchEvent(anEvent);

                expect(aTextField.value).toBe("A text");
            });
        });

        describe("enabled", function () {
            beforeEach(function () {
                aTextField = TextField.create();
                aTextField.element = MockDOM.element();
                aTextField.prepareForActivationEvents();
            });

            it("should not dispatch an action event when enabled is false and KeyComposer fires a keyPress", function() {
                var callback = jasmine.createSpy().andCallFake(function(event) {
                    expect(event.type).toEqual("action");
                }),
                anEvent = MockDOM.keyPressEvent("enter", aTextField.element);

                aTextField.addEventListener("action", callback, false);
                aTextField.enabled = false;

                aTextField.handleKeyPress(anEvent);

                expect(callback).not.toHaveBeenCalled();
            });

            it("should add the corresponding class name to classList when enabled is false", function() {
                aTextField.enabled = false;

                expect(aTextField.classList.contains("montage--disabled")).toBe(true);
            });
        });
    });

    describe("draw", function () {
        var TextField = Montage.create(AbstractTextField, {}),
            aTextField;

        beforeEach(function () {
            aTextField = TextField.create();
            aTextField.element = MockDOM.element();
        });

        it("should be requested after enabled state is changed", function () {
            aTextField.enabled = ! aTextField.enabled;
            expect(aTextField.needsDraw).toBeTruthy();
        });

        it("should be requested after value is changed", function () {
            aTextField.value = "a text";
            expect(aTextField.needsDraw).toBeTruthy();
        });

        it("should set the value on the element", function () {
            aTextField.value = "a text";

            aTextField.draw();

            expect(aTextField.element.value).toBe(aTextField.value);
        });
    });

    describe("events", function () {
        var TextField = Montage.create(AbstractTextField, {}),
            aTextField, anElement, listener;

        beforeEach(function () {
            aTextField = TextField.create();
            anElement = MockDOM.element();
            listener = {
                handleEvent: function() {}
            };
        });

        it("should listen for element input after enterDocument", function() {
            aTextField.element = anElement;
            aTextField.enterDocument(true);

            expect(aTextField.element.hasEventListener("input", aTextField)).toBe(true);
        });

        it("should listen for element change after enterDocument", function() {
            aTextField.element = anElement;
            aTextField.enterDocument(true);

            expect(aTextField.element.hasEventListener("change", aTextField)).toBe(true);
        });

        it("should listen for keyPress only after prepareForActivationEvents", function() {
            var listeners,
                em = aTextField.eventManager;

            listeners = em.registeredEventListenersForEventType_onTarget_("keyPress", aTextField);

            expect(listeners).toBeNull();

            aTextField.prepareForActivationEvents();

            listeners = em.registeredEventListenersForEventType_onTarget_("keyPress", aTextField);
            expect(listeners[aTextField.uuid].listener).toBe(aTextField);
        });

        describe("once prepareForActivationEvents is called", function () {
            beforeEach(function () {
                aTextField.prepareForActivationEvents();
            });

            it("should fire an 'action' event when the KeyComposer fires a keyPress", function() {
                var callback = jasmine.createSpy().andCallFake(function(event) {
                    expect(event.type).toEqual("action");
                }),
                anEvent = MockDOM.keyPressEvent("enter", aTextField.element);

                aTextField.addEventListener("action", callback, false);
                aTextField.handleKeyPress(anEvent);

                expect(callback).toHaveBeenCalled();
            });

            it("should fire an 'action' event with the contents of the detail property", function() {
                var callback = jasmine.createSpy().andCallFake(function(event) {
                    expect(event.detail.get("foo")).toEqual("bar");
                }),
                anEvent = MockDOM.keyPressEvent("enter", aTextField.element);

                aTextField.addEventListener("action", callback, false);
                aTextField.detail.set("foo", "bar");

                aTextField.handleKeyPress(anEvent);

                expect(callback).toHaveBeenCalled();
            });
        });
    });
});
