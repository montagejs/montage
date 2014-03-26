 /*global require, exports*/

/**
 * @module montage/ui/base/abstract-button.reel
 * @requires montage/core/core
 * @requires montage/ui/component
 * @requires montage/ui/native-control
 * @requires montage/composer/press-composer
 */
var Montage = require("../../core/core").Montage,
    AbstractControl = require("./abstract-control").AbstractControl,
    PressComposer = require("../../composer/press-composer").PressComposer;

/**
 * @class AbstractButton
 * @extends AbstractControl
 * @fires AbstractButton#action
 * @fires AbstractButton#longAction
 */
var AbstractButton = exports.AbstractButton = AbstractControl.specialize( /** @lends AbstractButton# */ {

    /**
     * Dispatched when the button is activated through a mouse click, finger
     * tap, or when focused and the spacebar is pressed.
     * @event action
     * @memberof AbstractButton
     * @property {Dict} detail - The detail object as defined in  {@link
     * AbstractControl#detail}
     */

    /**
     * Dispatched when the button is pressed for a period of time, set by
     * {@link AbstractButton#holdThreshold}.
     * @event longAction
     * @memberof AbstractButton
     * @property {Dict} detail - The detail object as defined in {@link
     * AbstractControl#detail}
     */

    /**
     * @private
     */
    constructor: {
        value: function AbstractButton() {
            if(this.constructor ===  AbstractButton) {
                throw new Error("AbstractControl cannot be instantiated.");
            }
            this.super();
            this._pressComposer = new PressComposer();
            this.addComposer(this._pressComposer);
            this._pressComposer.defineBinding("longPressThreshold ", {"<-": "holdThreshold", source: this});

            //classList management
            this.defineBinding("classList.has('montage--disabled')", {"<-": "!enabled"});
            this.defineBinding("classList.has('montage--active')", {"<-": "active"});
        }
    },

    /**
     * Enables or disables the Button from user input. When this property is
     * set to `false`, the "montage--disabled" CSS style is applied to the
     * button's DOM element during the next draw cycle. When set to `true` the
     * "montage--disabled" CSS class is removed from the element's class
     * list.
     * @type {boolean}
     */
    enabled: {
        value: true
    },

    _preventFocus: {
        value: false
    },

    /**
     * Specifies whether the button should receive focus or not.
     * @type {boolean}
     * @default false
     * @event longpress
     * @memberof AbstractButton
     */
    preventFocus: {
        get: function () {
            return this._preventFocus;
        },
        set: function (value) {
            this._preventFocus = !!value;
            this.needsDraw = true;
        }
    },

    acceptsActiveTarget: {
        value: function() {
            return ! this._preventFocus;
        }
    },

    willBecomeActiveTarget: {
        value: function(previousActiveTarget) {

        }
    },

    /**
     * Stores the node that contains this button's value. Only used for
     * non-`<input>` elements.
     * @private
     */
    _labelNode: {value:undefined, enumerable: false},

    _label: { value: undefined, enumerable: false },

    /**
     * The displayed text on the button. In an &lt;input> element this is taken from the element's `value` attribute. On any other element (including &lt;button>) this is the first child node which is a text node. If one isn't found then it will be created.
     * If the button has a non-null `converter` property, the converter object's `convert()` method is called on the value before being assigned to the button instance.
     * @type {string}
     * @default undefined
     */
    label: {
        get: function() {
            return this._label;
        },
        set: function(value) {
            if (typeof value !== "undefined" && this.converter) {
                try {
                    value = this.converter.convert(value);
                    if (this.error) {
                        this.error = null;
                    }
                } catch(e) {
                    // unable to convert - maybe error
                    this.error = e;
                }
            }
            this._label = "" + value;
            this.needsDraw = true;
        }
    },

    /**
     * The amount of time in milliseconds the user must press and hold the
     * button a `longAction` event is dispatched. The default is 1 second.
     * @type {number}
     * @default 1000
     */
    holdThreshold: {
        value: 1000
    },

    _pressComposer: {
        value: null
    },

    _active: {
        value: false
    },

    /**
     * This property is true when the button is being interacted with, either
     * through mouse click or touch event, otherwise false.
     * @type {boolean}
     * @default false
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

    prepareForActivationEvents: {
        value: function() {
            this._pressComposer.addEventListener("pressStart", this, false);
            this._pressComposer.addEventListener("press", this, false);
            this._pressComposer.addEventListener("pressCancel", this, false);
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
     * Called when the user starts interacting with the component.
     * @private
     */
    handlePressStart: {
        value: function(event) {
            this.active = true;

            if (event.touch) {
                // Prevent default on touchmove so that if we are inside a scroller,
                // it scrolls and not the webpage
                document.addEventListener("touchmove", this, false);
            }

            if (!this._preventFocus) {
                this._element.focus();
            }
        }
    },

    /**
     * Called when the user has interacted with the button.
     * @private
     */
    handlePress: {
        value: function(event) {
            this.active = false;
            this.dispatchActionEvent();
            document.removeEventListener("touchmove", this, false);
        }
    },

    handleKeyup: {
        value: function(event) {
            // action event on spacebar
            if (event.keyCode === 32) {
                this.active = false;
                this.dispatchActionEvent();
            }
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
                // Only take the value from the element if it hasn't been set
                // elsewhere (i.e. in the serialization)
                if (this.isInputElement) {
                    if (this._label === undefined) {
                        this.label = this.originalElement.value;
                    }
                } else {
                    if (!this.originalElement.firstChild) {
                        this.originalElement.appendChild(document.createTextNode(""));
                    }
                    this._labelNode = this.originalElement.firstChild;
                    if (this._label === undefined) {
                        this.label = this._labelNode.data;
                    }
                }

                //this.classList.add("montage-Button");
                this.element.setAttribute("role", "button");
                this.element.addEventListener("keyup", this, false);
            }
        }
    },

    /**
     * Draws the label to the DOM.
     * @method
     * @private
     */
    _drawLabel: {
        enumerable: false,
        value: function(value) {
            if (this.isInputElement) {
                this._element.value = value;
            } else if (this._labelNode) {
                this._labelNode.data = value;
            }
        }
    },

    draw: {
        value: function() {
            if (this._elementNeedsTabIndex()) {
                if (this._preventFocus) {
                    this.element.removeAttribute("tabindex");
                } else {
                    this.element.setAttribute("tabindex", "-1");
                }
            }

            if (this.isInputElement) {
                this.element.disabled = !this.enabled;
            }

            this._drawLabel(this.label);
        }
    },

    _elementNeedsTabIndexRegex: {
        value: /INPUT|TEXTAREA|A|SELECT|BUTTON|LABEL/
    },

    _elementNeedsTabIndex: {
        value: function() {
            return this.element.tagName.match(this._elementNeedsTabIndexRegex) === null;
        }
    }

});

