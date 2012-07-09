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

// Number and String formatting functions from Google Closure Library - http://code.google.com/closure/library/
// /library/format/format.js

// Copyright 2010 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//
/**
	@module montage/core/converter/number-converter
    @requires montage/core/core
    @requires montage/core/converter/converter
*/
var Montage = require("montage").Montage;
var Converter = require('core/converter/converter').Converter;
var Validator = require("core/converter/converter").Validator;
var isNumber = require('core/converter/converter').isNumber;
var isDef = require('core/converter/converter').isDef;

/**
 Regular expression for detecting scaling units, such as K, M, G, etc. for<br>
 converting a string representation to a numeric value.
 Also allow 'k' to be aliased to 'K'.  These could be used for SI (powers<br>
 of 1000) or Binary (powers of 1024) conversions.<br>
 Also allow final 'B' to be interpreted as byte-count, implicitly triggering<br>
 binary conversion (e.g., '10.2MB').
 @type {RegExp}
 @memberof module:montage/core/converter#
 @private
 */
var SCALED_NUMERIC_RE_ = /^([\-]?\d+\.?\d*)([K,M,G,T,P,k,m,u,n]?)[B]?$/;

/**
 Ordered list of scaling prefixes in decreasing order.
 @memberof module:montage/converter#
 @type {Array}
 @private
 */
    // kishore - changed prefix 'G' to 'B' to represent Billion
var NUMERIC_SCALE_PREFIXES_ = [
    'P', 'T', 'B', 'M', 'K', '', 'm', 'u', 'n'
];


/**
 Scaling factors for conversion of numeric value to string.  SI conversion.
 @memberof module:montage/converter#
 @type {Object}
 @private
 */
var NUMERIC_SCALES_SI_ = exports.NUMERIC_SCALES_SI_ = {
    '': 1,
    'n': 1e-9,
    'u': 1e-6,
    'm': 1e-3,
    'k': 1e3,
    'K': 1e3,
    'M': 1e6,
    'B': 1e9,
    'T': 1e12,
    'P': 1e15
};

/**
 Scaling factors for conversion of numeric value to string. Binary conversion.
 @memberof module:montage/converter#
 @type {Object}
 @private
 */
var NUMERIC_SCALES_BINARY_ = exports.NUMERIC_SCALES_BINARY_ = {
    '': 1,
    'n': Math.pow(1024, -3),
    'u': Math.pow(1024, -2),
    'm': 1.0 / 1024,
    'k': 1024,
    'K': 1024,
    'M': Math.pow(1024, 2),
    'G': Math.pow(1024, 3),
    'T': Math.pow(1024, 4),
    'P': Math.pow(1024, 5)
};

/**
 * Converts a numeric value to string, using specified conversion scales.
 * @memberof module:montage/converter#
 * @param {Number} val Value to be converted.
 * @param {Object} conversion Dictionary of scaling factors.
 * @param {Number} opt_decimals The number of decimals to use.  Default is 2.
 * @param {String} opt_suffix Optional suffix to append.
 * @return {String} The human readable form of the byte size.
 * @private
 */
var _numericValueToString = exports._numericValueToString = function(val, conversion, opt_decimals, opt_suffix, prefixes) {
    prefixes = prefixes || NUMERIC_SCALE_PREFIXES_;
    var orig_val = val;
    var symbol = '';
    var scale = 1;
    if (val < 0) {
        val = -val;
    }
    for (var i = 0; i < prefixes.length; i++) {
        var unit = prefixes[i];
        scale = conversion[unit];
        if (val >= scale || (scale <= 1 && val > 0.1 * scale)) {
            // Treat values less than 1 differently, allowing 0.5 to be "0.5" rather
            // than "500m"
            symbol = unit;
            break;
        }
    }
    if (!symbol) {
        scale = 1;
    } else if (opt_suffix) {
        symbol += opt_suffix;
    }
    var ex = Math.pow(10, isDef(opt_decimals) ? opt_decimals : 2);
    return Math.round(orig_val / scale * ex) / ex + symbol;
};

/**
 Converts a string to numeric value, taking into account the units.
 @memberof module:montage/converter#
 @param {string} stringValue String to be converted to numeric value.
 @param {Object} conversion Dictionary of conversion scales.
 @return {number} Numeric value for string.  If it cannot be converted, returns NaN.
 @private
 */
var _stringToNumericValue = function(stringValue, conversion) {
    var match = stringValue.match(SCALED_NUMERIC_RE_);
    if (!match) {
        return NaN;
    }
    return match[1] * conversion[match[2]];
};


/**
 Checks whether string value containing scaling units (K, M, G, T, P, m, u, n) can be converted to a number.<br>
 Where there is a decimal, there must be a digit to the left of the decimal point.<br>
 Negative numbers are valid.<br>
 @example 0, 1, 1.0, 10.4K, 2.3M, -0.3P, 1.2m
 @memberof module:montage/core/converter#
 @function
 @param {String} val String value to check.
 @return {Boolean} true If the string could be converted to a numeric value.
 */
var isConvertableScaledNumber = function(val) {
    return SCALED_NUMERIC_RE_.test(val);
};


