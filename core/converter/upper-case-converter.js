/* <copyright>
Copyright (c) 2012, Motorola Mobility, Inc

All Rights Reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

  - Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
  - Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
  - Neither the name of Motorola Mobility nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
</copyright> */
/**
	@module montage/core/converter/upper-case-converter
    @requires montage/core/core
    @requires montage/core/converter/converter
*/
var Montage = require("montage").Montage;
var Converter = require('core/converter/converter').Converter;

// uppercase formatter
/**
 @class module:montage/core/converter/upper-case-converter.UpperCaseConverter
 @classdesc Converts a string to upper-case.
 */
exports.UpperCaseConverter = Montage.create(Converter, /** @lends module:montage/core/converter/upper-case-converter.UpperCaseConverter# */ {
    /**
     @private
     */
    _convert: {
        value: function(v) {
            if (v && typeof v === 'string') {
                return (v.toUpperCase ? v.toUpperCase() : v);
            }
            return v;
        }
    },

    /**
     Converts the specified string to all upper case letters.
     @function
     @param {String} v The string to convert.
     @returns {String} The converted string.
     */
    convert: {value: function(v) {
        return this._convert(v);
    }},

    /**
     Reverts the specified string.
     @function
     @param {String} v The specified string.
     @returns {String}
     */
    revert: {value: function(v) {
        return this._convert(v);
    }}
});
