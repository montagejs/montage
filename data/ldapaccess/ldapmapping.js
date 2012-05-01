/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
/**
 @module montage/data/ldapmapping
 @requires montage/core/core
 @requires montage/core/logger
 @requires montage/data/mapping
 */
var Montage = require("montage").Montage;
var BinderMapping = require("data/mapping").BinderMapping;
var BlueprintMapping = require("data/mapping").BlueprintMapping;
var AttributeMapping = require("data/mapping").AttributeMapping;
var AssociationMapping = require("data/mapping").AssociationMapping;
var logger = require("core/logger").logger("ldapmapping");

/**
 * TODO
 @class module:montage/data/ldapaccess/ldapmapping.LdapBinderMapping
 @extends module:montage/data/mapping.BinderMapping
 */
var LdapBinderMapping = exports.LdapBinderMapping = Montage.create(BinderMapping, /** @lends module:montage/data/ldapaccess/ldapmapping.LdapBinderMapping# */ {


});


/**
 * TODO
 @class module:montage/data/ldapaccess/ldapmapping.LdapBlueprintMapping
 @extends module:montage/data/mapping.BlueprintMapping
 */
var LdapBlueprintMapping = exports.LdapBlueprintMapping = Montage.create(BlueprintMapping, /** @lends module:montage/data/ldapaccess/ldapmapping.LdapBlueprintMapping# */ {


});


/**
 * TODO
 @class module:montage/data/ldapaccess/ldapmapping.LdapAttributeMapping
 @extends module:montage/data/mapping.AttributeMapping
 */
var LdapAttributeMapping = exports.LdapAttributeMapping = Montage.create(AttributeMapping, /** @lends module:montage/data/ldapaccess/ldapmapping.LdapAttributeMapping# */ {


});


/**
 * TODO
 @class module:montage/data/ldapaccess/ldapmapping.LdapAssociationMapping
 @extends module:montage/data/mapping.AssociationMapping
 */
var LdapAssociationMapping = exports.LdapAssociationMapping = Montage.create(AssociationMapping, /** @lends module:montage/data/ldapaccess/ldapmapping.LdapAssociationMapping# */ {


});

