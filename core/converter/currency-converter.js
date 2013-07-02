/* <copyright>
</copyright> */
/**
	@module montage/core/converter/currency-converter
    @requires montage/core/core
    @requires montage/core/converter/converter
    @requires montage/core/converter/number-converter
*/
var Montage = require("montage").Montage;
var Converter = require('core/converter/converter');
var numericValueToString = require("core/converter/number-converter").numericValueToString;
var NumberConverter = require("core/converter/number-converter").NumberConverter;
/**
 Formats a number as a human-readable currency value.
 @private
 @function #formatCurrency
 @param {Property} value
 @param {String} currency
 @param {Number} decimals
 @param {String} useParensForNegative
 @returns stringValue
*/
var formatCurrency = function(value, currency, decimals, useParensForNegative) {
    var stringValue = numericValueToString(value, decimals);
    currency = currency || '$';
    if ((value < 0) && useParensForNegative) {
        stringValue = '(' + stringValue.substring(1, stringValue.length) + ')';
    }

    stringValue = stringValue + ' ' + currency;
    return stringValue;
};
/**
 @class CurrencyConverter
 @classdesc Formats a value as a currency.
 @extends NumberConverter
 */
exports.CurrencyConverter = NumberConverter.specialize( /** @lends CurrencyConverter# */ {

    /**
        @type {String}
        @default {String} '$'
    */
    currency: {
        value: '$'
    },

    /**
        @type {Number}
        @default {Number} 2
    */
    decimals: {
        value: 2
    },

    /**
        @type {Boolean}
        @default {Boolean} false
    */
    useParensForNegative: {
        value: false
    },

    /**
     @function
     @param {Number} amount
     @returns {String} The formatted currency value.
     */
    convert: {
        value: function(amount) {
            return formatCurrency(amount, this.currency, this.decimals, this.useParensForNegative);
        }
    }

});
