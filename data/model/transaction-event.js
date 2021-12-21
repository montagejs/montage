var MutableEvent = require("../../core/event/mutable-event").MutableEvent,
    Enum = require("../../core/enum").Enum,
    ObjectPool = require("../../core/object-pool").ObjectPool,
    TransactionEvent,
    TransactionEventType;

/**
 *
 * DataEvents:
 *
 * - the target is an objectDescriptor
 *
 *  A DataService facilitates events sent by DataObjects (DOs) at key points in their life cycle:
 *  - create: A DO has been created.
 *  - editstart: User has started to edit a DO.
 *  - edit: A DO has been modifed by the user. Sent when the first change is made from a saved/stable state.
 *  - change: A DO's property has been changed by the user. This isn't unique to DOs and happing in montage on-demand, and part of biding infrastructure.
 *  - update: A local DO's property has been changed, and saved, by another user, pushed by the server side.
 *  - editcancel: User stopped editing a A DataObject (DO) without saving the changes (this would ends up sending a revert as
 *  an object should never leave an editing state without a clear decision about changes made? What about if offline?)
 *  - editend: User has stopped editing a DataObject (DO) ?
 *  - revert: A DataObject's (DO) state has been returned to it's most recent state. / reset?
 *  - validate
 *  - validateerror
 *  - save: A DataObject's (DO) changes have been saved.
 *  - saveerror: A DataObject's (DO) changes have been saved.
 *  - delete: A DataObject's (DO) has been deleted.
 *  - deleteerror: A DataObject's (DO) has been deleted.
 *
 */

