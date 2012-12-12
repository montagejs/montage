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
 @module montage/data/store
 @requires montage/core/core
 @requires montage/data/blueprint
 @requires montage/data/mapping
 @requires montage/data/query
 @requires montage/data/restriction
 @requires montage/data/transaction-id
 @requires montage/data/object-id
 @requires montage/data/control-listener
 @requires montage/core/serializer
 @requires montage/core/deserializer
 @requires montage/core/promise
 @requires montage/core/logger
 */
var Montage = require("montage").Montage;
var Blueprint = require("data/blueprint").Blueprint;
var BlueprintBinder = require("data/blueprint").BlueprintBinder;
var BinderMapping = require("data/mapping").BinderMapping;
var BlueprintMapping = require("data/mapping").BlueprintMapping;
var AttributeMapping = require("data/mapping").AttributeMapping;
var AssociationMapping = require("data/mapping").AssociationMapping;
var StoreConnectionInformation = require("data/store-connection-information").StoreConnectionInformation;
var Query = require("data/query").Query;
var Pledge = require("data/pledge").Pledge;
var PledgedSortedSet = require("data/pledge").PledgedSortedSet;
var Restriction = require("data/restriction").Restriction;
var TransactionId = require("data/transaction-id").TransactionId;
var ObjectId = require("data/object-id").ObjectId;
var TemporaryObjectId = require("data/object-id").TemporaryObjectId;
var Serializer = require("core/serializer").Serializer;
var Deserializer = require("core/deserializer").Deserializer;
var Promise = require("core/promise").Promise;
var Exception = require("core/exception").Exception;

var logger = require("core/logger").logger("store");
/**
 Description TODO
 @private
 */
var _defaultStoreManager = null;
/**
 @class module:montage/data/store.Store
 @extends module:montage/core/core.Montage
 */
