
/**
 * @module montage/core/gate
 * @requires montage/core/core
 * @requires montage/core/logger
 */
var Montage = require("./core").Montage,
    logger = require("./logger").logger("gate"),
    Map = require("core/collections/map");

/**
 * @class Gate
 * @extends Montage
 */
var Gate = exports.Gate = Montage.specialize(/** @lends Gate.prototype # */ {

    /**
     * @function
     * @returns {Gate} A new Gate instance.
     */
    init: {
        enumerable: false,
        value: function () {
            this.reset();
            return this;
        }
    },

    /**
     * @function
     * @param {string} delegate The delegate to be initialized.
     * @returns itself
    */
    initWithDelegate: {
        enumerable: false,
        value: function (delegate) {
            this.reset();
            this.delegate = delegate;
            return this;
        }
    },

    /**
     * @function
     * @param {string} propertyDescriptor The propertyDescriptor to be initialized.
     * @returns itself
     */
    initWithDescriptor: {
        enumerable: false,
        value: function (propertyDescriptor) {
            var i, keys, fieldName;
            this.reset();
            for (i=0, keys = Object.keys(propertyDescriptor); (fieldName = keys[i]); i++) {
                this.setField(fieldName, propertyDescriptor[fieldName].value);
            }
            return this;
        }
    },

    /**
     * @type {Property}
     * @default {number} 0
     */
    count: {
        value: 0
    },

    /**
     * @type {Property}
     * @default {string} null
     */
    table: {
        value: null
    },

    /**
     * @function
     * @param {Array} aFieldName The aFieldName array.
     * @returns !table or table[aFieldName]
     */
    getField: {
        enumerable: false,
        value: function (aFieldName) {
            var table = this.table;
            return !table || table.get(aFieldName);
        }
    },

    /**
     * @function
     * @param {Array} aFieldName The aFieldName array.
     * @returns boolean
     */
    hasField: {
        enumerable: false,
        value: function (aFieldName) {
            var table = this.table;
            return !table || table.has(aFieldName);
        }
    },

    /**
     * @function
     * @param {Array} aFieldName The aFieldName array.
     * @param {number} value The count on the array.
     */
    setField: {
        enumerable: false,
        value: function (aFieldName, value) {
            var table = this.table || (this.table = new Map()),
                fieldValue,
                oldCount = this.count;

            fieldValue = table.get(aFieldName);

            if (typeof fieldValue === "undefined" && !value) {
                // new field
                this.count++;
            } else if (typeof fieldValue !== "undefined" && fieldValue !== value) {
                if (value) {
                    this.count--;
                } else {
                    this.count++;
                }
            } else if (value && logger.isDebug) {
                logger.debug(this, aFieldName + " was not set before.");
            }
            table.set(aFieldName,!!value);
            if (this.count === 0 && oldCount > 0) {
                this.callDelegateMethod(true);
            } else if (oldCount === 0 && this.count > 0) {
                this.callDelegateMethod(false);
            }
        }
    },

    /**
     * @function
     * @param {Array} aFieldName The aFieldName array to be removed.
     */
    removeField: {
        enumerable: false,
        value: function (aFieldName) {
            var table = this.table, fieldValue = table.get(aFieldName);
            if (typeof fieldValue !== "undefined" && !fieldValue) {
                // if the value was false decrement the count
                this.count--;
            }
            table.delete(aFieldName);
        }
    },

    /**
     * @type {Property}
     * @default {string} null
     */
    delegate: {
        enumerable: false,
        value: null
    },

    /**
     * @function
     * @param {number} value The value to be called.
     */
    callDelegateMethod: {
        value: function (value) {
            var delegateMethod;
            if (this.delegate && typeof (delegateMethod = this.delegate["gateDidBecome" + (value ? "True" : "False")]) === "function") {
                delegateMethod.call(this.delegate, this);
            }
        },
        enumerable: false
    },

    /**
     * @type {Function}
     * @returns this.count === 0
     */
    value: {
        enumerable: false,
        get: function () {
            return this.count === 0;
        }
    },

    /**
     * @function
     */
    reset: {
        enumerable: false,
        value: function () {
            this.table = null;
            this.count = 0;
        }
    },

    /**
     * @function
     * @returns {string} result
     */
    toString: {
        value: function () {
            var table = this.table,
                fieldNameEnumetator = table.keys(),
                iField,
                result = "";

                while ((iField = fieldNameEnumetator.next().value)) {
                    result += iField + "[" + (this._value & table.get(iField)) + "], ";
                }

            return result;
        }
    }

});
