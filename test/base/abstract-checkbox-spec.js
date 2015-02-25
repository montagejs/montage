var Montage = require("montage").Montage,
    AbstractCheckbox = require("montage/ui/base/abstract-checkbox").AbstractCheckbox,
    MockDOM = require("mocks/dom");

AbstractCheckbox.hasTemplate = false;

describe("test/base/abstract-checkbox-spec", function () {

    describe("creation", function () {
        it("cannot be instantiated directly", function () {
            expect(function () {
                new AbstractCheckbox();
            }).toThrow();
        });

        it("can be instantiated as a subtype", function () {
            var CheckboxSubtype = AbstractCheckbox.specialize( {});
            var aCheckboxSubtype = null;
            expect(function () {
                aCheckboxSubtype = new CheckboxSubtype();
            }).not.toThrow();
            expect(aCheckboxSubtype).toBeDefined();
        });
    });

    describe("properties", function () {
        var Checkbox = AbstractCheckbox.specialize( {}),
            aCheckbox;

        beforeEach(function () {
            aCheckbox = new Checkbox();
            aCheckbox.element = MockDOM.element();
        });

        describe("checked", function () {
            beforeEach(function () {
                aCheckbox = new Checkbox();
                aCheckbox.element = MockDOM.element();
                aCheckbox.prepareForActivationEvents();
            });

            it("should be false by default", function () {
                expect(aCheckbox.checked).toBe(false);
            });

            it("should be true when the PressComposer fires a pressStart + press", function () {
                aCheckbox._pressComposer.dispatchEventNamed("pressStart");
                aCheckbox._pressComposer.dispatchEventNamed("press");

                expect(aCheckbox.checked).toBe(true);
            });

            it("should be false when the PressComposer fires a pressStart + pressCancel", function () {
                aCheckbox.checked = false;

                aCheckbox._pressComposer.dispatchEventNamed("pressStart");
                aCheckbox._pressComposer.dispatchEventNamed("pressCancel");

                expect(aCheckbox.checked).toBe(false);
            });

            it("should toggle when the PressComposer fires a pressStart + press twice", function () {
                aCheckbox._pressComposer.dispatchEventNamed("pressStart");
                aCheckbox._pressComposer.dispatchEventNamed("press");
                expect(aCheckbox.checked).toBe(true);

                aCheckbox._pressComposer.dispatchEventNamed("pressStart");
                aCheckbox._pressComposer.dispatchEventNamed("press");
                expect(aCheckbox.checked).toBe(false);
            });

            it("should add the corresponding class name to classList when checked", function () {
                aCheckbox.checked = true;

                expect(aCheckbox.classList.contains("montage-Checkbox--checked")).toBe(true);
            });
        });

        describe("enabled", function () {
            beforeEach(function () {
                aCheckbox = new Checkbox();
                aCheckbox.element = MockDOM.element();
                aCheckbox.checked = false;
                aCheckbox.prepareForActivationEvents();
            });

            it("should not get checked when enabled is false and PressComposer fires a press", function () {
                aCheckbox.enabled = false;

                aCheckbox._pressComposer.dispatchEventNamed("pressStart");
                aCheckbox._pressComposer.dispatchEventNamed("press");

                expect(aCheckbox.checked).toBe(false);
            });

            it("should not dispatch an action event when enabled is false and PressComposer fires a press", function () {
                var callback = jasmine.createSpy().andCallFake(function (event) {
                    expect(event.type).toEqual("action");
                });
                aCheckbox.addEventListener("action", callback, false);
                aCheckbox.enabled = false;

                aCheckbox._pressComposer.dispatchEventNamed("pressStart");
                aCheckbox._pressComposer.dispatchEventNamed("press");

                expect(callback).not.toHaveBeenCalled();
            });

            it("should add the corresponding class name to classList when enabled is false", function () {
                aCheckbox.enabled = false;

                expect(aCheckbox.classList.contains("montage--disabled")).toBe(true);
            });
        });

        describe("active", function () {
            beforeEach(function () {
                aCheckbox = new Checkbox();
                aCheckbox.element = MockDOM.element();
                aCheckbox.checked = false;
                aCheckbox.prepareForActivationEvents();
            });

            it("should be true when the PressComposer fires a pressStart", function () {
                aCheckbox._pressComposer.dispatchEventNamed("pressStart");
                expect(aCheckbox.active).toBe(true);
            });

            it("should be false when the PressComposer fires a pressStart + press", function () {
                aCheckbox._pressComposer.dispatchEventNamed("pressStart");
                aCheckbox._pressComposer.dispatchEventNamed("press");
                expect(aCheckbox.active).toBe(false);
            });

            it("should be false when the PressComposer fires a pressStart + press while checked", function () {
                aCheckbox.checked = true;

                aCheckbox._pressComposer.dispatchEventNamed("pressStart");
                aCheckbox._pressComposer.dispatchEventNamed("press");

                expect(aCheckbox.active).toBe(false);
            });

            it("should be false when the PressComposer fires a pressStart + pressCancel", function () {
                aCheckbox._pressComposer.dispatchEventNamed("pressStart");
                aCheckbox._pressComposer.dispatchEventNamed("pressCancel");
                expect(aCheckbox.active).toBe(false);
            });

            it("should add the corresponding class name to classList when active", function () {
                aCheckbox.active = true;

                expect(aCheckbox.classList.contains("montage--active")).toBe(true);
            });
        });
    });

    describe("draw", function () {
        var Checkbox = AbstractCheckbox.specialize( {}),
            aCheckbox;

        beforeEach(function () {
            aCheckbox = new Checkbox();
            aCheckbox.element = MockDOM.element();
        });

        it("should be requested after enabled state is changed", function () {
            aCheckbox.enabled = ! aCheckbox.enabled;
            expect(aCheckbox.needsDraw).toBeTruthy();
        });
        it("should be requested after active is changed", function () {
            aCheckbox.active = true;
            expect(aCheckbox.needsDraw).toBeTruthy();
        });
    });

    describe("events", function () {
        var Checkbox = AbstractCheckbox.specialize( {}),
            aCheckbox, anElement, listener;

        beforeEach(function () {
            aCheckbox = new Checkbox();
            anElement = MockDOM.element();
            listener = {
                handleEvent: function () {}
            };
        });

        it("should listen for press only after prepareForActivationEvents", function () {
            var listeners,
                em = aCheckbox.eventManager;

            listeners = em.registeredEventListenersForEventType_onTarget_("press", aCheckbox);

            expect(listeners).toBeNull();

            aCheckbox.prepareForActivationEvents();

            listeners = em.registeredEventListenersForEventType_onTarget_("press", aCheckbox._pressComposer);
            expect(listeners[aCheckbox.uuid].listener).toBe(aCheckbox);
        });

        describe("once prepareForActivationEvents is called", function () {
            beforeEach(function () {
                aCheckbox.prepareForActivationEvents();
            });
            it("should fire an 'action' event when the PressComposer fires a pressStart + press", function () {
                var callback = jasmine.createSpy().andCallFake(function (event) {
                    expect(event.type).toEqual("action");
                });
                aCheckbox.addEventListener("action", callback, false);

                aCheckbox._pressComposer.dispatchEventNamed("pressStart");
                aCheckbox._pressComposer.dispatchEventNamed("press");

                expect(callback).toHaveBeenCalled();
            });

            it("should not fire an 'action' event when the PressComposer fires a pressStart + pressCancel", function () {
                var callback = jasmine.createSpy().andCallFake(function (event) {
                    expect(event.type).toEqual("action");
                });
                aCheckbox.addEventListener("action", callback, false);

                aCheckbox._pressComposer.dispatchEventNamed("pressStart");
                aCheckbox._pressComposer.dispatchEventNamed("pressCancel");

                expect(callback).not.toHaveBeenCalled();
            });

            it("should fire an 'action' event with the contents of the detail property", function () {
                var callback = jasmine.createSpy().andCallFake(function (event) {
                    expect(event.detail.get("foo")).toEqual("bar");
                });
                aCheckbox.addEventListener("action", callback, false);
                aCheckbox.detail.set("foo", "bar");

                aCheckbox._pressComposer.dispatchEventNamed("pressStart");
                aCheckbox._pressComposer.dispatchEventNamed("press");

                expect(callback).toHaveBeenCalled();
            });
        });
    });

    describe("aria", function () {
        var Checkbox = Montage.create(AbstractCheckbox, {}),
            aCheckbox;

        beforeEach(function () {
            aCheckbox = Checkbox.create();
            aCheckbox.element = MockDOM.element();
        });

        it("should have the checkbox role", function () {
            aCheckbox.enterDocument(true);

            expect(aCheckbox.element.getAttribute("role")).toBe("checkbox");
        });

        it("should have aria-checked set to true when it is checked", function () {
            aCheckbox.checked = true;
            aCheckbox.draw();

            expect(aCheckbox.element.getAttribute("aria-checked")).toBe("true");
        });

        it("should have aria-checked set to false when it is not checked", function () {
            aCheckbox.checked = false;
            aCheckbox.draw();

            expect(aCheckbox.element.getAttribute("aria-checked")).toBe("false");
        });
    });
    describe("blueprint", function () {
        it("can be created", function () {
            var blueprintPromise = AbstractCheckbox.blueprint;
            return blueprintPromise.then(function (blueprint) {
                expect(blueprint).not.toBeNull();
            });
        });
    });
});
