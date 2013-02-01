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
