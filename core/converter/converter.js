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
        value: true,
        serializable: true
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

