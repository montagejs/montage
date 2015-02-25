/*global require,exports,describe,it,expect */
var Montage = require("montage").Montage,
    Component = require("montage/ui/component").Component,
    Overlay = require("montage/ui/overlay.reel").Overlay,
    MockDOM = require("mocks/dom"),
    Event = require("mocks/event"),
    defaultEventManager = require("montage/core/event/event-manager").defaultEventManager;
    defaultKeyManager = require("montage/core/event/key-manager").defaultKeyManager;

describe("ui/overlay-spec", function () {
    var anOverlay;

    beforeEach(function () {
        defaultEventManager._activeTarget = null;
        anOverlay = new Overlay();
        anOverlay.hasTemplate = false;
        anOverlay.element = MockDOM.element();
        anOverlay.modalMaskElement = MockDOM.element();

        anOverlay._firstDraw = false;

        anOverlay.enterDocument(true);
    });

    describe("position calculation", function () {
        it("should use the overlay position property", function () {
            anOverlay.position = {left: 100, top: 100};
            anOverlay._calculatePosition();
            expect(anOverlay._drawPosition).toEqual({left: 100, top: 100});
        });

        it("should calculate the overlay position to be in the middle of the screen when no position hints are given", function () {
            var aWindow = anOverlay.element.ownerDocument.defaultView;

            aWindow.innerWidth = 700;
            aWindow.innerHeight = 600;
            anOverlay.element.offsetWidth = 100;
            anOverlay.element.offsetHeight = 50;

            anOverlay._calculatePosition();
            expect(anOverlay._drawPosition).toEqual({left: 300, top: 275});
        });

        describe("element position", function () {
            it("should find the position of an element with no offset parent", function () {
                var anElement = MockDOM.element(),
                    position;

                anElement.offsetTop = 100;
                anElement.offsetLeft = 200;

                position = anOverlay._getElementPosition(anElement);
                expect(position.top).toBe(100);
                expect(position.left).toBe(200);
            });

            it("should find the position of an element with an offset parent", function () {
                var anElement = MockDOM.element(),
                    anElementParent = MockDOM.element(),
                    position;

                anElement.offsetTop = 100;
                anElement.offsetLeft = 200;
                anElement.offsetParent = anElementParent;
                anElementParent.offsetTop = 2;
                anElementParent.offsetLeft = 3;

                position = anOverlay._getElementPosition(anElement);
                expect(position.top).toBe(102);
                expect(position.left).toBe(203);
            });
        });

        describe("anchor position", function () {
            it("should center the element bellow the anchor", function () {
                var anAnchor = MockDOM.element();

                anAnchor.offsetTop = 100;
                anAnchor.offsetLeft = 200;
                anAnchor.offsetWidth = 100;
                anAnchor.offsetHeight = 100;

                anOverlay.anchor = anAnchor;
                anOverlay.element.offsetWidth = 50;
                anOverlay.element.offsetHeight = 100;
                anOverlay._calculatePosition();

                expect(anOverlay._drawPosition).toEqual({left: 225, top: 200});
            });

            it("should center the element bellow the anchor and bump it to the right because it's left outside the screen", function () {
                var anAnchor = MockDOM.element();

                anAnchor.offsetTop = 100;
                anAnchor.offsetLeft = 0;
                anAnchor.offsetWidth = 100;
                anAnchor.offsetHeight = 100;

                anOverlay.anchor = anAnchor;
                anOverlay.element.offsetWidth = 110;
                anOverlay.element.offsetHeight = 100;
                anOverlay._calculatePosition();

                expect(anOverlay._drawPosition).toEqual({left: 0, top: 200});
            });
        });
    });

    describe("delegate", function () {
        var delegate;
        beforeEach(function () {
            delegate = anOverlay.delegate = {};
        });

        it("should call willPositionOverlay", function () {
            delegate.willPositionOverlay = jasmine.createSpy();

            anOverlay.position = {
                left: 100,
                top: 50
            };

            anOverlay._calculatePosition();

            expect(delegate.willPositionOverlay).toHaveBeenCalledWith(anOverlay, anOverlay.position);
        });

        it("should call didHideOverlay", function () {
            delegate.didHideOverlay = jasmine.createSpy();

            anOverlay._isShown = false;

            anOverlay.willDraw();

            expect(delegate.didHideOverlay).toHaveBeenCalledWith(anOverlay);
        });

        it("should call didShowOverlay", function () {
            delegate.didShowOverlay = jasmine.createSpy();

            anOverlay._isShown = true;
            anOverlay._isDisplayed = false;

            anOverlay.draw();

            expect(delegate.didShowOverlay).toHaveBeenCalledWith(anOverlay);
        });

        describe("shouldDismissOverlay", function () {
            it("should hide the overlay when a pressStart is fired outside the overlay and it returns true", function () {
                delegate.shouldDismissOverlay = jasmine.createSpy().andReturn(true);

                var event = Event.event();

                anOverlay.enterDocument(true);

                anOverlay._isShown = true;
                anOverlay._isDisplayed = true;
                event.target = anOverlay;
                event.target = MockDOM.element();
                anOverlay._pressComposer._dispatchPressStart(event);
                expect(anOverlay._isShown).toBe(false);

                expect(delegate.shouldDismissOverlay).toHaveBeenCalledWith(anOverlay, event.target, "pressStart");
            });

            it("should not be called when a pressStart is fired inside the overlay", function () {
                delegate.shouldDismissOverlay = jasmine.createSpy().andReturn(true);

                var event = Event.event();

                anOverlay.dismissOnExternalInteraction = true;
                anOverlay.enterDocument(true);

                anOverlay._isShown = true;
                anOverlay._isDisplayed = true;
                event.target = anOverlay;
                event.target = MockDOM.element();
                anOverlay.element.appendChild(event.target);

                anOverlay._pressComposer._dispatchPressStart(event);
                expect(anOverlay._isShown).toBe(true);

                expect(delegate.shouldDismissOverlay).not.toHaveBeenCalled();
            });

            it("should not hide the overlay when a pressStart is fired outside the overlay and it returns false", function () {
                delegate.shouldDismissOverlay = jasmine.createSpy().andReturn(false);

                var event = Event.event();

                anOverlay.enterDocument(true);

                anOverlay._isShown = true;
                anOverlay._isDisplayed = true;
                event.target = MockDOM.element();
                anOverlay._pressComposer._dispatchPressStart(event);

                expect(anOverlay._isShown).toBe(true);

                expect(delegate.shouldDismissOverlay).toHaveBeenCalledWith(anOverlay, event.target, "pressStart");
            });

            it("should be called when the escape key is pressed", function () {
                delegate.shouldDismissOverlay = jasmine.createSpy().andReturn(true);

                anOverlay.enterDocument(true);
                anOverlay._isShown = true;
                anOverlay._isDisplayed = true;

                var event = Event.event();
                event.type = "keyPress";
                event.identifier = "escape";
                event.targetElement = MockDOM.element();
                anOverlay.handleKeyPress(event);

                expect(anOverlay._isShown).toBe(false);
                expect(delegate.shouldDismissOverlay).toHaveBeenCalledWith(anOverlay, event.targetElement, "keyPress");
            });

            it("should not hide the overlay when the delegate returns false", function () {
                delegate.shouldDismissOverlay = jasmine.createSpy().andReturn(false);

                anOverlay.enterDocument(true);
                anOverlay._isShown = true;
                anOverlay._isDisplayed = true;

                var event = Event.event();
                event.type = "keyPress";
                event.target = anOverlay;
                event.identifier = "escape";
                event.targetElement = MockDOM.element();
                anOverlay.dispatchEvent(event);
                anOverlay.handleKeyPress(event);

                expect(anOverlay._isShown).toBe(true);
                expect(delegate.shouldDismissOverlay).toHaveBeenCalledWith(anOverlay, event.targetElement, "keyPress");
            });

            it("should return activeTarget to the component that had it before", function () {
                var previousTarget = new Component();
                defaultEventManager.activeTarget = previousTarget;

                anOverlay.enterDocument(true);
                anOverlay.show();
                expect(defaultEventManager.activeTarget).toBe(anOverlay);
                anOverlay.hide();
                expect(defaultEventManager.activeTarget).toBe(previousTarget);
            });

            it("should not change the activeTarget if it's non-modal", function () {
                var previousTarget = new Component();
                defaultEventManager.activeTarget = previousTarget;

                anOverlay.isModal = false;
                anOverlay.enterDocument(true);
                anOverlay.show();
                expect(defaultEventManager.activeTarget).toBe(previousTarget);
                anOverlay.hide();
                expect(defaultEventManager.activeTarget).toBe(previousTarget);
            });

            it("should not show if the overlay isn't able to be the activeTarget", function () {
                var previousTarget = new Component();
                previousTarget.surrendersActiveTarget = function () {
                    return false;
                };
                defaultEventManager.activeTarget = previousTarget;

                anOverlay.enterDocument(true);
                anOverlay.show();
                expect(anOverlay._isShown).toBe(false);
            })
        });

    });

    describe("_isDisplayed", function () {
        it("should be false before it is measurable", function () {
            anOverlay._isShown = false;
            anOverlay._isDisplayed = true;

            anOverlay.draw();

            expect(anOverlay._isDisplayed).toBe(false);
        });

        it("should be true after it is measurable", function () {
            anOverlay._isShown = true;
            anOverlay._isDisplayed = false;

            anOverlay.draw();

            expect(anOverlay._isDisplayed).toBe(true);
        });
    });

    describe("dismissOnExternalInteraction", function () {
        it("should hide the overlay when a pressStart is fired outside the overlay and dismissOnExternalInteraction is true", function () {
            var event = Event.event();

            anOverlay.dismissOnExternalInteraction = true;
            anOverlay.enterDocument(true);

            anOverlay._isShown = true;
            anOverlay._isDisplayed = true;
            event.target = MockDOM.element();
            anOverlay._pressComposer._dispatchPressStart(event);
            expect(anOverlay._isShown).toBe(false);
        });

        it("should not hide the overlay when a pressStart is fired inside the overlay and dismissOnExternalInteraction is true", function () {
            var event = Event.event();

            anOverlay.dismissOnExternalInteraction = true;
            anOverlay.enterDocument(true);

            anOverlay._isShown = true;
            anOverlay._isDisplayed = true;
            event.target = MockDOM.element();
            anOverlay.element.appendChild(event.target);

            anOverlay._pressComposer._dispatchPressStart(event);
            expect(anOverlay._isShown).toBe(true);
        });

        it("should not hide the overlay when a pressStart is fired outside the overlay and dismissOnExternalInteraction is false", function () {
            var event = Event.event();

            anOverlay.dismissOnExternalInteraction = false;
            anOverlay.enterDocument(true);

            anOverlay._isShown = true;
            anOverlay._isDisplayed = true;
            event.target = MockDOM.element();
            anOverlay._pressComposer._dispatchPressStart(event);

            expect(anOverlay._isShown).toBe(true);
        });
    });

    describe("enterDocument", function () {
        it("should move the element to be a child of the body", function () {
            expect(anOverlay.element.ownerDocument.body.childNodes).toContain(anOverlay.element);
        });
    });

    describe("draw", function () {
        beforeEach(function () {
            var aWindow = anOverlay.element.ownerDocument.defaultView;

            aWindow.innerWidth = 700;
            aWindow.innerHeight = 600;
        });

        it("should be requested after show() when hidden", function () {
            anOverlay._isShown = false;

            anOverlay.show();

            expect(anOverlay.needsDraw).toBe(true);
            expect(anOverlay.classList.has("montage-Overlay--visible")).toBe(true);
        });

        it("should be requested after hide() when shown", function () {
            anOverlay._isShown = true;

            anOverlay.hide();

            expect(anOverlay.needsDraw).toBe(true);
            expect(anOverlay.classList.has("montage-Overlay--visible")).toBe(false);
        });

        it("should not calculate position on willDraw when content is not shown", function () {
            anOverlay._isDisplayed = false;
            anOverlay._isShown = true;

            anOverlay.willDraw();

            expect(anOverlay._drawPosition).toBe(null);
        });

        it("should turn the element invisible when it's not measurable and request another draw", function () {
            anOverlay._isDisplayed = false;
            anOverlay._isShown = true;

            anOverlay.draw();

            expect(anOverlay.element.style.visibility).toBe("hidden");
            expect(anOverlay._isDisplayed).toBe(true);
            expect(anOverlay.needsDraw).toBe(true);
        });

        it("should calculate the position on willDraw", function () {
            spyOn(anOverlay, "_calculatePosition");
            anOverlay._isDisplayed = true;
            anOverlay._isShown = true;

            anOverlay.willDraw();

            expect(anOverlay._calculatePosition).toHaveBeenCalled();
        });

        it("should position the element when it's measurable", function () {
            anOverlay._isDisplayed = true;
            anOverlay._isShown = true;
            anOverlay.element.offsetWidth = 100;
            anOverlay.element.offsetHeight = 50;
            anOverlay._calculatePosition();

            anOverlay.draw();

            expect(anOverlay.element.style.visibility).toBe("visible");
            expect(anOverlay.element.style.top).toBe("275px");
            expect(anOverlay.element.style.left).toBe("300px");
        });

        it("should be requested on window resize when shown", function () {
            anOverlay.needsDraw = false;
            anOverlay._isShown = true;
            anOverlay.handleResize();

            expect(anOverlay.needsDraw).toBe(true);
        });

        it("should not be requested on window resize when hidden", function () {
            anOverlay.needsDraw = false;
            anOverlay._isShown = false;
            anOverlay.handleResize();

            expect(anOverlay.needsDraw).toBe(false);
        });
    });

    describe("dismissal", function () {
        it("should hide the overlay when a pressStart is fired outside the overlay", function () {
            var event = Event.event();

            anOverlay._isShown = true;
            anOverlay._isDisplayed = true;
            event.target = MockDOM.element();
            anOverlay._pressComposer._dispatchPressStart(event);
            expect(anOverlay._isShown).toBe(false);
        });

        it("should not hide the overlay when a pressStart is fired inside the overlay", function () {
            var event = Event.event();

            anOverlay._isShown = true;
            anOverlay._isDisplayed = true;
            event.target = MockDOM.element();
            anOverlay.element.appendChild(event.target);

            anOverlay._pressComposer._dispatchPressStart(event);
            expect(anOverlay._isShown).toBe(true);
        });

        it("should hide the overlay when the escape key is pressed", function () {
            anOverlay.enterDocument(true);
            anOverlay.show();

            var event = Event.event();
            event.type = "keyPress";
            event.identifier = "escape";
            event.targetElement = MockDOM.element();
            anOverlay.handleKeyPress(event);

            expect(anOverlay._isShown).toBe(false);
        });
    });

    describe("keyPress", function () {
        it("should be loaded when the overlay is shown", function () {
            anOverlay.enterDocument(true);
            anOverlay.show();

            expect(anOverlay._keyComposer._isLoaded).toBe(true);
        });

        it("should not be loaded when the overlay is shown", function () {
            anOverlay.enterDocument(true);
            anOverlay.show();
            anOverlay.hide();

            expect(anOverlay._keyComposer._isLoaded).toBe(false);
        });

        it("should be loaded when the overlay is hidden and shown again", function () {
            anOverlay.enterDocument(true);
            anOverlay.show();
            anOverlay.hide();
            anOverlay.show();

            expect(anOverlay._keyComposer._isLoaded).toBe(true);
        });
    });

    describe("events", function () {
        it("should fire dismiss event when overlay is dismissed", function () {
            var event = Event.event(),
                callback = jasmine.createSpy();

            anOverlay._isShown = true;
            anOverlay._isDisplayed = true;
            event.target = MockDOM.element();

            anOverlay.addEventListener("dismiss", callback, false);

            anOverlay._pressComposer._dispatchPressStart(event);
            expect(callback).toHaveBeenCalled();
        });
    });

    describe("pressComposer", function () {
        var pressComposer;
        beforeEach(function () {
            pressComposer = anOverlay._pressComposer;
        });

        it("should not be loaded initially", function () {
            expect(anOverlay.element.ownerDocument.hasEventListener("mousedown", pressComposer)).toBe(false);
        });

        it("should be loaded when showing", function () {
            anOverlay.show();
            expect(anOverlay.element.ownerDocument.hasEventListener("mousedown", pressComposer)).toBe(true);
        });

        it("should be unloaded when hiding", function () {
            anOverlay.show();
            anOverlay.hide();
            expect(anOverlay.element.ownerDocument.hasEventListener("mousedown", pressComposer)).toBe(false);
        });
    });

    describe("show", function () {

        it("should enter the document", function () {
            var componentA = new Component();
            componentA.hasTemplate = false;
            componentA.element = MockDOM.element();
            componentA.element.appendChild(anOverlay.element);

            anOverlay.show();
            expect(anOverlay._needsEnterDocument).toBe(true);
        });
    });
});
