var Montage = require("core/core").Montage;

exports.DataOperationType = Montage.specialize(/** @lends DataOperation.prototype */ {
        
    identifier: {
        get: function () {
            return "operationType_" + (this.action ? this.action : "Unknown");
        }
    },

    action: {
        value: undefined
    }
    /*
    For update, needs to model:
        - property value changed, needed for properties with cardinality 1 or n
        - property added / removed for properties with cardinality n

        - snapshot of known values that changed?
*/

}, {

    withAction: {
        value: function (name) {
            var type = new this();
            type.action = name;
            this[name] = type;
            exports[name] = type;
        }
    },


    // Replace with completionType on each DataOperationType object? 
    completionTypeForType: {
        value: function (type) {
            return type === this.Create ? this.CreateCompleted :
                   type === this.CreateFailed ? this.CreateCompleted :
                   type === this.Read ? this.ReadCompleted :
                   type === this.ReadFailed ? this.ReadCompleted :
                   type === this.ReadProgress ? this.ReadCompleted :
                   type === this.ReadUpdated ? this.ReadCompleted :
                   type === this.ReadCancel ? this.ReadCompleted :
                   type === this.ReadCanceled ? this.ReadCompleted :
                   type === this.Update ? this.UpdateCompleted :
                   type === this.UpdateFailed ? this.UpdateCompleted :
                   type === this.Delete ? this.DeleteCompleted :
                   type === this.DeleteFailed ? this.DeleteCompleted :
                   type === this.Lock ? this.LockCompleted :
                   type === this.LockFailed ? this.LockCompleted :
                   type === this.RemoteProcedureCall ? this.RemoteProcedureCallCompleted :
                   type === this.RemoteProcedureCallFailed ? this.RemoteProcedureCallCompleted :
                   null;
        }   
    },

    isCompletion: {
        value: function (type) {
            return this.completionTypeForType(type) === null;
        }
    },

    // Replace with failureType on each DataOperationType object? 
    failureTypeForType: {
        value: function (type) {
            return type === this.Create ? this.CreateFailed :
                   type === this.CreateCompleted ? this.CreateFailed :
                   type === this.Read ? this.ReadFailed :
                   type === this.ReadCompleted ? this.ReadFailed :
                   type === this.ReadProgress ? this.ReadFailed :
                   type === this.ReadUpdated ? this.ReadFailed :
                   type === this.ReadCancel ? this.ReadFailed :
                   type === this.ReadCanceled ? this.ReadFailed :
                   type === this.Update ? this.UpdateFailed :
                   type === this.UpdateCompleted ? this.UpdateFailed :
                   type === this.Delete ? this.DeleteFailed :
                   type === this.DeleteCompleted ? this.DeleteFailed :
                   type === this.Lock ? this.LockFailed :
                   type === this.LockCompleted ? this.LockFailed :
                   type === this.RemoteProcedureCall ? this.RemoteProcedureCallFailed :
                   type === this.RemoteProcedureCallCompleted ? this.RemoteProcedureCallFailed :
                   null;
        }   
    },

    isFailure: {
        value: function (type) {
            return this.failureTypeForType(type) === null;
        }
    }

});

exports.DataOperationType.withAction("Create");
exports.DataOperationType.withAction("CreateFailed");
exports.DataOperationType.withAction("CreateCompleted");

/* Read is the first operation that mnodels a query */
exports.DataOperationType.withAction("Read");
/* ReadFailed is the operation that instructs the client that a read operation has failed canceled */
exports.DataOperationType.withAction("ReadFailed");
/* ReadUpdated is pushed by server when a query's result changes due to data changes from others */
exports.DataOperationType.withAction("ReadUpdated");
/* ReadProgress / ReadUpdate / ReadSeek is used to instruct server that more data is required for a "live" read / query
//             Need a better name, and a symetric? Or is ReadUpdated enough if it referes to previous operation
//         */
exports.DataOperationType.withAction("ReadProgress");
/* ReadCancel is the operation that instructs baclkend that client isn't interested by a read operastion anymore */
exports.DataOperationType.withAction("ReadCancel");
/* ReadCanceled is the operation that instructs the client that a read operation is canceled */
exports.DataOperationType.withAction("ReadCanceled");
/* ReadCompleted is the operation that instructs the client that a read operation has returned all available data */
exports.DataOperationType.withAction("ReadCompleted");

exports.DataOperationType.withAction("Update");
exports.DataOperationType.withAction("UpdateFailed");
exports.DataOperationType.withAction("UpdateCompleted");

exports.DataOperationType.withAction("Delete");
exports.DataOperationType.withAction("DeleteFailed");
exports.DataOperationType.withAction("DeleteCompleted");

/* Lock models the ability for a client to prevent others to make changes to a set of objects described by operation's criteria */
exports.DataOperationType.withAction("Lock");
exports.DataOperationType.withAction("LockFailed");
exports.DataOperationType.withAction("LockCompleted");

/* RemmoteProcedureCall models the ability to invoke code logic on the server-side, being a DB StoredProcedure, or an method/function in a service */
exports.DataOperationType.withAction("RemoteProcedureCall");
exports.DataOperationType.withAction("RemoteProcedureCallCompleted");
exports.DataOperationType.withAction("RemoteProcedureCallFailed");
