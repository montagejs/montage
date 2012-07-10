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
 @module montage/data/transaction-id
 @requires montage/core/core
 @requires montage/core/uuid
 @requires montage/core/logger
 */
var Montage = require("montage").Montage;
var Uuid = require("core/uuid").Uuid;
var logger = require("core/logger").logger("transaction-id");
/**
 @private
 */
var _lastTimestamp = Date.now();
/**
 @private
 */
var _lastNanos = 1;
/**
 @private
 */
var _transactionManagerInstance = null;
/**
 @class module:montage/data/transaction-id.TransactionId
 @extends module:montage/core/core.Montage
 */
var TransactionId = exports.TransactionId = Montage.create(Montage, /** @lends module:montage/data/transaction-id.TransactionId# */ {

    _mappingFolderName:{
        serializable:true,
        enumerable:false,
        value:""
    },

    mappingFolderName:{
        get:function () {
            return this._mappingFolderName;
        }
    },

    /**
     This is used to guarantee unicity.
     @private
     */
    _uuid:{
        serializable:true,
        enumerable:false,
        value:null
    },

    /**
     This is used to order transactions.
     @private
     */
    _timestamp:{
        serializable:true,
        enumerable:false,
        value:null
    },

    /**
     This is used to order transactions.
     @private
     */
    _nanos:{
        serializable:true,
        enumerable:false,
        value:null
    },

    /**
     Description TODO
     @param {name} Mapping set name used for this transaction
     @function
     @returns itself
     */
    initWithMappingSetName:{
        serializable:false,
        enumerable:false,
        value:function (name) {
            this._mappingFolderName = name;
            this._uuid = Uuid.generate();
            var timestamp = Date.now();
            if (_lastTimestamp === timestamp) {
                _lastNanos = _lastNanos + 1;
            } else {
                _lastTimestamp = timestamp;
                _lastNanos = 1
            }
            this._timestamp = _lastTimestamp;
            this._nanos = _lastNanos;
            if (logger.isDebug) {
                logger.debug(this, "New Transaction ID: " + this._timestamp);
            }
            return this;
        }
    },

    /**
     Factory method used to create new Transaction IDs.<br>
     This factory supports a delegate so that application requiring subclassing can do so easily.<br>
     The factory delegate should implement <code>createTransactionId</code> method.
     @function
     @returns TransactionId.create().init() A newly initialized transaction ID.
     */
    factory:{
        value:function () {
            if (this.factory.delegate && typeof this.factory.delegate.createTransactionId === "function") {
                return this.factory.delegate.createTransactionId();
            } else {
                return TransactionId.create().init();
            }
        }},

    /**
     Description TODO
     @function
     @param {Property} transactionId For comparison purposes.
     @returns {Boolean} true If transactionId is after the target transaction ID.
     */
    before:{
        value:function (transactionId) {
            if (this._timestamp === transactionId._timestamp) {
                return this._nanos < transactionId._nanos;
            }
            return this._timestamp < transactionId._timestamp;

        }},

    /**
     Description TODO
     @function
     @param {Property} transactionId For comparison purposes.
     @returns {Boolean} true If transactionId is before the target transaction ID.
     */
    after:{
        value:function (transactionId) {
            if (this._timestamp === transactionId._timestamp) {
                return this._nanos > transactionId._nanos;
            }
            return this._timestamp > transactionId._timestamp;
        }},

    /**
     Returns the transaction manager.<br>
     The transaction manager is a unique object in charge of openning and closing transactions.
     @function
     @returns transaction manager
     */
    manager:{
        get:function () {
            if (_transactionManagerInstance === null) {
                _transactionManagerInstance = TransactionManager.create().init();
            }
            return _transactionManagerInstance;
        }
    }


});
/**
 @class module:montage/data/transaction-id.TransactionManager
 */
var TransactionManager = exports.TransactionManager = Montage.create(Montage, /** @lends module:montage/data/transaction-id.TransactionManager# */ {

    /*
     * @private
     */
    _currentTransaction:{
        serializable:false,
        enumerable:false,
        value:null
    },

    /**
     Enables the trace of creation starts.<br>
     When enabled, the transaction ID will memorize the state of the thread stack when created.
     @type {Property} Function
     @default {Boolean} false
     */
    traceTransactionStart:{
        serializable:false,
        enumerable:false,
        value:false
    },

    /**
     Description TODO
     @function
     @returns itself
     */
    init:{
        serializable:false,
        enumerable:false,
        value:function () {
            return this;
        }
    },

    /**
     Opens a new transaction ID for this thread.
     @function
     @param {name} Mapping set name used for this transaction
     @returns null or new transaction ID
     @throws IllegalStateException if a transaction is already open for this thread.
     */
    startTransaction:{ value:function (name) {
        if (this._currentTransaction) {
            throw new Error("Transaction Open: " + JSON.stringify(this._currentTransaction));
        }
        this._currentTransaction = TransactionId.create().initWithMappingSetName(name);
        return this._currentTransaction;
    }},

    /**
     Returns the current transaction ID for this thread.
     @function
     @returns null or current transaction ID
     */
    currentTransaction:{ value:function () {
        return this._currentTransaction;
    }},

    /**
     Checks if the current thread has an open transaction.
     @function
     @returns {Boolean} <code>true</code> if the current thread has an open transaction, <code>flase</code> otherwise.
     */
    hasCurrentTransaction:{ value:function () {
        return this._currentTransaction != null;
    }},

    /**
     Sets the transaction ID as the current transaction.<br>
     The transaction ID can be made current only if there is no other transaction in process for the thread, and this transaction is not used by another thread.
     @function
     @param {Property} transactionId to use
     @throws IllegalStateException if there is an open transaction for this thread or if there is another thread using this ID.
     */
    openTransaction:{ value:function (transactionId) {
        if (this._currentTransaction) {
            throw new Error("Transaction Open: " + JSON.stringify(this._currentTransaction));
        }
        this._currentTransaction = transactionId;
        return this._currentTransaction;
    }},

    /**
     Retires a transaction ID of the current thread.
     @function
     @param {Property} transactionId The current transaction ID.
     @throws IllegalStateException if there is no open transaction ID for this thread.
     */
    closeTransaction:{ value:function (transactionId) {
        if (this._currentTransaction !== transactionId) {
            throw new Error("Transaction Not Open: " + JSON.stringify(this._currentTransaction));
        }
        this._currentTransaction = null;
        return this._currentTransaction;
    }}

});

