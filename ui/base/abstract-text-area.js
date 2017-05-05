/*global require, exports, document, Error*/
var Component = require("../component").Component,
    deprecate = require('../../core/deprecate');

var CLASS_PREFIX = "montage-TextArea";

/**
 * @class AbstractTextArea
 * @extends Component
 */
var AbstractTextArea = exports.AbstractTextArea = Component.specialize(
/** @lends AbstractTextArea# */
{

    constructor: {
        value: function AbstractTextArea() {
            if(this.constructor === AbstractTextArea) {
                throw new Error("AbstractTextArea cannot be instantiated.");
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
            this._value = value;
            this.needsDraw = true;
        },
        get: function () {
            return this._value;
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
            var value = this.value;
            this.element.value = value || false === value ? value.toString() : "";
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

    _updateValueFromDom: {
        value: function () {
            if (this._value !== this.element.value) {
                this._value = this.element.value;
                this.dispatchOwnPropertyChange("value", this._value);
            }
        }
    }

});

