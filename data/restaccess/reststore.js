/* <copyright>
This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
(c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
</copyright> */
/**
	@module montage/data/restaccess/reststore
    @requires montage/core/core
    @requires montage/data/store
    @requires montage/core/logger
*/
var Montage = require("montage").Montage;
var Store = require("data/store").Store;
var logger = require("core/logger").logger("reststore");

/**
    @class module:montage/data/restaccess/reststore.RestStore
    @extends module:montage/data/store.Store
*/
var RestStore = exports.RestStore = Montage.create(Store,/** @lends module:montage/data/restaccess/reststore.RestStore# */ {

/**
    Description TODO
    @function
    @param {Property} binder
    @returns {Boolean} true or false
    */
    canServiceBlueprintBinder: {
        value: function(binder) {
            if ((binder !== null) && (binder.storePrototypeName === "RestStore")) {
                // TODO [PJYF Apr 19 2011] We need to check that the connection url points to the same DB
                return true;
            }
            return false;
        }
    },

/**
    Description TODO
    @function
    @param {Object} object TODO
    @param {Property} context TODO
    @param {Property} transactionId TODO
    @returns {Function} Q.ref(object.objectId) or Q.ref(null)
    */
    permanentIdForObjectId$Implementation: {
        value: function(object, context, transactionId) {
            // TODO [PJYF Apr 28 2011] We need to implement it.
            if (typeof object.objectId !== "undefined") {
                return Q.ref(object.objectId);
            }
            return Q.ref(null);
        }
    },

/**
    Description TODO
    @function
    @param {Object} objectId TODO
    @param {Property} context TODO
    @param {Property} transactionId TODO
    @returns {Function} Q.ref(null)
    */
    pledgeForObjectId$Implementation: {
        value: function(objectId, context, transactionId) {
            // TODO [PJYF Apr 28 2011] We need to implement it.
            return Q.ref(null);
        }
    },

/**
    Description TODO
    @function
    @param {Object} sourceObject TODO
    @param {Property} relationship TODO
    @param {Property} context TODO
    @param {Property} transactionId TODO
    @returns {Function} Q.ref(null)
    */
    pledgeForSourceObjectRelationship$Implementation: {
        value: function(sourceObject, relationship, context, transactionId) {
            // TODO [PJYF Apr 28 2011] We need to implement it.
            return Q.ref(null);
        }
    },

/**
    Description TODO
    @function
    @param {Object} object TODO
    @param {Property} context TODO
    @param {Property} transactionId TODO
    @returns {Function} Q.ref(object)
    */
    initializeObject$Implementation: {
        value: function(object, context, transactionId) {
            if (typeof object.objectId === "undefined") {
                // TODO [PJYF June 17 2011] This will need to be revisited.
                object.objectId = TemporaryObjectId.create().init();
            }
            return Q.ref(object);
        }
    },

/**
    Description TODO
    @function
    @param {Object} object TODO
    @param {Property} context TODO
    @param {Property} transactionId TODO
    @returns {Function} this.pledgeForObjectId(object.objectId, context, transactionId) or Q.ref(object)
    */
    repledgeObject$Implementation: {
        value: function(object, context, transactionId) {
            if (typeof object.objectId !== "undefined") {
                return this.pledgeForObjectId(object.objectId, context, transactionId);
            }
            return Q.ref(object);
        }

    },

/**
    Called on each store before a save.<br>
    Upon receiving this message the store should take steps to prepare the commit and insure it will succeed.<br>
    If the commit cannot succeed it should return a rejected promise.
    @function
    @param {Property} context TODO
    @param {Property} transactionId TODO
    @returns {Function} Q.ref(true)
    */
   prepareToSaveChangesInContext$Implementation: {
        value: function(context, transactionId) {
            // TODO [PJYF Sep 27 2011] This needs to be reimplemented
            return Q.ref(true);
        }
    },

/**
    Called on each store before a revert to prepare a save.<br>
    Any step taken to prepare the save should be rolled back.
    @function
    @param {Property} context TODO
    @param {Property} transactionId TODO
    @returns {Function} Q.ref(true)
    */
    cancelSaveChangesInContext$Implementation: {
        value: function(context, transactionId) {
            // TODO [PJYF Sep 27 2011] This needs to be reimplemented
            return Q.ref(true);
        }
    },

/**
    Commits the transaction.<br>
    Any failure during this step will cause the store to be left an inconsistent state.
    @function
    @param {Property} context TODO
    @param {Property} transactionId TODO
    @returns {Function} Q.ref(true)
    */
    commitChangesInContext$Implementation: {
        value: function(context, transactionId) {
            // TODO [PJYF Sep 27 2011] This needs to be reimplemented
            return Q.ref(true);
        }
    },

/**
    Description TODO
    @function
    @param {Property} query TODO
    @param {Property} context TODO
    @param {Property} transactionId TODO
    @returns {Function} Q.ref([])
    */
    queryInContext$Implementation: {
        value: function(query, context, transactionID) {
            // TODO [PJYF Sept 4 2011] This needs to be implemented
            return Q.ref([]);
        }
    }


});
