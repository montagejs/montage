/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
/**
 @module montage/data/sqlaccess/sqlstore
 @requires montage/core/core
 @requires montage/data/store
 @requires montage/core/logger
 @requires data/sqlaccess/sqlmapping
 */
var Montage = require("montage").Montage;
var Store = require("data/store").Store;
var SqlBinderMapping = require("data/sqlaccess/sqlmapping").SqlBinderMapping;
var SqlBlueprintMapping = require("data/sqlaccess/sqlmapping").SqlBlueprintMapping;
var SqlAttributeMapping = require("data/sqlaccess/sqlmapping").SqlAttributeMapping;
var SqlAssociationMapping = require("data/sqlaccess/sqlmapping").SqlAssociationMapping;
var logger = require("core/logger").logger("sqlstore");

/**
 @class module:montage/data/sqlaccess/sqlstore.SqlStore
 @extends module:montage/data/store.Store
 */
var SqlStore = exports.SqlStore = Montage.create(Store, /** @lends module:montage/data/sqlaccess/sqlstore.SqlStore# */ {

    /**
     Description TODO
     @function
     @param {Object} objectId TODO
     @param {Property} context TODO
     @param {Property} transactionId TODO
     @returns null
     */
    pledgeForObjectId$Implementation:{
        value:function (objectId, context, transactionId) {
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
    pledgeForSourceObjectAssociation$Implementation:{
        value:function (sourceObject, relationship, context, transactionId) {
            // TODO [PJYF Apr 28 2011] We need to implement it.
            return null;
        }
    },

    /**
     Create a new binder mapping.
     @function
     @returns binder mapping
     */
    createBinderMapping:{
        get:function () {
            return SqlBinderMapping.create();
        }
    },

    /**
     Create a new blueprint mapping.
     @function
     @returns blueprint mapping
     */
    createBlueprintMapping:{
        get:function () {
            return SqlBlueprintMapping.create();
        }
    },

    /**
     Create a new attribute mapping.
     @function
     @returns attribute mapping
     */
    createAttributeMapping:{
        get:function () {
            return SqlAttributeMapping.create();
        }
    },

    /**
     Create a new association mapping.
     @function
     @returns association mapping
     */
    createAssociationMapping:{
        get:function () {
            return SqlAssociationMapping.create();
        }
    }


});
