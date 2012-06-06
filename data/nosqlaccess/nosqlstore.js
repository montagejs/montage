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
 @requires data/nosqlaccess/nosqlmapping
 */
var Montage = require("montage").Montage;
var Store = require("data/store").Store;
var NoSqlBinderMapping = require("data/nosqlaccess/nosqlmapping").NoSqlBinderMapping;
var NoSqlBlueprintMapping = require("data/nosqlaccess/nosqlmapping").NoSqlBlueprintMapping;
var NoSqlAttributeMapping = require("data/nosqlaccess/nosqlmapping").NoSqlAttributeMapping;
var NoSqlAssociationMapping = require("data/nosqlaccess/nosqlmapping").NoSqlAssociationMapping;
var logger = require("core/logger").logger("nosqlstore");
/**
 @class module:montage/data/nosqlaccess/nosqlstore.NoSqlStore
 @extends module:montage/data/store.Store
 */
var NoSqlStore = exports.NoSqlStore = Montage.create(Store, /** @lends module:montage/data/nosqlaccess/nosqlstore.NoSqlStore# */ {

    /**
     Create a new binder mapping.
     @function
     @returns binder mapping
     */
    createBinderMapping:{
        get:function () {
            return NoSqlBinderMapping.create();
        }
    },

    /**
     Create a new blueprint mapping.
     @function
     @returns blueprint mapping
     */
    createBlueprintMapping:{
        get:function () {
            return NoSqlBlueprintMapping.create();
        }
    },

    /**
     Create a new attribute mapping.
     @function
     @returns attribute mapping
     */
    createAttributeMapping:{
        get:function () {
            return NoSqlAttributeMapping.create();
        }
    },

    /**
     Create a new association mapping.
     @function
     @returns association mapping
     */
    createAssociationMapping:{
        get:function () {
            return NoSqlAssociationMapping.create();
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
    }

});
