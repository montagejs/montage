/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
/**
 @module montage/data/sqlmapping
 @requires montage/core/core
 @requires montage/core/logger
 @requires montage/data/mapping
 */
var Montage = require("montage").Montage;
var BinderMapping = require("data/mapping").BinderMapping;
var BlueprintMapping = require("data/mapping").BlueprintMapping;
var AttributeMapping = require("data/mapping").AttributeMapping;
var AssociationMapping = require("data/mapping").AssociationMapping;
var logger = require("core/logger").logger("sqlmapping");

/**
 * TODO
 @class module:montage/data/sqlaccess/sqlmapping.SqlBinderMapping
 @extends module:montage/data/mapping.BinderMapping
 */
var SqlBinderMapping = exports.SqlBinderMapping = Montage.create(BinderMapping, /** @lends module:montage/data/sqlaccess/sqlmapping.SqlBinderMapping# */ {


});


/**
 * TODO
 @class module:montage/data/sqlaccess/sqlmapping.SqlBlueprintMapping
 @extends module:montage/data/mapping.BlueprintMapping
 */
var SqlBlueprintMapping = exports.SqlBlueprintMapping = Montage.create(BlueprintMapping, /** @lends module:montage/data/sqlaccess/sqlmapping.SqlBlueprintMapping# */ {


});


/**
 * TODO
 @class module:montage/data/sqlaccess/sqlmapping.SqlAttributeMapping
 @extends module:montage/data/mapping.AttributeMapping
 */
var SqlAttributeMapping = exports.SqlAttributeMapping = Montage.create(AttributeMapping, /** @lends module:montage/data/sqlaccess/sqlmapping.SqlAttributeMapping# */ {


});


/**
 * TODO
 @class module:montage/data/sqlaccess/sqlmapping.SqlAssociationMapping
 @extends module:montage/data/mapping.AssociationMapping
 */
var SqlAssociationMapping = exports.SqlAssociationMapping = Montage.create(AssociationMapping, /** @lends module:montage/data/sqlaccess/sqlmapping.SqlAssociationMapping# */ {


});

