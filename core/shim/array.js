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
    @function external:Array#equals
    @param {object} right The object to compare.
    @returns {Boolean} true or false
*/
if (!Array.prototype.equals) {
    Object.defineProperty(Array.prototype, "equals", {
        value: function (right) {
            var i = 0,
                length = this.length,
                lhs,
                rhs;

            if (this === right) {
                return true;
            }

            if (!right || !Array.isArray(right)) {
                return false;
            }

            if (length !== right.length) {
                return false;
            } else {
                for (; i < length; ++i) {
                    if (i in this) {
                        lhs = this[i],
                            rhs = right[i];

                        if (lhs !== rhs && (lhs && rhs && !lhs.equals(rhs))) {
                            return false;
                        }
                    } else {
                        if (i in right) {
                            return false;
                        }
                    }
                }
            }
            return true;
        }
    });
}
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

if (!Array.isCanvasPixelArray) {
    Object.defineProperty(Array, "isCanvasPixelArray", {
        value: function(obj) {
            return Object.prototype.toString.call(obj) === "[object CanvasPixelArray]";
        }
    });
}
