
var DataService = require("data/service/data-service").DataService,
    AuthorizationManager = require("data/service/authorization-manager").AuthorizationManager,
    AuthorizationPolicy = require("data/service/authorization-policy").AuthorizationPolicy,
    DataObjectDescriptor = require("data/model/data-object-descriptor").DataObjectDescriptor,
    DataQuery = require("data/model/data-query").DataQuery,
    DataStream = require("data/service/data-stream").DataStream,
    DataTrigger = require("data/service/data-trigger").DataTrigger,
    Map = require("collections/map"),
    Montage = require("core/core").Montage,
    Promise = require("core/promise").Promise,
    ObjectDescriptor = require("core/meta/object-descriptor").ObjectDescriptor,
    Set = require("collections/set"),
    WeakMap = require("collections/weak-map");


/**
 * Routes DataQuery objects to the appropriate RawDataService. 
 *
 * @class
 * @extends external:DataService
 */
exports.RawDataWorker = DataService.specialize({

    deserializeSelf: {
        value:function (deserializer) {
            var self = this,
                result = null, 
                value;

            value = deserializer.getProperty("childServices");
            if (value) {
                this.registerChildServices(value);
                result = this._childServiceRegistrationPromise.then(function () {
                    return self;
                });
            }

            value = deserializer.getProperty("model") || deserializer.getProperty("binder");
            if (value) {
                this.model = value;
            }

            value = !this.model && deserializer.getProperty("types");
            if (value) {
                Array.prototype.push.apply(this._childServiceTypes, value);
            }

            value = deserializer.getProperty("mappings");
            if (value) {
                Array.prototype.push.apply(this._childServiceMappings, value);
            }

            value = deserializer.getProperty("delegate");
            if (value) {
                this.delegate = value;
            }

            return this;
        }
    },

    addChildService: {
        value: function (child, types) {
            if (child && child.reference) {
                this._addChildService(child, types);
            } else {
                console.warn("Cannot add child -", child);
                console.warn("Children must be instances of DataService subclasses.");
            }
        }
    },

    _addChildService: {
        value: function (child, types) {
            var info, children, type, i, n, nIfEmpty = 1; 
            types = types || child.model && child.model.objectDescriptors || child.types;
            // If the new child service already has a parent, remove it from
            // that parent.
            if (child._parentService) {
                child._parentService.removeChildService(child);
            }

            // Add the new child to this service's children set.
            // this.childServices.add(child);,

            // this._childServicesByIdentifier.set(child.identifier, child);
            // Add the new child service to the services array of each of its
            // types or to the "all types" service array identified by the
            // `null` type, and add each of the new child's types to the array
            // of child types if they're not already there.

            for (i = 0, n = types && types.length || nIfEmpty; i < n; i += 1) {
                type = types && types.length && types[i] || null;
                children = this._childServicesByType.get(type) || [];
                children.push(child.reference);
                if (children.length === 1) {
                    this._childServicesByType.set(type, children);
                    if (type) {
                        this._childServiceTypes.push(type);
                    }
                }
            }
            //Service is logged, prepare it for garbage collection

            // Set the new child service's parent.
            // child._parentService = this;
        }
    },

    _registerChildServiceTypesAndMappings: {
        value: function (child, types, mappings) {
            var self = this,
                objectDescriptors;
            return this._resolveAsynchronousTypes(types).then(function (descriptors) {
                objectDescriptors = descriptors;
                self._registerTypesByModuleId(objectDescriptors);
                return self._registerChildServiceMappings(child, mappings);
            }).then(function () {
                return self._makePrototypesForTypes(child, objectDescriptors);
            }).then(function () {
                self.addChildService(child, types);
                return null;
            });
        }
    },

    _addMappingToChild: {
        value: function (mapping, child) {
            var self = this;
            return Promise.all([
                mapping.objectDescriptor,
                mapping.schemaDescriptor
            ]).spread(function (objectDescriptor, schemaDescriptor) {
                // TODO -- remove looking up by string to unique.
                var type = [objectDescriptor.module.id, objectDescriptor.name].join("/");
                objectDescriptor = self._moduleIdToObjectDescriptorMap[type];
                mapping.objectDescriptor = objectDescriptor;
                mapping.schemaDescriptor = schemaDescriptor;
                mapping.service = self;
                self.addMappingForType(mapping, objectDescriptor);
                return null;
            });
        }
    },

    registerChildService: {
        value: function (child, types) {
            var self = this,
                mappings = child.mappings || [],
                registrationPromise;
            // possible types
            // -- types is passed in as an array or a single type.
            // -- a model is set on the child.
            // -- types is set on the child.
            // any type can be asychronous or synchronous.
                types = types && Array.isArray(types) && types ||
                        types && [types] ||
                        child.model && child.model.objectDescriptors ||
                        child.types && Array.isArray(child.types) && child.types ||
                        child.types && [child.types] ||
                        [];

            registrationPromise = child._childServiceRegistrationPromise || this.nullPromise;

            return registrationPromise.then(function () {
                return self._registerChildServiceTypesAndMappings(child, types, mappings);
            });
        }
    },

    /**
     * Get the first child service that can handle data of the specified type,
     * or `null` if no such child service exists.
     *
     * @private
     * @method
     * @argument {DataObjectDescriptor} type
     * @returns {DataService}
     */
    childServiceForType: {
        value: function (type) {
            var service, services, reference;

            type = type instanceof ObjectDescriptor ? type : this._objectDescriptorForType(type);
            services = this._childServicesByType.get(type) || this._childServicesByType.get(null);
            reference = services && services[0] || null;
            service = reference ? this._childServicesByIdentifier.get(reference.id) : null;

            return service   ? Promise.resolve(service) :
                   reference ? this._initializeChildServiceByReference(reference) : 
                               this.nullPromise;
        }
    },

    _makePrototypeForType: {
        value: function (childService, objectDescriptor) {
            var self = this,
                module = objectDescriptor.module;
            console.log("RawDataWorker._makePrototypeForType", objectDescriptor.name);
            return module.require.async(module.id).then(function (exports) {
                var constructor = exports[objectDescriptor.exportName],
                    prototype = Object.create(constructor.prototype),
                    mapping = self.mappingWithType(objectDescriptor),
                    requisitePropertyNames = mapping && mapping.requisitePropertyNames || new Set(),
                    dataTriggers = DataTrigger.addTriggers(self, objectDescriptor, prototype, requisitePropertyNames);
                self._dataObjectPrototypes.set(constructor, prototype);
                self._dataObjectPrototypes.set(objectDescriptor, prototype);
                self._dataObjectTriggers.set(objectDescriptor, dataTriggers);
                self._constructorToObjectDescriptorMap.set(constructor, objectDescriptor);
                return null;
            });
        }
    },

    _initializeChildServiceByReference: {
        value: function (reference) {
            var self = this,
                objectDescriptors, mappings, child;

            return reference.exports.then(function (exports) {
                child = exports.montageObject;
                child._parentService = self;
                objectDescriptors = child.types;
                mappings = child.mappings;
                child.mappings.forEach(function (mapping) {
                    mapping.service = child;
                });
                self._childServicesByIdentifier.set(reference.id, child);
                return exports.montageObject;
            });
        }
    },

    fetchData: {
        value: function (queryOrType, optionalCriteria, optionalStream) {
            var self = this,
                stream = this._prepareStreamAndQuery(queryOrType, optionalCriteria, optionalStream),
                query = stream.query;


            this._dataServiceByDataStream.set(stream, this._childServiceRegistrationPromise.then(function() {

                self.childServiceForType(query.type).then(function (service) {
                    if (service === self && typeof self.fetchRawData === "function") {
                        service = self;
                        service._fetchRawData(stream);
                    } else {
                        try {
                            if (service) {
                                stream = service.fetchData(query, stream) || stream;
                                self._dataServiceByDataStream.set(stream, service);
                            } else {
                                throw new Error("Can't fetch data of unknown type - " + (query.type.typeName || query.type.name) + "/" + query.type.uuid);
                            }
                        } catch (e) {
                            stream.dataError(e);
                        }
                    }
                    return service;
                });
            }));
            // Return the passed in or created stream.
            return stream;
        }
    },

    _prepareStreamAndQuery: {
        value: function (queryOrType, optionalCriteria, optionalStream) {
            var self = this,
                isSupportedType = !(queryOrType instanceof DataQuery),
                type = isSupportedType && queryOrType,
                criteria = optionalCriteria instanceof DataStream ? undefined : optionalCriteria,
                query = type ? DataQuery.withTypeAndCriteria(type, criteria) : queryOrType,
                stream = optionalCriteria instanceof DataStream ? optionalCriteria : optionalStream;
            // make sure type is an object descriptor or a data object descriptor.
            query.type = this._objectDescriptorForType(query.type);
            // Set up the stream.
            stream = stream || new DataStream();
            stream.query = query;
            stream.dataExpression = query.selectExpression;

            return stream;
        }
    }

});