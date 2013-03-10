/**
	module:"montage/ui/text.reel"
    @requires montage/core/core
    @requires montage/ui/component
*/
var Montage = require("montage").Montage,
    Component = require("ui/component").Component;

/**
 @class module:"montage/ui/text.reel".Text
 @extends module:montage/ui/component.Component
 */
exports.Text = Montage.create(Component, /** @lends module:"montage/ui/text.reel".Text# */ {

    hasTemplate: {
        value: false
    },

    _value: {
        value: null
    },

    /**
        Description TODO
        @type {Property}
        @default null
    */
    value: {
        get: function() {
            return this._value;
        },
        set: function(value) {
            if (this._value !== value) {
                this._value = value;
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
        @default {String} ""
    */
    defaultValue: {
        value: ""
    },

    _valueNode: {
        value: null
    },

    _RANGE: {
        value: document.createRange()
    },

    prepareForDraw: {
        value: function() {
            var range = this._RANGE;
            range.selectNodeContents(this.element);
            range.deleteContents();
            this._valueNode = document.createTextNode("");
            range.insertNode(this._valueNode);
        }
    },

    draw: {
        value: function() {
            // get correct value
            var value = this._value, displayValue = (value || 0 === value ) ? value : this.defaultValue;

            if (this.converter) {
                displayValue = this.converter.convert(displayValue);
            }

            //push to DOM
            this._valueNode.data = displayValue;
        }
    }

});
