/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
/**
	@module montage/core/converter/lower-case-converter
    @requires montage/core/core
    @requires montage/core/converter/converter
*/
var Montage = require("montage").Montage;
var Converter = require("core/converter/converter").Converter;

/**
 @class module:montage/core/converter/lower-case-converter.LowerCaseConverter
 @classdesc Converts a string to lowercase.
 */
exports.LowerCaseConverter = Montage.create(Converter, /** @lends module:montage/core/converter/lower-case-converter.LowerCaseConverter# */{

    _convert: {
        value: function(v) {
            if (v && typeof v === 'string') {
                return (v.toLowerCase ? v.toLowerCase() : v);
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
