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
        it("should maintain disabled as the opposite of enabled", function () {
            aButton.enabled = true;
            expect(aButton.disabled).toBeFalsy();
            aButton.disabled = true;
            expect(aButton.enabled).toBeFalsy();
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
                expect(aButton.value).toEqual( "hello");
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

        describe("events", function () {
            var Button = AbstractButton.specialize( {}),
                aButton, anElement, listener;
            beforeEach(function () {
                aButton = new Button();
                anElement = MockDOM.element();
                listener = {
                    handleEvent: function() {}
                }
            });
            it("should listen for pressStart only after prepareForActivationEvents", function() {
                var listeners,
                    em = aButton.eventManager;

                listeners = em.registeredEventListenersForEventType_onTarget_("pressStart", aButton._pressComposer);
                expect(listeners).toBeNull();

                aButton.prepareForActivationEvents();

                listeners = em.registeredEventListenersForEventType_onTarget_("pressStart", aButton._pressComposer);
                expect(listeners[aButton.uuid].listener).toBe(aButton);
            });
            it("should listen for longPress on PressComposer on demand", function() {
                var listeners,
                    em = aButton.eventManager;

                listeners = em.registeredEventListenersForEventType_onTarget_("longPress", aButton._pressComposer);
                expect(listeners).toBeNull();

                aButton.addEventListener("longAction", listener, false);

                listeners = em.registeredEventListenersForEventType_onTarget_("longPress", aButton._pressComposer);
                expect(listeners[aButton.uuid].listener).toBe(aButton);
            });
            it("should fires a 'longAction' event when the PressComposer fires a longPress", function() {
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
                it("should fire an 'action' event when the PressComposer fires a pressStart + press", function() {
                    var callback = jasmine.createSpy().andCallFake(function(event) {
                        expect(event.type).toEqual("action");
                    });
                    aButton.addEventListener("action", callback, false);

                    aButton._pressComposer.dispatchEventNamed("pressStart");
                    aButton._pressComposer.dispatchEventNamed("press");

                    expect(callback).toHaveBeenCalled();
                });
                it("shouldn't fire an 'action' event when the PressComposer fires a pressStart + pressCancel", function() {
                    var callback = jasmine.createSpy().andCallFake(function(event) {
                        expect(event.type).toEqual("action");
                    });
                    aButton.addEventListener("action", callback, false);

                    aButton._pressComposer.dispatchEventNamed("pressStart");
                    aButton._pressComposer.dispatchEventNamed("pressCancel");

                    expect(callback).not.toHaveBeenCalled();
                });
                it("should fire an 'action' event with the contents of the detail property", function() {
                     var callback = jasmine.createSpy().andCallFake(function(event) {
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
});


//TestPageLoader.queueTest("button-test", function(testPage) {
//    var test;
//    beforeEach(function() {
//        test = testPage.test;
//    });
//
//    var click = function(component, el, fn) {
//        el = el || component.element;
//
//        var listener = testPage.addListener(component, fn);
//        testPage.clickOrTouch({target: el});
//        // Return this so that it can be checked in tha calling function.
//        return listener;
//    };
//    var testButton = function(component, value) {
//        expect(component).toBeDefined();
//        expect(click(component)).toHaveBeenCalled();
//        expect(component.label).toBe(value);
//    };
//
//    describe("test/button/button-spec", function() {
//
//        describe("button", function(){
//
//            it("can be created from a div element", function(){
//                testButton(test.divbutton, "div button");
//            });
//            it("can be created from an input element", function(){
//                testButton(test.inputbutton, "input button");
//            });
//            it("can be created from a button element", function(){
//                testButton(test.buttonbutton, "button button");
//            });
//
//            it("fires a 'hold' event when the button is pressed for a long time", function() {
//                var el = test.inputbutton.element;
//                var holdListener = testPage.addListener(test.inputbutton, null, "hold");
//                var actionListener = testPage.addListener(test.inputbutton, null, "action");
//
//                testPage.mouseEvent({target: el}, "mousedown");
//
//                waits(1010);
//                runs(function() {
//                    testPage.mouseEvent({target: el}, "mouseup");
//                    testPage.mouseEvent({target: el}, "click");
//
//                    expect(holdListener).toHaveBeenCalled();
//                    expect(actionListener).not.toHaveBeenCalled();
//                });
//            });
//
//            describe("disabled property", function(){
//                it("is taken from the element's disabled attribute", function() {
//                    expect(test.disabledbutton.disabled).toBe(true);
//                    expect(click(test.disabledbutton)).not.toHaveBeenCalled();
//                    expect(test.disabledinput.disabled).toBe(true);
//                    expect(click(test.disabledinput)).not.toHaveBeenCalled();
//                    expect(test.inputbutton.disabled).toBe(false);
//                });
//                it("can be set", function(){
//                    expect(test.disabledbutton.disabled).toBe(true);
//                    test.disabledbutton.disabled = false;
//                    expect(test.disabledbutton.disabled).toBe(false);
//                    // TODO click the button and check that it wasn't pressed
//
//                    expect(test.disabledinput.disabled).toBe(true);
//                    test.disabledinput.disabled = false;
//                    expect(test.disabledinput.disabled).toBe(false);
//                    // TODO click the button and check that it wasn't pressed
//                });
//                it("can can be set in the serialization", function(){
//                    expect(test.disabledinputszn.disabled).toBe(true);
//                    // TODO check button pressibility
//                });
//                it("is the inverse of the enabled property", function(){
//                    expect(test.enabledinputszn.disabled).toBe(false);
//                    expect(test.enabledinputszn.enabled).toBe(true);
//                    test.enabledinputszn.enabled = false;
//                    expect(test.enabledinputszn.disabled).toBe(true);
//                    expect(test.enabledinputszn.enabled).toBe(false);
//                    // TODO click the button and check that it wasn't pressed
//                });
//            });
//
//            describe("label property", function() {
//                it("is set from the serialization on a button", function() {
//                    expect(test.buttonlabelszn.label).toBe("pass");
//                    testPage.waitForDraw();
//                    runs(function(){
//                        expect(test.buttonlabelszn.element.firstChild.data).toBe("pass");
//                    });
//                });
//                it("is set from the serialization on an input", function() {
//                    expect(test.inputlabelszn.label).toBe("pass");
//                    expect(test.inputlabelszn.element.value).toBe("pass");
//                });
//                it("sets the value on an input", function() {
//                    expect(test.inputbutton.label).toBe("input button");
//                    test.inputbutton.label = "label pass";
//                    expect(test.inputbutton.label).toBe("label pass");
//                    expect(test.inputbutton.value).toBe("label pass");
//                    test.inputbutton.label = "input button";
//                });
//                it("sets the first child on a non-input element", function() {
//                    expect(test.buttonbutton.label).toBe("button button");
//                    test.buttonbutton.label = "label pass";
//                    expect(test.buttonbutton.label).toBe("label pass");
//
//                    testPage.waitForDraw();
//                    runs(function(){
//                        expect(test.buttonbutton.element.firstChild.data).toBe("label pass");
//                        test.buttonbutton.label = "button button";
//                    });
//                });
//            });
//
//            describe("value property", function() {
//                it("is set from the value on an input", function() {
//                    expect(test.inputbutton.element.value).toBe("input button");
//                    expect(test.inputbutton.value).toBe("input button");
//                });
//                it("is set by the label property in the serialization", function() {
//                    expect(test.inputlabelszn.label).toBe("pass");
//                    //expect(test.inputlabelszn.value).toBe("pass");
//                });
//                it("sets the label property when using an input element", function() {
//                    expect(test.inputbutton.label).toBe("input button");
//                    test.inputbutton.value = "value pass";
//                    expect(test.inputbutton.value).toBe("value pass");
//                    expect(test.inputbutton.label).toBe("value pass");
//                    test.inputbutton.value = "input button";
//                });
//                it("doesn't set the label property when using a non-input element", function() {
//                    expect(test.buttonbutton.label).toBe("button button");
//                    test.buttonbutton.value = "value fail";
//                    expect(test.buttonbutton.label).toBe("button button");
//                    testPage.waitForDraw();
//                    runs(function(){
//                        expect(test.buttonbutton.element.firstChild.data).toBe("button button");
//                        test.buttonbutton.value = "button button";
//                    });
//                });
//
//            });
//
//
//            describe("action event detail property", function() {
//                var detailButton, testHandler;
//                beforeEach(function() {
//                    detailButton = test.detailbutton;
//                    testHandler = {
//                        handler: function(event) {
//                            testHandler.event = event;
//                        },
//                        event: null,
//                        valueToBeBound: "aValue"
//                    };
//                });
//                it("is undefined if not used", function() {
//                    spyOn(testHandler, 'handler').andCallThrough();
//                    detailButton.addEventListener("action", testHandler.handler, false);
//
//                    testPage.clickOrTouch({target: detailButton.element});
//                    expect(testHandler.handler).toHaveBeenCalled();
//                    expect(testHandler.event.detail).toBeNull();
//                });
//                it("is is populated if used in a binding", function() {
//                    spyOn(testHandler, 'handler').andCallThrough();
//                    detailButton.addEventListener("action", testHandler.handler, false);
//                    Bindings.defineBinding(detailButton, "detail.get('prop')", {
//                        "<->": "valueToBeBound",
//                        "source": testHandler
//                    });
//
//                    testPage.clickOrTouch({target: detailButton.element});
//                    expect(testHandler.handler).toHaveBeenCalled();
//                    expect(testHandler.event.detail.get("prop")).toEqual(testHandler.valueToBeBound);
//                    //cleanup
//                    Bindings.cancelBindings(detailButton);
//                });
//                it("is is populated if used programatically", function() {
//                    spyOn(testHandler, 'handler').andCallThrough();
//                    detailButton.addEventListener("action", testHandler.handler, false);
//                    detailButton.detail.set("prop2", "anotherValue");
//
//                    testPage.clickOrTouch({target: detailButton.element});
//                    expect(testHandler.handler).toHaveBeenCalled();
//                    expect(testHandler.event.detail.get("prop2")).toEqual("anotherValue");
//                });
//            });
//
//
//            it("responds when child elements are clicked on", function(){
//                expect(click(test.buttonnested, test.buttonnested.element.firstChild)).toHaveBeenCalled();
//            });
//
//            it("supports converters for label", function(){
//                test.converterbutton.label = "pass";
//                expect(test.converterbutton.label).toBe("PASS");
//                testPage.waitForDraw();
//                runs(function(){
//                    expect(test.converterbutton.element.value).toBe("PASS");
//                });
//            });
//
//            // TODO should be transplanted to the press-composer-spec
//            // it("correctly releases the pointer", function() {
//            //     var l = testPage.addListener(test.scroll_button);
//
//            //     testpage.mouseEvent({target: test.scroll_button.element}, "mousedown");;
//            //     expect(test.scroll_button.active).toBe(true);
//            //     test.scroll_button.surrenderPointer(test.scroll_button._observedPointer, null);
//            //     expect(test.scroll_button.active).toBe(false);
//            //     testPage.mouseEvent({target: test.scroll_button.element}, "mouseup");;
//
//            //     expect(l).not.toHaveBeenCalled();
//
//            // });
//
//            if (window.Touch) {
//
//                describe("when supporting touch events", function() {
//
//                    it("should dispatch an action event when a touchend follows a touchstart on a button", function() {
//
//                    });
//
//                });
//
//            } else {
//
//                describe("when supporting mouse events", function() {
//                    it("dispatches an action event when a mouseup follows a mousedown", function() {
//                        expect(click(test.inputbutton)).toHaveBeenCalled();
//                    });
//
//                    it("does not dispatch an action event when a mouseup occurs after not previously receiving a mousedown", function() {
//                        // reset interaction
//                        // test.inputbutton._endInteraction();
//                        var l = testPage.addListener(test.inputbutton);
//                        testPage.mouseEvent({target: test.inputbutton.element}, "mouseup");;
//                        expect(l).not.toHaveBeenCalled();
//                    });
//
//                    it("does not dispatch an action event when a mouseup occurs away from the button after a mousedown on a button", function() {
//                        var l = testPage.addListener(test.inputbutton);
//
//                        testpage.mouseEvent({target: test.inputbutton.element}, "mousedown");;
//                        // Mouse up somewhere else
//                        testPage.mouseEvent({target: test.divbutton.element}, "mouseup");;
//
//                        expect(l).not.toHaveBeenCalled();
//                    });
//                });
//            }
//
//            var testButton = function(component, value) {
//                expect(component).toBeDefined();
//                expect(click(component)).toHaveBeenCalled();
//                expect(component.label).toBe(value);
//            };
//
//            describe("inside a scroll view", function() {
//                it("fires an action event when clicked", function() {
//                    testButton(test.scroll_button, "scroll button");
//                });
//                it("doesn't fire an action event when scroller is dragged", function() {
//                    var el = test.scroll_button.element;
//                    var scroll_el = test.scroll.element;
//
//                    var listener = testPage.addListener(test.scroll_button);
//
//                    var press_composer = test.scroll_button.composerList[0];
//
//                    // mousedown
//                    testPage.mouseEvent({target: el}, "mousedown");
//
//                    expect(test.scroll_button.active).toBe(true);
//                    expect(test.scroll_button.eventManager.isPointerClaimedByComponent(press_composer._observedPointer, press_composer)).toBe(true);
//
//                    // Mouse move doesn't happen instantly
//                    waits(10);
//                    runs(function() {
//                        // mouse move up
//                        var moveEvent = document.createEvent("MouseEvent");
//                        // Dispatch to scroll view, but use the coordinates from the
//                        // button
//                        moveEvent.initMouseEvent("mousemove", true, true, scroll_el.view, null,
//                                el.offsetLeft, el.offsetTop - 100,
//                                el.offsetLeft, el.offsetTop - 100,
//                                false, false, false, false,
//                                0, null);
//                        scroll_el.dispatchEvent(moveEvent);
//
//                        expect(test.scroll_button.active).toBe(false);
//                        expect(test.scroll_button.eventManager.isPointerClaimedByComponent(press_composer._observedPointer, press_composer)).toBe(false);
//
//                        // mouse up
//                        testPage.mouseEvent({target: el}, "mouseup");;
//
//                        expect(listener).not.toHaveBeenCalled();
//                    });
//
//                });
//            });
//
//        });
//    });
//});
