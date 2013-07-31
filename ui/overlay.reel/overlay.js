/**
 * @module "ui/overlay.reel"
 * This component uses a "trick" to measure its element when it is shown.
 * Since the element is "display: none" when it's hidden it's not possible to
 * measure it at willDraw in order to calculate the correct position to center it.
 * The solution used is to have two draws when it is shown. The first draw only
 * makes the element part of the layout of the browser while still being invisible
 * to the user, this is achieved by setting "visiblity: hidden" and the --visible
 * class that has a "display: block". A second draw is then forced.
 * On the second draw the element is now measurable and the visibility is set
 * back to "visible". This mechanism is controlled by the _isDisplayed flag.
 */
var Montage = require("montage").Montage,
    Component = require("ui/component").Component,
    PressComposer = require("composer/press-composer").PressComposer;

/**
    @class module:Overlay
    @extends module:Component
*/

var CLASS_PREFIX = "montage-Overlay";

exports.Overlay = Component.specialize( /** @lends module:Overlay# */ {
    /**
     * Dispatched when the user dismiss the overlay by clicking outside of it.
     * @event dismiss
     * @memberof Overlay
     * @param {Event} event
     */

    _pressComposer: {
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

    delegate: {
        value: null
    },

    constructor: {
        value: function Overlay() {
            this.super();
            this._pressComposer = new PressComposer();
        }
    },

    enterDocument: {
        value: function(firstTime) {
            var _window;

            if (firstTime) {
                _window = this.element.ownerDocument.defaultView;
                _window.addEventListener("resize", this);
                this.addComposerForElement(this._pressComposer, this.element.ownerDocument);
                this._pressComposer.addEventListener("pressStart", this, false);
            }
        }
    },

    /**
     * Show the overlay. The overlay is displayed at the position determined by
     * the following conditions:
     *
     * 1) If a delegate is provided and the willPositionOverlay function is
     *    implemented, the position is always determined by the delegate.
     * 2) If "position" is set, the overlay is always displayed at this
     *    location.
     * 3) If an anchor is set, the overlay is displayed below the anchor.
     * 4) If no positional hints are provided, the overlay is displayed at the
     *    center of the screen.
     */
    show: {
        value: function() {
            if (!this._isShown) {
                this.classList.add(CLASS_PREFIX + "--visible");
                this._isShown = true;
                this.needsDraw = true;
            }
        }
    },

    hide: {
        value: function() {
            if (this._isShown) {
                this.classList.remove(CLASS_PREFIX + "--visible");
                this._isShown = false;
                this.needsDraw = true;
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
            var targetElement = event.targetElement,
                element = this.element;

            if (!element.contains(targetElement)) {
                this.hide();
                this._dispatchDismissEvent();
            }
        }
    },

    // Draw

    willDraw: {
        value: function() {
            // Only calculate the position if the element is part of the layout,
            // otherwise it's not possible to measure the element.
            if (this._isDisplayed && this._isShown) {
                this._ownBoundingRect = this.element.getBoundingClientRect();
                this._calculatePosition();
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
                    // this is required for correct measurement
                    this.element.style.marginTop = "0";
                    this.element.style.marginLeft = "0";
                    this._marginTop = 0;
                    this._marginLeft = 0;
                    this._isDisplayed = true;
                    // Trigger the new draw cycle so we can finally measure the
                    // element.
                    this.needsDraw = true;
                }
            } else {
                this._isDisplayed = false;
                this.element.style.marginTop = "0";
                this.element.style.marginLeft = "0";
                this._marginTop = 0;
                this._marginLeft = 0;
            }
        }
    },

    _marginTop: {
        value: 0
    },

    _marginLeft: {
        value: 0
    },

    _reposition: {
        value: function() {
            var position = this._drawPosition;

            this._marginTop += position.top - this._ownBoundingRect.top;
            this._marginLeft += position.left - this._ownBoundingRect.left;
            this.element.style.marginTop = this._marginTop + "px";
            this.element.style.marginLeft = this._marginLeft + "px";
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
            var anchorElement = this.anchor instanceof Montage ? this.anchor.element : this.anchor,
                width = this._ownBoundingRect.right - this._ownBoundingRect.left,
                anchorBoundingRect = anchorElement.getBoundingClientRect(),
                anchorWidth = anchorBoundingRect.right - anchorBoundingRect.left,
                position;

            position = {
                top: anchorBoundingRect.bottom,
                left: anchorBoundingRect.left + (anchorWidth / 2) - (width / 2)
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
                height = this._ownBoundingRect.bottom - this._ownBoundingRect.top,
                width = this._ownBoundingRect.right - this._ownBoundingRect.left;

            return {
                top: (viewportHeight / 2 - (height / 2)),
                left: (viewportWidth / 2 - (width / 2))
            };
        }
    },

    _dispatchDismissEvent: {
        value: function() {
            var dismissEvent = document.createEvent("CustomEvent");

            dismissEvent.initCustomEvent("dismiss", true, true);

            this.dispatchEvent(dismissEvent);
        }
    }
});