var Store = exports.Store = Montage.create(Montage, /** @lends module:montage/data/store.Store# */ {

    /*
     * @private
     */
    _connectionInfo:{
        serializable:true,
        enumerable:false,
        value:null
    },

    /*
     * Connection information for the store
     */
    connectionInfo:{
        get:function () {
            return this._connectionInfo;
        },
        set:function (info) {
            // TODO [PJYF May 15 2012] We need to check that the connection info is valid for this store.
            this._connectionInfo = info;
        }
    },

    /**
     Description TODO
     @type {Property}
     @default {Array} new Array(10)
     */
    restrictions:{
        serializable:true,
        writable:false,
        distinct:true,
        value:new Array(10)
    },

    /**
     @private
     */
    _parent:{
        serializable:true,
        enumerable:false,
        value:null
    },

    /**
     Returns the parent store.
     @function
     @returns this._parent
     */
    parent:{
        get:function () {
            return this._parent;
        }
    },

    /**
     Returns the default store manager.<br>
     If none is defined it will create one that will then be reused for subsequent calls.
     @function
     @returns _defaultStoreManager
     */
    defaultManager:{
        get:function () {
            if (_defaultStoreManager === null) {
                _defaultStoreManager = StoreManager.create().init();
            }
            return _defaultStoreManager;
        },
        // This is used only for testing.
        set:function (storeManager) {
            _defaultStoreManager = storeManager;
        }
    },

    /**
     @function
     @returns this.initWithParentAndRestrictions(null, null)
     */
    init:{
        serializable:false,
        enumerable:false,
        value:function () {
            return this.initWithParentAndRestrictions(null, null);
        }
    },

    /**
     @function
     @param {Property} parent TODO
     @returns this.initWithParentAndRestrictions(parent, null)
     */
    initWithParent:{
        serializable:false,
        enumerable:false,
        value:function (parent) {
            return this.initWithParentAndRestrictions(parent, null);
        }
    },
    /**
     Description TODO
     @function
     @param {Property} parent TODO
     @param {Property} restrictions TODO
     @returns itself
     */
    initWithParentAndRestrictions:{
        serializable:false,
        value:function (parent, restrictions) {
            if (this.parent !== null) {
                this.parent.remove(this);
            }
            this._parent = (parent != null ? parent : Store.defaultManager);
            this.parent.addStore(this);

            if (restrictions != null) {
                var restriction, index;
                for (index = 0; typeof (restriction = restrictions[index]) !== "undefined"; index++) {
                    this.restrictions.push(Object.freeze(restriction));
                }
            }
            return this;
        }
    },

    /**
     Description TODO
     @function
     @param {Prototyoe} prototypeName TODO
     @param {Id} moduleId TODO
     @returns null
     */
    blueprintForPrototype:{
        value:function (prototypeName, moduleId) {
            if (this.parent !== null) {
                return this.parent.blueprintForPrototype(prototypeName, moduleId);
            }
            return null;
        }
    },

    /**
     Create a new binder mapping.<br/>This is intended to be subclassed by concrete store to create the right mapping for their store.
     @function
     @returns binder mapping
     */
    createBinderMapping:{
        get:function () {
            return BinderMapping.create();
        }
    },

    /**
     Create a new blueprint mapping.<br/>This is intended to be subclassed by concrete store to create the right mapping for their store.
     @function
     @returns blueprint mapping
     */
    createBlueprintMapping:{
        get:function () {
            return BlueprintMapping.create();
        }
    },

    /**
     Create a new attribute mapping.<br/>This is intended to be subclassed by concrete store to create the right mapping for their store.
     @function
     @returns attribute mapping
     */
    createAttributeMapping:{
        get:function () {
            return AttributeMapping.create();
        }
    },

    /**
     Create a new association mapping.<br/>This is intended to be subclassed by concrete store to create the right mapping for their store.
     @function
     @returns association mapping
     */
    createAssociationMapping:{
        get:function () {
            return AssociationMapping.create();
        }
    },

    /**
     Add a store to the cooperating objects stores.
     @function
     @param {Property} store TODO
     @returns store
     */
    addStore:{
        value:function (store) {
            if (this.parent !== null) {
                return this.parent.addStore(store);
            }
            return store;
        }
    },

    /**
     Remove a store to the cooperating objects stores.
     @function
     @param {Property} store TODO
     @returns store
     */
    removeStore:{
        value:function (store) {
            if (this.parent !== null) {
                return this.parent.removeStore(store);
            }
            return store;
        }
    },

    /**
     Load a blueprint in the store manager.<br>
     This will force the loading of the corresponding store if not already in memory.
     @function
     @param {Property} blueprint Either a binder object or a serialized representation of a binder object.
     @param {Property} transactionId current transaction identifier
     @returns this.parent.requireStoreForBlueprint(binder)
     */
    requireStoreForBlueprint:{
        value:function (blueprint, transactionId) {
            if (this.parent !== null) {
                return this.parent.requireStoreForBlueprint(blueprint, transactionId);
            }
        }
    },

    /**
     Check if the referenced blueprint can be serviced by the target store.
     @function
     @param {Property} blueprint TODO
     @param {Property} transactionId current transaction identifier
     @returns true if the current store can service that binder.
     */
    canServiceBlueprint:{
        value:function (blueprint, transactionId) {
            var blueprintMapping = blueprint.mappingForName(transactionId.mappingFolderName);
            if (!blueprintMapping) {
                return false;
            }
            var binderMapping = blueprintMapping.parent;
            if (!binderMapping) {
                return false;
            }
            var metadata = Montage.getInfoForObject(this);
            if ((binderMapping.storePrototypeName === metadata.objectName) && (binderMapping.storeModuleId === metadata.moduleId)) {
                if (this.connectionInfo) {
                    var connectionInfo = binderMapping.connectionInformationForName(this.connectionInfo.name);
                    return this.connectionInfo.equals(connectionInfo);
                }
                // TODO [PJYF May 15 2012] I am not sure this is correct it may be a bit bizarre.
                return true;
            }
            return false;
        }
    },

    /**
     Check if the query blueprint can be serviced by this store.
     @function
     @param {Property} query TODO
     @param {Property} transactionId TODO
     @returns {Boolean} true if the current store can service the query
     */
    canServiceQuery:{
        value:function (query, transactionId) {
            if (query != null) {
                return this.canServiceBlueprint(query.blueprint, transactionId);
            }
            return false;
        }
    },

    /**
     Description TODO
     @function
     @param {Object} object  TODO
     @param {Property} context TODO
     @param {Id} transactionId TODO
     @param {name} Mapping set name used for this transaction
     @returns this.permanentIdForObjectId$Implementation(objectId, context, aTransactionId)
     */
    permanentIdForObjectId:{
        value:function (object, context, transactionId, name) {
            var aTransactionId = transactionId;
            var hadOpenTransaction = false;
            try {
                if (aTransactionId == null) {
                    hadOpenTransaction = TransactionId.manager.hasCurrentTransaction();
                    if (hadOpenTransaction) {
                        aTransactionId = TransactionId.manager.currentTransaction();
                    } else {
                        aTransactionId = TransactionId.manager.startTransaction(name);
                    }
                }
                return this.permanentIdForObjectId$Implementation(object, context, aTransactionId);
            } finally {
                if (!hadOpenTransaction) {
                    TransactionId.manager.closeTransaction(aTransactionId);
                }
            }
        }
    },
    /**
     Description TODO
     @function
     @param {Object} object  TODO
     @param {Property} context TODO
     @param {Id} transactionId TODO
     @returns Promise.resolve(null)
     */
    permanentIdForObjectId$Implementation:{
        value:function (object, context, transactionId) {
            if (typeof object.objectId !== "undefined") {
                return Promise.resolve(object.objectId);
            }
            return Promise.resolve(null);
        }
    },
    /**
     Description TODO
     @function
     @param {Object} objectId  TODO
     @param {Property} context TODO
     @param {Id} transactionId TODO
     @param {name} Mapping set name used for this transaction
     @returns this.pledgeForObjectId$Implementation(objectId, context, aTransactionId)
     */
    pledgeForObjectId:{
        value:function (objectId, context, transactionId, name) {
            var aTransactionId = transactionId;
            var hadOpenTransaction = false;
            try {
                if (aTransactionId == null) {
                    hadOpenTransaction = TransactionId.manager.hasCurrentTransaction();
                    if (hadOpenTransaction) {
                        aTransactionId = TransactionId.manager.currentTransaction();
                    } else {
                        aTransactionId = TransactionId.manager.startTransaction(name);
                    }
                }
                return this.pledgeForObjectId$Implementation(objectId, context, aTransactionId);
            } finally {
                if (!hadOpenTransaction) {
                    TransactionId.manager.closeTransaction(aTransactionId);
                }
            }
        }
    },
    /**
     Description TODO
     @function
     @param {Object} objectId  TODO
     @param {Property} context TODO
     @param {Id} transactionId TODO
     @returns Promise.resolve(null)
     */
    pledgeForObjectId$Implementation:{
        value:function (objectId, context, transactionId) {
            // TODO [PJYF May 17 2011] This needs to be reimplemented
            return Promise.resolve(null);
        }
    },
    /**
     Description TODO
     @function
     @param {Object} sourceObject TODO
     @param {Property} relationshipName TODO
     @param {Property} context TODO
     @param {Id} transactionId TODO
     @param {name} Mapping set name used for this transaction
     @returns this.pledgeForSourceObjectAssociationNamed$Implementation(sourceObject, relationshipName, context, aTransactionId)
     */
    pledgeForSourceObjectAssociationNamed:{
        value:function (sourceObject, relationshipName, context, transactionId, name) {
            var aTransactionId = transactionId;
            var hadOpenTransaction = false;
            try {
                if (aTransactionId == null) {
                    hadOpenTransaction = TransactionId.manager.hasCurrentTransaction();
                    if (hadOpenTransaction) {
                        aTransactionId = TransactionId.manager.currentTransaction();
                    } else {
                        aTransactionId = TransactionId.manager.startTransaction(name);
                    }
                }
                return this.pledgeForSourceObjectAssociationNamed$Implementation(sourceObject, relationshipName, context, aTransactionId);
            } finally {
                if (!hadOpenTransaction) {
                    TransactionId.manager.closeTransaction(aTransactionId);
                }
            }
        }
    },
    /**
     Description TODO
     @function
     @param {Object} sourceObject TODO
     @param {Property} relationshipName TODO
     @param {Property} context TODO
     @param {Id} transactionId TODO
     @returns Promise.resolve(null)
     */
    pledgeForSourceObjectAssociationNamed$Implementation:{
        value:function (sourceObject, relationshipName, context, transactionId) {
            if (this.parent !== null) {
                return this.parent.pledgeForSourceObjectAssociationNamed$Implementation(sourceObject, relationshipName, context, transactionId);
            }
            return Promise.resolve(null);
        }
    },

    /**
     Returns a pledge for the source object and the relationship referenced.<br>
     The resulting pledge can be a simple one or an array pledge depending on the type of relationship.<br>
     <b>Note:</b> The source object may not be in the current data source. The destination object is.
     @function
     @param {Object} sourceObject TODO
     @param {Property} relationship TODO
     @param {Property} context TODO
     @param {Id} transactionId TODO
     @param {name} Mapping set name used for this transaction
     @returns this.pledgeForSourceObjectAssociation$Implementation(sourceObject, relationship, context, aTransactionId)
     */
    pledgeForSourceObjectAssociation:{
        value:function (sourceObject, relationship, context, transactionId, name) {
            var aTransactionId = transactionId;
            var hadOpenTransaction = false;
            try {
                if (aTransactionId == null) {
                    hadOpenTransaction = TransactionId.manager.hasCurrentTransaction();
                    if (hadOpenTransaction) {
                        aTransactionId = TransactionId.manager.currentTransaction();
                    } else {
                        aTransactionId = TransactionId.manager.startTransaction(name);
                    }
                }
                return this.pledgeForSourceObjectAssociation$Implementation(sourceObject, relationship, context, aTransactionId);
            } finally {
                if (!hadOpenTransaction) {
                    TransactionId.manager.closeTransaction(aTransactionId);
                }
            }
        }
    },

    /**
     Description TODO
     @function
     @param {Object} sourceObject TODO
     @param {Property} relationship TODO
     @param {Property} context TODO
     @param {Id} transactionId TODO
     @returns this.parent.pledgeForSourceObjectAssociation$Implementation(sourceObject, relationship, context, transactionId)
     */
    pledgeForSourceObjectAssociation$Implementation:{
        value:function (sourceObject, relationship, context, transactionId) {
            if (this.parent !== null) {
                return this.parent.pledgeForSourceObjectAssociation$Implementation(sourceObject, relationship, context, transactionId);
            }
        }
    },

    /**
     Called by the framework whenever a new object is inserted, or a pledge is fired.
     @function
     @param {Object} object TODO
     @param {Property} context TODO
     @param {Id} transactionId TODO
     @param {name} Mapping set name used for this transaction
     @returns this.initializeObject$Implementation(object, context, aTransactionId)
     */
    initializeObject:{
        value:function (object, context, transactionId, name) {
            var aTransactionId = transactionId;
            var hadOpenTransaction = false;
            try {
                if (aTransactionId == null) {
                    hadOpenTransaction = TransactionId.manager.hasCurrentTransaction();
                    if (hadOpenTransaction) {
                        aTransactionId = TransactionId.manager.currentTransaction();
                    } else {
                        aTransactionId = TransactionId.manager.startTransaction(name);
                    }
                }
                return this.initializeObject$Implementation(object, context, aTransactionId);
            } finally {
                if (!hadOpenTransaction) {
                    TransactionId.manager.closeTransaction(aTransactionId);
                }
            }
        }
    },

    /**
     Description TODO
     @function
     @param {Object} object TODO
     @param {Property} context TODO
     @param {Id} transactionId TODO
     @returns Promise.resolve(object)
     */
    initializeObject$Implementation:{
        value:function (object, context, transactionId) {
            if (typeof object.objectId === "undefined") {
                // TODO [PJYF June 17 2011] This will need to be revisited.p
                object.objectId = TemporaryObjectId.create().init();
            }
            return Promise.resolve(object);
        }
    },

    /**
     Description TODO
     @function
     @param {Object} target TODO
     @param {Property} context TODO
     @param {Id} transactionId TODO
     @param {name} Mapping set name used for this transaction
     @returns this.repledgeObject$Implementation(target, context, aTransactionId)
     */
    repledgeObject:{
        value:function (target, context, transactionId, name) {
            var aTransactionId = transactionId;
            var hadOpenTransaction = false;
            try {
                if (aTransactionId == null) {
                    hadOpenTransaction = TransactionId.manager.hasCurrentTransaction();
                    if (hadOpenTransaction) {
                        aTransactionId = TransactionId.manager.currentTransaction();
                    } else {
                        aTransactionId = TransactionId.manager.startTransaction(name);
                    }
                }
                if (Array.isArray(target)) {
                    // Invalidate objects in the list
                    var returnArray = new Array(target.length);
                    var mo, index;
                    for (index = 0; typeof (mo = target[index]) !== "undefined"; index++) {
                        returnArray[index] = this.repledgeObject$Implementation(mo, context, aTransactionId);
                    }
                    return returnArray;
                } else {
                    return this.repledgeObject$Implementation(target, context, aTransactionId);
                }
            } finally {
                if (!hadOpenTransaction) {
                    TransactionId.manager.closeTransaction(aTransactionId);
                }
            }
        }
    },

    /**
     Description TODO
     @function
     @param {Object} object TODO
     @param {Property} context TODO
     @param {Id} transactionId TODO
     @returns Promise.resolve(object)
     */
    repledgeObject$Implementation:{
        value:function (object, context, transactionId) {
            if (typeof object.objectId !== "undefined") {
                return this.pledgeForObjectId(object.objectId, context, transactionId);
            }
            return Promise.resolve(object);
        }

    },

    /**
     Description TODO
     @function
     @param {Property} context TODO
     @param {Id} transactionId TODO
     @param {name} Mapping set name used for this transaction
     */
    saveChangesInContext:{
        value:function (context, transactionId, name) {
            var aTransactionId = transactionId;
            var hadOpenTransaction = false;
            try {
                if (aTransactionId == null) {
                    hadOpenTransaction = TransactionId.manager.hasCurrentTransaction();
                    if (hadOpenTransaction) {
                        aTransactionId = TransactionId.manager.currentTransaction();
                    } else {
                        aTransactionId = TransactionId.manager.startTransaction(name);
                    }
                }
                this.saveChangesInContext$Implementation(context, aTransactionId);
            } finally {
                if (!hadOpenTransaction) {
                    TransactionId.manager.closeTransaction(aTransactionId);
                }
            }
        }
    },

    /**
     Description TODO
     @function
     @param {Property} context TODO
     @param {Id} transactionId TODO
     @returns this.parent.saveChangesInContext$Implementation(context, transactionId)
     */
    saveChangesInContext$Implementation:{
        value:function (context, transactionId) {
            if (this.parent !== null) {
                return this.parent.saveChangesInContext$Implementation(context, transactionId);
            }
        }
    },

    /**
     Called on each store before a save.<br>
     Upon receiving this message the store should take steps to prepare the commit and insure it will succeed.<br>
     If the commit cannot succeed it should return a rejected promise.
     @function
     @param {Property} context TODO
     @param {Id} transactionId TODO
     @returns {Boolean} Promise.resolve(true)
     */
    prepareToSaveChangesInContext$Implementation:{
        value:function (context, transactionId) {
            // TODO [PJYF Sep 27 2011] This needs to be reimplemented
            return Promise.resolve(true);
        }
    },

    /**
     Called on each store before a revert a prepare to save.<br>
     Any step taken to prepare the save should be rolled back.
     @function
     @param {Property} context TODO
     @param {Id} transactionId TODO
     @returns {Boolean} Promise.resolve(true)
     */
    cancelSaveChangesInContext$Implementation:{
        value:function (context, transactionId) {
            // TODO [PJYF Sep 27 2011] This needs to be reimplemented
            return Promise.resolve(true);
        }
    },

    /**
     Commits the transaction.<br>
     Any failure during this step will cause the store to be left an inconsistent state.
     @function
     @param {Property} context TODO
     @param {Id} transactionId TODO
     @returns {Boolean} Promise.resolve(true)
     */
    commitChangesInContext$Implementation:{
        value:function (context, transactionId) {
            // TODO [PJYF Sep 27 2011] This needs to be reimplemented
            return Promise.resolve(true);
        }
    },

    /**
     Execute a query in the context of the current store.
     @function
     @param {Property} query describing the object to retrieve
     @param {Property} context change context into which to insert the objects
     @param {Id} transactionId transaction identifier
     @param {name} Mapping set name used for this transaction
     @returns this.queryInContext$Implementation(query, context, aTransactionId)
     */
    queryInContext:{
        value:function (query, context, transactionId, name) {
            var aTransactionId = transactionId;
            var hadOpenTransaction = false;
            try {
                if (aTransactionId == null) {
                    hadOpenTransaction = TransactionId.manager.hasCurrentTransaction();
                    if (hadOpenTransaction) {
                        aTransactionId = TransactionId.manager.currentTransaction();
                    } else {
                        aTransactionId = TransactionId.manager.startTransaction(name);
                    }
                }
                return this.queryInContext$Implementation(query, context, aTransactionId);
            } finally {
                if (!hadOpenTransaction) {
                    TransactionId.manager.closeTransaction(aTransactionId);
                }
            }
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
            // TODO [PJYF Sept 4 2011] This needs to be implemented
            return new PledgedSortedSet.create().initWithQueryAndContext(query, context);
        }
    }


});

