/*global require,exports,describe,it,expect */
var Montage = require("montage").Montage,
    Component = require("montage/ui/component").Component,
    Overlay = require("montage/ui/overlay.reel").Overlay,
    MockDOM = require("mocks/dom"),
    Event = require("mocks/event");

describe("ui/overlay-spec", function() {
    var anOverlay;

    beforeEach(function() {
        anOverlay = new Overlay();
        anOverlay.hasTemplate = false;
        anOverlay.element = MockDOM.element();
        anOverlay.modalMaskElement = MockDOM.element();

        anOverlay._firstDraw = false;

        anOverlay.enterDocument(true);
    });

    describe("position calculation", function() {
        it("should use the overlay position property", function() {
            anOverlay.position = {left: 100, top: 100};
            anOverlay._calculatePosition();
            expect(anOverlay._drawPosition).toEqual({left: 100, top: 100});
        });

        it("should calculate the overlay position to be in the middle of the screen when no position hints are given", function() {
            var aWindow = anOverlay.element.ownerDocument.defaultView;

            aWindow.innerWidth = 700;
            aWindow.innerHeight = 600;
            anOverlay.element.offsetWidth = 100;
            anOverlay.element.offsetHeight = 50;

            anOverlay._calculatePosition();
            expect(anOverlay._drawPosition).toEqual({left: 300, top: 275});
        });

        describe("element position", function() {
            it("should find the position of an element with no offset parent", function() {
                var anElement = MockDOM.element(),
                    position;

                anElement.offsetTop = 100;
                anElement.offsetLeft = 200;

                position = anOverlay._getElementPosition(anElement);
                expect(position.top).toBe(100);
                expect(position.left).toBe(200);
            });

            it("should find the position of an element with an offset parent", function() {
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

        describe("anchor position", function() {
            it("should center the element bellow the anchor", function() {
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

            it("should center the element bellow the anchor and bump it to the right because it's left outside the screen", function() {
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

    describe("delegate", function() {
        it("should call willPositionOverlay", function() {
            var delegate = {
                willPositionOverlay: jasmine.createSpy()
            };

            anOverlay.delegate = delegate;
            anOverlay.position = {
                left: 100,
                top: 50
            };

            anOverlay._calculatePosition();

            expect(delegate.willPositionOverlay).toHaveBeenCalledWith(anOverlay, anOverlay.position);
        });
    });

    describe("_isDisplayed", function() {
        it("should be false before it is measurable", function() {
            anOverlay._isShown = false;
            anOverlay._isDisplayed = true;

            anOverlay.draw();

            expect(anOverlay._isDisplayed).toBe(false);
        });

        it("should be true after it is measurable", function() {
            anOverlay._isShown = true;
            anOverlay._isDisplayed = false;

            anOverlay.draw();

            expect(anOverlay._isDisplayed).toBe(true);
        });
    });

    describe("enterDocument", function() {
        it("should move the element to be a child of the body", function() {
            expect(anOverlay.element.ownerDocument.body.childNodes).toContain(anOverlay.element);
        });
    });

    describe("draw", function() {
        beforeEach(function() {
            var aWindow = anOverlay.element.ownerDocument.defaultView;

            aWindow.innerWidth = 700;
            aWindow.innerHeight = 600;
        });

        it("should be requested after show() when hidden", function() {
            anOverlay._isShown = false;

            anOverlay.show();

            expect(anOverlay.needsDraw).toBe(true);
            expect(anOverlay.classList.has("montage-Overlay--visible")).toBe(true);
        });

        it("should be requested after hide() when shown", function() {
            anOverlay._isShown = true;

            anOverlay.hide();

            expect(anOverlay.needsDraw).toBe(true);
            expect(anOverlay.classList.has("montage-Overlay--visible")).toBe(false);
        });

        it("should not calculate position on willDraw when content is not shown", function() {
            anOverlay._isDisplayed = false;
            anOverlay._isShown = true;

            anOverlay.willDraw();

            expect(anOverlay._drawPosition).toBe(null);
        });

        it("should turn the element invisible when it's not measurable and request another draw", function() {
            anOverlay._isDisplayed = false;
            anOverlay._isShown = true;

            anOverlay.draw();

            expect(anOverlay.element.style.visibility).toBe("hidden");
            expect(anOverlay._isDisplayed).toBe(true);
            expect(anOverlay.needsDraw).toBe(true);
        });

        it("should calculate the position on willDraw", function() {
            spyOn(anOverlay, "_calculatePosition");
            anOverlay._isDisplayed = true;
            anOverlay._isShown = true;

            anOverlay.willDraw();

            expect(anOverlay._calculatePosition).toHaveBeenCalled();
        });

        it("should position the element when it's measurable", function() {
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

        it("should be requested on window resize when shown", function() {
            anOverlay._isShown = true;
            anOverlay.handleResize();

            expect(anOverlay.needsDraw).toBe(true);
        });

        it("should not be requested on window resize when hidden", function() {
            anOverlay._isShown = false;
            anOverlay.handleResize();

            expect(anOverlay.needsDraw).toBe(false);
        });
    });

    describe("dismissal", function() {
        it("should hide the overlay when a pressStart is fired outside the overlay", function() {
            var event = Event.event();

            anOverlay._isShown = true;
            anOverlay._isDisplayed = true;
            event.target = MockDOM.element();
            anOverlay._pressComposer._dispatchPressStart(event);
            expect(anOverlay._isShown).toBe(false);
        });

        it("should not hide the overlay when a pressStart is fired inside the overlay", function() {
            var event = Event.event();

            anOverlay._isShown = true;
            anOverlay._isDisplayed = true;
            event.target = MockDOM.element();
            anOverlay.element.appendChild(event.target);

            anOverlay._pressComposer._dispatchPressStart(event);
            expect(anOverlay._isShown).toBe(true);
        });
    });

    describe("events", function() {
        it("should fire dismiss event when overlay is dismissed", function() {
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

    describe("show", function() {

        it("should enter the document", function() {
            var componentA = new Component();
            componentA.hasTemplate = false;
            componentA.element = MockDOM.element();
            componentA.element.appendChild(anOverlay.element);

            anOverlay.show();
            expect(anOverlay._needsEnterDocument).toBe(true);
        });
    });
});
