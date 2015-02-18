
var Montage = require("montage").Montage,
    Component = require("montage/ui/component").Component;

exports.Double = Component.specialize( {

    hasTemplate: {
        value: false
    },

    _value: {
        value: null
    },

    value: {
        get: function () {
            return this._value;
        },
        set: function (value) {
            if (this._value !== value) {
                this._value = value;
                this.needsDraw = true;
            }
        }
    },

    _secondValue: {
        value: null
    },

    secondValue: {
        get: function () {
            return this._secondValue;
        },
        set: function (value) {
            if (this._secondValue !== value) {
                this._secondValue = value;
                this.needsDraw = true;
            }
        }
    },

    /**
        The Montage converted used to convert or format values displayed by this Text instance.
        @type {Property}
        @default null
    */
    converter: {
        value: null
    },

    /**
        The default string value assigned to the Text instance.
        @type {Property}
        @default {string} ""
    */
    defaultValue: {
        value: ""
    },

    _valueNode: {
        value: null
    },

    _secondValueNode: {
        value: null
    },

    _RANGE: {
        value: document.createRange()
    },

    enterDocument: {
        value: function (firstTime) {
            if (firstTime) {
                var range = this._RANGE;
                range.selectNodeContents(this.element);
                range.deleteContents();
                this._valueNode = document.createTextNode("");
                range.insertNode(this._valueNode);
                this._secondValueNode = document.createTextNode("");
                range.insertNode(this._secondValueNode);
            }
        }
    },

    draw: {
        value: function () {
            // get correct value
            var value = this._value,
                displayValue = (value || 0 === value ) ? value : this.defaultValue;
            var secondValue = this._secondValue,
                secondDisplayValue = (secondValue || 0 === secondValue ) ? secondValue : this.defaultValue;

            if (this.converter) {
                displayValue = this.converter.convert(displayValue);
                secondDisplayValue = this.converter.convert(secondDisplayValue);
            }

            //push to DOM
            this._valueNode.data = displayValue;
            this._secondValueNode.data = secondDisplayValue;
        }
    }

});
