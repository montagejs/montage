var MutableEvent = require("../../core/event/mutable-event").MutableEvent,
    Enum = require("../../core/enum").Enum,
    ObjectPool = require("../../core/object-pool").ObjectPool,
    ReadEvent,
    ReadEventType;

/**
 *
 * ReadEvents
 *
 * - the target is a DataService
 * - query is the object modeling what needs to be read.
 *
 */

transactionEventTypes = [
    "read",
    "readProgress",
    "readComplete",
    "readFail"
 ];
 exports.ReadEventType = ReadEventType = new Enum().initWithMembersAndValues(transactionEventTypes,transactionEventTypes);


 ReadEvent = exports.ReadEvent = MutableEvent.specialize({

    bubbles: {
        value: true
    },

    query: {
        value: true
    },

    constructor: {
        value: function (type) {
            this.timeStamp = performance.now();
        }
    }


}, {
    /**
     *
     * DataService dispatched to attempt to get data back. RawDataServices listen to read events
     * and create dataOperations to execute.
     *
     */
    read: {
        value: ReadEventType.read
    },

    /**
     *
     * RawDataService dispatches readProgress events to inform of read progress.
     *
     */
    readProgress: {
        value: ReadEventType.readProgress
    },

    /**
     *
     * RawDataService dispatches readComplete events to inform a read is complete.
     *
     */
    readComplete: {
        value: ReadEventType.readComplete
    },

    /**
     *
     * RawDataService dispatches readCreadFailomplete events to inform a read has failed.
     *
     */
    readFail: {
        value: ReadEventType.readFail
    },

    _eventPoolFactory: {
        value: function () {
            return new ReadEvent();
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
        value: function(aReadEvent) {
            return this._instancePool.checkin(aReadEvent);
        }
    }
});
