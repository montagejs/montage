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
	@module montage/core/converter/new-line-to-br-converter
    @requires montage/core/core
    @requires montage/core/converter/converter
*/

var Montage = require("montage").Montage;
var Converter = require('core/converter/converter').Converter;

/**
    Replaces all new line characters with a HTML &lt;br&gt;
    @memberof module:montage/core/converter#
    @function
    @param {String} str The string to format.
    @returns {String} The formatted string.
 */
var newLineToBr = function(str) {
    return str.replace(/(\r\n|\r|\n)/g, '<br />');
};

/**
 @class module:montage/core/converter/new-line-to-br-converter.NewLineToBrConverter
 @classdesc Converts a newline to a &lt;br&gt; tag.
 */
exports.NewLineToBrConverter = Montage.create(Converter, /** @lends module:montage/core/converter/new-line-to-br-converter.NewLineToBrConverter# */{

    /**
     @private
     */
    _convert: {
        value: function(v) {
            if (v && typeof v === 'string') {
                return newLineToBr(v);
            }
            return v;
        }
    },
    /**
    @function
    @param {String} v Case format
    @returns this._convert(v)
    */
    convert: {value: function(v) {
        return this._convert(v);
    }},

    /**
    @function
    @param {String} v Case format
    @returns this._convert(v)
    */
    revert: {value: function(v) {
        return this._convert(v);
    }}
});
