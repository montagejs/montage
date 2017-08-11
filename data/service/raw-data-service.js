var DataService = require("data/service/data-service").DataService,
    BlueprintDataMapping = require("data/service/blueprint-data-mapping").BlueprintDataMapping,
    DataObjectDescriptor = require("data/model/data-object-descriptor").DataObjectDescriptor,
    DataIdentifier = require("data/model/data-identifier").DataIdentifier,
    DataQuery = require("data/model/data-query").DataQuery,
    DataStream = require("data/service/data-stream").DataStream,
    Deserializer = require("core/serialization/deserializer/montage-deserializer").MontageDeserializer,
    Map = require("collections/map"),
    Montage = require("montage").Montage,
    ObjectDescriptor = require("core/meta/object-descriptor").ObjectDescriptor,
    WeakMap = require("collections/weak-map"),
    deprecate = require("core/deprecate");

/**
 * Provides data objects of certain types and manages changes to them based on
 * "raw" data obtained from or sent to one or more other services, typically
 * REST or other network services. Raw data services can therefore be considered
 * proxies for these REST or other services.
 *
 * Raw data services are usually the children of a
 * [data service]{@link DataService} that often is the application's
 * [main data service]{@link DataService.mainService}. All calls to raw data
 * services that have parent services must be routed through those parents.
 *
 * Raw data service subclasses that implement their own constructor should call
 * this class' constructor at the beginning of their constructor implementation
 * with code like the following:
 *
 *     RawDataService.call(this);
 *
 * @class
 * @extends DataService
 */
