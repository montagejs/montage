/**
    @module montage/ui/text.reel
    @requires montage
    @requires montage/ui/component
*/
var Montage = require("montage").Montage,
    Component = require("ui/component").Component;

/**
 @class Text
 @extends Component
 */
exports.Text = Component.specialize( /** @lends Text# */ {

    constructor: {
        value: function Text() {
            this.super();
        }
    },

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

    enterDocument: {
        value: function(firstTime) {
            if (firstTime) {
                var range = this._RANGE;
                range.selectNodeContents(this.element);
                range.deleteContents();
                this._valueNode = document.createTextNode("");
                range.insertNode(this._valueNode);
                this.element.classList.add("montage-Text");
            }
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
