/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
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
