var RawDataService = require("data/service/raw-data-service").RawDataService,
    DataOperation = require("data/service/data-operation").DataOperation,
    DataService = require("data/service/data-service").DataService;
/**
 * TODO: Document
 *
 * !!!!!THIS IS A WORK IN PROGRESS
 * It's possible that this will be more than a mere marker type.
 * However, the most likely StorageDataService besides IndexedDBDataService would be Postgres.
 * The most popular Postgres implementation (https://node-postgres.com/) is different enough from IndexedDB that it's hard to envision how we
 * would generalize things like how we proceed through the lifecycle for a fetch, update, etc.
 *
 * @class
 * @extends RawDataService
 */
exports.StorageDataService = StorageDataService = RawDataService.specialize(/** @lends RawDataService.prototype */ {

    /***************************************************************************
     * Initializing
     */

    constructor: {
        value: function StorageDataService () {
            RawDataService.call(this);
        }
    },

    /***************************************************************************
     * Serialization
     */


    deserializeSelf: {
        value: function (deserializer) {
            this.super(deserializer);//TODO more to do here?
        }
    },

    serializeSelf: {
        value: function (serializer) {
            this.super(serializer);//TODO more to do here?
        }
    },

    /***************************************************************************
     * Basic Properties
     *
     * Private properties are defined where they are used, not here.
     */

    _storeNameSeparator: {
        value: '_'
    },
    _storeNameForObjectDescriptor: {
        value: function (objectDescriptor) {
            return [objectDescriptor.module.id, objectDescriptor.exportName].join(this._storeNameSeparator);
        }
    },

    /***************************************************************************
     * Saving Data
     */

    /**
     * Subclasses should override this method to delete a data object when that
     * object's raw data would be useful to perform the deletion.
     *
     * @method
     * @argument {Object} record   - An object whose properties hold the raw
     *                               data of the object to delete.
     * @argument {?} context       - An arbitrary value sent by
     *                               [deleteDataObject()]{@link RawDataService#deleteDataObject}.
     *                               By default this is the object to delete.
     * @returns {external:Promise} - A promise fulfilled when the object's data
     * has been deleted. The promise's fulfillment value is not significant and
     * will usually be `null`.
     */
    deleteRawData: {
        value: function (record, context) {
            return this._deleteRawData(record, context);
        }
    },
    _deleteRawData: {
        value: function (record, context, dataIdentifer) {
            var objectDescriptor = dataIdentifer ? dataIdentifer.objectDescriptor
                                                 : this.objectDescriptorForObject(context),
                model = objectDescriptor.model,
                primaryKey = dataIdentifier ? dataIdentifier.primaryKey
                                            : this.dataIdentifierForTypeRawData(objectDescriptor, record).primaryKey,
                recordStoreName = this._storeNameForObjectDescriptor(objectDescriptor);

            return self._deleteFromStoreForModel(primaryKey, recordStoreName, model);
        }
    },

    /**
     * Subclasses should override this method to save a data object when that
     * object's raw data would be useful to perform the save.
     *
     * @method
     * @argument {Object} record   - An object whose properties hold the raw
     *                               data of the object to save.
     * @argument {?} context       - An arbitrary value sent by
     *                               [saveDataObject()]{@link RawDataService#saveDataObject}.
     *                               By default this is the object to save.
     * @returns {external:Promise} - A promise fulfilled when the object's data
     * has been saved. The promise's fulfillment value is not significant and
     * will usually be `null`.
     */
    saveRawData: {
        value: function (record, context) {
            return this._saveRawData(record, context);
        }
    },
    _saveRawData: {
        value: function (record, context, dataIdentifer) {
            var objectDescriptor = dataIdentifer ? dataIdentifer.objectDescriptor
                                                 : this.objectDescriptorForObject(context),
                model = objectDescriptor.model,
                primaryKey = dataIdentifier ? dataIdentifier.primaryKey
                                            : this.dataIdentifierForTypeRawData(objectDescriptor, record).primaryKey,
                recordStoreName = this._storeNameForObjectDescriptor(objectDescriptor);

            return self._updateInStoreForModel(record, primaryKey, recordStoreName, model);
        }
    },

    // Subclasses must override this.
    // isPartialRecord updates an existing record, rather than replacing it.
    // isBulkOperation requires that all records belong to the same model.

    _updateInStoreForModel: {
        value: function (record, primaryKey, storeName, model, isPartialRecord, isBulkOperation) {
            return this.nullPromise;
        }
    },
    _deleteFromStoreForModel: {
        value: function (primaryKey, storeName, model, isBulkOperation) {
            return this.nullPromise;
        }
    },

    /***************************************************************************
     * Operations
     */

    _recordOperation: {
        value: function (operationsStoreName, operation, isBulkOperation) {
            var promise;

            if (operation && (!isBulkOperation || (Array.isArray(operation) && operation.length))) {
                var model,
                    primaryKey,
                    indexPropertyName = this._operationsIndexName;

                if (isBulkOperation) {
                    model = operation[0].dataType.model;

                    for (var i = 0, iOperation; (iOperation = operation[i]); i++) {
                        primaryKey = primaryKey || [];
                        primaryKey.push(iOperation[indexPropertyName]);
                    }
                }
                else {
                    model = operation.dataType.model;
                    primaryKey = operation[indexPropertyName];
                }

                promise = this._updateInStoreForModel(operation, primaryKey, operationsStoreName, model, false, isBulkOperation);
            }
            else {
                promise = this.nullPromise;
            }

            return promise;
        }
    },

    /***************************************************************************
     * Offline
     */

    _persistentOperationsStoreName: {
        value: "PersistentOperations"
    },
    _offlineOperationsStoreName: {
        value: "OfflineOperations"
    },
    _offlinePrimaryKeysStoreName: {
        value: "OfflinePrimaryKeys"
    },
    // keyPath is dependent on the property name in DataOperation
    _operationsIndexName: {
        value: "id"
    },

    _fetchOfflinePrimaryKeys: {
        value: function () {
            return this.nullPromise;
        }
    },

    _updatePrimaryKey: {
        value: function (offlinePrimaryKey, onlinePrimaryKey, objectDescriptor) {
            return this.nullPromise;
        }
    }
}, /** @lends RawDataService */ {
});
