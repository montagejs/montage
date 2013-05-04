/*global require, exports, document, Error*/
var Montage = require("montage").Montage,
    Component = require("ui/component").Component,
    Dict = require("collections/dict");

var CLASS_PREFIX = "montage-TextArea";

/**
 * @class AbstractTextArea
 * @extends Component
 */
var AbstractTextArea = exports.AbstractTextArea = Montage.create(Component,
    /* @lends AbstractTextArea# */
{
    create: {
        value: function() {
            if(this === AbstractTextArea) {
                throw new Error("AbstractTextArea cannot be instantiated.");
            } else {
                return Component.create.apply(this, arguments);
            }
        }
    },

    didCreate: {
        value: function() {
            Component.didCreate.call(this); // super

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
            this._value = value;
            this.needsDraw = true;
        },
        get: function() {
            return this._value;
        }
    },

    /**
     * The data property of the action event.
     * example to toggle the complete class: "detail.get('selectedItem')" : { "<-" : "@repetition.objectAtCurrentIteration"}
     * @type {Dict}
     * @default null
     */
    detail: {
        get: function() {
            if (this._detail == null) {
                this._detail = new Dict();
            }
            return this._detail;
        }
    },

    enterDocument: {
        value: function(firstTime) {
            if (firstTime) {
                this.element.addEventListener("input", this, false);
                this.element.addEventListener("change", this, false);
            }
        }
    },

    draw: {
        value: function() {
            this.element.value = this.value;
            this.element.setAttribute("placeholder", this._placeholderValue);
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

    _updateValueFromDom: {
        value: function() {
            if (this._value !== this.element.value) {
                this._value = this.element.value;
                this.dispatchOwnPropertyChange("value", this._value);
            }
        }
    }
});
