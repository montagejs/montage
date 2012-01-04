/*
<copyright>
Copyright (c) 2012, Motorola Mobility, Inc

All Rights Reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

  - Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
  - Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
  - Neither the name of Motorola Mobility nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
</copyright>
*/
/**
	@module montage/data/nosqlaccess/nosqlstore
    @requires montage/core/core
    @requires montage/data/store
    @requires montage/core/logger
*/
var Montage = require("montage").Montage;
var Store = require("data/store").Store;
var logger = require("core/logger").logger("nosqlstore");
/**
    @class module:montage/data/nosqlaccess/nosqlstore.NoSqlStore
    @extends module:montage/data/store.Store
*/
var NoSqlStore = exports.NoSqlStore = Montage.create(Store,/** @lends module:montage/data/nosqlaccess/nosqlstore.NoSqlStore# */ {

/**
    Description TODO
    @function
    @param {Property} binder TODO
    @returns {Boolean} true or false
    */
    canServiceBlueprintBinder: {
        value: function(binder) {
            if ((binder !== null) && (binder.storePrototypeName === "NoSqlStore")) {
                // TODO [PJYF Apr 19 2011] We need to check that the connection url points to the same DB
                return true;
            }
            return false;
        }
    },

/**
    Description TODO
    @function
    @param {Object} objectId TODO
    @param {Property} context TODO
    @param {Property} transactionId TODO
    @returns null
    */
    pledgeForObjectId$Implementation: {
        value: function(objectId, context, transactionId) {
            // TODO [PJYF Apr 28 2011] We need to implement it.
            return null;
        }
    },

/**
    Description TODO
    @function
    @param {Object} sourceObject TODO
    @param {Property} relationship TODO
    @param {Property} context TODO
    @param {Property} transactionId TODO
    @returns null
    */
    pledgeForSourceObjectRelationship$Implementation: {
        value: function(sourceObject, relationship, context, transactionId) {
            // TODO [PJYF Apr 28 2011] We need to implement it.
            return null;
        }
    }

});
