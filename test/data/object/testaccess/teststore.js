/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
var Montage = require("montage").Montage;
var Store = require("montage/data/store").Store;
var logger = require("montage/core/logger").logger("teststore");
var Promise = require("montage/core/promise").Promise;

var TestStore = exports.TestStore = Montage.create(Store, {

    canServiceBlueprintBinder: {
        value: function(binder) {
            if ((binder !== null) && (binder.storePrototypeName === "TestStore")) {
                // TODO [PJYF Apr 19 2011] We need to check that the connection url points to the same DB
                return true;
            }
            return false;
        }
    },


    permanentIdForObjectId$Implementation: {
        value: function(object, context, transactionId) {
            // TODO [PJYF Apr 28 2011] We need to implement it.
            if (typeof object.objectId !== "undefined") {
                return Promise.ref(object.objectId);
            }
            return Promise.ref(null);
        }
    },

    pledgeForObjectId$Implementation: {
        value: function(objectId, context, transactionId) {
            // TODO [PJYF Apr 28 2011] We need to implement it.
            return Promise.ref(null);
        }
    },

    pledgeForSourceObjectRelationship$Implementation: {
        value: function(sourceObject, relationship, context, transactionId) {
            // TODO [PJYF Apr 28 2011] We need to implement it.
            return Promise.ref(null);
        }
    },

    initializeObject$Implementation: {
        value: function(object, context, transactionId) {
            if (typeof object.objectId === "undefined") {
                // TODO [PJYF June 17 2011] This will need to be revisited.
                object.objectId = TemporaryObjectId.create().init();
            }
            return Promise.ref(object);
        }
    },

    repledgeObject$Implementation: {
        value: function(object, context, transactionId) {
            if (typeof object.objectId !== "undefined") {
                return this.pledgeForObjectId(object.objectId, context, transactionId);
            }
            return Promise.ref(object);
        }

    },

    /*
     * Called on each store before a save.
     * Upon receiving this message the store should take steps to prepare the commit and insure it will succeed.
     * If the commit cannot succeed it should return a rejected promise.
     */
    prepareToSaveChangesInContext$Implementation: {
        value: function(context, transactionId) {
            // TODO [PJYF Sep 27 2011] This needs to be reimplemented
            return Promise.ref(true);
        }
    },

    /*
     * Called on each store before a revert a prepare to save. Any step taken to prepare the save should be rolled back.
     */
    cancelSaveChangesInContext$Implementation: {
        value: function(context, transactionId) {
            // TODO [PJYF Sep 27 2011] This needs to be reimplemented
            return Promise.ref(true);
        }
    },

    /*
     * Commits the transaction. Any failure during this step will cause the store to be left an inconsistent state.
     */
    commitChangesInContext$Implementation: {
        value: function(context, transactionId) {
            // TODO [PJYF Sep 27 2011] This needs to be reimplemented
            return Promise.ref(true);
        }
    },

    queryInContext$Implementation: {
        value: function(query, context, transactionID) {
            // TODO [PJYF Sept 4 2011] This needs to be implemented
            return Promise.ref([]);
        }
    }


});
