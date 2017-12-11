var RawDataService = require("data/service/raw-data-service").RawDataService,
    StorageDataService = require("data/service/storage-data-service").StorageDataService,
    IndexedDBDataService = require("data/service/indexed-d-b-data-service").IndexedDBDataService,//RDW FIXME maybe clunky to have a default, remove when we instantiate from a moduleId
    DataStream = require("data/service/data-stream").DataStream,
    DataOperation = require("data/service/data-operation").DataOperation,
    Promise = require("core/promise").Promise,
    uuid = require("core/uuid"),
    DataOrdering = require("data/model/data-ordering").DataOrdering,
    DESCENDING = DataOrdering.DESCENDING,
    evaluate = require("frb/evaluate"),
    Map = require("collections/map"),
    WeakMap = require("collections/weak-map");

/**
 * TODO: Document
 *
 * !!!!!THIS IS A WORK IN PROGRESS generalizing OfflineService, so code started from that
 * and is evolving from there.
 *
 * @class
 * @extends RawDataService
 */
exports.PersistentDataService = PersistentDataService = RawDataService.specialize(/** @lends PersistentDataService.prototype */ {

    /***************************************************************************
     * Initializing
     */

    constructor: {
        value: function PersistentDataService() {
            RawDataService.call(this);
            this.isUniquing = true;
        }
    },

    /***************************************************************************
     * Serialization
     */

    deserializeSelf: {
        value: function (deserializer) {
            this.super(deserializer);

            var value = deserializer.getProperty("persistingObjectDescriptorNames");
            if (value) {
                this.persistingObjectDescriptorNames = value;
            }
        }
    },

    serializeSelf: {
        value: function (serializer) {
            this.super(serializer);

            if (this.persistingObjectDescriptorNames) {
                serializer.setProperty("persistingObjectDescriptorNames", this.persistingObjectDescriptorNames);
            }
        }
    },

    /***************************************************************************
     * Basic Properties
     *
     * Private properties are defined where they are used, not here.
     */

    /**
     * returns the StorageDataService used by the service to store operations (offline or persistent).
     *
     * @returns {StorageDataService}
     */

    _operations : {
        value: undefined
    },
    operations : {
        get: function () {
            var currentOperations = currentOperations || (this._operations = new IndexedDBDataService());//RDW FIXME maybe clunky to have a default, remove when we instantiate from a moduleId
            return currentOperations;
        },
        set: function (storageDataService) {
            if (!storageDataService) {
                this._operations = undefined;
            }
            else if (storageDataService instanceof StorageDataService) {
                this._operations = storageDataService;
            }
            else {
                throw "bogus operations service";
            }
        }
    },

    /**
     * returns the StorageDataService used by the service to store model data.
     *
     * @returns {StorageDataService}
     */

    _storage : {
        value: undefined
    },
    storage : {
        get: function () {
            var currentStorage = currentStorage || (this._storage = new IndexedDBDataService());//RDW FIXME maybe clunky to have a default, remove when we instantiate from a moduleId
            return currentStorage;
        },
        set: function (storageDataService) {
            if (!storageDataService) {
                this._storage = undefined;
            }
            else if (storageDataService instanceof StorageDataService) {
                this._storage = storageDataService;
            }
            else {
                throw "bogus storage service";
            }
        }
    },

    /**
     * returns the set of all ObjectDescriptors names that should persist.
     *
     * @argument {ObjectDescriptor} objectDescriptor
     * @returns {Set}
     */
    _persistingObjectDescriptorNames: {
        value: undefined
    },
    persistingObjectDescriptorNames: {
        set: function (value) {
            this._persistingObjectDescriptorNames = new Set(value);//RDW where do we want to set this from? anything else to do here? how much do we depend on this (opt-in or opt-out)?
        },
        get: function () {
            return this._persistingObjectDescriptorNames;
        }
    },

    /**
     * returns true or false depending on whether PersistentDataService has been instructed
     * to persist the objectDescriptor passed as an argument.
     *
     * @argument {ObjectDescriptor} objectDescriptor
     * @returns {Boolean}
     */
    persistsObjectDescriptor: {//RDW isn't there some other path if isOffline? (since PersistentDataService is intended to replace OfflineService)???
        value: function (objectDescriptor) {
            return objectDescriptor && this._persistingObjectDescriptorNames && this._persistingObjectDescriptorNames.has(objectDescriptor.name);
        }
    },
    persistsObject: {
        value: function (object) {
            return this.persistsObjectDescriptor(this.objectDescriptorForObject(object));
        }
    },

    /**
     * returns the list of all property descriptors that should persist for the
     * objectDescriptor passed as an argument. By default, return all propertyDescriptors.
     * This can be customized and configured when a PersistentDataService is instantiated.
     *
     * @argument {ObjectDescriptor} objectDescriptor
     * @returns {Array.<String>}
     */
    persistentPropertyDescriptors: {
        value: function (objectDescriptor) {
            return objectDescriptor.propertyDescriptors;
        }
    },

    /***************************************************************************
     * Service Hierarchy
     */

    /**
     * Get the first child service that can handle data of the specified type,
     * or `null` if no such child service exists.
     *
     * Overrides super to set itself as the delegate
     *
     * @private
     * @method
     * @argument {DataObjectDescriptor} type
     * @returns {Set.<DataService,number>}
     */
    childServiceForType: {
        value: function (type) {
            var service = this.super(type);

            if (service &&
                service !== this &&
                service !== this.storage &&
                service !== this.operations &&
                this.persistsObjectDescriptor(type)) {
                service.delegate = this;
            }

            return service;
        }
    },

    /***************************************************************************
     * Mapping Raw Data
     */

    mapSelectorToRawDataQuery: {
        value: function (query) {
            return this.storage.mapSelectorToRawDataQuery(query);
        }
    },

    mapRawDataToObject: {
        value: function (rawData, object, context) {
            return this.storage.mapRawDataToObject(rawData, object, context);
        }
    },

    mapObjectToRawData: {
        value: function (object, record, context) {
            return this.storage.mapObjectToRawData(object, record, context);
        }
    },

    /***************************************************************************
     * Fetching Data
     */

    fetchData: {
        value: function (queryOrType, optionalCriteria, optionalStream) {
            // We let the super logic apply, which will attempt to obtain data through any existing child service
            var dataStream = this.super(queryOrType, optionalCriteria, optionalStream),
                promise = dataStream,
                self = this;

            if (this.persistsObjectDescriptor(dataStream.query.type)) {
                promise = promise.then(function (data) {
                    var rawDataStream = new DataStream();

                    rawDataStream.type = dataStream.type;
                    rawDataStream.query = dataStream.query;

                    self._registerDataStreamForRawDataStream(dataStream, rawDataStream);

                    // Update the persisted data.
                    self.fetchRawData(rawDataStream);

                    return rawDataStream;
                });
            }

            return promise;
        }
    },

    _dataStreamObjectsByPrimaryKey: {
        value: new WeakMap()
    },
    objectsByPrimaryKeyForDataStream: {//RDW how does this get cleaned up when one is done with the DataStream in question?
        value: function (dataStream) {
            var value = this._dataStreamObjectsByPrimaryKey.get(dataStream);

            if (!value) {
                value = new Map();
                this._dataStreamObjectsByPrimaryKey.set(dataStream, value);
            }

            return value;
        }
    },

    _dataStreamByRawDataStream: {
        value: new WeakMap()
    },
    _dataStreamForRawDataStream: {//RDW how does this get cleaned up when one is done with the DataStream in question?
        value: function (rawDataStream) {
            return this._dataStreamByRawDataStream.get(rawDataStream);
        }
    },
    _registerDataStreamForRawDataStream: {
        value: function (dataStream, rawDataStream) {
            return this._dataStreamByRawDataStream.set(rawDataStream, dataStream);
        }
    },

    fetchRawData: {
        value: function (stream) {
            var self = this;

            this.storage.fetchRawData(stream).then(function (data) {
                if (data) {
                    self.addRawData(stream, data);
                    self.rawDataDone(stream);
                }
            });
        }
    },

    _updateOperationsByDataStream: {
        value: new Map()
    },
    //ToDo:
    //The dataStream will need to be removed from this structure when the cycle is completed.
    updateOperationsForDataStream: {//RDW how does this get cleaned up when one is done with the DataStream in question?
        value: function (dataStream) {
            var operations = this._updateOperationsByDataStream.get(dataStream);

            if (!operations) {
                this._updateOperationsByDataStream.set(dataStream, (operations = []));
            }

            return operations;
        }
    },

    _objectsToUpdateByDataStream: {
        value: new Map()
    },
    objectsToUpdateForDataStream: {//RDW how does this get cleaned up when one is done with the DataStream in question?
        value: function (dataStream) {
            var objects = this._objectsToUpdateByDataStream.get(dataStream);

            if (!objects) {
                this._objectsToUpdateByDataStream.set(dataStream, (objects = []));
            }

            return objects;
        }
    },

    _objectsToDeleteByDataStream: {
        value: new Map()
    },
    objectsToDeleteForDataStream: {//RDW how does this get cleaned up when one is done with the DataStream in question?
        value: function (dataStream) {
            var objects = this._objectsToDeleteByDataStream.get(dataStream);

            if (!objects) {
                this._objectsToDeleteByDataStream.set(dataStream, (objects = []));
            }

            return objects;
        }
    },

    /**
     * Delegate method allowing PersistentDataService to do the ground work
     * for other services as objects are created, avoiding looping again later.
     *
     * @method
     * @argument {DataService} dataService
     * @argument {DataStream} dataStream
     * @argument {Object} rawData
     * @argument {Object} object
     * @returns {void}
     */
    rawDataServiceDidAddOneRawData: {//RDW FIXME not going to use writeOfflineData, seemingly
        value: function (dataService, dataStream, rawData, object) {
            if (this.persistsObject(object)) {
                var existingDataIdentifier = this.dataIdentifierForObject(object),
                    type = existingDataIdentifier || dataStream.query.type,
                    dataIdentifier = existingDataIdentifier || this.dataIdentifierForTypeRawData(type, rawData);

                if (dataIdentifier) {
                    var dataStreamPrimaryKeyMap = this.objectsByPrimaryKeyForDataStream(dataStream),
                        dataOperation = DataOperation.lastRead(dataIdentifier.primaryKey, dataStream.query.type, rawData);

                    // Register the object by primarykey, which we'll need later
                    dataStreamPrimaryKeyMap.set(dataIdentifier.primaryKey, object);

                    // The operation should be created atomically in the method that
                    // will actually save the data itself.
                    // Create the record to track the online Last Updated date
                    // We previously had the exact same time cached for all objects
                    // Need to keep an eye out for possible consequences due to that change.

                    this.updateOperationsForDataStream(dataStream).push(dataOperation);
                    this.objectsToUpdateForDataStream(dataStream).push(object);//RDW FIXME HERE need to gather primaryKeys
                }
                else {
                    if (!type) {
                        console.error("missing type from query in rawDataServiceDidAddOneRawData");
                    }

                    if (!rawData) {
                        console.error("missing rawData in rawDataServiceDidAddOneRawData");
                    }

                    if (type && rawData) {
                        console.error("missing mapping for '" + type.typeName + "' in rawDataServiceDidAddOneRawData");
                    }
                }
            }
        }
    },

    // This gets called in the home-stretch invocation of this.fetchRawData

    addOneRawData: {
        value: function (stream, rawData, context, _type) {
            var dataStream = this._dataStreamForRawDataStream(stream),
                object = null;

            // If results were returned by childServices but that primaryKey isn't found,
            // it means that this object doesn't match stream's query criteria as it used to.
            // We were removing it from storage in general, which could cause that object to
            // disapear for other queries that it still matches.
            // It should be done eventually for a per query cache.

            if (dataStream.data && dataStream.length > 0) {
                var dataStreamPrimaryKeyMap = this.objectsByPrimaryKeyForDataStream(dataStream),
                    dataIdentifier = this.dataIdentifierForTypeRawData(stream.query.type, rawData),
                    primaryKey = dataIdentifier.primaryKey,
                    dataStreamValue = dataStreamPrimaryKeyMap.get(primaryKey);

                if (!dataStreamValue) {
                    this.objectsToDeleteForDataStream(dataStream).push(primaryKey);//RDW FIXME HERE need to gather primaryKeys
                }
            }
            else {
                // If no data was returned, we go on and create the object.
                //RDW The presumption here is that the service in question is offline???

                object = this.super(stream, rawData, context, _type);
            }



            //Do we have



            return object;
        }
    },

    rawDataDone: {
        value: function (stream, context) {
            var self = this;

            return this.super(stream, context).then(function () {
                var dataStream = self._dataStreamForRawDataStream(stream),
                    updateOperations = self.updateOperationsForDataStream(dataStream),
                    updates = self.objectsToUpdateForDataStream(dataStream),
                    deletes = self.objectsToDeleteForDataStream(dataStream),
                    query = stream.query;
//RDW FIXME HERE need to produce primary keys
                return self._synchronizeOfflineStateForQuery(query, updates, updateOperations, deletes);
            })
        }
    },

    //readOfflineOperation//RDW FIXME not sure if there's stuff to do here

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
            this._deleteRawData(record, context);
        }
    },
    _deleteRawData: {
        value: function (record, context, dataIdentifier) {
            var objectDescriptor = dataIdentifier ? dataIdentifier.objectDescriptor
                                                  : this.objectDescriptorForObject(context),
                model = objectDescriptor.model,
                dataIdentifier = dataIdentifier || this.dataIdentifierForTypeRawData(objectDescriptor, record),
                primaryKey = dataIdentifier.primaryKey,
                operationStoreName = this.operations._offlineOperationsStoreName,
                operation = DataOperation.lastDeleted(primaryKey, objectDescriptor, record, context),
                self = this;

            return self.operations._recordOperation(operationStoreName, operation).then(function () {
                return self.storage._deleteRawData(record, context, dataIdentifier);
            });
        }
    },

    /**
     * Delegate method allowing PersistentDataService to do the ground work
     * as objects are deleted.
     *
     * @method
     * @argument {DataService} dataService
     * @argument {Object} rawData
     * @argument {Object} object
     * @returns {void}
     */
    rawDataServiceWillDeleteRawData: {
        value: function (dataService, rawData, object) {
            var dataIdentifier = this.dataIdentifierForObject(object),
                objectDescriptor = dataIdentifier.objectDescriptor,
                self = this;

            self._deleteOfflinePrimaryKeyDependenciesForData(rawData, objectDescriptor).then(function () {
                self._deleteOfflinePrimaryKeys(dataIdentifier.primaryKey, objectDescriptor).then(function () {
                    self._deleteRawData(rawData, object, dataIdentifier);
                });
            });
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
            this._saveRawData(record, context);
        }
    },
    _saveRawData: {
        value: function (record, context, dataIdentifier) {
            var objectDescriptor = dataIdentifier ? dataIdentifier.objectDescriptor
                                                  : this.objectDescriptorForObject(context),
                model = objectDescriptor.model,
                dataIdentifier = dataIdentifier || this.dataIdentifierForTypeRawData(objectDescriptor, record),
                primaryKey = dataIdentifier.primaryKey,
                operationStoreName = this.operations._offlineOperationsStoreName,
                operation = DataOperation.lastUpdated(primaryKey, objectDescriptor, record, context),//RDW FIXME should be lastCreated, if we haven't seen this before. but we might have to do a fetch to even know?
                self = this;

            return self.operations._recordOperation(operationStoreName, operation).then(function () {
                return self.storage._saveRawData(record, context, dataIdentifier);
            });
        }
    },

    /**
     * Delegate method allowing PersistentDataService to do the ground work
     * as objects are saved (created/updated).
     *
     * @method
     * @argument {DataService} dataService
     * @argument {Object} rawData
     * @argument {Object} object
     * @returns {void}
     */
    rawDataServiceWillSaveRawData: {//RDW FIXME if the primary key was updated, will need to fix
        value: function (dataService, rawData, object) {
            var dataIdentifier = this.dataIdentifierForObject(object),
                objectDescriptor = dataIdentifier.objectDescriptor,
                self = this;

            self._registerOfflinePrimaryKeyDependenciesForData(rawData, objectDescriptor).then(function () {//RDW FIXME we may need to clean up dependencies that have changed
                self._saveRawData(rawData, object, dataIdentifier);
            });
        }
    },

    /**
     * Save new data passed in objects of type
     *
     * @method
     * @argument {Array} objects   - objects whose data should be updated.
     * @argument {String} type   - type of objects
     * @argument {Object} context   - an object that will be associated with operations
     * @returns {external:Promise} - A promise fulfilled when all of objects has been saved.
     */
    createData: {
        value: function (objects, type, context) {
            var promise;

            if (objects && Array.isArray(objects) && objects.length) {
                var model = type.model,
                    storeName = this.storage._storeNameForObjectDescriptor(type),
                    operations = [],
                    operationTime = Date.now(),
                    dataIdentifier,
                    primaryKey,
                    primaryKeys = [],
                    primaryKeysToWrite,
                    self = this;

                for (var i = 0, iRawData; (iRawData = objects[i]); i++) {
                    dataIdentifier = this.dataIdentifierForTypeRawData(type, iRawData);
                    primaryKey = dataIdentifier ? dataIdentifier.primaryKey
                                                : '';

                    if (typeof primaryKey === 'undefined' ||
                        primaryKey === '') {
                        primaryKey = dataIdentifier.primaryKey = uuid.generate();
                        primaryKeysToWrite = primaryKeysToWrite || [];//RDW FIXME store separately, in case we only _writeOfflinePrimaryKeys if dataIdentifier didn't already exist and have one?
                        primaryKeysToWrite.push(primaryKey);
                    }

                    operations.push(DataOperation.lastCreated(primaryKey, type, iRawData, context, operationTime));
                    primaryKeys.push(primaryKey);
                }

                promise = self.operations._recordOperation(self.operations._offlineOperationsStoreName, operations, true).then(function () {
                    return self._writeOfflinePrimaryKeys(primaryKeysToWrite, type).then(function () {
                        return self._registerOfflinePrimaryKeyDependenciesForData(objects, type).then(function () {
                            return self._updateInStoreForModel(objects, primaryKeys, storeName, model, true);
                        });
                    });
                });
            }
            else {
                promise = this.nullPromise;
            }

            return promise;
        }
    },

    /**
     * Save updates made to an array of existing data objects.
     *
     * @method
     * @argument {Array} objects   - objects whose data should be updated.
     * @argument {String} type   - type of objects
     * @argument {Object} context   - an object that will be associated with operations
     * @returns {external:Promise} - A promise fulfilled when all of objects has been saved.
     */
    updateData: {
        value: function (objects, type, context) {
            var promise;

            if (objects && Array.isArray(objects) && objects.length) {
                var model = type.model,
                    storeName = this.storage._storeNameForObjectDescriptor(type),
                    operations = [],
                    operationTime = Date.now(),
                    primaryKey,
                    primaryKeys = [],
                    self = this;

                for (var i = 0, iRawData; (iRawData = objects[i]); i++) {
                    primaryKey = this.dataIdentifierForTypeRawData(type, iRawData).primaryKey;
                    operations.push(DataOperation.lastUpdated(primaryKey, type, iRawData, context, operationTime));
                    primaryKeys.push(primaryKey);
                }

                promise = self.operations._recordOperation(self.operations._offlineOperationsStoreName, operations, true).then(function () {
                    return self._registerOfflinePrimaryKeyDependenciesForData(objects, type).then(function () {
                        return self._updateInStoreForModel(objects, primaryKeys, storeName, model, true);
                    });
                });
            }
            else {
                promise = this.nullPromise;
            }

            return promise;
        }
    },

    /**
     * Delete data passed in array.
     *
     * @method
     * @argument {Object} objects   - objects whose data should be deleted.
     * @argument {String} type   - type of objects
     * @argument {Object} context   - an object that will be associated with operations
     * @returns {external:Promise} - A promise fulfilled when all of objects has been deleted.
     */
    deleteData: {
        value: function (objects, type, context) {
            var promise;

            if (objects && Array.isArray(objects) && objects.length) {
                var model = type.model,
                    storeName = this.storage._storeNameForObjectDescriptor(type),
                    operations = [],
                    operationTime = Date.now(),
                    primaryKey,
                    primaryKeys = [],
                    self = this;

                for (var i = 0, iRawData; (iRawData = objects[i]); i++) {
                    primaryKey = this.dataIdentifierForTypeRawData(type, iRawData).primaryKey;
                    operations.push(DataOperation.lastDeleted(primaryKey, type, iRawData, context, operationTime));
                    primaryKeys.push(primaryKey);
                }

                promise = self.operations._recordOperation(self.operations._offlineOperationsStoreName, operations, true).then(function () {
                    return self._deleteOfflinePrimaryKeyDependenciesForData(objects, type).then(function () {
                        return self._deleteOfflinePrimaryKeys(primaryKeys, type).then(function () {
                            return self.storage._deleteFromStoreForModel(primaryKeys, storeName, model, true);
                        });
                    });
                });
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

    readOfflineOperations: {
        value: function () {
            return this.operations.readOfflineOperations();//RDW should this call super.readOfflineOperations() and combine the results?
        }
    },

    _synchronizeOfflineStateForQuery: {
        value: function (query, rawDataArray, rawDataArrayPrimaryKeys, updateOperationArray, offlineObjectsToClear) {
            var self = this,
                objectDescriptor = query.type,
                model = objectDescriptor.model,
                storeName = self.storage._storeNameForObjectDescriptor(objectDescriptor);

            // Transaction:
            //     Objects to put:
            //         rawDataArray into offline storage
            //         updateOperationArray into offline operations?
            //     Objects to delete:
            //         offlineObjectsToClear in table and operationTable
//RDW FIXME need to have gathered primary keys (either from operations.dataID, or pass them in)
            return Promise.all([
                self.storage._updateInStoreForModel(rawDataArray, rawDataArrayPrimaryKeys, storeName, model, false, true),
                self.operations._recordOperation(self.operations._offlineOperationsStoreName, updateOperationArray, true),
                self.storage._deleteFromStoreForModel(offlineObjectsToClear, storeName, model, true),
                self.storage._deleteFromStoreForModel(offlineObjectsToClear, self.operations._offlineOperationsStoreName, model, true)
            ]);
        }
    },

    deleteOfflineOperations: {
        value: function (operations) {
            return this.operations.deleteOfflineOperations(operations);
        }
    },

    /***************************************************************************
     * Offline primary key support
     */
    /*   PrimaryKeys has offlinePrimaryKey and a property "dependencies" that contains an array of
        {
            offlinePrimaryKey:"uuid-1111-4444-5555",
            dependencies:[
                {
                    serviceName: "AServiceName",
                    storeName:"BlahTable",
                    primaryKey:"uuid-1233-3455",
                    foreignKeyName:"foo_ID"
                }
            ]
        }

        This tells us that the primaryKey "uuid-1111-4444-5555" appears as a foreignKey named "foo_ID" of the record in "BlahTable" that has the primaryKey value of "uuid-1233-3455"
    */

    _offlinePrimaryKeyRecordPrimaryKeyPropertyName: {
        value: "offlinePrimaryKey"
    },
    _offlinePrimaryKeyRecordDependenciesPropertyName: {
        value: "dependencies"
    },
    _offlinePrimaryKeyDependencyRecordStoreNamePropertyName: {
        value: "storeName"
    },
    _offlinePrimaryKeyDependencyRecordPrimaryKeyPropertyName: {
        value: "primaryKey"
    },
    _offlinePrimaryKeyDependencyRecordForeignKeyNamePropertyName: {
        value: "foreignKeyName"
    },

    _offlinePrimaryKeyToOnlinePrimaryKey: {
        value: new Map()
    },
    onlinePrimaryKeyForOfflinePrimaryKey: {
        value: function (offlinePrimaryKey) {
            return this._offlinePrimaryKeyToOnlinePrimaryKey.get(offlinePrimaryKey);
        }
    },

    /**
     * caches the primary keys only
     */

    _offlinePrimaryKeys: {
        value: null
    },
    _offlinePrimaryKeysPromise: {
        value: null
    },

    _fetchOfflinePrimaryKeys: {
        value: function () {
            if (!this._offlinePrimaryKeys) {
                var self = this,
                    _offlinePrimaryKeys = this._offlinePrimaryKeys = new Map();

                return self.storage._fetchOfflinePrimaryKeys().then(function (offlinePrimaryKeys) {
                    for (var i = 0, item; (item = offlinePrimaryKeys[i]); i++) {
                        var offlinePrimaryKey = item[self._offlinePrimaryKeyRecordPrimaryKeyPropertyName];

                        if (_offlinePrimaryKeys.has(offlinePrimaryKey)) {
                            console.error("fetched duplicate offline primary key", offlinePrimaryKey);
                        }

                        _offlinePrimaryKeys.set(offlinePrimaryKey, item);
                    }

                    return _offlinePrimaryKeys;
                });
            }
            else {
                if (!this._offlinePrimaryKeysPromise) {
                    this._offlinePrimaryKeysPromise = Promise.resolve(this._offlinePrimaryKeys);
                }

                return this._offlinePrimaryKeysPromise;
            }
        }
    },

    _newPrimaryKeyRecordForPrimaryKey: {
        value: function (primaryKey) {
            if (!primaryKey) {
                throw "primary key undefined internally";
            }

            var newRecord = {};

            newRecord[this._offlinePrimaryKeyRecordPrimaryKeyPropertyName] = primaryKey;

            return newRecord;
        }
    },
    _newPrimaryKeyRecordsForPrimaryKeys: {
        value: function (primaryKeys) {
            var primaryKeyRecords = undefined;

            if (primaryKeys) {
                if (Array.isArray(primaryKeys)) {
                    for (var i = 0, iPrimaryKey; (iPrimaryKey = primaryKeys[i]); i++) {
                        primaryKeyRecords = primaryKeyRecords || [];
                        primaryKeyRecords.push(this._newPrimaryKeyRecordForPrimaryKey(iPrimaryKey));
                    }
                }
                else {
                    primaryKeyRecords = this._newPrimaryKeyRecordForPrimaryKey(primaryKeys);
                }
            }

            return primaryKeyRecords;
        }
    },

    _writeOfflinePrimaryKeys: {
        value: function (primaryKeys, objectDescriptor) {
            var promise,
                primaryKeyRecords = _newPrimaryKeyRecordsForPrimaryKeys(primaryKeys);

            if (primaryKeyRecords) {
                var self = this;

                promise = self.storage._updateInStoreForModel(primaryKeyRecords,
                                                              primaryKeys,
                                                              self.storage._offlinePrimaryKeysStoreName,
                                                              objectDescriptor.model,
                                                              false,
                                                              Array.isArray(primaryKeys)).then(function () {
                    return self._fetchOfflinePrimaryKeys().then(function (offlinePrimaryKeys) {
                        for (i = 0, iPrimaryKey; (iPrimaryKey = primaryKeys[i]); i++) {
                            if (offlinePrimaryKeys.has(iPrimaryKey)) {
                                throw "duplicate of new primary key: " + iPrimaryKey;
                            }

                            offlinePrimaryKeys.add(iPrimaryKey, primaryKeysRecords[i]);
                        }

                        return null;
                    });
                });
            }
            else {
                promise = this.nullPromise;
            }

            return promise;
        }
    },

    /*
     * Returns a promise resolved when onlinePrimaryKey has replaced offlinePrimaryKey
     * both in memory and in storage
     * @type {Promise}
     */

    replaceOfflinePrimaryKey: {
        value: function (offlinePrimaryKey, onlinePrimaryKey, objectDescriptor, service) {//RDW FIXME this used to be the service that embedded on offlineService, which we don't do anymore
            var self = this;

            // Update the central table used by DataService's performOfflineOperations
            // to update operations as they are processed.

            this._offlinePrimaryKeyToOnlinePrimaryKey.set(offlinePrimaryKey, onlinePrimaryKey);

            // Update the stored primaryKey.

            return self.storage._updatePrimaryKey(offlinePrimaryKey, onlinePrimaryKey, objectDescriptor).then(function () {
                // Now we need to update stored data as well and we need the cache populated from storage before we can do this:
                // We shouldn't just rely on the fact that the app will immediately refetch everything and things would be broken
                // if somehow the App would get offline again before a full refetch is done across every kind of data.

                return self._fetchOfflinePrimaryKeys().then(function (offlinePrimaryKeys) {
                    if (offlinePrimaryKeys.has(offlinePrimaryKey)) {
                        var aPrimaryKeyRecord = offlinePrimaryKeys.get(offlinePrimaryKey),
                            dependencies = aPrimaryKeyRecord[self._offlinePrimaryKeyRecordDependenciesPropertyName],
                            promises;

                        if (dependencies) {
                            for (var i = 0, iDependency; (iDependency = dependencies[i]); i++) {
                                var iUpdateRecord = {};

                                iUpdateRecord[iDependency[self._offlinePrimaryKeyDependencyRecordForeignKeyNamePropertyName]] = onlinePrimaryKey;

                                // Using updateData creates offlineOperations we don't want here, hence direct use of storage.
                                // This is internal to PersistentDataService and descendants.

                                promises = promises || [];
                                promises.push(self.storage._updateInStoreForModel(iUpdateRecord,
                                                                                  iDependency[self._offlinePrimaryKeyDependencyRecordPrimaryKeyPropertyName],
                                                                                  iDependency[self._offlinePrimaryKeyDependencyRecordStoreNamePropertyName],
                                                                                  objectDescriptor.model,//RDW FIXME this is probably wrong for cross-model relationships, change this when StorageDataService can look up an objectDescriptor from a storeName
                                                                                  true));
                            }
                        }
//RDW FIXME do we care about keeping a record of the offlinePrimaryKey once the offline primary key has been replaced with an onlinePrimaryKey?
//RDW FIXME if there are inverse relationships, seems like we'd need to fix up the "primaryKey" field in some other offlinePrimaryKey records' dependencies
                        offlinePrimaryKeys.delete(offlinePrimaryKey);//RDW FIXME this wasn't happening before, but seems like it should? even though we now have an "online" primary key, seems like we need to know if it changes?

                        aPrimaryKeyRecord[self._offlinePrimaryKeyRecordPrimaryKeyPropertyName] = onlinePrimaryKey;//RDW FIXME this wasn't happening before, but seems like it should? even though we now have an "online" primary key, seems like we need to know if it changes?

                        offlinePrimaryKeys.set(onlinePrimaryKey, aPrimaryKeyRecord);//RDW FIXME this wasn't happening before, but seems like it should? even though we now have an "online" primary key, seems like we need to know if it changes?

                        return (promises ? Promise.all(promises) : self.nullPromise);
                    }
                    else {//RDW FIXME this wasn't happening before, but seems like it should? even though we now have an "online" primary key, seems like we need to know if it changes?
                        return self._writeOfflinePrimaryKeys(onlinePrimaryKey, objectDescriptor);
                    }
                });
            }).catch(function (reason) {
                console.error("_updatePrimaryKey failed", reason);
                throw reason;
            });
        }
    },

    /**
    * Assumes being invoked within the then of this._fetchOfflinePrimaryKeys.
    * @returns {Object} - if we found a record to update, returns it
    * otherwise returns null
    */

    _addPrimaryKeyDependency: {
        value: function (offlinePrimaryKeys, aPrimaryKey, storeName, storePrimaryKey, storeForeignKeyName) {
            var updatedRecord = null;

            if (offlinePrimaryKeys.has(aPrimaryKey)) {
                var aPrimaryKeyRecord = offlinePrimaryKeys.get(aPrimaryKey),
                    dependencies = aPrimaryKeyRecord[this._offlinePrimaryKeyRecordDependenciesPropertyName],
                    found = false;

                // Now we search for a match... wish we could use an in-memory compound-index...

                if (dependencies) {
                    for (var i = 0, iDependency; (iDependency = dependencies[i]); i++) {
                        if (iDependency[this._offlinePrimaryKeyDependencyRecordStoreNamePropertyName] === storeName &&
                            iDependency[this._offlinePrimaryKeyDependencyRecordPrimaryKeyPropertyName] === storePrimaryKey &&
                            iDependency[this._offlinePrimaryKeyDependencyRecordForeignKeyNamePropertyName] === storeForeignKeyName) {
                            found = true;
                            break;
                        }
                    }
                }

                if (!found) {
                    var primaryKeysRecord = {};

                    primaryKeysRecord[this._offlinePrimaryKeyDependencyRecordStoreNamePropertyName] = storeName;
                    primaryKeysRecord[this._offlinePrimaryKeyDependencyRecordPrimaryKeyPropertyName] = storePrimaryKey;
                    primaryKeysRecord[this._offlinePrimaryKeyDependencyRecordForeignKeyNamePropertyName] = storeForeignKeyName;

                    if (!dependencies) {
                        dependencies = aPrimaryKeyRecord.dependencies = [];
                    }

                    dependencies.push(primaryKeysRecord);

                    updatedRecord = aPrimaryKeyRecord;
                }
            }

            return updatedRecord;
        }
    },

    _registerOfflinePrimaryKeyDependenciesForData: {
        value: function (data, objectDescriptor) {
            var promise = this.nullPromise;

            if (data && Array.isArray(data) && data.length) {
                var self = this,
                    representativeKeys = Object.keys(data[0]),//TODO better way to do this from the objectDescriptor?
                    foreignKeys = representativeKeys;//if we don't have a known list of foreign keys, we'll consider all potential candidate//TODO there must be a better way to do this

                promise = self._fetchOfflinePrimaryKeys().then(function (offlinePrimaryKeys) {
                    var updatedRecord,
                        updatedRecords,
                        updatedPrimaryKeys,
                        storeName;

                    for (var i = 0, iData; (iData = data[i]); i++) {
                        var iPrimaryKey = iData[primaryKeyPropertyName];//RDW FIXME dataIdentifierForTypeRawData, except prob this needs to be called on the individual service

                        for (var j = 0, jForeignKeyName; (jForeignKeyName = foreignKeys[j]); j++) {
                            var jForeignKeyValue = iData[jForeignKeyName];

                            if (jForeignKeyValue) {
                                storeName = storeName || self.storage._storeNameForObjectDescriptor(objectDescriptor);

                                if ((updatedRecord = self._addPrimaryKeyDependency(offlinePrimaryKeys, jForeignKeyValue, storeName, iPrimaryKey, jForeignKeyName))) {
                                    updatedRecords = updatedRecords || [];
                                    updatedRecords.push(updatedRecord);
                                    updatedPrimaryKeys = updatedPrimaryKeys || [];
                                    updatedPrimaryKeys.push(jForeignKeyValue);
                                }
                            }
                        }
                    }

                    if (updatedRecords && updatedRecords.length) {
                        return self.storage._updateInStoreForModel(updatedRecords,
                                                                   updatedPrimaryKeys,
                                                                   self.storage._offlinePrimaryKeysStoreName,
                                                                   objectDescriptor.model,
                                                                   false,
                                                                   true);
                    }
                });
            }

            return promise;
        }
    },

    _deleteOfflinePrimaryKeyDependenciesForData: {//RDW FIXME note that this didn't do anything in the prior, empty implementation
        value: function (data, objectDescriptor) {
            var promise;

            if (data) {
                var dataArray = (Array.isArray(data)) ? data
                                                      : [data];

                if (dataArray.length) {
                    var self = this;

                    promise = self._fetchOfflinePrimaryKeys().then(function (offlinePrimaryKeys) {
                        var promises,
                            storeName;

                        for (var i = 0, iData; (iData = dataArray[i]); i++) {
                            var iPrimaryKey = iData[primaryKeyPropertyName],//RDW FIXME dataIdentifierForTypeRawData, except prob this needs to be called on the individual service
                                iPrimaryKeyRecord = offlinePrimaryKeys.get(iPrimaryKey),
                                dependencies = iPrimaryKeyRecord[self._offlinePrimaryKeyRecordDependenciesPropertyName];

                            if (dependencies) {//RDW FIXME remove the dependencies after processing here? or rely on _deleteOfflinePrimaryKeys?
                                for (var i = 0, iDependency; (iDependency = dependencies[i]); i++) {
                                    var iUpdateRecord = {};

                                    iUpdateRecord[iDependency[self._offlinePrimaryKeyDependencyRecordForeignKeyNamePropertyName]] = null;//RDW FIXME make sure that the value being nullified had been iPrimaryKey?

                                    // Using updateData creates offlineOperations we don't want here, hence direct use of storage.
                                    // This is internal to PersistentDataService and descendants.

                                    promises = promises || [];
                                    promises.push(self.storage._updateInStoreForModel(iUpdateRecord,
                                                                                      iDependency[self._offlinePrimaryKeyDependencyRecordPrimaryKeyPropertyName],
                                                                                      iDependency[self._offlinePrimaryKeyDependencyRecordStoreNamePropertyName],
                                                                                      objectDescriptor.model,//RDW FIXME this is probably wrong for cross-model relationships, change this when StorageDataService can look up an objectDescriptor from a storeName
                                                                                      true));
                                }
                            }
                        }

                        return (promises ? Promise.all(promises) : self.nullPromise);
                    });
                }
                else {
                    promise = this.nullPromise;
                }
            }
            else {
                promise = this.nullPromise;
            }

            return promise;
        }
    },

    _deleteOfflinePrimaryKeys: {
        value: function (primaryKeys, objectDescriptor) {
            var promise;

            if (primaryKeys) {
                var primaryKeysArray = (Array.isArray(primaryKeys)) ? primaryKeys
                                                                    : [primaryKeys];

                if (primaryKeysArray.length) {
                    var self = this;

                    promise = new Promise(function (resolve, reject) {
                        return self._deleteFromStoreForModel(primaryKeysArray,
                                                            self._offlinePrimaryKeysStoreName,
                                                            objectDescriptor.model,
                                                            true).then(function () {
                            return self._fetchOfflinePrimaryKeys().then(function (offlinePrimaryKeys) {
                                //Update local cache:
                                for (var i = 0, iPrimaryKey; (iPrimaryKey = primaryKeysArray[i]); i++) {
                                    offlinePrimaryKeys.delete(iPrimaryKey.offlinePrimaryKey);
                                }

                                resolve(null);
                            });
                        }).catch(function (e) {
                            console.error("_deleteOfflinePrimaryKeys failed", e);
                            reject(e);
                        });
                    });
                }
                else {
                    promise = this.nullPromise;
                }
            }
            else {
                promise = this.nullPromise;
            }

            return promise;
        }
    }
},
{
});
