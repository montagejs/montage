/* <copyright>
Copyright (c) 2012, Motorola Mobility LLC.
All Rights Reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

* Redistributions of source code must retain the above copyright notice,
  this list of conditions and the following disclaimer.

* Redistributions in binary form must reproduce the above copyright notice,
  this list of conditions and the following disclaimer in the documentation
  and/or other materials provided with the distribution.

* Neither the name of Motorola Mobility LLC nor the names of its
  contributors may be used to endorse or promote products derived from this
  software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE
LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
POSSIBILITY OF SUCH DAMAGE.
</copyright> */
/**
 @module montage/data/nosql-mapping
 @requires montage/core/core
 @requires montage/core/logger
 @requires montage/data/mapping
 */
var Montage = require("montage").Montage;
var BinderMapping = require("data/mapping").BinderMapping;
var BlueprintMapping = require("data/mapping").BlueprintMapping;
var AttributeMapping = require("data/mapping").AttributeMapping;
var AssociationMapping = require("data/mapping").AssociationMapping;
var logger = require("core/logger").logger("nosql-mapping");

/**
 * TODO
 @class module:montage/data/nosql-access/nosql-mapping.NoSqlBinderMapping
 @extends module:montage/data/mapping.BinderMapping
 */
var NoSqlBinderMapping = exports.NoSqlBinderMapping = Montage.create(BinderMapping, /** @lends module:montage/data/nosql-access/nosql-mapping.NoSqlBinderMapping# */ {


});


/**
 * TODO
 @class module:montage/data/nosql-access/nosql-mapping.NoSqlBlueprintMapping
 @extends module:montage/data/mapping.BlueprintMapping
 */
var NoSqlBlueprintMapping = exports.NoSqlBlueprintMapping = Montage.create(BlueprintMapping, /** @lends module:montage/data/nosql-access/nosql-mapping.NoSqlBlueprintMapping# */ {


});


/**
 * TODO
 @class module:montage/data/nosql-access/nosql-mapping.NoSqlAttributeMapping
 @extends module:montage/data/mapping.AttributeMapping
 */
var NoSqlAttributeMapping = exports.NoSqlAttributeMapping = Montage.create(AttributeMapping, /** @lends module:montage/data/nosql-access/nosql-mapping.NoSqlAttributeMapping# */ {


});


/**
 * TODO
 @class module:montage/data/nosql-access/nosql-mapping.NoSqlAssociationMapping
 @extends module:montage/data/mapping.AssociationMapping
 */
var NoSqlAssociationMapping = exports.NoSqlAssociationMapping = Montage.create(AssociationMapping, /** @lends module:montage/data/nosql-access/nosql-mapping.NoSqlAssociationMapping# */ {


});

