var PersistentDataService = require("data/service/persistent-data-service").PersistentDataService,
    DataStream = require("data/service/data-stream").DataStream,
    DataOperation= require("data/service/data-operation").DataOperation,
    Promise = require("core/promise").Promise,
    uuid = require("core/uuid"),
    DataOrdering = require("data/model/data-ordering").DataOrdering,
    DESCENDING = DataOrdering.DESCENDING,
    evaluate = require("frb/evaluate"),
    Map = require("collections/map"),
    OfflineService;
/**
 * TODO: Document
 *
 * !!!!!THIS IS A WORK IN PROGRESS. This is built at the same time as PersistentDataService
 * to test abstraction/specialization together
 *
 * @class
 * @extends RawDataService
 */
exports.IndexedDBDataService = PersistentDataService.specialize(/** @lends PersistentDataService.prototype */ {

    /***************************************************************************
     * Initializing
     */

    constructor: {
        value: function PersistentDataService() {
            PersistentDataService.call(this);
        }
    },

    deserializeSelf: {
        value:function (deserializer) {
            this.super(deserializer);
        }
    },

    _db : {
        value: undefined
    },


    provideDatabaseForModel : {
        value: function(model) {
            var databasePromiseResolve,
                databasePromiseReject,
                self = this,
                database = new Promise(function(resolve, reject) {
                    databasePromiseResolve = resolve;
                    databasePromiseReject = reject;
                    var request = window.indexedDB.open(model.name, model.version);
                    if (!request) {
                        reject(new Error("IndexedDB API not available")); // May happen in Safari private mode
                    }
                    else {
                        request.identifier = "openDatabase";
                        request.model = model;
                        request.addEventListener("upgradeneeded",self,false);
                        // request.addEventListener("complete",this,false);
                        // request.addEventListener("abort",this,false);
                        request.addEventListener("success",self,false);
                        request.addEventListener("error",self,false);
                        request.addEventListener("blocked",self,false);
                        // request.addEventListener("versionchange",this,false);
                        // request.addEventListener("close",this,false);
                    }

            });
            database.resolve = databasePromiseResolve;
            database.reject = databasePromiseReject;

            return database;
        }
    },

    _storage : {
        value: undefined
    },
    storage : {
        get: function() {
            if(!this._storage) {
                if (!global.indexedDB) {
                    this._storage = Promise.reject(new Error("Your environment doesn't support IndexedDB."));
                }
                else {
                    this._storage = this.storagePromiseForNameVersion(this.model.name,this.model.version);
                }
            }
            return this._storage;
        }
    },
    /**
     * Returns a Promise for the persistence storage used to store objects
     * described by the objectDescriptor passed as an argument.
     *
     * may need to introduce an _method used internally to minimize
     * use of super()
     *
     * @argument {ObjectDescriptor} stream
     * @returns {Promise}
     */
    provideStorageForObjectDescriptor: {
        value: function(objectDescriptor) {
           return this.storagePromiseForNameVersion(objectDescriptor.model.name,objectDescriptor.model.version);
        }
    },

    handleOpenDatabaseError: {
        value: function(event) {
            this.databaseForModel(event.target.model).reject(event);
        }
    },
    handleOpenDatabaseBlocked: {
        value: function(event) {
            this.databaseForModel(event.target.model).reject(event);
        }
    },
    handleOpenDatabaseSuccess: {
        value: function(event) {
            this._db = event.target.result;
            this.databaseForModel(event.target.model).resolve(this._db);
        }
    },
    handleOpenDatabaseUpgradeneeded: {
        value: function(event) {
            //TODO
            this.databaseForModel(event.target.model).reject(event);
        }
    },

   schema : {
        value: void 0
    }

    });
