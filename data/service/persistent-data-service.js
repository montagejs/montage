var RawDataService = require("data/service/raw-data-service").RawDataService,
    DataStream = require("data/service/data-stream").DataStream,
    DataOperation= require("data/service/data-operation").DataOperation,
    Promise = require("core/promise").Promise,
    uuid = require("core/uuid"),
    DataOrdering = require("data/model/data-ordering").DataOrdering,
    DESCENDING = DataOrdering.DESCENDING,
    evaluate = require("frb/evaluate"),
    Map = require("collections/map"),
    PersistentDataService, OfflineService;

/* global Dexie */

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
        }
    },

    deserializeSelf: {
        value:function (deserializer) {
            this.super(deserializer);

            var value;
            value = deserializer.getProperty("persistingObjectDescriptorNames");
            if (value) {
                this.persistingObjectDescriptorNames = value;
            }

        }
    },

    serializeSelf: {
        value:function (serializer) {
            this.super(serializer);

            if (this.persistingObjectDescriptorNames) {
                serializer.setProperty("persistingObjectDescriptorNames", this.persistingObjectDescriptorNames);
            }

        }
    },

    /**
     * returns a Promise that resolves to the object used by the service to
     * store data. This is meant to be an abstraction of the "Database"
     *
     * @returns {Promise}
     */

    _storage: {
        value: undefined
    },
    storage: {
        get: function() {
            return this._storage || (this._storage = Promise.reject(new Error('Needs to be implemented by sub classes')));
        }
    },

    name: {
        value: void 0
    },


    // createObjectStoreFromSample: {
    //     value: function (objectStoreName, primaryKey, sampleData) {
    //         if (!sampleData) return;

    //         var sampleDataKeys = Object.keys(sampleData),
    //             storage = this._storage,
    //             currentSchema = {};

    //         storage.tables.forEach(function (table) {
    //             currentSchema[table.name] = JSON.stringify(table.schema);
    //         });

    //         var schemaDefinition = primaryKey;
    //         for (var i=0, iKey;(iKey = sampleDataKeys[i]);i++) {
    //             if (iKey !== primaryKey) {
    //                 schemaDefinition += ",";
    //                 schemaDefinition +=  iKey;
    //             }
    //         }
    //         currentSchema[objectStoreName] = schemaDefinition;
    //         storage.version(storage.verno+1).stores(currentSchema);

    //     }
    // },

    /**
     * table/property/index name that tracks the date the record was last updated
     *
     * @returns {String}
     */
    operationTableName: {
        value: "Operation"
    },
    /**
     * name of the schema property that stores the name of the type/object store
     * of the object the operation impacts
     *
     * @returns {String}
     */
    typePropertyName: {
        value: "type"
    },

    /**
     * name of the schema property that stores the last time the operation's object
     * (dataID) was last fetched.
     *
     * @returns {String}
     */
    lastFetchedPropertyName: {
        value: "lastFetched"
    },

   /**
     * name of the schema property that stores the last time the operation's
     * object was last modified.
     *
     * @returns {String}
     */
    lastModifiedPropertyName: {
        value: "lastModified"
    },

     /**
     * name of the schema property that stores the type of operation:
     * This will be create or update or delete
     *
     * @returns {String}
     */
    operationPropertyName: {
        value: "operation"
    },
    operationCreateName: {
        value: "create"
    },
   operationUpdateName: {
        value: "update"
    },
    operationDeleteName: {
        value: "delete"
    },

   /**
     * name of the schema property that stores the  changes made to the object in this operation
     *
     * @returns {String}
     */
    changesPropertyName: {
        value: "changes" //This contains
    },

    /**
     * name of the schema property that stores the primary key of the object the operation impacts
     *
     * @returns {String}
     */
    dataIDPropertyName: {
        value: "dataID"
    },

   /**
     * name of the schema property that stores unstructured/custom data for a service
     * to stash what it may need for further use.
     *
     * @returns {String}
     */
    contextPropertyName: {
        value: "context"
    },


    /*
        returns all records, ordered by time, that reflect what hapened when offline.
        We shoud
        [{
            // NO primaryKey: uuid-uuid-uuid,
            lastFetched: Date("08-02-2016"),
            lastModified: Date("08-02-2016"),
            operation: "create",
            data: {
                hazard_id:  uuid-uuid-uuid,
                "foo":"abc",
                "bla":23
            }
        },
        {
            lastFetched: Date("08-02-2016"),
            lastModified: Date("08-02-2016"),
            operation: "update"
        },
        {
            lastFetched: Date("08-02-2016"),
            lastModified: Date("08-02-2016"),
            operation: "update"
        },
        ]
    */

    offlineOperations: {
        get: function() {
            //Fetch
        }

    },

    clearOfflineOperations: {
        value: function(operations) {
            //Fetch

        }
    },
    /* Feels like that should return the data, in case it's called with null and created inside?*/
    mapToRawSelector: {
        value: function (object, data) {
            // TO DO: Provide a default mapping based on object.TYPE.
            // For now, subclasses must override this.
        }
    },

    /* Benoit: this coming from offline-service and will be replaced by storageByObjectDescriptor
    */

    _tableByName: {
        value: void 0
    },
    tableNamed: {
        value: function(tableName) {
            var table;
            if (!this._tableByName) {
                this._tableByName = new Map();
            }
            table = this._tableByName.get(tableName);
            if (!table) {
                table = this._storage[tableName];
                if (!table) {
                    var tables = this._storage.tables;
                    for (var i=0, iTable; (iTable = tables[i]); i++) {
                        if (iTable.name === tableName) {
                            this._tableByName.set(tableName,(table = iTable));
                            break;
                        }
                    }
                }
            }
            return table;
        }
    },

    _operationTable: {
        value: void 0
    },
    operationTable: {
        get:function() {
            if (!this._operationTable) {
                this._operationTable = this.tableNamed(this.operationTableName);
            }
            return this._operationTable;
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
        set: function(value) {
            this._persistingObjectDescriptorNames = new Set(value);
        },
        get: function(value) {
            return this._persistingObjectDescriptorNames;
        }
    },

    /**
     * returns true or false depending on wether PersistentDataService has been instructed
     * to persist the objectDescriptor passed as an argument.
     *
     * @argument {ObjectDescriptor} objectDescriptor
     * @returns {Boolean}
     */
    persistsObjectDescriptor: {
        value: function(objectDescriptor) {
            return objectDescriptor && this._persistingObjectDescriptorNames && this._persistingObjectDescriptorNames.has(objectDescriptor.name);
        }
    },

    persistsObject: {
        value: function(object) {
            return this.persistsObjectDescriptor(this.objectDescriptorForObject(object));
        }
    },


  /**
     * returns the list of all property descriptors that should persist for the
     * objectDescriptor passed as an argument. By default, return all propertyDescriptors.
     * This can be customized and configured when a PersistentDataService is instanciated.
     *
     * @argument {ObjectDescriptor} objectDescriptor
     * @returns {Array.<String>}
     */
    persistentPropertyDescriptors: {
        value: function(objectDescriptor) {
            return objectDescriptor.propertyDescriptors;
        }
    },


   /**
     * This is the opportunity for a PersistentDataService to lazily create the storage needed
     * to execute this query, or to optimize it if it turns out indexes don't exist for optimally execute a passed query. This could also be lazily and on frequency of request being used, as well as time spent executing it without. Traversing the query's criteria's syntactic tree and looking up
     * property descriptors' valueDescriptors to navigate the set of persistentStorage needed
     * and make sure they exit before attempting to fetch from it.
     *
     * @argument {DataStream} stream
     * @returns {Promise}
     */
   storageForQuery: {
        value: function(query) {
            //Walk stream's criteria's syntax,
            //  call storageForObjectDescriptor() for type of query
            //  plus criteria's properties' valueDescriptor
            //  if such property should persist (see persistentPropertyDescriptors)
            var message = "PersistentDataService.storageForQuery is not implemented",
                type = query && query.type;

            if (type && typeof type === "string") {
                message = message + " (" + type + ")";
            } else if (type) {
                message = message + " (" + (type.name || type.exportName) + ")";
            }
            return Promise.reject(new Error(message));
        }
    },

    _databaseByModel: {
        value: undefined
    },
    /**
     * Returns the WeakMap keeping track of the storage objects
     * used for objectDescriptors
     *
     * @returns {WeakMap}
     */

    databaseByModel: {
        get: function() {
            return this._databaseByModel || (this._databaseByModel = new WeakMap);
        }
    },
    registerDatabaseForModel: {
        value: function(database,model) {
            this._databaseByModel.set(model,database);
        }
    },
    unregisterDatabaseForModel: {
        value: function(model) {
            this._databaseByModel.delete(model);
        }
    },

    /**
     * Benoit: 8/8/2017. We are going to use a single database for an App model-group.
     * If a persistent service is used for a single model, no pbm, to workaround possible
     * name conflicts in ObjectDescriptors coming from different packages, we'll use the
     * full moduleId of these ObjectDescriptors to name object stores / tables avoid name conflicts.
     * Even if different databases end up being used, this choice will work as well.
     *
     * This API allows for one subclass to decide to use differrent databases for storing different
     * ObjectDescriptors, or a subclass can decide to use only one.
     * Returns a Promise for the persistence storage used to store objects
     * described by the objectDescriptor passed as an argument.
     *
     * may need to introduce an _method used internally to minimize
     * use of super()
     *
     * @argument {ObjectDescriptor} stream
     * @returns {Promise}
     */
    databaseForModel: {
        value: function(model) {
            if (this.persistsModel(model)) {
                var database = this._databaseByModel.get(model);
                if (!database) {
                    database = this.provideDatabaseForModel(model) || Promise.reject(null);
                    this.registerDatabaseForModel(database,model);
                }
                return database;
            }
            return Promise.reject(null);
        }
    },

    databaseForObjectDescriptor: {
        value: function(objectDescriptor) {
            return this.databaseForModel(objectDescriptor.model);
        }
    },

    _storageByObjectDescriptor: {
        value: undefined
    },
    /**
     * Returns the WeakMap keeping track of the storage objects
     * used for objectDescriptors
     *
     * @returns {WeakMap}
     */

    storageByObjectDescriptor: {
        get: function() {
            return this._storageByObjectDescriptor || (this._storageByObjectDescriptor = new WeakMap);
        }
    },
    registerStorageForObjectDescriptor: {
        value: function(storage,objectDescriptor) {
            this._storageByObjectDescriptor.set(objectDescriptor,storage);
        }
    },
    unregisterStorageForObjectDescriptor: {
        value: function(objectDescriptor) {
            this._storageByObjectDescriptor.delete(objectDescriptor);
        }
    },

    /**
     * Returns a Promise for the persistence storage used to store objects
     * described by the objectDescriptor passed as an argument.
     *
     * Benoit: 8/8/2017: Ideally we want to create these storage lazily, on-demand.
     *
     * may need to introduce an _method used internally to minimize
     * use of super()
     *
     * @argument {ObjectDescriptor} stream
     * @returns {Promise}
     */
    storageForObjectDescriptor: {
        value: function(objectDescriptor) {
            return this.databaseForObjectDescriptor(objectDescriptor)
                .then(function(database) {
                    if (this.persistsObjectDescriptor(objectDescriptor)) {
                        var storage = this._storageByObjectDescriptor.get(objectDescriptor);
                        if (!storage) {
                            storage = this.provideStorageForObjectDescriptor(objectDescriptor) || Promise.reject(null);
                            this.registerStorageForObjectDescriptor(storage,objectDescriptor);
                        }
                        return storage;
                    }
                    return Promise.reject(null);
                });
        }
    },

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
            if (service && this.persistsObjectDescriptor(type)) {
                service.delegate = this;
            }
            return service;
        }
    },

   fetchData: {
        value: function (queryOrType, optionalCriteria, optionalStream) {
            //We let the super logic apply, which will attempt to obtain data through any existing child service
            var dataStream = this.super(queryOrType, optionalCriteria, optionalStream),
                rawDataStream,
                promise = dataStream,
                rawPromise,
                self = this;

            if (this.persistsObjectDescriptor(dataStream.query.type)) {

                promise = promise.then(function(data) {
                    var rawDataStream = new DataStream();
                    rawDataStream.type = dataStream.type;
                    rawDataStream.query = dataStream.query;
                    self._registerDataStreamForRawDataStream(dataStream,rawDataStream);
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
   objectsByPrimaryKeyForDataStream: {
        value: function(dataStream) {
            var value = this._dataStreamObjectsByPrimaryKey.get(dataStream);
            if (!value) {
                value = new Map();
                this._dataStreamObjectsByPrimaryKey.set(dataStream,value);
            }
            return value;
        }
   },
    __dataStreamForRawDataStream: {
        value: new WeakMap()
    },

   _dataStreamForRawDataStream: {
       value: function(rawDataStream) {
        return this.__dataStreamForRawDataStream.get(rawDataStream);
       }
   },
   _registerDataStreamForRawDataStream: {
       value: function(dataStream,rawDataStream) {
        return this.__dataStreamForRawDataStream.set(rawDataStream,dataStream);
       }
   },

    fetchRawData: {
        value: function (stream) {
            var query = stream.query,
                queryObjectDescriptor = query.type,
                storage = this.storageForObjectDescriptor(queryObjectDescriptor),
                criteria = query.criteria,
                whereProperties = Object.keys(criteria),
                orderings = query.orderings,

                self = this;

              /*
                    The idea here (to finish) is to use the first criteria in the where, assuming it's the most
                    important, and then filter the rest in memory by looping on remaining
                    whereProperties amd whereEqualValues, index matches. Not sure how Dexie's Collection fits there
                    results in the then is an Array... This first pass fetches offline Hazards with status === "A",
                    which seems to be the only fetch for Hazards on load when offline.
                */
                storage.then(function (storage) {

                    var resultPromise = self.tableNamed(query.type);
                    resultPromise.toArray(function(results) {
                        //Creates an infinite loop, we don't need what's there
                        //self.addRawData(stream, results);
                        //self.rawDataDone(stream);
                        if (orderings) {
                            var expression = "";
                            //Build combined expression
                            for (var i=0,iDataOrdering,iExpression;(iDataOrdering = orderings[i]);i++) {
                                iExpression = iDataOrdering.expression;

                                if (expression.length) {
                                    expression += ".";
                                }

                                expression += "sorted{";
                                expression += iExpression;
                                expression += "}";

                                if (iDataOrdering.order === DESCENDING) {
                                    expression += ".reversed()";
                                }
                            }
                            results = evaluate(expression, results);
                        }

                        stream.addRawData(results);
                        stream.rawDataDone();

                    });

                //}
                // else {
                //     table.toArray()
                //     .then(function(results) {
                //         stream.addData(results);
                //         stream.dataDone();
                //     });
                // }

            }).catch('NoSuchDatabaseError', function(e) {
                // Database with that name did not exist
                stream.dataError(e);
            }).catch(function (e) {
                stream.dataError(e);
            });

            // Return the passed in or created stream.
            return stream;
        }
    },

    openTransaction: {
        value: function() {
            return Promise.resolve();
        }
    },

    closeTransaction: {
        value: function() {
            return Promise.resolve();
        }
    },

    _updateOperationsByDataStream: {
        value: new Map()
    },

    //ToDo:
    //The dataStream will need to be removed from this structure when the cycle is completed.
    updateOperationsForDataStream: {
        value: function(dataStream) {
            var operations = this._updateOperationsByDataStream.get(dataStream);
            if (!operations) {
                this._updateOperationsByDataStream.set(dataStream,(operations = []));
            }
            return operations;
        }
    },
    _objectsToUpdatesForDataStream: {
        value: new Map()
    },

    objectsToUpdatesForDataStream: {
        value: function(dataStream) {
            var objects = this._objectsToUpdatesForDataStream.get(dataStream);
            if (!objects) {
                this._objectsToUpdatesForDataStream.set(dataStream,(objects = []));
            }
            return objects;
        }
    },
    /**
     * Delegate method allowing the persistent service to do the ground work
     * as objects are created, avoiding to loop again later
     *
     * @method
     * @argument {DataService} dataService
     * @argument {DataStream} dataStream
     * @argument {Object} rawData
     * @argument {Object} object
     * @returns {void}
     */
    rawDataServiceDidAddOneRawData: {
        value: function(dataService,dataStream,rawData,object) {
            if (this.persistsObject(object)) {
                var dataIdentifier = this.dataIdentifierForObject(object),
                    dataStreamPrimaryKeyMap = this.objectsByPrimaryKeyForDataStream(dataStream),
                    dataOperation;

                //Register the object by primarykey, which we'll need later
                dataStreamPrimaryKeyMap.set(dataIdentifier.primaryKey,object);

                //The operation should be created atomically in the method that
                //will actually save the data itself.
                //Create the record to track the online Last Updated date
                dataOperation = {};
                dataOperation.dataID = dataIdentifier.primaryKey;
                //We previously had the exact same time cached for all objects
                //Need to keep an eye out for possible consequences due to that change
                dataOperation[this.lastFetchedPropertyName] = Date.now();
                dataOperation[this.typePropertyName] = dataStream.query.type;

                this.updateOperationsForDataStream(dataStream).push(dataOperation);
                //Pseudo code.
                this.objectsToUpdatesForDataStream(dataStream).push(object);
            }

        }
    },

    // addRawData: {
    //     value: function (stream, records, context) {
    //         this.super(stream, records, context);
    //     }
    // },

    addOneRawData: {
        value: function(stream, rawData, context, _type) {
            var dataIdentifier = this.dataIdentifierForTypeRawData(stream.query.type,rawData),
                primaryKey = dataIdentifier.primaryKey,
                dataStream = this._dataStreamForRawDataStream(stream),
                dataStreamPrimaryKeyMap = this.objectsByPrimaryKeyForDataStream(dataStream),
                object = null,
                dataOperation, dataStreamValue;

            //Register the object by primarykey, which we'll need later
            dataStreamValue = dataStreamPrimaryKeyMap.get(primaryKey);
            //If results were returned by childServices but that primaryKey isn't found
            //it means that this obect doesn't match stream's query criteria as it used to.
            //We were removing it from storage in general, which could cause that object to disapear for other queries that it still matches. It should be done eventually
            //for a per query cache
            if (dataStream.data && dataStream.length > 0 && !dataStreamValue) {
                this.deletesForDataStream(dataStream).push(primaryKey);
            }

            //If no data was returned, we go on and create the object
            if (!dataStream.data || dataStream.length === 0) {
                object = this.super(stream, rawData, context, _type);
            }


            //Do we have



            return object;
        }
    },

    rawDataDone: {
        value: function (stream, context) {
            var self = this;
            this.super(stream, context)
            .then(function() {
                self.openTransaction()
                .then(function() {
                    var dataStream = self._dataStreamForRawDataStream(stream),
                        updateOperations = self.objectsToUpdatesForDataStream(dataStream),
                        deleteOperations = self.deletesForDataStream(dataStream),
                        updates = stream.data;

                    //Need to structure the API to
                    return this.closeTransaction();
                });
            });
        }
    },


     /**
     * Called every time [addRawData()]{@link RawDataService#addRawData} is
     * called while online to optionally cache that data for offline use.
     *
     * The default implementation does nothing. This is appropriate for
     * subclasses that do not support offline operation or which operate the
     * same way when offline as when online.
     *
     * Other subclasses may override this method to cache data fetched when
     * online so [fetchOfflineData]{@link RawDataSource#fetchOfflineData} can
     * use that data when offline.
     *
     * @method
     * @argument {DataStream} stream   - The stream to which the fetched data is
     *                                   being added.
     * @argument {Array} rawDataArray  - An array of objects whose properties'
     *                                   values hold the raw data.
     * @argument {?} context           - The context value passed to the
     *                                   [addRawData()]{@link DataMapping#addRawData}
     *                                   call that is invoking this method.
     */

    //writeOfflineData/readOfflineOperation

    _persistFetchedDataStream: {
        value: function (dataStream, rawData) {

             var self = this,
                dataArray = dataStream.data,
                query = dataStream.query,
                tableName = query.type,
                table = this.tableNamed(tableName),
                clonedArray = [],
                i,countI,iRawData, iLastUpdated,
                lastUpdated = Date.now(),
                updateOperationArray = [],
                dataID = this.dataIDPropertyName,
                primaryKey = table.schema.primKey.name,
                lastUpdatedPropertyName = this.lastFetchedPropertyName,
                j, jRawData,
                rawDataMapByPrimaryKey,
                offlineObjectsToClear = [],
                rawDataStream = new DataStream();

                rawDataStream.type = dataStream.type;
                rawDataStream.query = query;

            //Make a clone of the array and create the record to track the online Last Updated date
            for (i=0, countI = dataArray.length; i<countI; i++) {
                if ((iRawData = dataArray[i])) {
                    clonedArray.push(iRawData);

                    //Create the record to track the online Last Updated date
                    iLastUpdated = {};
                    iLastUpdated[dataID] = iRawData[primaryKey];
                    iLastUpdated[lastUpdatedPropertyName] = lastUpdated;
                    iLastUpdated[this.typePropertyName] = tableName;
                    updateOperationArray.push(iLastUpdated);
                }
            }

            // 1) First we need to execute the equivalent of stream's query to find what we have matching locally
            return this.fetchRawData(rawDataStream).then(function (fetchedRawRecords) {
                // 2) Loop on offline results and if we can't find it in the recent dataArray:
                //    2.0) Remove the non-matching record so it doesn't show up in results
                //         if that query were immediately done next as offline.
                // Not ideal as we're going to do at worse a full lookup of dataArray, every iteration
                for (var i=0, countI = fetchedRawRecords.length, iRecord, iRecordPrimaryKey;(iRecord = fetchedRawRecords[i]);i++) {
                    iRecordPrimaryKey = iRecord[self.dataIDPropertyName];
                    // move above loop? remove conditional? saves case where countI = 0?
                    if (!rawDataMapByPrimaryKey) {
                        rawDataMapByPrimaryKey = new Map();
                        for (j=0;(jRawData = dataArray[j]);j++) {
                            rawDataMapByPrimaryKey.set(jRawData[primaryKey],jRawData);
                        }
                    }
                    if (!rawDataMapByPrimaryKey.has(iRecord[primaryKey])) {
                        offlineObjectsToClear.push(primaryKey);
                    }
                }

                //Now we now what to delete: offlineObjectsToClear, what to put: dataArray.
                //We need to be able to build a transaction and pass

                // 3) Put new objects
                return self.performOfflineSelectorChanges(query, clonedArray, updateOperationArray, offlineObjectsToClear);

            })
            .catch(function(e) {
                console.log(query.type + ": performOfflineSelectorChanges failed",e);
                console.error(e);
            });

        }
    },

    readOfflineOperations: {
        value: function (/* operationMapToService */) {
            var self = this;
            return new Promise(function (resolve, reject) {
                var myDB = self._storage;
                myDB.open().then(function (/* storage */) {
                    self.operationTable.where("operation").anyOf("create", "update", "delete").toArray(function (offlineOperations) {
                        resolve(offlineOperations);
                    }).catch(function (e) {
                        console.error(e);
                        reject(e);
                    });
                });
            });
        }
    },

    performOfflineSelectorChanges: {
        value: function (query, rawDataArray, updateOperationArray, offlineObjectsToClear) {
            var myDB = this._storage,
                self = this,
                clonedRawDataArray = rawDataArray.slice(0), // why clone twice?
                clonedUpdateOperationArray = updateOperationArray.slice(0),
                clonedOfflineObjectsToClear = offlineObjectsToClear.slice(0);

            return myDB
            .open()
            .then(function (storage) {

                var table = storage[query.type],
                    operationTable = self.operationTable;

            //Transaction:
                //Objects to put:
                //      rawDataArray
                //      updateOperationArray
                //Objects to delete:
                //      offlineObjectsToClear in table and operationTable

                storage.transaction('rw', table, operationTable, function () {

                        return Dexie.Promise.all(
                            [table.bulkPut(clonedRawDataArray),
                            operationTable.bulkPut(clonedUpdateOperationArray),
                            table.bulkDelete(clonedOfflineObjectsToClear),
                            operationTable.bulkDelete(clonedOfflineObjectsToClear)]);

                }).then(function(value) {
                    //console.log(query.type + ": performOfflineSelectorChanges succesful: "+rawDataArray.length+" rawDataArray, "+clonedUpdateOperationArray.length+" updateOperationArray");
                }).catch(function(e) {
                        console.log(query.type + ": performOfflineSelectorChanges failed", e);
                        console.error(e);
                });
            });

        }
    },

    registerOfflinePrimaryKeyDependenciesForData: {
        value: function(data, tableName, primaryKeyPropertyName) {

            if (data.length === 0) {
                return;
            }

            return PersistentDataService.registerOfflinePrimaryKeyDependenciesForData(data, tableName, primaryKeyPropertyName, this);
        }
    },

    //TODO
    deleteOfflinePrimaryKeyDependenciesForData: {
        value: function(data, tableName, primaryKeyPropertyName) {
            if (data.length === 0) {
                return;
            }

            var tableSchema = this.schema[tableName],
                //if we don't have a known list of foreign keys, we'll consider all potential candidate
                foreignKeys = tableSchema.foreignKeys;


            PersistentDataService.deleteOfflinePrimaryKeyDependenciesForData(data, tableName, primaryKeyPropertyName, foreignKeys);
        }
    },

    /**
     * Save new data passed in objects of type
     *
     * @method
     * @argument {Object} objects   - objects whose data should be created.
     * @argument {String} type   - type of objects, likely to mean a "table" in storage
     * @returns {external:Promise} - A promise fulfilled when all of the data in
     * the changed object has been saved.
     */
    createData: {
        value: function (objects, type, context) {
            var self = this;

            return new Promise(function (resolve, reject) {
                var myDB = self._storage,
                table = self.tableNamed(type),
                operationTable = self.operationTable,
                clonedObjects = [],
                operations = [],
                primaryKey = table.schema.primKey.name,
                dataID = self.dataIDPropertyName,
                lastModifiedPropertyName = self.lastModifiedPropertyName,
                lastModified = Date.now(),
                typePropertyName = self.typePropertyName,
                changesPropertyName = self.changesPropertyName,
                operationPropertyName = self.operationPropertyName,
                operationCreateName = self.operationCreateName,
                primaryKeys = [];


                myDB.open().then(function (storage) {
                    storage.transaction('rw', table, operationTable,
                        function () {

                            //Assign primary keys and build operations
                            for (var i=0, countI = objects.length, iRawData, iOperation, iPrimaryKey;i<countI;i++) {
                                if ((iRawData = objects[i])) {

                                    if (
                                        typeof iRawData[primaryKey] === "undefined" ||
                                            iRawData[primaryKey] === ""
                                    ) {
                                        //Set offline uuid based primary key
                                        iRawData[primaryKey] = iPrimaryKey = uuid.generate();

                                        //keep track of primaryKeys:
                                        primaryKeys.push(iPrimaryKey);
                                    }
                                    else {
                                        console.log("### PersistentDataService createData ",type,": iRaData ",iRawData," already have a primaryKey[",primaryKey,"]");
                                    }

                                    clonedObjects.push(iRawData);

                                    //Create the record to track of last modified date
                                    iOperation = {};
                                    iOperation[dataID] = iPrimaryKey;
                                    iOperation[lastModifiedPropertyName] = lastModified;
                                    iOperation[typePropertyName] = type;
                                    iOperation[changesPropertyName] = iRawData;
                                    iOperation[operationPropertyName] = operationCreateName;
                                    iOperation.context = context;

                                    operations.push(iOperation);
                                }
                            }

                            return Dexie.Promise.all([table.bulkAdd(clonedObjects),operationTable.bulkAdd(operations)]);

                        }).then(function(value) {
                            //Now write new offline primaryKeys
                            PersistentDataService.writeOfflinePrimaryKeys(primaryKeys)
                            .then(function() {
                                //To verify it's there
                                // PersistentDataService.fetchOfflinePrimaryKeys()
                                // .then(function(offlinePrimaryKeys) {
                                //     console.log(offlinePrimaryKeys);
                                // });

                                //Once this succedded, we need to add our temporary primary keys bookkeeping:
                                //Register potential temporary primaryKeys
                                self.registerOfflinePrimaryKeyDependenciesForData(objects, table.name, primaryKey)
                                .then(function() {
                                    resolve(objects);
                                });
                            })
                            .catch(function(e) {
                                reject(e);
                                console.error(e);
                            });
                        }).catch(function(e) {
                            reject(e);
                            console.error(e);
                        });
                    }
                );
            });
        }
    },

    updatePrimaryKey: {
        value: function (currentPrimaryKey, newPrimaryKey, type) {

            var myDB = this._storage,
                table = this.tableNamed(type),
                primaryKeyProperty = table.schema.primKey.name,
                record,
                updateRecord = {};

            //because it's a primary key, we need to delete the record and re-create it...
            //We fetch it first
            return table.where(primaryKeyProperty).equals(currentPrimaryKey)
                .first(function(record) {
                    table.delete(currentPrimaryKey)
                    .then(function() {
                        //Assign the new one
                        record[primaryKeyProperty] = newPrimaryKey;

                        //Re-save
                        return table.put(record);
                    })
                    .catch(function(e) {
                            // console.log("tableName:failed to addO ffline Data",e)
                            console.error(table.name,": failed to delete record with primaryKwy ",currentPrimaryKey,e);
                        });
                });
        }
    },
    /**
     * Save updates made to an array of existing data objects.
     *
     * @method
     * @argument {Array} objects   - objects whose data should be updated.
     * @argument {String} type   - type of objects, likely to mean a "table" in storage
     * @argument {Object} context   - an object that will be associated with operations
     * @returns {external:Promise} - A promise fulfilled when all of the data in
     * objects has been saved.
     */
    updateData: {
        value: function (objects, type, context) {
            var self = this;
            if (!objects || objects.length === 0) {
                return Dexie.Promise.resolve();
            }

            return new Promise(function (resolve, reject) {
                var myDB = self._storage,
                table = self.tableNamed(type),
                operationTable = self.operationTable,
                clonedObjects = objects.slice(0),
                operations = [],
                primaryKey = table.schema.primKey.name,
                dataID = self.dataIDPropertyName,
                lastModifiedPropertyName = self.lastModifiedPropertyName,
                lastModified = Date.now(),
                updateDataPromises = [],
                typePropertyName = self.typePropertyName,
                changesPropertyName = self.changesPropertyName,
                operationPropertyName = self.operationPropertyName,
                operationUpdateName = self.operationUpdateName;

                myDB.open().then(function (storage) {
                    storage.transaction('rw', table, operationTable,
                        function () {
                            //Make a clone of the array and create the record to track the online Last Updated date
                            for (var i=0, countI = objects.length, iRawData, iOperation, iPrimaryKey;i<countI;i++) {
                                if ((iRawData = objects[i])) {
                                    iPrimaryKey = iRawData[primaryKey];
                                    console.log("updateData ",iPrimaryKey,iRawData);
                                    updateDataPromises.push(table.update(iPrimaryKey, iRawData));

                                    //Create the record to track of last modified date
                                    iOperation = {};
                                    iOperation[dataID] = iPrimaryKey;
                                    iOperation[lastModifiedPropertyName] = lastModified;
                                    iOperation[typePropertyName] = type;
                                    iOperation[changesPropertyName] = iRawData;
                                    iOperation[operationPropertyName] = operationUpdateName;
                                    iOperation.context = context;

                                    updateDataPromises.push(operationTable.put(iOperation));
                                }
                            }
                            return Dexie.Promise.all(updateDataPromises);

                        }).then(function(value) {
                            //Once this succedded, we need to add our temporary primary keys bookeeping:
                            //Register potential temporary primaryKeys
                            self.registerOfflinePrimaryKeyDependenciesForData(objects, table.name, primaryKey);


                            resolve(clonedObjects);
                            //console.log(table.name,": updateData for ",objects.length," objects succesfully",value);
                        }).catch(function(e) {
                            reject(e);
                            // console.log("tableName:failed to addO ffline Data",e)
                            console.error(table.name,": failed to updateData for ",objects.length," objects with error",e);
                        });
                    }
                );

            });
        }
    },

    /**
     * Delete data passed in array.
     *
     * @method
     * @argument {Object} objects   - objects whose data should be saved.
     * @argument {String} type   - type of objects, likely to mean a "table" in storage
     * @returns {external:Promise} - A promise fulfilled when all of the data in
     * the changed object has been saved.
     */
    deleteData: {
        value: function (objects, type, context) {
            var self = this;

            if (!objects || objects.length === 0) {
                return Dexie.Promise.resolve();
            }

            return new Promise(function (resolve, reject) {
                var myDB = self._storage,
                table = self.tableNamed(type),
                operationTable = self.operationTable,
                clonedObjects = objects.slice(0),
                primaryKey = table.schema.primKey.name,
                dataID = self.dataIDPropertyName,
                lastModifiedPropertyName = self.lastModifiedPropertyName,
                lastModified = Date.now(),
                changesPropertyName = self.changesPropertyName,
                typePropertyName = self.typePropertyName,
                operationPropertyName = self.operationPropertyName,
                operationDeleteName = self.operationDeleteName,
                updateDataPromises = [];

                myDB.open().then(function (storage) {
                    storage.transaction('rw', table, operationTable,
                        function () {
                            //Make a clone of the array and create the record to track the online Last Updated date
                            for (var i=0, countI = objects.length, iRawData, iOperation, iPrimaryKey; i<countI; i++) {
                                if ((iRawData = objects[i])) {
                                    iPrimaryKey = iRawData[primaryKey];
                                    updateDataPromises.push(table.delete(iPrimaryKey, iRawData));

                                    //Create the record to track of last modified date
                                    iOperation = {};
                                    iOperation[dataID] = iPrimaryKey;
                                    iOperation[lastModifiedPropertyName] = lastModified;
                                    iOperation[typePropertyName] = type;
                                    iOperation[changesPropertyName] = iRawData;
                                    iOperation[operationPropertyName] = operationDeleteName;
                                    iOperation.context = context;

                                    updateDataPromises.push(operationTable.put(iOperation));
                                }
                            }
                            return Dexie.Promise.all(updateDataPromises);

                        }).then(function(value) {

                            //Once this succeeded, we need to add our temporary primary keys bookkeeping:
                            //Register potential temporary primaryKeys
                            self.deleteOfflinePrimaryKeyDependenciesForData(objects, type, primaryKey);
                            resolve(clonedObjects);
                            //console.log(table.name,": updateData for ",objects.length," objects successfully",value);
                        }).catch(function(e) {
                            reject(e);
                            // console.log("tableName:failed to add Offline Data",e)
                            console.error(table.name,": failed to updateData for ",objects.length," objects with error",e);
                        });
                    }
                );

            });
        }
    },

    deleteOfflineOperations: {
        value: function (operations) {
            var self = this;

            if (!operations || operations.length === 0) {
                return Promise.resolve();
            }

            return new Promise(function (resolve, reject) {
                var myDB = self._storage,
                    operationTable = self.operationTable,
                    primaryKey = operationTable.schema.primKey.name,
                    deleteOperationPromises = [];

                myDB.open().then(function (storage) {
                    storage.transaction('rw', operationTable,
                        function () {
                            //Make a clone of the array and create the record to track the online Last Updated date
                            for (var i=0, countI = operations.length, iOperation;i<countI;i++) {
                                if ((iOperation = operations[i])) {
                                    deleteOperationPromises.push(operationTable.delete(iOperation[primaryKey], iOperation));
                                }
                            }
                            return Dexie.Promise.all(deleteOperationPromises);

                    }).then(function(value) {
                        resolve();
                        //console.log(table.name,": updateData for ",objects.length," objects succesfully",value);
                    }).catch(function(e) {
                        reject(e);
                        // console.log("tableName:failed to add Offline Data",e)
                        //console.error(operationTable.name,": failed to updateData for ",objects.length," objects with error",e);
                    });
                });

            });
        }
    },
    onlinePrimaryKeyForOfflinePrimaryKey: {
        value: function(offlinePrimaryKey) {
            return PersistentDataService.onlinePrimaryKeyForOfflinePrimaryKey(offlinePrimaryKey);
        }
    },
    replaceOfflinePrimaryKey: {
            value: function(offlinePrimaryKey,onlinePrimaryKey, type, service) {
                return PersistentDataService.replaceOfflinePrimaryKey(offlinePrimaryKey,onlinePrimaryKey, type, service);
            }
    }
},
    {
        _registeredPersistentDataServiceByName: {
            value: new Map()
        },
        registerPersistentDataService: {
            value: function(aPersistentDataService) {
                this._registeredPersistentDataServiceByName.set(aPersistentDataService.name, aPersistentDataService);
            }
        },
        registeredPersistentDataServiceNamed: {
            value: function(aPersistentDataServiceName) {
                return this._registeredPersistentDataServiceByName.get(aPersistentDataServiceName);
            }
        },
        __offlinePrimaryKeyDB: {
            value:null
        },
        _offlinePrimaryKeyDB: {
            get: function() {
                if (!this.__offlinePrimaryKeyDB) {
                    var storage = this.__offlinePrimaryKeyDB = new Dexie("OfflinePrimaryKeys"),
                        primaryKeysTable = storage["PrimaryKeys"];

                    if (!primaryKeysTable) {
                        /*   PrimaryKeys has offlinePrimaryKey and a property "dependencies" that contains an array of
                            {
                                offlinePrimaryKey:"uuid-1111-4444-5555",
                                dependencies:[
                                    {
                                        serviceName: "AServiceName",
                                        tableName:"BlahTable",
                                        primaryKey:"uuid-1233-3455",
                                        foreignKeyName:"foo_ID"
                                    }
                                ]
                            }
                                This tells us that the primaryKey "uuid-1111-4444-5555" appears as a foreignKey named "foo_ID" of the record in "BlahTable" that has the primaryKey value of "uuid-1233-3455"
                        */

                        var newDbSchema = {
                            PrimaryKeys: "offlinePrimaryKey,dependencies.serviceName, dependencies.tableName, dependencies.primaryKey, dependencies.foreignKeyName"
                        };
                        storage.version(storage.verno+1).stores(newDbSchema);
                    }

                }
                return this.__offlinePrimaryKeyDB;
            }
        },
        _primaryKeysTable: {
            value:null
        },

        primaryKeysTable: {
            get: function() {
                return this._primaryKeysTable || (this._primaryKeysTable = this._offlinePrimaryKeyDB.PrimaryKeys);
            }
        },

        writeOfflinePrimaryKey: {
            value: function(aPrimaryKey) {
                return this.writeOfflinePrimaryKeys([aPrimaryKey]);
            }
        },

        writeOfflinePrimaryKeys: {
            value: function(primaryKeys) {
                var storage = this._offlinePrimaryKeyDB,
                    table = this.primaryKeysTable,
                    primaryKeysRecords = [],
                    self = this;

                for (var i=0, countI = primaryKeys.length, iRawData, iPrimaryKey;i<countI;i++) {
                    primaryKeysRecords.push({
                        offlinePrimaryKey: primaryKeys[i]
                    });
                }
                return new Promise(function (resolve, reject) {
                    var i, iPrimaryKey,
                        _offlinePrimaryKeys = self._offlinePrimaryKeys;

                    table.bulkAdd(primaryKeysRecords)
                    .then(function(lastKey) {
                        self.fetchOfflinePrimaryKeys()
                        .then(function(offlinePrimaryKeys) {

                            //Update local cache:
                            for (i=0;(iPrimaryKey = primaryKeys[i]);i++) {
                                offlinePrimaryKeys.add(iPrimaryKey.offlinePrimaryKey,primaryKeysRecords[i]);
                            }
                            resolve(lastKey);
                        });
                    })
                    .catch(function(e){
                        console.error("deleteOfflinePrimaryKeys failed",e);
                        reject(e);
                    });

                });
            }
        },

        registerOfflinePrimaryKeyDependenciesForData: {
            value: function(data, tableName, primaryKeyPropertyName, service) {

                if (data.length === 0) {
                    return;
                }

                var keys = Object.keys(data[0]),
                    i, iData, countI, iPrimaryKey,
                    j, jForeignKey, jForeignKeyValue,
                    offlineService = PersistentDataService,
                    tableSchema = service.schema[tableName],
                    //if we don't have a known list of foreign keys, we'll consider all potential candidate
                    foreignKeys = tableSchema.foreignKeys,
                    updatedRecord, updatedRecords,
                    self = this;

                if (!foreignKeys) {
                    foreignKeys = tableSchema._computedForeignKeys ||
                        (tableSchema._computedForeignKeys = keys);
                }

                //We need the cache populated from storage before we can do this:
                return this.fetchOfflinePrimaryKeys()
                    .then(function(offlinePrimaryKeys) {

                        for (i=0, countI = data.length;(i<countI);i++) {
                            iData = data[i];
                            iPrimaryKey = iData[primaryKeyPropertyName];
                            for (j=0;(jForeignKey = foreignKeys[j]);j++) {
                                jForeignKeyValue = iData[jForeignKey];
                                //if we have a value in this foreignKey:
                                if (jForeignKeyValue) {
                                    if ((updatedRecord = self.addPrimaryKeyDependency(jForeignKeyValue, tableName,iPrimaryKey,jForeignKey, service.name))) {
                                        updatedRecords = updatedRecords || [];
                                        updatedRecords.push(updatedRecord);
                                    }
                                }
                            }
                        }


                        if (updatedRecords && updatedRecords.length) {
                            //We need to save:
                            self.primaryKeysTable.bulkPut(updatedRecords)
                            .then(function(lastKey) {
                                console.log("Updated  offline primaryKeys dependencies" + lastKey); // Will be 100000.
                            }).catch(Dexie.BulkError, function (e) {
                                console.error (e);
                            });

                        }
                });
            }
        },

        deleteOfflinePrimaryKeyDependenciesForData: {
            value: function(data, tableName, primaryKeyPropertyName, tableForeignKeys) {

            }
        },

       /**
        * this assumes this._offlinePrimaryKeys has already been fetched
        * @returns {Object} - if we found a record to update, returns it
        * otherwise returns null
        */

        addPrimaryKeyDependency: {
            value: function(aPrimaryKey, tableName, tablePrimaryKey, tableForeignKey, serviceName) {

                if (this._offlinePrimaryKeys.has(aPrimaryKey)) {
                    var aPrimaryKeyRecord = this._offlinePrimaryKeys.get(aPrimaryKey),
                        dependencies = aPrimaryKeyRecord.dependencies,
                        i, iDependency, found = false,
                        primaryKeysRecord;

                    //Now we search for a match... whish we could use an in-memory
                    //compound-index...
                    if (dependencies) {
                        for (i=0;(iDependency = dependencies[i]);i++) {
                            if (
                                iDependency.tableName === tableName &&
                                    iDependency.primaryKey === tablePrimaryKey &&
                                        iDependency.foreignKeyName === tableForeignKey
                            ) {
                                found = true;
                                break;
                            }
                        }
                    }

                    if (!found) {
                        primaryKeysRecord = {
                            serviceName: serviceName,
                            tableName: tableName,
                            primaryKey: tablePrimaryKey,
                            foreignKeyName: tableForeignKey
                        };
                        if (!dependencies) {
                            dependencies = aPrimaryKeyRecord.dependencies = [];
                        }
                        dependencies.push(primaryKeysRecord);
                        return aPrimaryKeyRecord;
                    }
                    return null;
                }
            }
        },
        _offlinePrimaryKeyToOnlinePrimaryKey: {
            value: new Map()
        },
        onlinePrimaryKeyForOfflinePrimaryKey: {
            value: function(offlinePrimaryKey) {
                return this._offlinePrimaryKeyToOnlinePrimaryKey.get(offlinePrimaryKey);
            }
        },

        /*
        * Returns a promise resolved when onlinePrimaryKey has replaced offlinePrimaryKey
        * both in memory and in IndexedDB
        * @type {Promise}
        */

        replaceOfflinePrimaryKey: {
            value: function(offlinePrimaryKey,onlinePrimaryKey, type, service) {
                var self = this;
                //Update the central table used by DataService's performOfflineOperations
                //to update operations are they are processed
                this._offlinePrimaryKeyToOnlinePrimaryKey.set(offlinePrimaryKey,onlinePrimaryKey);

                //Update the stored primaryKey
                return service.offlineService.updatePrimaryKey(offlinePrimaryKey, onlinePrimaryKey, type).then(function() {
                    //Now we need to update stored data as well and we need the cache populated from storage before we can do this:
                    //We shouldn't just rely on the fact that the app will immediately refetch everything and things would be broken
                    //if somehow the App would get offline again before a full refetch is done across every kind of data.
                    return self.fetchOfflinePrimaryKeys()
                        .then(function(offlinePrimaryKeys) {

                            if (offlinePrimaryKeys.has(offlinePrimaryKey)) {
                                var aPrimaryKeyRecord = offlinePrimaryKeys.get(offlinePrimaryKey),
                                    dependencies = aPrimaryKeyRecord.dependencies;

                                if (dependencies) {
                                    var i, iDependency, iOfflineService, iTableName, iPrimaryKey, iForeignKeyName, iUpdateRecord, updateArray = [];

                                    for (i=0;(iDependency = dependencies[i]);i++) {
                                        //The service that handles iTableName
                                        iOfflineService = PersistentDataService.registeredPersistentDataServiceNamed(iDependency.serviceName);
                                        iTableName = iDependency.tableName;
                                        iPrimaryKey = iDependency.primaryKey;
                                        iForeignKeyName = iDependency.foreignKeyName;

                                        iUpdateRecord = {};
                                        // updateArray[0] = iUpdateRecord;
                                        iUpdateRecord[iOfflineService.schema[iTableName].primaryKey] = iPrimaryKey;
                                        iUpdateRecord[iForeignKeyName] = onlinePrimaryKey;

                                        return iOfflineService.tableNamed(iTableName).update(iPrimaryKey, iUpdateRecord);
                                        //Using updateData creates offlineOperations we don't want here, hence direct use of table:
                                        //This is internal to OfflineService and descendants.
                                        // iOfflineService.updateData(updateArray, iTableName, null);


                                    }
                                }

                            }

                        });

                })
                .catch(function(e){
                    console.error("updatePrimaryKey failed",e);
                    throw e;
                });
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
        fetchOfflinePrimaryKeys: {
            value: function() {
                if (!this._offlinePrimaryKeys) {
                    var _offlinePrimaryKeys = this._offlinePrimaryKeys = new Map(),
                        self = this;
                    return new Promise(function (resolve, reject) {
                        self._offlinePrimaryKeyDB.PrimaryKeys.each(function (item, cursor) {
                            _offlinePrimaryKeys.set(item.offlinePrimaryKey,item);
                         })
                         .then(function() {
                             resolve(_offlinePrimaryKeys);
                         })
                         .catch(function(e){
                             console.error("fetchOfflinePrimaryKeys failed",e);
                             reject(e);
                         });
                    });
                } else {
                    if (!this._offlinePrimaryKeysPromise) {
                        this._offlinePrimaryKeysPromise = Promise.resolve(this._offlinePrimaryKeys);
                    }
                    return this._offlinePrimaryKeysPromise;
                }
            }
        },
        deleteOfflinePrimaryKeys: {
            value: function (primaryKeys) {
                var self = this,
                    _offlinePrimaryKeys = this._offlinePrimaryKeys;

                if (!primaryKeys || primaryKeys.length === 0) {
                    return Promise.resolve();
                }

                return new Promise(function (resolve, reject) {
                    self._offlinePrimaryKeyDB.PrimaryKeys.bulkDelete(primaryKeys)
                    .then(function() {
                        //Update local cache:
                        for (var i=0, iPrimaryKey;(iPrimaryKey = primaryKeys[i]);i++) {
                            _offlinePrimaryKeys.delete(iPrimaryKey.offlinePrimaryKey);
                        }
                        resolve();
                    })
                    .catch(function(e){
                        console.error("deleteOfflinePrimaryKeys failed",e);
                        reject(e);
                    });
                });
            }
        }
    });
