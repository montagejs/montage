/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
/**
 @module montage/data/ldapaccess/ldapstore
 @requires montage/core/core
 @requires montage/data/store
 @requires montage/core/logger
 @requires data/ldapaccess/ldapmapping
 */
var Montage = require("montage").Montage;
var Store = require("data/store").Store;
var LdapBinderMapping = require("data/ldapaccess/ldapmapping").LdapBinderMapping;
var LdapBlueprintMapping = require("data/ldapaccess/ldapmapping").LdapBlueprintMapping;
var LdapAttributeMapping = require("data/ldapaccess/ldapmapping").LdapAttributeMapping;
var LdapAssociationMapping = require("data/ldapaccess/ldapmapping").LdapAssociationMapping;
var logger = require("core/logger").logger("ldapstore");
/**
 @class module:montage/data/ldapaccess/ldapstore.LdapStore
 @extends module:montage/core/core.Montage
 */
var LdapStore = exports.LdapStore = Montage.create(Store, /** @lends module:montage/data/ldapaccess/ldapstore.LdapStore# */ {

    /**
     Create a new binder mapping.
     @function
     @returns binder mapping
     */
    createBinderMapping:{
        get:function () {
            return LdapBinderMapping.create();
        }
    },

    /**
     Create a new blueprint mapping.
     @function
     @returns blueprint mapping
     */
    createBlueprintMapping:{
        get:function () {
            return LdapBlueprintMapping.create();
        }
    },

    /**
     Create a new attribute mapping.
     @function
     @returns attribute mapping
     */
    createAttributeMapping:{
        get:function () {
            return LdapAttributeMapping.create();
        }
    },

    /**
     Create a new association mapping.
     @function
     @returns association mapping
     */
    createAssociationMapping:{
        get:function () {
            return LdapAssociationMapping.create();
        }
    }



});
