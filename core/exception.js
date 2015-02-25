var Montage = require("./core").Montage;
var logger = require("./logger").logger("exception");

/**
 * @module montage/core/exception
 * @requires montage/core/core
 * @requires montage/core/logger
*/

/**
 * @class Exception
 * @extends Montage
*/
var Exception = exports.Exception = Montage.specialize(/** @lends Exception# */ {

    /**
     * @type {Property}
     * @default {string} null
     */
    message: {
        value: null
    },

    /**
     * @type {Property}
     * @default {string} null
     */
    target: {
        value: null
    },

    /**
     * @type {Property}
     * @default {Function} null
     */
    method: {
        value: null
    },

    constructor: {
        value: function Exception() {
            this.super();
        }
    },

    /**
     * @function
     * @param {string} message The message to be initialized.
     * @returns this.initWithMessageTargetAndMethod(message, null, null)
     */
    initWithMessage : {
        enumerable: true,
        value: function (message) {
            return this.initWithMessageTargetAndMethod(message, null, null);
        }
    },

    /**
     * @function
     * @param {string} message The message to be initialized.
     * @param {string} target The target to be initialized.
     * @returns this.initWithMessageTargetAndMethod(message, target, null)
     */
    initWithMessageAndTarget : {
        enumerable: true,
        value: function (message, target) {
            return this.initWithMessageTargetAndMethod(message, target, null);
        }
    },

    /**
     * @function
     * @param {string} message The message to be initialized.
     * @param {string} target The target to be initialized.
     * @param {Function} method The method to be initialized.
     * @returns itself
     */
    initWithMessageTargetAndMethod : {
        enumerable: true,
        value: function (message, target, method) {
            this.message = (typeof message !== 'undefined' ? message : null);
            Object.defineProperty(this, "message", {writable: false});
            this.target = (typeof target !== 'undefined' ? target : null);
            Object.defineProperty(this, "target", {writable: false});
            this.method = (typeof method !== 'undefined' ? method : null);
            Object.defineProperty(this, "method", {writable: false});
            return this;
        }
    },

    /**
     * @function
     * @returns The exception
     */
    toString: {
        enumerable: false,
        value: function () {
            return "Exception: " + (this.message !== null ? this.message + " " : null) + (this.target !== null ? this.target + " " : null) + (this.method !== null ? this.method + " " : null);
        }
    }

});

