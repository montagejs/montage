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
 @module montage/data/sql-mapping
 @requires montage/core/core
 @requires montage/core/logger
 @requires montage/data/mapping
 */
var Montage = require("montage").Montage;
var BinderMapping = require("data/mapping").BinderMapping;
var BlueprintMapping = require("data/mapping").BlueprintMapping;
var AttributeMapping = require("data/mapping").AttributeMapping;
var AssociationMapping = require("data/mapping").AssociationMapping;
var logger = require("core/logger").logger("sql-mapping");

/**
 * TODO
 @class module:montage/data/sql-access/sql-mapping.SqlBinderMapping
 @extends module:montage/data/mapping.BinderMapping
 */
var SqlBinderMapping = exports.SqlBinderMapping = Montage.create(BinderMapping, /** @lends module:montage/data/sql-access/sql-mapping.SqlBinderMapping# */ {


});


/**
 * TODO
 @class module:montage/data/sql-access/sql-mapping.SqlBlueprintMapping
 @extends module:montage/data/mapping.BlueprintMapping
 */
var SqlBlueprintMapping = exports.SqlBlueprintMapping = Montage.create(BlueprintMapping, /** @lends module:montage/data/sql-access/sql-mapping.SqlBlueprintMapping# */ {


    /**
     * @private
     */
    _tableName:{
        value:"",
        serializable:true
    },

    /**
     Table name for this blueprint
     @type {Property}
     @default {String} null
     */
    tableName:{
        get:function () {
            return this._tableName;
        },
        set:function (value) {
            this._tableName = value;
        }
    }

});


/**
 * TODO
 @class module:montage/data/sql-access/sql-mapping.SqlAttributeMapping
 @extends module:montage/data/mapping.AttributeMapping
 */
var SqlAttributeMapping = exports.SqlAttributeMapping = Montage.create(AttributeMapping, /** @lends module:montage/data/sql-access/sql-mapping.SqlAttributeMapping# */ {

    /**
     * @private
     */
    _columnName:{
        value:"",
        serializable:true
    },

    /**
     Column name for this attribute
     @type {Property}
     @default {String} null
     */
    columnName:{
        get:function () {
            return this._columnName;
        },
        set:function (value) {
            this._columnName = value;
        }
    },

    /**
     * @private
     */
    _columnType:{
        value:"",
        serializable:true
    },

    /**
     Column type for this attribute
     @type {Property}
     @default {String} null
     */
    columnType:{
        get:function () {
            return this._columnType;
        },
        set:function (value) {
            this._columnType = value;
        }
    },

    /**
     * @private
     */
    _columnWidth:{
        value:0,
        serializable:true
    },

    /**
     Column width for this attribute
     @type {Property}
     @default {int} 0
     */
    columnWidth:{
        get:function () {
            return this._columnWidth;
        },
        set:function (value) {
            this._columnWidth = value;
        }
    },

    /**
     * @private
     */
    _columnPrecision:{
        value:0,
        serializable:true
    },

    /**
     Column precision for this attribute
     @type {Property}
     @default {int} 0
     */
    columnPrecision:{
        get:function () {
            return this._columnPrecision;
        },
        set:function (value) {
            this._columnPrecision = value;
        }
    },

    /**
     * @private
     */
    _columnScale:{
        value:0,
        serializable:true
    },

    /**
     Column scale for this attribute
     @type {Property}
     @default {int} 0
     */
    columnScale:{
        get:function () {
            return this._columnScale;
        },
        set:function (value) {
            this._columnScale = value;
        }
    }

});


/**
 * TODO
 @class module:montage/data/sql-access/sql-mapping.SqlAssociationMapping
 @extends module:montage/data/mapping.AssociationMapping
 */
var SqlAssociationMapping = exports.SqlAssociationMapping = Montage.create(AssociationMapping, /** @lends module:montage/data/sql-access/sql-mapping.SqlAssociationMapping# */ {


});

