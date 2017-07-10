/**
 * @module "montage/ui/text.reel"
 */
var Component = require("../component").Component,
    PressComposer = require("../../composer/press-composer").PressComposer;

/**
 * A Text component shows plain text. Any text can be safely displayed without
 * escaping, but the browser will treat all sequences of white space as a
 * single space.
 *
 * The text component replaces the inner DOM of its element with a TextNode and
 * it renders the [value]{@link Text#value} string in it.
 *
 * @class Text
 * @classdesc A component that displays a string of plain text.
 * @extends Component
 */
exports.Text = Component.specialize( /** @lends Text.prototype # */ {

    constructor: {
        value: function () {
            this._pressComposer = new PressComposer();
            this.addComposer(this._pressComposer);
        }
    },

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
            this._valueNode.data = this.converter ? this.converter.convert(displayValue) : displayValue;
        }
    },

    prepareForActivationEvents: {
        value: function () {
            this.super();
            this._pressComposer.addEventListener("press", this, false);
        }
    },

    _pressComposer: {
        value: null
    },

    target: {
        value: null
    },

    action: {
        value: "activate"
    },

    handlePress: {
        value: function (event) {
            this.super(event);
            if(this.target && typeof this.target[this.action] == "function") {
                this.target[this.action]({ from: this });
            }
        }
    }

});
