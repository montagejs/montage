/**
 * @module "ui/overlay.reel"
 */
var Montage = require("montage").Montage,
    Component = require("ui/component").Component,
    KeyComposer = require("composer/key-composer").KeyComposer,
    PressComposer = require("composer/press-composer").PressComposer,
    defaultEventManager = require("core/event/event-manager").defaultEventManager;

var CLASS_PREFIX = "montage-Overlay";

/*
 * This component uses a "trick" to measure its element when it is shown.
 * Since the element is "display: none" when it's hidden it's not possible to
 * measure it at willDraw in order to calculate the correct position to center it.
 * The solution used is to have two draws when it is shown. The first draw only
 * makes the element part of the layout of the browser while still being invisible
 * to the user, this is achieved by setting "visiblity: hidden" and the --visible
 * class that has a "display: block". A second draw is then forced.
 * On the second draw the element is now measurable and the visibility is set
 * back to "visible". This mechanism is controlled by the _isDisplayed flag.
 * @class Overlay
 * @extends Component
 */
exports.Overlay = Component.specialize( /** @lends Overlay# */ {

    /**
     * Dispatched when the user dismiss the overlay by clicking outside of it.
     * @event dismiss
     * @memberof Overlay
     * @param {Event} event
     */

    _pressComposer: {
        value: null
    },

    _keyComposer: {
        value: null
    },

    _anchor: {
        value: null
    },

    /**
     * The anchor element or component to display the overlay next to.
     */
    anchor: {
        set: function(value) {
            this._anchor = value;
            this.needsDraw = true;
        },
        get: function() {
            return this._anchor;
        }
    },

    _position: {
        value: null
    },

    /**
     * Where to position the overlay in the screen.
     * @type {{left: number, top: number}}
     */
    position: {
        set: function(value) {
            this._position = value;
            this.needsDraw = true;
        },
        get: function() {
            return this._position;
        }
    },

    // Value used to store the position where the overlay will be drawn.
    // This position is calculated at willDraw time and used at draw.
    _drawPosition: {
        value: null
    },

    _isShown: {
        value: false
    },

    isShown: {
        get: function() {
            return this._isShown;
        }
    },

    // True when the overlay element is measurable by the browser.
    _isDisplayed: {
        value: false
    },

    _resizeHandlerTimeout: {
        value: null
    },

    _previousActiveTarget: {
        value: null
    },

    /**
     * A delegate that can implement `willPositionOverlay` and/or
     * `shouldDismissOverlay`.
     *
     * - `willPositionOverlay(overlay, calculatedPosition)` is called when the
     *   overlay is being shown, and should return an object with `top` and
     *   `left` properties.
     * - `shouldDismissOverlay(overlay, target, event)` is called when the user
     *   clicks outside of the overlay or presses escape inside the overlay.
     *   Usually this will hide the overlay. Return `true` to hide the overlay,
     *   or `false` to leave the overlay visible.
     * @type {Object}
     */
    delegate: {
        value: null
    },

    _dismissOnExternalInteraction: {
        value: true
    },

    dismissOnExternalInteraction: {
        set: function(value) {
            if (value !== this._dismissOnExternalInteraction) {
                this._dismissOnExternalInteraction = value;
                if (value) {
                    this._pressComposer.addEventListener("pressStart", this, false);
                } else {
                    this._pressComposer.removeEventListener("pressStart", this, false);
                }
            }
        },
        get: function() {
            return this._dismissOnExternalInteraction;
        }
    },

    constructor: {
        value: function Overlay() {
            this.super();
            this._pressComposer = new PressComposer();

            // The composers are only loaded when the overlay is shown.
            // This is because the composers are added to the document, and so
            // interferes with the default actions of all clicks by calling
            // preventDefault on click when the pointer is surrendered (which
            // is whenever the overlay isn't shown).
            this._pressComposer.lazyLoad = true;
        }
    },

    enterDocument: {
        value: function(firstTime) {
            var body,
                _window;

            if (firstTime) {
                // Need to move the element to be a child of the document to
                // escape possible offset parent container.
                body = this.element.ownerDocument.body;
                body.appendChild(this.element);
                this.attachToParentComponent();

                _window = this.element.ownerDocument.defaultView;
                _window.addEventListener("resize", this);
                this.addComposerForElement(this._pressComposer, this.element.ownerDocument);

                if (this._dismissOnExternalInteraction) {
                    this._pressComposer.addEventListener("pressStart", this, false);
                }

                this._keyComposer = new KeyComposer();
                this._keyComposer.component = this;
                this._keyComposer.keys = "escape";
                this._keyComposer.identifier = "escape";
                this.addComposer(this._keyComposer);
                this._keyComposer.element = window;
            }
        }
    },

    /**
     * Show the overlay. The overlay is displayed at the position determined by
     * the following conditions:
     *
     * 1. If a delegate is provided and the willPositionOverlay function is
     *    implemented, the position is always determined by the delegate.
     * 2. If "position" is set, the overlay is always displayed at this
     *    location.
     * 3. If an anchor is set, the overlay is displayed below the anchor.
     * 4. If no positional hints are provided, the overlay is displayed at the
     *    center of the screen.
     *
     * FIXME: We have to add key events on both this component and the keyComposer
     * because of a bug in KeyComposer.
     */
    show: {
        value: function() {
            if (!this._isShown) {
                if (this.isModal) {
                    this._previousActiveTarget = defaultEventManager.activeTarget;
                    defaultEventManager.activeTarget = this;
                    if (defaultEventManager.activeTarget !== this) {
                        console.warn("Overlay " + this.identifier + " can't become the active target because ", defaultEventManager.activeTarget, " didn't surrender it.");
                        return;
                    }
                }

                this.attachToParentComponent();
                this.classList.add(CLASS_PREFIX + "--visible");
                this._pressComposer.load();
                this._keyComposer.load();
                this._isShown = true;
                this.needsDraw = true;

                this._keyComposer.addEventListener("keyPress", this, false);
            }
        }
    },

    hide: {
        value: function() {
            if (this._isShown) {
                // detachFromParentComponent happens at didDraw
                this.classList.remove(CLASS_PREFIX + "--visible");
                this._pressComposer.unload();
                this._keyComposer.unload();
                this._isShown = false;
                this.needsDraw = true;

                if (this.isModal) {
                    defaultEventManager.activeTarget = this._previousActiveTarget;
                }

                this._keyComposer.removeEventListener("keyPress", this, false);
            }
        }
    },

    isModal: {
        value: true
    },

    /**
     * The overlay should only surrender focus if it is hidden, non-modal, or
     * if the other component is one of its descendants.
     */
    surrendersActiveTarget: {
        value: function(candidateActiveTarget) {
            if (!this.isShown || !this.isModal) {
                return true;
            }

            if (candidateActiveTarget.element) {
                return this.element.contains(candidateActiveTarget.element);
            } else {
                return false;
            }
        }
    },

    // Event handlers

    handleResize: {
        value: function() {
            if (this.isShown) {
                this.needsDraw = true;
            }
        }
    },

    handlePressStart: {
        value: function(event) {
            if (!this.element.contains(event.targetElement)) {
                this.dismissOverlay(event);
            }
        }
    },

    handleKeyPress: {
        value: function(event) {
            if (event.identifier === "escape") {
                this.dismissOverlay(event);
            }
        }
    },

    /**
     * User event has requested that we dismiss the overlay. Give the delegate
     * an opportunity to prevent it. Returns whether the overlay was hidden.
     */
    dismissOverlay: {
        value: function(event) {
            var shouldDismissOverlay = false;
            if (this._isShown) {
                shouldDismissOverlay = this.callDelegateMethod("shouldDismissOverlay", this, event.targetElement, event.type);

                if (shouldDismissOverlay === void 0 || shouldDismissOverlay) {
                    this.hide();
                    this._dispatchDismissEvent();
                }
            }

            return shouldDismissOverlay;
        }
    },

    // Draw

    willDraw: {
        value: function() {
            // Only calculate the position if the element is part of the layout,
            // otherwise it's not possible to measure the element.
            if (this._isDisplayed && this._isShown) {
                this._calculatePosition();
            }
            if (!this._isShown) {
                this.callDelegateMethod("didHideOverlay", this);
            }
        }
    },

    draw: {
        value: function() {
            if (this._isShown) {
                // The element is displayed when it is measurable.
                if (this._isDisplayed) {
                    this._reposition();
                    this.element.style.visibility = "visible";
                } else {
                    // Make the element part of the layout (this is achieved by
                    // the "--visible" class) but hide it from view.
                    // This will make it possible to measure the element in the
                    // next draw cycle at willDraw without causing a flash.
                    this.element.style.visibility = "hidden";
                    this._isDisplayed = true;
                    this.callDelegateMethod("didShowOverlay", this);
                    // Trigger the new draw cycle so we can finally measure the
                    // element.
                    this.needsDraw = true;
                }
            } else {
                this._isDisplayed = false;
            }
        }
    },

    didDraw: {
        value: function() {
            if (!this._isShown) {
                this.detachFromParentComponent();
            }
        }
    },

    _reposition: {
        value: function() {
            var position = this._drawPosition;

            this.element.style.top = position.top + "px";
            this.element.style.left = position.left + "px";
        }
    },

    _getElementPosition: {
        value: function(element) {
            var left = 0,
                top = 0;

            do {
                left += element.offsetLeft;
                top += element.offsetTop;
            } while (element = /* assignment */ element.offsetParent);

            return {
                top: top,
                left: left
            };
        }
    },

    _calculatePosition: {
        value: function() {
            var position,
                delegatePosition;

            if (this.position) {
                position = this.position;
            } else if (this.anchor) {
                position = this._calculateAnchorPosition();
            } else {
                position = this._calculateCenteredPosition();
            }

            delegatePosition = this.callDelegateMethod("willPositionOverlay", this, position);

            if (delegatePosition) {
                position = delegatePosition;
            }

            this._drawPosition = position;
        }
    },

    _calculateAnchorPosition: {
        value: function() {
            var anchor = this.anchor,
                width = this.element.offsetWidth,
                anchorPosition = this._getElementPosition(anchor),
                anchorHeight = anchor.offsetHeight || 0,
                anchorWidth = anchor.offsetWidth || 0,
                position;

            position = {
                top: anchorPosition.top + anchorHeight,
                left: anchorPosition.left + (anchorWidth / 2) - (width / 2)
            };

            if (position.left < 0) {
                position.left = 0;
            }

            return position;
        }
    },

    _calculateCenteredPosition: {
        value: function() {
            var _window = this.element.ownerDocument.defaultView,
                viewportHeight = _window.innerHeight,
                viewportWidth = _window.innerWidth,
                height = this.element.offsetHeight,
                width = this.element.offsetWidth;

            return {
                top: (viewportHeight / 2 - (height / 2)),
                left: (viewportWidth / 2 - (width / 2))
            };
        }
    },

    _dispatchDismissEvent: {
        value: function() {
            var dismissEvent = document.createEvent("CustomEvent");

            dismissEvent.initCustomEvent("dismiss", true, true, null);

            this.dispatchEvent(dismissEvent);
        }
    }

});

