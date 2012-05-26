/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */

/**
    Defines standardized shims for the intrinsic String object.
    @see [String class]{@link external:String}
    @module montage/core/shim/string
*/

/**
    @external String
*/

/**
    Returns whether this string begins with a given substring.

    @function external:String#startsWith
    @param {String} substring a potential substring of this string
    @returns {Boolean} whether this string starts with the given substring
*/
if (!String.prototype.startsWith) {
    Object.defineProperty(String.prototype, 'startsWith', {
        value: function (start) {
            return this.length >= start.length &&
                this.slice(0, start.length) === start;
        },
        writable: true,
        configurable: true
    });
}

/**
    Returns whether this string ends with a given substring.

    @function external:String#endsWith
    @param {String} substring a potential substring of this string
    @returns {Boolean} whether this string ends with the given substring
*/
if (!String.prototype.endsWith) {
    Object.defineProperty(String.prototype, 'endsWith', {
        value: function (end) {
            return this.length >= end.length &&
                this.slice(this.length - end.length, this.length) === end;
        },
        writable: true,
        configurable: true
    });
}

