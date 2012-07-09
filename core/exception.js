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
        value: null
    },
/**
        @type {Property}
        @default {String} null
    */
    target: {
        value: null
    },
/**
        @type {Property}
        @default {Function} null
    */
    method: {
        value: null
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
