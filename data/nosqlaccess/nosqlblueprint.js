/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
/**
 @module montage/data/nosqlaccess/nosqlblueprint
 @requires montage/core/core
 @requires montage/data/blueprint
 @requires montage/data/nosqlaccess/nosqlselectorevaluator
 @requires montage/core/logger
 */
var Montage = require("montage").Montage;
var Blueprint = require("data/blueprint").Blueprint;
var BlueprintBinder = require("data/blueprint").BlueprintBinder;
var ToOneAttribute = require("data/blueprint").ToOneAttribute;
var ToManyAttribute = require("data/blueprint").ToManyAttribute;
var ToOneAssociation = require("data/blueprint").ToOneAssociation;
var ToManyAssociation = require("data/blueprint").ToManyAssociation;
var NoSqlSelectorEvaluator = require("data/nosqlaccess/nosqlselectorevaluator").NoSqlSelectorEvaluator; // registering the evaluators
var logger = require("core/logger").logger("nosqlblueprint");

/**
 @class module:montage/data/nosqlaccess/nosqlblueprint.NoSqlBlueprintBinder
 @extends module:montage/data/blueprint.BlueprintBinder
 */
var NoSqlBlueprintBinder = exports.NoSqlBlueprintBinder = Montage.create(BlueprintBinder, /** @lends module:montage/data/nosqlaccess/nosqlblueprint.NoSqlBlueprintBinder# */ {

    /**
     The module ID of the store to use.
     @type {Property} Function
     @default {String} "montage/data/nosqlaccess/nosqlstore"
     */
    storeModuleId:{
        value:"montage/data/nosqlaccess/nosqlstore"
    },
    /**
     Description TODO
     @type {Property} Function
     @default {String} "NoSqlStore"
     */
    storePrototypeName:{
        value:"NoSqlStore"
    },
    /**
     Description TODO
     @function
     @returns {Function} NoSqlBlueprint.create()
     */
    createBlueprint:{
        value:function () {
            return NoSqlBlueprint.create();
        }
    }


})
/**
 @class module:montage/data/nosqlaccess/nosqlblueprint.NoSqlBlueprint
 */
var NoSqlBlueprint = exports.NoSqlBlueprint = Montage.create(Blueprint, /** @lends module:montage/data/nosqlaccess/nosqlblueprint.NoSqlBlueprint# */ {

    /**
     Conventional method to crete new attribute.<br>
     This can be overwritten by specific stores.
     @function
     @returns {Function} NoSqlToOneAttribute.create()
     */
    createToOneAttribute:{
        value:function () {
            return NoSqlToOneAttribute.create();
        }
    },

    /**
     Conventional method to crete new attribute.<br>
     This can be overwritten by specific stores.
     @function
     @returns {Function} NoSqlToManyAttribute.create()
     */
    createToManyAttribute:{
        value:function () {
            return NoSqlToManyAttribute.create();
        }
    },

    /**
     Conventional method to crete new attribute.<br>
     This can be overwritten by specific stores.
     @function
     @returns {Function} NoSqlToOneAssociation.create()
     */
    createToOneAssociation:{
        value:function () {
            return NoSqlToOneAssociation.create();
        }
    },

    /**
     Conventional method to crete new attribute.<br>
     This can be overwritten by specific stores.
     @function
     @returns {Function} NoSqlToManyAssociation.create()
     */
    createToManyAssociation:{
        value:function () {
            return NoSqlToManyAssociation.create();
        }
    }

});
/**
 @class module:montage/data/nosqlaccess/nosqlblueprint.NoSqlToOneAttribute
 */
var NoSqlToOneAttribute = exports.NoSqlToOneAttribute = Montage.create(ToOneAttribute, /** @lends module:montage/data/nosqlaccess/nosqlblueprint.NoSqlToOneAttribute# */ {

});
/**
 @class module:montage/data/nosqlaccess/nosqlblueprint.NoSqlToOneAssociation
 */
var NoSqlToOneAssociation = exports.NoSqlToOneAssociation = Montage.create(ToOneAssociation, /** @lends module:montage/data/nosqlaccess/nosqlblueprint.NoSqlToOneAssociation# */ {

});
/**
 @class module:montage/data/nosqlaccess/nosqlblueprint.NoSqlToManyAttribute
 */
var NoSqlToManyAttribute = exports.NoSqlToManyAttribute = Montage.create(ToManyAttribute, /** @lends module:montage/data/nosqlaccess/nosqlblueprint.NoSqlToManyAttribute# */ {

});
/**
 @class module:montage/data/nosqlaccess/nosqlblueprint.NoSqlToManyAssociation
 */
var NoSqlToManyAssociation = exports.NoSqlToManyAssociation = Montage.create(ToManyAssociation, /** @lends module:montage/data/nosqlaccess/nosqlblueprint.NoSqlToManyAssociation# */ {

});
