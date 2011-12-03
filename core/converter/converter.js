/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
/**
 Provides common conversion, validation, and formatting functions for different types of values.
 @module montage/core/converter/converter
 @requires montage/core/core
 */
var Montage = require("montage").Montage;


var FUNCTION_CLASS = '[object Function]',
    BOOLEAN_CLASS = '[object Boolean]',
    NUMBER_CLASS = '[object Number]',
    STRING_CLASS = '[object String]',
    ARRAY_CLASS = '[object Array]',
    DATE_CLASS = '[object Date]';

var _toString = Object.prototype.toString;

// TODO should maybe move these into String.isString and Number.isNumber to parallel Array.isArray

/**
    @exports module:montage/core/converter#isString
    @function
*/
var isString = function(object) {
    return _toString.call(object) === STRING_CLASS;
};
exports.isString = isString;

/**
    @exports module:montage/core/converter#isNumber
    @function
*/
var isNumber = function(object) {
    return _toString.call(object) === NUMBER_CLASS;
};
exports.isNumber = isNumber;


/**
    @exports module:montage/core/converter#isDef
    @function
*/
var isDef = function(obj) {
    return (obj && typeof obj !== 'undefined');
};
exports.isDef = isDef;


var startsWith = exports.startsWith = function(str) {
    return str.lastIndexOf(prefix, 0) === 0;
};
var endsWith = exports.endsWith = function(str) {
    var l = str.length - suffix.length;
    return l >= 0 && str.indexOf(suffix, l) == l;
};

/**
 Truncates a string to a certain length and adds '...' if necessary.<br>
 The length also accounts for the ellipsis, so a maximum length of 10 and a string<br>
 'Hello World!' produces 'Hello W...'.
 @function
 @param {String} str The string to truncate.
 @param {Number} chars Max number of characters.
 @param {Boolean} opt_protectEscapedCharacters Whether to protect escaped characters from being cut off in the middle.
 @return {String} The truncated {@code str} string.
 */
var truncate = exports.truncate = function(str, chars, opt_protectEscapedCharacters) {
    if (opt_protectEscapedCharacters) {
        goog.string.unescapeEntities(this);
    }

    if (str.length > chars) {
        return str.substring(0, chars - 3) + '…';
    }

    if (opt_protectEscapedCharacters) {
        str.htmlEscape(this);
    }

    return this;
};


// Validators
/**
 Base validator object.
 @class module:montage/core/converter.Validator
 @extends module:montage/core/core.Montage
 */
var Validator = exports.Validator = Montage.create(Montage, /** @lends module:montage/core/converter.Validator# */{
/**
        @type {Object}
        @default null
    */
    validate: {
        value: null
    }
});


// Converters

/**
 @class module:montage/core/converter.Converter
 @classdesc The base Converter class that is extended by specific converter classes. A Converter has two primary methods:
 <ul>
 <li><code>convert(<i>value</i>)</code> : Convert value to a String.
 <li><code>revert(<i>value</i>)</code>: Do the reverse. Depending on the specific converter being used, the reverse operation may be "lossy".
 </ul>
 */
var Converter = exports.Converter = Montage.create(Montage, /** @lends module:montage/core/converter.Converter# */ {

    /**
     Specifies whether the converter allows partial conversion.
     @type {Property}
     @default {Boolean} true
     */
    allowPartialConversion: {
        value: true
    },

    /**
        @type {Property}
        @default null
    */
    convert: {
        enumerable: false,
        value: null
    },
/**
        @type {Property}
        @default null
    */
    revert: {
        enumerable: false,
        value: null
    }
});

