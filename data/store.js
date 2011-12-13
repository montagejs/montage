/* <copyright>
This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
(c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
</copyright> */
/**
	@module montage/data/store
    @requires montage/core/core
    @requires montage/data/blueprint
    @requires montage/data/query
    @requires montage/data/restriction
    @requires montage/data/transactionid
    @requires montage/data/objectid
    @requires montage/data/controllistener
    @requires montage/core/serializer
    @requires montage/core/deserializer
    @requires montage/core/promise
    @requires montage/core/logger
*/
var Montage = require("montage").Montage;
var Blueprint = require("data/blueprint").Blueprint;
var BlueprintBinder = require("data/blueprint").BlueprintBinder;
var Query = require("data/query").Query;
var Restriction = require("data/restriction").Restriction;
var TransactionId = require("data/transactionid").TransactionId;
var ObjectId = require("data/objectid").ObjectId;
var TemporaryObjectId = require("data/objectid").TemporaryObjectId;
var ControlListener = require("data/controllistener").ControlListener;
var Serializer = require("core/serializer").Serializer;
var Deserializer = require("core/deserializer").Deserializer;
var Promise = require("core/promise").Promise;
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
var Store = exports.Store = Montage.create(Montage,/** @lends module:montage/data/store.Store# */ {
/**
        Description TODO
        @type {Property} Function
        @default {Array} new Array(10)
    */
    blueprintBinders: {
        serializable: true,
        writable: false,
        distinct: true,
        value: new Array(10)
    },
/**
    Description TODO
    @function
    @param {Property} binder TODO
    */
    addBlueprintBinder: {
        value: function(binder) {
            if (binder !== null) {
                var index = this.blueprintBinders.indexOf(binder);
                if (index < 0) {
                    this.blueprintBinders.push(binder);
                }
            }
        }
    },
/**
    Description TODO
    @function
    @param {Property} binder TODO
    */
    removeBlueprintBinder: {
        value: function(binder) {
            if (binder !== null) {
                var index = this.blueprintBinders.indexOf(binder);
                if (index >= 0) {
                    this.blueprintBinders.splice(index, 1);
                }
            }
        }
    },
/**
    Description TODO
    @function
    @param {Property} name TODO
    @returns null
    */
    blueprintBinderForName: {
        value: function(name) {
            var binder, index;
            for (index = 0; typeof (binder = this.blueprintBinders[index]) !== "undefined"; index++) {
                if (binder.name === name) {
                    return binder;
                }
            }
            return null;
        }
    },
/**
        Description TODO
        @type {Property}
        @default {Array} new Array(10)
    */
    restrictions: {
        serializable: true,
        writable: false,
        distinct: true,
        value: new Array(10)
    },
/**
  Description TODO
  @private
*/
    _parent: {
        serializable: true,
        enumerable: false,
        value: null
    },

 /**
    Returns the parent store.
    @function
    @returns this._parent
    */
    parent: {
        get: function() {
            return this._parent;
        }
    },


    /*
     *
     *
     */

 /**
    Returns the default store manager.<br>
    If none is defined it will create one that will then be reused for subsequent calls.
    @function
    @returns _defaultStoreManager
    */
    defaultManager: {
        get: function() {
            if (_defaultStoreManager === null) {
                _defaultStoreManager = StoreManager.create().init();
            }
            return _defaultStoreManager;
        },
        // This is used only for testing.
        set: function(storeManager) {
            _defaultStoreManager = storeManager;
        }
    },
/**
    @function
    @returns this.initWithParentAndRestrictions(null, null)
    */
    init: {
        serializable: false,
        enumerable: false,
        value: function() {
            return this.initWithParentAndRestrictions(null, null);
        }
    },
/**
    @function
    @param {Property} parent TODO
    @returns this.initWithParentAndRestrictions(parent, null)
    */
    initWithParent: {
        serializable: false,
        enumerable: false,
        value: function(parent) {
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
    initWithParentAndRestrictions: {
        serializable: false,
        value: function(parent, restrictions) {
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
    blueprintForPrototype$Implementation: {
        serializable: false,
        value: function(prototypeName, moduleId) {
            var binder, blueprint, index;
            for (index = 0; typeof (binder = this.blueprintBinders[index]) !== "undefined"; index++) {
                blueprint = binder.blueprintForPrototype(prototypeName, moduleId);
                if (blueprint !== null) {
                    return blueprint;
                }
            }
            return null;
        }
    },
/**
    Description TODO
    @function
    @param {Prototyoe} prototypeName TODO
    @param {Id} moduleId TODO
    @returns null
    */
    blueprintForPrototype: {
        value: function(prototypeName, moduleId) {
            if (this.parent !== null) {
                return this.parent.blueprintForPrototype(prototypeName, moduleId);
            }
            return null;
        }
    },

 /**
    Add a store to the cooperating objects stores.
    @function
    @param {Property} store TODO
    @returns store
    */
    addStore: {
        value: function(store) {
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
    removeStore: {
        value: function(store) {
            if (this.parent !== null) {
                return this.parent.removeStore(store);
            }
            return store;
        }
    },

/**
    Description TODO
    @function
    @param {Id} objectId TODO
    @returns {Boolean} false
    */
    ownsObject: {
        value: function(objectId) {
            if ((objectId !== null) && (typeof (objectId.blueprint) === "object")) {
                return this.blueprintBinders.indexOf(objectId.blueprint.binder) >= 0;
            }
            return false;
        }
    },

/**
    Description TODO
    @function
    @param {Property} blueprint TODO
    @returns {Boolean} false
    */
    ownsBlueprint: {
        value: function(blueprint) {
            var binder, index;
            for (index = 0; typeof (binder = this.blueprintBinders[index]) !== "undefined"; index++) {
                if (binder.blueprints.indexOf(blueprint) >= 0) {
                    return true;
                }
            }
            return false;
        }
    },

/**
    Load a binder in the store manager.<br>
    This will force the loading of the corresponding store if not already in memory.
    @function
    @param {Property} binder Either a binder object or a serialized representation of a binder object.
    @returns this.parent.requireStoreForBlueprintBinder(binder)
    */
    requireStoreForBlueprintBinder: {
        value : function(binder) {
            if (this.parent !== null) {
                return this.parent.requireStoreForBlueprintBinder(binder);
            }
        }
    },

/**
    Check if the referenced binder can be serviced by the target store.
    @function
    @param {Property} binder TODO
    @returns (binder.storeModuleId === metadata.moduleId) && (binder.storePrototypeName === metadata.objectName)
    */
    canServiceBlueprintBinder: {
        value: function(binder) {
            // TODO [PJYF May 10 2011] This unsufficient for most stores we should actually check the connection info
            var metadata = Montage.getInfoForObject(this);
            return (binder.storeModuleId === metadata.moduleId) && (binder.storePrototypeName === metadata.objectName);
        }
    },

/**
    Check if the query blueprint can be serviced by this store.
    @function
    @param {Property} query TODO
    @returns {Boolean} false
    */
    canServiceQuery: {
        value: function(query) {
            if (query != null) {
                return this.ownsBlueprint(query.blueprint);
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
    @returns this.permanentIdForObjectId$Implementation(objectId, context, aTransactionId)
    */
    permanentIdForObjectId: {
        value: function(object, context, transactionId) {
            var aTransactionId = transactionId;
            var hadOpenTransaction = false;
            try {
                if (aTransactionId == null) {
                    hadOpenTransaction = TransactionId.manager.hasCurrentTransaction();
                    if (hadOpenTransaction) {
                        aTransactionId = TransactionId.manager.currentTransaction();
                    } else {
                        aTransactionId = TransactionId.manager.startTransaction();
                    }
                }
                return this.permanentIdForObjectId$Implementation(objectId, context, aTransactionId);
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
    @returns Promise.ref(null)
    */
    permanentIdForObjectId$Implementation: {
        value: function(object, context, transactionId) {
            if (typeof object.objectId !== "undefined") {
                return Promise.ref(object.objectId);
            }
            return Promise.ref(null);
        }
    },
/**
    Description TODO
    @function
    @param {Object} objectId  TODO
    @param {Property} context TODO
    @param {Id} transactionId TODO
    @returns this.pledgeForObjectId$Implementation(objectId, context, aTransactionId)
    */
    pledgeForObjectId: {
        value: function(objectId, context, transactionId) {
            var aTransactionId = transactionId;
            var hadOpenTransaction = false;
            try {
                if (aTransactionId == null) {
                    hadOpenTransaction = TransactionId.manager.hasCurrentTransaction();
                    if (hadOpenTransaction) {
                        aTransactionId = TransactionId.manager.currentTransaction();
                    } else {
                        aTransactionId = TransactionId.manager.startTransaction();
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
    @returns Promise.ref(null)
    */
    pledgeForObjectId$Implementation: {
        value: function(objectId, context, transactionId) {
            // TODO [PJYF May 17 2011] This needs to be reimplemented
            return Promise.ref(null);
        }
    },
/**
    Description TODO
    @function
    @param {Object} sourceObject TODO
    @param {Property} relationshipName TODO
    @param {Property} context TODO
    @param {Id} transactionId TODO
    @returns this.pledgeForSourceObjectRelationshipNamed$Implementation(sourceObject, relationshipName, context, aTransactionId)
    */
    pledgeForSourceObjectRelationshipNamed: {
        value: function(sourceObject, relationshipName, context, transactionId) {
            var aTransactionId = transactionId;
            var hadOpenTransaction = false;
            try {
                if (aTransactionId == null) {
                    hadOpenTransaction = TransactionId.manager.hasCurrentTransaction();
                    if (hadOpenTransaction) {
                        aTransactionId = TransactionId.manager.currentTransaction();
                    } else {
                        aTransactionId = TransactionId.manager.startTransaction();
                    }
                }
                return this.pledgeForSourceObjectRelationshipNamed$Implementation(sourceObject, relationshipName, context, aTransactionId);
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
    @returns Promise.ref(null)
    */
    pledgeForSourceObjectRelationshipNamed$Implementation: {
        value: function(sourceObject, relationshipName, context, transactionId) {
            if (this.parent !== null) {
                return this.parent.pledgeForSourceObjectRelationshipNamed$Implementation(sourceObject, relationshipName, context, transactionId);
            }
            return Promise.ref(null);
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
    @returns this.pledgeForSourceObjectRelationship$Implementation(sourceObject, relationship, context, aTransactionId)
    */
    pledgeForSourceObjectRelationship: {
        value: function(sourceObject, relationship, context, transactionId) {
            var aTransactionId = transactionId;
            var hadOpenTransaction = false;
            try {
                if (aTransactionId == null) {
                    hadOpenTransaction = TransactionId.manager.hasCurrentTransaction();
                    if (hadOpenTransaction) {
                        aTransactionId = TransactionId.manager.currentTransaction();
                    } else {
                        aTransactionId = TransactionId.manager.startTransaction();
                    }
                }
                return this.pledgeForSourceObjectRelationship$Implementation(sourceObject, relationship, context, aTransactionId);
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
    @returns this.parent.pledgeForSourceObjectRelationship$Implementation(sourceObject, relationship, context, transactionId)
    */
    pledgeForSourceObjectRelationship$Implementation: {
        value: function(sourceObject, relationship, context, transactionId) {
            if (this.parent !== null) {
                return this.parent.pledgeForSourceObjectRelationship$Implementation(sourceObject, relationship, context, transactionId);
            }
        }
    },

/**
    Called by the framework whenever a new object is inserted, or a pledge is fired.
    @function
    @param {Object} object TODO
    @param {Property} context TODO
    @param {Id} transactionId TODO
    @returns this.initializeObject$Implementation(object, context, aTransactionId)
    */
    initializeObject: {
        value: function(object, context, transactionId) {
            var aTransactionId = transactionId;
            var hadOpenTransaction = false;
            try {
                if (aTransactionId == null) {
                    hadOpenTransaction = TransactionId.manager.hasCurrentTransaction();
                    if (hadOpenTransaction) {
                        aTransactionId = TransactionId.manager.currentTransaction();
                    } else {
                        aTransactionId = TransactionId.manager.startTransaction();
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
    @returns Promise.ref(object)
    */
    initializeObject$Implementation: {
        value: function(object, context, transactionId) {
            if (typeof object.objectId === "undefined") {
                // TODO [PJYF June 17 2011] This will need to be revisited.
                object.objectId = TemporaryObjectId.create().init();
            }
            return Promise.ref(object);
        }
    },

/**
    Description TODO
    @function
    @param {Object} target TODO
    @param {Property} context TODO
    @param {Id} transactionId TODO
    @returns this.repledgeObject$Implementation(target, context, aTransactionId)
    */
    repledgeObject: {
        value: function(target, context, transactionId) {
            var aTransactionId = transactionId;
            var hadOpenTransaction = false;
            try {
                if (aTransactionId == null) {
                    hadOpenTransaction = TransactionId.manager.hasCurrentTransaction();
                    if (hadOpenTransaction) {
                        aTransactionId = TransactionId.manager.currentTransaction();
                    } else {
                        aTransactionId = TransactionId.manager.startTransaction();
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
    @returns Promise.ref(object)
    */
    repledgeObject$Implementation: {
        value: function(object, context, transactionId) {
            if (typeof object.objectId !== "undefined") {
                return this.pledgeForObjectId(object.objectId, context, transactionId);
            }
            return Promise.ref(object);
        }

    },

/**
    Description TODO
    @function
    @param {Property} context TODO
    @param {Id} transactionId TODO
    */
    saveChangesInContext: {
        value: function(context, transactionId) {
            var aTransactionId = transactionId;
            var hadOpenTransaction = false;
            try {
                if (aTransactionId == null) {
                    hadOpenTransaction = TransactionId.manager.hasCurrentTransaction();
                    if (hadOpenTransaction) {
                        aTransactionId = TransactionId.manager.currentTransaction();
                    } else {
                        aTransactionId = TransactionId.manager.startTransaction();
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
    saveChangesInContext$Implementation: {
        value: function(context, transactionId) {
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
    @returns {Boolean} Promise.ref(true)
    */
    prepareToSaveChangesInContext$Implementation: {
        value: function(context, transactionId) {
            // TODO [PJYF Sep 27 2011] This needs to be reimplemented
            return Promise.ref(true);
        }
    },

/**
    Called on each store before a revert a prepare to save.<br>
    Any step taken to prepare the save should be rolled back.
    @function
    @param {Property} context TODO
    @param {Id} transactionId TODO
    @returns {Boolean} Promise.ref(true)
    */
    cancelSaveChangesInContext$Implementation: {
        value: function(context, transactionId) {
            // TODO [PJYF Sep 27 2011] This needs to be reimplemented
            return Promise.ref(true);
        }
    },

/**
    Commits the transaction.<br>
    Any failure during this step will cause the store to be left an inconsistent state.
    @function
    @param {Property} context TODO
    @param {Id} transactionId TODO
    @returns {Boolean} Promise.ref(true)
    */
    commitChangesInContext$Implementation: {
        value: function(context, transactionId) {
            // TODO [PJYF Sep 27 2011] This needs to be reimplemented
            return Promise.ref(true);
        }
    },

/**
    Description TODO
    @function
    @param {Property} query TODO
    @param {Property} context TODO
    @param {Id} transactionId TODO
    @returns this.queryInContext$Implementation(query, context, aTransactionId)
    */
    queryInContext: {
        value: function(query, context, transactionId) {
            var aTransactionId = transactionId;
            var hadOpenTransaction = false;
            try {
                if (aTransactionId == null) {
                    hadOpenTransaction = TransactionId.manager.hasCurrentTransaction();
                    if (hadOpenTransaction) {
                        aTransactionId = TransactionId.manager.currentTransaction();
                    } else {
                        aTransactionId = TransactionId.manager.startTransaction();
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
    Description TODO
    @function
    @param {Property} query TODO
    @param {Property} context TODO
    @param {Id} transactionId TODO
    @returns {Array} Promise.ref([])
    */
    queryInContext$Implementation: {
        value: function(query, context, transactionID) {
            // TODO [PJYF Sept 4 2011] This needs to be implemented
            return Promise.ref([]);
        }
    }


});

/**
    @class module:montage/data/store.StoreManager
*/
var StoreManager = exports.StoreManager = Montage.create(Store,/** @lends module:montage/data/store.StoreManager# */ {
/**
        Description TODO
        @type {Property}
        @default {Array} new Array(10)
    */
    stores: {
        serializable: true,
        writable: false,
        distinct: true,
        value: new Array(10)
    },
/**
    Description TODO
    @function
    @returns itself
    */
    parent: {
        get: function() {
            return this;
        }
    },
/**
    Description TODO
    @function
    @returns itself
    */
    init: {
        serializable: false,
        enumerable: false,
        value: function() {
            return this;
        }
    },
/**
    Description TODO
    @function
    @param {Property} store Store to be added.
    @returns store
    */
    addStore: {
        value: function(store) {
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
    removeStore: {
        value: function(store) {
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
    Search through the stores for a blueprint that extends that prototype.
    @function
    @param {Property} prototypeName TODO
    @param {Property} moduleId TODO
    @returns The requested blueprint or null if this prototype is not managed.
    */
    blueprintForPrototype: {
        value: function(prototypeName, moduleId) {
            var store, blueprint, index;
            for (index = 0; typeof (store = this.stores[index]) !== "undefined"; index++) {
                blueprint = store.blueprintForPrototype$Implementation(prototypeName, moduleId);
                if (blueprint !== null) {
                    return blueprint;
                }
            }
            return null;
        }
    },

/**
    Description TODO
    @function
    @param {Object} blueprint The blueprint object.
    @returns store or null
    */
    storeForBlueprint: {
        value: function(blueprint) {
            var store, index;
            for (index = 0; typeof (store = this.stores[index]) !== "undefined"; index++) {
                if (store.ownsBlueprint(blueprint)) {
                    return store;
                }
            }
            return null;
        }
    },

/**
    Search for existing store that can service this blueprint binder.
    @function
    @param {Property} binder The blueprint binder to test for.
    @returns Promise.ref(store) A store that can service that blueprint binder or null if none was found.
    */
    findStoreForBlueprintBinder: {
        value: function(binder) {
            var store = this._findStoreForBlueprintBinder(binder);
            if (store == null) {
                store = this.requireStoreForBlueprintBinder(binder);
            }
            return Promise.ref(store);
        }
    },

/**
  Description TODO
  @private
*/
    _findStoreForBlueprintBinder: {
        value: function(binder) {
            var store, index;
            for (index = 0; typeof (store = this.stores[index]) !== "undefined"; index++) {
                if (store.canServiceBlueprintBinder(binder)) {
                    store.addBlueprintBinder(binder);
                    return store;
                }
            }
            return null;
        }
    },

/**
    Search for existing store that can service this blueprint binder.
    @function
    @param {Property} binder The blueprint binder to test for.
    @returns Promise.ref(null) or Deserializer.create().initWithString(binder).deserialize(function(binder) or this._requireStoreForBlueprintBinder(binder) or this._requireStoreForBlueprintBinder(binder)
    */
    requireStoreForBlueprintBinder: {
        value: function(binder) {
            if ((binder === null) || (typeof binder === "undefined")) {
                return Promise.ref(null);
            }
            if (typeof binder === "string") {
                return Deserializer.create().initWithString(binder).deserializeObject(function(binder) {
                    return this._requireStoreForBlueprintBinder(binder);
                }, require);
            }
            return this._requireStoreForBlueprintBinder(binder);
        }
    },

/**
  Description TODO
  @private
*/
    _requireStoreForBlueprintBinder: {
        value: function(binder) {
            if ((binder === null) || (typeof binder === "undefined")) {
                return Promise.ref(null);
            }

            var store = null;
            var aStore, index;
            for (index = 0; typeof (aStore = this.stores[index]) !== "undefined"; index++) {
                if (aStore.blueprintBinders.indexOf(binder) >= 0) {
                    store = aStore;
                }
            }
            if (store == null) {
                var results = Promise.defer();
                require.async(binder.storeModuleId,
                    function(exports) {
                        results.resolve(exports);
                    });
                var self = this;
                return results.promise.then(function(exports) {
                        var storePrototype = exports[binder.storePrototypeName], store;
                        if ((typeof storePrototype !== "undefined") && (storePrototype !== null)) {
                            store = storePrototype.create().initWithParent(self);
                            store.addBlueprintBinder(binder);
                        } else {
                            return Promise.reject("No Store found " + binder.storePrototypeName);
                        }
                        return store;
                    }
                );
            } else {
                return Promise.ref(store);
            }
        }
    },

/**
    Description TODO
    @function
    @param {object} objectId TODO
    @returns store or null
    */
    storeForObjectId: {
        value: function(objectId) {
            var store, index;
            for (index = 0; typeof (store = this.stores[index]) !== "undefined"; index++) {
                if (store.ownsObject(objectId)) {
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
    @returns store.pledgeForSourceObjectRelationship(sourceObject, relationship, context, transactionId) or Promise.ref(null)
    */
    pledgeForSourceObjectRelationshipNamed$Implementation: {
        value: function(sourceObject, relationshipName, context, transactionId) {
            var store = null;
            var relationship = null;
            var metadata = Montage.getInfoForObject(sourceObject);
            var sourceBlueprint = this.blueprintForPrototype(metadata.objectName, metadata.moduleId);
            if (sourceBlueprint !== null) {
                relationship = sourceBlueprint.attributeForName(relationshipName);
                if ((relationship !== null) && (relationship.targetBlueprint !== null)) {
                    store = this.storeForBlueprint(relationship.targetBlueprint);
                } else {
                    logger.error("No relationship named " + relationshipName + " for " + sourceObject);
                }
            }
            if (store !== null) {
                return store.pledgeForSourceObjectRelationship(sourceObject, relationship, context, transactionId);
            }
            return Promise.ref(null);
        }
    },

/**
    Description TODO
    @function
    @param {Object} objectId TODO
    @param {Property} context TODO
    @param {Property} transactionId TODO
    @returns store.pledgeForObjectId$Implementation(objectId, context, transactionId) or Promise.ref(null)
    */
    pledgeForObjectId$Implementation: {
        value: function(objectId, context, transactionId) {
            var store = this.storeForObjectId(objectId);
            if (store !== null) {
                return store.pledgeForObjectId$Implementation(objectId, context, transactionId);
            }
            return Promise.ref(null);
        }
    },

/**
    Description TODO
    @function
    @param {Object} sourceObject TODO
    @param {Property} relationship TODO
    @param {Property} context TODO
    @param {Property} transactionId TODO
    @returns Promise.ref(null)
    */
    pledgeForSourceObjectRelationship$Implementation: {
        value: function(sourceObject, relationship, context, transactionId) {
            return Promise.ref(null);
        }
    },

/**
    Description TODO
    @function
    @param {Object} object TODO
    @param {Property} context TODO
    @param {Property} transactionId TODO
    @returns Promise.ref(object)
    */
    initializeObject$Implementation: {
        value: function(object, context, transactionId) {
            if (typeof object.objectId === "undefined") {
                // TODO [PJYF June 17 2011] This will need to be revisited.
                object.objectId = TemporaryObjectId.create().init();
            }
            return Promise.ref(object);
        }
    },

/**
    Description TODO
    @function
    @param {Object} object TODO
    @param {Property} context TODO
    @param {Property} transactionId TODO
    @returns this.pledgeForObjectId(object.objectId, context, transactionId) or Promise.ref(object)
    */
    repledgeObject$Implementation: {
        value: function(object, context, transactionId) {
            if (typeof object.objectId !== "undefined") {
                return this.pledgeForObjectId(object.objectId, context, transactionId);
            }
            return Promise.ref(object);
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
    @returns Promise.when(Promise.all(secondStep), function() or Promise.ref(true) or Promise.when(Promise.all(secondStep), function() or return Promise.reject("Could not save the transaction: " + transactionId)
    */
    saveChangesInContext$Implementation: {
        value: function(context, transactionId) {
            // TODO [PJYF Sept 27 2011] We need to post notification to the observing context.
            // We do a 2 step commit. We need to prepare all stores for commit. If nothing raises than we can commit for real and hopefully we don't raise then.
            var aStore, index;
            var firstStep = new Array(this.stores.length);
            var secondStep = new Array(this.stores.length);
            for (index = 0; typeof (aStore = this.stores[index]) !== "undefined"; index++) {
                firstStep[index] = aStore.prepareToSaveChangesInContext$Implementation(context, transactionId);
            }
            Promise.when(Promise.all(firstStep), function() {
                for (index = 0; typeof (aStore = this.stores[index]) !== "undefined"; index++) {
                    secondStep[index] = aStore.commitChangesInContext$Implementation(context, transactionId);
                }
                return Promise.when(Promise.all(secondStep), function() {
                        return Promise.ref(true);
                    }, function() {
                        throw Exception.create().initWithMessageTargetAndMethod('Failed to revert prepare for save transaction: ' + transactionId, this, "saveChangesInContext");
                    }
                );
            }, function() {
                for (index = 0; typeof (aStore = this.stores[index]) !== "undefined"; index++) {
                    secondStep[index] = aStore.cancelSaveChangesInContext$Implementation(context, transactionId);
                }
                return Promise.when(Promise.all(secondStep), function() {
                        return Promise.reject("Could not save the transaction: " + transactionId);
                    }, function() {
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
    @returns Promise.ref(true)
    */
    prepareToSaveChangesInContext$Implementation: {
        value: function(context, transactionId) {
            // TODO [PJYF Sep 27 2011] This needs to be reimplemented
            return Promise.ref(true);
        }
    },

/**
    Called on each store before a revert a prepare to save.<br>
    Any step taken to prepare the save should be rolled back.
    @function
    @param {Property} context TODO
    @param {Property} transactionId TODO
    @returns Promise.ref(true)
    */
    cancelSaveChangesInContext$Implementation: {
        value: function(context, transactionId) {
            // TODO [PJYF Sep 27 2011] This needs to be reimplemented
            return Promise.ref(true);
        }
    },

/**
    Commits the transaction.<br>
    Any failure during this step will cause the store to be left an inconsistent state.
    @function
    @param {Property} context TODO
    @param {Property} transactionId TODO
    @returns Promise.ref(true)
    */
    commitChangesInContext$Implementation: {
        value: function(context, transactionId) {
            // TODO [PJYF Sep 27 2011] This needs to be reimplemented
            return Promise.ref(true);
        }
    },

/**
    Description TODO
    @function
    @param {Property} query TODO
    @param {Property} context TODO
    @param {Property} transactionId TODO
    @returns {Array} Promise.ref([]) or store.queryInContext$Implementation(query, context, transactionId)
    */
    queryInContext$Implementation: {
        value: function(query, context, transactionId) {
            if ((query == null) || (context == null)) {
                return Promise.ref([]);
            }
            var store = this.storeForBlueprint(query.blueprint);
            if (store == null) {
                // TODO [PJYF Sept 27 2011] Should we raise if we don't have a store?
                return Promise.ref([]);
            }
            return store.queryInContext$Implementation(query, context, transactionId);
        }
    }

});
