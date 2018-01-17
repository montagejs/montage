var StorageDataService = require("data/service/storage-data-service").StorageDataService,
    compile = require("frb/compile-evaluator"),
    DataStream = require("data/service/data-stream").DataStream,
    DataOrdering = require("data/model/data-ordering").DataOrdering,
    DESCENDING = DataOrdering.DESCENDING,
    evaluate = require("frb/evaluate"),
    Map = require("collections/map"),
    Model = require("core/meta/model").Model,
    ModelGroup = require("core/meta/model-group").ModelGroup,
    Promise = require("core/promise").Promise,
    Scope = require("frb/scope"),
    Set = require("collections/set");
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

    _operationsRequirePrimaryKey: {
        value: false
    },
    _operationsShouldAutoIncrement: {
        value: false
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

    registeredModels: {
        get: function () {
            return IndexedDBDataService.registeredModels;
        }
    },

    registerModel: {
        value: function (model) {
            this.registeredModels.add(model);
        }
    },
    unregisterModel: {
        value: function (model) {
            this.registeredModels.delete(model);
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

    provideTransactionForModelStoreNamesMode : {
        value: function (model, storeNames, isReadWrite) {
            console.error("TRANSACTION " + (isReadWrite ? "R/W" : "R/O") + " " + storeNames);//RDW FIXME REMOVE
            var self = this,
                result,
                factory = self.factory;

            if (factory) {
                if (model && storeNames) {
                    var storeNamesArray = Array.isArray(storeNames) ? storeNames
                                                                    : [storeNames],
                        mode = isReadWrite ? 'readwrite'
                                           : 'readonly';

                    result = new Promise(function (resolve, reject) {
                        self._openDatabaseConnection(resolve, reject, factory, model, storeNamesArray, mode);
                    });

                    self.registerModel(model);
                }
                else {
                    if (storeNames) {
                        result = Promise.reject("missing model");
                    }
                    else if (model) {
                        result = Promise.reject("missing storeNames");
                    }
                    else {
                        result = Promise.reject("missing model and storeNames");
                    }
                }
            }
            else {
                result = Promise.reject(new Error("Your environment doesn't support IndexedDB."));
            }

            return result;
        }
    },

    _openDatabaseConnection: {
        value: function (resolve, reject, factory, model, storeNames, mode, version) {
            var name = model.name,
                possibleUpgrade = (version || version === 0),
                request = possibleUpgrade ? factory.open(name, version)//RDW is name used for something clever?
                                          : factory.open(name);

            if (!request) {
                reject(new Error("IndexedDB API not available")); // May happen in Safari private mode
            }
            else {
                request.identifier = "openDatabase";
                request.addEventListener("blocked", this, false);
                request.addEventListener("error", this, false);
                request.addEventListener("success", this, false);
                request.addEventListener("upgradeneeded", this, false);

                request.resolve = resolve;
                request.reject = reject;
                request.model = model;
                request.storeNames = storeNames;
                request.mode = mode;
            }
        }
    },

    _discardEventDecorations: {
        value: function (eventTarget) {
            eventTarget.removeEventListener("abort", this, false);
            eventTarget.removeEventListener("blocked", this, false);
            eventTarget.removeEventListener("close", this, false);
            eventTarget.removeEventListener("error", this, false);
            eventTarget.removeEventListener("success", this, false);
            eventTarget.removeEventListener("upgradeneeded", this, false);
            eventTarget.removeEventListener("versionchange", this, false);

            eventTarget.identifier = undefined;
            eventTarget.resolve = undefined;
            eventTarget.reject = undefined;
            eventTarget.model = undefined;
            eventTarget.storeNames = undefined;
            eventTarget.mode = undefined;
        }
    },
    _discardEventTarget: {
        value: function (eventTarget) {
            this._discardEventDecorations(eventTarget);

            if (eventTarget instanceof IDBDatabase) {
                console.error("CLOSING OPEN CONNECTION");//RDW FIXME REMOVE
                eventTarget.close();
            }
            else if (eventTarget instanceof IDBOpenDBRequest) {
                if (eventTarget.readyState === "done") {
                    var dbResult = eventTarget.result;

                    if (dbResult) {
                        console.error("CLOSING REQUESTED CONNECTION");//RDW FIXME REMOVE
                        dbResult.close();
                    }
                    else { console.error("NOTHING THERE CANNOT CLOSE"); }//RDW FIXME REMOVE
                }
                else { console.error("PENDING CANNOT CLOSE"); }//RDW FIXME REMOVE
            }
        }
    },
    _discardDatabaseConnection: {
        value: function (event) {
            this._discardEventTarget(event.target);
        }
    },

    handleOpenDatabaseBlocked: {
        value: function (event) {
            console.error("REOPEN (BLOCKED) " + event.target.storeNames);//RDW FIXME REMOVE
            // https://stackoverflow.com/questions/23636247/how-long-can-the-server-connection-be-persisted-in-db-js
//            this._rerequestDatabaseConnection(event);
        }
    },
    handleOpenDatabaseError: {
        value: function (event) {
            console.error("REJECT (OPEN DB ERROR) " + event.target.storeNames);//RDW FIXME REMOVE
            var dbRequest = event.target;

            this._discardEventDecorations(dbRequest);

            dbRequest.reject(dbRequest.error);
        }
    },
    handleOpenDatabaseSuccess: {
        value: function (event) {
            var dbRequest = event.target,
                dbResult = dbRequest.result,
                modelOrGroup = dbRequest.model,
                storeNames = dbRequest.storeNames;

            if (this._shouldUpgradeDatabaseForModelOrGroup(dbResult, modelOrGroup, storeNames)) {
                console.error("REOPEN (UPGRADING) " + storeNames);//RDW FIXME REMOVE
                var newVersion = dbResult.version + 1;

                this._rerequestDatabaseConnection(event, newVersion);
            }
            else {
                console.error("****** (SUCCESS) " + storeNames);//RDW FIXME REMOVE
                var resolve = dbRequest.resolve,
                    reject = dbRequest.reject,
                    storeNames = dbRequest.storeNames,
                    mode = dbRequest.mode,
                    transaction;

                this._discardEventDecorations(dbRequest);

                dbResult.identifier = "database";
                dbResult.addEventListener("abort", this, false);
                dbResult.addEventListener("close", this, false);
                dbResult.addEventListener("error", this, false);
                dbResult.addEventListener("versionchange", this, false);

                dbResult.model = modelOrGroup;
                dbResult.resolve = resolve;
                dbResult.reject = reject;
                dbResult.storeNames = storeNames;
                dbResult.mode = mode;

                transaction = dbResult.transaction(storeNames, mode);

                resolve(transaction);
            }
        }
    },
    handleOpenDatabaseUpgradeneeded: {//RDW FIXME create commonly used indexes here
        value: function (event) {
            console.error("****** (UPGRADING)");//RDW FIXME REMOVE
            var dbRequest = event.target,
                dbResult = dbRequest.result,
                modelOrGroup = dbRequest.model;

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
        value: function (dbToCheck, modelOrGroup, storeNamesToCheck) {
            var result = false;

            if (modelOrGroup instanceof ModelGroup) {
                var models = modelOrGroup.models;

                for (iModel in models) {
                    result = this._shouldUpgradeDatabaseForModelOrGroup(dbToCheck, models[iModel], storeNamesToCheck);

                    if (result) {
                        break;
                    }
                }
            }
            else if (modelOrGroup instanceof Model) {
                var modelVersion = modelOrGroup.version;

                if (modelVersion) {
                    result = (modelVersion > dbToCheck.version);
                }

                if (!result) {
                    var existingObjectStoreNames = dbToCheck.objectStoreNames;

                    if (storeNamesToCheck) {
                        for (iStoreName in storeNamesToCheck) {
                            result = !existingObjectStoreNames.contains(storeNamesToCheck[iStoreName]);

                            if (result) {
                                break;
                            }
                        }
                    }
                    else {
                        var objectDescriptorsToCheck = modelOrGroup.objectDescriptors;

                        for (iObjectDescriptor in objectDescriptorsToCheck) {
                            result = !existingObjectStoreNames.contains(this._storeNameForObjectDescriptor(objectDescriptorsToCheck[iObjectDescriptor]));

                            if (result) {
                                break;
                            }
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
                var operationsStoreName = operationsStoreNames[storeNameIndex];

                if (dbToFill.version === 1 && existingObjectStoreNames.contains(operationsStoreName)) {
                    dbToFill.deleteObjectStore(operationsStoreName);
                }

                this._createObjectStore(dbToFill, existingObjectStoreNames, operationsStoreName, this._operationsIndexName, true/*this._operationsShouldAutoIncrement*/);
            }

            for (iObjectDescriptor in objectDescriptors) {
                var objectDescriptor = objectDescriptors[iObjectDescriptor],
                    storeName = this._storeNameForObjectDescriptor(objectDescriptor);

                this._createObjectStore(dbToFill, existingObjectStoreNames, storeName);//RDW FIXME more to do here? specify keyPath? indexes?
            }
        }
    },

    _rerequestDatabaseConnection: {
        value: function (event, shouldIncrementVersion) {
            var eventTarget = event.target;
                model = eventTarget.model,
                resolve = eventTarget.resolve,
                reject = eventTarget.reject,
                newVersion = shouldIncrementVersion,
                storeNames = eventTarget.storeNames,
                mode = eventTarget.mode;

            this._discardDatabaseConnection(event);
            this._openDatabaseConnection(resolve, reject, this.factory, model, storeNames, mode, newVersion);
        }
    },

    handleDatabaseAbort: {//RDW FIXME HERE
        value: function (event) {
            console.error("REOPEN (ABORT) " + event.target.storeNames);//RDW FIXME REMOVE
            this._rerequestDatabaseConnection(event);
        }
    },
    handleDatabaseClose: {
        value: function (event) {
            console.error("REOPEN (CLOSE) " + event.target.storeNames);//RDW FIXME REMOVE
            this._rerequestDatabaseConnection(event);
        }
    },
    handleDatabaseError: {//RDW FIXME HERE
        value: function (event) {
            console.error("REOPEN (ERROR)" + event.target.storeNames);//RDW FIXME REMOVE
            this._rerequestDatabaseConnection(event);
        }
    },
    handleDatabaseVersionchange: {//RDW FIXME HERE
        value: function (event) {
            console.error("REOPEN (VERSIONCHANGE) " + event.target.storeNames);//RDW FIXME REMOVE
            // https://stackoverflow.com/questions/23636247/how-long-can-the-server-connection-be-persisted-in-db-js
//            this._rerequestDatabaseConnection(event);
        }
    },

    /***************************************************************************
     * Fetching Data
     */

    fetchRawData: {
        value: function (stream) {
            var query = stream.query,
                type = query.type,
                objectDescriptor = this._objectDescriptorForType(type);//RDW FIXME hmmm

            query.type = objectDescriptor;

            console.error("FETCHING " + objectDescriptor.name);//RDW FIXME REMOVE
            this._fetchFollowedByOrder(stream);

            return stream;
        }
    },

    _addDataToService: {
        value: function (shouldMap, stream, rawData, context) {
            if (stream && rawData) {
                if (shouldMap) {
                    var rawDataArray = Array.isArray(rawData) ? rawData
                                                            : [rawData];
                    this.addRawData(stream, rawDataArray, context);
                }
                else {
                    stream.addData(rawData);
                }
            }
        }
    },

    _dataDoneToService: {
        value: function (shouldMap, stream, context) {
            if (stream) {
                if (shouldMap) {
                    this.rawDataDone(stream, context);
                }
                else {
                    stream.dataDone();
                }
            }
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
        value: function (stream) {
            var self = this,
                query = stream.query,
                criteria = query.criteria,
                orderings = query.orderings,
                shouldOrder = (orderings && Array.isArray(orderings) && orderings.length),
                streamToUse = stream;

            if (shouldOrder) {
                streamToUse = new DataStream();
                streamToUse.query = query;
            }

            self._fetchTBD(criteria.syntax, criteria.parameters, streamToUse, true);

            if (shouldOrder) {//TODO this ordering maybe doesn't matter, might be able to do in the prior "orderings" block
                streamToUse.then(function (values) {
                    var expression = self._orderingExpression(orderings),
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
        value: function (syntax, parameters, stream, shouldMap) {
            var self = this,
                syntaxType = syntax ? syntax.type
                                    : 'all';

            switch (syntaxType) {
                case 'and':
                case 'not':
                case 'or':
                    self._fetchCompound(syntax, parameters, stream, shouldMap);
                    break;
                default:
                    self._fetchLeaf(syntax, parameters, stream, shouldMap);
                    break;
            }
        }
    },

    _fetchCompound: {
        value: function (syntax, parameters, stream, shouldMap) {
            var self = this;

            switch (syntax.type) {
                case 'and':
                    self._fetchAnd(syntax, parameters, stream, shouldMap);
                    break;
                case 'not':
                    self._fetchNot(syntax, parameters, stream, shouldMap);
                    break;
                case 'or':
                    self._fetchOr(syntax, parameters, stream, shouldMap);
                    break;
                default://TODO may need to generalize this further
                    break;
            }
        }
    },

    _fetchAnd: {
        value: function (syntax, parameters, stream, shouldMap) {
            var self = this,
                streamLeft = DataStream.withTypeOrSelector(stream.query),
                syntaxArgs = syntax.args
                syntaxLeft = syntaxArgs[0];

            self._fetchTBD(syntaxLeft, parameters, streamLeft);

            streamLeft.then(function (valueLeft) {
                var resultLeft = valueLeft,
                    resultLeftLength = resultLeft.length;

                if (resultLeftLength) {
                    var streamRight = DataStream.withTypeOrSelector(stream.query),
                        syntaxRight = syntaxArgs[1];

                    self._fetchTBD(syntaxRight, parameters, streamRight);

                    streamRight.then(function (valueRight) {
                        var resultRight = valueRight,
                            resultRightLength = resultRight.length;

                        if (resultRightLength) {
                            var leftIsShorter = (resultLeftLength < resultRightLength),
                                shorterResult = leftIsShorter ? resultLeft : resultRight,
                                longerResult = leftIsShorter ? resultRight : resultLeft,
                                longerResultJSON = [];

                            // This depends on the fact that the sources are the same for both right and left,
                            // as a poor man's deep object comparison.
                            //TODO maybe this isn't so, if the various subcriteria are not of the same type

                            for (var i = 0, iLongerResult; (iLongerResult = longerResult[i]); i++) {
                                longerResultJSON.push(JSON.stringify(iLongerResult));
                            }

                            longerResult.length = 0;

                            for (var j = 0, jShorterResult; (jShorterResult = shorterResult[j]); j++) {
                                if (longerResultJSON.indexOf(JSON.stringify(jShorterResult)) >= 0) {
                                    self._addDataToService(shouldMap, stream, jShorterResult);
                                }
                            }
                        }

                        self._dataDoneToService(shouldMap, stream);
                    }).catch(function (reason) {
                        stream.dataError(reason);
                    });
                }
                else {
                    self._dataDoneToService(shouldMap, stream);
                }
            }).catch(function (reason) {
                stream.dataError(reason);
            });
        }
    },

    _fetchNot: {
        value: function (syntax, parameters, stream, shouldMap) {
            var self = this,
                syntaxArgs = syntax.args,
                embeddedSyntax = syntaxArgs[0],
                query = stream.query,
                embeddedStream = DataStream.withTypeOrSelector(query);

            self._fetchTBD(embeddedSyntax, parameters, embeddedStream);

            embeddedStream.then(function (embeddedResult) {
                if (embeddedResult && embeddedResult.length) {
                    var type = query.type,
                        model = type.model,
                        storeName = self._storeNameForObjectDescriptor(type),
                        embeddedResultJSON = [];

                    for (var i = 0, iEmbeddedResult; (iEmbeddedResult = embeddedResult[i]); i++) {
                        embeddedResultJSON.push(JSON.stringify(iEmbeddedResult));
                    }

                    self.provideTransactionForModelStoreNamesMode(model, storeName, false).then(function (trans) {//TODO provide a reject handler and a catch handler
                        console.error("+++_NOT " + storeName);//RDW FIXME REMOVE
                        var objectStore = trans.objectStore(storeName),
                            cursorOrigin = objectStore;

                        cursorOrigin.openCursor().onsuccess = function (event) {//TODO might need an onError
                            var cursor = event.target.result;

                            if (cursor) {
                                var currentCursorValue = cursor.value;

                                if (embeddedResultJSON.indexOf(JSON.stringify(currentCursorValue)) < 0) {
                                    self._addDataToService(shouldMap, stream, currentCursorValue);
                                }

                                cursor.continue();
                            }
                            else {
                                console.error("---_NOT (DONE) " + objectStore.name);//RDW FIXME REMOVE
                                self._discardEventTarget(trans.db);
                                self._dataDoneToService(shouldMap, stream);
                            }
                        }
                    });
                }
                else {
                    self._fetchLeaf_all(stream, shouldMap); // nothing to "not" === getAll
                }
            }).catch(function (reason) {
                stream.dataError(reason);
            });
        }
    },

    _fetchOr: {
        value: function (syntax, parameters, stream, shouldMap) {
            var self = this,
                streamLeft = DataStream.withTypeOrSelector(stream.query),
                streamRight = DataStream.withTypeOrSelector(stream.query),
                syntaxArgs = syntax.args,
                syntaxLeft = syntaxArgs[0],
                syntaxRight = syntaxArgs[1];

            self._fetchTBD(syntaxLeft, parameters, streamLeft);
            self._fetchTBD(syntaxRight, parameters, streamRight);

            Promise.all([streamLeft, streamRight]).then(function (values) {
                var valuesSet = new Set();

                values.forEach(v => Array.isArray(v) ? v.forEach(vv => valuesSet.add(JSON.stringify(vv))) : valuesSet.add(JSON.stringify(v)));//TODO replace forEach with a for loop

                values.length = 0;

                valuesSet.forEach(value => self._addDataToService(shouldMap, stream, JSON.parse(value)));//TODO replace forEach with a for loop

                self._dataDoneToService(shouldMap, stream);
            }).catch(function (reason) {
                stream.dataError(reason);
            });
        }
    },

    _fetchLeaf: {
        value: function (syntax, parameters, stream, shouldMap) {
            var self = this;

            if (syntax) {
                switch (syntax.type) {
                    case 'equals':
                    case 'in':
                        self._fetchLeaf_inEquals(syntax, parameters, stream, shouldMap);
                        break;
                    default:
                        self._fetchLeaf_generic(syntax, parameters, stream, shouldMap);
                        break;
                }
            }
            else {
                self._fetchLeaf_all(stream, shouldMap);
            }
        }
    },

    _fetchLeaf_all: {//RDW FIXME this should use objectStore.getAll
        value: function (stream, shouldMap) {
            var self = this,
                type = stream.query.type,
                model = type.model,
                storeName = self._storeNameForObjectDescriptor(type);

            self.provideTransactionForModelStoreNamesMode(model, storeName, false).then(function (trans) {//RDW FIXME provide a reject handler and a catch handler
                console.error("+++_ALL " + storeName);//RDW FIXME REMOVE
                var objectStore = trans.objectStore(storeName),
                    getRequest = objectStore.getAll();

                getRequest.onsuccess = function (event) {
                    self._addDataToService(shouldMap, stream, event.target.result);
                    console.error("---_ALL (DONE) " + objectStore.name);//RDW FIXME REMOVE
                    self._discardEventTarget(trans.db);
                    self._dataDoneToService(shouldMap, stream);
                }
                getRequest.onerror = function (event) {
                    self._discardEventTarget(trans.db);
                    stream.dataError(event.error);
                }
            });
        }
    },

    _fetchLeaf_inEquals: {
        value: function (syntax, parameters, stream, shouldMap) {
            var self = this,
                syntaxArgs = syntax.args,
                leftExpression = syntaxArgs[0],
                leftValue = self._valueForSyntax(leftExpression, parameters),
                rightExpression = syntaxArgs[1],
                rightValue = self._valueForSyntax(rightExpression, parameters),
                indexName = undefined,
                indexNameResult = undefined,
                comparisonValues = undefined;

            if (leftValue) {
                comparisonValues = leftValue['_valueForSyntax'];
                indexNameResult = self._indexNameForSyntax(rightExpression, parameters);
            }//TODO may need to do more than ELSE here
            else {
                comparisonValues = rightValue ? rightValue['_valueForSyntax'] : rightValue;
                indexNameResult = self._indexNameForSyntax(leftExpression, parameters);
            }

            indexName = indexNameResult ? indexNameResult['_indexNameForSyntax'] : indexNameResult;

            if (!indexName || !comparisonValues) {
                self._fetchLeaf_generic(syntax, parameters, stream, shouldMap);
            }
            else if (comparisonValues.length) {
                var type = stream.query.type,
                    model = type.model,
                    storeName = self._storeNameForObjectDescriptor(type);

                self.provideTransactionForModelStoreNamesMode(model, storeName, false).then(function (trans) {//RDW FIXME provide a reject handler and a catch handler
                    console.error("+++_IN= " + storeName);//RDW FIXME REMOVE
                    var objectStore = trans.objectStore(storeName),
                        indexAvailable = indexName ? objectStore.indexNames.contains(indexName)
                                                   : false,
                        cursorOrigin = indexAvailable ? objectStore.index(indexName)
                                                      : objectStore,
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
                                    self._addDataToService(shouldMap, stream, cursor.value);
                                    cursor.continue();
                                }
                                else {
                                    while (currentCursorKey > sortedComparisonValues[scvIndex]) {
                                        scvIndex += 1;

                                        if (scvIndex >= scvLength) {
                                            console.error("---_IN= (DONE) " + objectStore.name);//RDW FIXME REMOVE
                                            self._discardEventTarget(trans.db);
                                            self._dataDoneToService(shouldMap, stream);
                                        }
                                    }

                                    currentComparisonValue = sortedComparisonValues[scvIndex];
                                    cursor.continue(currentComparisonValue);
                                }
                            }
                            else {
                                if (sortedComparisonValues.includes(currentComparisonValue)) {
                                    self._addDataToService(shouldMap, stream, cursor.value);
                                }

                                cursor.continue();
                            }
                        }
                        else {
                            console.error("---_IN= (DONE) " + objectStore.name);//RDW FIXME REMOVE
                            self._discardEventTarget(trans.db);
                            self._dataDoneToService(shouldMap, stream);
                        }
                    }
                });
            }
            else {
                self._dataDoneToService(shouldMap, stream);
            }
        }
    },

    _indexNameForSyntax: {
        value: function (syntax, parameters) {
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
        value: function (syntax, parameters) {
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
        value: function (syntax, parameters, stream, shouldMap) {
            var self = this,
                compiledSyntax = compile(syntax),
                scope = new Scope(),
                type = stream.query.type,
                model = type.model,
                storeName = self._storeNameForObjectDescriptor(type);

            self.provideTransactionForModelStoreNamesMode(model, storeName, false).then(function (trans) {//RDW FIXME provide a reject handler and a catch handler
                console.error("+++_GEN " + storeName);//RDW FIXME REMOVE
                var objectStore = trans.objectStore(storeName),
                    cursorOrigin = objectStore;

                scope.parameters = parameters;

                cursorOrigin.openCursor().onsuccess = function (event) {//TODO might need an onError
                    var cursor = event.target.result;

                    if (cursor) {
                        scope.value = cursor.value;

                        if (compiledSyntax(scope) === true) {
                            self._addDataToService(shouldMap, stream, cursor.value);
                        }

                        cursor.continue();
                    }
                    else {
                        console.error("---_GEN (DONE) " + objectStore.name);//RDW FIXME REMOVE
                        self._discardEventTarget(trans.db);
                        self._dataDoneToService(shouldMap, stream);
                    }
                }
            });
        }
    },

    /***************************************************************************
     * Saving Data
     */

    _updateInStoreForModel: {
        value: function (record, primaryKey, storeName, model, isPartialRecord, isBulkOperation) {
            var self = this;

            return new Promise(function (resolve, reject) {
                self.provideTransactionForModelStoreNamesMode(model, storeName, true).then(function (trans) {
                    console.error("+++_UPD " + storeName);//RDW FIXME REMOVE
                    var objectStore = trans.objectStore(storeName),
                        promises;

                    if (isBulkOperation && Array.isArray(record)) {
                        var usePrimaryKeys = primaryKey && Array.isArray(primaryKey) && primaryKey.length,
                            bulkCount = record.length,
                            primaryKeyValue = undefined;

                        if (usePrimaryKeys && usePrimaryKeys != bulkCount) {
                            throw "primaryKey count " + usePrimaryKeys + " deviates from record count " + bulkCount;
                        }

                        for (var i = 0; i < bulkCount; i++) {
                            promises = promises || [];

                            if (usePrimaryKeys) {
                                primaryKeyValue = primaryKey[i];
                            }

                            promises.push(self._maybeGetThenPutInStore(self, record[i], primaryKeyValue, objectStore, isPartialRecord));
                        }
                    }
                    else {
                        promises = [self._maybeGetThenPutInStore(self, record, primaryKey, objectStore, isPartialRecord)];
                    }

                    if (promises) {
                        return Promise.all(promises).then(function () {
                            console.error("---_UPD (DONE) " + objectStore.name);//RDW FIXME REMOVE
                            self._discardEventTarget(trans.db);
                            resolve(null);
                        }).catch(function (reason) {
                            console.error("---_UPD (CATCH) " + objectStore.name);//RDW FIXME REMOVE
                            self._discardEventTarget(trans.db);
                            reject(reason);
                        });
                    }
                    else {
                        console.error("---_UPD (NADA) " + objectStore.name);//RDW FIXME REMOVE
                        self._discardEventTarget(trans.db);
                        return self.emptyArrayPromise;
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
                var putRequest = primaryKey ? objectStore.put(record, primaryKey)
                                            : objectStore.put(record);

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
                self.provideTransactionForModelStoreNamesMode(model, storeName, true).then(function (trans) {
                    console.error("+++_DEL " + storeName);//RDW FIXME REMOVE
                    var objectStore = trans.objectStore(storeName),
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
                            console.error("---_DEL (DONE) " + objectStore.name);//RDW FIXME REMOVE
                            self._discardEventTarget(trans.db);
                            resolve(null);
                        }).catch(function (reason) {
                            console.error("---_DEL (CATCH)" + objectStore.name);//RDW FIXME REMOVE
                            self._discardEventTarget(trans.db);
                            reject(reason);
                        });
                    }
                    else {
                        console.error("---_DEL (NADA) " + objectStore.name);//RDW FIXME REMOVE
                        self._discardEventTarget(trans.db);
                        return self.emptyArrayPromise;
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

                    operations.forEach(function (operation) {//TODO replace forEach with a for loop
                        var model = operation.dataType.model;

                        if (!modelsToOperations.has(model)) {
                            modelsToOperations.set(model, []);
                        }

                        modelsToOperations.get(model).push(operation);
                    });

                    return Promise.all(modelsToOperations.values().map(function (someOperations) {//TODO replace map with a for loop
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

            if (operations && operations.length) {
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
                self.provideTransactionForModelStoreNamesMode(model, storeName, true).then(function (trans) {
                    console.error("+++_PK " + storeName);//RDW FIXME REMOVE
                    var objectStore = trans.objectStore(storeName),
                        getRequest = objectStore.get(offlinePrimaryKey);

                    getRequest.onsuccess = function (event) {
                        var getResult = event.target.result;

                        if (getResult) {
                            getResult[objectStore.keyPath] = onlinePrimaryKey;

                            self._putInStore(getResult, onlinePrimaryKey, objectStore).then(function () {
                                console.error("---_PK (DONE) " + objectStore.name);//RDW FIXME REMOVE
                                self._discardEventTarget(trans.db);
                                resolve(null);//RDW something other than null?
                            }).catch(function (reason) {
                                console.error("---_PK (CATCH) " + objectStore.name);//RDW FIXME REMOVE
                                self._discardEventTarget(trans.db);
                                reject(reason);
                            });
                        }
                        else {
                            console.error("---_PK (NADA) " + objectStore.name);//RDW FIXME REMOVE
                            self._discardEventTarget(trans.db);
                            reject("no prior record of " + offlinePrimaryKey);
                        }
                    }
                    getRequest.onerror = function (event) {
                        console.error("---_PK (ERROR) " + objectStore.name);//RDW FIXME REMOVE
                        self._discardEventTarget(trans.db);
                        reject(event.error);
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

            for (model in this.registeredModels) {//RDW FIXME figure out if this is an index or a member
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
                self.provideTransactionForModelStoreNamesMode(model, storeName, false).then(function (trans) {
                    var objectStore = trans.objectStore(storeName),
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

    _registeredModels : {
        value: undefined
    },
    registeredModels: {
        get: function () {
            return this._registeredModels || (this._registeredModels = new Set());
        }
    },

    _objectDesciptorsByStoreName: {
        value: undefined
    },
    objectDesciptorsByStoreName: {
        get: function () {
            return this._objectDesciptorsByStoreName || (this._objectDesciptorsByStoreName = new Map());
        }
    }
});