exports.RawDataService = DataService.specialize(/** @lends RawDataService.prototype */ {

    /***************************************************************************
     * Initializing
     */

    constructor: {
        value: function RawDataService() {
            DataService.call(this);
            this._typeIdentifierMap = new Map();
        }
    },

    /**
     * @deprecated
     */
    initWithModel: {
        value: function (model) {
            var self = this;
            return require.async(model).then(function (descriptor) {
                var deserializer = new Deserializer().init(JSON.stringify(descriptor), require);
                return deserializer.deserializeObject();
            }).then(function (model) {
                self.model = model;
                return self;
            });
        }
    },

    /***************************************************************************
     * Serialization
     */

    deserializeSelf: {
        value:function (deserializer) {

            this.super(deserializer);
        }
    },

    /*
     * The ConnectionDescriptor object where possible connections will be found
     *
     * @type {ConnectionDescriptor}
     */
    connectionDescriptor: {
        value: undefined
    },

    /*
     * The current DataConnection object used to connect to data source
     *
     * @type {DataConnection}
     */
    connection: {
        value: undefined
    },

    /***************************************************************************
     * Data Object Properties
     */

    // decacheObjectProperties: {
    //     value: function (object, propertyNames) {
    //         return this.rootService.decacheObjectProperties(object, propertyNames);
    //     }
    // },

    // getObjectProperties: {
    //     value: function (object, propertyNames) {
    //         return this.rootService.getObjectProperties(object, propertyNames);
    //     }
    // },

    // updateObjectProperties: {
    //     value: function (object, propertyNames) {
    //         return this.rootService.updateObjectProperties(object, propertyNames);
    //     }
    // },

    /**
     * Fetch the value of a data object's property, possibly asynchronously.
     *
     * The default implementation of this method just return a fulfilled promise
     * for `null`. Subclasses should override this method to perform any fetch
     * or other operation required to get the requested data. The subclass
     * implementations should only use calls to their
     * [root service's]{@link DataService.rootService}
     * [fetchData()]{@link DataService#fetchData} to fetch data.
     *
     * @method
     */
    // fetchObjectProperty: {
    //     value: function (object, propertyName) {
    //         var propertyDescriptor = this._propertyDescriptorForObjectAndName(object, propertyName),
    //             destinationReference = propertyDescriptor && propertyDescriptor.valueDescriptor;
    //         return destinationReference ?   this._fetchObjectPropertyWithPropertyDescriptor(object, propertyName, propertyDescriptor) :
    //                                         this.nullPromise;
    //     }
    // },

    _propertyDescriptorForObjectAndName: {
        value: function (object, propertyName) {
            var objectDescriptor = this.objectDescriptorForObject(object);
            return objectDescriptor && objectDescriptor.propertyDescriptorForName(propertyName);
        }
    },

    _objectDescriptorForObject: {
        value: function (object) {
            var types = this.types,
                objectInfo = Montage.getInfoForObject(object),
                moduleId = objectInfo.moduleId,
                objectName = objectInfo.objectName,
                module, exportName, objectDescriptor, i, n;
            for (i = 0, n = types.length; i < n && !objectDescriptor; i += 1) {
                module = types[i].module;
                exportName = module && types[i].exportName;
                if (module && moduleId === module.id && objectName === exportName) {
                    objectDescriptor = types[i];
                }
            }
            return objectDescriptor;
            // var typeName = object.constructor.TYPE.typeName,
            //     isModel = this.model instanceof Model,
            //     isObjectDescriptor = !isModel && this.model instanceof ObjectDescriptor,
            //     isObjectsObjectDescriptor = isObjectDescriptor && this.model.name === typeName;
            // return  isModel ?                       this.model.objectDescriptorForName(typeName) :
            //     isObjectsObjectDescriptor ?     this.model :
            //         undefined;
        }
    },

    // _fetchObjectPropertyWithPropertyDescriptor: {
    //     value: function (object, propertyName, propertyDescriptor) {
    //         var self = this, moduleId, cachedDescriptor, service = this.rootService;
    //         return propertyDescriptor.valueDescriptor.then(function (objectDescriptor) {
    //             moduleId = [objectDescriptor.module.id, objectDescriptor.exportName].join("/");
    //             cachedDescriptor = self.rootService._moduleIdToObjectDescriptorMap[moduleId];
    //             var selector = DataQuery.withTypeAndCriteria(cachedDescriptor, {
    //                 // snapshot: self._snapshots.get(object),
    //                 source: object,
    //                 relationshipKey: propertyName
    //             });
    //             return service.fetchData(selector);
    //         }).then(function (data) {
    //             return self._mapObjectPropertyValue(object, propertyDescriptor, data);
    //         });
    //         // return this._objectDescriptorTypeForValueDescriptor(propertyDescriptor.valueDescriptor).then(function (type) {
    //         //     var selector = DataQuery.withTypeAndCriteria(type, {
    //         //         snapshot: self._snapshots.get(object),
    //         //         source: object,
    //         //         relationshipKey: propertyName
    //         //     });
    //         //     return service.fetchData(selector);
    //         // }).then(function (data) {
    //         //     return self._mapObjectPropertyValue(object, propertyDescriptor, data);
    //         // });
    //     }
    // },

    _mapObjectPropertyValue: {
        value: function (object, propertyDescriptor, value) {
            var propertyName = propertyDescriptor.name;
            if (propertyDescriptor.cardinality === Infinity) {
                this.spliceWithArray(object[propertyName], value);
            } else {
                object[propertyName] = value[0];
            }

            if (propertyDescriptor.inversePropertyName && value && value[0]) {
                var inverseBlueprint = this._propertyDescriptorForObjectAndName(value[0], propertyDescriptor.inversePropertyName);
                if (inverseBlueprint && inverseBlueprint.cardinality === 1) {
                    value.forEach(function (inverseObject) {
                        inverseObject[propertyDescriptor.inversePropertyName] = object;
                    });
                }
            }
            return value;
        }
    },

    _objectDescriptorTypeForValueDescriptor: {
        value: function (valueDescriptor) {
            return valueDescriptor.then(function (objectDescriptor) {
                return objectDescriptor.module.require.async(objectDescriptor.module.id);
            });
        }
    },

    /***************************************************************************
     * Data Object Creation
     *
     * If there were no mapping available in the app for this record giving use
     * a type/class/condtructor, we should create one ourselves matching what we know.
     * For a REST service it would be the name of the Entity. Otherwise we should be able
     * to treat by ip domain, a type based on concatenation of all keys returned,
     * which would define the "shape"
     *
     */

    // getDataObject: {
    //     value: function (type, data, context, dataIdentifier) {
    //         return this.rootService.getDataObject(type, data, context, dataIdentifier);
    //     }
    // },

    // createDataObject: {
    //     value: function (type) {
    //         return this.rootService.createDataObject(type);
    //     }
    // },

    /***************************************************************************
     * Data Object Changes
     */

    // createdDataObjects: {
    //     get: function () {
    //         return this.rootService.createdDataObjects();
    //     }
    // },

    // changedDataObjects: {
    //     get: function () {
    //         return this.rootService.changedDataObjects();
    //     }
    // },

    /***************************************************************************
     * Fetching Data
     */

    /**
     * Fetch data from this service for its parent. This method should not be
     * called directly by anyone other than this service's parent. Calls to the
     * root service should be made to initiate data fetches.
     *
     * Subclasses may override this method to fetch the requested data, but will
     * usually override [fetchRawData()]{@link RawDataService#fetchRawData}
     * instead.
     *
     * This method must be asynchronous and return as soon as possible even if
     * it takes a while to generate the requested data objects. The data objects
     * can be generated and added to the specified stream at any point after
     * this method is called, even after it returns, with calls to
     * [addData()]{@link DataStream#addData} and
     * [dataDone()]{@link DataStream#dataDone}. Usually this will be done by
     * having [fetchRawData()]{@link RawDataService#fetchRawData} make calls to
     * [addRawData()]{@link RawDataService#addRawData} and
     * [rawDataDone()]{@link RawDataService#rawDataDone}.
     *
     * The default implementation of this method calls
     * [fetchRawData()]{@link RawDataService#fetchRawData}.
     *
     * @method
     * @argument {DataObjectDescriptor|DataQuery}
     *           typeOrSelector        - Defines what data should be returned.
     *                                   If a [type]{@link DataOjectDescriptor}
     *                                   is provided instead of a
     *                                   {@link DataQuery}, a `DataQuery`
     *                                   with the specified type and no
     *                                   [criteria]{@link DataQuery#criteria}
     *                                   will be created and used for the fetch.
     * @argument {?DataStream} stream  - The stream to which the provided data
     *                                   should be added. If no stream is
     *                                   provided a stream will be created and
     *                                   returned by this method.
     * @returns {?DataStream} - The stream to which the fetched data objects
     * were or will be added, whether this stream was provided to or created by
     * this method.
     */
    // fetchData: {
    //     value: function (queryOrType, stream) {
    //         var isSupportedType = queryOrType instanceof DataObjectDescriptor || queryOrType instanceof ObjectDescriptor,
    //             type = isSupportedType && queryOrType,
    //             query = type && DataQuery.withTypeAndCriteria(type) || queryOrType;
    //         stream = stream || new DataStream();
    //         stream.query = query;
    //         this._fetchRawData(stream);
    //         return stream;
    //     }
    // },

    // fetchData: {
    //     value: function (queryOrType, stream) {
    //         var self = this,
    //              isSupportedType = queryOrType instanceof DataObjectDescriptor || queryOrType instanceof ObjectDescriptor,
    //             type = isSupportedType && queryOrType,
    //             query = type && DataQuery.withTypeAndCriteria(type) || queryOrType;
    //         // Set up the stream.
    //         stream = stream || new DataStream();
    //         stream.query = query;
    //             // Use a child service to fetch the data.
    //             var service;
    //             try {
    //                 service = self.childServiceForType(query.type);
    //                 if (service && service!==self) {
    //                     stream = service.fetchData(query, stream) || stream;
    //                     self._dataServiceByDataStream.set(stream, service);
    //                 } else {
    //                     if(typeof self.fetchRawData === "function") {
    //                         self._fetchRawData(stream);
    //                     }
    //                     else {
    //                         throw new Error("Can't fetch data of unknown type - " + query.type.typeName + "/" + query.type.uuid);
    //                     }
    //                 }
    //             } catch (e) {
    //                 stream.dataError(e);
    //             }
    //         // Return the passed in or created stream.
    //         return stream;
    //     }
    // },

    /**
     * Fetch the raw data of this service.
     *
     * This method should not be called directly from anyone other than this
     * service's [fetchData()]{@link RawDataService#fetchData}.
     *
     * Subclasses that don't override
     * [fetchData()]{@link RawDataService#fetchData} should override this method
     * to:
     *
     *   1. Fetch the raw records needed to generate the requested data object.
     *
     *   2. Add those records to the specified stream with calls to
     *      [addRawData()]{@link RawDataService#addRawData}.
     *
     *   3. Indicate that the fetching is done with a call to
     *      [rawDataDone()]{@link RawDataService#rawDataDone}.
     *
     * This method must be asynchronous and return as soon as possible even if
     * it takes a while to obtain the raw data. The raw data can be provided to
     * the service at any point after this method is called, even after it
     * returns, with calls to [addRawData()]{@link RawDataService#addRawData}
     * and [rawDataDone()]{@link RawDataService#rawDataDone}.
     *
     * The default implementation of this method simply calls
     * [rawDataDone()]{@link RawDataService#rawDataDone} immediately.
     *
     * @method
     * @argument {DataStream} stream - The stream to which the data objects
     *                                 corresponding to the raw data should be
     *                                 added. This stream must contain a
     *                                 reference to the selector defining what
     *                                 raw data to fetch.
     */
    // TODO, swizzling the stream's user-land selector for the rawData equivalent is not really
    // practical nor safe, we either need to keep it separately or store it on the stream under
    // rawDataQuery

    // _fetchRawData: {
    //     value: function (stream) {
    //         var self = this;
    //         this.authorizationPromise.then(function (authorization) {
    //             var streamSelector = stream.query;
    //             stream.query = self.mapSelectorToRawDataQuery(streamSelector);
    //             self.fetchRawData(stream);
    //             stream.query = streamSelector;
    //         })
    //     }
    // },

    _fetchRawData: {
        value: function (stream) {
            var self = this,
                childService = this._childServiceForQuery(stream.query),
                query = stream.query;


            if (childService && childService.identifier.indexOf("offline-service") === -1) {
                childService._fetchRawData(stream);
            } else if (query.authorization) {
                stream.query = self.mapSelectorToRawDataQuery(query);
                self.fetchRawData(stream);
                stream.query = query;
            } else if (this.authorizationPolicy === DataService.AuthorizationPolicy.NONE) {
                stream.query = self.mapSelectorToRawDataQuery(query);
                self.fetchRawData(stream);
                stream.query = query;
            } else {
                DataService.authorizationManager.authorizeService(this).then(function(authorization) {
                    self.authorization = authorization;
                    return authorization;
                }).catch(function(error) {
                    console.log(error);
                }).then(function (authorization) {
                    stream.query = self.mapSelectorToRawDataQuery(query);
                    self.fetchRawData(stream);
                    stream.query = query;
                });
            }
        }
    },

    fetchRawData: {
        value: function (stream) {
            this.rawDataDone(stream);
        }
    },

    /**
     * Called through MainService when consumer has indicated that he has lost interest in the passed DataStream.
     * This will allow the RawDataService feeding the stream to take appropriate measures.
     *
     * @method
     * @argument {DataStream} [dataStream] - The DataStream to cancel
     * @argument {Object} [reason] - An object indicating the reason to cancel.
     *
     */
    cancelRawDataStream: {
        value: function (dataStream, reason) {
        }
    },
    /***************************************************************************
     * Saving Data
     */

    /**
     * Subclasses should override this method to delete a data object when that
     * object's raw data wouldn't be useful to perform the deletion.
     *
     * The default implementation maps the data object to raw data and calls
     * [deleteRawData()]{@link RawDataService#deleteRawData} with the data
     * object passed in as the `context` argument of that method.
     *
     * @method
     * @argument {Object} object   - The object to delete.
     * @returns {external:Promise} - A promise fulfilled when the object has
     * been deleted. The promise's fulfillment value is not significant and will
     * usually be `null`.
     */
    deleteDataObject: {
        value: function (object) {
            var record = {};
            this._mapObjectToRawData(object, record);
            return this.deleteRawData(record, object);
        }
    },

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
            // Subclasses must override this.
            return this.nullPromise;
        }
    },

    /**
     * Subclasses should override this method to save a data object when that
     * object's raw data wouldn't be useful to perform the save.
     *
     * The default implementation maps the data object to raw data and calls
     * [saveRawData()]{@link RawDataService#saveRawData} with the data object
     * passed in as the `context` argument of that method.
     *
     * @method
     * @argument {Object} object   - The object to save.
     * @returns {external:Promise} - A promise fulfilled when all of the data in
     * the changed object has been saved. The promise's fulfillment value is not
     * significant and will usually be `null`.
     */
    // saveDataObject: {
    //     value: function (object) {
    //         var record = {};
    //         this._mapObjectToRawData(object, record);
    //         return this.saveRawData(record, object);
    //     }
    // },

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
            // Subclasses must override this.
            return this.nullPromise;
        }
    },

    /***************************************************************************
     * Offline
     */

    /*
     * Returns the [root service's offline status]{@link DataService#isOffline}.
     *
     * @type {boolean}
     */
    isOffline: {
        get: function () {
            return this === this.rootService ? 
                    this.superForGet("isOffline")() : 
                        this.rootService.isOffline;
        }
    },

    /**
     * Called with all the data passed to
     * [addRawData()]{@link RawDataService#addRawData} to allow storing of that
     * data for offline use.
     *
     * The default implementation does nothing. This is appropriate for
     * subclasses that do not support offline operation or which operate the
     * same way when offline as when online.
     *
     * Other subclasses may override this method to store data fetched when
     * online so [fetchData]{@link RawDataSource#fetchData} can use that data
     * when offline.
     *
     * @method
     * @argument {Object} records  - An array of objects whose properties' values
     *                               hold the raw data.
     * @argument {?DataQuery} selector
     *                             - Describes how the raw data was selected.
     * @argument {?} context       - The value that was passed in to the
     *                               [rawDataDone()]{@link RawDataService#rawDataDone}
     *                               call that invoked this method.
     * @returns {external:Promise} - A promise fulfilled when the raw data has
     * been saved. The promise's fulfillment value is not significant and will
     * usually be `null`.
     */
    writeOfflineData: {
        value: function (records, selector, context) {
            // Subclasses should override this to do something useful.
            return this.nullPromise;
        }
    },

    /***************************************************************************
     * Collecting Raw Data
     */

    /**
     * To be called by [fetchData()]{@link RawDataService#fetchData} or
     * [fetchRawData()]{@link RawDataService#fetchRawData} when raw data records
     * are received. This method should never be called outside of those
     * methods.
     *
     * This method creates and registers the data objects that
     * will represent the raw records with repeated calls to
     * [getDataObject()]{@link DataService#getDataObject}, maps
     * the raw data to those objects with repeated calls to
     * [mapRawDataToObject()]{@link RawDataService#mapRawDataToObject},
     * and then adds those objects to the specified stream.
     *
     * Subclasses should not override this method and instead override their
     * [getDataObject()]{@link DataService#getDataObject} method, their
     * [mapRawDataToObject()]{@link RawDataService#mapRawDataToObject} method,
     * their [mapping]{@link RawDataService#mapping}'s
     * [mapRawDataToObject()]{@link RawDataMapping#mapRawDataToObject} method,
     * or several of these.
     *
     * @method
     * @argument {DataStream} stream
     *                           - The stream to which the data objects created
     *                             from the raw data should be added.
     * @argument {Array} records - An array of objects whose properties'
     *                             values hold the raw data. This array
     *                             will be modified by this method.
     * @argument {?} context     - An arbitrary value that will be passed to
     *                             [getDataObject()]{@link RawDataService#getDataObject}
     *                             and
     *                             [mapRawDataToObject()]{@link RawDataService#mapRawDataToObject}
     *                             if it is provided.
     */
    addRawData: {
        value: function (stream, records, context) {
            var offline, object, i, n,
                streamSelectorType = stream.query.type,
                iRecord, iDataIdentifier, result;
            // Record fetched raw data for offline use if appropriate.
            offline = records && !this.isOffline && this._streamRawData.get(stream);
            if (offline) {
                offline.push.apply(offline, records);
            } else if (records && !this.isOffline) {
                this._streamRawData.set(stream, records.slice());
            }
            // Convert the raw data to appropriate data objects. The conversion
            // will be done in place to avoid creating any unnecessary array.
            for (i = 0, n = records && records.length; i < n; i += 1) {
                iRecord = records[i];
                object = this.addOneRawData(stream, iRecord, context, streamSelectorType);
            //     object = this.objectForTypeRawData(streamSelectorType,iRecord,context);
            // //     iDataIdentifier = this.dataIdentifierForTypeRawData(streamSelectorType,iRecord);
            // //     //Record snapshot before we may create an object
            // //     this.recordSnapshot(iDataIdentifier,iRecord);
            // //    //iDataIdentifier argument should be all we need later on
            // //     object = this.getDataObject(streamSelectorType, iRecord, context, iDataIdentifier);
            //     result = this.mapRawDataToObject(iRecord, object, context);
            //     if (result && result instanceof Promise) {
            //         this._addMapDataPromiseForStream(result, stream);
            //     }
                if(object) {
                    records[i] = object;
                    this.callDelegateMethod("rawDataServiceDidAddOneRawData", this,stream,iRecord,object);
                }
            }

            // Add the converted data to the stream.
            stream.addData(records);
        }
    },

    addOneRawData: {
        value: function(stream, rawData, context, _type) {
            var object = this.objectForTypeRawData((_type || stream.query.type), rawData, context),
                result;
            //     iDataIdentifier = this.dataIdentifierForTypeRawData(streamSelectorType,iRecord);
            //     //Record snapshot before we may create an object
            //     this.recordSnapshot(iDataIdentifier,iRecord);
            //    //iDataIdentifier argument should be all we need later on
            //     object = this.getDataObject(streamSelectorType, iRecord, context, iDataIdentifier);
            result = this._mapRawDataToObject(rawData, object, context);
            if (result && result instanceof Promise) {
                this._addMapDataPromiseForStream(result, stream);
            }
            return object;
        }
    },

    _addMapDataPromiseForStream: {
        value: function (promise, stream) {
            if (!this._streamMapDataPromises.has(stream)) {
                this._streamMapDataPromises.set(stream, [promise]);
            } else {
                this._streamMapDataPromises.get(stream).push(promise);
            }
        }
    },

    _streamMapDataPromises: {
        get: function () {
            if (!this.__streamMapDataPromises) {
                this.__streamMapDataPromises = new Map();
            }
            return this.__streamMapDataPromises;
        }
    },

    objectForTypeRawData: {
        value:function(type, rawData, context) {
                var dataIdentifier = this.dataIdentifierForTypeRawData(type,rawData);
                //Record snapshot before we may create an object
                this.recordSnapshot(dataIdentifier, rawData);
               //iDataIdentifier argument should be all we need later on
                return this.getDataObject(type, rawData, context, dataIdentifier);
        }
    },

    _typeIdentifierMap: {
        value: undefined
    },

    //This should belong on the
    //Gives us an indirection layer to deal with backward compatibility.
    dataIdentifierForTypeRawData: {
        value: function (type, rawData) {

            var mapping = this.mappingWithType(type),
                rawDataPrimaryKeys = mapping ? mapping.rawDataPrimaryKeys : null,
                rawDataPrimaryKeysValues,
                dataIdentifier, dataIdentifierMap, primaryKey;
            if(rawDataPrimaryKeys && rawDataPrimaryKeys.length) {

                dataIdentifierMap = this._typeIdentifierMap.get(type);

                if(!dataIdentifierMap) {
                    this._typeIdentifierMap.set(type,(dataIdentifierMap = new Map()));
                }

                for(var i=0, iKey;(iKey = rawDataPrimaryKeys[i]);i++) {
                    rawDataPrimaryKeysValues = rawDataPrimaryKeysValues || [];
                    rawDataPrimaryKeysValues[i] = rawData[iKey];
                }
                if(rawDataPrimaryKeysValues) {
                    primaryKey = rawDataPrimaryKeysValues.join("/");
                    dataIdentifier = dataIdentifierMap.get(primaryKey);
                }

                if(!dataIdentifier) {
                    var typeName = type.typeName /*DataDescriptor*/ || type.name;
                        //This should be done by ObjectDescriptor/blueprint using primaryProperties
                        //and extract the corresponsing values from rawData
                        //For now we know here that MileZero objects have an "id" attribute.
                        dataIdentifier = new DataIdentifier();
                        dataIdentifier.objectDescriptor = type;
                        dataIdentifier.dataService = this;
                        dataIdentifier.typeName = type.name;
                        dataIdentifier._identifier = dataIdentifier.primaryKey = primaryKey;

                        dataIdentifierMap.set(primaryKey,dataIdentifier);
                }
                return dataIdentifier;
            }
            return undefined;
        }
    },

    __snapshot: {
        value: null
    },

    _snapshot: {
        get: function() {
            return this.__snapshot || (this.__snapshot = new Map());
        }
    },


    /**
     * Records the snapshot of the values of record known for a DataIdentifier
     *
     * @private
     * @argument  {DataIdentifier} dataIdentifier
     * @argument  {Object} rawData
     */
    recordSnapshot: {
        value: function (dataIdentifier, rawData) {
            this._snapshot.set(dataIdentifier, rawData);
        }
    },

    /**
     * Removes the snapshot of the values of record for the DataIdentifier argument
     *
     * @private
     * @argument {DataIdentifier} dataIdentifier
     */
   removeSnapshot: {
        value: function (dataIdentifier) {
            this._snapshot.delete(dataIdentifier);
        }
    },

    /**
     * Returns the snapshot associated with the DataIdentifier argument if available
     *
     * @private
     * @argument {DataIdentifier} dataIdentifier
     */
   snapshotForDataIdentifier: {
        value: function (dataIdentifier) {
            return this._snapshot.get(dataIdentifier);
       }
    },

    /**
     * Returns the snapshot associated with the DataIdentifier argument if available
     *
     * @private
     * @argument {DataIdentifier} dataIdentifier
     */
   snapshotForObject: {
        value: function (object) {
            return this.snapshotForDataIdentifier(this.dataIdentifierForObject(object));
        }
    },

    /**
     * To be called once for each [fetchData()]{@link RawDataService#fetchData}
     * or [fetchRawData()]{@link RawDataService#fetchRawData} call received to
     * indicate that all the raw data meant for the specified stream has been
     * added to that stream.
     *
     * Subclasses should not override this method.
     *
     * @method
     * @argument {DataStream} stream - The stream to which the data objects
     *                                 corresponding to the raw data have been
     *                                 added.
     * @argument {?} context         - An arbitrary value that will be passed to
     *                                 [writeOfflineData()]{@link RawDataService#writeOfflineData}
     *                                 if it is provided.
     */
    rawDataDone: {
        value: function (stream, context) {
            var self = this,
                dataToPersist = this._streamRawData.get(stream),
                mappingPromises = this._streamMapDataPromises.get(stream),
                dataReadyPromise = mappingPromises ? Promise.all(mappingPromises) : this.nullPromise;

            if (mappingPromises) {
                this._streamMapDataPromises.delete(stream);
            }

            if (dataToPersist) {
                this._streamRawData.delete(stream);
            }

            dataReadyPromise.then(function (results) {
                return dataToPersist ? self.writeOfflineData(dataToPersist, stream.query, context) : null;
            }).then(function () {
                stream.dataDone();
                return null;
            }).catch(function (e) {
                console.error(e);
            });

        }
    },

    /**
     * Records in the process of being written to streams (after
     * [addRawData()]{@link RawDataService#addRawData} has been called and
     * before [rawDataDone()]{@link RawDataService#rawDataDone} is called for
     * any given stream). This is used to collect raw data that needs to be
     * stored for offline use.
     *
     * @private
     * @type {Object.<Stream, records>}
     */
    _streamRawData: {
        get: function () {
            if (!this.__streamRawData) {
                this.__streamRawData = new WeakMap();
            }
            return this.__streamRawData;
        }
    },

    __streamRawData: {
        value: undefined
    },

    /***************************************************************************
     * Mapping Raw Data
     */

    /**
     * Convert a selector for data objects to a selector for raw data.
     *
     * The selector returned by this method will be the selector used by methods
     * that deal with raw data, like
     * [fetchRawData()]{@link RawDataService#fetchRawData]},
     * [addRawData()]{@link RawDataService#addRawData]},
     * [rawDataDone()]{@link RawDataService#rawDataDone]}, and
     * [writeOfflineData()]{@link RawDataService#writeOfflineData]}. Any
     * [stream]{@link DataStream} available to these methods will have their
     * selector references temporarly replaced by references to the mapped
     * selector returned by this method.
     *
     * The default implementation of this method returns the passed in selector.
     *
     * @method
     * @argument {DataQuery} selector - A selector defining data objects to
     *                                     select.
     * @returns {DataQuery} - A selector defining raw data to select.
     */
    mapSelectorToRawDataQuery: {
        value: function (query) {
            return query;
        }
    },

    mapSelectorToRawDataSelector: {
        value: deprecate.deprecateMethod(void 0, function (selector) {
            return this.mapSelectorToRawDataQuery(selector);
        }, "mapSelectorToRawDataSelector", "mapSelectorToRawDataQuery"),
    },

    /**
     * Convert raw data to data objects of an appropriate type.
     *
     *
     * @todo Make this method overridable by type name with methods like
     * `mapRawDataToHazard()` and `mapRawDataToProduct()`.
     *
     * @method
     * @argument {Object} record - An object whose properties' values hold
     *                             the raw data.
     * @argument {Object} object - An object whose properties must be set or
     *                             modified to represent the raw data.
     * @argument {?} context     - The value that was passed in to the
     *                             [addRawData()]{@link RawDataService#addRawData}
     *                             call that invoked this method.
     */
    mappingForObject: {
        value: function (object) {
            var objectDescriptor = this.objectDescriptorForObject(object),
                mapping = objectDescriptor && this.mappingWithType(objectDescriptor);

            if (!mapping && objectDescriptor) {
                mapping = this._objectDescriptorMappings.get(objectDescriptor);
                if (!mapping) {
                    mapping = BlueprintDataMapping.withBlueprint(objectDescriptor);
                    this._objectDescriptorMappings.set(objectDescriptor, mapping);
                }
            }

            return mapping;
        }
    },

    /**
     * Convert raw data to data objects of an appropriate type.
     *
     * Subclasses should override this method to map properties of the raw data
     * to data objects:
     * @method
     * @argument {Object} record - An object whose properties' values hold
     *                             the raw data.
     * @argument {Object} object - An object whose properties must be set or
     *                             modified to represent the raw data.
     * @argument {?} context     - The value that was passed in to the
     *                             [addRawData()]{@link RawDataService#addRawData}
     *                             call that invoked this method.
     */


    mapRawDataToObject: {
        value: function (rawData, object, context) {
            // return this.mapFromRawData(object, record, context);
        }
    },
    /**
     * Convert raw data to data objects of an appropriate type.
     *
     * Subclasses should override this method to map properties of the raw data
     * to data objects, as in the following:
     *
     *     mapRawDataToObject: {
     *         value: function (object, record) {
     *             object.firstName = record.GIVEN_NAME;
     *             object.lastName = record.FAMILY_NAME;
     *         }
     *     }
     *
     * Alternatively, subclasses can define a
     * [mapping]{@link DataService#mapping} to do this mapping.
     *
     * The default implementation of this method uses the service's mapping if
     * the service has one, and otherwise calls the deprecated
     * [mapFromRawData()]{@link RawDataService#mapFromRawData}, whose default
     * implementation does nothing.
     *
     * @todo Make this method overridable by type name with methods like
     * `mapRawDataToHazard()` and `mapRawDataToProduct()`.
     *
     * @method
     * @argument {Object} record - An object whose properties' values hold
     *                             the raw data.
     * @argument {Object} object - An object whose properties must be set or
     *                             modified to represent the raw data.
     * @argument {?} context     - The value that was passed in to the
     *                             [addRawData()]{@link RawDataService#addRawData}
     *                             call that invoked this method.
     */
    _mapRawDataToObject: {
        value: function (record, object, context) {
            var mapping = this.mappingForObject(object),
                result;

            if (mapping) {
                result = mapping.mapRawDataToObject(record, object, context);
            }

            // TODO: Remove -- should be part of if/else block above.
            if (record) {
                if (result) {
                    var otherResult = this.mapRawDataToObject(record, object, context);
                    if (result instanceof Promise && otherResult instanceof Promise) {
                        result = Promise.all([result, otherResult]);
                    } else if (otherResult instanceof Promise) {
                        result = otherResult;
                    }
                } else {
                    result = this.mapRawDataToObject(record, object, context);
                }
            }

            return result;

        }
    },

    /**
     * Public method invoked by the framework during the conversion from
     * an object to a raw data.
     * Designed to be overriden by concrete RawDataServices to allow fine-graine control
     * when needed, beyond transformations offered by an ObjectDescriptorDataMapping or
     * an ExpressionDataMapping
     *
     * @method
     * @argument {Object} object - An object whose properties must be set or
     *                             modified to represent the raw data.
     * @argument {Object} record - An object whose properties' values hold
     *                             the raw data.
     * @argument {?} context     - The value that was passed in to the
     *                             [addRawData()]{@link RawDataService#addRawData}
     *                             call that invoked this method.
     */
    mapObjectToRawData: {
        value: function (object, record, context) {
            // this.mapToRawData(object, record, context);
        }
    },

    /**
     * @todo Document.
     * @todo Make this method overridable by type name with methods like
     * `mapHazardToRawData()` and `mapProductToRawData()`.
     *
     * @method
     */
    _mapObjectToRawData: {
        value: function (object, record, context) {
            var mapping = this.mappingForObject(object),
                result;

            if (mapping) {
                result = mapping.mapObjectToRawData(object, record, context);
            }

            if (record) {
                if (result) {
                    var otherResult = this.mapObjectToRawData(object, record, context);
                    if (result instanceof Promise && otherResult instanceof Promise) {
                        result = Promise.all([result, otherResult]);
                    } else if (otherResult instanceof Promise) {
                        result = otherResult;
                    }
                } else {
                    result = this.mapObjectToRawData(object, record, context);
                }
            }

            return result;
        }
    },

    // /**
    //  * If defined, used by
    //  * [mapRawDataToObject()]{@link RawDataService#mapRawDataToObject} and
    //  * [mapObjectToRawData()]{@link RawDataService#mapObjectToRawData} to map
    //  * between the raw data on which this service is based and the typed data
    //  * objects which this service provides and manages.
    //  *
    //  * @type {?DataMapping}
    //  */
    // mapping: {
    //     value: undefined
    // },

    _mappingsPromise: {
        get: function () {
            if (!this.__mappingsPromise) {
                this.__mappingsPromise = Promise.all(this.mappings.map(function (mapping) {
                    return mapping.objectDescriptor;
                })).then(function (values) {

                });
            }
            return this.__mappingsPromise;
        }
    },

    _objectDescriptorMappings: {
        get: function () {
            if (!this.__objectDescriptorMappings) {
                this.__objectDescriptorMappings = new Map();
            }
            return this.__objectDescriptorMappings;
        }
    },

    /***************************************************************************
     * Deprecated
     */

    /**
     * @todo Document deprecation in favor of
     * [mapRawDataToObject()]{@link RawDataService#mapRawDataToObject}
     *
     * @deprecated
     * @method
     */
    mapFromRawData: {
        value: function (object, record, context) {
            // Implemented by subclasses.
        }
    },

    /**
     * @todo Document deprecation in favor of
     * [mapObjectToRawData()]{@link RawDataService#mapObjectToRawData}
     *
     * @deprecated
     * @method
     */
    mapToRawData: {
        value: function (object, record) {
            // Implemented by subclasses.
        }
    },

    /**
     * @todo Remove any dependency and delete.
     *
     * @deprecated
     * @type {OfflineService}
     */
    offlineService: {
        value: undefined
    }

});
