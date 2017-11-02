/**
    @module "montage/ui/number-field.reel"
    @requires montage/ui/text-input
*/

var TextInput = require("ui/text-input").TextInput,
    MinMaxConverter = require("core/converter/min-max-converter.js").MinMaxConverter;
   
/**
 * Wraps the a &lt;input type="date"> element with binding support for the element's standard attributes.
   @class module:"montage/ui/native/input-number.reel".InputNumber
   @extends module:montage/ui/text-input.TextInput
 */
var NumberField = exports.NumberField = TextInput.specialize({

    enterDocument:{
        value: function() {
            if(this.min || this.max) {
                this.converter = new MinMaxConverter(this.min, this.max);
            }
        }
    },

    hasTemplate: {value: false }
});

NumberField.addAttributes(/** @lends module:"montage/ui/native/input-number.reel".InputNumber */{

/**
    The maximum value displayed but the number control.
    @type {number}
    @default null
*/
    max: {dataType: 'number'},

/**
    The minimum value displayed but the number control.
    @type {number}
    @default null
*/
    min: {dataType: 'number'},

/**
    The amount the number changes with each step.
    @type {number}
    @default null
*/
    step: null // number or 'any'
});
