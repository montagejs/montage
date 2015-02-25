var Montage = require("montage").Montage;
var AbstractButton = require("montage/ui/base/abstract-button").AbstractButton;
var MockDOM = require("mocks/dom");

AbstractButton.prototype.hasTemplate = false;

describe("test/base/abstract-button-spec", function () {
    describe("creation", function () {
        it("cannot be instantiated directly", function () {
            expect(function () {
                new AbstractButton();
            }).toThrow();
        });
        it("can be instantiated as a subtype", function () {
            var ButtonSubtype = AbstractButton.specialize( {});
            var aButtonSubtype;
            expect(function () {
                aButtonSubtype = new ButtonSubtype();
            }).not.toThrow();
            expect(aButtonSubtype).toBeDefined();
        });
    });
    describe("properties", function () {
        var Button = AbstractButton.specialize( {}),
            aButton;
        beforeEach(function () {
            aButton = new Button();
            aButton.element = MockDOM.element();
        });
        it("should keep the press composer's longPressThreshold in sync with holdThreshold", function () {
            aButton.holdThreshold = 10;
            expect(aButton._pressComposer.longPressThreshold).toEqual(10);
        });
        describe("label", function () {
            it("is writable", function () {
                aButton.label = "hello";
                expect(aButton.label).toEqual( "hello");
            });
            it("should accept falsy values", function () {
                aButton.label = false;
                expect(aButton.label).toEqual("false");
                aButton.label = 0;
                expect(aButton.label).toEqual("0");
                aButton.label = "";
                expect(aButton.label).toEqual("");
            });
            it("should update the value if isInputElement is true", function () {
                aButton.isInputElement = true;
                aButton.label = "hello";
                aButton.draw();
                expect(aButton.element.value).toEqual( "hello");
            });
        });
        describe("draw", function () {
            var Button = AbstractButton.specialize( {}),
                aButton;
            beforeEach(function () {
                aButton = new Button();
                aButton.element = MockDOM.element();
            });

            it("should be requested after enabled state is changed", function () {
                aButton.enabled = ! aButton.enabled;
                expect(aButton.needsDraw).toBeTruthy();
            });
            it("should be requested after label is changed", function () {
                aButton.label = "random";
                expect(aButton.needsDraw).toBeTruthy();
            });
            it("should be requested after label is changed", function () {
                aButton.active = true;
                expect(aButton.needsDraw).toBeTruthy();
            });
            it("should be requested after label is changed", function () {
                aButton.preventFocus = true;
                expect(aButton.needsDraw).toBeTruthy();
            });
        });
        describe("disabled property", function () {
            var Button = AbstractButton.specialize( {}),
                aButton;
            beforeEach(function () {
                aButton = new Button();
                aButton.element = MockDOM.element();
                aButton.element.tagName = "INPUT";
                aButton.originalElement = aButton.element;
            });
            it("should be enabled after the corresponding property change", function () {
                aButton.enabled = true;
                aButton.enterDocument(true);
                aButton.draw();
                expect(aButton.element.disabled).toBeFalsy();
            });
            it("should be disabled after the corresponding property change", function () {
                aButton.enabled = false;
                aButton.enterDocument(true);
                aButton.draw();
                expect(aButton.element.disabled).toBeTruthy();
            });
        });
        describe("active target", function () {
            var Button = AbstractButton.specialize( {}),
                aButton, anElement;
            beforeEach(function () {
                aButton = new Button();
                anElement = MockDOM.element();
            });
            it("should set tabindex if needed", function () {
                anElement.tagName = "DIV";
                spyOn(anElement, "setAttribute");
                spyOn(anElement, "removeAttribute");

                aButton.element = anElement;
                aButton.draw();
                expect(anElement.setAttribute).toHaveBeenCalledWith("tabindex", "-1");
                aButton.preventFocus = true;
                aButton.draw();
                expect(anElement.removeAttribute).toHaveBeenCalledWith("tabindex");
            });
            it("shouldn't set tabindex if not needed", function () {
                anElement.tagName = "BUTTON";
                spyOn(anElement, "setAttribute");

                aButton.element = anElement;
                aButton.draw();
                expect(anElement.setAttribute).not.toHaveBeenCalledWith("tabindex", "-1");
            });
        });

        describe("converter", function () {
            var Button = AbstractButton.specialize( {});
            beforeEach(function () {
                aButton = new Button();
                aButton.element = MockDOM.element();
                aButton.element.tagName = "INPUT";
                aButton.originalElement = aButton.element;
                aButton.element.firstChild = MockDOM.element();
                aButton.converter = {
                    convert: function (v) {
                        return v.replace(/fail/gi, "pass");
                    }
                };
            });
            it("shouldn't go into infinite loop", function () {
                aButton.element.value = "fail";
                aButton.enterDocument(true);
                aButton.draw();
                aButton.label = "FAIL";
                expect(aButton.element.value).toEqual("pass");
            });
        });

        describe("events", function () {
            var Button = AbstractButton.specialize( {}),
                aButton, anElement, listener;
            beforeEach(function () {
                aButton = new Button();
                anElement = MockDOM.element();
                listener = {
                    handleEvent: function () {}
                }
            });
            it("should listen for pressStart only after prepareForActivationEvents", function () {
                var listeners,
                    em = aButton.eventManager;

                listeners = em.registeredEventListenersForEventType_onTarget_("pressStart", aButton._pressComposer);
                expect(listeners).toBeNull();

                aButton.prepareForActivationEvents();

                listeners = em.registeredEventListenersForEventType_onTarget_("pressStart", aButton._pressComposer);
                expect(listeners[aButton.uuid].listener).toBe(aButton);
            });
            it("should listen for longPress on PressComposer on demand", function () {
                var listeners,
                    em = aButton.eventManager;

                listeners = em.registeredEventListenersForEventType_onTarget_("longPress", aButton._pressComposer);
                expect(listeners).toBeNull();

                aButton.addEventListener("longAction", listener, false);

                listeners = em.registeredEventListenersForEventType_onTarget_("longPress", aButton._pressComposer);
                expect(listeners[aButton.uuid].listener).toBe(aButton);
            });
            it("should fires a 'longAction' event when the PressComposer fires a longPress", function () {
                var callback = jasmine.createSpy();
                aButton.addEventListener("longAction", callback, false);
                aButton._pressComposer.dispatchEventNamed("longPress");
                expect(callback).toHaveBeenCalled();
            });
            describe("once prepareForActivationEvents is called", function () {
                beforeEach(function () {
                    aButton.element = anElement;
                    aButton.prepareForActivationEvents();
                });
                it("should fire an 'action' event when the PressComposer fires a pressStart + press", function () {
                    var callback = jasmine.createSpy().andCallFake(function (event) {
                        expect(event.type).toEqual("action");
                    });
                    aButton.addEventListener("action", callback, false);

                    aButton._pressComposer.dispatchEventNamed("pressStart");
                    aButton._pressComposer.dispatchEventNamed("press");

                    expect(callback).toHaveBeenCalled();
                });
                it("shouldn't fire an 'action' event when the PressComposer fires a pressStart + pressCancel", function () {
                    var callback = jasmine.createSpy().andCallFake(function (event) {
                        expect(event.type).toEqual("action");
                    });
                    aButton.addEventListener("action", callback, false);

                    aButton._pressComposer.dispatchEventNamed("pressStart");
                    aButton._pressComposer.dispatchEventNamed("pressCancel");

                    expect(callback).not.toHaveBeenCalled();
                });
                it("should fire an 'action' event with the contents of the detail property", function () {
                     var callback = jasmine.createSpy().andCallFake(function (event) {
                        expect(event.detail.get("foo")).toEqual("bar");
                    });
                    aButton.addEventListener("action", callback, false);

                    aButton.detail.set("foo", "bar");

                    aButton._pressComposer.dispatchEventNamed("pressStart");
                    aButton._pressComposer.dispatchEventNamed("press");

                    expect(callback).toHaveBeenCalled();
                 });
             });
        });
    });
    describe("blueprint", function () {
        it("can be created", function () {
            var blueprintPromise = AbstractButton.blueprint;
            return blueprintPromise.then(function (blueprint) {
                expect(blueprint).not.toBeNull();
            });
        });
    });
});
