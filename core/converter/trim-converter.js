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
	@module montage/core/converter/trim-converter
    @requires montage/core/core
    @requires montage/core/converter/converter
*/
var Montage = require("montage").Montage;
var Converter = require('core/converter/converter').Converter;


/**
    Trims a string of any leading or trailing white space.
    @memberof module:montage/core/converter#
    @function
    @param {String} str String to be trimmed.
    @returns {String} The trimmed string.
 */
var trim = exports.trim = function(str) {
    // from Google Closure library
    // Since IE doesn't include non-breaking-space (0xa0) in their \s character
    // class (as required by section 7.2 of the ECMAScript spec), we explicitly
    // include it in the regexp to enforce consistent cross-browser behavior.
    return str.replace(/^[\s\xa0]+|[\s\xa0]+$/g, '');
};
/**
    @class module:montage/core/converter/trim-converter.TrimConverter
    @classdesc Trims a string of white space.
    @example
    <caption>Removes leading and trailing white space from a string.</caption>
    var Converter= require("core/converter/converter").Converter,
    TrimConverter = require("core/converter/converter").TrimConverter;
    var str = "      Hello World     ";
    var trimConverter = TrimConverter.create();
    console.log("After trim: " + trimConverter.convert(str));
    // After trim: Hello World
*/
exports.TrimConverter = Montage.create(Converter, /** @lends module:montage/core/converter/trim-converter.TrimConverter# */ {
    /**
     @private
     */
    _convert: {
        value: function(v) {
            if (v && typeof v === 'string') {
                return trim(v);
            }
        }
    },

    /**
     Trims the provided string and returns the new string.
     @function
     @param {String} v The string to trim.
     @returns this._convert(v)
     */
    convert: {value: function(v) {
        return this._convert(v);
    }},
    /**
     Reverts the conversion.
     @function
     @param {String} v The string to revert.
     @returns this._convert(v)
     */
    revert: {value: function(v) {
        return this._convert(v);
    }}
});


