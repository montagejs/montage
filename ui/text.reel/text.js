/*global require, exports, console, MontageElement */

/**
 * @module "montage/ui/text.reel"
 */
var Component = require("../component").Component;

/**
 * A Text component shows plain text. Any text can be safely displayed without
 * escaping, but the browser will treat all sequences of white space as a
 * single space.
 *
 * The text component replaces the inner DOM of its element with a TextNode and
 * it renders the [value]{@link Text#value} string in it.
 *
 * @class module:montage/ui/text.Text
 * @extends module:montage/ui/component.Component
 * @classdesc A component that displays a string of plain text.
 */
var MontageText = exports.Text = Component.specialize( /**  @lends module:montage/ui/text.Text# */ {

    hasTemplate: {
        value: false
    },

    _value: {
        value: null
    },

    /**
     * The string to be displayed. `null` is equivalent to the empty string.
     * @type {string}
     * @default null
     */
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

    /**
     * An optional reverter for transforming the `value` into the
     * corresponding rendered text.
     * Converters are called at time of draw.
     * @type {?Converter}
     * @default null
    */
    reverter: {
        value: null
    },

    /**
     * The default string value assigned to the Text instance.
     * @type {string}
     * @default "" empty string
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
        value: function (firstTime) {
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
        value: function () {
            // get correct value
            var displayValue = (typeof this._value !== "undefined" && this._value !== null) ? this._value : this.defaultValue;

            //push to DOM
            this._valueNode.data =  this.converter ?    this.converter.convert(displayValue) : 
                                    this.reverter ?     this.reverter.revert(displayValue) : 
                                                        displayValue;
        }
    }

});

if (window.MontageElement) {
    MontageElement.define("montage-text", MontageText, {
        observedAttributes: ['value']
    });
}
