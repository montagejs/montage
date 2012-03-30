/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
/**
 @module montage/data/ldapaccess/ldapblueprint
 @requires montage/core/core
 @requires montage/data/blueprint
 @requires montage/data/ldapaccess/ldapselectorevaluator
 @requires montage/core/logger
 */
var Montage = require("montage").Montage;
var Blueprint = require("data/blueprint").Blueprint;
var BlueprintBinder = require("data/blueprint").BlueprintBinder;
var ToOneAttribute = require("data/blueprint").ToOneAttribute;
var ToManyAttribute = require("data/blueprint").ToManyAttribute;
var ToOneAssociation = require("data/blueprint").ToOneAssociation;
var ToManyAssociation = require("data/blueprint").ToManyAssociation;
var LdapSelectorEvaluator = require("data/ldapaccess/ldapselectorevaluator").LdapSelectorEvaluator; // registering the evaluators
var logger = require("core/logger").logger("ldapblueprint");

/**
 @class module:montage/data/ldapaccess/ldapblueprint.LdapBlueprintBinder
 @extends module:montage/data/blueprint.BlueprintBinder
 */
var LdapBlueprintBinder = exports.LdapBlueprintBinder = Montage.create(BlueprintBinder, /** @lends module:montage/data/ldapaccess/ldapblueprint.LdapBlueprintBinder# */ {

    /**
     Description TODO
     @type {Property} URL
     @default {String} "montage/data/ldapaccess/ldapstore"
     */
    storeModuleId:{
        value:"montage/data/ldapaccess/ldapstore"
    },
    /**
     Description TODO
     @type {Property}
     @default {String} "LdapStore"
     */
    storePrototypeName:{
        value:"LdapStore"
    },
    /**
     Description TODO
     @function
     @returns LdapBlueprint.create()
     */
    createBlueprint:{
        value:function () {
            return LdapBlueprint.create();
        }
    }


})
/**
 @class module:montage/data/idapaccess/ldapblueprint.LdapBlueprint
 */
var LdapBlueprint = exports.LdapBlueprint = Montage.create(Blueprint, /** @lends module:montage/data/idapaccess/ldapblueprint.LdapBlueprint# */ {

    /**
     Conventional method to crete new attribute.<br>
     This can be overwritten by specific stores.
     @function
     @returns LdapToOneAttribute.create()
     */
    createToOneAttribute:{
        value:function () {
            return LdapToOneAttribute.create();
        }
    },

    /**
     Conventional method to create a new attribute.<br>
     This can be overwritten by specific stores.
     @function
     @returns {Function} LdapToManyAttribute.create()
     */
    createToManyAttribute:{
        value:function () {
            return LdapToManyAttribute.create();
        }
    },

    /**
     Conventional method to create a new attribute.<br>
     This can be overwritten by specific stores.
     @function
     @returns {Function} LdapToOneAssociation.create()
     */
    createToOneAssociation:{
        value:function () {
            return LdapToOneAssociation.create();
        }
    },

    /**
     Conventional method to create a new attribute.<br>
     This can be overwritten by specific stores.
     @function
     @returns {Function} LdapToManyAssociation.create()
     */
    createToManyAssociation:{
        value:function () {
            return LdapToManyAssociation.create();
        }
    }

});
/**
 @class module:montage/data/ldapaccess/ldapblueprint.LdapToOneAttribute
 */
var LdapToOneAttribute = exports.LdapToOneAttribute = Montage.create(ToOneAttribute, /** @lends module:montage/data/ldapaccess/ldapblueprint.LdapToOneAttribute# */ {

});
/**
 @class module:montage/data/ldapaccess/ldapblueprint.LdapToOneAssociation
 */
var LdapToOneAssociation = exports.LdapToOneAssociation = Montage.create(ToOneAssociation, /** @lends module:montage/data/ldapaccess/ldapblueprint.LdapToOneAssociation# */ {

});
/**
 @class module:montage/data/ldapaccess/ldapblueprint.LdapToManyAttribute
 */
var LdapToManyAttribute = exports.LdapToManyAttribute = Montage.create(ToManyAttribute, /** @lends module:montage/data/ldapaccess/ldapblueprint.LdapToManyAttribute# */ {

});
/**
 @class module:montage/data/ldapaccess/ldapblueprint.LdapToManyAssociation
 */
var LdapToManyAssociation = exports.LdapToManyAssociation = Montage.create(ToManyAssociation/** @lends module:montage/data/ldapaccess/ldapblueprint.LdapToManyAssociation# */, {

});
