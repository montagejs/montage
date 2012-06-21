/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2012 Motorola Mobility, Inc.  All Rights Reserved.
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


