/**
    @module "montage/ui/native/textarea.reel"
*/

var TextInput = require("ui/text-input").TextInput;

/**
 * Wraps the a &lt;textarea> element with binding support for the element's standard attributes. Uses an ArrayController instance to manage the element's contents and selection.
   @class module:"montage/ui/native/textarea.reel".Textarea
   @extends module:montage/ui/text-input.TextInput
 */

var TextArea = exports.TextArea = TextInput.specialize(/** @lends module:"montage/ui/native/textarea.reel".Textarea# */ {
    
    hasTemplate: {value: false },

    _placeholder: {
        value: null
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

TextArea.addAttributes( /** @lends module:"montage/ui/native/textarea.reel".Textarea# */ {

/**
    The maximum number of characters per line of text to display.
    @type {number}
    @default null
*/
        cols: null,

/**
    The number of lines of text the browser should render for the textarea.
    @type {number}
    @default null
*/
        rows: null,

/**
    If the value of this property is "hard", the browser will insert line breaks such that each line of user input has no more characters than the value specified by the <code>cols</code> property. If the value is "soft" then no line breaks will be added.
    @type {string}
    @default
*/
        wrap: null
});
