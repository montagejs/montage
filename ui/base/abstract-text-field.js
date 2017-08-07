/*global require, exports, document, Error*/
var AbstractControl = require("./abstract-control").AbstractControl,
    KeyComposer = require("../../composer/key-composer").KeyComposer,
    deprecate = require('../../core/deprecate');


/**
 * @class AbstractTextField
 * @extends AbstractControl
 */
var AbstractTextField = exports.AbstractTextField = AbstractControl.specialize(/** @lends AbstractTextField# */ {

    /**
     * Dispatched when the textfield is activated when the user presses enter.
     * @event action
     * @memberof AbstractTextField
     * @param {Event} event
     */
    constructor: {
        value: function AbstractTextField() {
            if(this.constructor === AbstractTextField) {
                throw new Error("AbstractTextField cannot be instantiated.");
            }

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
        get: function () {
            return (this.callDelegateMethod("shouldBeginEditing", this) !== false);
        }
    },

    delegate: {
        value: null
    },

    enabled: {
        value: true
    },

    _placeholder: {
        value: null
    },

    placeholderValue: {
        set: function (value) {
            deprecate.deprecationWarning("placeholderValue", "placeholder")
            this.placeholder = value;
        },
        get: function () {
            return this.placeholder;
        }
    },

    placeholder: {
        set: function (value) {
            this._placeholder = value;
            this.needsDraw = true;
        },
        get: function () {
            return this._placeholder;
        }
    },

    _value: {
        value: null
    },

    value: {
        set: function (value) {
            if (value !== this._value) {
                if (!this.hasFocus || this.callDelegateMethod("shouldAcceptValue", this, value)) {
                    this._value = value;
                    this.needsDraw = true;
                }
            }
        },
        get: function () {
            return this._value;
        }
    },

    errorMessage: {
        value: null
    },

    /**
     * An optional converter for transforming the `value` into the
     * corresponding rendered text.
     * Converters are called at time of draw.
     * @type {?Converter}
     * @default null
     */
    converter: {
        value: null
    },

    _hasFocus: {
        value: false
    },

    hasFocus: {
        set: function (value) {
            this._hasFocus = value;
        },
        get: function () {
            return this._hasFocus;
        }
    },

    __keyComposer: {
        value: null
    },

    _keyComposer: {
        get: function () {
            if (!this.__keyComposer) {
                this.__keyComposer = new KeyComposer();
                this.__keyComposer.component = this;
                this.__keyComposer.keys = "enter";
                this.addComposer(this.__keyComposer);
            }

            return this.__keyComposer;
        }
    },

    handleKeyPress: {
        value: function (evt) {
            if (!this.enabled || evt.keyComposer !== this._keyComposer) {
                return;
            }

            this.dispatchActionEvent();
        }
    },

    prepareForActivationEvents: {
        value: function () {
            this._keyComposer.addEventListener("keyPress", this, false);
        }
    },

    enterDocument: {
        value: function (firstTime) {
            if (firstTime) {
                this.element.addEventListener("input", this, false);
                this.element.addEventListener("change", this, false);
            }
        }
    },

    draw: {
        value: function () {
            var displayValue = this.value,
                typeOfDisplayValue,
                
                // FIXME: the cursor position should be also check in the new textField control
                start = this.element.selectionStart,
                end = this.element.selectionEnd;

            if (this.converter) {
                displayValue = this.converter.convert(displayValue);
            }

            // need to be check after the converter convert the value.
            typeOfDisplayValue = typeof displayValue;

            if (displayValue === null || typeOfDisplayValue === "undefined") {
                this.element.value = "";
            } else if (typeOfDisplayValue === "boolean" || typeOfDisplayValue === "object" || typeOfDisplayValue === "number") {
                this.element.value = displayValue.toString();
            } else {
                this.element.value = displayValue;
            }

            if (this.eventManager.activeTarget === this && typeof this.element.setSelectionRange === "function") {
                // restore the previous cursor position.
                // TODO: contenteditable?
                this.element.setSelectionRange(start, end);
            }   

            if (this._placeholder) {
                this.element.setAttribute("placeholder", this._placeholder);
            }

            this.element.disabled = !this.enabled;
        }
    },

    handleChange: {
        value: function () {
            this._updateValueFromDom();
        }
    },

    handleInput: {
        value: function (event) {
            this._updateValueFromDom();
        }
    },

    willBecomeActiveTarget: {
        value: function (event) {
            this.hasFocus = true;
            this.callDelegateMethod("didBeginEditing", this);
        }
    },

    surrendersActiveTarget: {
        value: function (event) {
            if (this.callDelegateMethod("shouldEndEditing", this) === false) {
                return false;
            }

            this._hasFocus = false;
            this.callDelegateMethod("didEndEditing", this);

            return true;
        }
    },

    _updateValueFromDom: {
        value: function () {
            var displayedValue,
                value = displayedValue = this.element.value;

            if (this.converter) {
                try {
                    value = this.converter.revert(displayedValue);
                    this.errorMessage = null;

                } catch (error) {
                    this.errorMessage = error.message || error;
                }
            }

            if (this._value !== value) {
                this._value = value;

                this.dispatchOwnPropertyChange("value", this._value);
                this.callDelegateMethod("didChange", this);
            }

            if (this.converter) {
                //safer -> be sure this._value is set before request a draw.
                this.needsDraw = true;
            }
        }
    }

});
