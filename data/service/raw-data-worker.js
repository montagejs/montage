var Montage = require("montage").Montage,
    Criteria = require("core/criteria").Criteria,
    DataQuery = require("data/model/data-query").DataQuery,
    Map = require("collections/map"),
    ObjectDescriptor = require("core/meta/object-descriptor").ObjectDescriptor,
    OperationType = require("data/service/data-operation").DataOperation.Type,
    Promise = require("core/promise").Promise;


exports.RawDataWorker = Montage.specialize({

    
    
     /***************************************************************************
     * Serialization 
     */ 

    // serializeSelf: {
    //     value: function (serializer) {
    //     }
    // },

    deserializeSelf: {
        value: function (deserializer) {
            var references = deserializer.getProperty("childServices") || [];

            console.log("RawDataWorker.deserializeSelf", references);
            this.registerServiceReferences(references);
        }
    },


    /***************************************************************************
     * Service Tree
     */


    _serviceReferenceRegistrationPromise: {
        get: function () {
            if (!this.__serviceReferenceRegistrationPromise) {
                this.__serviceReferenceRegistrationPromise = Promise.resolve(null);
            }
            return this.__serviceReferenceRegistrationPromise;
        }
    },

    serviceReferences: {
        get: function() {
            if (!this._serviceReferences) {
                this._serviceReferences = new Set();
            }
            return this._serviceReferences;
        }
    },

    serviceReferenceByObjectDescriptor: {
        get: function () {
            if (!this._serviceReferenceByObjectDescriptor) {
                this._serviceReferenceByObjectDescriptor = new Map();
            }
            return this._serviceReferenceByObjectDescriptor;
        }
    },

    serviceReferenceForObjectDescriptor: {
        value: function (type) {
            var services;
            type = type instanceof ObjectDescriptor ? type : this._objectDescriptorForType(type);
            services = this._serviceReferenceByObjectDescriptor.get(type) || this._serviceReferenceByObjectDescriptor.get(null);
            return services && services[0] || null;
        }
    },

    registerServiceReferences: {
        value: function (serviceReferences) {
            var self;
            if (!this.__serviceReferenceRegistrationPromise) {
                self = this;
                this.__serviceReferenceRegistrationPromise = Promise.all(serviceReferences.map(function (service) {
                    return self.registerServiceReference(service);
                }));
            }
        }
    },

    registerServiceReference: {
        value: function (service, types) {
            var self = this;
            // possible types
            // -- types is passed in as an array or a single type.
            // -- a model is set on the service.
            // -- types is set on the service.
            // any type can be asychronous or synchronous.
                types = types && Array.isArray(types) && types ||
                        types && [types] ||
                        service.model && service.model.objectDescriptors ||
                        service.types && Array.isArray(service.types) && service.types ||
                        service.types && [service.types] ||
                        [];

            return this._registerServiceReferenceObjectDescriptors(service, types);
        }
    },

    _registerServiceReferenceObjectDescriptors: {
        value: function (service, types) {
            this._addServiceReference(service, types);
            this._registerObjectDescriptorsByModuleId(types);
            return this.nullPromise;
        }
    },

    _addServiceReference: {
        value: function (service, types) {
            var serviceReference, type, i, n, nIfEmpty = 1;
            types = types || service.model && service.model.objectDescriptors || service.types;
            
            // Add the new service to this service's serviceren set.
            this.serviceReferences.add(service);

            // Add the new service service to the services array of each of its
            // types or to the "all types" service array identified by the
            // `null` type, and add each of the new service's types to the array
            // of service types if they're not already there.
            for (i = 0, n = types && types.length || nIfEmpty; i < n; i += 1) {
                type = types && types.length && types[i] || null;
                serviceReference = this.serviceReferenceByObjectDescriptor.get(type) || [];
                serviceReference.push(service);
                if (serviceReference.length === 1) {
                    this.serviceReferenceByObjectDescriptor.set(type, serviceReference);
                }
            }
        }
    },

    _registerObjectDescriptorsByModuleId: {
        value: function (types) {
            var self = this;
            types.forEach(function (objectDescriptor) {
                var module = objectDescriptor.module,
                    moduleId = [module.id, objectDescriptor.exportName].join("/");
                self.objectDescriptorsByModuleID.set(moduleId, objectDescriptor);
            });
        }
    },

    nullPromise: {
        get: function () {
            if (!exports.RawDataWorker._nullPromise) {
                exports.RawDataWorker._nullPromise = Promise.resolve(null);
            }
            return exports.RawDataWorker._nullPromise;
        }
    },

    /***************************************************************************
     * Operation Handlers
     */

    handleOperation: {
        value: function (rawOperation) {
            var self = this,
                objectDescriptor, service;

            return this._serviceReferenceRegistrationPromise.then(function () {
                return self._objectDescriptorForOperation(rawOperation);
            }).then(function (descriptor) {
                objectDescriptor = descriptor;
                return self._serviceForObjectDescriptor(descriptor);
            }).then(function (service) {
                var handlerName = self._handlerNameForOperationType(rawOperation.type);
                if (!service) {
                    console.log(rawOperation, self, objectDescriptor);
                    debugger;
                    throw new Error("No service available to handle operation with type (" + (objectDescriptor && objectDescriptor.name) + ")");
                }
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

    _operationTypeNameByOperationType: {
        value: function (operationType) {
            return operationType.isCreate ? "Create" : 
                   operationType.isRead   ? "Read" : 
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

    objectDescriptorForType: {
        value: function () {

        }
    },

    _serviceReferenceForObjectDescriptor: {
        value: function (objectDescriptor) {
            var services = this.serviceReferenceByObjectDescriptor.get(objectDescriptor);
            services = services || this.serviceReferenceByObjectDescriptor.get(null);
            return services && services[0] || null;
        }
    },

    _serviceForObjectDescriptor: {
        value: function (objectDescriptor) {
            var self = this,
                serviceReference = this._serviceReferenceForObjectDescriptor(objectDescriptor),
                service = serviceReference && this.servicesByModuleID.get(serviceReference.moduleId);

            
            
            return !serviceReference ? Promise.resolve(null) : 
                   service           ? Promise.resolve(service) : 
                                        serviceReference.promise.then(function (service) {
                                            self._servicesByModuleID.set(serviceReference.moduleId, service);
                                            return service;                
                                        });
        }
    },

    _objectDescriptorForOperation: {
        value: function (rawOperation) {
            var self = this,
                module = rawOperation.objectDescriptorModule,
                descriptor = this.objectDescriptorsByModuleID.get(module.id);


            return descriptor ? Promise.resolve(descriptor) : 
                                module.exports.then(function (exports) {
                                    var instance = exports.montageObject,
                                        moduleId = [module.id, instance.exportName].join("/");
                                    self.objectDescriptorsByModuleID.set(module.id, instance);
                                    self.objectDescriptorsByModuleID.set(moduleId, instance);
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