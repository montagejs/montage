/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
/**
 @module montage/data/restmapping
 @requires montage/core/core
 @requires montage/core/logger
 @requires montage/data/mapping
 */
var Montage = require("montage/core").Montage;
var BinderMapping = require("montage/data/mapping").BinderMapping;
var BlueprintMapping = require("montage/data/mapping").BlueprintMapping;
var AttributeMapping = require("montage/data/mapping").AttributeMapping;
var AssociationMapping = require("montage/data/mapping").AssociationMapping;
var logger = require("montage/logger").logger("restmapping");

/**
 * TODO
 @class module:montage/data/restaccess/restmapping.RestBinderMapping
 @extends module:montage/data/mapping.BinderMapping
 */
var RestBinderMapping = exports.RestBinderMapping = Montage.create(BinderMapping, /** @lends module:montage/data/restaccess/restmapping.RestBinderMapping# */ {


});


/**
 * TODO
 @class module:montage/data/restaccess/restmapping.RestBlueprintMapping
 @extends module:montage/data/mapping.BlueprintMapping
 */
var RestBlueprintMapping = exports.RestBlueprintMapping = Montage.create(BlueprintMapping, /** @lends module:montage/data/restaccess/restmapping.RestBlueprintMapping# */ {


});


/**
 * TODO
 @class module:montage/data/restaccess/restmapping.RestAttributeMapping
 @extends module:montage/data/mapping.AttributeMapping
 */
var RestAttributeMapping = exports.RestAttributeMapping = Montage.create(AttributeMapping, /** @lends module:montage/data/restaccess/restmapping.RestAttributeMapping# */ {


});


/**
 * TODO
 @class module:montage/data/restaccess/restmapping.RestAssociationMapping
 @extends module:montage/data/mapping.AssociationMapping
 */
var RestAssociationMapping = exports.RestAssociationMapping = Montage.create(AssociationMapping, /** @lends module:montage/data/restaccess/restmapping.RestAssociationMapping# */ {


});

