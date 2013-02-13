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
 @module montage/data/rest-access/rest-store
 @requires montage/core/core
 @requires montage/data/store
 @requires montage/core/logger
 @requires montage/core/promise
 @requires data/rest-access/rest-mapping
 */
var Montage = require("montage").Montage;
var Store = require("data/store").Store;
var Promise = require("core/promise").Promise;
var RestBinderMapping = require("data/rest-access/rest-mapping").RestBinderMapping;
var RestBlueprintMapping = require("data/rest-access/rest-mapping").RestBlueprintMapping;
var RestAttributeMapping = require("data/rest-access/rest-mapping").RestAttributeMapping;
var RestAssociationMapping = require("data/rest-access/rest-mapping").RestAssociationMapping;
var TemporaryObjectId = require("data/object-id").TemporaryObjectId;

var logger = require("core/logger").logger("rest-store");

/**
 @class module:montage/data/rest-access/rest-store.RestStore
 @extends module:montage/data/store.Store
 */
var RestStore = exports.RestStore = Montage.create(Store, /** @lends module:montage/data/rest-access/rest-store.RestStore# */ {

    /**
     Create a new binder mapping.
     @function
     @returns binder mapping
     */
    createBinderMapping:{
        get:function () {
            return RestBinderMapping.create();
        }
    },

    /**
     Create a new blueprint mapping.
     @function
     @returns blueprint mapping
     */
    createBlueprintMapping:{
        get:function () {
            return RestBlueprintMapping.create();
        }
    },

    /**
     Create a new attribute mapping.
     @function
     @returns attribute mapping
     */
    createAttributeMapping:{
        get:function () {
            return RestAttributeMapping.create();
        }
    },

    /**
     Create a new association mapping.
     @function
     @returns association mapping
     */
    createAssociationMapping:{
        get:function () {
            return RestAssociationMapping.create();
        }
    },

    /**
     Description TODO
     @function
     @param {Object} object TODO
     @param {Property} context TODO
     @param {Property} transactionId TODO
     @returns {Function} Promise.resolve(object.objectId) or Promise.resolve(null)
     */
    permanentIdForObjectId$Implementation:{
        value:function (object, context, transactionId) {
            // TODO [PJYF Apr 28 2011] We need to implement it.
            if (typeof object.objectId !== "undefined") {
                return Promise.resolve(object.objectId);
            }
            return Promise.resolve(null);
        }
    },

    /**
     Description TODO
     @function
     @param {Object} objectId TODO
     @param {Property} context TODO
     @param {Property} transactionId TODO
     @returns {Function} Promise.resolve(null)
     */
    pledgeForObjectId$Implementation:{
        value:function (objectId, context, transactionId) {
            // TODO [PJYF Apr 28 2011] We need to implement it.
            return Promise.resolve(null);
        }
    },

    /**
     Description TODO
     @function
     @param {Object} sourceObject TODO
     @param {Property} relationship TODO
     @param {Property} context TODO
     @param {Property} transactionId TODO
     @returns {Function} Promise.resolve(null)
     */
    pledgeForSourceObjectAssociation$Implementation:{
        value:function (sourceObject, relationship, context, transactionId) {
            // TODO [PJYF Apr 28 2011] We need to implement it.
            return Promise.resolve(null);
        }
    },

    /**
     Description TODO
     @function
     @param {Object} object TODO
     @param {Property} context TODO
     @param {Property} transactionId TODO
     @returns {Function} Promise.resolve(object)
     */
    initializeObject$Implementation:{
        value:function (object, context, transactionId) {
            if (typeof object.objectId === "undefined") {
                // TODO [PJYF June 17 2011] This will need to be revisited.
                object.objectId = TemporaryObjectId.create().initWithBlueprint(object.blueprint);
            }
            return Promise.resolve(object);
        }
    },

    /**
     Description TODO
     @function
     @param {Object} object TODO
     @param {Property} context TODO
     @param {Property} transactionId TODO
     @returns {Function} this.pledgeForObjectId(object.objectId, context, transactionId) or Promise.resolve(object)
     */
    repledgeObject$Implementation:{
        value:function (object, context, transactionId) {
            if (typeof object.objectId !== "undefined") {
                return this.pledgeForObjectId(object.objectId, context, transactionId);
            }
            return Promise.resolve(object);
        }

    },

    /**
     Called on each store before a save.<br>
     Upon receiving this message the store should take steps to prepare the commit and insure it will succeed.<br>
     If the commit cannot succeed it should return a rejected promise.
     @function
     @param {Property} context TODO
     @param {Property} transactionId TODO
     @returns {Function} Promise.resolve(true)
     */
    prepareToSaveChangesInContext$Implementation:{
        value:function (context, transactionId) {
            // TODO [PJYF Sep 27 2011] This needs to be reimplemented
            return Promise.resolve(true);
        }
    },

    /**
     Called on each store before a revert to prepare a save.<br>
     Any step taken to prepare the save should be rolled back.
     @function
     @param {Property} context TODO
     @param {Property} transactionId TODO
     @returns {Function} Promise.resolve(true)
     */
    cancelSaveChangesInContext$Implementation:{
        value:function (context, transactionId) {
            // TODO [PJYF Sep 27 2011] This needs to be reimplemented
            return Promise.resolve(true);
        }
    },

    /**
     Commits the transaction.<br>
     Any failure during this step will cause the store to be left an inconsistent state.
     @function
     @param {Property} context TODO
     @param {Property} transactionId TODO
     @returns {Function} Promise.resolve(true)
     */
    commitChangesInContext$Implementation:{
        value:function (context, transactionId) {
            // TODO [PJYF Sep 27 2011] This needs to be reimplemented
            return Promise.resolve(true);
        }
    },

    /**
     Description TODO
     @function
     @param {Property} query TODO
     @param {Property} context TODO
     @param {Property} transactionId TODO
     @returns {Function} Promise.resolve([])
     */
    queryInContext$Implementation:{
        value:function (query, context, transactionID) {
            // TODO [PJYF Sept 4 2011] This needs to be implemented
            return Promise.resolve([]);
        }
    }


});
