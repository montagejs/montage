var StorageDataService = require("data/service/storage-data-service").StorageDataService,
    DataStream = require("data/service/data-stream").DataStream,
    Promise = require("core/promise").Promise,
    DataOrdering = require("data/model/data-ordering").DataOrdering,
    DESCENDING = DataOrdering.DESCENDING,
    evaluate = require("frb/evaluate"),
    Map = require("collections/map"),
    Model = require("core/meta/model").Model,
    ModelGroup = require("core/meta/model-group").ModelGroup,
    WeakMap = require("collections/weak-map");
/**
 * TODO: Document
 *
 * !!!!!THIS IS A WORK IN PROGRESS. This is built at the same time as PersistentDataService
 * to test abstraction/specialization together
 *
 * @class
 * @extends StorageDataService
 */
exports.IndexedDBDataService = IndexedDBDataService = StorageDataService.specialize(/** @lends StorageDataService.prototype */ {
    /***************************************************************************
     * Initializing
     */

    constructor: {
        value: function IndexedDBDataService() {
            StorageDataService.call(this);
        }
    },

    /***************************************************************************
     * Serialization
     */

    deserializeSelf: {
        value: function (deserializer) {
            this.super(deserializer);
        }
    },

    /***************************************************************************
     * Basic Properties
     *
     * Private properties are defined where they are used, not here.
     */

    _storeNameSeparator: {
        value: '/'
    },
    _storeNameForObjectDescriptor: {//RDW FIXME this needs to get promoted to StorageDataService
        value: function (objectDescriptor) {
            var storeName = this.super(objectDescriptor);

            IndexedDBDataService.objectDesciptorsByStoreName.set(storeName, objectDescriptor);//RDW FIXME this isn't going to work, if storeName hasn't been generated when we want to handle a dependency

            return storeName;
        }
    },

    /**
     * Benoit: 8/8/2017. We are going to use a single database for an App model-group.//TODO model-group or model? parameter says "model"
     * If a persistent service is used for a single model, no pbm, to workaround possible
     * name conflicts in ObjectDescriptors coming from different packages, we'll use the
     * full moduleId of these ObjectDescriptors to name object stores / tables avoid name conflicts.
     * Even if different databases end up being used, this choice will work as well.
     *
     * This API allows for one subclass to decide to use different databases for storing different
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

    /**
     * returns a Promise that resolves to the object used by the service to
     * store data. This is meant to be an abstraction of the "Database"
     *
     * @returns {Promise}
     */

    databaseByModel: {
        get: function () {
            return IndexedDBDataService.databaseByModel;
        }
    },

    registerDatabaseForModel: {
        value: function (database, model) {
            this.databaseByModel.set(model, database);
        }
    },
    unregisterDatabaseForModel: {
        value: function (model) {
            this.databaseByModel.delete(model);
        }
    },

    _registeredDatabaseForModel: {
        value: function (model) {
            var database = this.provideDatabaseForModel(model);

            this.registerDatabaseForModel(database, model);

            return database;
        }
    },
    _resetDatabaseForModel: {
        value: function (model) {
            this.unregisterDatabaseForModel(model);

            return this._registeredDatabaseForModel(model);
        }
    },

    databaseForModel : {
        value: function (model, objectDescriptor) {
            var database = this.databaseByModel.get(model);

            if (database) {
                var self = this;

                database.then(function (db) {
                    if (objectDescriptor && !db.objectStoreNames.contains(self._storeNameForObjectDescriptor(objectDescriptor))) {
                        console.error("CLOSING FOR " + objectDescriptor.name);//RDW FIXME REMOVE
                        db.close();

                        database = self._resetDatabaseForModel(model);
                    }

                    return database;
                },
                function (reason) {
                    console.error("CLOSING REJECT databaseForModel " + (objectDescriptor ? objectDescriptor.name : "NONSPECIFIC"));//RDW FIXME REMOVE
                    database = self._resetDatabaseForModel(model);

                    return database;
                }).catch(function (reason) {
                    console.error("CLOSING CATCH databaseForModel " + (objectDescriptor ? objectDescriptor.name : "NONSPECIFIC"));//RDW FIXME REMOVE
                    database = self._resetDatabaseForModel(model);

                    return database;
                });
                console.error("RETURNING databaseForModel " + (objectDescriptor ? objectDescriptor.name : "NONSPECIFIC"));//RDW FIXME REMOVE
            }
            else {
                console.error("REGISTERING databaseForModel " + (objectDescriptor ? objectDescriptor.name : "NONSPECIFIC"));//RDW FIXME REMOVE
                database = this._registeredDatabaseForModel(model);
            }

            return database;
        }
    },
    databaseForObjectDescriptor: {
        value: function (objectDescriptor) {
            return this.databaseForModel(objectDescriptor.model, objectDescriptor);
        }
    },

    _invalidateDatabaseForModel: {
        value: function (event) {
            var modelToInvalidate = event.target.result.model,
                self = this;

            // We reject it, in the event that this event is actually settling this Promise.
            // Rejecting the Promise will have no effect on a previously settled Promise.
            // If the Promise was previously fulfilled, we use a fulfillment then() handler to unregister it.

            self.databaseForModel(modelToInvalidate).reject(event).then(function (result) {
                self.unregisterDatabaseForModel(modelToInvalidate);
            });
        }
    },

    _factory: {
        value: undefined
    },
    factory: {
        get: function () {
            return this._factory || (this._factory = global.indexedDB);
        },
        set: function (value) {
            if (value === undefined || value instanceof IDBFactory) {
                this._factory = value;
            }
            else {
                throw "must be instance of IDBFactory";
            }
        }
    },

    provideDatabaseForModel : {
        value: function (model) {
            var factory = this.factory;

            if (factory) {
                var databasePromiseResolve,
                    databasePromiseReject,
                    self = this,
                    database = new Promise(function (resolve, reject) {
                        databasePromiseResolve = resolve;
                        databasePromiseReject = reject;

                        self._openDatabaseConnection(factory, model);
                    });

                database.resolve = databasePromiseResolve;
                database.reject = databasePromiseReject;

                return database;
            }
            else {
                return Promise.reject(new Error("Your environment doesn't support IndexedDB."));
            }
        }
    },

    _openDatabaseConnection: {
        value: function (factory, model, version) {
            var name = model.name,
                possibleUpgrade = (version || version === 0),
                request = possibleUpgrade ? factory.open(name, version)
                                          : factory.open(name);

            if (!request) {
                reject(new Error("IndexedDB API not available")); // May happen in Safari private mode
            }
            else {
                request.identifier = "openDatabase";
                request.addEventListener("blocked", this, false);
                request.addEventListener("close", this, false);
                request.addEventListener("error", this, false);
                request.addEventListener("success", this, false);
                request.addEventListener("upgradeneeded", this, false);

                request.waitingForOpenSuccess = true;
                request.model = model;
            }
        }
    },
    _discardDatabaseConnection: {
        value: function (event) {
            var dbRequest = event.target;

            dbRequest.removeEventListener("abort", this, false);
            dbRequest.removeEventListener("blocked", this, false);
            dbRequest.removeEventListener("error", this, false);
            dbRequest.removeEventListener("success", this, false);
            dbRequest.removeEventListener("upgradeneeded", this, false);
            dbRequest.removeEventListener("versionchange", this, false);
        }
    },

    handleOpenDatabaseBlocked: {
        value: function (event) {
            console.error("BLOCKED");//RDW FIXME REMOVE
            // https://stackoverflow.com/questions/23636247/how-long-can-the-server-connection-be-persisted-in-db-js
            this._invalidateDatabaseConnection(event);
        }
    },
    handleOpenDatabaseClose: {
        value: function (event) {
            console.error("CLOSE");//RDW FIXME REMOVE
            this._invalidateDatabaseConnection(event);
        }
    },
    handleOpenDatabaseError: {
        value: function (event) {
            console.error("OPEN DB ERROR");//RDW FIXME REMOVE
            this._invalidateDatabaseConnection(event);
        }
    },
    handleOpenDatabaseSuccess: {
        value: function (event) {
            var dbRequest = event.target,
                dbResult = dbRequest.result,
                model = dbRequest.model;

            console.error("SUCCESS");//RDW FIXME REMOVE
            if (this._shouldUpgradeDatabaseForModelOrGroup(dbResult, model)) {
                var newVersion = dbResult.version + 1;

                this._discardDatabaseConnection(event);
                this._openDatabaseConnection(this.factory, model, newVersion);
            }
            else {
                dbRequest.waitingForOpenSuccess = false;

                dbResult.identifier = "database";
                dbResult.model = model;

                dbResult.addEventListener("abort", this, false);
                dbResult.addEventListener("error", this, false);
                dbResult.addEventListener("versionchange", this, false);

                this.databaseForModel(model).resolve(dbResult);
            }
        }
    },
//TODO we prob don't want to randomly create indexes bc size limits in IndexedDB ... either the model(s) should hint what indexes to create or we should just create them as we proceed
//TODO or can we build a schema dynamically, as queries come in, then persist it? would need to be able to kick off upgrades, e.g. in IndexedDB
    handleOpenDatabaseUpgradeneeded: {//TODO store commonly used properties on objects, and create indexes for them here
        value: function (event) {
            var dbResult = event.target.result,
                modelOrGroup = event.target.model;

            if (modelOrGroup instanceof ModelGroup) {
                var models = modelOrGroup.models;

                for (iModel in models) {
                    this._createObjectStoresForModel(dbResult, models[iModel]);
                }
            }
            else if (modelOrGroup instanceof Model) {
                this._createObjectStoresForModel(dbResult, modelOrGroup);
            }
            else {
                throw "must be instance of Model or ModelGroup"; 
            }
        }
    },

    _shouldUpgradeDatabaseForModelOrGroup: {
        value: function (dbToCheck, modelOrGroup) {
            var result = false;

            if (modelOrGroup instanceof ModelGroup) {
                var models = modelOrGroup.models;

                for (iModel in models) {
                    result = this._shouldUpgradeDatabaseForModelOrGroup(dbToCheck, models[iModel]);

                    if (result) {
                        break;
                    }
                }
            }
            else if (modelOrGroup instanceof Model) {
                var model = modelOrGroup,
                    modelVersion = model.version;

                if (modelVersion) {
                    result = (modelVersion > dbToCheck.version);
                }

                if (!result) {
                    var existingObjectStoreNames = dbToCheck.objectStoreNames,
                        objectDescriptorsToCheck = modelOrGroup.objectDescriptors;

                    for (iObjectDescriptor in objectDescriptorsToCheck) {
                        result = !existingObjectStoreNames.contains(this._storeNameForObjectDescriptor(objectDescriptorsToCheck[iObjectDescriptor]));

                        if (result) {
                            break;
                        }
                    }
                }
            }
            else {
                throw "must be instance of Model or ModelGroup";
            }

            return result;
        }
    },
    _createObjectStore: {
        value: function (dbToFill, existingObjectStoreNames, storeName, keyPath, shouldAutoIncrement) {
            var newObjectStore = undefined;

            if (!existingObjectStoreNames.contains(storeName)) {
                var options = undefined;

                if (keyPath) {
                    options = { keyPath: keyPath };

                    if (shouldAutoIncrement) {
                        options['autoIncrement'] = true;
                    }
                }

                newObjectStore = dbToFill.createObjectStore(storeName, options);
            }

            return newObjectStore;
        }
    },
    _createObjectStoresForModel: {
        value: function (dbToFill, model) {
            var existingObjectStoreNames = dbToFill.objectStoreNames,
                objectDescriptors = model.objectDescriptors,
                operationsStoreNames = [this._persistentOperationsStoreName, this._offlineOperationsStoreName];

            for (storeNameIndex in operationsStoreNames) {
                this._createObjectStore(dbToFill, existingObjectStoreNames, operationsStoreNames[storeNameIndex], this._operationsIndexName, true);//RDW may not need autoIncrement, if DataOperation is always gonna provide an index anyway
            }

            for (iObjectDescriptor in objectDescriptors) {
                var objectDescriptor = objectDescriptors[iObjectDescriptor],
                    storeName = this._storeNameForObjectDescriptor(objectDescriptor);

                this._createObjectStore(dbToFill, existingObjectStoreNames, storeName);//RDW FIXME more to do here? specify keyPath? indexes?
            }
        }
    },

    _invalidateDatabaseConnection: {
        value: function (event) {
            this._discardDatabaseConnection(event);

            if (!event.target.waitingForOpenSuccess) {
                // If there was a fulfilled Promise before, we need to unregister it.
                this._invalidateDatabaseForModel(event);
            }
        }
    },

    handleDatabaseAbort: {
        value: function (event) {
            console.error("ABORT");//RDW FIXME REMOVE
            this._invalidateDatabaseConnection(event);
        }
    },
    handleDatabaseError: {
        value: function (event) {
            console.error("DB ERROR");//RDW FIXME REMOVE
            this._invalidateDatabaseConnection(event);
        }
    },
    handleDatabaseVersionChange: {
        value: function (event) {
            console.error("VERSIONCHANGE");//RDW FIXME REMOVE
            // https://stackoverflow.com/questions/23636247/how-long-can-the-server-connection-be-persisted-in-db-js
            this._invalidateDatabaseConnection(event);
        }
    },

    /***************************************************************************
     * Fetching Data
     */

    fetchRawData: {
        value: function (stream) {
            var self = this,
                objectDescriptor = stream.query.type;

            self.databaseForModel(objectDescriptor.model, objectDescriptor).then(function (db) {
                console.error("FETCHING " + objectDescriptor.name);//RDW FIXME REMOVE
                self._fetchFollowedByOrder(self, db, stream);
            },
            function (reason) {
                console.error("REJECT ON FETCHING " + objectDescriptor.name);//RDW FIXME REMOVE
                stream.dataError(reason);
            }).catch(function (reason) {
                console.error("CATCH ON FETCHING " + objectDescriptor.name);//RDW FIXME REMOVE
                stream.dataError(reason);
            });

            return stream;
        }
    },

    _orderingExpression: {
        value: function (orderings) {
            var expression = "";

            // Build the combined expression.

            for (var i = 0, iDataOrdering; (iDataOrdering = orderings[i]); i++) {
                var iExpression = iDataOrdering.expression;

                if (expression.length)
                    expression += ".";

                expression += "sorted{";
                expression += iExpression;
                expression += "}";

                if (iDataOrdering.order === DESCENDING) {
                    expression += ".reversed()";
                }
            }

            return expression;
        }
    },

    _fetchFollowedByOrder: {
        value: function (self, db, stream) {
            var query = stream.query,
                criteria = query.criteria,
                orderings = query.orderings,
                shouldOrder = (orderings && Array.isArray(orderings) && orderings.length),
                streamToUse = stream;

            if (shouldOrder) {
                streamToUse = new DataStream();
                streamToUse.query = query;
            }

            self._fetchTBD(self, db, criteria.syntax, criteria.parameters, streamToUse);

            if (shouldOrder) {//TODO this ordering maybe doesn't matter, might be able to do in the prior "orderings" block
                streamToUse.then(function (values) {
                    var expression = self._orderingExpression,
                        results = evaluate(expression, values);

                    stream.addData(results);
                    stream.dataDone();
                }).catch(function (reason) {
                    stream.dataError(reason);
                });
            }
        }
    },

    _fetchTBD: {
        value: function (self, db, syntax, parameters, stream) {
            var syntaxType = syntax ? syntax.type
                                    : 'all';

            switch (syntaxType) {
                case 'and':
                case 'not':
                case 'or':
                    self._fetchCompound(self, db, syntax, parameters, stream);
                    break;
                default:
                    self._fetchLeaf(self, db, syntax, parameters, stream);
                    break;
            }
        }
    },

    _fetchCompound: {
        value: function (self, db, syntax, parameters, stream) {
            switch (syntax.type) {
                case 'and':
                    self._fetchAnd(self, db, syntax, parameters, stream);
                    break;
                case 'not':
                    self._fetchNot(self, db, syntax, parameters, stream);
                    break;
                case 'or':
                    self._fetchOr(self, db, syntax, parameters, stream);
                    break;
                default://TODO may need to generalize this further
                    break;
            }
        }
    },

    _fetchAnd: {
        value: function (self, db, syntax, parameters, stream) {
            var streamLeft = DataStream.withTypeOrSelector(stream.query),
                syntaxArgs = syntax.args
                syntaxLeft = syntaxArgs[0];

            self._fetchTBD(self, db, syntaxLeft, parameters, streamLeft);

            streamLeft.then(function (valueLeft) {
                var resultLeft = valueLeft,
                    resultLeftLength = resultLeft.length;

                if (resultLeftLength > 0) {
                    var streamRight = DataStream.withTypeOrSelector(stream.query),
                        syntaxRight = syntaxArgs[1];

                    self._fetchTBD(self, db, syntaxRight, parameters, streamRight);

                    streamRight.then(function (valueRight) {
                        var resultRight = valueRight,
                            resultRightLength = resultRight.length;

                        if (resultRightLength > 0) {
                            var leftIsShorter = (resultLeftLength < resultRightLength),
                                shorterResult = leftIsShorter ? resultLeft : resultRight,
                                longerResult = leftIsShorter ? resultRight : resultLeft;

                            // This depends on the fact that the sources are the same for both right and left,
                            // as a poor man's deep object comparison.
                            //TODO maybe this isn't so, if the various subcriteria are not of the same type

                            var longerResultJSON = longerResult.map(function (r) { return JSON.stringify(r); });

                            longerResult.length = 0;

                            shorterResult.filter(function (value) {
                                return (longerResultJSON.indexOf(JSON.stringify(value)) >= 0);
                            }).map(function (r) { stream.addData(r); });
                        }

                        stream.dataDone();
                    }).catch(function (reason) {
                        stream.dataError(reason);
                    });
                }
                else {
                    stream.dataDone();
                }
            }).catch(function (reason) {
                stream.dataError(reason);
            });
        }
    },

    _fetchNot: {
        value: function (self, db, syntax, parameters, stream) {
            var syntaxArgs = syntax.args,
                embeddedSyntax = syntaxArgs[0],
                embeddedStream = DataStream.withTypeOrSelector(stream.query);

            self._fetchTBD(self, db, embeddedSyntax, parameters, embeddedStream);

            embeddedStream.then(function (embeddedResult) {
                var storeName = self._storeNameForObjectDescriptor(stream.query.type),
                    trans = db.transaction(storeName, 'readonly'),
                    objectStore = trans.objectStore(storeName),
                    cursorOrigin = objectStore,
                    embeddedResultJSON = embeddedResult.map(function (r) { return JSON.stringify(r); });

                cursorOrigin.openCursor().onsuccess = function (event) {//TODO might need an onError
                    var cursor = event.target.result;

                    if (cursor) {
                        var currentCursorValue = cursor.value;

                        if (embeddedResultJSON.indexOf(JSON.stringify(currentCursorValue)) < 0) {
                            stream.addData(currentCursorValue);
                        }

                        cursor.continue();
                    }
                    else {
                        stream.dataDone();
                    }
                }
            }).catch(function (reason) {
                stream.dataError(reason);
            });
        }
    },

    _fetchOr: {
        value: function (self, db, syntax, parameters, stream) {
            var streamLeft = DataStream.withTypeOrSelector(stream.query),
                streamRight = DataStream.withTypeOrSelector(stream.query),
                syntaxArgs = syntax.args,
                syntaxLeft = syntaxArgs[0],
                syntaxRight = syntaxArgs[1];

            self._fetchTBD(self, db, syntaxLeft, parameters, streamLeft);
            self._fetchTBD(self, db, syntaxRight, parameters, streamRight);

            Promise.all([streamLeft, streamRight]).then(function (values) {
                var valuesSet = new Set();

                values.forEach(v => Array.isArray(v) ? v.forEach(vv => valuesSet.add(JSON.stringify(vv))) : valuesSet.add(JSON.stringify(v)));

                values.length = 0;

                valuesSet.forEach(value => stream.addData(JSON.parse(value)));

                stream.dataDone();
            }).catch(function (reason) {
                stream.dataError(reason);
            });
        }
    },

    _fetchLeaf: {
        value: function (self, db, syntax, parameters, stream) {
            if (syntax) {
                switch (syntax.type) {
                    case 'equals':
                    case 'in':
                        self._fetchLeaf_inEquals(self, db, syntax, parameters, stream);
                        break;
                    default:
                        self._fetchLeaf_generic(self, db, syntax, parameters, stream);
                        break;
                }
            }
            else {
                self._fetchLeaf_all(self, db, stream);
            }
        }
    },

    _fetchLeaf_all: {
        value: function (self, db, stream) {
            var storeName = self._storeNameForObjectDescriptor(stream.query.type),
                trans = db.transaction(storeName, 'readonly'),
                objectStore = trans.objectStore(storeName),
                cursorOrigin = objectStore;

            cursorOrigin.openCursor().onsuccess = function (event) {//TODO might need an onError
                var cursor = event.target.result;

                if (cursor) {
                    var cursorValue = cursor.value;

                    if (cursorValue) {
                        stream.addData(cursorValue);
                    }

                    cursor.continue();
                }
                else {
                    stream.dataDone();
                }
            }
        }
    },

    _fetchLeaf_inEquals: {
        value: function (self, db, syntax, parameters, stream) {
            var syntaxArgs = syntax.args,
                leftExpression = syntaxArgs[0],
                leftValue = self._valueForSyntax(self, leftExpression, parameters),
                rightExpression = syntaxArgs[1],
                rightValue = self._valueForSyntax(self, rightExpression, parameters),
                indexName = undefined,
                indexNameResult = undefined,
                comparisonValues = undefined;

            if (leftValue) {
                comparisonValues = leftValue['_valueForSyntax'];
                indexNameResult = self._indexNameForSyntax(self, rightExpression, parameters);
            }//TODO may need to do more than ELSE here
            else {
                comparisonValues = rightValue['_valueForSyntax'];
                indexNameResult = self._indexNameForSyntax(self, leftExpression, parameters);
            }

            indexName = indexNameResult ? indexNameResult['_indexNameForSyntax'] : indexNameResult;

            if (comparisonValues.length > 0) {
                var storeName = self._storeNameForObjectDescriptor(stream.query.type),
                    trans = db.transaction(storeName, 'readonly'),
                    objectStore = trans.objectStore(storeName),
                    indexAvailable = indexName ? objectStore.indexNames.contains(indexName) : false,
                    cursorOrigin = indexAvailable ? objectStore.index(indexName) : objectStore,
                    sortedComparisonValues = comparisonValues.sort(),
                    scvLength = sortedComparisonValues.length,
                    scvIndex = 0,
                    currentComparisonValue = sortedComparisonValues[scvIndex];

                cursorOrigin.openCursor().onsuccess = function (event) {//TODO might need an onError
                    var cursor = event.target.result;

                    if (cursor) {
                        var currentCursorKey = cursor.key;

                        if (indexAvailable) {
                            if (currentCursorKey == currentComparisonValue) {
                                stream.addData(cursor.value);
                                cursor.continue();
                            }
                            else {
                                while (currentCursorKey > sortedComparisonValues[scvIndex]) {
                                    scvIndex += 1;

                                    if (scvIndex >= scvLength) {
                                        stream.dataDone();
                                    }
                                }

                                currentComparisonValue = sortedComparisonValues[scvIndex];
                                cursor.continue(currentComparisonValue);
                            }
                        }
                        else {
                            if (sortedComparisonValues.includes(currentComparisonValue)) {
                                stream.addData(cursor.value);
                            }

                            cursor.continue();
                        }
                    }
                    else {
                        stream.dataDone();
                    }
                }
            }
            else {
                stream.dataDone();
            }
        }
    },

    _indexNameForSyntax: {
        value: function (self, syntax, parameters) {
            var result = undefined;

            if (syntax.type == 'property') {
                var syntaxArgs = syntax.args;

                if (syntaxArgs[0].type == 'value') {
                    var significantArg = syntaxArgs[1];

                    if (significantArg.type == 'literal') {
                        result = { '_indexNameForSyntax': significantArg.value };
                    }
                    //TODO may need to do more here
                }
            }

            return result;
        }
    },

    _valueForSyntax: {
        value: function (self, syntax, parameters) {
            var result = undefined;

            if (syntax.type == 'literal') {
                result = syntax.value;
            }
            else if (syntax.type == 'property') {
                var syntaxArgs = syntax.args;

                if (syntaxArgs[0].type == 'parameters') {
                    var significantArg = syntaxArgs[1];

                    if (significantArg.type == 'literal') {
                        result = parameters[significantArg.value];
                    }
                    //TODO may need to do more here
                }
            }

            if (result) {
                if (!Array.isArray(result)) {
                    var r = new Array();

                    r.push(result);

                    result = r;
                }

                result = { '_valueForSyntax': result };
            }

            return result;
        }
    },

    _fetchLeaf_generic: {
        value: function (self, db, syntax, parameters, stream) {
            var compiledSyntax = compile(syntax),
                scope = new Scope(),
                storeName = self._storeNameForObjectDescriptor(stream.query.type),
                trans = db.transaction(storeName, 'readonly'),
                objectStore = trans.objectStore(storeName),
                cursorOrigin = objectStore;

            scope.parameters = parameters;

            cursorOrigin.openCursor().onsuccess = function (event) {//TODO might need an onError
                var cursor = event.target.result;

                if (cursor) {
                    scope.value = cursor.value;

                    if (compiledSyntax(scope) === true) {
                        stream.addData(cursor.value);
                    }

                    cursor.continue();
                }
                else {
                    stream.dataDone();
                }
            }
        }
    },

    /***************************************************************************
     * Saving Data
     */

    _updateInStoreForModel: {
        value: function (record, primaryKey, storeName, model, isPartialRecord, isBulkOperation) {
            var self = this;

            return new Promise(function (resolve, reject) {
                self.databaseForModel(model).then(function (db) {
                    if (db.objectStoreNames.contains(storeName)) {
                        var trans = db.transaction(storeName, 'readwrite'),
                            objectStore = trans.objectStore(storeName),
                            promises;

                        if (isBulkOperation && Array.isArray(record) && Array.isArray(primaryKey)) {
                            for (var i = 0, n = primaryKey && primaryKey.length; i < n; i++) {
                                promises = promises || [];
                                promises.push(self._maybeGetThenPutInStore(self, record[i], primaryKey[i], objectStore, isPartialRecord));
                            }
                        }
                        else {
                            promises = [self._maybeGetThenPutInStore(self, record, primaryKey, objectStore, isPartialRecord)];
                        }

                        if (promises) {
                            return Promise.all(promises).then(function () {
                                resolve(null);
                            }).catch(function (reason) {
                                reject(reason);
                            });
                        }
                        else {
                            return self.emptyArrayPromise;
                        }
                    }
                    else {
                        reject("missing store name: " + storeName);
                    }
                },
                function (reason) {
                    reject(reason);
                }).catch(function (reason) {
                    reject(reason);
                });
            });
        }
    },

    _maybeGetThenPutInStore: {
        value: function (self, record, primaryKey, objectStore, isPartialRecord) {
            if (isPartialRecord) {
                return new Promise(function (resolve, reject) {
                    var getRequest = objectStore.get(primaryKey);

                    getRequest.onsuccess = function (event) {
                        var getResult = event.target.result,
                            recordToPut = record;

                        if (getResult && Object.keys(getResult).length) {
                            recordToPut = getResult;
                            Object.assign(recordToPut, record);
                        }

                        self._putInStore(recordToPut, primaryKey, objectStore).then(function () {
                            resolve(null);//RDW something other than null?
                        }).catch(function (reason) {
                            reject(reason);
                        });
                    }
                    getRequest.onerror = function (event) {
                        reject(event.error);
                    }
                });
            }
            else {
                return self._putInStore(record, primaryKey, objectStore);
            }
        }
    },

    _putInStore: {
        value: function (record, primaryKey, objectStore) {
            return new Promise(function (resolve, reject) {
                var putRequest = objectStore.put(record, primaryKey);

                putRequest.onsuccess = function (event) {
                    resolve(null);//RDW something other than null?
                }
                putRequest.onerror = function (event) {
                    reject(event.error);
                }
            });
        }
    },

    _deleteFromStoreForModel: {
        value: function (primaryKey, storeName, model, isBulkOperation) {
            var self = this;

            return new Promise(function (resolve, reject) {
                self.databaseForModel(model).then(function (db) {
                    if (db.objectStoreNames.contains(storeName)) {
                        var trans = db.transaction(storeName, 'readwrite'),
                            objectStore = trans.objectStore(storeName),
                            promises;

                        if (isBulkOperation && Array.isArray(primaryKey)) {
                            for (var i = 0, n = primaryKey && primaryKey.length; i < n; i++) {
                                promises = promises || [];
                                promises.push(self._deleteFromStore(primaryKey[i], objectStore));
                            }
                        }
                        else {
                            promises = [self._deleteFromStore(primaryKey, objectStore)];
                        }

                        if (promises) {
                            return Promise.all(promises).then(function () {
                                resolve(null);
                            }).catch(function (reason) {
                                reject(reason);
                            });
                        }
                        else {
                            return self.emptyArrayPromise;
                        }
                    }
                    else {
                        reject("missing store name: " + storeName);
                    }
                },
                function (reason) {
                    reject(reason);
                }).catch(function (reason) {
                    reject(reason);
                });
            });
        }
    },

    _deleteFromStore: {
        value: function (primaryKey, objectStore) {
            return new Promise(function (resolve, reject) {
                var deleteRequest = objectStore.delete(primaryKey);

                deleteRequest.onsuccess = function (event) {
                    resolve(null);//RDW something other than null?
                }
                deleteRequest.onerror = function (event) {
                    reject(event.error);
                }
            });
        }
    },

    /***************************************************************************
     * Offline
     */

    readOfflineOperations: {
        value: function () {
            return this._fetchFromAllModelsForStoreAndFilter(this._offlineOperationsStoreName,
                                                             IndexedDBDataService._offlineOperationFilter);
        }
    },

    deleteOfflineOperations: {
        value: function (operations) {
            if (operations) {
                if (Array.isArray(operations)) {
                    var self = this,
                        modelsToOperations = {};

                    operations.forEach(function (operation) {
                        var model = operation.dataType.model;

                        if (!modelsToOperations.has(model)) {
                            modelsToOperations.set(model, []);
                        }

                        modelsToOperations.get(model).push(operation);
                    });

                    return Promise.all(modelsToOperations.values().map(function (someOperations) {
                        return self._deleteOfflineOperationsForSingleModel(someOperations);
                    })).then(function () {
                        resolve(null);
                    }).catch(function (reason) {
                        reject(reason);
                    });
                }
                else if (operations instanceof DataOperation) {
                    return this._deleteOfflineOperationsForSingleModel([operations])
                }
                else {
                    throw "unsupported operation: " + operations;
                }
            }
            else {
                return this.nullPromise;
            }
        }
    },

    _deleteOfflineOperationsForSingleModel: {
        value: function (operations) {
            var result = this.nullPromise;

            if (operations && operations.length > 0) {
                var self = this,
                    model = operations[0].dataType.model,
                    operationsStoreName = self._offlineOperationsStoreName,
                    primaryKeys = [];

                for (var i = 0, iOperation; (iOperation = operations[i]); i++) {
                    primaryKeys.push(iOperation[self._operationsIndexName]);
                }

                result = self._deleteFromStoreForModel(primaryKeys, operationsStoreName, model, true);
            }

            return result;
        }
    },

    _fetchOfflinePrimaryKeys: {
        value: function () {
            return this._fetchFromAllModelsForStoreAndFilter(this._offlinePrimaryKeysStoreName);
        }
    },

    _updatePrimaryKey: {
        value: function (offlinePrimaryKey, onlinePrimaryKey, objectDescriptor) {
            var self = this,
                model = objectDescriptor.model,
                storeName = self._storeNameForObjectDescriptor(objectDescriptor);

            return new Promise(function (resolve, reject) {
                self.databaseForModel(model).then(function (db) {
                    if (db.objectStoreNames.contains(storeName)) {
                        var trans = db.transaction(storeName, 'readwrite'),
                            objectStore = trans.objectStore(storeName),
                            getRequest = objectStore.get(offlinePrimaryKey);

                        getRequest.onsuccess = function (event) {
                            var getResult = event.target.result;

                            if (getResult) {
                                getResult[objectStore.keyPath] = onlinePrimaryKey;

                                self._putInStore(getResult, onlinePrimaryKey, objectStore).then(function () {
                                    resolve(null);//RDW something other than null?
                                }).catch(function (reason) {
                                    reject(reason);
                                });
                            }
                            else {
                                reject("no prior record of " + offlinePrimaryKey);
                            }
                        }
                        getRequest.onerror = function (event) {
                            reject(event.error);
                        }
                    }
                    else {
                        reject("missing store name: " + storeName);
                    }
                },
                function (reason) {
                    reject(reason);
                }).catch(function (reason) {
                    reject(reason);
                });
            });
        }
    },

    /***************************************************************************
     * Utilities
     */

    _fetchFromAllModelsForStoreAndFilter: {
        value: function (storeName, filterFunction) {
            var promises,
                results;

            for (model in this.databaseByModel.keys()) {
                promises = promises || [];
                results = results || [];

                promises.push(this._fetchFromModelForStoreAndFilter(model, storeName, filterFunction).then(function(someResults) {
                    for (var i = 0, someResult; (someResult = someResults[i]); i++) {
                        results.push(someResult);
                    }

                    return null;
                }));
            }

            return promises ? Promise.all(promises).then(function () { return results; })
                            : this.emptyArrayPromise;
        }
    },

    _fetchFromModelForStoreAndFilter: {
        value: function (model, storeName, filterFunction) {
            var self = this;

            return new Promise(function (resolve, reject) {
                self.databaseForModel(model).then(function (db) {
                    if (db.objectStoreNames.contains(storeName)) {
                        var trans = db.transaction(storeName, 'readonly'),
                            objectStore = trans.objectStore(storeName),
                            getRequest = objectStore.getAll();

                        getRequest.onsuccess = function (event) {
                            var results = event.target.result;

                            if (Array.isArray(results)) {
                                if (filterFunction) {
                                    results = results.filter(filterFunction);
                                }
                            }
                            else {
                                if (results) {
                                    results = [results];
                                }
                                else {
                                    results = [];
                                }
                            }

                            resolve(results);
                        }
                        getRequest.onerror = function (event) {
                            reject(event.error);
                        }
                    }
                    else {
                        // These may be optional stores, or stores that might be legitimately missing when this fetch occurs.
                        resolve([]);
                    }
                },
                function (reason) {
                    reject(reason);
                }).catch(function (reason) {
                    reject(reason);
                });
            });
        }
    }
}, /** @lends StorageDataService */ {

    _offlineOperationFilter: {
        value: function (offlineOperation) {
            return (offlineOperation && offlineOperation.dataType && !offlineOperation.dataType.isRead);
        }
    },

    // If separate instances of IndexedDBDataService are used, ensure that they know about all of the models.

    _databaseByModel : {
        value: undefined
    },
    databaseByModel: {
        get: function () {
            return this._databaseByModel || (this._databaseByModel = new Map());
        }
    },

    _objectDesciptorsByStoreName: {
        value: undefined
    },
    objectDesciptorsByStoreName: {
        get: function () {
            return this._objectDesciptorsByStoreName || (this._objectDesciptorsByStoreName = new /*Weak*/Map());//RDW FIXME should this be a WeakMap (complains about key here)
        }
    }
});
