/**
    @module "montage/ui/number-field.reel"
    @requires montage/ui/text-input
*/

var TextInput = require("ui/text-input").TextInput,
    RangeEnforcer = require("core/converter/range-enforcer").RangeEnforcer;
    

/**
 * Wraps the a &lt;input type="number"> element with binding support for the element's standard attributes.
   @class module:"montage/ui/number-field.reel".NumberField
   @extends module:montage/ui/text-input.TextInput
 */
var NumberField = exports.NumberField = TextInput.specialize({

    enterDocument:{
        value: function(firstTime) {
            this.super(firstTime);
            this.converter = new RangeEnforcer();
            this.converter.min = this.min;
            this.converter.max = this.max;
        }
    },

    hasTemplate: {value: false }
});

NumberField.addAttributes(/** @lends module:"montage/ui/number-field.reel".NumberField */{

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
