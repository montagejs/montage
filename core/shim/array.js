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
