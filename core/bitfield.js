/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2012 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
/**
 Defines the BitField class, that compactly stores multiple values as a short series of bits.
 @module montage/core/bitfield
 @requires montage/core/core
 */

var Montage = require("montage").Montage;


/**
 The BitField object compactly stores multiple values as a short series of bits. This implementation is limited to 32 fields.
 @class module:montage/core/bitfield.BitField
 @classdesc Compactly stores multiple values as a short series of bits.
 @extends module:montage/core/core.Montage
 */
var BitField = exports.BitField = Montage.create(Montage, /** @lends module:montage/core/bitfield.BitField# */ {

    /**
     Creates a new BitField object containing the fields provided in the propertyDescriptor parameter.
     @function
     @param {Object} propertyDescriptor An object containing one or more property name/value pairs. Each pair is added to the new BitField.
     @returns {Object} A new BitField object that contains fields described by the property descriptor.
     @example var bitField = BitField.create();
     bitField = BitField.create().initWithDescriptor({
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

    /**
     @private
     */
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
