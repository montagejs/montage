var Montage = require("montage").Montage,
    Criteria = require("core/criteria").Criteria,
    DataQuery = require("data/model/data-query").DataQuery,
    Map = require("collections/map"),
    ModuleReference = require("core/module-reference").ModuleReference,
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

            // this.registerServiceReferences(references);

            var value = deserializer.getProperty("childServicesMap") || [];
            this.registerServiceReferencesMap(value);

            value = deserializer.getProperty("childServicesArrays") || [];
            this.registerServiceReferencesArray(value);
        }
    },

    registerServiceReferencesArray: {
        value: function (references) {
            var map = new Map(),
                keys = references.keys,
                values = references.values,
                i, n;
            
            for (i = 0, n = keys.length; i < n; i++) {
                map.set(keys[i], values[i]);
            }

            this._childServicesArrays = map;
        }
    },


    registerServiceReferencesMap: {
        value: function (references) {
            var map = new Map(),
                i, n;
            
            for (i = 0, n = references.length; i < n; i++) {
                map.set(references[i].key, references[i].value);
            }

            this._childServicesMap = map;
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
        value: function (operation) {
            var self = this,
                objectDescriptor, service;

            return this._serviceReferenceRegistrationPromise.then(function () {
                return self._objectDescriptorForOperation(operation);
            }).then(function (descriptor) {
                objectDescriptor = descriptor;
                return self._serviceForObjectDescriptor(descriptor);
            }).then(function (service) {
                var handlerName = self._handlerNameForOperationType(operation.type);
                if (!service) {
                    // console.log(operation, self, objectDescriptor);
                    throw new Error("No service available to handle operation with type (" + (objectDescriptor && objectDescriptor.name) + ")");
                }
                return self[handlerName](operation, service, objectDescriptor);
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
        value: function (operation, service, objectDescriptor) {
            return service.saveRawData(operation.data);
        }
    },

    _performDeleteOperation: {
        value: function (operation, service, objectDescriptor) {
            return service.deleteRawData(operation.data);
        }
    },

    _performReadOperation: {
        value: function (operation, service, objectDescriptor) {
            var criteria = operation.criteria || operation.data,
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
        value: function (operation, service, objectDescriptor) {
            return service.saveRawData(operation.data);
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
        value: function (operation) {
            var self = this,
                descriptorOrModule = operation.dataType,
                module, descriptor, result, moduleId;

            if (descriptorOrModule instanceof ModuleReference) {
                module = descriptorOrModule;
                descriptor = this.objectDescriptorsByModuleID.get(module.id);
                if (descriptor) {
                    result = Promise.resolve(descriptor);
                } else {
                    result = module.exports.then(function (exports) {
                        var instance = exports.montageObject,
                            moduleId = [module.id, instance.exportName].join("/");
                        self.objectDescriptorsByModuleID.set(module.id, instance);
                        self.objectDescriptorsByModuleID.set(moduleId, instance);
                        return instance;                
                    });
                }
            } else if (descriptorOrModule instanceof ObjectDescriptor){
                descriptor = descriptorOrModule;
                module = descriptor.module;
                moduleId = [module.id, descriptor.exportName].join("/");
                if (!this.objectDescriptorsByModuleID.has(moduleId)) {
                    this.objectDescriptorsByModuleID.set(moduleId, descriptor);
                } else {
                    descriptor = this.objectDescriptorsByModuleID.get(moduleId);
                }
                result = Promise.resolve(descriptor);
            }
                
            
            

            return result;
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