/**
 @class module:montage/data/store.StoreManager
 */
var StoreManager = exports.StoreManager = Montage.create(Store, /** @lends module:montage/data/store.StoreManager# */ {
    /**
     Description TODO
     @type {Property}
     @default {Array} new Array(10)
     */
    stores:{
        serializable:true,
        writable:false,
        distinct:true,
        value:new Array(10)
    },
    /**
     Description TODO
     @function
     @returns itself
     */
    parent:{
        get:function () {
            return this;
        }
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
     Description TODO
     @function
     @param {Property} store Store to be added.
     @returns store
     */
    addStore:{
        value:function (store) {
            if ((store !== null) && (store !== this)) {
                var index = this.stores.indexOf(store);
                if (index < 0) {
                    this.stores.push(store);
                }
            }
            return store;
        }
    },
    /**
     Description TODO
     @function
     @param {Property} store Store to be removed.
     @returns store
     */
    removeStore:{
        value:function (store) {
            if (store !== null) {
                var index = this.stores.indexOf(store);
                if (index >= 0) {
                    this.stores = this.stores.splice(index, 1);
                }
            }
            return store;
        }
    },

    /**
     Search through the binders for a blueprint that extends that prototype.
     @function
     @param {Property} prototypeName TODO
     @param {Property} moduleId TODO
     @returns The requested blueprint or null if this prototype is not managed.
     */
    blueprintForPrototype:{
        value:function (prototypeName, moduleId) {
            return BlueprintBinder.manager.blueprintForPrototype(prototypeName, moduleId);
        }
    },

    /**
     Description TODO
     @function
     @param {Object} blueprint The blueprint object.
     @param {Property} transactionId TODO
     @returns store or null
     */
    storeForBlueprint:{
        value:function (blueprint, transactionId) {
            var store, index;
            for (index = 0; typeof (store = this.stores[index]) !== "undefined"; index++) {
                if (store.canServiceBlueprint(blueprint, transactionId)) {
                    return store;
                }
            }
            return null;
        }
    },

    /**
     Search for existing store that can service this blueprint.
     @function
     @param {Property} blueprint The blueprint to test for.
     @param {Property} transactionId TODO
     @returns Promise.resolve(store) A store that can service that blueprint or null if none was found.
     */
    findStoreForBlueprint:{
        value:function (blueprint, transactionId) {
            var store = this._findStoreForBlueprint(blueprint, transactionId);
            if (store == null) {
                store = this.requireStoreForBlueprint(blueprint, transactionId);
            }
            return Promise.resolve(store);
        }
    },

    /**
     Description TODO
     @private
     */
    _findStoreForBlueprint:{
        value:function (blueprint, transactionId) {
            var store, index;
            for (index = 0; typeof (store = this.stores[index]) !== "undefined"; index++) {
                if (store.canServiceBlueprint(blueprint, transactionId)) {
                    return store;
                }
            }
            return null;
        }
    },

    /**
     Search for existing store that can service this blueprint.
     @function
     @param {Property} blueprint The blueprint to test for.
     @param {Property} transactionId TODO
     @returns Promise for the store
     */
    requireStoreForBlueprint:{
        value:function (blueprint, transactionId) {
            if ((blueprint === null) || (typeof blueprint === "undefined")) {
                return Promise.resolve(null);
            }
            //            if (typeof blueprint === "string") {
            //                var self = this;
            //                return Deserializer.create().initWithString(blueprint).deserializeObject(function (binder) {
            //                    return self._requireStoreForBlueprint(binder, transactionId);
            //                }, require);
            //            }
            return this._requireStoreForBlueprint(blueprint, transactionId);
        }
    },

    /**
     Description TODO
     @private
     */
    _requireStoreForBlueprint:{
        value:function (blueprint, transactionId) {
            if ((blueprint === null) || (typeof blueprint === "undefined")) {
                return Promise.resolve(null);
            }

            var store = null;
            var aStore, index;
            for (index = 0; typeof (aStore = this.stores[index]) !== "undefined"; index++) {
                if (aStore.canServiceBlueprint(blueprint, transactionId)) {
                    store = aStore;
                }
            }

            if (store == null) {
                var blueprintMapping = blueprint.mappingForName(transactionId.mappingFolderName);
                var binderMapping = (blueprintMapping ? blueprintMapping.parent : null);
                if (binderMapping) {
                    var results = Promise.defer();
                    require.async(binderMapping.storeModuleId,
                        function (exports) {
                            results.resolve(exports);
                        });
                    var self = this;
                    return results.promise.then(function (exports) {
                            var storePrototype = exports[binderMapping.storePrototypeName], store;
                            if ((typeof storePrototype !== "undefined") && (storePrototype !== null)) {
                                store = storePrototype.create().initWithParent(self);
                                // We need to set the connection information
                                store.connectionInfo = binderMapping.defaultConnectionInformation;
                            } else {
                                return Promise.reject("No Store found " + binderMapping.storePrototypeName);
                            }
                            return store;
                        }
                    );
                } else {
                    return Promise.resolve(store);
                }
            } else {
                return Promise.resolve(store);
            }
        }
    },

    /**
     Description TODO
     @function
     @param {object} objectId TODO
     @param {Property} transactionId TODO
     @returns store or null
     */
    storeForObjectId:{
        value:function (objectId, transactionId) {
            var store, index;
            for (index = 0; typeof (store = this.stores[index]) !== "undefined"; index++) {
                if (store.canServiceBlueprint(objectId.blueprint, transactionId)) {
                    return store;
                }
            }
            return null;
        }
    },

    /**
     Description TODO
     @function
     @param {Object} sourceObject TODO
     @param {Property} relationshipName TODO
     @param {Property} context TODO
     @param {Property} transactionId TODO
     @returns store.pledgeForSourceObjectAssociation(sourceObject, relationship, context, transactionId) or Promise.resolve(null)
     */
    pledgeForSourceObjectAssociationNamed$Implementation:{
        value:function (sourceObject, relationshipName, context, transactionId) {
            var store = null;
            var relationship = null;
            var metadata = Montage.getInfoForObject(sourceObject);
            var sourceBlueprint = this.blueprintForPrototype(metadata.objectName, metadata.moduleId);
            if (sourceBlueprint !== null) {
                relationship = sourceBlueprint.attributeForName(relationshipName);
                if ((relationship !== null) && (relationship.targetBlueprint !== null)) {
                    store = this.storeForBlueprint(relationship.targetBlueprint, transactionId);
                } else {
                    logger.error("No relationship named " + relationshipName + " for " + sourceObject);
                }
            }
            if (store !== null) {
                return store.pledgeForSourceObjectAssociation(sourceObject, relationship, context, transactionId);
            }
            return Promise.resolve(null);
        }
    },

    /**
     Description TODO
     @function
     @param {Object} objectId TODO
     @param {Property} context TODO
     @param {Property} transactionId TODO
     @returns store.pledgeForObjectId$Implementation(objectId, context, transactionId) or Promise.resolve(null)
     */
    pledgeForObjectId$Implementation:{
        value:function (objectId, context, transactionId) {
            var store = this.storeForObjectId(objectId, transactionId);
            if (store !== null) {
                return store.pledgeForObjectId$Implementation(objectId, context, transactionId);
            }
            return Promise.resolve(null);
        }
    },

    /**
     Description TODO
     @function
     @param {Object} sourceObject TODO
     @param {Property} relationship TODO
     @param {Property} context TODO
     @param {Property} transactionId TODO
     @returns Promise.resolve(null)
     */
    pledgeForSourceObjectAssociation$Implementation:{
        value:function (sourceObject, relationship, context, transactionId) {
            return Promise.resolve(null);
        }
    },

    /**
     Description TODO
     @function
     @param {Object} object TODO
     @param {Property} context TODO
     @param {Property} transactionId TODO
     @returns Promise.resolve(object)
     */
    initializeObject$Implementation:{
        value:function (object, context, transactionId) {
            if (typeof object.objectId === "undefined") {
                // TODO [PJYF June 17 2011] This will need to be revisited.
                object.objectId = TemporaryObjectId.create().init();
            }
            return Promise.resolve(object);
        }
    },

    /**
     Description TODO
     @function
     @param {Object} object TODO
     @param {Property} context TODO
     @param {Property} transactionId TODO
     @returns this.pledgeForObjectId(object.objectId, context, transactionId) or Promise.resolve(object)
     */
    repledgeObject$Implementation:{
        value:function (object, context, transactionId) {
            if (typeof object.objectId !== "undefined") {
                return this.pledgeForObjectId(object.objectId, context, transactionId);
            }
            return Promise.resolve(object);
        }

    },

    /**
     The default is a 2 step commit.<br>
     In the first step we call prepareForSave on each managed store.<br>
     The second step calls commitChanges on each store.<br>
     prepareToSave should return a rejected promise if the commit will fail.<br>
     If any store return a reject all store will receive a cancelSave message.<br>
     Any failure during the commitChanges will result in an inconsistent state of the stores.
     @function
     @param {Property} context TODO
     @param {Property} transactionId TODO
     @returns Promise.when(Promise.all(secondStep), function() or Promise.resolve(true) or Promise.when(Promise.all(secondStep), function() or return Promise.reject("Could not save the transaction: " + transactionId)
     */
    saveChangesInContext$Implementation:{
        value:function (context, transactionId) {
            // TODO [PJYF Sept 27 2011] We need to post notification to the observing context.
            // We do a 2 step commit. We need to prepare all stores for commit. If nothing raises than we can commit for real and hopefully we don't raise then.
            var aStore, index;
            var firstStep = new Array(this.stores.length);
            var secondStep = new Array(this.stores.length);
            for (index = 0; typeof (aStore = this.stores[index]) !== "undefined"; index++) {
                firstStep[index] = aStore.prepareToSaveChangesInContext$Implementation(context, transactionId);
            }
            Promise.when(Promise.all(firstStep), function () {
                for (index = 0; typeof (aStore = this.stores[index]) !== "undefined"; index++) {
                    secondStep[index] = aStore.commitChangesInContext$Implementation(context, transactionId);
                }
                return Promise.when(Promise.all(secondStep), function () {
                        return Promise.resolve(true);
                    }, function () {
                        throw Exception.create().initWithMessageTargetAndMethod('Failed to revert prepare for save transaction: ' + transactionId, this, "saveChangesInContext");
                    }
                );
            }, function () {
                for (index = 0; typeof (aStore = this.stores[index]) !== "undefined"; index++) {
                    secondStep[index] = aStore.cancelSaveChangesInContext$Implementation(context, transactionId);
                }
                return Promise.when(Promise.all(secondStep), function () {
                        return Promise.reject("Could not save the transaction: " + transactionId);
                    }, function () {
                        throw Exception.create().initWithMessageTargetAndMethod('Commit failed for transaction: ' + transactionId, this, "saveChangesInContext");
                    }
                );
            });
        }
    },

    /**
     Called on each store before a save.<br>
     Upon receiving this message the store should take steps to prepare the commit and insure it will succeed.<br>
     If the commit cannot succeed it should return a rejected promise.
     @function
     @param {Property} context TODO
     @param {Property} transactionId TODO
     @returns Promise.resolve(true)
     */
    prepareToSaveChangesInContext$Implementation:{
        value:function (context, transactionId) {
            // TODO [PJYF Sep 27 2011] This needs to be reimplemented
            return Promise.resolve(true);
        }
    },

    /**
     Called on each store before a revert a prepare to save.<br>
     Any step taken to prepare the save should be rolled back.
     @function
     @param {Property} context TODO
     @param {Property} transactionId TODO
     @returns Promise.resolve(true)
     */
    cancelSaveChangesInContext$Implementation:{
        value:function (context, transactionId) {
            // TODO [PJYF Sep 27 2011] This needs to be reimplemented
            return Promise.resolve(true);
        }
    },

    /**
     Commits the transaction.<br>
     Any failure during this step will cause the store to be left an inconsistent state.
     @function
     @param {Property} context TODO
     @param {Property} transactionId TODO
     @returns Promise.resolve(true)
     */
    commitChangesInContext$Implementation:{
        value:function (context, transactionId) {
            // TODO [PJYF Sep 27 2011] This needs to be reimplemented
            return Promise.resolve(true);
        }
    },

    /**
     Description TODO
     @function
     @param {Property} query TODO
     @param {Property} context TODO
     @param {Property} transactionId TODO
     @returns {Array} Promise.resolve([]) or store.queryInContext$Implementation(query, context, transactionId)
     */
    queryInContext$Implementation:{
        value:function (query, context, transactionId) {
            if ((query == null) || (context == null)) {
                return Promise.resolve([]);
            }
            var store = this.storeForBlueprint(query.blueprint, transactionId);
            if (store == null) {
                // TODO [PJYF Sept 27 2011] Should we raise if we don't have a store?
                return Promise.resolve([]);
            }
            return store.queryInContext$Implementation(query, context, transactionId);
        }
    }

});
