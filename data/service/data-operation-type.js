var Montage = require("core/core").Montage;

exports.DataOperationType = Montage.specialize(/** @lends DataOperation.prototype */ {
        
    identifier: {
        get: function () {
            return "operationType_" + (this.action ? this.action : "Unknown");
        }
    },

    action: {
        value: undefined
    },

    isCreate: {
        value: false
    },

    isRead: {
        value: false
    },

    isUpdate: {
        value: false
    },

    isDelete: {
        value: false
    }

    /*
    For update, needs to model:
        - property value changed, needed for properties with cardinality 1 or n
        - property added / removed for properties with cardinality n

        - snapshot of known values that changed?
*/

}, {

    withName: {
        value: function (name) {
            var type = new this();

            type.uuid = Math.random();
            type.action = name;
            this[name] = type;
            exports[name] = type;
        }
    },

    withNames: {
        value: function (array) {

        }
    }

});

exports.DataOperationType.withName([
    "Create",
    "CreateFailed",
    "CreateCompleted",

    "Read",
    "ReadFailed",
    "ReadUpdated",
    "ReadProgress",
    "ReadProgress",
    "ReadCancel",
    "ReadCanceled",
    "ReadCompleted",



    "Update",
    "UpdateFailed",
    "UpdateFailed",
])
exports.DataOperationType.withName("Create");
exports.DataOperationType.withName("CreateFailed");
exports.DataOperationType.withName("CreateCompleted");

/* Read is the first operation that mnodels a query */
exports.DataOperationType.withName("Read");
/* ReadFailed is the operation that instructs the client that a read operation has failed canceled */
exports.DataOperationType.withName("ReadFailed");
/* ReadUpdated is pushed by server when a query's result changes due to data changes from others */
exports.DataOperationType.withName("ReadUpdated");
/* ReadProgress / ReadUpdate / ReadSeek is used to instruct server that more data is required for a "live" read / query
//             Need a better name, and a symetric? Or is ReadUpdated enough if it referes to previous operation
//         */
exports.DataOperationType.withName("ReadProgress");
/* ReadCancel is the operation that instructs baclkend that client isn't interested by a read operastion anymore */
exports.DataOperationType.withName("ReadCancel");
/* ReadCanceled is the operation that instructs the client that a read operation is canceled */
exports.DataOperationType.withName("ReadCanceled");
/* ReadCompleted is the operation that instructs the client that a read operation has returned all available data */
exports.DataOperationType.withName("ReadCompleted");

exports.DataOperationType.withName("Update");
exports.DataOperationType.withName("UpdateFailed");
exports.DataOperationType.withName("UpdateCompleted");

exports.DataOperationType.withName("Delete");
exports.DataOperationType.withName("DeleteFailed");
exports.DataOperationType.withName("DeleteCompleted");

/* Lock models the ability for a client to prevent others to make changes to a set of objects described by operation's criteria */
exports.DataOperationType.withName("Lock");
exports.DataOperationType.withName("LockFailed");
exports.DataOperationType.withName("LockCompleted");

/* RemmoteProcedureCall models the ability to invoke code logic on the server-side, being a DB StoredProcedure, or an method/function in a service */
exports.DataOperationType.withName("RemoteProcedureCall");
exports.DataOperationType.withName("RemoteProcedureCallCompleted");
exports.DataOperationType.withName("RemoteProcedureCallFailed");
