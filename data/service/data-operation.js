var Montage = require("core/core").Montage;

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
        value: function DataOperation() {//RDW this might be too clever, if we hope to read operations from a store
            this.time = Date.now();
            this._index = exports.DataOperation.prototype._currentIndex + 1 || 0;//RDW need to be able to get the currentIndex from a store, or just need to trust that the store knows how to auto-increment index (id)
            exports.DataOperation.prototype._currentIndex = this._index;
        }
    },

    _currentIndex: {
        value: undefined
    },
    _index: {
        value: undefined
    },

    /***************************************************************************
     * Basic Properties
     */

    /**
     * @type {number}
     */
    id: {
        get: function () {
            return this.index || this._index;
        }
    },

    /**
     * @type {DataOperation.Type.CREATE|DataOperation.Type.READ|DataOperation.Type.UPDATE|DataOperation.Type.DELETE}
     */
    type: {
        value: undefined
    },

    /**
     * A number used to order operations according to when they were created.
     *
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
    time: {
        value: undefined
    },

    /**
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
     * @type {number}
     */
    index: {
        value: undefined
    },

    /**
     * @type {Object}
     */
    context: {
        value: undefined
    },

    /***************************************************************************
     * Data Properties
     */

    dataID: {
        value: undefined
    },

    dataType: {
        value: undefined
    },

    /**
     * @type {Object}
     */
    data: {
        value: undefined
    },

    /***************************************************************************
     * Deprecated
     */
//RDW there are no users of this... why "deprecated"?
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

    Type: {
        value: {
            CREATE: { isCreate: true },
            READ: { isRead: true },
            UPDATE: { isUpdate: true },
            DELETE: { isDelete: true }
        }
    },

    _lastOperation: {
        value: function (operationType, dataID, dataType, data, context, time) {//RDW validate incoming arguments (defined dataID, dataType, data, check whether all values are correct types)? might be different per operationType
            var newOperation = (new this.constructor);

            newOperation.type = operationType;

            newOperation.dataID = dataID;
            newOperation.dataType = dataType;
            newOperation.data = data;
            newOperation.context = context;

            if (time) {
                newOperation.time = time;
            }

            return newOperation;
        }
    },

    lastCreated: {
        value: function (dataID, dataType, data, context, time) {
            return this._lastOperation(this.Type.CREATE, dataID, dataType, data, context, time);
        }
    },

    lastRead: {
        value: function (dataID, dataType, data, context, time) {
            return this._lastOperation(this.Type.READ, dataID, dataType, data, context, time);
        }
    },

    lastUpdated: {
        value: function (dataID, dataType, data, context, time) {
            return this._lastOperation(this.Type.UPDATE, dataID, dataType, data, context, time);
        }
    },

    lastDeleted: {
        value: function (dataID, dataType, data, context, time) {
            return this._lastOperation(this.Type.DELETE, dataID, dataType, data, context, time);
        }
    },

});
