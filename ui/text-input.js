/**
    @module montage/ui/text-input
*/
var Control = require("ui/control").Control,
    deprecate = require("core/deprecate");

/**
    The base class for all text-based input components. You typically won't create instances of this prototype.
    @class module:montage/ui/text-input.TextInput
    @extends module:montage/ui/component.Component
    @see {module:"montage/ui/input-date.reel".DateInput}
    @see module:"montage/ui/input-text.reel".InputText
    @see module:"montage/ui/input-number.reel".InputNumber
    @see module:"montage/ui/input-range.reel".RangeInput
    @see module:"montage/ui/textarea.reel".TextArea

*/

/*

To-DO: Move value logic with converter to Control


*/

var TextInput = exports.TextInput =  Control.specialize(/** @lends module:montage/ui/text-input.TextInput# */ {
    select: {
        value: function() {
            this._element.select();
        }
    },

    _hasStandardElement: {
        value: true
    },

    /**
        Hard to imagine a text-input that is not using a input nor textarea
        @type {boolean}
        @default true
    */
    _updateOnInput: {
        value: true
    },

/**
    When this property and the converter's <code>allowPartialConversion</code> are both true, as the user enters text in the input element each new character is added to the component's <code>value</code> property, which triggers the conversion. Depending on the type of input element being used, this behavior may not be desirable. For instance, you likely would not want to convert a date string as a user is entering it, only when they've completed their input.
    Specifies whether
    @type {boolean}
    @default true
*/
    updateOnInput: {
        get: function() {
            return !!this._updateOnInput;
        },
        set: function(v) {
            this._updateOnInput = v;
        }
    },

    // HTMLInputElement methods

    // select() defined where it's allowed
    // click() deliberately omitted, use focus() instead

    // Callbacks

    enterDocument: {
        value: function(firstTime) {
            if (firstTime) {

                if (this._value === this.constructor.prototype._value) {
                    this.value = this.originalElement ? this.originalElement.textContent : this._element.textContent;
                }

                if(this.hasStandardElement || this.element.contentEditable === "true") {
                    this.element.addEventListener('input', this);
                    this.element.addEventListener('change', this);
                }

            }
        }
    },

    _setElementValue: {
        value: function(value) {
            var drawValue;
            if (value === null ||  typeof value === "undefined") {
                drawValue = "";
            }
            else drawValue = String((value == null ? '' : value));

            if (drawValue !== this.element.value) {
                this.element.value = drawValue;
            }
        }
    },

    drawsFocusOnPointerActivation : {
        value: true
    },

    draw: {
        enumerable: false,
        value: function() {
            Control.prototype.draw.call(this);

            var el = this.element;

            //if (!this._valueSyncedWithElement) {
                this._setElementValue(this.converter ? this.converter.convert(this._value) : this._value);
            //}

            if (this.error) {
                el.classList.add('montage--invalidText');
                el.title = this.error.message || '';
            } else {
                el.classList.remove("montage--invalidText");
                el.title = '';
            }
        }
    },

    didDraw: {
        enumerable: false,
        value: function() {
            if (this._hasFocus && this._value != null) {
                var length = this._value.toString().length;
                this.element.setSelectionRange(length, length);
            }
            // The value might have been changed during the draw if bindings
            // were reified, and another draw will be needed.
            if (!this.needsDraw) {
                this._valueSyncedWithElement = true;
            }
        }
    },


    // Event handlers

    handleInput: {
        enumerable: false,
        value: function() {
            if (this.converter) {
                if (this.converter.allowPartialConversion === true && this.updateOnInput === true) {
                    this.takeValueFromElement();
                }
            } else if(this.updateOnInput === true){
                this.takeValueFromElement();
            }
        }
    },
/**
    Description TODO
    @function
    @param {Event Handler} event TODO
    */
    handleChange: {
        enumerable: false,
        value: function(event) {
            this.takeValueFromElement();
            this.dispatchActionEvent();
            this._hasFocus = false;
        }
    },
/**
    Description TODO
    @function
    @param {Event Handler} event TODO
    */
    handleBlur: {
        enumerable: false,
        value: function(event) {
            this.super(event) ;
            this.takeValueFromElement();
            this.dispatchActionEvent();
        }
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

});

// Standard <input> tag attributes - http://www.w3.org/TR/html5/the-input-element.html#the-input-element

TextInput.addAttributes({
    accept: null,
    alt: null,
    autocomplete: null,
    checked: {dataType: "boolean"},
    dirname: null,
    formaction: null,
    formenctype: null,
    formmethod: null,
    formnovalidate: {dataType: 'boolean'},
    formtarget: null,
    height: null,
    list: null,
    maxlength: null,
    multiple: {dataType: 'boolean'},
    pattern: null,
    placeholder: null,
    readonly: {dataType: 'boolean'},
    required: {dataType: 'boolean'},
    size: null,
    src: null,
    width: null
    // "type" is not bindable and "value" is handled as a special attribute
});
