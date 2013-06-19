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
 Defines the BitField class, that compactly stores multiple values as a short series of bits.
 @module montage/core/bitfield
 @requires montage/core/core
 */

var Montage = require("montage").Montage;


/**
 The BitField object compactly stores multiple values as a short series of bits. This implementation is limited to 32 fields.
 @class BitField
 @classdesc Compactly stores multiple values as a short series of bits.
 @extends Montage
 */
var BitField = exports.BitField = Montage.specialize( /** @lends BitField */ {

    constructor: {
        value: function BitField() {
            this.super();
        }
    },

    /**
     Creates a new BitField object containing the fields provided in the propertyDescriptor parameter.
     @function
     @param {Object} propertyDescriptor An object containing one or more property name/value pairs. Each pair is added to the new BitField.
     @returns {Object} A new BitField object that contains fields described by the property descriptor.
     @example var bitField = new BitField();
     bitField = new BitField().initWithDescriptor({
     likes_golf: {
     value: false
     },
     likes_basketball: {
     value: true
     },
     likes_baseball: {
     value: false
     },
     });
     */
    initWithDescriptor: {
        enumerable: false,
        value: function(propertyDescriptor) {
            var fieldName;
            this.reset();
            for (fieldName in propertyDescriptor) {
                this.addField(fieldName, propertyDescriptor[fieldName].value);
            }
            return this;
        }
    },

    /**
     Adds a new field to a BitField instance.
     @function
     @param {String} aFieldName The name of the field to add.
     @param {Mixed} defaultValue The new field's default value.
     */
    addField: {
        enumerable: false,
        value: function(aFieldName, defaultValue) {
            if (aFieldName in this) {
                return;
            }
            if (this._fieldCount >= 32) {
                throw "BitField 32 fields limit reached.";
            }
            //We try to recycle slots as limited to 32bits
            this._trueValue += (this._fields[aFieldName] = this._constantsToReuse.length ? this._constantsToReuse.shift() : (1 << this._fieldCount));
            Montage.defineProperty(this, aFieldName, {
                enumerable: true,
                get: function() {
                    return (this._value === this._trueValue);
                },
                set: function(value) {
                    value ? (this._value |= this._fields[aFieldName]) : (this._value &= ~ (this._fields[aFieldName]));
                    if (this.value) {
                        this.callDelegateMethod();
                    }
                }
            });
            this._fieldCount++;
            if (!! defaultValue) {
                this[aFieldName] = true;
            }
        }
    },

    _constantsToReuse: {
        enumerable: false,
        value: []
    },

    /**
     Removes a field from the bitfield.
     @function
     @param {String} aFieldName The name of the field to remove.
     */
    removeField: {
        enumerable: false,
        value: function(aFieldName) {
            delete this[aFieldName];
            this._constantsToReuse.push(this._fields[aFieldName]);
            this._trueValue -= this._fields[aFieldName];
            delete this._fields[aFieldName];
        }
    },

    /**
     The BitField object's delegate.
     @type {Property}
     @default null
     */
    delegate: {
        enumerable: false,
        value: null
    },

    /**
     @function
     @returns Nothing
     */
    callDelegateMethod: {
        value: function() {
            var delegateMethod;
            if (this.delegate && typeof (delegateMethod = this.delegate.bitFieldDidBecomeTrue) === "function") {
                delegateMethod.call(this.delegate, this);
            }
        },
        enumerable: false
    },
/**
        @type {Function}
        @default {Number} 0
    */
    value: {
        enumerable: false,
        get: function() {
            return (this._value === this._trueValue);
        }
    },

    /**
     @private
     */
    _fieldCount: {
        enumerable: false,
        value: 0
    },
/**
  @private
*/
    _value: {
        enumerable: false,
        value: 0
    },
/**
  @private
*/
    _trueValue: {
        enumerable: false,
        value: 0
    },
/**
    @function
    */
    reset: {
        enumerable: false,
        value: function() {
            this._value = 0x0;
        }
    },
/**
  @private
*/
    _fields: {
        enumerable: false,
        value: {}
    },
/**
    @function
    @returns result
    */
    toString: {
        value: function() {
            var fieldNames = this._fields,
                i,
                iField,
                result = "";
            for (i = 0; (iField = fieldNames[i]); i++) {
                result += iField + "[" + (this._value & fieldNames[iField]) + "], ";
            }
            return result;
        }
    }
});