/**
 Converts a string to numeric value, taking into account the units.<br>
 If string ends in 'B', use binary conversion.
 @memberof module:montage/core/converter#
 @function
 @param {String} stringValue String to be converted to numeric value.
 @return {Number} Numeric value for string.
 */
var stringToNumericValue = exports.stringToNumericValue = function(stringValue) {
    if (stringValue.endsWith('B')) {
        return _stringToNumericValue(
            stringValue, NUMERIC_SCALES_BINARY_);
    }
    return _stringToNumericValue(
        stringValue, NUMERIC_SCALES_SI_);
};



/**
   Converts a numeric value to string representation. SI conversion.
   @memberof module:montage/core/converter#
   @function
   @param {Number} val Value to be converted.
   @param {Number} opt_decimals The number of decimals to use. Defaults to 2.
   @returns {String} String representation of number.
 */
var numericValueToString = exports.numericValueToString = function(val, opt_decimals) {
    return _numericValueToString(val, NUMERIC_SCALES_SI_, opt_decimals);
};



/**
 @class module:montage/core/converter/number-converter.NumberValidator
 @classdesc Validates that a string can be represented as a numeric value, and returns the numeric value.
 @extends module:montage/core/converter.Validator
 */
var NumberValidator = exports.NumberValidator = Montage.create(Validator, /** @lends montage/core/converter/number-converter.NumberValidator# */ {

    /**
     Indicates whether floating point values are allowed.<br>
     If <code>true</code> (the default) then the validator attempts to parse the string as a float value.<br>
     If <code>false</code>, it attempts to parse the value as an integer.
     @type {Property}
     @default {Boolean} true
     */
    allowFloat: {
        value: true
    },

    /**
        @type {Property}
        @default {Boolean} true
    */
    allowNegative: {
        value: true
    },

    /**
     Determines if the parameter <code>v</code> is a number or not.
     @function
     @param {String} v The value to validate as a number.
     @returns {Number} num An integer or float, if the value provided to the function can parsed as a number;
     otherwise returns an error.
     */
    validate: {
        value: function(v) {
            var num;
            v = v || '';
            v = v.replace(/,/g, '');

            if (isNumber(v)) {
                num = v;
            } else {
                num = (this.allowFloat === true ? parseFloat(v, 10) : parseInt(v, 10));
            }
            if (isNaN(num)) {
                // error
                return {message: 'Invalid Number'};
            } else {
                return num;
            }
        }
    }

});


/**
 @class module:montage/core/converter/number-converter.NumberConverter
 @classdesc Formats a number for easier readability.
 */
var NumberConverter = exports.NumberConverter = Montage.create(Converter, /** @lends montage/core/converter/number-converter.NumberConverter# */ {

    /**
        @type {Property}
        @default {Boolean} false
    */
        // do not allow partial conversion
    allowPartialConversion: {
        value: false
    },
    /**
        @type {Function}
        @default {attribute} NumberValidator Uses this object.
    */
    validator: {
        value: Montage.create(NumberValidator)
    },

   /**
        @type {Property}
        @default {String} null
    */
        // valid fn values are:
    shorten: {
        value: null
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
        @default {Number} null
    */
    round: {
        value: null
    },

   /**
  @private
*/
    _reg: {
        value: /(\d+)(\d{3})/
    },

    /**
        @type {Property}
        @default {Boolean} true
    */
    allowFloat: {
        value: true
    },
    /**
        @type {Property}
        @default {Boolean} true
    */
    allowNegative: {
        value: true
    },

    // credit: sugar.js - https://github.com/andrewplummer/Sugar
    /**
     @private
     */
    _makeReadable: {
        value: function(num, comma, period) {
            comma = comma || ',';
            period = period || '.';
            var split = num.toString().split('.');
            var numeric = split[0];
            var decimal = split.length > 1 ? period + split[1] : '';
            while (this._reg.test(numeric)) {
                numeric = numeric.replace(this._reg, '$1' + comma + '$2');
            }
            return numeric + decimal;
        }
    },
    /**
     @function
     @param {Value} v The value to convert.
     @returns this._makeReadable(num)
     */
    convert: {
        value: function(v) {
            if (this.shorten) {
                // shorten the number to 10K, 100K, 1M etc
                return numericValueToString(v, this.decimals);
            } else {
                var num;
                if (this.round) {
                    num = Number(Math.round(v)).toString();
                } else {
                    var ex = Math.pow(10, this.decimals || 2);
                    var scale = 1;
                    num = Number(Math.round(v / scale * ex) / ex);
                }
                return this._makeReadable(num); //.toString();

            }
        }
    },

    /**
     @function
     @param {String} stringValue The value of the string.
     */
    revert: {
        value: function(stringValue) {
            // use a Validator to validate first
            this.validator.allowFloat = this.allowFloat;
            this.validator.allowNegative = this.allowNegative;

            var result = this.validator.validate(stringValue);

            if (isNumber(result)) {
                return result;
            } else {
                // error object {code, message}
                //return null;
                throw new Error(result.message);
            }
            //return parseFloat(stringValue, 10) || null;
        }
    }

});

