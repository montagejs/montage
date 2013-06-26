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
	@module montage/core/gate
    @requires montage/core/core
    @requires montage/core/logger
*/
var Montage = require("montage").Montage,
    logger = require("core/logger").logger("gate");
/**
 @class Gate
 @extends Montage
 */
var Gate = exports.Gate = Montage.specialize(/** @lends Gate# */ {

    constructor: {
        value: function Gate() {
            this.super();
        }
    },

/**
    @function
    @returns {Gate} A new Gate instance.
    */
    init: {
        enumerable: false,
        value: function() {
            this.reset();
            return this;
        }
    },
/**
    @function
    @param {String} delegate The delegate to be initialized.
    @returns itself
    */
    initWithDelegate: {
        enumerable: false,
        value: function(delegate) {
            this.reset();
            this.delegate = delegate;
            return this;
        }
    },
/**
    @function
    @param {String} propertyDescriptor The propertyDescriptor to be initialized.
    @returns itself
    */
    initWithDescriptor: {
        enumerable: false,
        value: function(propertyDescriptor) {
            var fieldName;
            this.reset();
            for (fieldName in propertyDescriptor) {
                this.setField(fieldName, propertyDescriptor[fieldName].value);
            }
            return this;
        }
    },
/**

        @type {Property}
        @default {Number} 0
    */
    count: {
        value: 0
    },
/**

        @type {Property}
        @default {String} null
    */
    table: {
        value: null
    },
/**
    @function
    @param {Array} aFieldName The aFieldName array.
    @returns !table or table[aFieldName]
    */
    getField: {
        enumerable: false,
        value: function(aFieldName) {
            var table = this.table;
            return !table || table[aFieldName];
        }
    },
/**
    @function
    @param {Array} aFieldName The aFieldName array.
    @param {Number} value The count on the array.
    */
    setField: {
        enumerable: false,
        value: function(aFieldName, value) {
            var table = this.table,
                fieldValue,
                oldCount = this.count;

            table = (!table ? this.table = {} : table);

            fieldValue = table[aFieldName];

            if (typeof fieldValue === "undefined" && !value) {
                // new field
                this.count++;
            } else if (typeof fieldValue !== "undefined" && fieldValue !== value) {
                if (value) {
                    this.count--;
                } else {
                    this.count++;
                }
            } else if (value) {
                logger.error(this, aFieldName + " was not set before.");
            }
            table[aFieldName] = !!value;
            if (this.count === 0 && oldCount > 0) {
                this.callDelegateMethod(true);
            } else if (oldCount === 0 && this.count > 0) {
                this.callDelegateMethod(false);
            }
        }
    },
/**
    @function
    @param {Array} aFieldName The aFieldName array to be removed.
    */
    removeField: {
        enumerable: false,
        value: function(aFieldName) {
            var table = this.table, fieldValue = table[aFieldName];
            if (typeof fieldValue !== "undefined" && !fieldValue) {
                // if the value was false decrement the count
                this.count--;
            }
            delete table[aFieldName];
        }
    },
/**

        @type {Property}
        @default {String} null
    */
    delegate: {
        enumerable: false,
        value: null
    },
/**
    @function
    @param {Number} value The value to be called.
    */
    callDelegateMethod: {
        value: function(value) {
            var delegateMethod;
            if (this.delegate && typeof (delegateMethod = this.delegate["gateDidBecome" + (value ? "True" : "False")]) === "function") {
                delegateMethod.call(this.delegate, this);
            }
        },
        enumerable: false
    },
/**
    @type {Function}
    @returns this.count === 0
    */
    value: {
        enumerable: false,
        get: function() {
            return this.count === 0;
        }
    },
/**
    @function
    */
    reset: {
        enumerable: false,
        value: function() {
            this.table = {};
            this.count = 0;
        }
    },
/**
    @function
    @returns {String} result
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
