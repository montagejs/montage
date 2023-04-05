/**
 * Provides common conversion, validation, and formatting functions for
 * different types of values.
 *
 * @module montage/core/converter/converter
 * @requires montage/core/core
 */
var MontageModule = require("../core"),
    Montage = MontageModule.Montage,
    objectDescriptorModuleIdDescriptor = MontageModule._objectDescriptorModuleIdDescriptor,
    objectDescriptorDescriptor = MontageModule._objectDescriptorDescriptor;

/**
 * @const {string}
 */
var FUNCTION_CLASS = '[object Function]',
    BOOLEAN_CLASS = '[object Boolean]',
    NUMBER_CLASS = '[object Number]',
    STRING_CLASS = '[object String]',
    ARRAY_CLASS = '[object Array]',
    DATE_CLASS = '[object Date]';

var _toString = Object.prototype.toString;

/**
 * @exports module:montage/core/converter#isNumber
 * @function
 * @private
 */
var isNumber = function (object) {
    return _toString.call(object) === NUMBER_CLASS;
};
exports.isNumber = isNumber;


/**
 * @exports module:montage/core/converter#isDef
 * @function
 * @private
 */
var isDef = function (obj) {
    return (obj && typeof obj !== 'undefined');
};
exports.isDef = isDef;

// Validators
/**
 * Base validator object.
 * @class Validator
 * @extends Montage
 */
var Validator = exports.Validator = Montage.specialize( /** @lends Validator# */{
    /**
     * @type {Object}
     * @default null
     */
    validate: {
        value: null
    }
});


// Converters

/**
 * Converts and optionally reverts values between two domains. The converter
 * interface consists of two methods:
 *
 * -   `convert(input)`: convert input to output
 * -   `revert(output)`: optional, converts output back to input
 *
 * @class Converter
 * @classdesc An abstract type for converters, objects that can convert and
 * optionally revert values between domains, like strings and numbers.
 */
var Converter = exports.Converter = Montage.specialize( /** @lends Converter# */ {

    /**
     * Specifies whether the converter allows partial conversion.
     * @type {boolean}
     * @default true
     */
    allowPartialConversion: {
        value: true
    },

    /**
     * Specifies whether the converter can convert an array of the type of values it can handle individually .
     * @type {boolean}
     * @default false
     */
    canConvertValueArray: {
        value: false
    },

    /**
     * Specifies whether the converter can convert an array of the type of values it can handle individually .
     * @type {boolean}
     * @default false
     */
    canRevertValueArray: {
        value: false
    },


    /**
     * Converts values from the input domain into the output range.
     * @function
     * @default null
     */
    convert: {
        enumerable: false,
        value: null
    },

    /**
     * Optionally, reverts values from the output range, back into the input
     * range. This may not be possible with high fidelity depending on the
     * relationship between these domains.
     * @function
     * @default null
     */
    revert: {
        enumerable: false,
        value: null
    }

}, {

    objectDescriptorModuleId: objectDescriptorModuleIdDescriptor,

    objectDescriptor: objectDescriptorDescriptor

});

