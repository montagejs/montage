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
	@module montage/core/converter/bytes-converter
    @requires montage/core/core
    @requires montage/core/converter/converter
    @requires montage/core/converter/number-converter
*/
var Montage = require("montage").Montage;
var Converter = require('core/converter/converter').Converter;
var _numericValueToString = require("core/converter/number-converter")._numericValueToString;
var _stringToNumericValue = require("core/converter/number-converter")._stringToNumericValue;
var NUMERIC_SCALES_BINARY_ = require("core/converter/number-converter").NUMERIC_SCALES_BINARY_;
var isDef = require('core/converter/converter').isDef;

/**
  @private
*/
var NUMERIC_SCALE_PREFIXES_BYTES = [
    'P', 'T', 'G', 'M', 'K', '', 'm', 'u', 'n'
];

/**
    Converts a string to number of bytes, taking into account the units.
    Binary conversion.
    @function
    @param {string} stringValue String to be converted to numeric value.
    @return {number} Numeric value for string.
    @private
 */
var stringToNumBytes = function(stringValue) {
    return _stringToNumericValue(stringValue, NUMERIC_SCALES_BINARY_);
};

/**
    Converts number of bytes to string representation. Binary conversion.
    Default is to return the additional 'B' suffix, e.g. '10.5KB' to minimize confusion with counts that are scaled by powers of 1000.
    @function
    @param {Number} val Value to be converted.
    @param {Number} opt_decimals The number of decimals to use.  Defaults to 2.
    @param {Boolean} opt_suffix If true, include trailing 'B' in returned string. Default is true.
    @return {String} String representation of number of bytes.
    @private
 */
var numBytesToString = function(val, opt_decimals, opt_suffix) {
    var suffix = '';
    if (!isDef(opt_suffix) || opt_suffix) {
        suffix = 'B';
    }
    return _numericValueToString(val, NUMERIC_SCALES_BINARY_, opt_decimals, suffix, NUMERIC_SCALE_PREFIXES_BYTES);
};

/**
    Formats a number of bytes in human readable form: 54, 450K, 1.3M, 5G etc.
    @function
    @param {Number} bytes The number of bytes to show.
    @param {Number} opt_decimals The number of decimals to use.  Defaults to 2.
    @return {String} The human readable form of the byte size.
    @private
 */
var fileSize = function(bytes, opt_decimals) {
    return numBytesToString(bytes, opt_decimals, false);
};

/**
    @class module:montage/core/converter/bytes-converter.BytesConverter
    @classdesc Converts a numeric value to byte format (for example, 2048 is converted to 2MB).
    @extends module:montage/core/converter.Converter
 */
exports.BytesConverter = Montage.create(Converter, /** @lends module:montage/core/converter/bytes-converter.BytesConverter# */ {

    /**
     The number of decimals to include in the formatted value. Default is 2.
     @type {Property}
     @default {Number} 2
     */
    decimals: {
        value: 2
    },
    /**
     Converts the specified value to byte format.
     @function
     @param {Property} v The value to format.
     @returns {String} The value converted to byte format.
     @example
     var Converter= require("core/converter/converter").Converter;
     var BytesConverter = require("core/converter/converter").BytesConverter;
     var bytes = "12341234";
     var byteconverter = BytesConverter.create();
     console.log("Converted: " + byteconverter.convert(bytes));
     console.log("Reverted: " + byteconverter.revert(bytes));
     // Converted: 11.77MB
     // Reverted: 12341234
     */
    convert: {
        value: function(v) {
            return fileSize(v, this.decimals);
        }
    },
    /**
     Reverts a formatted byte string to a standard number.
     @function
     @param {String} v The value to revert.
     @returns {String} v
     @see module:montage/converter.BytesConverter#convert
     @example
     var Converter= require("core/converter/converter").Converter;
     var BytesConverter = require("core/converter/converter").BytesConverter;
     var bytes = "11.77MB";
     var byteconverter = BytesConverter.create();
     console.log("Reverted: " + byteconverter.revert(bytes));
     // Reverted: 12341234
     */
    revert: {
        value: function(v) {
            return v;
        }
    }
});

