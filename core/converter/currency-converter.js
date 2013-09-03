/* <copyright>
</copyright> */
/**
 * @module montage/core/converter/currency-converter
 * @requires montage/core/core
 * @requires montage/core/converter/converter
 * @requires montage/core/converter/number-converter
 */
var Montage = require("montage").Montage;
var Converter = require('core/converter/converter');
var numericValueToString = require("core/converter/number-converter").numericValueToString;
var NumberConverter = require("core/converter/number-converter").NumberConverter;

/**
 * @class CurrencyConverter
 * @classdesc Formats a value as a currency.
 * @extends NumberConverter
 */
exports.CurrencyConverter = NumberConverter.specialize( /** @lends CurrencyConverter# */ {

    /**
     * @type {String}
     * @default {String} '$'
     */
    currency: {
        value: '$'
    },

    /**
     * @type {Number}
     * @default {Number} 2
     */
    decimals: {
        value: 2
    },

    /**
     * @type {Boolean}
     * @default {Boolean} false
     */
    useParensForNegative: {
        value: false
    },

    /**
     * @type {Boolean}
     * @default {Boolean} false
     */
    showCurrencyBeforeNumber: {
        value: false
    },

    forceDecimals: {
        value: true
    },

    /**
     * @function
     * @param {Number} amount
     * @returns {String} The formatted currency value.
     */
    convert: {
        value: function(amount) {
            var stringValue = this.super(amount);
            if ((amount < 0) && this.useParensForNegative) {
                stringValue = '(' + stringValue.substring(1, stringValue.length) + ')';
            }

            if(this.showCurrencyBeforeNumber) {
                stringValue = this.currency + ' ' + stringValue;
            } else {
                stringValue = stringValue + ' ' + this.currency;
            }
            return stringValue;
        }
    }

});
