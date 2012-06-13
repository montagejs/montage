/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2012 Motorola Mobility, Inc.  All Rights Reserved.
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

