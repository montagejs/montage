var Montage = require("montage").Montage,
    Criteria = require("core/criteria").Criteria,
    DataQuery = require("data/model/data-query").DataQuery,
    Map = require("collections/map"),
    OperationType = require("data/service/data-operation").DataOperation.Type,
    Promise = require("core/promise").Promise;


// Temporary.
// Created to allow development until DataOperation.Type is ready


exports.RawDataWorker = Montage.specialize({


    handleOperation: {
        value: function (rawOperation) {
            var self = this;

            return Promise.all([
                this._serviceForOperation(rawOperation),
                this._objectDescriptorForOperation(rawOperation)
            ]).then(function (promises) {
                var service = promises[0], 
                    objectDescriptor = promises[1],
                    handlerName = self._handlerNameForOperationType(rawOperation.type);

                return self[handlerName](rawOperation, service, objectDescriptor);
            });
        }
    },

    _handlerNameForOperationType: {
        value: function (operationType) {
            var name = "_perform";
            name += this._operationTypeNameByOperationType(operationType);
            return name + "Operation";
        }
    },

    // _operationTypeNameByOperationType: {
    //     get: function () {
    //         if (!this.__operationTypeNameByOperationType) {
    //             this.__operationTypeNameByOperationType = new Map([
    //                 [OperationType.CREATE, "Create"],
    //                 [OperationType.READ, "Read"],
    //                 [OperationType.UPDATE, "Update"],
    //                 [OperationType.DELETE, "Delete"]
    //             ]);
    //         }
    //         return this.__operationTypeNameByOperationType;
    //     }
    // },

    _operationTypeNameByOperationType: {
        value: function (operationType) {
            return operationType.isCreate ? "Create" : 
                   operationType.isRead ? "Read" : 
                   operationType.isUpdate ? "Update" : 
                   operationType.isDelete ? "Delete" : 
                                            null;
        }
    },

    _performCreateOperation: {
        value: function (rawOperation, service, objectDescriptor) {
            return service.saveRawData(rawOperation.data);
        }
    },

    _performDeleteOperation: {
        value: function (rawOperation, service, objectDescriptor) {
            return service.deleteRawData(rawOperation.data);
        }
    },

    _performReadOperation: {
        value: function (rawOperation, service, objectDescriptor) {
            var criteria = rawOperation.criteria || rawOperation.data,
                query, parameters, expression;
            
            if (!(criteria instanceof Criteria)) {
                parameters = criteria ? criteria.parameters : {};
                expression = criteria ? criteria.expression : "";
                criteria = new Criteria().initWithExpression(expression, parameters);
            }
            query = DataQuery.withTypeAndCriteria(objectDescriptor, criteria);
            
            return service.fetchData(query);
        }
    },

    _performUpdateOperation: {
        value: function (rawOperation, service, objectDescriptor) {
            return service.saveRawData(rawOperation.data);
        }
    },

    /***************************************************************************
     * Service & ObjectDescriptor Creation
     */

    _serviceForOperation: {
        value: function (rawOperation) {
            return this._instanceForOperation(rawOperation, "service", this.servicesByModuleID);
        }
    },

    _objectDescriptorForOperation: {
        value: function (rawOperation) {
            return this._instanceForOperation(rawOperation, "objectDescriptor", this.objectDescriptorsByModuleID);
        }
    },

    _instanceForOperation: {
        value: function (rawOperation, modulePropertyName, cache, canInstantiate) {
            var self = this,
                module = rawOperation[modulePropertyName + "Module"],
                descriptor = cache.get(module.id);

            return descriptor ? Promise.resolve(descriptor) : 
                                this._createInstanceForOperation(module, cache, canInstantiate);
        }
    },

    //TODO Support creating instances from JS module id. 
    // Currently relies on exports.montageObject which only 
    // comes with mjson requires
    _createInstanceForOperation: {
        value: function (module, cache) {
            return module.exports.then(function (exports) {
                var instance = exports.montageObject;
                cache.set(module.id, instance);
                return instance;                
            });
        }
    },

    /***************************************************************************
     * Service/Type Caching
     */

    servicesByModuleID: {
        get: function () {
            if (!this._servicesByModuleID) {
                this._servicesByModuleID = new Map();
            }
            return this._servicesByModuleID;
        }
    },

    objectDescriptorsByModuleID: {
        get: function () {
            if (!this._objectDescriptorsByModuleID) {
                this._objectDescriptorsByModuleID = new Map();
            }
            return this._objectDescriptorsByModuleID;
        }
    }

});