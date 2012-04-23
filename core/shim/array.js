/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
/**
    Defines extensions to native Array object.
    @see [Array class]{@link external:Array}
    @module montage/core/shim/array
*/

/**
    @external Array
*/

/**
    Shim implementation of Array.isArray() for browsers that don't yet support it.
    @function external:Array.isArray
    @param {object} obj The object to determine if its an array.
    @returns {Array} Object.prototype.toString.call(obj) === "[object Array]"
*/
if (!Array.isArray) {
    Object.defineProperty(Array, "isArray", {
        value: function(obj) {
            return Object.prototype.toString.call(obj) === "[object Array]";
        }
    });
}

