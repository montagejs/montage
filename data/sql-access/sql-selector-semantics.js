/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2012 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */

/**
 @module montage/data/sql-access/sql-selector-semantics
 @requires montage/core/core
 @requires montage/core/logger
 @requires montage/data/sql-access/sql-mapping
 */

var Montage = require("montage").Montage;
var Semantics = require("core/selector/semantics").Semantics;
var SqlBinderMapping = require("data/sql-access/sql-mapping").SqlBinderMapping;
var SqlBlueprintMapping = require("data/sql-access/sql-mapping").SqlBlueprintMapping;
var SqlAttributeMapping = require("data/sql-access/sql-mapping").SqlAttributeMapping;
var SqlAssociationMapping = require("data/sql-access/sql-mapping").SqlAssociationMapping;
var logger = require("core/logger").logger("sql-selector-semantics");

var SqlSemantics = exports.SqlSemantics = Semantics.create(Semantics, {

    /**
     * @private
     */
    _store:{
        value:null,
        serializable:true
    },

    /**
     Store to use to evaluate this selector
     @type {Property}
     @default {Store} null
     */
    store:{
        get:function () {
            return this._store;
        }
    },

    /**
     * @private
     */
    _transactionID:{
        value:null,
        serializable:true
    },

    /**
     Selector to use to qualify this selector
     @type {Property}
     @default {TanscationID} null
     */
    transactionID:{
        get:function () {
            return this._transactionID;
        }
    },


    /**
     Create a new semantic evaluator with the context.
     @function
     @param {Property} store to evaluate the semantics in.
     @param {Id} transactionId transaction identifier
     @returns {String} SQL expression.
     */
    initWithStore:{
        value:function (store, transactionID) {
            this._store = store;
            this._transactionID = transactionID;
            return this;
        }
    }


});
