/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
/**
 @module montage/data/sqlaccess/sqlblueprint
 @requires montage/core/core
 @requires montage/data/blueprint
 @requires montage/data/sqlaccess/sqlselectorevaluator
 @requires montage/core/logger
 */
var Montage = require("montage").Montage;
var Blueprint = require("data/blueprint").Blueprint;
var BlueprintBinder = require("data/blueprint").BlueprintBinder;
var ToOneAttribute = require("data/blueprint").ToOneAttribute;
var ToManyAttribute = require("data/blueprint").ToManyAttribute;
var ToOneAssociation = require("data/blueprint").ToOneAssociation;
var ToManyAssociation = require("data/blueprint").ToManyAssociation;
var SqlSelectorEvaluator = require("data/sqlaccess/sqlselectorevaluator").SqlSelectorEvaluator; // registering the evaluators
var logger = require("core/logger").logger("sqlblueprint");

/**
 @class module:montage/data/sqlaccess/sqlblueprint.SqlBlueprintBinder
 @extends module:montage/data/blueprint.BlueprintBinder
 */
var SqlBlueprintBinder = exports.SqlBlueprintBinder = Montage.create(BlueprintBinder, /** @lends module:montage/data/sqlaccess/sqlblueprint.SqlBlueprintBinder# */ {

    /**
     Description TODO
     @type {Property} URL
     @default {String} "montage/data/sqlaccess/sqlstore"
     */
    storeModuleId:{
        value:"data/sqlaccess/sqlstore"
    },
    /**
     Description TODO
     @type {Property}
     @default {String} "SqlStore"
     */
    storePrototypeName:{
        value:"SqlStore"
    },
    /**
     Description TODO
     @function
     @returns {Function} SqlBlueprint.create()
     */
    createBlueprint:{
        value:function () {
            return SqlBlueprint.create();
        }
    }


})
/**
 @class module:montage/data/sqlaccess/sqlblueprint.SqlBlueprint
 */
var SqlBlueprint = exports.SqlBlueprint = Montage.create(Blueprint, /** @lends module:montage/data/sqlaccess/sqlblueprint.SqlBlueprint# */ {

    /**
     Conventional method to crete new attribute.<br>
     This can be overwritten by specific stores.
     @function
     @returns {Function} SqlToOneAttribute.create()
     */
    createToOneAttribute:{
        value:function () {
            return SqlToOneAttribute.create();
        }
    },

    /**
     Conventional method to crete new attribute.<br>
     This can be overwritten by specific stores.
     @function
     @returns {Function} SqlToManyAttribute.create()
     */
    createToManyAttribute:{
        value:function () {
            return SqlToManyAttribute.create();
        }
    },

    /**
     Conventional method to crete new attribute.<br>
     This can be overwritten by specific stores.
     @function
     @returns {Function} SqlToOneAssociation.create()
     */
    createToOneAssociation:{
        value:function () {
            return SqlToOneAssociation.create();
        }
    },

    /**
     Conventional method to crete new attribute.<br>
     This can be overwritten by specific stores.
     @function
     @returns {Function} SqlToManyAssociation.create()
     */
    createToManyAssociation:{
        value:function () {
            return SqlToManyAssociation.create();
        }
    }

});
/**
 @class module:montage/data/sqlaccess/sqlblueprint.SqlToOneAttribute
 */
var SqlToOneAttribute = exports.SqlToOneAttribute = Montage.create(ToOneAttribute, /** @lends module:montage/data/sqlaccess/sqlblueprint.SqlToOneAttribute# */ {

});
/**
 @class module:montage/data/sqlaccess/sqlblueprint.SqlToOneAssociation
 */
var SqlToOneAssociation = exports.SqlToOneAssociation = Montage.create(ToOneAssociation, /** @lends module:montage/data/sqlaccess/sqlblueprint.SqlToOneAssociation# */ {

});
/**
 @class module:montage/data/sqlaccess/sqlblueprint.SqlToManyAttribute
 */
var SqlToManyAttribute = exports.SqlToManyAttribute = Montage.create(ToManyAttribute, /** @lends module:montage/data/sqlaccess/sqlblueprint.SqlToManyAttribute# */ {

});
/**
 @class module:montage/data/sqlaccess/sqlblueprint.SqlToManyAssociation
 */
var SqlToManyAssociation = exports.SqlToManyAssociation = Montage.create(ToManyAssociation, /** @lends module:montage/data/sqlaccess/sqlblueprint.SqlToManyAssociation# */{

});
