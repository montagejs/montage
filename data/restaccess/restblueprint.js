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
var Attribute = require("data/blueprint").Attribute;
var Association = require("data/blueprint").Association;
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
     @returns {Function} RestAttribute.create()
     */
    createAttribute:{
        value:function () {
            return RestAttribute.create();
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
var RestToOneAttribute = exports.RestToOneAttribute = Montage.create(Attribute, /** @lends module:montage/data/restaccess/restblueprint.RestToOneAttribute# */ {

});
/**
 @class module:montage/data/restaccess/restblueprint.RestToOneAssociation
 */
var RestToOneAssociation = exports.RestToOneAssociation = Montage.create(Association, /** @lends module:montage/data/restaccess/restblueprint.RestToOneAssociation# */ {

});
/**
 @class module:montage/data/restaccess/restblueprint.RestAttribute
 */
var RestAttribute = exports.RestAttribute = Montage.create(Attribute, /** @lends module:montage/data/restaccess/restblueprint.RestAttribute# */ {

});
/**
 @class module:montage/data/restaccess/restblueprint.RestToManyAssociation
 */
var RestToManyAssociation = exports.RestToManyAssociation = Montage.create(ToManyAssociation, /** @lends module:montage/data/restaccess/restblueprint.RestToManyAssociation# */ {

});
