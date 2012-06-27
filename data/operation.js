/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2012 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
/**
 @module montage/data/operation
 @requires montage/core/core
 @requires montage/core/logger
 */
var Montage = require("montage/core").Montage;
var logger = require("montage/logger").logger("operation");

/**
 Handle top the operation manager. The manager is created automatically if not set by the application.
 @private
 */
var _operationManager = null;
/**
 @class module:montage/data/operation.Operation
 @extends module:montage/core/core.Montage
 */
var Operation = exports.Operation = Montage.create(Montage, /** @lends module:montage/data/operation.Operation# */ {

    init:{
        value:function () {
            return this;
        }
    },

    manager:{
        get:function () {
            if (_operationManager === null) {
                _operationManager = OperationManager.create().init();
            }
            return _operationManager;
        },
        set:function (manager) {
            _operationManager = manager;
        }
    }

});

/**
 @class module:montage/data/operation.OperationManager
 @extends module:montage/core/core.Montage
 */
var OperationManager = exports.OperationManager = Montage.create(Montage, /** @lends module:montage/data/operation.OperationManager# */ {

    init:{
        value:function () {
            return this;
        }
    },

    createNoopOperation:{
        value:function () {
            if (_noopOperation === null) {
                _noopOperation = NoopOperation.create().init();
            }
            return _noopOperation;
        }
    },

    createInsertOperation:{
        value:function () {
            return InsertOperation.create().init();
        }
    },

    createDeleteOperation:{
        value:function () {
            return DeleteOperation.create().init();
        }
    },

    createChangeOperation:{
        value:function () {
            return ChangeOperation.create().init();
        }
    }

});

var _noopOperation = null;
/**
 @class module:montage/data/operation.NoopOperation
 @extends module:montage/data/operation.Operation
 */
var NoopOperation = exports.NoopOperation = Montage.create(Operation, /** @lends module:montage/data/operation.NoopOperation# */ {


});

/**
 @class module:montage/data/operation.InsertOperation
 @extends module:montage/data/operation.Operation
 */
var InsertOperation = exports.InsertOperation = Montage.create(Operation, /** @lends module:montage/data/operation.InsertOperation# */ {


});

/**
 @class module:montage/data/operation.DeleteOperation
 @extends module:montage/data/operation.Operation
 */
var DeleteOperation = exports.DeleteOperation = Montage.create(Operation, /** @lends module:montage/data/operation.DeleteOperation# */ {


});

/**
 @class module:montage/data/operation.ChangeOperation
 @extends module:montage/data/operation.Operation
 */
var ChangeOperation = exports.ChangeOperation = Montage.create(Operation, /** @lends module:montage/data/operation.ChangeOperation# */ {


});
