/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2012 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
/**
 @module montage/data/rest-mapping
 @requires montage/core/core
 @requires montage/core/logger
 @requires montage/data/mapping
 */
var Montage = require("montage").Montage;
var BinderMapping = require("data/mapping").BinderMapping;
var BlueprintMapping = require("data/mapping").BlueprintMapping;
var AttributeMapping = require("data/mapping").AttributeMapping;
var AssociationMapping = require("data/mapping").AssociationMapping;
var logger = require("core/logger").logger("rest-mapping");

/**
 * TODO
 @class module:montage/data/rest-access/rest-mapping.RestBinderMapping
 @extends module:montage/data/mapping.BinderMapping
 */
var RestBinderMapping = exports.RestBinderMapping = Montage.create(BinderMapping, /** @lends module:montage/data/rest-access/rest-mapping.RestBinderMapping# */ {


});


/**
 * TODO
 @class module:montage/data/rest-access/rest-mapping.RestBlueprintMapping
 @extends module:montage/data/mapping.BlueprintMapping
 */
var RestBlueprintMapping = exports.RestBlueprintMapping = Montage.create(BlueprintMapping, /** @lends module:montage/data/rest-access/rest-mapping.RestBlueprintMapping# */ {


});


/**
 * TODO
 @class module:montage/data/rest-access/rest-mapping.RestAttributeMapping
 @extends module:montage/data/mapping.AttributeMapping
 */
var RestAttributeMapping = exports.RestAttributeMapping = Montage.create(AttributeMapping, /** @lends module:montage/data/rest-access/rest-mapping.RestAttributeMapping# */ {


});


/**
 * TODO
 @class module:montage/data/rest-access/rest-mapping.RestAssociationMapping
 @extends module:montage/data/mapping.AssociationMapping
 */
var RestAssociationMapping = exports.RestAssociationMapping = Montage.create(AssociationMapping, /** @lends module:montage/data/rest-access/rest-mapping.RestAssociationMapping# */ {


});

