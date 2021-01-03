var Montage = require("core/core").Montage,
    MutableEvent = require("core/event/mutable-event").MutableEvent,
    ModuleObjectDescriptor = require("core/meta/module-object-descriptor").ModuleObjectDescriptor,
    Criteria = require("core/criteria").Criteria,
    Enum = require("core/enum").Enum,
    uuid = require("core/uuid"),
    defaultEventManager = require("../../core/event/event-manager").defaultEventManager,
    DataOperationType,

    /* todo: we shpuld add a ...timedout for all operations. */
    dataOperationTypes = [
        "noop",
        "connect",
        "disconnect",
        "create",
        /*
            Request to cancel a previous create operation, dispatched by the actor that dispatched the matching create
        */
        "createCancel",
        "createFailed",
        "createCompleted",
        "createCancelled",
        //Additional
        "copy",
        "copyFailed",
        "copyCompleted",
        /* Read is the first operation that models a query */
        "read",

        /* ReadUpdated is pushed by server when a query's result changes due to data changes from others */
        "readUpdated",

        /* ReadProgress / ReadUpdate / ReadSeek is used to instruct server that more data is required for a "live" read / query
            Need a better name, and a symetric? Or is ReadUpdated enough if it referes to previous operation
        */
        "readProgress", //ReadUpdate
        "readUpdate", //ReadUpdate

        /* ReadCancel is the operation that instructs baclkend that client isn't interested by a read operastion anymore */
        "readCancel",

        /* ReadCanceled is the operation that instructs the client that a read operation is canceled */
        "readCanceled",

         /* ReadFailed is the operation that instructs the client that a read operation has failed canceled */
        "readFailed",
        /* ReadCompleted is the operation that instructs the client that a read operation has returned all available data */
        "readCompleted",
        /* Request to update data, used either by the client sending the server or vice versa */
        "update",
        /* Confirmation that a Request to update data, used either by the client sending the server or vice versa*, has been completed */
        "updateCompleted",
        /* Confirmation that a Request to update data, used either by the client sending the server or vice versa*, has failed */
        "updateFailed",
        /* Request to cancel an update, used either by the client sending the server or vice versa */
        "updateCancel",
        /* Confirmation that a Request to cancel an update data, used either by the client sending the server or vice versa*, has completed */
        "updateCanceled",

        "merge",
        /*
            Request to cancel a previous create operation, dispatched by the actor that dispatched the matching create
        */
        "mergeCancel",
        "mergeFailed",
        "mergeCompleted",
        "mergeCancelled",

        "delete",
        "deleteCompleted",
        "deleteFailed",

        /* Lock models the ability for a client to prevent others to make changes to a set of objects described by operation's criteria */
        "lock",
        "lockCompleted",
        "lockFailed",

        /* Unlock models the ability for a client to prevent others to make changes to a set of objects described by operation's criteria */
        "unlock",
        "unlockCompleted",
        "unlockFailed",

        /*
            RemmoteProcedureCall models the ability to invoke code logic on the server-side, being a DB StoredProcedure, or an method/function in a service
        */
        "remoteInvocation", /* Execute ? */
        "remoteInvocationCompleted",  /* ExecuteCompleted ? */
        "remoteInvocationFailed", /* ExecuteFailed ? */

        /*
            Batch models the ability to group multiple operation. If a referrer is provided
            to a BeginTransaction operation, then the batch will be executed within that transaction
        */
        "batch",
        "batchUpdate",
        "batchCompleted",
        "batchFailed",

        /*
            A transaction is a unit of work that is performed atomically against a database.
            Transactions are units or sequences of work accomplished in a logical order.
            A transactions begins, operations are grouped, then it is either commited or rolled-back
        */
        /*
            begin/commit, Start/End Open/Close, Commit/Save, rollback/cancel

            as a lower-case event name, committransaction is hard to read, perform is equally easy to understand
            and less technical.

            so settling on create transaction and perform/rollback transaction
        */
        "createTransaction",
        /* I don't think there's such a thing, keeping for symetry for now */
        "createTransactionCompleted",

        /* Attempting to create a transaction within an existing one will fail */
        "createTransactionFailed",

        "transactionUpdated",
        "transactionCancelled",

        "createSavePoint",

        "performTransaction",
        "performTransactionProgress",
        "performTransactionCompleted",
        "performTransactionFailed",

        "rollbackTransaction",
        "rollbackTransactionCompleted",
        "rollbackTransactionFailed",

        /*
            operations used for the bottom of the stack to get information from a user.
            This useful for authenticating a user, refreshing a password,
            could be used to coordinate and solve data conflicts if an update realizes
            one of the values to change has been changed by someone else in the meantime.
            Maybe to communicate data validation, like a field missing, or a value that
            isn't correct. Such validations could then be run server side or in a
            web/service worker on the client.

            Data components shpuld add themselves as listeners to the data service for events/
            data operations like that they know how to deal with / can help with.
        */
        "userAuthentication",
        "userAuthenticationUpdate",
        "userAuthenticationCompleted",
        "userAuthenticationFailed",
        "userAuthenticationTimedout",
        "userInput",
        "userInputCompleted",
        "userInputFailed",
        "userInputCanceled",
        "userInputTimedout",

        /*
            Modeling validation operation, either executed locally or server-side.
            This can be used for expressing that a password value is wrong, that an account
            isn't confirmed with the Identity authority
            that a mandatory value is missing, etc...


        */
        "validate",
        "validateFailed",
        "validateCompleted",
        "validateCancelled"
    ];



