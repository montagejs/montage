/*global require, exports*/

/**
 @module montage/ui/base/abstract-toggle-button.reel
 */
var Montage = require("montage").Montage,
    AbstractControl = require("ui/base/abstract-control").AbstractControl,
    PressComposer = require("composer/press-composer").PressComposer,
    KeyComposer = require("composer/key-composer").KeyComposer;

/**
 * @class AbstractToggleButton
 * @extends AbstractControl
 * @fires action
 * @fires longAction
 */
var AbstractToggleButton = exports.AbstractToggleButton = AbstractControl.specialize( /** @lends AbstractToggleButton# */ {

    /**
     * Dispatched when the toggle button is activated through a mouse click,
     * finger tap, or when focused and the spacebar is pressed.
     * @event action
     * @memberof AbstractToggleButton
     * @param {Event} event
     */

    /**
     * Dispatched when the toggle button is pressed for a period of time, set by
     * {@link holdThreshold}.
     * @event longAction
     * @memberof AbstractToggleButton
     * @param {Event} event
     */

    /**
     * @private
     */
    constructor: {
        value: function() {
            if(this.constructor === AbstractToggleButton) {
                throw new Error("AbstractToggleButton cannot be instantiated.");
            }
            AbstractControl.constructor.call(this); // super
            this._pressComposer = new PressComposer();
            this._pressComposer.defineBinding("longPressThreshold ", {
                "<-": "holdThreshold",
                source: this
            });
            this.addComposer(this._pressComposer);

            this._keyComposer = new KeyComposer();
            this._keyComposer.component = this;
            this._keyComposer.keys = "space";
            this.addComposer(this._keyComposer);

            this.classList.add("montage-ToggleButton");

            this.defineBindings({
                // classList management
                "classList.has('montage--disabled')": {
                    "<-": "!enabled"
                },
                "classList.has('montage--active')": {
                    "<-": "active"
                },
                "classList.has('montage-ToggleButton--pressed')": {
                    "<-": "pressed"
                }
            });
        }
    },

    /**
     * Enables or disables the Button from user input. When this property is set to ```false```,
     * the "montage--disabled" CSS style is applied to the button's DOM element during the next draw cycle. When set to
     * ```true``` the "montage--disabled" CSS class is removed from the element's class list.
     * @type {boolean}
     */
    enabled: {
        value: true
    },

    acceptsActiveTarget: {
        value: function() {
            return true;
        }
    },

    /**
     Stores the node that contains this button's value. Only used for
     non-`<input>` elements.
     @private
     */
    _labelNode: {
        value: null
    },

    _pressedLabel: {
        value: "on"
    },

    /**
     The displayed text on the button when it is pressed.

     @type {string}
     @default undefined
     */
    pressedLabel: {
        get: function() {
            return this._pressedLabel;
        },
        set: function(value) {
            this._pressedLabel = "" + value;
            this.needsDraw = true;
        }
    },

    _unpressedLabel: {
        value: "off"
    },

    /**
     The displayed text on the button when it is unpressed.

     @type {string}
     @default undefined
     */
    unpressedLabel: {
        get: function() {
            return this._unpressedLabel;
        },
        set: function(value) {
            this._unpressedLabel = "" + value;
            this.needsDraw = true;
        }
    },

    /**
     The amount of time in milliseconds the user must press and hold the button a `longAction` event is dispatched. The default is 1 second.
     @type {number}
     @default 1000
     */
    holdThreshold: {
        value: 1000
    },

    _pressComposer: {
        value: null
    },

    _keyComposer: {
        value: null
    },

    _active: {
        value: false
    },

    /**
     This property is true when the button is being interacted with, either through mouse click or touch event, otherwise false.
     @type {boolean}
     @default false
     */
    active: {
        get: function() {
            return this._active;
        },
        set: function(value) {
            this._active = value;
            this.needsDraw = true;
        }
    },

    _pressed: {
        value: false
    },

    pressed: {
        set: function(value) {
            if (value !== this._pressed) {
                this._pressed = value;
                this.needsDraw = true;
            }
        },
        get: function() {
            return this._pressed;
        }
    },

    prepareForActivationEvents: {
        value: function() {
            this._pressComposer.addEventListener("pressStart", this, false);
            this._pressComposer.addEventListener("press", this, false);
            this._pressComposer.addEventListener("pressCancel", this, false);

            this._keyComposer.addEventListener("keyPress", this, false);
        }
    },

    // Optimisation
    addEventListener: {
        value: function(type, listener, useCapture) {
            AbstractControl.addEventListener.call(this, type, listener, useCapture);
            if (type === "longAction") {
                this._pressComposer.addEventListener("longPress", this, false);
            }
        }
    },

    // Handlers

    /**
     Called when the user starts interacting with the component.
     */
    handlePressStart: {
        value: function(event) {
            this.active = true;

            if (event.touch) {
                // Prevent default on touchmove so that if we are inside a scroller,
                // it scrolls and not the webpage
                document.addEventListener("touchmove", this, false);
            }
        }
    },

    /**
     Called when the user has interacted with the button.
     */
    handlePress: {
        value: function(event) {
            this.active = false;

            if (!this.enabled) {
                return;
            }

            this.pressed = !this.pressed;
            this.dispatchActionEvent();
            document.removeEventListener("touchmove", this, false);
        }
    },

    handleKeyPress: {
        value: function(event) {
            this.active = false;

            if (!this.enabled) {
                return;
            }

            this.pressed = !this.pressed;
            this.dispatchActionEvent();
        }
    },

    handleLongPress: {
        value: function(event) {
            // When we fire the "longAction" event we don't want to fire the
            // "action" event as well.
            this._pressComposer.cancelPress();

            var longActionEvent = document.createEvent("CustomEvent");
            longActionEvent.initCustomEvent("longAction", true, true, null);
            this.dispatchEvent(longActionEvent);
        }
    },

    /**
     Called when all interaction is over.
     @private
     */
    handlePressCancel: {
        value: function(event) {
            this.active = false;
            document.removeEventListener("touchmove", this, false);
        }
    },

    handleTouchmove: {
        value: function(event) {
            event.preventDefault();
        }
    },

    _toggle: {
        value: function() {
            this.pressed = !this.pressed;
        }
    },

    /**
     If this is an input element then the label is handled differently.
     @private
     */
    isInputElement: {
        value: false
    },

    enterDocument: {
        value: function(firstDraw) {
            if(firstDraw) {
                this.isInputElement = (this.originalElement.tagName === "INPUT");

                if (!this.isInputElement) {
                    if (!this.originalElement.firstChild) {
                        this.originalElement.appendChild(document.createTextNode(""));
                    }
                    this._labelNode = this.originalElement.firstChild;
                }

                this.element.setAttribute("role", "button");
            }
        }
    },

    /**
     Draws the label to the DOM.
     @function
     @private
     */
    _drawLabel: {
        enumerable: false,
        value: function(value) {
            if (this.isInputElement) {
                this._element.setAttribute("value", value);
            } else if (this._labelNode) {
                this._labelNode.data = value;
            }
        }
    },

    draw: {
        value: function() {
            if (this.pressed) {
                this._drawLabel(this.pressedLabel);
            } else {
                this._drawLabel(this.unpressedLabel);
            }

            this.element.setAttribute("aria-pressed", this.pressed);
        }
    }
});
