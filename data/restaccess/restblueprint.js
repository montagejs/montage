/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
/**
 @module montage/data/restaccess/restblueprint
 @requires montage/core/core
 @requires montage/data/blueprint
 @requires montage/data/restaccess/restselectorevaluator
 @requires montage/core/logger
 */
var Montage = require("montage").Montage;
var Blueprint = require("data/blueprint").Blueprint;
var BlueprintBinder = require("data/blueprint").BlueprintBinder;
var ToOneAttribute = require("data/blueprint").ToOneAttribute;
var ToManyAttribute = require("data/blueprint").ToManyAttribute;
var ToOneAssociation = require("data/blueprint").ToOneAssociation;
var ToManyAssociation = require("data/blueprint").ToManyAssociation;
var RestSelectorEvaluator = require("data/restaccess/restselectorevaluator").RestSelectorEvaluator; // registering the evaluators
var logger = require("core/logger").logger("restblueprint");

/**
 @class module:montage/data/restaccess/restblueprint.RestBlueprintBinder
 @extends module:montage/data/blueprint.BlueprintBinder
 */
var RestBlueprintBinder = exports.RestBlueprintBinder = Montage.create(BlueprintBinder, /** @lends module:montage/data/restaccess/restblueprint.RestBlueprintBinder# */ {

    /**
     Description TODO
     @type {Property} URL
     @default {String} "montage/data/restaccess/reststore"
     */
    storeModuleId:{
        value:"montage/data/restaccess/reststore"
    },

    /**
     Description TODO
     @type {Property} Function
     @default {String} "RestStore"
     */
    storePrototypeName:{
        value:"RestStore"
    },

    /**
     Description TODO
     @function
     @returns {Function} RestBlueprint.create()
     */
    createBlueprint:{
        value:function () {
            return RestBlueprint.create();
        }
    }


})

/**
 @class module:montage/data/restaccess/restblueprint.RestBlueprint
 */
var RestBlueprint = exports.RestBlueprint = Montage.create(Blueprint, /** @lends module:montage/data/restaccess/restblueprint.RestBlueprint# */ {

    /**
     Conventional method to crete new attribute.<br>
     This can be overwritten by specific stores.
     @function
     @returns {Function} RestToOneAttribute.create()
     */
    createToOneAttribute:{
        value:function () {
            return RestToOneAttribute.create();
        }
    },

    /**
     Conventional method to crete new attribute.<br>
     This can be overwritten by specific stores.
     @function
     @returns {Function} RestToManyAttribute.create()
     */
    createToManyAttribute:{
        value:function () {
            return RestToManyAttribute.create();
        }
    },

    /**
     Conventional method to crete new attribute.<br>
     This can be overwritten by specific stores.
     @function
     @returns {Function} RestToOneAssociation.create()
     */
    createToOneAssociation:{
        value:function () {
            return RestToOneAssociation.create();
        }
    },

    /**
     Conventional method to crete new attribute.<br>
     This can be overwritten by specific stores.
     @function
     @returns {Function} RestToManyAssociation.create()
     */
    createToManyAssociation:{
        value:function () {
            return RestToManyAssociation.create();
        }
    }

});
/**
 @class module:montage/data/restaccess/restblueprint.RestToOneAttribute
 */
var RestToOneAttribute = exports.RestToOneAttribute = Montage.create(ToOneAttribute, /** @lends module:montage/data/restaccess/restblueprint.RestToOneAttribute# */ {

});
/**
 @class module:montage/data/restaccess/restblueprint.RestToOneAssociation
 */
var RestToOneAssociation = exports.RestToOneAssociation = Montage.create(ToOneAssociation, /** @lends module:montage/data/restaccess/restblueprint.RestToOneAssociation# */ {

});
/**
 @class module:montage/data/restaccess/restblueprint.RestToManyAttribute
 */
var RestToManyAttribute = exports.RestToManyAttribute = Montage.create(ToManyAttribute, /** @lends module:montage/data/restaccess/restblueprint.RestToManyAttribute# */ {

});
/**
 @class module:montage/data/restaccess/restblueprint.RestToManyAssociation
 */
var RestToManyAssociation = exports.RestToManyAssociation = Montage.create(ToManyAssociation, /** @lends module:montage/data/restaccess/restblueprint.RestToManyAssociation# */ {

});