exports.DataOperationType = DataOperationType = new Enum().initWithMembersAndValues(dataOperationTypes,dataOperationTypes);

/**
 * Represents
 *
 * @class
 * @extends external:Montage
 */
exports.DataOperation = MutableEvent.specialize(/** @lends DataOperation.prototype */ {

    /***************************************************************************
     * Constructor
     */

    constructor: {
        value: function DataOperation() {
            this.timeStamp = performance.now();
            this.id = uuid.generate();
            this.constructionIndex = exports.DataOperation.prototype.constructionSequence++;
            exports.DataOperation.prototype.constructionSequence = this.constructionIndex;
        }
    },

    constructionSequence: {
        value: 0
    },

    _mainService: {
        value: 0
    },

    mainService: {
        get: function() {
            return this._mainService || (this.constructor.prototype._mainService = defaultEventManager.application && defaultEventManager.application.mainService)
        }
    },


    bubbles: {
        value: true
    },

    defaultPrevented: {
        value: false
    },

    serializeSelf: {
        value:function (serializer) {
            serializer.setProperty("id", this.id);
            //serializer.setProperty("type", DataOperationType.intValueForMember(this.type));
            serializer.setProperty("type", this.type);
            serializer.setProperty("timeStamp", this.timeStamp);

            if(this.target) {
                if(Array.isArray(this.target)) {
                    serializer.setProperty("targetModuleId", this.target.map((objectDescriptor) => {return typeof objectDescriptor === "string" ? objectDescriptor : objectDescriptor.module.id}));
                } else {
                    if(this.target instanceof ModuleObjectDescriptor) {
                        serializer.setProperty("targetModuleId", this.target.module.id);
                    } else {
                        //This is not working as I thought it would yet
                        //We use DataService.mainService as the target for transaction related operations. That should really be the model.
                        //serializer.addObjectReference(this.target);
                        serializer.setProperty("targetModuleId", null);
                    }
                }
            }
            if(this.referrerId) {
                serializer.setProperty("referrerId", this.referrerId);
            }
            if(this.clientId) {
                serializer.setProperty("clientId", this.clientId);
            }
            serializer.setProperty("criteria", this._criteria);
            /*
                Hack: this is neededed for now to represent a query's fetchLimit
                But it's really relevant only for a read operation....
                TODO: Needs to sort this out better...

            */
            if(this.readLimit) {
                serializer.setProperty("readLimit", this.readLimit);
            }
            if(this.data) {
                serializer.setProperty("data", this.data);
            }
            if(this.snapshot) {
                serializer.setProperty("snapshot", this.snapshot);
            }
        }
    },
    deserializeSelf: {
        value:function (deserializer) {
            var value;
            value = deserializer.getProperty("id");
            if (value !== void 0) {
                this.id = value;
            }

            value = deserializer.getProperty("type");
            if (value !== void 0) {
                this.type = DataOperationType[value];
            }

            value = deserializer.getProperty("timeStamp");
            if (value !== void 0) {
                this.timeStamp = value;
            }
            /* keeping dataDescriptor here for temporary backward compatibility */
            value = deserializer.getProperty("target") || deserializer.getProperty("targetModuleId") || deserializer.getProperty("dataDescriptor");
            if (value !== void 0) {
                if(Array.isArray(value)) {
                    this.target = value.map((objectDescriptorModuleIid) => {return this.mainService.objectDescriptorWithModuleId(objectDescriptorModuleIid)});
                } else if(typeof value === "string") {

                    if(this.mainService) {
                        if(value === null) {
                            this.target = this.mainService
                        } else {
                            this.target = this.mainService.objectDescriptorWithModuleId(value);
                        }
                    } else {
                        //Last resort, if we can't construct the target, let's carry the data that was supposed to help us do so
                        this.targetModuleId = value;
                    }
                } else {
                    this.target = value;
                }
            }

            value = deserializer.getProperty("referrerId");
            if (value !== void 0) {
                this.referrerId = value;
            }
            value = deserializer.getProperty("clientId");
            if (value !== void 0) {
                this.clientId = value;
            }

            value = deserializer.getProperty("criteria");
            if (value !== void 0) {
                this.criteria = value;
            }

            value = deserializer.getProperty("data");
            if (value !== void 0) {
                this.data = value;
            }

            value = deserializer.getProperty("snapshot");
            if (value !== void 0) {
                this.snapshot = value;
            }

        }
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

    identifier: {
        get: function() {
            return this.id;
        }
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
     * An operation that preceded and this one is related to. For a ReadUpdated, it would be the Read operation.
     *
     * @type {DataOperation}
     */
    referrer: {
        value: undefined
    },

    /**
     * An operation that preceded and this one is related to. For a ReadUpdated, it would be the Read operation.
     *
     * @type {String}
     */
    referrerId: {
        value: undefined
    },

    /**
     * The identifier of an operation that preceded and this one is related to. For a ReadUpdated, it would be the Read operation.
     *
     * @type {DataOperation}
     */
    referrerIdentifier: {
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
     * The userIdentity object representing the authenticated user.
     *
     * @type {Object}
     */
    userIdentity: {
        value: undefined
    },

    /**
     * a message about the operation meant for the user.
     *
     * @type {Object}
     */
    userMessage: {
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
    constructionIndex: {
        value: undefined
    },

    /**
     * Information about the context surrounding the data operation
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
            NoOp: DataOperationType.noop,
            Connect: DataOperationType.connect,
            Disconnect: DataOperationType.disconnect,
            Create: DataOperationType.create,
            CreateFailed: DataOperationType.createFailed,
            CreateCompleted: DataOperationType.createCompleted,
            CreateCancelled: DataOperationType.createCancelled,

            Copy: DataOperationType.copy,
            CopyFailed: DataOperationType.copyFailed,
            CopyCompleted: DataOperationType.copyCompleted,

            Read: DataOperationType.read,
            ReadUpdated: DataOperationType.readUpdated,
            ReadProgress: DataOperationType.readProgress, //ReadUpdate
            ReadUpdate: DataOperationType.readUpdate, //ReadUpdate
            ReadCancel: DataOperationType.readCancel,
            ReadCanceled: DataOperationType.readCanceled,
            ReadFailed: DataOperationType.readFailed,
            ReadCompleted: DataOperationType.readCompleted,

            Update: DataOperationType.update,
            UpdateCompleted: DataOperationType.updateCompleted,
            UpdateFailed: DataOperationType.updateFailed,
            UpdateCancel: DataOperationType.updateCancel,
            UpdateCanceled: DataOperationType.updateCanceled,

            Merge: DataOperationType.merge,
            MergeCancel: DataOperationType.mergeCancel,
            MergeFailed: DataOperationType.mergeFailed,
            MergeCompleted: DataOperationType.mergeCompleted,
            MergeCancelled: DataOperationType.mergeCancelled,

            Delete: DataOperationType.delete,
            DeleteCompleted: DataOperationType.deleteCompleted,
            DeleteFailed: DataOperationType.deleteFailed,

            Lock: DataOperationType.lock,
            LockCompleted: DataOperationType.lockCompleted,
            LockFailed: DataOperationType.lockFailed,

            RemoteProcedureCall: DataOperationType.remoteInvocation,
            RemoteProcedureCallCompleted: DataOperationType.remoteInvocationCompleted,
            RemoteProcedureCallFailed: DataOperationType.remoteInvocationFailed,
            RemoteInvocation: DataOperationType.remoteInvocation,
            RemoteInvocationCompleted: DataOperationType.remoteInvocationCompleted,
            RemoteInvocationFailed: DataOperationType.remoteInvocationFailed,

            UserAuthentication: DataOperationType.userAuthentication,
            UserAuthenticationUpdate: DataOperationType.userAuthenticationUpdate,
            UserAuthenticationCompleted: DataOperationType.userAuthenticationCompleted,
            UserAuthenticationFailed: DataOperationType.userAuthenticationFailed,
            UserAuthenticationTimedout: DataOperationType.userAuthenticationTimedout,

            UserInput: DataOperationType.userInput,
            UserInputCompleted: DataOperationType.userInputCompleted,
            UserInputFailed: DataOperationType.userInputFailed,
            UserInputCanceled: DataOperationType.userInputCanceled,
            UserInputTimedOut: DataOperationType.userInputTimedout,

            Validate: DataOperationType.validate,
            ValidateFailed: DataOperationType.validateFailed,
            validateCompleted: DataOperationType.validateCompleted,
            validateCancelled: DataOperationType.validateCancelled,

            Batch: DataOperationType.batch,
            BatchUpdate: DataOperationType.batchUpdate,
            BatchCompleted: DataOperationType.batchCompleted,
            BatchFailed: DataOperationType.batchFailed,

            CreateTransaction: DataOperationType.createTransaction,
            CreateTransactionCompleted: DataOperationType.createTransactionCompleted,
            CreateTransactionFailed: DataOperationType.createTransactionFailed,

            TransactionUpdated: DataOperationType.transactionUpdated,


            CreateSavePoint: DataOperationType.createSavePoint,

            PerformTransaction: DataOperationType.performTransaction,
            PerformTransactionProgress: DataOperationType.performTransactionProgress,
            PerformTransactionCompleted: DataOperationType.performTransactionCompleted,
            PerformTransactionFailed: DataOperationType.performTransactionFailed,

            RollbackTransaction: DataOperationType.rollbackTransaction,
            RollbackTransactionCompleted: DataOperationType.rollbackTransactionCompleted,
            RollbackTransactionFailed: DataOperationType.rollbackTransactionFailed,
        }
    }

    /*
        For update, needs to model:
            - property value changed, needed for properties with cardinality 1 or n
            - property added / removed for properties with cardinality n

            - snapshot of known values that changed?
    */

});

