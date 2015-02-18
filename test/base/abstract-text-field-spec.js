var Montage = require("montage").Montage,
    AbstractTextField = require("montage/ui/base/abstract-text-field").AbstractTextField,
    MockDOM = require("mocks/dom");

describe("test/base/abstract-text-field-spec", function () {

    describe("creation", function () {
        it("cannot be instantiated directly", function () {
            expect(function () {
                new AbstractTextField();
            }).toThrow();
        });

        it("can be instantiated as a subtype", function () {
            var TextFieldSubtype = AbstractTextField.specialize( {});
            var aTextFieldSubtype = null;
            expect(function () {
                aTextFieldSubtype = new TextFieldSubtype();
            }).not.toThrow();
            expect(aTextFieldSubtype).toBeDefined();
        });
    });

    describe("properties", function () {
        var TextField = AbstractTextField.specialize( {}),
            aTextField;

        beforeEach(function () {
            aTextField = new TextField();
            aTextField.element = MockDOM.element();
        });

        describe("value", function () {
            beforeEach(function () {
                aTextField = new TextField();
                aTextField.element = MockDOM.element();
                aTextField.enterDocument(true);
            });

            it("should be the value of the element when input is fired", function () {
                aTextField.element.value = "A text";

                var anEvent = document.createEvent("CustomEvent");
                anEvent.initCustomEvent("input", true, true, null);
                aTextField.element.dispatchEvent(anEvent);

                expect(aTextField.value).toBe("A text");
            });

            it("should be the value of the element when change is fired", function () {
                aTextField.element.value = "A text";

                var anEvent = document.createEvent("CustomEvent");
                anEvent.initCustomEvent("change", true, true, null);
                aTextField.element.dispatchEvent(anEvent);

                expect(aTextField.value).toBe("A text");
            });

            it("should set value when field not selected", function () {
                aTextField._value = "initial";
                aTextField.value = "updated";
                expect(aTextField.value).toBe("updated");
            });

            it("should not set value when field selected", function () {
                aTextField._value = "initial";
                aTextField._hasFocus = true;
                aTextField.value = "updated";
                expect(aTextField.value).toBe("initial");
            });
        });

        describe("enabled", function () {
            beforeEach(function () {
                aTextField = new TextField();
                aTextField.element = MockDOM.element();
                aTextField.prepareForActivationEvents();
            });

            it("should not dispatch an action event when enabled is false and KeyComposer fires a keyPress", function () {
                var callback = jasmine.createSpy().andCallFake(function (event) {
                    expect(event.type).toEqual("action");
                }),
                anEvent = MockDOM.keyPressEvent("enter", aTextField.element);

                aTextField.addEventListener("action", callback, false);
                aTextField.enabled = false;

                aTextField.handleKeyPress(anEvent);

                expect(callback).not.toHaveBeenCalled();
            });

            it("should add the corresponding class name to classList when enabled is false", function () {
                aTextField.enabled = false;

                expect(aTextField.classList.contains("montage--disabled")).toBe(true);
            });
        });
    });

    describe("draw", function () {
        var TextField = AbstractTextField.specialize( {}),
            aTextField;

        beforeEach(function () {
            aTextField = new TextField();
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

        it("should display false as 'false' in the element", function () {
            aTextField.value = false;
            aTextField.draw();
            expect(aTextField.element.value).toBe("false");
        });

        it("should display true as 'true' in the element", function () {
            aTextField.value = true;
            aTextField.draw();
            expect(aTextField.element.value).toBe("true");
        });

        it("should display undefined as an empty string in the element", function () {
            aTextField.value = (void 0);
            aTextField.draw();
            expect(aTextField.element.value).toBe("");
        });

        it("should display null as an empty string in the element", function () {
            aTextField.value = null;
            aTextField.draw();
            expect(aTextField.element.value).toBe("");
        });

        it("should display a number as a number in the element", function () {
            aTextField.value = 42;
            aTextField.draw();
            expect(aTextField.element.value).toBe("42");
        });
        it("should display a 0 as 0 in the element", function () {
            aTextField.value = 0;
            aTextField.draw();
            expect(aTextField.element.value).toEqual("0");
        });

        it("should display the toString() result of an object in the element", function () {
            aTextField.value = {
                toString: function () {
                    return "foo";
                }
            };

            aTextField.draw();
            expect(aTextField.element.value).toBe("foo");
        });

        it("should draw a placeholder when set", function () {
            aTextField.placeholderValue = "a placeholder text";

            aTextField.draw();

            expect(aTextField.element.getAttribute("placeholder")).toBe("a placeholder text");
        });

        it("should not draw a placeholder when not set", function () {
            aTextField.draw();

            expect(aTextField.element.hasAttribute("placeholder")).toBeFalsy();
        });
    });

    describe("events", function () {
        var TextField = AbstractTextField.specialize( {}),
            aTextField, anElement, listener;

        beforeEach(function () {
            aTextField = new TextField();
            anElement = MockDOM.element();
            listener = {
                handleEvent: function () {}
            };
        });

        it("should listen for element input after enterDocument", function () {
            aTextField.element = anElement;
            aTextField.enterDocument(true);

            expect(aTextField.element.hasEventListener("input", aTextField)).toBe(true);
        });

        it("should listen for element change after enterDocument", function () {
            aTextField.element = anElement;
            aTextField.enterDocument(true);

            expect(aTextField.element.hasEventListener("change", aTextField)).toBe(true);
        });

        it("should listen for keyPress only after prepareForActivationEvents", function () {
            var listeners,
                em = aTextField.eventManager;

            listeners = em.registeredEventListenersForEventType_onTarget_("keyPress", aTextField._keyComposer);

            expect(listeners).toBeNull();

            aTextField.prepareForActivationEvents();

            listeners = em.registeredEventListenersForEventType_onTarget_("keyPress", aTextField._keyComposer);
            expect(listeners[aTextField.uuid].listener).toBe(aTextField);
        });

        describe("once prepareForActivationEvents is called", function () {
            beforeEach(function () {
                aTextField.prepareForActivationEvents();
            });

            it("should fire an 'action' event when the KeyComposer fires a keyPress", function () {
                var callback = jasmine.createSpy().andCallFake(function (event) {
                    expect(event.type).toEqual("action");
                }),
                anEvent = MockDOM.keyPressEvent("enter", aTextField.element);
                anEvent.keyComposer = aTextField._keyComposer;

                aTextField.addEventListener("action", callback, false);
                aTextField.handleKeyPress(anEvent);

                expect(callback).toHaveBeenCalled();
            });

            it("should fire an 'action' event with the contents of the detail property", function () {
                var callback = jasmine.createSpy().andCallFake(function (event) {
                    expect(event.detail.get("foo")).toEqual("bar");
                }),
                anEvent = MockDOM.keyPressEvent("enter", aTextField.element);
                anEvent.keyComposer = aTextField._keyComposer;

                aTextField.addEventListener("action", callback, false);
                aTextField.detail.set("foo", "bar");

                aTextField.handleKeyPress(anEvent);

                expect(callback).toHaveBeenCalled();
            });
        });
    });

    describe("delegate methods", function () {
        var TextField = AbstractTextField.specialize( {}),
            aTextField, aTextFieldDelegate;

        beforeEach(function () {
            aTextField = new TextField();
            aTextField.element = MockDOM.element();
            aTextFieldDelegate = {};
            aTextField.delegate = aTextFieldDelegate;
        });

        describe("shouldBeginEditing", function () {
            beforeEach(function () {
                aTextFieldDelegate.shouldBeginEditing = jasmine.createSpy();
            });

            it("should be called when acceptsActiveTarget consulted ", function () {
                var accepts = aTextField.acceptsActiveTarget;
                expect(aTextFieldDelegate.shouldBeginEditing).toHaveBeenCalled();
            });

            it("should be ignored if it returns undefined", function () {
                aTextFieldDelegate.shouldBeginEditing.andReturn(void 0);
                var accepts = aTextField.acceptsActiveTarget;
                expect(accepts).toBeTruthy();
            });

            it("should be able to return false", function () {
                aTextFieldDelegate.shouldBeginEditing.andReturn(false);
                var accepts = aTextField.acceptsActiveTarget;
                expect(accepts).toBeFalsy();
            });

            it("should be able to return true", function () {
                aTextFieldDelegate.shouldBeginEditing.andReturn(true);
                var accepts = aTextField.acceptsActiveTarget;
                expect(accepts).toBeTruthy();
            });
        });

        describe("didChange", function () {
            beforeEach(function () {
                aTextFieldDelegate.didChange = jasmine.createSpy();
            });

            it("should be ", function () {
                aTextField.handleChange();
                expect(aTextFieldDelegate.didChange).toHaveBeenCalled();
            });
        });

        describe("didBeginEditing", function () {
            beforeEach(function () {
                aTextFieldDelegate.didBeginEditing = jasmine.createSpy();
            });

            it("should be called when textfield is focused", function () {
                aTextField.willBecomeActiveTarget();
                expect(aTextFieldDelegate.didBeginEditing).toHaveBeenCalled();
            });
        });

        describe("shouldEndEditing", function () {
            beforeEach(function () {
                aTextFieldDelegate.shouldEndEditing = jasmine.createSpy();
                aTextField.willBecomeActiveTarget();
            });

            it("should be called when textfield receives blur", function () {
                aTextField.surrendersActiveTarget();
                expect(aTextFieldDelegate.shouldEndEditing).toHaveBeenCalled();
            });

            it("should be ignored if it returns undefined", function () {
                aTextFieldDelegate.shouldEndEditing.andReturn(void 0);
                aTextField.surrendersActiveTarget();
                expect(aTextField.hasFocus).toBeFalsy();
            });

            it("should be prevent textfield being unfocused if it returns false", function () {
                aTextFieldDelegate.shouldEndEditing.andReturn(false);
                aTextField.surrendersActiveTarget();
                expect(aTextField.hasFocus).toBeTruthy();
            });

            it("should not be prevent textfield being unfocused if it returns true", function () {
                aTextFieldDelegate.shouldEndEditing.andReturn(true);
                aTextField.surrendersActiveTarget();
                expect(aTextField.hasFocus).toBeFalsy();
            });

        });

        describe("didEndEditing", function () {
            beforeEach(function () {
                aTextFieldDelegate.didEndEditing = jasmine.createSpy();
            });

            it("should be called when textfield receives blur", function () {
                aTextField.surrendersActiveTarget();
                expect(aTextFieldDelegate.didEndEditing).toHaveBeenCalled();
            });
        });
   });
    describe("blueprint", function () {
        it("can be created", function () {
            var blueprintPromise = AbstractTextField.blueprint;
            return blueprintPromise.then(function (blueprint) {
                expect(blueprint).not.toBeNull();
            });
        });
    });
});