transactionEventTypes = [

    "transactionCreate",
    "transactionCreateStart", /*alternative: transactionStartComplete*/
    "transactionCreateProgress",
    "transactionCreateComplete",
    "transactionCreateFail", /* Not sure we need this, ignoring is enough*/

    "transactionValidate",
    "transactionValidateStart",
    "transactionValidateProgress",
    "transactionValidateComplete",
    "transactionValidateFail",

    "transactionPrepare",
    "transactionPrepareStart",
    "transactionPrepareProgress",
    "transactionPrepareComplete",
    "transactionPrepareFail",

    "transactionRollback", /* transactionRollback? transactionRevert? */
    "transactionRollbackStart",
    "transactionRollbackProgress",
    "transactionRollbackComplete",
    "transactionRollbackFail",

    "transactionCommit",
    "transactionCommitStart",
    "transactionCommitProgress",
    "transactionCommitComplete",
    "transactionCommitFail"
 ];

 exports.TransactionEventType = TransactionEventType = new Enum().initWithMembersAndValues(transactionEventTypes,transactionEventTypes);


 TransactionEvent = exports.TransactionEvent = MutableEvent.specialize({

    bubbles: {
        value: true
    },

    data: {
        value: true
    },

    constructor: {
        value: function (type) {
            this.timeStamp = performance.now();
        }
    },

    /**
     * the transaction for which the event is created and dispatched.
     *
     * @type {Transaction}
     */
    transaction: {
        value: undefined
    }


}, {

    transactionCreate: {
        value: TransactionEventType.transactionCreate
    },
    transactionCreateStart: {
        value: TransactionEventType.transactionValidateStart
    },

    transactionCreateProgress: {
        value: TransactionEventType.transactionValidateProgress
    },

    transactionCreateComplete: {
        value: TransactionEventType.transactionValidateComplete
    },

    transactionCreateFail: {
        value: TransactionEventType.transactionValidateFail
    },

    /*
        There is validation logic that can involve one object by himself, but also some that involve other objects, wether they may or may not be in the transaction. If data is missing to run validation, it will be async, also some validation could be run client side, some could be run server-side, so it is async by nature, and shoudl be run first, bay all actors involved. There's no point trying to commit if we can know ahead it shouldn't to abort later:

        see: http://dbmsmusings.blogspot.com/2019/01/its-time-to-move-on-from-two-phase.html
        for a similar take.

        For now, we have a hook for basic single-ObjectDescriptor validation logic.

        So as listeners perform validation, it may fail.

        The main service doesn't know who will participate. Some listeners may just be involved in validation without being RawDataServices. The only thing we know is that by the end of the distribution of transactionValidate, then the mainService needs to have a collection of Promises.

        a Promise.all(transaction.validationPromises) will be the step to move to the next phase.

    */

    /**
     * For transactionValidate, data is a map where objects to be validated are the key,
     * and a resulting ValidityState will be the value as needed.
     *
     * See https://developer.mozilla.org/en-US/docs/Web/API/ValidityState for the blueprint
     *
     * @type {Map<DataObject->>ValidityState}
     */

     transactionValidate: {
        value: TransactionEventType.transactionValidate
    },

    transactionValidateStart: {
        value: TransactionEventType.transactionValidateStart
    },

    transactionValidateProgress: {
        value: TransactionEventType.transactionValidateProgress
    },

    transactionValidateComplete: {
        value: TransactionEventType.transactionValidateComplete
    },

    transactionValidateFail: {
        value: TransactionEventType.transactionValidateFail
    },

    /*
        - the first job we need RawDataServices to do build DataOperations that standardize how subclasses of RawDataServices will transform to concrete/specialized forms such as HTTP requests for REST API or SQL statements for databases, etc...

        Either that job succeeds, ot fail.

        If we model that like validation, where once distributed we build a Promise.all() of all promises set by listeners on the transaction, then we condition on that:
            - if promise is rejected, then the saveChanges fail, and we dispatch a transactionFail
            - if promise resolve, everyone is ready and we dispatch a  transactionCommit / transactionCommit


        The alternative is for listeners to dispatch an event to provide the promise of when they will be done. The promise would be a property on the event, which would carry the transaction and the target of course. The difference is that it advertises publicly who does what, but only the mainService would know when all is completed anyway.

        - prepare, prepareRequest, query to commit is a term used in 2 Phase Commit
        - canCommit is a term used in 3 Phase Commit

        - participating RawDataService whp
    */

    /*
        MainService Tells RawDataServices a transaction is happening
    */
    transactionPrepare: {
        value: TransactionEventType.transactionPrepare
    },
    /*
         RawDataService tells MainService inline it's partipating and preparing his data operations.
         This allows the MainService to listen for transactionPrepareProgress/transactionPrepareComplete/transactionPrepareFail on that RawDataService. Without that, or a promise on a "participate" event, the mainService couldn't know when he can move on to the performPhase.

         See https://developer.mozilla.org/en-US/docs/Web/API/ProgressEvent

         Progress can then be shared with others and combined?
         Progress would need to have a progress value, and a total of the % of the transaction handled?


         total is number of created + changed + deleted

         If we have an local RawDataService for IndexedDB, what does it mean then in term of communicating total back to a client?? The progress needs to be specific enough so that if 2 RawDataServices are saving an update for one object, then the progress for that object should be complete only when both have reported it in their progress. So that details needs to be there for the MainService to organize it's high level progress.

         Can't do that with just promises.

    */


    transactionPrepareStart: {
        value: TransactionEventType.transactionPrepareStart
    },

        /*
         RawDataService tells MainService inline it's partipating and preparing his data operations.
         This allows the MainService to listen for transactionPrepareProgress/transactionPrepareComplete/transactionPrepareFail on that RawDataService. Without that, or a promise on a "participate" event, the mainService couldn't know when he can move on to the performPhase.

         See https://developer.mozilla.org/en-US/docs/Web/API/ProgressEvent

         Progress can then be shared with others and combined?
         Progress would need to have a progress value, and a total of the % of the transaction handled?


         total is number of created + changed + deleted

         If we have an local RawDataService for IndexedDB, what does it mean then in term of communicating total back to a client?? The progress needs to be specific enough so that if 2 RawDataServices are saving an update for one object, then the progress for that object should be complete only when both have reported it in their progress. So that details needs to be there for the MainService to organize it's high level progress.

         Can't do that with just promises.

    */
    transactionPrepareProgress: {
        value: TransactionEventType.transactionPrepareProgress
    },

    /*
        the following would match a Promise:
            transactionPrepareComplete->resolve
            transactionPrepareFail->fail
    */
    transactionPrepareComplete: {
        value: TransactionEventType.transactionPrepareComplete
    },
    /*
        If any RawDataService dispatch a transactionPrepareFail, we move to abort.qqqww
    */
    transactionPrepareFail: {
        value: TransactionEventType.transactionPrepareFail
    },




    transactionReady: {
        value: TransactionEventType.transactionReady
    },

    /*
        abort?
    */

    /**
     * MainService Tells RawDataServices a transaction is cancelled
     *
     * @property {string}
     */
    transactionRollback: {
        value: TransactionEventType.transactionRollback
    },

    /**
     * RawDataServices tells MainServices it starts cancelling the transaction
     *
     * @property {string}
     */
    transactionRollbackStart: {
        value: TransactionEventType.transactionRollbackStart
    },

    /**
     * RawDataServices tells MainServices it's making progress cancelling the transaction
     *
     * @property {string}
     */
    transactionRollbackProgress: {
        value: TransactionEventType.transactionRollbackProgress
    },

    /**
     * RawDataServices tells MainServices it's done cancelling the transaction
     *
     * @property {string}
     */
    transactionRollbackComplete: {
        value: TransactionEventType.transactionRollbackComplete
    },

    /**
     * RawDataServices tells MainServices it couldn't cancel the transaction
     *
     * @property {string}
     */
    transactionRollbackFail: {
        value: TransactionEventType.transactionRollbackComplete
    },

    /*
        commit?
    */
    /**
     * MainService Tells RawDataServices to perform the transaction
     *
     * @property {string}
     */
    transactionCommit: {
        value: TransactionEventType.transactionCommit
    },

    /**
     * RawDataServices tells MainServices it starts cancelling the transaction
     *
     * @property {string}
     */
     transactionCommitStart: {
        value: TransactionEventType.transactionCommitStart
    },

    /**
     * RawDataServices tells MainServices it's making progress cancelling the transaction
     *
     * @property {string}
     */
     transactionCommitProgress: {
        value: TransactionEventType.transactionCommitProgress
    },

    /**
     * RawDataServices tells MainServices it's done cancelling the transaction
     *
     * @property {string}
     */
     transactionCommitComplete: {
        value: TransactionEventType.transactionCommitComplete
    },

    /**
     * RawDataServices tells MainServices it couldn't cancel the transaction
     *
     * @property {string}
     */
     transactionCommitFail: {
        value: TransactionEventType.transactionCommitComplete
    },
    _eventPoolFactory: {
        value: function () {
            return new TransactionEvent();
        }
    },
    __instancePool: {
        value: null
    },
    _instancePool: {
        get: function (eventType) {
            return this.__instancePool || (this.__instancePool = new ObjectPool(this._eventPoolFactory));
        }
    },
    checkout: {
        value: function() {
            return this._instancePool.checkout();
        }
    },
    checkin: {
        value: function(aTransactionEvent) {
            return this._instancePool.checkin(aTransactionEvent);
        }
    }
});
