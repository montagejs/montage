/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
var Montage = require("montage").Montage;
var logger = require("core/logger").logger("exception");
/**
	@module montage/core/exception
    @requires montage/core/core
    @requires montage/core/logger
*/
/**
    @class module:montage/core/exception.Exception
    @extends module:montage/core/core.Montage
*/
var Exception = exports.Exception = Montage.create(Montage,/** @lends module:montage/core/exception.Exception# */ {
/**
        @type {Property}
        @default {String} null
    */
    message: {
        value: null,
        serializable: true
    },
/**
        @type {Property}
        @default {String} null
    */
    target: {
        value: null,
        serializable: true
    },
/**
        @type {Property}
        @default {Function} null
    */
    method: {
        value: null,
        serializable: true
    },
   /**
    @function
    @param {String} message The message to be initialized.
    @returns this.initWithMessageTargetAndMethod(message, null, null)
    */
    initWithMessage : {
        enumerable: true,
        value: function(message) {
            return this.initWithMessageTargetAndMethod(message, null, null);
        }
    },
/**
    @function
    @param {String} message The message to be initialized.
    @param {String} target The target to be initialized.
    @returns this.initWithMessageTargetAndMethod(message, target, null)
    */
    initWithMessageAndTarget : {
        enumerable: true,
        value: function(message, target) {
            return this.initWithMessageTargetAndMethod(message, target, null);
        }
    },
/**
    @function
    @param {String} message The message to be initialized.
    @param {String} target The target to be initialized.
    @param {Function} method The method to be initialized.
    @returns itself
    */
    initWithMessageTargetAndMethod : {
        enumerable: true,
        value: function(message, target, method) {
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
    @function
    @returns The exception
    */
    toString: {
        enumerable: false,
        value: function() {
            return "Exception: " + (this.message !== null ? this.message + " " : null) + (this.target !== null ? this.target + " " : null) + (this.method !== null ? this.method + " " : null);
        }
    }

});
