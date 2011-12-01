/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
/**
	@module montage/core/gate
    @requires montage/core/core
    @requires montage/core/logger
*/
var Montage = require("montage").Montage,
    logger = require("core/logger").logger("gate");
/**
 @class module:montage/core/gate.Gate
 @extends module:montage/core/core.Montage
 */
var Gate = exports.Gate = Montage.create(Montage,/** @lends module:montage/core/gate.Gate# */ {
/**
    Description TODO
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
    Description TODO
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
    Description TODO
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
        Description TODO
        @type {Property}
        @default {Number} 0
    */
    count: {
        value: 0
    },
/**
        Description TODO
        @type {Property}
        @default {String} null
    */
    table: {
        value: null
    },
/**
    Description TODO
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
    Description TODO
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
    Description TODO
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
        Description TODO
        @type {Property}
        @default {String} null
    */
    delegate: {
        enumerable: false,
        value: null
    },
/**
    Description TODO
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
    Description TODO
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
    Description TODO
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
    Description TODO
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
