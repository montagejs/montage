var Montage = require("core/core").Montage,
    Criteria = require("core/criteria").Criteria;

/**
 * Represents
 *
 * @class
 * @extends external:Montage
 */
exports.DataOperation = Montage.specialize(/** @lends DataOperation.prototype */ {

    /***************************************************************************
     * Constructor
     */

    constructor: {
        value: function DataOperation() {
            this.time = Date.now();
            this.creationIndex = exports.DataOperation.prototype._currentIndex + 1 || 0;
            exports.DataOperation.prototype._currentIndex = this.creationIndex;
        }
    },

    creationIndex: {
        value: undefined
    },

    /***************************************************************************
     * Basic Properties
     */

    /**
     * This should be a composite id made from:
     *
     * clientId/time/hash based on type+operationType+criteria's expression,
     *
     * clientId/time/hash based on type+operationType+criteria's expression,
     *
     * @type {number}
     */
    id: {
        value: undefined
    },

    /**
     * This is a unique clientId (per tab), that's given by the backend to the
     * client's OperationService. This clientId needs then to be passed per
     * operation to allow the server side to leverage it
     *
     * @type {sting}
     */

    clientId: {
        value: undefined
    },

    /**
     * A property used to give a meaningful name to an operation
     *
     * @type {string}
     */
    name: {
        value: undefined
    },
    /**
     *  The type of operation, (TODO: inherited from Event). We sh

     * @type {DataOperation.Type.CREATE|DataOperation.Type.READ|DataOperation.Type.UPDATE|DataOperation.Type.DELETE}
     */
    type: {
        value: undefined
    },

    /**
     *  BENOIT: the module for the DataService that is associated with that operation. It's expected to be the main service for Operations and a specific RawDataService for RawOperation

     * @type {DataOperation.Type.CREATE|DataOperation.Type.READ|DataOperation.Type.UPDATE|DataOperation.Type.DELETE}
     */

    dataServiceModule: {
        value: undefined
    },

     /**
     * returns the data service associated with the operation
     *
     * @type {Promnise}
     */

    dataService: {
        get: function() {

        }
    },

    /**
     * The criteria that qualifies objects this operation applies to.
     * For a create operation it may not apply? missing something?
     * For a read operation it would be the criteria of the DataQuery.
     * For an update, it describes the set of objects to receive the changes
     * carried in this operation. It could be an "or" of primary keys to a more
     * model-related set of property/values.
     * For a delete, it would describes objects to delete.
     * Expected to be a boolean expression to be applied to data
     * objects to determine whether they should be impacted by this operation or not.
     *
     * For modifying one object, we need to be able to build a criteria with the identifier
     * that can be converted back to the primary key by a RawDataService.
     *
     * For example, a DataIdentifier:
     * "montage-data://environment/type/#12AS7507"
     * "m-data://environment/type/#12AS7507"
     * "mdata://environment/type/#12AS7507"
     * "data-id://environment/type/#12AS7507"
     *
     * "montage-data://[dataService.identifier]/[dataService.connectionDescriptor.name || default]/[objectDescriptor.name]/[primaryKey]
     * "montage-data://[dataService.identifier]/[dataService.connectionDescriptor.name || default]/[objectDescriptor.name]/[primaryKey]
     *
     * "identifier = $identifier", {"identifier":"montage-data://[dataService.identifier]/[dataService.connectionDescriptor.name || default]/[objectDescriptor.name]/[primaryKey]}
     * "hazard_ID = #12AS7507"
     *
     * @type {Criteria}
     */
    criteria: {
        get: function () {
            return this._criteria;
        },
        set: function (criteria) {
            this._criteria = criteria;
        }
    },

    _criteria: {
        value: undefined
    },


    /**
     * creationTime
     * A number used to order operations according to when they were created.
     * // Add deprecation of "time" bellow
     * This is initialized when an operation is created to the value of
     * [Date.now()]{@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/now}.
     * The value can then be changed, but it should only be changed to values
     * returned by `Date.now()`.
     *
     * Two operations can have the same `time` value if they were created within
     * a millisecond of each other, and if so the operations'
     * [index]{@link DataOperation#index} can be used to determine which one was
     * created first.
     *
     * @type {number}
     */
    creationTime: {
        value: undefined
    },

    /**
     * An operation that preceded and this one is related to. For a ReadUpdated, it would be the Read operation.
     *
     * @type {DataOperation}
     */
    referrer: {
        value: undefined
    },

    /**
     * Models the agent that created the operation.
     *
     * @type {Object}
     */
    creator: {
        value: undefined
    },

    /**
     * The authorization object representing an authenticated user, like a JWToken.
     *
     * @type {Object}
     */
    authorization: {
        value: undefined
    },

    /**
     * Deprecate?  Make programatic, so that users doesn't have to worry about it.
     *
     * Meant to be unique per agent only
     *
     * A number that is greater than the index values of all operations created
     * before this one in the current application session and less than the
     * index values of all operations created after this one in the current
     * application session.
     *
     * This is initialized when an operation is created to a number that is
     * zero when the application starts up and then automatically incremented.
     * This will provide an appropriate value for this property, and if this
     * value is then changed, care should be taken to ensure it is changed to a
     * value that also satisfies the conditions above.
     *
     * This can be used in conjunction with [time]{@link DataOperation#time} to
     * order operations according to when they were created: An operation will
     * have been created before another operation if and only if the operation's
     * time is before the other's time, or if the times are equal and the
     * operation's index is before the other's index.
     *
     * Assuming it takes more than a millisecond to restart an application or
     * to switch between running instance of an application, it will be
     * impossible for two operations to have both the same `time` value and the
     * same `index` value, so sorting operations as described above will
     * correctly sort them according to when they were created.
     *
     * SHOULD be READ ONLY
     *
     * @type {number}
     */
    index: {
        value: undefined
    },

    /**
     * Benoit: This property's role is a bit fuzzy. context can be changing and arbitrary. Keep??
     * @type {Object}
     */
    context: {
        value: undefined
    },

    /***************************************************************************
     * Data Properties
     */

    /**
     * Benoit: I don't think this is needed as it's covered in a more generic
     * way by the criteria property. Remove?
     *
     * //DataIdentifier:
     * montage-data://environment/type/#12AS7507"
     *
     * 0r just the value: #12AS7507"
     * @type {Object}
     */
    dataIdentifier: {
        value: undefined
    },

    /*
    Might be more straightforward to name this objectDescriptor
    */
    dataType: {
        value: undefined
    },

    /**
     * data is designed to carry the "meat" of an operation's specifics. For a create, it would be all properties
     * of a new object (I'm assuming a create operation is modeling only 1 object's creation).
     * For an update, it has to carry the new values, but also including values replaced,
     * or the values of some key properties that are considered important for the integrity/unicity of an object.
     *
     * Besides new/soon-to-be-previous-values for cardinality:1 properties, relationships (cardinality:n)
     * modifications should additionally support add/remove | (plus/minus in our range change callbacks)
     * on top of replace.  If we use a single DataOperation class for all operation types, this property may
     * end up having various format depending on the operation's type (CRUD,Lock, RPC...)
     *
     * This property also touches on the difference between object-level operation and raw-data operations.
     *
     * //Update
     * {
     *      criteria: "primeryKey = 1234",
     *      type: "moduleId-of-object-desxcriptor"
     *      foo:{
     *          "minus": "Blah Blah",
     *          "plus": "Bleh"
     *      },
     *      "toMany": {
     *          "minus": [object1,object2],
     *          "plus": [object3]
     *      }
     * }
     *
     * //Create
     * {
     *      foo:{
     *          "plus": "Bleh"
     *      },
     *      "toMany": {
     *          "plus": [object1,object2]
     *      }
     * }
     *
     *
     * Or go more for a serialization-like approach:
     * {
     *         "root": {
     *             "prototype": "package/data/main.datareel/model/custom-type",
     *            "values": {
     *               "foo": "Bleh",
     *               "toMany": [
     *                   {"@": "object1"},
     *                   {"@": "object2"}
     *               ]
     *           },
     *          //for update
     *          "previousValues": {
     *                  "foo": "Blah Blah",
     *                  "toMany": []
     *          }
     *       },
     *
     *       "object1": {
     *           "object": "object1-data-identifier"
     *       },
     *
     *       "object2": {
     *           "object": "object2-data-identifier"
     *       }
     *    }
     *
     *
     * What if we used 2 new different operators on top of <-, <->, =, as in:?
     * {
     *      "root": {
     *             "prototype": "package/data/main.datareel/model/custom-type",
     *            "values": {
     *               "foo": {"=":"Bleh"},
     *               "toManyProperty": {
     *                      //We would add the dataService unique objects map in the deserializer's context
     *                      //so that we can reference this objects if they exists.
     *                      //we're missing the index to tell us where the change happens.     *
     *                      "+":"[@identifier1-url,@identifier2-url,@newObject]",
     *                      "-":"[@identifier4-url]",
     *                 },
     *               //Should/could that be done with one expression that roughtl would look like:
     *              "toManyProperty2.splice(index,add,remove)": {"=":"[@change.index,@change.add,@change.remove]"}
     *           }
     *      },
     *      "change": {
     *          "prototype": "Object",
     *          "values": {
     *              "index": "3",
     *              "add": "[@identifier1-url,@identifier2-url,@newObject]",
     *              "remove":"[@identifier4-url]",

     *          }
     *      }
     * }

     *      "newObject": {
     *          "prototype": "module-id",
     *          "values": {
     *              "propA": "A",
     *              "propB": "B"
     *          }
     *      }
     * }

     *
     * //Transaction. For a Transaction, data would contain the list of data operations grouped together.
     * //If data is muted, and observed, it could be dynamically processed by RawDataServices.
     * //The referrer property, which is a pointer to another DatOperaiton would be used by an update/addition
     * //to the transaction
     *
     *
     * @type {Object}
     */
    data: {
        value: undefined
    },

    snapshotData: {
        value: undefined
    },

    /***************************************************************************
     * Deprecated
     */

    /**
     * @todo: Deprecate and remove when appropriate.
     */
    changes: {
        get: function () {
            return this.data;
        },
        set: function (data) {
            this.data = data;
        }
    },

    /**
     * @todo: Deprecate and remove when appropriate.
     */
    lastModified: {
        get: function () {
            return this.time;
        },
        set: function (time) {
            this.time = time;
        }
    }

}, /** @lends DataOperation */ {


    /* Explore the opportunity to add more XHR-like API with events matching the semantic of possible sytmetric operations
        and also promise API that would resolve to the matching operation success/failed
    */

    Type: {

        /*
            Search: is a read operation

        */
        value: {
            Create: {isCreate: true},
            CreateFailed: {isCreate: true},
            CreateCompleted: {isCreate: true},
            CreateCancelled: {isCreate: true},
            //Additional
            Copy: {isCreate: true},
            CopyFailed: {isCreate: true},
            CopyCompleted: {isCreate: true},
            /* Read is the first operation that mnodels a query */
            Read: {isRead: true},

            /* ReadUpdated is pushed by server when a query's result changes due to data changes from others */
            ReadUpdated: {isRead: true},

            /* ReadProgress / ReadUpdate / ReadSeek is used to instruct server that more data is required for a "live" read / query
                Need a better name, and a symetric? Or is ReadUpdated enough if it referes to previous operation
            */
           ReadProgress: {isRead: true}, //ReadUpdate
           ReadUpdate: {isRead: true}, //ReadUpdate

            /* ReadCancel is the operation that instructs baclkend that client isn't interested by a read operastion anymore */
            ReadCancel: {isRead: true},

            /* ReadCanceled is the operation that instructs the client that a read operation is canceled */
            ReadCanceled: {isRead: true},

             /* ReadFailed is the operation that instructs the client that a read operation has failed canceled */
            ReadFailed: {isRead: true},
            /* ReadCompleted is the operation that instructs the client that a read operation has returned all available data */
            ReadCompleted: {isRead: true},
            Update: {isUpdate: true},
            UpdateCompleted: {isUpdate: true},
            UpdateFailed: {isUpdate: true},
            UpdateCanceled: {isUpdate: true},
            Delete: {isDelete: true},
            DeleteCompleted: {isDelete: true},
            DeleteFailed: {isDelete: true},
            /* Lock models the ability for a client to prevent others to make changes to a set of objects described by operation's criteria */
            Lock: {isLock: true},
            LockCompleted: {isLock: true},
            LockFailed: {isLock: true},
            /* RemmoteProcedureCall models the ability to invoke code logic on the server-side, being a DB StoredProcedure, or an method/function in a service */
            RemoteProcedureCall: {isRemoteProcedureCall: true},
            RemoteProcedureCallCompleted: {isRemoteProcedureCall: true},
            RemoteProcedureCallFailed: {isRemoteProcedureCall: true}

            /* Batch models the ability to group multiple operation. If a referrer is provided
                to a BeginTransaction operation, then the batch will be executed within that transaction  */
            /*
            Batch: {isBatch: true},
            BatchCompleted: {isBatch: true},
            BatchFailed: {isBatch: true},
            */
            /* A transaction is a unit of work that is performed against a database.
            Transactions are units or sequences of work accomplished in a logical order.
            A transactions begins, operations are grouped, then it is either commited or rolled-back*/
           /* Start/End Open/Close, Commit/Save, rollback/cancel
            BeginTransaction: {isTransaction: true},
            BeginTransactionCompleted: {isTransaction: true},
            BeginTransactionFailed: {isTransaction: true},

            CommitTransaction: {isTransaction: true},
            CommitTransactionCompleted: {isTransaction: true},
            CommitTransactionFailed: {isTransaction: true},

            RollbackTransaction: {isTransaction: true},
            RollbackTransactionCompleted: {isTransaction: true},
            RollbackTransactionFailed: {isTransaction: true},

            */
        }
    }

    /*
        For update, needs to model:
            - property value changed, needed for properties with cardinality 1 or n
            - property added / removed for properties with cardinality n

            - snapshot of known values that changed?
    */

});

