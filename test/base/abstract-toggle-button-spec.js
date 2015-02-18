var Montage = require("montage").Montage;
var AbstractToggleButton = require("montage/ui/base/abstract-toggle-button").AbstractToggleButton;
var MockDOM = require("mocks/dom");

AbstractToggleButton.prototype.hasTemplate = false;

describe("test/base/abstract-toggle-button-spec", function () {
    describe("creation", function () {
        it("cannot be instantiated directly", function () {
            expect(function () {
                new AbstractToggleButton();
            }).toThrow();
        });

        it("can be instantiated as a subtype", function () {
            var ToggleButtonSubtype = AbstractToggleButton.specialize( {});
            var aToggleButtonSubtype;
            expect(function () {
                aToggleButtonSubtype = new ToggleButtonSubtype();
            }).not.toThrow();
            expect(aToggleButtonSubtype).toBeDefined();
        });
    });

    describe("properties", function () {
        var ToggleButton = AbstractToggleButton.specialize( {}),
            aToggleButton;

        beforeEach(function () {
            aToggleButton = new ToggleButton();
            aToggleButton.element = MockDOM.element();
        });

        it("should keep the press composer's longPressThreshold in sync with holdThreshold", function () {
            aToggleButton.holdThreshold = 10;
            expect(aToggleButton._pressComposer.longPressThreshold).toEqual(10);
        });

        describe("enabled", function () {
            beforeEach(function () {
                aToggleButton = new ToggleButton();
                aToggleButton.element = MockDOM.element();
                aToggleButton.prepareForActivationEvents();
            });

            it("should not toggle when enabled is false and PressComposer fires a press", function () {
                aToggleButton.pressed = false;
                aToggleButton.enabled = false;

                aToggleButton._pressComposer.dispatchEventNamed("pressStart");
                aToggleButton._pressComposer.dispatchEventNamed("press");

                expect(aToggleButton.pressed).toBe(false);
            });

            it("should not dispatch an action event when enabled is false and PressComposer fires a press", function () {
                var callback = jasmine.createSpy().andCallFake(function (event) {
                    expect(event.type).toEqual("action");
                });
                aToggleButton.addEventListener("action", callback, false);
                aToggleButton.pressed = false;
                aToggleButton.enabled = false;

                aToggleButton._pressComposer.dispatchEventNamed("pressStart");
                aToggleButton._pressComposer.dispatchEventNamed("press");

                expect(callback).not.toHaveBeenCalled();
            });

            it("should add the corresponding class name to classList when enabled is false", function () {
                aToggleButton.enabled = false;

                expect(aToggleButton.classList.contains("montage--disabled")).toBe(true);
            });
        });

        describe("pressedLabel", function () {
            it("is writable", function () {
                aToggleButton.pressedLabel = "hello";
                expect(aToggleButton.pressedLabel).toEqual( "hello");
            });

            it("should accept falsy values", function () {
                aToggleButton.pressedLabel = false;
                expect(aToggleButton.pressedLabel).toEqual("false");
                aToggleButton.pressedLabel = 0;
                expect(aToggleButton.pressedLabel).toEqual("0");
                aToggleButton.pressedLabel = "";
                expect(aToggleButton.pressedLabel).toEqual("");
            });
        });

        describe("unpressedLabel", function () {
            it("is writable", function () {
                aToggleButton.unpressedLabel = "hello";
                expect(aToggleButton.unpressedLabel).toEqual( "hello");
            });

            it("should accept falsy values", function () {
                aToggleButton.unpressedLabel = false;
                expect(aToggleButton.unpressedLabel).toEqual("false");
                aToggleButton.unpressedLabel = 0;
                expect(aToggleButton.unpressedLabel).toEqual("0");
                aToggleButton.unpressedLabel = "";
                expect(aToggleButton.unpressedLabel).toEqual("");
            });
        });

        describe("pressed", function () {
            beforeEach(function () {
                aToggleButton = new ToggleButton();
                aToggleButton.element = MockDOM.element();
                aToggleButton.prepareForActivationEvents();
            });

            it("should toggle when enabled is true and PressComposer fires a press", function () {
                aToggleButton.pressed = false;
                aToggleButton.enabled = true;

                aToggleButton._pressComposer.dispatchEventNamed("pressStart");
                aToggleButton._pressComposer.dispatchEventNamed("press");

                expect(aToggleButton.pressed).toBe(true);
            });

            it("should not toggle when enabled is false and PressComposer fires a press", function () {
                aToggleButton.pressed = false;
                aToggleButton.enabled = false;

                aToggleButton._pressComposer.dispatchEventNamed("pressStart");
                aToggleButton._pressComposer.dispatchEventNamed("press");

                expect(aToggleButton.pressed).toBe(false);
            });

            it("should add the corresponding class name to classList when enabled is false", function () {
                aToggleButton.pressed = true;

                expect(aToggleButton.classList.contains("montage-ToggleButton--pressed")).toBe(true);
            });
        });
    });

    describe("draw", function () {
        var ToggleButton = AbstractToggleButton.specialize( {}),
            aToggleButton;

        beforeEach(function () {
            aToggleButton = new ToggleButton();
            aToggleButton.element = MockDOM.element();
            aToggleButton.needsDraw = false;
        });

        it("should be requested after enabled state is changed", function () {
            aToggleButton.enabled = ! aToggleButton.enabled;
            expect(aToggleButton.needsDraw).toBeTruthy();
        });

        it("should be requested after toggle state is changed", function () {
            aToggleButton.pressed = ! aToggleButton.pressed;
            expect(aToggleButton.needsDraw).toBeTruthy();
        });

        it("should be requested after unpressedLabel is changed and toggle button is unpressed", function () {
            aToggleButton.pressed = false;
            aToggleButton.needsDraw = false;

            aToggleButton.unpressedLabel = "random";
            expect(aToggleButton.needsDraw).toBeTruthy();
        });

        it("should be requested after pressedLabel is changed and toggle button is pressed", function () {
            aToggleButton.pressed = true;
            aToggleButton.needsDraw = false;

            aToggleButton.pressedLabel = "random";
            expect(aToggleButton.needsDraw).toBeTruthy();
        });

        it("should be requested when active", function () {
            aToggleButton.active = true;
            expect(aToggleButton.needsDraw).toBeTruthy();
        });
    });

    describe("active target", function () {
        var ToggleButton = AbstractToggleButton.specialize( {}),
            aToggleButton, anElement;

        beforeEach(function () {
            aToggleButton = new ToggleButton();
            anElement = MockDOM.element();
        });

        it("should accept active target", function () {
            expect(aToggleButton.acceptsActiveTarget).toBeTruthy();
        });
    });

    describe("events", function () {
        var ToggleButton = AbstractToggleButton.specialize( {}),
            aToggleButton, anElement, listener;

        beforeEach(function () {
            aToggleButton = new ToggleButton();
            anElement = MockDOM.element();
            listener = {
                handleEvent: function () {}
            }
        });

        it("should listen for pressStart only after prepareForActivationEvents", function () {
            var listeners,
                em = aToggleButton.eventManager;

            listeners = em.registeredEventListenersForEventType_onTarget_("pressStart", aToggleButton._pressComposer);
            expect(listeners).toBeNull();

            aToggleButton.prepareForActivationEvents();

            listeners = em.registeredEventListenersForEventType_onTarget_("pressStart", aToggleButton._pressComposer);
            expect(listeners[aToggleButton.uuid].listener).toBe(aToggleButton);
        });

        it("should listen for longPress on PressComposer on demand", function () {
            var listeners,
                em = aToggleButton.eventManager;

            listeners = em.registeredEventListenersForEventType_onTarget_("longPress", aToggleButton._pressComposer);
            expect(listeners).toBeNull();

            aToggleButton.addEventListener("longAction", listener, false);

            listeners = em.registeredEventListenersForEventType_onTarget_("longPress", aToggleButton._pressComposer);
            expect(listeners[aToggleButton.uuid].listener).toBe(aToggleButton);
        });

        describe("once prepareForActivationEvents is called", function () {
            beforeEach(function () {
                aToggleButton.element = anElement;
                aToggleButton.prepareForActivationEvents();
            });

            it("should fire a 'longAction' event when the PressComposer fires a longPress", function () {
                var callback = jasmine.createSpy().andCallFake(function (event) {
                    expect(event.type).toEqual("longAction");
                });
                aToggleButton.addEventListener("longAction", callback, false);
                aToggleButton._pressComposer.dispatchEventNamed("longPress");
                expect(callback).toHaveBeenCalled();
            });

            it("should not fire an 'action' event when enabled is false and PressComposer fires a press", function () {
                var callback = jasmine.createSpy().andCallFake(function (event) {
                    expect(event.type).toEqual("action");
                });
                aToggleButton.addEventListener("action", callback, false);
                aToggleButton.enabled = false;

                aToggleButton._pressComposer.dispatchEventNamed("pressStart");
                aToggleButton._pressComposer.dispatchEventNamed("press");

                expect(callback).not.toHaveBeenCalled();
            });

            it("should fire an 'action' event when enabled is true and PressComposer fires a press", function () {
                var callback = jasmine.createSpy().andCallFake(function (event) {
                    expect(event.type).toEqual("action");
                });
                aToggleButton.addEventListener("action", callback, false);
                aToggleButton.enabled = true;

                aToggleButton._pressComposer.dispatchEventNamed("pressStart");
                aToggleButton._pressComposer.dispatchEventNamed("press");

                expect(callback).toHaveBeenCalled();
            });

            it("should fire an 'action' event with the contents of the detail property", function () {
                var callback = jasmine.createSpy().andCallFake(function (event) {
                    expect(event.detail.get("foo")).toEqual("bar");
                });
                aToggleButton.addEventListener("action", callback, false);

                aToggleButton.detail.set("foo", "bar");

                aToggleButton._pressComposer.dispatchEventNamed("pressStart");
                aToggleButton._pressComposer.dispatchEventNamed("press");

                expect(callback).toHaveBeenCalled();
            });

            it("should toggle on 'space' keyPress", function () {
                var anEvent = MockDOM.keyPressEvent("space", aToggleButton.element);

                aToggleButton.pressed = false;
                aToggleButton.enabled = true;

                aToggleButton.handleKeyPress(anEvent);

                expect(aToggleButton.pressed).toBe(true);
            });
        });
    });
    describe("blueprint", function () {
        it("can be created", function () {
            var blueprintPromise = AbstractToggleButton.blueprint;
            return blueprintPromise.then(function (blueprint) {
                expect(blueprint).not.toBeNull();
            });
        });
    });
});
