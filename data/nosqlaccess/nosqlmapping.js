/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
/**
 @module montage/data/nosqlmapping
 @requires montage/core/core
 @requires montage/core/logger
 @requires montage/data/mapping
 */
var Montage = require("montage/core").Montage;
var BinderMapping = require("montage/data/mapping").BinderMapping;
var BlueprintMapping = require("montage/data/mapping").BlueprintMapping;
var AttributeMapping = require("montage/data/mapping").AttributeMapping;
var AssociationMapping = require("montage/data/mapping").AssociationMapping;
var logger = require("montage/logger").logger("nosqlmapping");

/**
 * TODO
 @class module:montage/data/nosqlaccess/nosqlmapping.NoSqlBinderMapping
 @extends module:montage/data/mapping.BinderMapping
 */
var NoSqlBinderMapping = exports.NoSqlBinderMapping = Montage.create(BinderMapping, /** @lends module:montage/data/nosqlaccess/nosqlmapping.NoSqlBinderMapping# */ {


});


/**
 * TODO
 @class module:montage/data/nosqlaccess/nosqlmapping.NoSqlBlueprintMapping
 @extends module:montage/data/mapping.BlueprintMapping
 */
var NoSqlBlueprintMapping = exports.NoSqlBlueprintMapping = Montage.create(BlueprintMapping, /** @lends module:montage/data/nosqlaccess/nosqlmapping.NoSqlBlueprintMapping# */ {


});


/**
 * TODO
 @class module:montage/data/nosqlaccess/nosqlmapping.NoSqlAttributeMapping
 @extends module:montage/data/mapping.AttributeMapping
 */
var NoSqlAttributeMapping = exports.NoSqlAttributeMapping = Montage.create(AttributeMapping, /** @lends module:montage/data/nosqlaccess/nosqlmapping.NoSqlAttributeMapping# */ {


});


/**
 * TODO
 @class module:montage/data/nosqlaccess/nosqlmapping.NoSqlAssociationMapping
 @extends module:montage/data/mapping.AssociationMapping
 */
var NoSqlAssociationMapping = exports.NoSqlAssociationMapping = Montage.create(AssociationMapping, /** @lends module:montage/data/nosqlaccess/nosqlmapping.NoSqlAssociationMapping# */ {


});

