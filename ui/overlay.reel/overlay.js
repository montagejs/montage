/*global require, exports, console, MontageElement */

/**
 * @module "ui/overlay.reel"
 */
var Component = require("../component").Component,
    Control = require("../control").Control,
    KeyComposer = require("../../composer/key-composer").KeyComposer,
    PressComposer = require("../../composer/press-composer").PressComposer,
    defaultEventManager = require("../../core/event/event-manager").defaultEventManager;

var CLASS_PREFIX = "montage-Overlay",
    VISIBLE_CLASS_NAME = CLASS_PREFIX + "--visible";

/**
 *
 * @class Overlay
 * @extends Component
 */
var Overlay = exports.Overlay = Component.specialize( /** @lends Overlay.prototype # */ {

    /**
     * @private
     * @type {Object}
     * @default null
     */
    _previousActiveTarget: {
        value: null
    },

    /**
     * @private
     * @type {{left: number, top: number}}
     * @description Value used to store the position where the overlay will be drawn.
     * This position is calculated at willDraw time and used at draw.
     * @default null
     */
    _drawPosition: {
        value: null
    },

    __pressComposer: {
        value: null
    },

    /**
     * @private
     * @type {PressComposer}
     * @description Dispatched when the user dismiss the overlay by clicking outside of it.
     */
    _pressComposer: {
        get: function () {
            if (!this.__pressComposer) {
                this.__pressComposer = new PressComposer();
                this.__pressComposer.delegate = this;
                this.addComposerForElement(
                    this._pressComposer, this.element.ownerDocument
                );
            }

            return this.__pressComposer;
        }
    },

    __keyComposer: {
        value: null
    },

    /**
     * @private
     * @type {KeyComposer}
     * @description Dispatched when the user hit the escape key.
     */
    _keyComposer: {
        get: function () {
            if (!this.__keyComposer) {
                this.__keyComposer = new KeyComposer();
                this.__keyComposer.keys = "escape";
                this.__keyComposer.identifier = "escape";
                this.addComposerForElement(
                    this.__keyComposer, this.element.ownerDocument.defaultView
                );
            }

            return this.__keyComposer;
        }
    },

    _width: {
        value: null
    },

    /**
     * @public
     * @type {string|Number}
     * @description The width of the overlay. If a number is provided, 
     * pixel units will be used.
     * @default null
     */
    width: {
        set: function (width) {
            if (!isNaN(width)) {
                this._width = width + "px";
                this.needsDraw = true;

            } else if (typeof width === "string" && width) {
                this._width = width;
                this.needsDraw = true;

            } else {
                this._width = null;
            }
        },
        get: function () {
            return this._width;
        }
    },

    _height: {
        value: null
    },

    /**
     * @public
     * @type {string|Number}
     * @description The height of the overlay. If a number is provided,
     * pixel units will be used.
     * @default null
     */
    height: {
        set: function (height) {
            if (!isNaN(height)) {
                this._height = height + "px";
                this.needsDraw = true;

            } else if (typeof height === "string" && height) {
                this._height = height;
                this.needsDraw = true;

            } else {
                this._height = null;
            }
        },
        get: function () {
            return this._height;
        }
    },

    _anchor: {
        value: null
    },

    /**
     * @public
     * @type {Element|Component}
     * @description The anchor element or component to display the overlay next to.
     * @default null
     */
    anchor: {
        set: function (value) {
            this._anchor = value;
            this.needsDraw = true;
        },
        get: function () {
            return this._anchor;
        }
    },

    _control: {
        value: null
    },

    /**
     * @public
     * @type {Control}
     * @description Represents the control component bounded to the overlay.
     * The overlay will listen to the control's action event in order to automatically
     * show the overlay
     * @default null
     */
    control: {
        set: function (control) {
            if (this._control !== control) {
                if (control instanceof Control) {
                    control.addEventListener("action", this);
                } else if (this._control) {
                    control.removeEventListener("action", this);
                }

                this._control = control;
            }
        },
        get: function () {
            return this._control;
        }
    },

    _position: {
        value: null
    },

    /**
     * @public
     * @type {{left: number, top: number}}
     * @description Where to position the overlay in the screen.
     * @default null
     */
    position: {
        set: function (value) {
            this._position = value;
            this.needsDraw = true;
        },
        get: function () {
            return this._position;
        }
    },

    _isShown: {
        value: false
    },

     /**
     * @public
     * @type {Boolean}
     * @description Indicate if the overlay is shown or not.
     * @default false
     */
    isShown: {
        get: function () {
            return this._isShown;
        }
    },

    /**
     * @public
     * @type {Object}
     * @description  A delegate that can implement `willPositionOverlay` and/or
     * `shouldDismissOverlay`.
     *
     * - `willPositionOverlay(overlay, calculatedPosition)` is called when the
     *   overlay is being shown, and should return an object with `top` and
     *   `left` properties.
     * - `shouldDismissOverlay(overlay, target, event)` is called when the user
     *   clicks outside of the overlay or presses escape inside the overlay.
     *   Usually this will hide the overlay. Return `true` to hide the overlay,
     *   or `false` to leave the overlay visible.
     * 
     * @default null
     */
    delegate: {
        value: null
    },

    /**
     * @public
     * @type {Boolean}
     * @description TODO ??
     * @default true
     */
    isModal: {
        value: true
    },

    _dismissOnExternalInteraction: {
        value: true
    },

    /**
     * @public
     * @type {Boolean}
     * @description Determines if the overlay should be dismissed when the user
     * clicks outside of the overlay.
     * @default true
     */
    dismissOnExternalInteraction: {
        set: function (value) {
            value = !!value;

            if (value !== this._dismissOnExternalInteraction) {
                this._dismissOnExternalInteraction = value;

                if (value && this._isShown) {
                    this._pressComposer.addEventListener("pressStart", this);
                } else {
                    this._pressComposer.removeEventListener("pressStart", this);
                }
            }
        },
        get: function () {
            return this._dismissOnExternalInteraction;
        }
    },

    _dismissOnEscape: {
        value: true
    },

    /**
     * @public
     * @type {Boolean}
     * @description Determines if the overlay should be dismissed when the user
     * presses escape inside the overlay.
     * @default true
     */
    dismissOnEscape: {
        set: function (value) {
            value = !!value;

            if (value !== this._dismissOnEscape) {
                this._dismissOnEscape = value;

                if (value && this._isShown) {
                    this._keyComposer.addEventListener("keyPress", this);
                } else {
                    this._keyComposer.removeEventListener("keyPress", this);
                }
            }
        },
        get: function () {
            return this._dismissOnEscape;
        }
    },

    enterDocument: {
        value: function (firstTime) {
            if (firstTime) {
                // Need to move the element to be a child of the document to
                // escape possible offset parent container.
                this.element.ownerDocument.body.appendChild(this.element);
                this.attachToParentComponent();
            }
        }
    },

    handleAction: {
        value: function (event) {
            if (event.target === this.control) {
                this.show();
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
        value: function () {
            if (!this._isShown) {
                if (this.isModal) {
                    this._previousActiveTarget = defaultEventManager.activeTarget;
                    defaultEventManager.activeTarget = this;
                    if (defaultEventManager.activeTarget !== this) {
                        console.warn("Overlay " + this.identifier +
                            " can't become the active target because ",
                            defaultEventManager.activeTarget,
                            " didn't surrender it."
                        );
                        return;
                    }
                }

                this.attachToParentComponent();
                this.classList.add(VISIBLE_CLASS_NAME);
                this.loadComposer(this._pressComposer);
                this.loadComposer(this._keyComposer);
                this._isShown = true;
                this.needsDraw = true;

                this.element.ownerDocument.defaultView.addEventListener("resize", this);

                if (this._dismissOnExternalInteraction) {
                    this._pressComposer.addEventListener("pressStart", this);
                }

                if (this._dismissOnEscape) {
                    this._keyComposer.addEventListener("keyPress", this);
                }
            }
        }
    },

    hide: {
        value: function () {
            if (this._isShown) {
                // detachFromParentComponent happens at didDraw
                this.classList.remove(VISIBLE_CLASS_NAME);
                this.unloadComposer(this._pressComposer);
                this.unloadComposer(this._keyComposer);
                this._isShown = false;
                this.needsDraw = true;

                if (this.isModal) {
                    defaultEventManager.activeTarget = this._previousActiveTarget;
                }

                this.element.ownerDocument.defaultView.removeEventListener("resize", this);

                if (this._dismissOnExternalInteraction) {
                    this._pressComposer.removeEventListener("pressStart", this);
                }

                if (this._dismissOnEscape) {
                    this._keyComposer.removeEventListener("keyPress", this);
                }
            }
        }
    },

    shouldComposerSurrenderPointerToComponent: {
        value: function (composer, pointer, component) {
            if (
                component && component.element &&
                !this.element.contains(component.element)
            ) {
                this.hide();
            }

            return true;
        }
    },

    /**
     * The overlay should only surrender focus if it is hidden, non-modal, or
     * if the other component is one of its descendants.
     */
    surrendersActiveTarget: {
        value: function (candidateActiveTarget) {
            var response = !(this.isModal && this.isShown),
                delegateResponse;

            if (!response && candidateActiveTarget && candidateActiveTarget.element) {
                response = this.element.contains(candidateActiveTarget.element);
            }

            delegateResponse = this.callDelegateMethod(
                "overlayShouldDismissOnSurrenderActiveTarget",
                this,
                candidateActiveTarget,
                response
            );

            return delegateResponse !== void 0 ? delegateResponse : response;
        }
    },

    // Event handlers

    handleResize: {
        value: function () {
            if (this.isShown) {
                this.needsDraw = true;
            }
        }
    },

    handlePressStart: {
        value: function (event) {
            if (!this.element.contains(event.targetElement)) {
                this.dismissOverlay(event);
            }
        }
    },

    handleKeyPress: {
        value: function (event) {
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
        value: function (event) {
            var shouldDismissOverlay = false;
            if (this._isShown) {
                shouldDismissOverlay = this.callDelegateMethod(
                    "shouldDismissOverlay", this, event.targetElement, event.type
                );

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
        value: function () {
            if (this._isShown) {
                this._calculatePosition();

            } else {
                this.callDelegateMethod("didHideOverlay", this);
            }
        }
    },

    draw: {
        value: function () {
            if (this._isShown) {
                var position = this._drawPosition;
                this.element.style.top = position.top + "px";
                this.element.style.left = position.left + "px";
                this.element.style.visibility = "visible";
                this.callDelegateMethod("didShowOverlay", this);

            } else {
                this.element.style.visibility = "hidden";
            }

            this.element.style.height = this.height;
            this.element.style.width = this.width;
        }
    },

    didDraw: {
        value: function () {
            if (!this._isShown) {
                this.detachFromParentComponent();
            }
        }
    },

    _calculatePosition: {
        value: function () {
            var position,
                delegatePosition;

            if (this.position) {
                position = this.position;
            } else if (this.anchor) {
                position = this._calculateAnchorPosition();
            } else {
                position = this._calculateCenteredPosition();
            }

            delegatePosition = this.callDelegateMethod(
                "willPositionOverlay", this, position
            );

            if (delegatePosition) {
                position = delegatePosition;
            }

            this._drawPosition = position;
        }
    },

    _calculateAnchorPosition: {
        value: function () {
            var anchor = this.anchor,
                width = this.element.offsetWidth,
                anchorPosition = anchor.getBoundingClientRect(),
                anchorHeight = anchor.offsetHeight || 0,
                anchorWidth = anchor.offsetWidth || 0,
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
        value: function () {
            var defaultView = this.element.ownerDocument.defaultView,
                viewportHeight = defaultView.innerHeight,
                viewportWidth = defaultView.innerWidth,
                height = this.element.offsetHeight,
                width = this.element.offsetWidth;

            return {
                top: (viewportHeight / 2 - (height / 2)),
                left: (viewportWidth / 2 - (width / 2))
            };
        }
    },

    _dispatchDismissEvent: {
        value: function () {
            var dismissEvent = document.createEvent("CustomEvent");
            dismissEvent.initCustomEvent("dismiss", true, true, null);
            this.dispatchEvent(dismissEvent);
        }
    }

});

if (window.MontageElement) {
    MontageElement.define("montage-overlay", Overlay);
}
