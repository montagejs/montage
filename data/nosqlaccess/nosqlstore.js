/* <copyright>
This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
(c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
</copyright> */
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
    pledgeForSourceObjectAssociation$Implementation: {
        value: function(sourceObject, relationship, context, transactionId) {
            // TODO [PJYF Apr 28 2011] We need to implement it.
            return null;
        }
    }

});
