/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
/**
 @module montage/data/transactionid
 @requires montage/core/core
 @requires montage/core/uuid
 @requires montage/core/logger
 */
var Montage = require("montage").Montage;
var Uuid = require("core/uuid").Uuid;
var logger = require("core/logger").logger("transactionid");
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
 @class module:montage/data/transactionid.TransactionId
 @extends module:montage/core/core.Montage
 */
var TransactionId = exports.TransactionId = Montage.create(Montage, /** @lends module:montage/data/transactionid.TransactionId# */ {

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
     @param {name} Mapping folder name used for this transaction
     @function
     @returns itself
     */
    initWithMappingFolderName:{
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
 @class module:montage/data/transactionid.TransactionManager
 */
var TransactionManager = exports.TransactionManager = Montage.create(Montage, /** @lends module:montage/data/transactionid.TransactionManager# */ {

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
     @param {name} Mapping folder name used for this transaction
     @returns null or new transaction ID
     @throws IllegalStateException if a transaction is already open for this thread.
     */
    startTransaction:{ value:function (name) {
        if (this._currentTransaction) {
            throw new Error("Transaction Open: " + JSON.stringify(this._currentTransaction));
        }
        this._currentTransaction = TransactionId.create().initWithMappingFolderName(name);
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

