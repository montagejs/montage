var DataService = require("data/service/data-service").DataService,
    compile = require("frb/compile-evaluator"),
    DataMapping = require("data/service/data-mapping").DataMapping,
    DataIdentifier = require("data/model/data-identifier").DataIdentifier,
    Deserializer = require("core/serialization/deserializer/montage-deserializer").MontageDeserializer,
    Map = require("collections/map"),
    Montage = require("montage").Montage,
    parse = require("frb/parse"),
    Scope = require("frb/scope"),
    WeakMap = require("collections/weak-map"),
    deprecate = require("core/deprecate"),
    parse = require("frb/parse"),
    Scope = require("frb/scope"),
    compile = require("frb/compile-evaluator"),
    Promise = require("core/promise").Promise;

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
            this._descriptorToRawDataTypeMappings = new Map();
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
     * Fetching Data
     */

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


    _fetchRawData: {
        value: function (stream) {
            var self = this,
                childService = this._childServiceForQuery(stream.query),
                query = stream.query;

            //TODO [TJ] Determine purpose of this check...
            // if (childService && childService.identifier.indexOf("offline-service") === -1) {
            //     childService._fetchRawData(stream);
            // } else
            if (childService && childService !== this) {
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
    }
});
