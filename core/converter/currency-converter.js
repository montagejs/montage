/* <copyright>
Copyright (c) 2012, Motorola Mobility LLC.
All Rights Reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

* Redistributions of source code must retain the above copyright notice,
  this list of conditions and the following disclaimer.

* Redistributions in binary form must reproduce the above copyright notice,
  this list of conditions and the following disclaimer in the documentation
  and/or other materials provided with the distribution.

* Neither the name of Motorola Mobility LLC nor the names of its
  contributors may be used to endorse or promote products derived from this
  software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE
LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
POSSIBILITY OF SUCH DAMAGE.
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
        value: '$'
    },

    /**
        @type {Property}
        @default {Number} 2
    */
    decimals: {
        value: 2
    },

    /**
        @type {Property}
        @default {Boolean} false
    */
    useParensForNegative: {
        value: false
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
