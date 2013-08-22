/*global require, exports, document, Error*/
var Montage = require("montage").Montage,
    AbstractControl = require("ui/base/abstract-control").AbstractControl,
    KeyComposer = require("composer/key-composer").KeyComposer,
    Dict = require("collections/dict");

var CLASS_PREFIX = "montage-TextField";

/**
 * @class AbstractTextField
 * @extends AbstractControl
 */
var AbstractTextField = exports.AbstractTextField = AbstractControl.specialize(
    /* @lends AbstractTextField# */
{
    /**
     * Dispatched when the textfield is activated through a enter.
     * @event action
     * @memberof AbstractTextField
     * @param {Event} event
     */

    constructor: {
        value: function AbstractTextField() {
            if(this.constructor === AbstractTextField) {
                throw new Error("AbstractTextField cannot be instantiated.");
            }
            AbstractControl.constructor.call(this); // super

            this._keyComposer = new KeyComposer();
            this._keyComposer.component = this;
            this._keyComposer.keys = "enter";
            this.addComposer(this._keyComposer);

            this.defineBindings({
                // classList management
                "classList.has('montage--disabled')": {
                    "<-": "!enabled"
                }
            });
        }
    },

    hasTemplate: {
        value: false
    },

    acceptsActiveTarget: {
        get: function() {
            var shouldBeginEditing = this.callDelegateMethod("shouldBeginEditing", this);
            return (shouldBeginEditing !== false);
        }
    },

    delegate: {
        value: null
    },

    enabled: {
        value: true
    },

    _placeholderValue: {
        value: null
    },

    placeholderValue: {
        set: function(value) {
            this._placeholderValue = value;
            this.needsDraw = true;
        },
        get: function() {
            return this._placeholderValue;
        }
    },

    _value: {
        value: null
    },

    value: {
        set: function(value) {
            if (value !== this._value && !this.hasFocus) {
                this._value = value;
                this.needsDraw = true;
            }
        },
        get: function() {
            return this._value;
        }
    },

    _hasFocus: {
        value: false
    },

    hasFocus: {
        get: function() {
            return this._hasFocus;
        }
    },

    _keyComposer: {
        value: null
    },

    handleKeyPress: {
        value: function(evt) {
            if (!this.enabled || evt.keyComposer !== this._keyComposer) {
                return;
            }

            this.dispatchActionEvent();
        }
    },

    prepareForActivationEvents: {
        value: function() {
            // Due to a current issue with how the key manager works we need
            // to listen on both the component and the key composer.
            // The key composer dispatches the event on the activeTarget
            // (the component), and we need to listen on the key composer so
            // that the listeners are installed.
            this.addEventListener("keyPress", this, false);
            this._keyComposer.addEventListener("keyPress", null, false);
        }
    },

    enterDocument: {
        value: function(firstTime) {
            if (firstTime) {
                this.element.addEventListener("input", this, false);
                this.element.addEventListener("change", this, false);
                this.element.addEventListener("focus", this, false);
                this.element.addEventListener("blur", this, false);
            }
        }
    },

    draw: {
        value: function() {
            var value = this.value;
            this.element.value = value || false === value ? value.toString() : "";
            if (this.placeholderValue != null) {
                this.element.setAttribute("placeholder", this.placeholderValue);
            }
        }
    },

    handleChange: {
        value: function() {
            this._updateValueFromDom();
        }
    },

    handleInput: {
        value: function(event) {
            this._updateValueFromDom();
        }
    },

    handleFocus: {
        value: function(event) {
            if (this.acceptsActiveTarget) {
                this._hasFocus = true;
                this.callDelegateMethod("didBeginEditing", this);
            } else {
                this.element.blur();
            }
        }
    },

    handleBlur: {
        value: function(event) {
            var shouldEnd = this.callDelegateMethod("shouldEndEditing", this);
            if (shouldEnd === false) {
                this.element.focus();
            } else {
                this._hasFocus = false;
                this.callDelegateMethod("didEndEditing", this);
            }
        }
    },

    _updateValueFromDom: {
        value: function() {
            if (this._value !== this.element.value) {
                this._value = this.element.value;
                this.dispatchOwnPropertyChange("value", this._value);
                this.callDelegateMethod("didChange", this);
            }
        }
    }
});
