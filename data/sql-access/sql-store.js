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
 @module montage/data/sql-access/sql-store
 @requires montage/core/core
 @requires montage/data/store
 @requires montage/core/logger
 @requires data/sql-access/sql-mapping
 */
var Montage = require("montage").Montage;
var Store = require("data/store").Store;
var SqlBinderMapping = require("data/sql-access/sql-mapping").SqlBinderMapping;
var SqlBlueprintMapping = require("data/sql-access/sql-mapping").SqlBlueprintMapping;
var SqlAttributeMapping = require("data/sql-access/sql-mapping").SqlAttributeMapping;
var SqlAssociationMapping = require("data/sql-access/sql-mapping").SqlAssociationMapping;
var SqlSemantics = require("data/sql-access/sql-selector-semantics").SqlSemantics;
var logger = require("core/logger").logger("sql-store");

/**
 @class module:montage/data/sql-access/sql-store.SqlStore
 @extends module:montage/data/store.Store
 */
var SqlStore = exports.SqlStore = Montage.create(Store, /** @lends module:montage/data/sql-access/sql-store.SqlStore# */ {

    /**
     Description TODO
     @function
     @param {Object} objectId TODO
     @param {Property} context TODO
     @param {Property} transactionId TODO
     @returns null
     */
    pledgeForObjectId$Implementation:{
        value:function (objectId, context, transactionId) {
            // TODO [PJYF Apr 28 2011] We need to implement it.
            return null;
        }
    },

    /**
     Description TODO
     @function
     @param {Object} sourceObject TODO
     @param {Property} relationship TODO
     @param {Property} context TODO
     @param {Property} transactionId TODO
     @returns null
     */
    pledgeForSourceObjectAssociation$Implementation:{
        value:function (sourceObject, relationship, context, transactionId) {
            // TODO [PJYF Apr 28 2011] We need to implement it.
            return null;
        }
    },


    /**
     Execute a query in the context of the current store.
     @function
     @param {Property} query describing the object to retrieve
     @param {Property} context change context into which to insert the objects
     @param {Id} transactionId transaction identifier
     @returns {Array} PledgedSortedSet pledge for the object to retrieve
     */
    queryInContext$Implementation:{
        value:function (query, context, transactionID) {
            var sqlSemantics = SqlSemantics/create().initWithStore(this, transactionID);
            var sqlExpression = sqlSemantics.evaluate(query.selector.syntax, query.blueprint, query.parameters, null);
            // TODO [PJYF June 25 2012] We need to submit the expression to the database

            // Placeholder
            return new PledgedSortedSet.create().initWithQueryAndContext(query, context);
        }
    }
,


    /**
     Create a new binder mapping.
     @function
     @returns binder mapping
     */
    createBinderMapping:{
        get:function () {
            return SqlBinderMapping.create();
        }
    },

    /**
     Create a new blueprint mapping.
     @function
     @returns blueprint mapping
     */
    createBlueprintMapping:{
        get:function () {
            return SqlBlueprintMapping.create();
        }
    },

    /**
     Create a new attribute mapping.
     @function
     @returns attribute mapping
     */
    createAttributeMapping:{
        get:function () {
            return SqlAttributeMapping.create();
        }
    },

    /**
     Create a new association mapping.
     @function
     @returns association mapping
     */
    createAssociationMapping:{
        get:function () {
            return SqlAssociationMapping.create();
        }
    }


});
