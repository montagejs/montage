/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2012 Motorola Mobility, Inc.  All Rights Reserved.
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
 @function module:montage/core/converter/currency-converter.#formatCurrency
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
 @class module:montage/core/converter/currency-converter.CurrencyConverter
 @classdesc Formats a value as a currency.
 @extends module:montage/core/converter/number-converter.NumberConverter
 */
exports.CurrencyConverter = Montage.create(NumberConverter, /** @lends module:montage/core/converter.CurrencyConverter# */ {

    /**
        @type {Property}
        @default {String} '$'
    */
    currency: {
        value: '$',
        serializable: true
    },

    /**
        @type {Property}
        @default {Number} 2
    */
    decimals: {
        value: 2,
        serializable: true
    },

    /**
        @type {Property}
        @default {Boolean} false
    */
    useParensForNegative: {
        value: false,
        serializable: true
    },

    /**
     @function
     @param {String} v
     @returns {string} The formatted currency value.
     */
    convert: {
        value: function(v) {
            return formatCurrency(v, this.currency, this.decimals, this.useParensForNegative);
        }
    }

});
