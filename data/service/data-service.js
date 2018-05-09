var Montage = require("core/core").Montage,
    AuthorizationManager = require("data/service/authorization-manager").AuthorizationManager,
    AuthorizationPolicy = require("data/service/authorization-policy").AuthorizationPolicy,
    DataIdentifier = require("data/model/data-identifier").DataIdentifier,
    DataMapping = require("data/service/data-mapping").DataMapping,
    DataObjectDescriptor = require("data/model/data-object-descriptor").DataObjectDescriptor,
    DataQuery = require("data/model/data-query").DataQuery,
    DataStream = require("data/service/data-stream").DataStream,
    DataTrigger = require("data/service/data-trigger").DataTrigger,
    deprecate = require("core/deprecate"),
    Map = require("collections/map"),
    Promise = require("core/promise").Promise,
    ObjectDescriptor = require("core/meta/object-descriptor").ObjectDescriptor,
    Scope = require("frb/scope"),
    Set = require("collections/set"),
    WeakMap = require("collections/weak-map");


var AuthorizationPolicyType = new Montage();
AuthorizationPolicyType.NoAuthorizationPolicy = AuthorizationPolicy.NONE;
AuthorizationPolicyType.UpfrontAuthorizationPolicy = AuthorizationPolicy.UP_FRONT;
AuthorizationPolicyType.OnDemandAuthorizationPolicy = AuthorizationPolicy.ON_DEMAND;
AuthorizationPolicyType.OnFirstFetchAuthorizationPolicy = AuthorizationPolicy.ON_FIRST_FETCH;

/**
 * Provides data objects and manages changes to them.
 *
 * Data service subclasses that implement their own constructor should call this
 * class' constructor at the beginning of their constructor implementation
 * with code like the following:
 *
 *     DataService.call(this);
 *
 * Currently only one service tree with one
 * [root services]{@link DataService#rootService} is supported, and every
 * instance of DataService or a DataService subclasses must either be that root
 * service or be set as a descendent of that root service.
 *
 * @class
 * @extends external:Montage
 */
exports.DataService = Montage.specialize(/** @lends DataService.prototype */ {

    /***************************************************************************
     * Initializing
     */

    constructor: {
        value: function DataService() {
            exports.DataService.mainService = exports.DataService.mainService || this;
            this._initializeAuthorization();
            this._initializeOffline();
            this._typeIdentifierMap = new Map();
            this._descriptorToRawDataTypeMappings = new Map();
        }
    },

    /***************************************************************************
     * Serialization
     */

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

            this.registerSelf();

            value = deserializer.getProperty("delegate");
            if (value) {
                this.delegate = value;
            }


            if (this._childServiceRegistrationPromise) {
                this._childServiceRegistrationPromise = this._childServiceRegistrationPromise.then(function () {
                    return self.registerSelf();
                });
            } else {
                this._childServiceRegistrationPromise = this.registerSelf();
            }

            value = deserializer.getProperty("rawDataTypeMappings");
            this._registerRawDataTypeMappings(value || []);

            value = deserializer.getProperty("batchAddsDataToStream");
            this.batchAddsDataToStream = !!value;
            
            return result;
        }
    },

    delegate: {
        value: null
    },

    /***************************************************************************
     * Basic Properties
     *
     * Private properties are defined where they are used, not here.
     */

    identifier: {
        get: function() {
            return this._identifier || (this._identifier = Montage.getInfoForObject(this).moduleId);
        }
    },

    /**
     * The types of data handled by this service. If this `undefined`, `null`,
     * or an empty array this service is assumed to handled all types of data.
     *
     * The default implementation of this property returns the union of all
     * types handled by child services of this service. Subclasses without child
     * services should override this to directly return an array of the specific
     * types they handle.
     *
     * Applications typically have one [raw data service]{@link RawDataService}
     * service for each set of related data types and one
     * [main service]{@link DataService.mainService} which is the parent of all
     * those other services and delegates work to them based on the type of data
     * to which the work applies. It is possible for child data services to have
     * children of their own and delegate some or all of their work to them.
     *
     * A service's types must not be changed after it is added as a child of
     * another service.
     *
     * @type {Array.<ObjectDescriptor>}
     */
    types: {
        get: function () {
            return this._childServiceTypes;
        }
    },


    /**
     * The data mappings used by this service to convert objects to raw
     * data and vice-versa.
     *
     * @type {Array.<DataMapping>}
     */
    mappings: {
        get: function () {
            return this._childServiceMappings;
        }
    },


    /***************************************************************************
     * Snapshotting
     */

    __snapshot: {
        value: null
    },

    _snapshot: {
        get: function() {
            return this.__snapshot || (this.__snapshot = new Map());
        }
    },

    /**
     * Records the snapshot of the values of record known for a DataIdentifier
     *
     * @private
     * @argument  {DataIdentifier} dataIdentifier
     * @argument  {Object} rawData
     */
    recordSnapshot: {
        value: function (dataIdentifier, rawData) {
            this._snapshot.set(dataIdentifier, rawData);
        }
    },

    /**
     * Removes the snapshot of the values of record for the DataIdentifier argument
     *
     * @private
     * @argument {DataIdentifier} dataIdentifier
     */
   removeSnapshot: {
        value: function (dataIdentifier) {
            this._snapshot.delete(dataIdentifier);
        }
    },

    /**
     * Returns the snapshot associated with the DataIdentifier argument if available
     *
     * @private
     * @argument {DataIdentifier} dataIdentifier
     */
    snapshotForDataIdentifier: {
        value: function (dataIdentifier) {
            return this._snapshot.get(dataIdentifier);
        }
    },

    /**
     * Returns the snapshot associated with the DataIdentifier argument if available
     *
     * @private
     * @argument {DataIdentifier} dataIdentifier
     */
    snapshotForObject: {
        value: function (object) {
            return this.snapshotForDataIdentifier(this.dataIdentifierForObject(object));
        }
    },


    /***************************************************************************
     * Service Hierarchy
     */

    _addChildService: {
        value: function (child, types) {
            var children, type, i, n, nIfEmpty = 1;
            types = types || child.model && child.model.objectDescriptors || child.types;
            // If the new child service already has a parent, remove it from
            // that parent.
            if (child._parentService) {
                child._parentService.removeChildService(child);
            }

            // Add the new child to this service's children set.
            this.childServices.add(child);
            this._childServicesByIdentifier.set(child.identifier, child);
            // Add the new child service to the services array of each of its
            // types or to the "all types" service array identified by the
            // `null` type, and add each of the new child's types to the array
            // of child types if they're not already there.
            this._cacheServiceWithTypes(child, types);
            // Set the new child service's parent.
            child._parentService = this;
        }
    },

    _cacheServiceWithTypes: {
        value: function (child, types) {
            var children, type, i, n, nIfEmpty = 1;

            for (i = 0, n = types && types.length || nIfEmpty; i < n; i += 1) {
                type = types && types.length && types[i] || null;
                children = this._childServicesByObjectDescriptor.get(type) || [];
                children.push(child);
                if (children.length === 1) {
                    this._childServicesByObjectDescriptor.set(type, children);
                    if (type) {
                        this._childServiceTypes.push(type);
                    }
                }
            }
        }
    },

    _childServiceRegistrationPromise: {
        get: function() {
            return this.__childServiceRegistrationPromise || (this.__childServiceRegistrationPromise = Promise.resolve());
        },
        set: function(value) {
            this.__childServiceRegistrationPromise = value;
        }
    },

     /**
     * Private settable child service set.
     *
     * This property should not be modified outside of the
     * [childServices getter]{@link DataService#childServices}, and its contents
     * should not be modified outside of
     * [addChildService()]{@link DataService#addChildService} and
     * [removeChildService()]{@link DataService#removeChildService}
     *
     * @private
     * @type {?Set.<DataService>}
     */
    _childServices: {
        value: undefined
    },

    /**
     * Private settable parent service reference.
     *
     * This property's value should not be modified outside of
     * [addChildService()]{@link DataService#addChildService} and
     * [removeChildService()]{@link DataService#removeChildService}.
     *
     * @private
     * @type {?DataService}
     */
    _parentService: {
        value: undefined
    },

    /**
     * A map from each of the data types handled by this service to an array
     * of the child services that can handle that type, with each such array
     * ordered according to the order in which the services in it were
     * [added]{@link DataService#addChildService} as children of this service.
     *
     * If one or more child services of this service are defined as handling all
     * types (their [types]{@link DataService#types} property is `undefined`,
     * `null`, or an empty array), the child service map also include a `null`
     * key whose corresponding value is an array of all those services defined
     * to handle all types.
     *
     * The contents of this map should not be modified outside of
     * [addChildService()]{@link DataService#addChildService} and
     * [removeChildService()]{@link DataService#removeChildService}.
     *
     * @private
     * @type {Map<ObjectDescriptor, Array.<DataService>>}
     */
    _childServicesByType: {
        get: deprecate.deprecateMethod(void 0, function () {
            return this._childServicesByObjectDescriptor;
        }, "_childServicesByType", "_childServicesByObjectDescriptor")
    },

    _childServicesByObjectDescriptor: {
        get: function () {
            if (!this.__childServicesByObjectDescriptor) {
                this.__childServicesByObjectDescriptor = new Map();
            }
            return this.__childServicesByObjectDescriptor;
        }
    },

    _childServicesByIdentifier: {
        get: function () {
            if (!this.__childServicesByIdentifier) {
                this.__childServicesByIdentifier = new Map();
            }
            return this.__childServicesByIdentifier;
        }
    },

    /**
     * Get the first child service that can handle the specified object,
     * or `null` if no such child service exists.
     *
     * @private
     * @method
     * @argument {Object} object
     * @returns DataService
     */
    _childServiceForObject: {
        value: function (object) {
            return this.childServiceForType(this.rootService.objectDescriptorForObject(object));
        }
    },

    /**
     * Get the first child service that can handle the specified object,
     * or `null` if no such child service exists.
     *
     * @deprecated
     * @method
     * @argument {Object} object
     * @returns DataService
     */
    _getChildServiceForObject: {
        value: deprecate.deprecateMethod(void 0, function (object) {
            return this._childServiceForObject(object);
        }, "_getChildServiceForObject", "_childServiceForObject", true)
    },

    /**
     * An array of the data types handled by all child services of this service.
     *
     * The contents of this map should not be modified outside of
     * [addChildService()]{@link DataService#addChildService} and
     * [removeChildService()]{@link DataService#removeChildService}.
     *
     * @private
     * @type {Array.<ObjectDescriptor>}
     */
    _childServiceTypes: {
        get: function() {
            if (!this.__childServiceTypes) {
                this.__childServiceTypes = [];
            }
            return this.__childServiceTypes;
        }
    },

    // #1 resolve asynchronous types
    // -- types are arrays
    // -- contents of the array can be:
    // ---- an objectDescriptor or
    // ---- a promise for an objectDescriptor or
    // ---- a promise for an array of objectDescriptors
    // -- flatten the result
    // #2 map module id to object descriptor
    // #3 register mapping to objectDescriptor
    // -- resolve the mappings references
    // -- map objectDescriptor to mapping
    // #4 make prototype for object descriptor
    // -- map constructor to prototype
    // -- map objectDescriptor to prototype
    // -- map objectDescriptor to dataTriggers

    // -- TODO: dataTriggers should be derived from all properties - mapping requisitePropertyNames

    _registerChildServiceTypesAndMappings: {
        value: function (child, types, mappings) {
            var self = this,
                objectDescriptors;
            return this._resolveAsynchronousTypes(types).then(function (descriptors) {
                objectDescriptors = descriptors;
                self._registerObjectDescriptorsByModuleId(objectDescriptors);
                return self._registerChildServiceMappings(child, mappings);
            }).then(function () {
                return self._prototypesForModuleObjectDescriptors(objectDescriptors);
            }).then(function () {
                self.addChildService(child, types);
                return null;
            });
        }
    },




    /**
     * Adds a raw data service as a child of this data service and set it to
     * handle data of the types defined by its [types]{@link DataService#types}
     * property.
     *
     * Child services must have their [types]{@link DataService#types} property
     * value or their [model]{@link DataService#model} set before they are passed in to
     * this method, and that value cannot change after that.  The model property takes
     * priority of the types property.  If the model is defined the service will handle
     * all the object descriptors associated to the model.
     *
     * @method
     * @argument {RawDataService} service
     * @argument {Array} [types] Types to use instead of the child's types.
     */
    addChildService: {
        value: function (child, types) {
            if (child instanceof exports.DataService &&
                child.constructor !== exports.DataService) {
                this._addChildService(child, types);
            } else {
                console.warn("Cannot add child -", child);
                console.warn("Children must be instances of DataService subclasses.");
            }
        }
    },

    
     /**
     * The child services of this service.
     *
     * This value is modified by calls to
     * [addChildService()]{@link DataService#addChildService} and
     * [removeChildService()]{@link DataService#removeChildService} and must not
     * be modified directly.
     *
     * @type {Set.<DataService>}
     */
    childServices: {
        get: function() {
            if (!this._childServices) {
                this._childServices = new Set();
            }
            return this._childServices;
        }
    },

    /**
     * Get the first child service that can handle data of the specified type,
     * or `null` if no such child service exists.
     *
     * @method
     * @argument {ObjectDescriptor|Function|String} type - ObjectDescriptor, constructor, or moduleId of a type
     * @returns {DataService}
     */
    childServiceForType: {
        value: function (type) {
            var descriptor = this._objectDescriptorForType(type),
                services = this._childServicesByObjectDescriptor.get(descriptor) || this._childServicesByObjectDescriptor.get(null);

            return services && services[0] || null;
        }
    },
    

    /**
     * Convenience method to assess if a dataService is the rootService
     *
     * @type {Boolean}
     */
    isRootService: {
        get: function () {
            return this === this.rootService;
        }
    },

    /**
     * A read-only reference to the parent of this service.
     *
     * This value is modified by calls to
     * [addChildService()]{@link DataService#addChildService} and
     * [removeChildService()]{@link DataService#removeChildService} and cannot
     * be modified directly.
     *
     * Data services that have no parents are called
     * [root services]{@link DataService#rootService}.
     *
     * @type {?DataService}
     */
    parentService: {
        get: function () {
            return this._parentService;
        }
    },

    /**
     * Resolve and add own objectDescriptors & mappings to childServiceTypes
     * @method
     * @return {Promise}
     */
    registerSelf: {
        value: function () {
            var self = this,
                mappings = this.mappings || [],
                types;

            // possible types
            // -- types is passed in as an array or a single type.
            // -- a model is set on the child.
            // -- types is set on the child.
            // any type can be asychronous or synchronous.
            types = types && Array.isArray(types) && types ||
                    types && [types] ||
                    this.model && this.model.objectDescriptors ||
                    this.types && Array.isArray(this.types) && this.types ||
                    this.types && [this.types] ||
                    [];

            return this._registerOwnTypesAndMappings(types, mappings).then(function () {
                self._cacheServiceWithTypes(self, types);
                return self;
            });
        }
    },
    
    /**
     * Convenience read-only reference to the root of the service tree
     * containing this service. Most applications have only one root service,
     * the application's [main service]{@link DataService.mainService}.
     *
     * @type {DataService}
     */
    rootService: {
        get: function () {

            return this.parentService ? this.parentService.rootService : this;
        }
    },

    registerChildServices: {
        value: function (childServices) {
            var self;
            if (!this.__childServiceRegistrationPromise) {
                self = this;
                this.__childServiceRegistrationPromise = Promise.all(childServices.map(function (child) {
                    return self.registerChildService(child);
                }));
            }
        }
    },

    /**
     * Alternative to [addChildService()]{@link DataService#addChildService}.
     * While addChildService is synchronous, registerChildService is asynchronous
     * and may take a child whose [types]{@link DataService#types} property is
     * a promise instead of an array.
     *
     * This is useful for example if the child service does not know its types
     * immediately, e.g. if it must fetch them from a .mjson descriptors file.
     *
     * If the child's types is an array, it is guaranteed to behave exactly
     * like addChildService.
     *
     * @method
     * @param {DataService} child service to add to this service.
     * @param {?Promise|ObjectDescriptor|Array<ObjectDescriptor>}
     * @return {Promise}
     */
    registerChildService: {
        value: function (child, types) {
            var self = this,
                mappings = child.mappings || [];
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

            return child._childServiceRegistrationPromise.then(function () {
                return self._registerChildServiceTypesAndMappings(child, types, mappings);
            });
        }
    },

    /**
     * Remove a raw data service as a child of this service and clear its parent
     * if that service is a child of this service.
     *
     * The performance of this method is O(m) + O(n), where m is the number of
     * children of this service handling the same type as the child service to
     * remove and n is the number of types handled by all children of this
     * service.
     *
     * @method
     * @argument {RawDataService} service
     * @argument {Array} [types] Types to use instead of the child's types.
     */
    removeChildService: {
        value: function (child, types) {
            var type, chidren, index, i, n;
            types = types || child.types;
            // Remove the child service from the services array of each of its
            // types or from the "all types" service array identified by the
            // `null` type, or remove a type altogether if its service array
            // only contains the child service to remove, or remove the "all
            // types" service array if it only contains the child service to
            // remove.
            for (i = 0, n = types && types.length || 1; i < n; i += 1) {
                type = types && types.length && types[i] || null;
                type = type && this._objectDescriptorForType(type);
                chidren = this._childServicesByObjectDescriptor.get(type);
                index = chidren ? chidren.indexOf(child) : -1;
                if (index >= 0 && chidren.length > 1) {
                    chidren.splice(index, 1);
                } else if (index === 0) {
                    this._childServicesByObjectDescriptor.delete(type);
                    index = type ? this._childServiceTypes.indexOf(type) : -1;
                    if (index >= 0) {
                        this._childServiceTypes.splice(index, 1);
                    }
                }
            }
            // Remove the child from this service's children set.
            this.childServices.delete(child);
            // Clear the service parent if appropriate.
            if (child._parentService === this) {
                child._parentService = undefined;
            }
        }
    },

    /**
     * Alternative to [removeChildService()]{@link DataService#removeChildService}.
     * While removeChildService is synchronous, unregisterChildService is asynchronous
     * and may take a child whose [types]{@link DataService#types} property is
     * a promise instead of an array.
     *
     * This is useful for example if the child service does not know its types
     * immediately, e.g. if it must fetch them from a .mjson descriptors file.
     *
     * If the child's types is an array, it is guaranteed to behave exactly
     * like removeChildService.
     *
     * @method
     * @return {Promise}
     */
    unregisterChildService: {
        value: function (child) {
            var self = this;
            return new Promise(function (resolve, reject) {
                self.removeChildService(child, child.types);
                resolve();
            });
        }
    },

    /***************************************************************************
     * Mappings
     */

     /**
     * Add Promise generated from mapRawDataToObject for the DataStream associated
     * to this fetch. The resulting array of promises is used to determine when the 
     * DataStream is ready to be resolved with cooked objects.
     *
     * @method
     * @argument {Promise}     - promise
     * @argument {DataStream}  - stream
     * @return {void}
     */
    _addMappingPromiseForStream: {
        value: function (promise, stream) {
            if (!this._streamMappingPromises.has(stream)) {
                this._streamMappingPromises.set(stream, [promise]);
            } else {
                this._streamMappingPromises.get(stream).push(promise);
            }
        }
    },

    /**
     * Resolves the object descriptor and schema descriptor 
     * references for a mapping and adds that mapping to
     * a child service with those descriptors
     *
     * @method
     * @argument {DataMapping}  - mapping
     * @argument {DataService}  - child
     * @return {Promise}
     */
    _addMappingToService: {
        value: function (mapping, child) {
            var service = this;
            return Promise.all([
                mapping.objectDescriptorReference,
                mapping.schemaDescriptorReference
            ]).spread(function (objectDescriptor, schemaDescriptor) {
                // TODO -- remove looking up by string to unique.
                var type = [objectDescriptor.module.id, objectDescriptor.name].join("/");
                objectDescriptor = service._moduleIdToObjectDescriptorMap.get(type);
                mapping.objectDescriptor = objectDescriptor;
                mapping.schemaDescriptor = schemaDescriptor;
                mapping.service = child;
                child.addMappingForType(mapping, objectDescriptor);
                return null;
            });
        }
    },

    /**
     * The DataMappings for this service and all of it's children
     *
     * @property {Array<DataMapping>}
     */
    _childServiceMappings: {
        get: function () {
            if (!this.__childServiceMappings) {
                this.__childServiceMappings = [];
            }
            return this.__childServiceMappings;
        }
    },


    /**
     * Map from a parent class to the mappings used by the service to
     * determine what subclass to create an instance of for a particular
     * rawData object
     *
     * For example, say a class 'Person' has 2 subclasses 'Employee' & 'Customer'.
     * RawDataService would evaluate each person rawData object against each item
     * in _rawDataTypeMappings and determine if that rawData should be an instance
     * of 'Employee' or 'Customer'.
     * @type {Map<ObjectDescpriptor:RawDataTypeMapping>}
     */
    _descriptorToRawDataTypeMappings: {
        value: undefined
    },

    /**
     * Map cooked object to rawData for use in write operations such as 
     * create, delete, save and update.
     * 
     * @todo Make this method overridable by type name with methods like
     * `mapHazardToRawData()` and `mapProductToRawData()`.
     *
     * @method
     * @argument {Object} object - object  
     * @argument {Object} record - record
     * @argument {?}
     * 
     */
    _mapObjectToRawData: {
        value: function (object, record, context) {
            var mapping = this.mappingForObject(object),
                result;

            if (mapping) {
                result = mapping.mapObjectToRawData(object, record, context);
            }

            if (record) {
                if (result) {
                    var otherResult = this.mapObjectToRawData(object, record, context);
                    if (result instanceof Promise && otherResult instanceof Promise) {
                        result = Promise.all([result, otherResult]);
                    } else if (otherResult instanceof Promise) {
                        result = otherResult;
                    }
                } else {
                    result = this.mapObjectToRawData(object, record, context);
                }
            }

            return result;
        }
    },


    /**
     * Convert raw data to data objects of an appropriate type.
     *
     * Subclasses should override this method to map properties of the raw data
     * to data objects, as in the following:
     *
     *     mapRawDataToObject: {
     *         value: function (object, record) {
     *             object.firstName = record.GIVEN_NAME;
     *             object.lastName = record.FAMILY_NAME;
     *         }
     *     }
     *
     * Alternatively, subclasses can define a
     * [mapping]{@link DataService#mapping} to do this mapping.
     *
     * The default implementation of this method uses the service's mapping if
     * the service has one, and otherwise calls the deprecated
     * [mapFromRawData()]{@link RawDataService#mapFromRawData}, whose default
     * implementation does nothing.
     *
     * @todo Make this method overridable by type name with methods like
     * `mapRawDataToHazard()` and `mapRawDataToProduct()`.
     *
     * @method
     * @argument {Object} record - An object whose properties' values hold
     *                             the raw data.
     * @argument {Object} object - An object whose properties must be set or
     *                             modified to represent the raw data.
     * @argument {?} context     - The value that was passed in to the
     *                             [addRawData()]{@link RawDataService#addRawData}
     *                             call that invoked this method.
     */
    _mapRawDataToObject: {
        value: function (record, object, context) {
            var self = this,
                mapping = this.mappingForObject(object, !!this.parentService),
                result;
            
            
            if (mapping) {
                result = mapping.mapRawDataToObject(record, object, context);
                if (result) {
                    result = result.then(function () {
                        return self.mapRawDataToObject(record, object, context);
                    });
                } else {
                    result = this.mapRawDataToObject(record, object, context);
                }
            } else {
                result = this.mapRawDataToObject(record, object, context);
            }

            return result;

        }
    },

    /**
     *
     * @method
     * @param {Map<ObjectDescriptor:DataMapping>}
     */
    _objectDescriptorToMappingMap: {
        get: function () {
            if (!this.__objectDescriptorToMappingMap) {
                this.__objectDescriptorToMappingMap = new Map();
            }
            return this.__objectDescriptorToMappingMap;
        }
    },

    /**
     * Adds each mapping passed in to _descriptorToRawDataTypeMappings
     *
     * @method
     * @argument {Array<RawDataTypeMapping>} mappings
     */
    _registerRawDataTypeMappings: {
        value: function (mappings) {
            var mapping, parentType,
                i, n;

            for (i = 0, n = mappings ? mappings.length : 0; i < n; i++) {
                mapping = mappings[i];
                parentType = mapping.type.parent;
                if (!this._descriptorToRawDataTypeMappings.has(parentType)) {
                    this._descriptorToRawDataTypeMappings.set(parentType, []);
                }
                this._descriptorToRawDataTypeMappings.get(parentType).push(mapping);
            }
        }
    },

    _streamMapDataPromises: {
        get: deprecate.deprecateMethod(void 0, function () {
            return this._streamMappingPromises;
        }, "_streamMapDataPromises", "_streamMappingPromises")
    },


    /**
     * Map of DataStreams to Array of Promises which will
     * be resolved when the raw-data-to-object mapping is 
     * complete
     *
     * @property {Map<DataStream:Array<Promise>>}
     */
    _streamMappingPromises: {
        get: function () {
            if (!this.__streamMappingPromises) {
                this.__streamMappingPromises = new Map();
            }
            return this.__streamMappingPromises;
        }
    },

    /**
     * Adds a mapping to the service for the specified
     * type.
     * @param {DataMapping} mapping.  The mapping to use.
     * @param {ObjectDescriptor} type.  The object type.
     */
    addMappingForType: {
        value: function (mapping, type) {
            var descriptor = this._objectDescriptorForType(type);
            mapping.service = mapping.service || this;
            this._objectDescriptorToMappingMap.set(descriptor, mapping);
        }
    },


    /**
     * Indicates whether this service implements mapObjectToRawData. Allows 
     * [saveDataObject()]{@link DataService#saveDataObject} to determine whether this file
     * is responsible for data mapping or not.
     *
     *
     * @property {Boolean}
     */
    implementsMapObjectToRawData: {
        get: function () {
            return exports.DataService.prototype.mapObjectToRawData !== this.mapObjectToRawData;
        }
    },

    /**
     * Indicates whether this service implements mapRawDataToObject. Allows 
     * [fetchData()]{@link DataService#fetchData} to determine whether this file
     * is responsible for data mapping or not.
     *
     * @property {Boolean}
     */
    implementsMapRawDataToObject: {
        get: function () {
            return exports.DataService.prototype.mapRawDataToObject !== this.mapRawDataToObject;
        }
    },

    /**
     * Retrieve DataMapping for this object.
     *
     * @method
     * @argument {Object} object - An object whose object descriptor has a DataMapping
     */
    mappingForObject: {
        value: function (object, canReturnNull) {
            var objectDescriptor = this.objectDescriptorForObject(object),
                mapping = objectDescriptor && this.mappingWithType(objectDescriptor);


            if (!mapping && objectDescriptor && !canReturnNull) {
                mapping = this._objectDescriptorToMappingMap.get(objectDescriptor);
                if (!mapping) {
                    mapping = DataMapping.withObjectDescriptor(objectDescriptor);
                    this._objectDescriptorToMappingMap.set(objectDescriptor, mapping);
                }
            }

            return mapping;
        }
    },

    /**
     * Return the mapping to use for the specified type.
     * @param {ObjectDescriptor} type.
     * @returns {DataMapping|null} returns the specified mapping or null
     * if a mapping is not defined for the specified type.
     */
    mappingWithType: {
        value: function (type) {
            var descriptor = this._objectDescriptorForType(type),
                service = this.rootService.childServiceForType(descriptor),
                mapping;
            if (service === this) {
                mapping = this._objectDescriptorToMappingMap.has(type) && this._objectDescriptorToMappingMap.get(type);
            } else if (service) {
                mapping = service.mappingWithType(type);
            }
            return mapping || null;
        }
    },

    /**
     * Public method invoked by the framework during the conversion from
     * an object to a raw data.
     * Designed to be overriden by concrete RawDataServices to allow fine-graine control
     * when needed, beyond transformations offered by an ObjectDescriptorDataMapping or
     * an ExpressionDataMapping
     *
     * @method
     * @argument {Object} object - An object whose properties must be set or
     *                             modified to represent the raw data.
     * @argument {Object} record - An object whose properties' values hold
     *                             the raw data.
     * @argument {?} context     - The value that was passed in to the
     *                             [addRawData()]{@link RawDataService#addRawData}
     *                             call that invoked this method.
     */
    mapObjectToRawData: {
        value: function (object, record, context) {
            //Overridden in child classes
        }
    },

    mapToRawData: {
        value: deprecate.deprecateMethod(undefined, function (rawData, object, context) {
            //Overridden in child classes
        }, "mapToRawData", "mapObjectToRawData", true)
    },

    /**
     * Public method invoked by the framework during the conversion from
     * raw data to an object
     * Designed to be overridden by concrete DataService to allow fine-graine control
     * when needed, beyond transformations offered by an ObjectDescriptorDataMapping or
     * an ExpressionDataMapping
     *
     * @method
     * @argument {Object} object - An object whose properties must be set or
     *                             modified to represent the raw data.
     * @argument {Object} record - An object whose properties' values hold
     *                             the raw data.
     * @argument {?} context     - The value that was passed in to the
     *                             [addRawData()]{@link RawDataService#addRawData}
     *                             call that invoked this method.
     */
    mapRawDataToObject: {
        value: function (rawData, object, context) {
            //Overridden in child classes
        }
    },

    mapFromRawData: {
        value: deprecate.deprecateMethod(undefined, function (rawData, object, context) {
            //Overridden in child classes
        }, "mapFromRawData", "mapRawDataToObject", true)
    },

    /***************************************************************************
     * Model / Types / Object Descriptors
     */

    /**
     * Map from constructor to ObjectDescriptor. 
     * Used to allow fetches with the constructor. e.g.
     * 
     * var Foo = require("logic/model/foo").Foo;
     * mainService.fetchData(Foo);
     * 
     * @private
     * @property <Map<Function:ObjectDescriptor>>
     */
    _constructorToObjectDescriptorMap: {
        value: new Map()
    },

    /**
     * Map from moduleID to ObjectDescriptor.
     *
     * @private
     * @property <Map<String:ObjectDescriptor>>
     */
    _moduleIdToObjectDescriptorMap: {
        value: new Map()
    },

    /**
     * Map from data object to ObjectDescriptor.
     *
     * @private
     * @property <WeakMap<Object:ObjectDescriptor>>
     */
    _objectToObjectDescriptorMap: {
        value: new WeakMap()
    },

    /**
     * Returns an object descriptor for the provided object by getting 
     * the object's moduleId and inquiring with this._moduleIdToObjectDescriptorMap
     * & this.types array.
     * @param {object}
     * @returns {ObjectDescriptor|null} if an object descriptor is not found this
     * method will return null.
     */
    _objectDescriptorForObject: {
        value: function (object) {
            var types = this.types,
                objectInfo = Montage.getInfoForObject(object),
                moduleId = objectInfo.moduleId,
                objectName = objectInfo.objectName,
                module, exportName, i, n, objectDescriptor;

            if (object.constructor.TYPE instanceof DataObjectDescriptor) {
                objectDescriptor = object.constructor.TYPE;
            } else {
                objectDescriptor = this._moduleIdToObjectDescriptorMap.get(moduleId);
            }

            for (i = 0, n = types.length; i < n && !objectDescriptor; i += 1) {
                module = types[i].module;
                exportName = module && types[i].exportName;
                objectDescriptor =this._moduleIdToObjectDescriptorMap.get(moduleId);
                if (module && moduleId === module.id && objectName === exportName) {
                    objectDescriptor = types[i];
                }
            }

            return objectDescriptor;
        }
    },

    /**
     * Returns an object descriptor for a type where type is 
     * a module id, constructor, or an object descriptor. 
     *
     * @param {Function|String|ObjectDescriptor} type
     * @returns {ObjectDescriptor|null} if an object descriptor is not found this
     * method will return null.
     */
    _objectDescriptorForType: {
        value: function (type) {
            return  this._constructorToObjectDescriptorMap.get(type) ||
                    typeof type === "string" && this._moduleIdToObjectDescriptorMap.get(type) ||
                    type;
        }
    },

    /**
     * Adds DataMappings to a child DataService 
     *
     * @param {DataService} child
     * @param {Array<DataMapping>} mappings
     * @returns {Promise} 
     */
    _registerChildServiceMappings: {
        value: function (child, mappings) {
            var self = this;
            return Promise.all(mappings.map(function (mapping) {
                return Promise.all([
                    self._addMappingToService(mapping, child)
                ]);
            }));
        }
    },

    /**
     * Register the type of the specified data object if necessary.
     *
     * @private
     * @method
     * @argument {Object} object
     * @argument {ObjectDescriptor} objectDescriptor
     */
    _registerObjectWithObjectDescriptor: {
        value: function (object, objectDescriptor) {
            if (this._objectToObjectDescriptorMap.get(object) !== objectDescriptor){
                this._objectToObjectDescriptorMap.set(object, objectDescriptor);
            }
        }
    },

    /**
     * Register ObjectDescriptors by module ID
     *
     * @param {Array<ObjectDescriptor>} mappings
     * @returns {Promise} 
     */
    _registerObjectDescriptorsByModuleId: {
        value: function (types) {
            var map = this._moduleIdToObjectDescriptorMap;
            types.forEach(function (objectDescriptor) {
                var module = objectDescriptor.module,
                    moduleId = [module.id, objectDescriptor.exportName].join("/");
                map.set(moduleId, objectDescriptor);
            });
        }
    },

    _registerOwnTypesAndMappings: {
        value: function (types, mappings) {
            var self = this,
                objectDescriptors;
            return this._resolveAsynchronousTypes(types).then(function (descriptors) {
                objectDescriptors = descriptors;
                self._registerTypesByModuleId(objectDescriptors);
                return self._registerChildServiceMappings(self, mappings);
            }).then(function () {
                return self._prototypesForModuleObjectDescriptors(objectDescriptors);
            }).then(function () {
                // self.addChildService(child, types);
                return null;
            });
        }
    },

    _registerTypesByModuleId: {
        value: deprecate.deprecateMethod(void 0, function (types) {
            return this._registerObjectDescriptorsByModuleId(types);
        }, "_registerTypesByModuleId", "_registerObjectDescriptorsByModuleId", true)
    },

     /**
     * Resolve mixed array of Promises and ObjectDescriptors down to 
     * a single Promise that returns array of ObjectDescriptors
     *
     * @param {Array<ObjectDescriptor|Promise>} mappings
     * @returns {Promise} 
     */
    _resolveAsynchronousTypes: {
        value: function (types) {
            var self = this;
            return Promise.all(this._flattenArray(types).map(function (type) {
                return type instanceof Promise ? type : Promise.resolve(type);
            })).then(function (descriptors) {
                return self._flattenArray(descriptors);
            });
        }
    },

    /**
     * The maximum amount of time a DataService's data will be considered fresh.
     * ObjectDescriptor's maxAge should take precedence over this and a DataStream's dataMaxAge should
     * take precedence over a DataService's dataMaxAge global default value.
     *
     * @type {Number}
     */
    dataMaxAge: {
        value: undefined
    },

    /**
     * The [model]{@link ObjectModel} that this service supports.  If the model is
     * defined the service supports all the object descriptors contained within the model.
     */
    model: {
        value: undefined
    },


    /**
     * Returns an object descriptor for the provided object.  If this service
     * does not have an object descriptor for this object it will ask its
     * parent for one.
     * @param {object}
     * @returns {ObjectDescriptor|null} if an object descriptor is not found this
     * method will return null.
     */
    objectDescriptorForObject: {
        value: function (object) {
            return this._objectToObjectDescriptorMap.get(object) || 
                   this._objectDescriptorForObject(object) || 
                   this.parentService && this.parentService.objectDescriptorForObject(object);
        }
    },


    /***************************************************************************
     * Data Triggers
     */

     
    _prototypesForModuleObjectDescriptors: {
        value: function (objectDescriptors) {
            var self = this;
            return Promise.all(objectDescriptors.map(function (objectDescriptor) {
                return self._prototypeForModuleObjectDescriptor(objectDescriptor);
            }));
        }
    },

    /**
     * Builds a prototype that includes DataTriggers on the properties defined 
     * on the ObjectDescriptor and registers it with the DataService.
     * 
     * 
     * @method
     * @argument {DataService} childService          - The childService that controls the mapping
     *                                                 for this objectDescriptor.
     * @argument {ObjectDescriptor} objectDescriptor - ObjectDescriptor with the propertyDescriptors for which 
     *                                                 DataTriggers will be added on the prototype
     * @returns {Promise}
     */
    _prototypeForModuleObjectDescriptor: {
        value: function (objectDescriptor) {
            var self = this,
                module = objectDescriptor.module;

            return module.require.async(module.id).then(function (exports) {
                var constructor = exports[objectDescriptor.exportName],
                    prototype = self._prototypeForType(objectDescriptor, constructor);
                return null;
            });
        }
    },

    /**
     * Map of object descriptors to their prototypes
     *
     * @type {Map<ObjectDescriptor|Function:Function>} 
     */
    _objectPrototypes: {
        get: function () {
            if (!this.__objectPrototypes){
                this.__objectPrototypes = new Map();
            }
            return this.__objectPrototypes;
        }
    },

    /**
     * Map of object descriptors to their prototypes
     *
     * @type {Map<ObjectDescriptor|Function:Object<String:DataTrigger>} 
     */
    _objectTriggers: {
        get: function () {
            if (!this.__objectTriggers){
                this.__objectTriggers = new Map();
            }
            return this.__objectTriggers;
        }
    },

    /**
     * Returns a prototype for objects of the specified type. The returned
     * prototype will have a [data trigger]{@link DataTrigger} defined for each
     * lazy relationships and properties of that type. A single prototype will
     * be created for all objects of a given type.
     *
     * @private
     * @method
     * @argument {DataObjectDescriptor|ObjectDescriptor} type
     * @returns {Object}
     */
    _prototypeForType: {
        value: function (type, constructor) {
            var descriptor = this._objectDescriptorForType(type),
                prototype = this._objectPrototypes.get(descriptor),
                info, mapping, triggers, requisites;

            if (descriptor && !prototype) {
                prototype = constructor           ? constructor.prototype :
                            type.objectPrototype  ? type.objectPrototype :
                                                    Montage.prototype;
                prototype = Object.create(prototype);
                if (this._isObjectDescriptor(descriptor)) {
                    mapping = this.mappingWithType(descriptor);
                    requisites = mapping ? mapping.requisitePropertyNames : new Set();
                    triggers = DataTrigger.addTriggers(this, descriptor, prototype, requisites);
                } else {
                    info = Montage.getInfoForObject(descriptor.prototype);
                    console.warn("Data Triggers cannot be created for this type. (" + (info && info.objectName) + ") is not an ObjectDescriptor");
                    triggers = [];
                }
                if (constructor) {
                    this._objectPrototypes.set(constructor, prototype);
                    this._constructorToObjectDescriptorMap.set(constructor, descriptor);
                }
                this._objectPrototypes.set(descriptor, prototype);
                this._objectTriggers.set(descriptor, triggers);
            }
            return prototype;
        }
    },

    /**
     * Returns the [data triggers]{@link DataTrigger} set up for objects of the
     * specified type.
     *
     * @private
     * @method
     * @argument {Object} object
     * @returns {Object<string, DataTrigger>}
     */
    _triggersForObject: {
        value: function (object) {
            var type = this.objectDescriptorForObject(object);
            return type && this._objectTriggers.get(type);
        }
    },

    /***************************************************************************
     * Data Object Properties
     */

     /**
     * Returns the delegate method for a given property.
     * E.g. 
     * propertyName: features
     *      returns: fetchFeaturesProperty()
     * 
     * propertyName: location
     *      returns: fetchLocationProperty()
     *
     * @private
     * @method
     * @argument {String} propertyName
     * @returns {Function}
     */
    _delegateFunctionForPropertyName: {
        value: function (propertyName) {
            var capitalized = propertyName.charAt(0).toUpperCase() + propertyName.slice(1),
                functionName = "fetch" + capitalized + "Property";
            return typeof this[functionName] === "function" && this[functionName];
        }
    },
    

    /**
     * Fetch a property on an object using an objectDescriptor mapping and a propertyDescriptor
     *
     * @private
     * @method
     * @argument {Object} object
     * @argument {String} propertyName
     * @argument {PropertyDescriptor} propertyDescriptor
     * @returns {Promise}
     */
    _fetchObjectPropertyWithPropertyDescriptor: {
        value: function (object, propertyName, propertyDescriptor) {
            var self = this,
                objectDescriptor = propertyDescriptor.owner,
                mapping = objectDescriptor && this.mappingWithType(objectDescriptor),
                data = {},
                result;

            if (mapping) {
                Object.assign(data, this.snapshotForObject(object));
                if (typeof mapping.mapObjectToCriteriaSourceForProperty !== "function") {
                    result = mapping.mapRawDataToObjectProperty(data, object, propertyName);
                    if (!result || typeof result.then !== "function") {
                        result = Promise.resolve(result);
                    }
                } else {
                    result = mapping.mapObjectToCriteriaSourceForProperty(object, data, propertyName).then(function() {
                        Object.assign(data, self.snapshotForObject(object));
                        return mapping.mapRawDataToObjectProperty(data, object, propertyName);
                    });
                }
            } else {
                result = this.nullPromise;
            }

            return result;
        }
    },

    /**
     * Retrieve the DataTriggers for object properties and get the property values
     * softly or forcefully depending on whether this is an update
     * 
     * @private
     * @method
     * @argument {Object} object       - the object whose properties will be fetched
     * @argument {Array<String>} names - the property names to fetch
     * @argument {Integer} start       - index of the names array at which to start looping
     * @argument {Boolean} isUpdate    - whether or not the properties should be forcefully retrieved
     * @returns  {Array<Promise>} 
     */
    _getOrUpdateObjectProperties: {
        value: function (object, names, start, isUpdate) {
            var triggers, trigger, promises, promise, i, n;
            // Request each data value separately, collecting unique resulting
            // promises into an array and a set, but avoid creating any array
            // or set unless that's necessary.
            triggers = this._triggersForObject(object);
            for (i = start, n = names.length; i < n; i += 1) {
                trigger = triggers && triggers[names[i]];
                promise = !trigger ? this.nullPromise :
                          isUpdate ? trigger.updateObjectProperty(object) :
                                     trigger.getObjectProperty(object);
                if (promise !== this.nullPromise) {
                    if (!promises) {
                        promises = {array: [promise]};
                    } else if (!promises.set && promises.array[0] !== promise) {
                        promises.set = new Set();
                        promises.set.add(promises.array[0]);
                        promises.set.add(promise);
                        promises.array.push(promise);
                    } else if (promises.set && !promises.set.has(promise)) {
                        promises.set.add(promise);
                        promises.array.push(promise);
                    }
                }
            }

            // Return a promise that will be fulfilled only when all of the
            // requested data has been set on the object. If possible do this
            // without creating any additional promises.
            return !promises ?     this.nullPromise :
                   !promises.set ? promises.array[0] :
                                   Promise.all(promises.array).then(this.nullFunction);
        }
    },
    

    /**
     * Recursively resolve all properties along a path from a given starting object. 
     * E.g. to get a property named user.employer.location.city,
     * 
     *              object = user
     * propertiesToRequest = ["employer", "location", "city"]
     * 
     * 
     * @private
     * @method
     * @argument {Object} object                     - the object whose properties will be fetched
     * @argument {Array<String>} propertiesToRequest - the property names to fetch
     * @returns  {Promise} 
     */
    _getPropertiesOnPath: {
        value: function (object, propertiesToRequest) {
            var self = this,
                propertyName = propertiesToRequest.shift(),
                promise = this.getObjectProperties(object, propertyName);

            if (promise) {
                return promise.then(function () {
                    var result = null;
                    if (propertiesToRequest.length && object[propertyName]) {
                        result = self._getPropertiesOnPath(object[propertyName], propertiesToRequest);
                    }
                    return result;
                });
            } else {
                return this.nullPromise;
            }
        }
    },

    _propertyDescriptorForObjectAndName: {
        value: function (object, propertyName) {
            var objectDescriptor = this.objectDescriptorForObject(object);
            return objectDescriptor && objectDescriptor.propertyDescriptorForName(propertyName);
        }
    },

    /**
     * Since root services are responsible for triggering data objects fetches,
     * subclasses whose instances will not be root services should override this
     * method to call their root service's implementation of it.
     *
     * @todo Rename and document API and implementation.
     *
     * @method
     */
    decacheObjectProperties: {
        value: function (object, propertyNames) {
            if (this.isRootService) {
                var names = Array.isArray(propertyNames) ? propertyNames : arguments,
                    start = names === propertyNames ? 0 : 1,
                    triggers = this._triggersForObject(object),
                    trigger, i, n;
                for (i = start, n = names.length; i < n; i += 1) {
                    trigger = triggers && triggers[names[i]];
                    if (trigger) {
                        trigger.decacheObjectProperty(object);
                    }
                }
            }
            else {
                this.rootService.decacheObjectProperties(object, propertyNames);
            }

        }
    },

    /**
     * Fetch the value of a data object's property, possibly asynchronously.
     *
     * The default implementation of this method delegates the fetching to a
     * child services, or does nothing but return a fulfilled promise for `null`
     * if no child service can be found to handle the specified object.
     *
     * [Data service]{@link DataService} subclasses should override
     * this method to perform any fetch or other operation required to get the
     * requested data. The subclass implementations of this method should use
     * only [fetchData()]{@link DataService#fetchData} calls to fetch data.
     *
     * This method should never be called directly:
     * [getObjectProperties()]{@link DataService#getObjectProperties} or
     * [updateObjectProperties()]{@link DataService#updateObjectProperties}
     * should be called instead as those methods handles some required caching,
     * fetch aggregation, and [data trigger]{@link DataTrigger}. Those methods
     * will call this method if and when that is necessary.
     *
     * Like the promise returned by
     * [getObjectProperties()]{@link DataService#getObjectProperties}, the
     * promise returned by this method should not pass the requested value to
     * its callback: That value must instead be set on the object passed in to
     * this method.
     *
     * @method
     * @argument {object} object   - The object whose property value is being
     *                               requested.
     * @argument {string} name     - The name of the single property whose value
     *                               is being requested.
     * @returns {external:Promise} - A promise fulfilled when the requested
     * value has been received and set on the specified property of the passed
     * in object.
     */
    fetchObjectProperty: {
        value: function (object, propertyName) {
            var isHandler = this.parentService ? this.parentService._childServiceForObject(object) === this : this._childServiceForObject(object) === this,
                useDelegate = isHandler && typeof this.fetchRawObjectProperty === "function",
                delegateFunction = !useDelegate && isHandler && this._delegateFunctionForPropertyName(propertyName),
                propertyDescriptor = !useDelegate && !delegateFunction && isHandler && this._propertyDescriptorForObjectAndName(object, propertyName),
                childService = !isHandler && this._childServiceForObject(object);

                console.log("isHandler", this.identifier, propertyName, isHandler);
            

            var result = useDelegate ?                       this.fetchRawObjectProperty(object, propertyName) :
                        delegateFunction ?                  delegateFunction.call(this, object) :
                        isHandler && propertyDescriptor ?   this._fetchObjectPropertyWithPropertyDescriptor(object, propertyName, propertyDescriptor) :
                        childService ?                      childService.fetchObjectProperty(object, propertyName) :
                                                            this.nullPromise;
            return result;
        }
    },

    /**
     * Request possibly asynchronous values of a data object's properties. These
     * values will only be fetched if necessary and only the first time they are
     * requested.
     *
     * To force an update of a value that was previously obtained or set, use
     * [updateObjectProperties()]{@link DataService#updateObjectProperties}
     * instead of this method.
     *
     * Since root services are responsible for determining when to fetch or
     * update data objects values, subclasses whose instances will not be root
     * services should override this method to call their root service's
     * implementation of it.
     *
     * Subclasses should define how property values are obtained by overriding
     * [fetchObjectProperty()]{@link DataService#fetchObjectProperty} instead
     * of this method. That method will be called by this method when needed.
     *
     * Although this method returns a promise, the requested data will not be
     * passed in to the promise's callback. Instead that callback will received
     * a `null` value and the requested values will be set on the specified
     * properties of the object passed in. Those values can be accessed there
     * when the returned promise is fulfilled, as in the following code:
     *
     *     myService.getObjectProperties(myObject, "x", "y").then(function () {
     *         someFunction(myObject.x, myObject.y);
     *     }
     *
     * @method
     * @argument {object} object          - The object whose property values are
     *                                      being requested.
     * @argument {string[]} propertyNames - The names of each of the properties
     *                                      whose values are being requested.
     *                                      These can be provided as an array of
     *                                      strings or as a list of string
     *                                      arguments following the object
     *                                      argument.
     * @returns {external:Promise} - A promise fulfilled when all of the
     * requested data has been received and set on the specified properties of
     * the passed in object.
     */
    getObjectProperties: {
        value: function (object, propertyNames) {
             if (this.isRootService) {
                // Get the data, accepting property names as an array or as a list
                // of string arguments while avoiding the creation of any new array.
                var names = Array.isArray(propertyNames) ? propertyNames : arguments,
                    start = names === propertyNames ? 0 : 1;
                return this._getOrUpdateObjectProperties(object, names, start, false);
            }
            else {
                return this.rootService.getObjectProperties(object, propertyNames);
            }
        }
    },

    /**
     * Request possibly asynchronous values of a data object's properties defined as 
     * as frb expressions.
     *
     *     myService.getObjectPropertyExpressions(myObject, "x.a", "y.b").then(function () {
     *         someFunction(myObject.x.a, myObject.y.b);
     *     }
     *
     * @method
     * @argument {object} object          - The object whose property values are
     *                                      being requested.
     * @argument {string[]} propertyValueExpressions - The expressions defining the properties
     *                                                 whose values are being requested.
     *                                                 These can be provided as an array of
     *                                                 strings or as a list of string
     *                                                 arguments following the object
     *                                                 argument.
     * @returns {external:Promise} - A promise fulfilled when all of the
     * requested data has been received and set on the specified properties of
     * the passed in object.
     */
    getObjectPropertyExpressions: {
        value: function (object, propertyValueExpressions) {
            if (this.isRootService) {
                // Get the data, accepting property names as an array or as a list
                // of string arguments while avoiding the creation of any new array.
                var expressions = Array.isArray(propertyValueExpressions) ? propertyValueExpressions : arguments,
                    start = expressions === propertyValueExpressions ? 0 : 1,
                    promises = [],
                    self = this;


                expressions.forEach(function (expression) {
                    var split = expression.split(".");
                        promises.push(self._getPropertiesOnPath(object, split));
                });


                return Promise.all(promises);
            } else {
                return this.rootService.getObjectPropertyExpressions(object, propertyValueExpressions);
            }
        }
    },


    /**
     * Request possibly asynchronous values of a data object's properties,
     * forcing asynchronous values to be re-fetched and updated even if they
     * had previously been fetched or set.
     *
     * Except for the forced update, this method behaves exactly like
     * [getObjectProperties()]{@link DataService#getObjectProperties}.
     *
     * Since root services are responsible for determining when to fetch or
     * update data objects values, subclasses whose instances will not be root
     * services should override this method to call their root service's
     * implementation of it.
     *
     * Subclasses should define how property values are obtained by overriding
     * [fetchObjectProperty()]{@link DataService#fetchObjectProperty} instead
     * of this method. That method will be called by this method when needed.
     *
     * @method
     * @argument {object} object          - The object whose property values are
     *                                      being requested.
     * @argument {string[]} propertyNames - The names of each of the properties
     *                                      whose values are being requested.
     *                                      These can be provided as an array of
     *                                      strings or as a list of string
     *                                      arguments following the object
     *                                      argument.
     * @returns {external:Promise} - A promise fulfilled when all of the
     * requested data has been received and set on the specified properties of
     * the passed in object.
     */
    updateObjectProperties: {
        value: function (object, propertyNames) {
              if (this.isRootService) {
                // Get the data, accepting property names as an array or as a list
                // of string arguments while avoiding the creation of any new array.
                var names = Array.isArray(propertyNames) ? propertyNames : arguments,
                    start = names === propertyNames ? 0 : 1;
                return this._getOrUpdateObjectProperties(object, names, start, true);
              }
              else {
                return this.rootService.updateObjectProperties(object, propertyNames);
              }
        }
    },


    /***************************************************************************
     * Data Object Creation / Changes
     */

     /**
     * Create a data object without registering it in the new object map.
     *
     * @private
     * @method
     * @argument {ObjectDescriptor} type - The type of object to create.
     * @returns {Object}                     - The created object.
     */
    _createDataObject: {
        value: function (type, dataIdentifier) {
            var objectDescriptor = this._objectDescriptorForType(type),
                object = Object.create(this._prototypeForType(objectDescriptor));
            if (object) {
                //This needs to be done before a user-land code can attempt to do
                //anyting inside its constructor, like creating a binding on a relationships
                //causing a trigger to fire, not knowing about the match between identifier
                //and object... If that's feels like a real situation, it is.
                this.registerUniqueObjectWithDataIdentifier(object, dataIdentifier);
                object = object.constructor.call(object) || object;
                if (object) {
                    this._registerObjectWithObjectDescriptor(object, objectDescriptor);
                }
            }
            return object;
        }
    },

    _dataIdentifierByObject: {
        // This property is shared with all child services.
        // If created lazily the wrong data identifier will be returned when
        // accessed by a child service.
        value: new WeakMap()
    },

    _objectByDataIdentifier: {
        get: function() {
            return this.__objectByDataIdentifier || (this.__objectByDataIdentifier = new WeakMap());
        }
    },

     /**
     * A set of the data objects managed by this service or any other descendent
     * of this service's [root service]{@link DataService#rootService} that have
     * been changed since that root service's data was last saved, or since the
     * root service was created if that service's data hasn't been saved yet
     *
     * Since root services are responsible for tracking data objects, subclasses
     * whose instances will not be root services should override this property
     * to return their root service's value for it.
     *
     * @type {Set.<Object>}
     */
    changedDataObjects: {
        get: function () {
            if (this.isRootService) {
                this._changedDataObjects = this._changedDataObjects || new Set();
                return this._changedDataObjects;
            }
            else {
                return this.rootService.changedDataObjects;
            }
        }
    },

    /**
     * Create a new data object of the specified type.
     *
     * Since root services are responsible for tracking and creating data
     * objects, subclasses whose instances will not be root services should
     * override this method to call their root service's implementation of it.
     *
     * @method
     * @argument {ObjectDescriptor} type - The type of object to create.
     * @returns {Object}                     - The created object.
     */
    //TODO add the creation of a temporary identifier to pass to _createDataObject
    createDataObject: {
        value: function (type) {
            if (this.isRootService) {
                var object = this._createDataObject(type);
                this.createdDataObjects.add(object);
                return object;
            } else {
                this.rootService.createDataObject(type);
            }
        }
    },

    /**
     * A set of the data objects created by this service or any other descendent
     * of this service's [root service]{@link DataService#rootService} since
     * that root service's data was last saved, or since the root service was
     * created if that service's data hasn't been saved yet.
     *
     * Since root services are responsible for tracking data objects, subclasses
     * whose instances will not be root services should override this property
     * to return their root service's value for it.
     *
     * @type {Set.<Object>}
     */
    createdDataObjects: {
        get: function () {
            if (this.isRootService) {
                if (!this._createdDataObjects) {
                    this._createdDataObjects = new Set();
                }
                return this._createdDataObjects;
            }
            else {
                return this.rootService.createdDataObjects;
            }
        }
    },


    /**
     * Returns a unique object for a DataIdentifier
     * [fetchObjectProperty()]{@link DataService#fetchObjectProperty} instead
     * of this method. That method will be called by this method when needed.
     *
     * @method
     * @argument {object} object         - The object whose property values are
     *                                      being requested.
     *
     * @returns {DataIdentifier}        - An object's DataIdentifier
     */
    dataIdentifierForObject: {
        value: function (object) {
            return this._dataIdentifierByObject.get(object);
        }
    },

    /**
     * Find an existing data object corresponding to the specified raw data, or
     * if no such object exists, create one.
     *
     * Since root services are responsible for tracking and creating data
     * objects, subclasses whose instances will not be root services should
     * override this method to call their root service's implementation of it.
     *
     * @method
     * @argument {ObjectDescriptor} type - The type of object to find or
     *                                         create.
     * @argument {Object} data               - An object whose property values
     *                                         hold the object's raw data. That
     *                                         data will be used to determine
     *                                         the object's unique identifier.
     * @argument {?} context                 - A value, usually passed in to a
     *                                         [data service's]{@link DataServoce}
     *                                         [addRawData()]{@link DataServoce#addRawData}
     *                                         method, that can help in getting
     *                                         or creating the object.
     * @returns {Object} - The existing object with the unique identifier
     * specified in the raw data, or if no such object exists a newly created
     * object of the specified type.
     */
    getDataObject: {
        value: function (type, data, context, dataIdentifier) {
            if (this.isRootService) {
                var dataObject;
                if (this.isUniquing && dataIdentifier) {
                    dataObject = this.objectForDataIdentifier(dataIdentifier);
                }
                if (!dataObject) {
                    dataObject = this._createDataObject(type, dataIdentifier);
                }

                return dataObject;
            }
            else {
                return this.rootService.getDataObject(type, data, context, dataIdentifier);
            }

        }
    },

    /**
     * Flag determining whether objects will be stored be registered and identified by
     * a dataIdentifier. This is required for relationships to work properly.
     * 
     *
     * @property {Boolean}
     */
    isUniquing: {
        value: false
    },

    /**
     *  Returns a unique object for a DataIdentifier
     * [fetchObjectProperty()]{@link DataService#fetchObjectProperty} instead
     * of this method. That method will be called by this method when needed.
     *
     * @method
     * @argument {object} object        - object
     * @returns {DataIdentifier}        - object's DataIdentifier
     */
    objectForDataIdentifier: {
        value: function(dataIdentifier) {
            return this._objectByDataIdentifier.get(dataIdentifier);
        }
    },

    /**
     * Register an object with its dataIdentifier for uniquing reasons
     *
     * @private
     * @method
     * @argument {Object} object - object to register.
     * @argument {DataIdentifier} dataIdentifier - dataIdentifier of object to register.
     * @returns {void}
     */
   registerUniqueObjectWithDataIdentifier: {
        value: function(object, dataIdentifier) {
            if (object && dataIdentifier && this.isRootService && this.isUniquing) {
                this._dataIdentifierByObject.set(object, dataIdentifier);
                this._objectByDataIdentifier.set(dataIdentifier, object);
            }
        }
    },

    /**
     * Remove an object's DataIdentifier
     *
     * @method
     * @argument {object} object         - an object
     */
    removeDataIdentifierForObject: {
        value: function(object) {
            this._dataIdentifierByObject.delete(object);
        }
    },

    /**
     * Remove an object's DataIdentifier
     *
     * @method
     * @argument {object} object         - an object
     */
    removeObjectForDataIdentifier: {
        value: function(dataIdentifier) {
            this._objectByDataIdentifier.delete(dataIdentifier);
        }
    },
    
    /***************************************************************************
     * Fetching Data
     */

    _cancelServiceDataStream: {
        value: function (rawDataService, dataStream, reason) {
            rawDataService.cancelRawDataStream(dataStream, reason);
            this._dataServiceByDataStream.delete(dataStream);
        }
    },

    /**
     * Get or make a DataIdentifier for an ObjectDescriptor and a primary key
     *
     * @method
     * @argument {ObjectDescriptor} [type] - ObjectDescriptor for the type that this rawData represents
     * @argument {String} [primaryKey]     - The primaryKey for the rawData for which the method will 
     *                                       build a dataIdentifier.
     * 
     * @returns {DataIdentifier}
     */
    _dataIdentifierForTypeAndPrimaryKey: {
        value: function (type, primaryKey) {
            var typeName = type.typeName /*DataDescriptor*/ || type.name,
                dataIdentifierMap = this._typeIdentifierMap.get(type),
                dataIdentifier;

            if (!dataIdentifierMap) {
                this._typeIdentifierMap.set(type,(dataIdentifierMap = new Map()));
            }

            dataIdentifier = dataIdentifierMap.get(primaryKey);
            if (!dataIdentifier) {
                //This should be done by ObjectDescriptor/blueprint using primaryProperties
                //and extract the corresponsing values from rawData
                //For now we know here that MileZero objects have an "id" attribute.
                dataIdentifier = new DataIdentifier();
                dataIdentifier.objectDescriptor = type;
                dataIdentifier.dataService = this;
                dataIdentifier.typeName = type.name;
                dataIdentifier._identifier = dataIdentifier.primaryKey = primaryKey;

                dataIdentifierMap.set(primaryKey, dataIdentifier);
            }

            return dataIdentifier;
        }
    },

    /**
     * Cache storing which service owns each DataStream
     *
     * @private
     * @property {WeakMap<DataStream:DataService>>}
     */
    _dataServiceByDataStream: {
        get: function () {
            return this.__dataServiceByDataStream || (this.__dataServiceByDataStream = new WeakMap());
        }
    },

    /**
     * Evaluates a rawData object against the RawDataTypeMappings for the fetched
     * class and returns the subclass for the first mapping that evaluates to true.
     *
     * @method
     * @param {ObjectDescriptor} parent Fetched class for which to look for subclasses
     * @param {Object} rawData rawData to evaluate against the RawDataTypeMappings
     * @return {ObjectDescriptor}
     */
    _descriptorForParentAndRawData: {
        value: function (parent, rawData) {
            var mappings = this._descriptorToRawDataTypeMappings.get(parent),
                compiled, mapping, subType,
                i, n;

            if (mappings && mappings.length) {
                for (i = 0, n = mappings.length; i < n && !subType; ++i) {
                    mapping = mappings[i];
                    subType = mapping.criteria.evaluate(rawData) && mapping.type;
                }
            }

            return subType ? this._descriptorForParentAndRawData(subType, rawData) : parent;
        }
    },


    /**
     * Get cooked object for this ObjectDescriptor and rawData and 
     * map the rawData to it. 
     * 
     * This is in contrast to the synchronous objectForTypeRawData which
     * will not map the rawData to the object.
     * 
     * Returns the same object in memory for rawData with matching primaryKeys.
     *
     * @method
     * @argument {ObjectDescriptor} [type] - ObjectDescriptor for the type that this rawData represents
     * @argument {Object} [rawData] - An anonymnous object whose properties'
     *                                values hold the raw data.
     * @argument {Object} [context] - An anonymnous object whose properties'
     *                                values hold the raw data.
     * @returns  {Promise<Object>}  - object fully mapped with the rawData
     */
    _mappedObjectForTypeAndRawData: {
        value: function (type, rawData, context) {
            var object = this.objectForTypeRawData(type, rawData, context),
                mapResult = this._mapRawDataToObject(rawData, object, context),
                result;

            if (mapResult instanceof Promise) {
                result = mapResult.then(function () {
                    return object;
                });
            } else {
                result = Promise.resolve(object);
            }

            return result;
        }
    },


    /**
     * Return the module id for the DataService for this query.
     * The module id is defined either on the query parameters or
     * or on the mapping rule for this property.
     *
     * @method
     * @argument {DataQuery} query         - a DataQuery
     * @return {String} serviceModuleID    - Module ID of a data service
     */
    _serviceIdentifierForQuery: {
        value: function (query) {
            var parameters = query.criteria.parameters,
                serviceModuleID = parameters && parameters.serviceIdentifier,
                mapping, propertyName;

            if (!serviceModuleID) {
                mapping = this.mappingWithType(query.type);
                propertyName = mapping && parameters && parameters.propertyName;
                serviceModuleID = propertyName && mapping.serviceIdentifierForProperty(propertyName);
            }

            return serviceModuleID;
        }
    },

    /**
     * Records in the process of being written to streams (after
     * [addRawData()]{@link RawDataService#addRawData} has been called and
     * before [rawDataDone()]{@link RawDataService#rawDataDone} is called for
     * any given stream). This is used to collect raw data that needs to be
     * stored for offline use.
     *
     * @private
     * @type {Object.<Stream, records>}
     */
    _streamRawData: {
        get: function () {
            if (!this.__streamRawData) {
                this.__streamRawData = new WeakMap();
            }
            return this.__streamRawData;
        }
    },

    /**
     * Called by [addRawData()]{@link DataService#addRawData} to add an object
     * for the passed record to the stream. This method both takes care of doing
     * mapRawDataToObject and add the object to the stream.
     *
     * @method
     * @argument {DataStream} stream
     *                           - The stream to which the data objects created
     *                             from the raw data should be added.
     * @argument {Object} rawData - An anonymnous object whose properties'
     *                             values hold the raw data. This array
     *                             will be modified by this method.
     * @argument {?} context     - An arbitrary value that will be passed to
     *                             [getDataObject()]{@link DataService#getDataObject}
     *                             and
     *                             [mapRawDataToObject()]{@link DataService#mapRawDataToObject}
     *                             if it is provided.
     * @argument {Boolean} canMap - Indicate whether this service is eligible to map 
     *                              the rawData.
     * @returns {Promise<MappedObject>} - A promise resolving to the mapped object.
     *
     */
    addOneRawData: {
        value: function (stream, rawData, context, canMap) {
            var type = this._descriptorForParentAndRawData(stream.query.type, rawData),
                objectDescriptor = rawData && this.objectDescriptorForObject(rawData),
                // canMap is a new argument. 
                // To support backwards compatibility, we assume that 
                // calls to addOneRawData without canMap expect 
                // the function to perform the mapping
                shouldMap = arguments.length < 4 || (canMap && !objectDescriptor), 
                object = true, result;


            if (shouldMap) {
                result = this._mappedObjectForTypeAndRawData(type, rawData, context).then(function (object) {
                    stream.addData(object);
                });
            } else {
                stream.addData(rawData);
                result = this.nullPromise;
            }

            this._addMappingPromiseForStream(result, stream);

            if (object) {
                this.callDelegateMethod("rawDataServiceDidAddOneRawData", this, stream, rawData, object);
            }
            
            return result;
        }
    },
    

    /**
     * To be called by [fetchData()]{@link DataService#fetchData} or
     * [fetchRawData()]{@link DataService#fetchRawData} when raw data records
     * are received. This method should never be called outside of those
     * methods.
     *
     * This method creates and registers the data objects that
     * will represent the raw records with repeated calls to
     * [getDataObject()]{@link DataService#getDataObject}, maps
     * the raw data to those objects with repeated calls to
     * [mapRawDataToObject()]{@link DataService#mapRawDataToObject},
     * and then adds those objects to the specified stream.
     *
     * Subclasses should not override this method and instead override their
     * [getDataObject()]{@link DataService#getDataObject} method, their
     * [mapRawDataToObject()]{@link DataService#mapRawDataToObject} method,
     * their [mapping]{@link DataService#mapping}'s
     * [mapRawDataToObject()]{@link DataService#mapRawDataToObject} method,
     * or several of these.
     *
     * @method
     * @argument {DataStream} stream
     *                           - The stream to which the data objects created
     *                             from the raw data should be added.
     * @argument {Array} records - An array of objects whose properties'
     *                             values hold the raw data. This array
     *                             will be modified by this method.
     * @argument {?} context     - An arbitrary value that will be passed to
     *                             [getDataObject()]{@link DataService#getDataObject}
     *                             and
     *                             [mapRawDataToObject()]{@link DataService#mapRawDataToObject}
     *                             if it is provided.
     */
    addRawData: {
        value: function (stream, records, context, shouldBatch) {
            var offline, i, n,
                streamQueryType = stream.query.type,
                ownMapping = this.mappingWithType(streamQueryType),
                serviceID = this._serviceIdentifierForQuery(stream.query),
                canMap = (ownMapping || this.implementsMapRawDataToObject || this.isRootService) && !serviceID,
                iRecord;

            // console.log("DataService.addRawData", this.identifier, streamQueryType && streamQueryType.name);
            // debugger;
            // Record fetched raw data for offline use if appropriate.
            offline = records && !this.isOffline && this._streamRawData.get(stream);
            if (offline) {
                offline.push.apply(offline, records);
            } else if (records && !this.isOffline) {
                //Do we really need to make a shallow copy of the array for bookeeping?
                //this._streamRawData.set(stream, records.slice());
                this._streamRawData.set(stream, records);
            }

            if ((this.batchAddsDataToStream || shouldBatch) && canMap) {
                this._addAllRawData(stream, records, context);
            } else {
                for (i = 0, n = records && records.length; i < n; i++) {
                    this.addOneRawData(stream, records[i], context, canMap);
                }
            }
        }
    },

    _addAllRawData: {
        value: function (stream, records, context) {
            var promises = [],
                promise, i, n;
        
            for (i = 0, n = records && records.length; i < n; i++) {
                promise = this._mappedObjectForTypeAndRawData(stream.query.type, records[i], context);
                promises.push(promise);
                this._addMappingPromiseForStream(promise, stream);
            }
            Promise.all(promises).then(function (objects) {
                stream.addData(objects);
            });
        }
    },

    /**
     * Determines whether rawData passed to addRawData is added to the 
     * stream one-by-one or with the entire array. 
     * 
     * E.g. This rawData
     *              
     *      [{id: 1}, {id: 2}, {id: 3}, {id: 4}]
     * 
     * can be mapped to the cooked object in these amounts of time:
     *       ID     TIME
     *       1      100ms
     *       2      50ms
     *       3      300ms
     *       4      200ms
     * 
     * 
     * Note that mappings are done in parallel. 
     * 
     * If batchAddsDataToStream is false, each item will be 
     * added to the stream as soon as it is mapped. The following 
     * timeline shows when mapping and stream add occur:
     *  50ms: item 2 finished mapping. item 2 is added
     * 100ms: item 1 finished mapping. item 1 is added
     * 200ms: item 4 finished mapping. item 4 is added
     * 300ms: item 3 finished mapping. item 3 is added
     * 
     * 
     * If batchAddsDataToStream is true, all items will be 
     * added to the stream only once the last item is mapped.
     * The following timeline shows when mapping and stream 
     * add occur:
     *  50ms: item 2 finished mapping. 
     * 100ms: item 1 finished mapping. 
     * 200ms: item 4 finished mapping. 
     * 300ms: item 3 finished mapping. items 1, 2, 3, & 4 are added
     * 
     * @property {Boolean} 
     *
     */
    batchAddsDataToStream: {
        value: false
    },

    /**
     * To be called to indicates that the consumer has lost interest in the passed DataStream.
     * This will allow the RawDataService feeding the stream to take appropriate measures.
     *
     * @method
     * @argument {DataStream} [dataStream] - The DataStream to cancel
     * @argument {Object} [reason] - An object indicating the reason to cancel.
     *
     */
    cancelDataStream: {
        value: function (dataStream, reason) {
            if (dataStream) {
              var  rawDataService = this._dataServiceByDataStream.get(dataStream),
                self = this;

              if (Promise.is(rawDataService)) {
                    rawDataService.then(function(service) {
                        self._cancelServiceDataStream(service, dataStream, reason);
                    });
                }
                else {
                    this._cancelServiceDataStream(rawDataService, dataStream, reason);
                }
            }

        }
    },

    
    /**
     * To be called to indicates that the consumer has lost interest in the passed DataStream.
     * This will allow the RawDataService feeding the stream to take appropriate measures.
     *
     * @method
     * @argument {ObjectDescriptor} [type] - ObjectDescriptor for the type that this rawData represents
     * @argument {Object} [rawData] - An anonymnous object whose properties'
     *                                values hold the raw data.
     *
     */
    dataIdentifierForTypeRawData: {
        value: function (type, rawData) {
            var mapping = this.mappingWithType(type),
                rawDataPrimaryKeys = mapping ? mapping.rawDataPrimaryKeyExpressions : null,
                scope = new Scope(rawData),
                rawDataPrimaryKeysValues,
                dataIdentifier, dataIdentifierMap, primaryKey,
                expression, i;

            if (rawDataPrimaryKeys && rawDataPrimaryKeys.length) {

                dataIdentifierMap = this._typeIdentifierMap.get(type);

                if (!dataIdentifierMap) {
                    this._typeIdentifierMap.set(type,(dataIdentifierMap = new Map()));
                }

                for (i = 0; (expression = rawDataPrimaryKeys[i]); i++) {
                    rawDataPrimaryKeysValues = rawDataPrimaryKeysValues || [];
                    rawDataPrimaryKeysValues[i] = expression(scope);
                }
                if (rawDataPrimaryKeysValues) {
                    primaryKey = rawDataPrimaryKeysValues.join("/");
                    
                }

                return this._dataIdentifierForTypeAndPrimaryKey(type, primaryKey);
            }
            return undefined;
        }
    },


    /**
     * Return the DataService responsible for a DataStream
     *
     * @method
     * @argument {DataStream} dataStream
     * @returns {DataService} 
     */
    dataServiceForDataStream: {
        get: function(dataStream) {
            return this._dataServiceByDataStream.get(dataStream);
        }
    },

    /**
     * Fetch data from the service using its child services.
     *
     * This method accept [types]{@link ObjectDescriptor} as alternatives to
     * [queries]{@link DataQuery}, and its [stream]{DataStream} argument is
     * optional, but when it calls its child services it will provide them with
     * a [query]{@link DataQuery}, it provide them with a
     * [stream]{DataStream}, creating one if necessary, and the stream will
     * include a reference to the query. Also, if a child service's
     * implementation of this method return `undefined` or `null`, this method
     * will return the stream passed in to the call to that child.
     *
     * The requested data may be fetched asynchronously, in which case the data
     * stream will be returned immediately but the stream's data will be added
     * to the stream at a later time.
     *
     * @method
     * @argument {DataQuery|DataObjectDescriptor|ObjectDescriptor|Function|String}
     *           queryOrType   - If this argument's value is a query
     *                              it will define what type of data should
     *                              be returned and what criteria that data
     *                              should satisfy. If the value is a type
     *                              it will only define what type of data
     *                              should be returned, and the criteria
     *                              that data should satisfy can be defined
     *                              using the `criteria` argument.  A type
     *                              is defined as either a DataObjectDesc-
     *                              riptor, an Object Descriptor, a Construct-
     *                              or the string module id.  The method will
     *                              convert the passed in type to a Data-
     *                              ObjectDescriptor (deprecated) or an
     *                              ObjectDescriptor.  This is true whether
     *                              passing in a DataQuery or a type.
     * @argument {?Object}
     *           optionalCriteria - If the first argument's value is a
     *                              type this argument can optionally be
     *                              provided to defines the criteria which
     *                              the returned data should satisfy.
     *                              If the first argument's value is a
     *                              query this argument should be
     *                              omitted and will be ignored if it is
     *                              provided.
     * @argument {?DataStream}
     *           optionalStream   - The stream to which the provided data
     *                              should be added. If no stream is
     *                              provided a stream will be created and
     *                              returned by this method.
     * @returns {?DataStream} - The stream to which the fetched data objects
     * were or will be added, whether this stream was provided to or created by
     * this method.
     */
    fetchData: {
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

            this._dataServiceByDataStream.set(stream, this._childServiceRegistrationPromise.then(function() {
                var service;
                //This is a workaround, we should clean that up so we don't
                //have to go up to answer that question. The difference between
                //.TYPE and ObjectDescriptor still creeps-in when it comes to
                //the service to answer that to itself
                service = self.parentService ? self.parentService.childServiceForType(query.type) : self.childServiceForType(query.type);
                if (service === self && typeof self.fetchRawData === "function") {
                    service = self;
                    service._fetchRawData(stream);
                } else {

                    // Use a child service to fetch the data.
                    try {

                        service = self.childServiceForType(query.type);
                        if (service) {
                            
                            var rawDataStream = new DataStream();
                            rawDataStream.query = query;
                            rawDataStream.dataExpression = query.selectExpression;
                            rawDataStream = service.fetchData(query, rawDataStream) || rawDataStream;
                            self._dataServiceByDataStream.set(rawDataStream, service);
                            rawDataStream.then(function (rawData) {
                                self.addRawData(stream, rawData, null, service.batchAddsDataToStream);
                                self.rawDataDone(stream);
                            });
                        } else {
                            throw new Error("Can't fetch data of unknown type - " + (query.type.typeName || query.type.name) + "/" + query.type.uuid);
                        }
                    } catch (e) {
                        stream.dataError(e);
                    }
                }

                return service;
            }));
            // Return the passed in or created stream.
            return stream;
        }
    },


    /**
     * Return cooked, unmapped object for this ObjectDescriptor and rawData. 
     * 
     * Returns the same object in memory for rawData with matching primaryKeys.
     *
     * This is in contrast to the asynchronous _mappedObjectForTypeAndRawData 
     * which will also map the rawData to the object
     * 
     * @method
     * @argument {ObjectDescriptor} [type] - ObjectDescriptor for the type that this rawData represents
     * @argument {Object} [rawData] - An anonymnous object whose properties'
     *                                values hold the raw data.
     * @argument {Object} [context] - An anonymnous object whose properties'
     *                                values hold the raw data.
     * @returns  {Object}           - object representing the dataIdentifier 
     */
    objectForTypeRawData: {
        value:function(type, rawData, context) {
            var dataIdentifier = this.dataIdentifierForTypeRawData(type, rawData);
            //Record snapshot before we may create an object
            this.recordSnapshot(dataIdentifier, rawData);
            //iDataIdentifier argument should be all we need later on
            return this.getDataObject(type, rawData, context, dataIdentifier);
        }
    },

    /**
     * To be called once for each [fetchData()]{@link DataService#fetchData}
     * or [fetchRawData()]{@link DataService#fetchRawData} call received to
     * indicate that all the raw data meant for the specified stream has been
     * added to that stream.
     *
     * Subclasses should not override this method.
     *
     * @method
     * @argument {DataStream} stream - The stream to which the data objects
     *                                 corresponding to the raw data have been
     *                                 added.
     * @argument {?} context         - An arbitrary value that will be passed to
     *                                 [writeOfflineData()]{@link DataService#writeOfflineData}
     *                                 if it is provided.
     */
    rawDataDone: {
        value: function (stream, context) {
            var self = this,
                dataToPersist = this._streamRawData.get(stream),
                mappingPromises = this._streamMappingPromises.get(stream),
                dataReadyPromise = mappingPromises ? Promise.all(mappingPromises) : this.nullPromise;

            if (mappingPromises) {
                this._streamMappingPromises.delete(stream);
            }

            if (dataToPersist) {
                this._streamRawData.delete(stream);
            }

            dataReadyPromise.then(function (results) {
                //TODO Figure out if writeOfflineData needs to be handled in DataService
                return dataToPersist ? self.writeOfflineData(dataToPersist, stream.query, context) : null;
                // return null;
            }).then(function () {
                stream.dataDone();
                return null;
            }).catch(function (e) {
                console.error(e);
            });

        }
    },

    /***************************************************************************
     * Saving Data
     */

     /**
     * Subclasses should override this method to delete a data object when that
     * object's raw data wouldn't be useful to perform the deletion.
     *
     * The default implementation maps the data object to raw data and calls
     * [deleteRawData()]{@link DataService#deleteRawData} with the data
     * object passed in as the `context` argument of that method.
     *
     * @method
     * @argument {Object} object   - The object to delete.
     * @returns {external:Promise} - A promise fulfilled when the object has
     * been deleted. The promise's fulfillment value is not significant and will
     * usually be `null`.
     */
    _deleteDataObject: {
        value: function (object) {
            var self = this,
                record = {},
                mapResult = this._mapObjectToRawData(object, record),
                result;

            if (mapResult instanceof Promise) {
                result = mapResult.then(function () {
                    return self.deleteRawData(record, object);
                });
            } else {
                result = this.deleteRawData(record, object);
            }

            return result;
        }
    },
    
    

    /**
     * Save changes made to a data object.
     *
     * @method
     * @argument {Object} object - The object whose data should be saved.
     * @returns {external:Promise} - A promise fulfilled when all of the data in
     * the changed object has been saved.
     */
    _saveDataObject: {
        value: function (object) {
            var record = {};
            this._mapObjectToRawData(object, record);
            return this.saveRawData(record, object);
        }
    },

    _saveRawData: {
        value: function (rawData, object) {
            var self = this,
                service,
                promise = this.nullPromise,
                sibling = this.parentService && this.parentService._childServiceForObject(object),
                child = sibling || this._childServiceForObject(object),
                shouldSaveRawData = child === this,
                mappingPromise;


            if (shouldSaveRawData) {
                return self.saveRawData(rawData, object);
            } else {
                service = this._childServiceForObject(object);
                if (service) {
                    return service._saveRawData(rawData, object);
                } else {
                    return promise;
                }
            }
        }
    },

    _updateDataObject: {
        value: function (object, action) {
            var self = this,
                child = this.parentService && this.parentService._childServiceForObject(object),
                service = child || this._childServiceForObject(object),
                shouldUpdateDataObject = service === this,
                promise = this.nullPromise;

            if (shouldUpdateDataObject) {
                service = action && this;
                action = "_" + action;
            } else if (action && service) {
                return service._updateDataObject(object, action);
            }

            if (!action) {
                self.createdDataObjects.delete(object);
            } else if (service) {
                promise = service[action](object).then(function () {
                    self.createdDataObjects.delete(object);
                    return null;
                });
            }
            return promise;
        }
    },

    /**
     * Delete a data object.
     *
     * @method
     * @argument {Object} object - The object whose data should be deleted.
     * @returns {external:Promise} - A promise fulfilled when the object has
     * been deleted.
     */
    deleteDataObject: {
        value: function (object) {
            var saved = !this.createdDataObjects.has(object);
            return this._updateDataObject(object, saved && "deleteDataObject");

            //From RawDataService
            
        }
    },

    implementsSaveDataObject: {
        get: function () {
            return exports.DataService.prototype.saveDataObject !== this.saveDataObject;
        }
    },

    /**
     * Save a data object.
     *
     * 
     * Navigate the service tree to the service responsible for mapping the object. 
     * 
     * Upon mapping completion, navigate service tree from the root to the service 
     * responsible for saving this rawData
     * 
     * @method
     * @argument {Object} object - The object whose data should be deleted.
     * @returns {external:Promise} - A promise fulfilled when the object has
     * been saved
     */
    saveDataObject: {
        value: function (object) {
            var self = this,
                promise = this.nullPromise,
                ownMapping = this.mappingForObject(object, true),
                hasParent = !!this.parentService,
                service = this._childServiceForObject(object),
                childHasMapping = service && service.implementsMapObjectToRawData,
                shouldMap = !!(ownMapping || this.implementsMapObjectToRawData || !hasParent) && !childHasMapping,
                childHasSaveDataObject = !!(service && service.implementsSaveDataObject),
                mappingPromise;
            

            if (shouldMap) {
                var record = {};
                mappingPromise =  this._mapObjectToRawData(object, record) || this.nullPromise;
                return mappingPromise.then(function () {
                    return self.rootService._saveRawData(record, object).then(function (result) {
                        self.rootService.createdDataObjects.delete(object);
                        return result;
                    });
                 });
            } else if (service) {
                return service.saveDataObject(object);
            } else {
                return promise;
            }
        }
    },

    saveRawData: {
        value: function () {
            return this.nullPromise;
        }
    },

    /***************************************************************************
     * Offline
     */

    _compareOfflineOperations: {
        value: function(operation1, operation2) {
            // TODO: Remove reference to `lastModified` once child services have
            // been udpated to use `time` instead.
            return operation1.lastModified < operation2.lastModified ?   -1 :
                   operation1.lastModified > operation2.lastModified ?   1 :
                   operation1.time < operation2.time ?                   -1 :
                   operation1.time > operation2.time ?                   1 :
                   operation1.index < operation2.index ?                 -1 :
                   operation1.index > operation2.index ?                 1 :
                                                                         0;
        }
    },

    _initializeOffline: {
        value: function () {
            // TODO: This code assumes that the first instance of DataService or
            // of one of its subclasses is either the
            // root service, and that no instance of DataService subclasses are.
            // This needs to be fixed to allow DataService child services and
            // DataService subclass root services.
            var self = this;
            if (
                typeof global.addEventListener === 'function' &&
                    !exports.DataService.prototype._isOfflineInitialized
            ) {
                exports.DataService.prototype._isOfflineInitialized = true;
                global.addEventListener('online', function (event) {
                    self.rootService.isOffline = false;
                });
                global.addEventListener('offline', function (event) {
                    self.rootService.isOffline = true;
                });
            }
        }
    },

    _isOffline: {
        // `undefined` on startup, otherwise always `true` or `false`.
        value: false
    },

    _goOnline: {
        value: function() {
            var self = this;
            return this.readOfflineOperations().then(function (operations) {
                operations.sort(this._compareOfflineOperations);
                return self.performOfflineOperations(operations);
            }).catch(function (e) {
                console.error(e);
            });
        }
    },

    _isOfflineInitialized: {
        value: false
    },

    _offlineOperationMethodName: {
        value: function(type) {
            var isString = typeof type === "string",
                name = isString && this._offlineOperationMethodNames.get(type);
            if (isString && !name) {
                name = "perform";
                name += type[0].toUpperCase();
                name += type.slice(1);
                name += "OfflineOperation";
                this._offlineOperationMethodNames.set(type, name);
            }
            return name;
        }
    },

    _offlineOperationMethodNames: {
        value: new Map()
    },

    /**
     * @private
     * @type {Map<DataOperation, DataService>}
     */
    _offlineOperationServices: {
        get:function() {
            if (!this.__offlineOperationServices) {
                this.__offlineOperationServices = new WeakMap();
            }
            return this.__offlineOperationServices;
        }
    },

    _performOfflineOperationsBatch: {
        value: function(promise, child, operations, start, end) {
            var self = this;
            return promise.then(function () {
                return child ?
                    child.performOfflineOperations(operations.slice(start, end)) :
                        self._performAndDeleteOfflineOperation(operations[start]);
            });
        }
    },

    _performAndDeleteOfflineOperation: {
        value: function(operation) {
            //Before we perform an operation, we need to look a foreignKeys in jOperation changes to update if needed before performing the operation
            //if we don't have a known list of foreign keys, we'll consider all potential candidate
            var self = this,
                operationType = operation.type,
                tableSchema, foreignKeys,
                k, countK, kOnlinePrimaryKey, kForeignKey;

            if (this.offlineService) {
                tableSchema = this.offlineService.schema[operationType];
                foreignKeys = tableSchema.foreignKeys;
            }

            if (!foreignKeys) {
                foreignKeys = tableSchema._computedForeignKeys ||
                    (tableSchema._computedForeignKeys = Object.keys(operation.changes));
            }

            for (k=0, countK = foreignKeys.length;k<countK;k++) {
                kForeignKey = foreignKeys[k];
                //If a previous operation resulted in an online primaryKey replacing an offline one,
                //we update the operation's changes accordingly
                if ((kOnlinePrimaryKey = this.onlinePrimaryKeyForOfflinePrimaryKey(operation.changes[kForeignKey]))) {
                    operation.changes[kForeignKey] = kOnlinePrimaryKey;
                }
            }

            return this._performTypedOfflineOperation(operation).then(function () {
                return self.deleteOfflineOperations([operation]);
            });
        }
    },

    _performTypedOfflineOperation: {
        value: function(operation) {
            // TODO: Remove support for operation.type once all child services
            // have been updated to provide an operation.dataType instead.
            var type = operation.dataType || operation.type,
                method = type && this[this._offlineOperationMethodName(type)];
            return typeof(method) === "function" ? method.call(this, operation) :
                                                   this.performOfflineOperation(operation);
        }
    },

    _selfIsOffline: {
        value: function (offline) {
            var self = this;
            if (this._willBeOffline === null) {
                // _goOnline() just finished, set _isOffline to the desired
                // value and clear the "just finished" flag in _willBeOffline.
                this._isOffline = offline ? true : false;
                this._willBeOffline = undefined;
            } else if (this._willBeOffline !== undefined) {
                // _goOnline() is in progress, just record the future value.
                this._willBeOffline = offline ? true : false;
            } else if (this._isOffline === false) {
                // Already online and not starting up, no need for _goOnline().
                this._isOffline = offline ? true : false;
            } else if (!offline) {
                // Going from offline to online, or starting up online, so
                // assume we were last offline, call _goOnline(), and only
                // change the value  when that's done.
                this._isOffline = true;
                this._willBeOffline = false;
                this._goOnline().then(function () {
                    var offline = self._willBeOffline;
                    self._willBeOffline = null;
                    self.isOffline = offline;
                    return null;
                });
            }
        }
    },

    _willBeOffline: {
        // `true` or `false` while _goOnline() is in progress, `null` just after
        // it's done, `undefined` otherwise.
        value: undefined
    },

    /**
     * Delete operations recorded while offline.
     *
     * Services overriding the (plural)
     * [performOfflineOperations()]{@link DataService#performOfflineOperations}
     * method must invoke this method after each operation they perform is
     * successfully performed.
     *
     * This method will be called automatically for services that perform
     * operations by implementing a
     * [performOfflineOperation()]{@link DataService#performOfflineOperation}
     * or `performFooOfflineOperation()` methods (where `foo` is an operation
     * [data type]{@link DataOperation#dataType}).
     *
     * Subclasses that provide offline operations support must override this
     * method to delete the specified offline operations from their records.
     *
     * @method
     * @argument {Array.<Object>} operations
     * @returns {Promise} - A promise fulfilled with a null value when the
     * operations have been deleted.
     */
    deleteOfflineOperations: {
        value: function(operations) {
            // To be overridden by subclasses that use offline operations.
            return this.nullPromise;
        }
    },

    /**
     * Returns a value derived from and continuously updated with the value of
     * [navigator.onLine]{@link https://developer.mozilla.org/en-US/docs/Web/API/NavigatorOnLine/onLine}.
     *
     * Root services are responsible for tracking offline status, and subclasses
     * not designed to be root services should override this property to get
     * its value from their root service.
     *
     * @type {boolean}
     */
    isOffline: {
        get: function () {
            if (this._isOffline === undefined) {
                // Determine the initial value from the navigator state and call
                // the public setter so _goOnline() is invoked if appropriate.
                this.isOffline = this === this.rootService ? !navigator.onLine : this.rootService.isOffline;
            }
            return this._isOffline;
        },
        set: function (offline) {
            if (this === this.rootService) {
                this._selfIsOffline(offline);
            }
        }
    },

    // To be overridden by subclasses as necessary
    onlinePrimaryKeyForOfflinePrimaryKey: {
        value: function(offlinePrimaryKey) {
            return this.offlineService ?
                this.offlineService.onlinePrimaryKeyForOfflinePrimaryKey(offlinePrimaryKey) : null;
        }
    },

    /**
     * Called from
     * [performOfflineOperations()]{@link DataService#performOfflineOperations}
     * to perform a particular operation when no more specific
     * `performFooOfflineOperation()` method is available for that operation,
     * where `Foo` is the operation's [data type]{@link DataOperation#dataType}.
     *
     * The default implementation does nothing.
     *
     * Subclass overriding this method do not need to
     * [delete]{@link DataService#deleteOfflineOperations} the passed in
     * operation after it has successfully been performed: The method calling
     * this method will take care of that.
     *
     * @method
     * @argument {DataOperation} operation
     * @returns {Promise} - A promise fulfilled with a null value when the
     * operation has been performed, or rejected if a problem occured that
     * should prevent following operations from being performed.
     */
    performOfflineOperation: {
        value: function(operation) {
            // To be overridden by subclasses that use offline operations.
            return this.nullPromise;
        }
    },

    /**
     * Perform operations recorded while offline. This will be invoked when the
     * service comes online after being offline.
     *
     * The default implementation delegates performance of each operation to
     * the child service responsible for that operation, as determined by
     * [readOfflineOperations()]{@link DataService#readOfflineOperations}. It
     * will batch operations if several consecutive operations belong to the
     * same child service.
     *
     * For each operation not handled by a child service, the default
     * implementation calls a method named `performFooOfflineOperation()`, if
     * such a method exists in this service where `foo` is the operation's
     * [data type]{@link DataOperation#dataType}. If no such method exists,
     * [readOfflineOperation()]{@link DataService#readOfflineOperation} is
     * called instead.
     *
     * Subclasses that provide offline support should implement these
     * `performFooOfflineOperation()` methods or override the
     * `readOfflineOperation()` method to perform each operation, or they can
     * override this `performOfflineOperations()` method instead.
     *
     * Subclass overriding this method are responsible for
     * [deleting]{@link DataService#deleteOfflineOperations} operations after
     * they have been performed. Subclasses implementing
     * `performFooOfflineOperation()` methods or overriding the
     * `readOfflineOperation()` method are not.
     *
     * @method
     * @argument {Array.<DataOperation>} - operations
     * @returns {Promise} - A promise fulfilled with a null value when the
     * operations have been performed, or rejected if a problem occured that
     * should prevent following operations from being performed.
     */
    performOfflineOperations: {
        value: function(operations) {
            var services = this._offlineOperationServices,
                promise = this.nullPromise,
                child,
                i, j, n, jOperation, jOperationChanges, jService, jOperationType, jTableSchema, jForeignKeys,
                OfflineService = OfflineService,
                k, countK, kForeignKey,kOnlinePrimaryKey;

            // Perform each operation, batching if possible, and collecting the
            // results in a chain of promises.
            for (i = 0, n = operations.length; i < n; i = j) {
                // Find the service responsible for this operation.
                child = services.get(operations[i]);
                // Find the end of a batch of operations for this service.
                j = i + 1;
                while (j < n && child && (jService = services.get((jOperation = operations[j]))) === child) {
                    ++j;
                }
                // Add the promise to perform this batch of operations to the
                // end of the chain of promises to fulfill all operations.
                promise =
                    this._performOfflineOperationsBatch(promise, child, operations, i, j);
            }
            // Return a promise for the sequential fulfillment of all operations.
            return promise;
        }
    },
    
    /**
     * Reads all the offline operations recorded on behalf of this service.
     *
     * The default implementation aggregates this service children's offline
     * operations, keeping track of which child service is responsible for each
     * operation.
     *
     * Subclasses that provide offline support should override this method to
     * return the operations that have been performed while offline.
     *
     * @method
     */
    readOfflineOperations: {
        value: function () {
            // TODO: Get rid of the dummy WeakMap passed to children once the
            // children's readOfflineOperations code has been updated to not
            // expect it.
            // This implementation avoids creating promises for services with no
            // children or whose children don't have offline operations.
            var self = this,
                dummy = new WeakMap(),
                services = this._offlineOperationServices,
                array, promises;
            this.childServices.forEach(function (child) {
                var promise = child.readOfflineOperations(dummy);
                if (promise !== self.emptyArrayPromise) {
                    array = array || [];
                    promises = promises || [];
                    promises.push(promise.then(function(operations) {
                        var i, n;
                        for (i = 0, n = operations && operations.length; i < n; i += 1) {
                            services.set(operations[i], child);
                            array.push(operations[i]);
                        }
                        return null;
                    }));
                }
            });
            return promises ? Promise.all(promises).then(function () { return array; }) :
                              this.emptyArrayPromise;
        }
    },

    /**
     * Called with all the data passed to
     * [addRawData()]{@link RawDataService#addRawData} to allow storing of that
     * data for offline use.
     *
     * The default implementation does nothing. This is appropriate for
     * subclasses that do not support offline operation or which operate the
     * same way when offline as when online.
     *
     * Other subclasses may override this method to store data fetched when
     * online so [fetchData]{@link RawDataSource#fetchData} can use that data
     * when offline.
     *
     * @method
     * @argument {Object} records  - An array of objects whose properties' values
     *                               hold the raw data.
     * @argument {?DataQuery} selector
     *                             - Describes how the raw data was selected.
     * @argument {?} context       - The value that was passed in to the
     *                               [rawDataDone()]{@link RawDataService#rawDataDone}
     *                               call that invoked this method.
     * @returns {external:Promise} - A promise fulfilled when the raw data has
     * been saved. The promise's fulfillment value is not significant and will
     * usually be `null`.
     */
    writeOfflineData: {
        value: function (records, selector, context) {
            // Subclasses should override this to do something useful.
            return this.nullPromise;
        }
    },

    
    /***************************************************************************
     * Authorization
     */

    _initializeAuthorization: {
        value: function () {
            if (this.providesAuthorization) {
                exports.DataService.authorizationManager.registerAuthorizationService(this);
            }

            if (this.authorizationPolicy === AuthorizationPolicyType.UpfrontAuthorizationPolicy) {
                var self = this;
                exports.DataService.authorizationManager.authorizeService(this).then(function(authorization) {
                    self.authorization = authorization;
                    return authorization;
                }).catch(function(error) {
                    console.log(error);
                });
            } else {
                //Service doesn't need anything upfront, so we just go through
                this.authorizationPromise = Promise.resolve();
            }
        }
    },

    /**
     * Returns the AuthorizationPolicyType used by this DataService.
     *
     * @type {AuthorizationPolicyType}
     */
    authorizationPolicy: {
        value: AuthorizationPolicyType.NoAuthorizationPolicy
    },

    /**
     * holds authorization object after a successfull authorization
     *
     * @type {Object}
     */

    authorization: {
        value: undefined
    },

    authorizationPromise: {
        value: Promise.resolve()
    },

    /**
     * Returns the list of moduleIds of DataServices a service accepts to provide
     * authorization on its behalf. If an array has multiple
     * authorizationServices, the final choice will be up to the App user
     * regarding which one to use. This array is expected to return moduleIds,
     * not objects, allowing the AuthorizationManager to manage unicity
     *
     * @type {string[]}
     */
    authorizationServices: {
        value: null
    },

    /**
     * @type {string}
     * @description Module ID of the panel component used to gather necessary authorization information
     */
    authorizationPanel: {
        value: undefined
    },

    /**
     * Indicates whether a service can provide user-level authorization to its
     * data. Defaults to false. Concrete services need to override this as
     * needed.
     *
     * @type {boolean}
     */
    providesAuthorization: {
        value: false
    },

    /**
     * Performs whatever tasks are necessary to authorize 
     * this service and returns a Promise that resolves with
     * an Authorization object.
     *
     * @method
     * @returns Promise
     */
    authorize: {
        value: undefined
    },


    /**
     *
     * @method
     * @returns Promise
     */
    logOut: {
        value: function () {
            console.warn("DataService.logOut() must be overridden by the implementing service");
            return this.nullPromise;
        }
    },

    /***************************************************************************
     * Utilities
     */

    _flattenArray: {
        value: function (array) {
            return Array.prototype.concat.apply([], array);
        }
    },

    _isObjectDescriptor: {
        value: function (type) {
            return type instanceof ObjectDescriptor || type instanceof DataObjectDescriptor;
        }
    },

    /**
     * Convenience property to return a Promise that resolves to an 
     * empty array.
     * 
     * @property
     * @return {Promise}
     */
    emptyArrayPromise: {
        get: function () {
            if (!exports.DataService._emptyArrayPromise) {
                exports.DataService._emptyArrayPromise = Promise.resolve([]);
            }
            return exports.DataService._emptyArrayPromise;
        }
    },

    /**
     * A possibly shared promise resolved in the next cycle of the event loop
     * or soon thereafter, at which point the current event handling will be
     * complete. This is useful for services that need to buffer up actions so
     * they're committed only once in a given event loop.
     *
     * @type {external:Promise}
     */
    eventLoopPromise: {
        get: function () {
            var self = this;
            if (!this._eventLoopPromise) {
                this._eventLoopPromise = new Promise(function (resolve, reject) {
                    setTimeout(function () {
                        self._eventLoopPromise = undefined;
                        resolve();
                    }, 0);
                });
            }
            return this._eventLoopPromise;
        }
    },

    /**
     * A function that does nothing but returns null, useful for terminating
     * a promise chain that needs to return null, as in the following code:
     *
     *     var self = this;
     *     return this.fetchSomethingAsynchronously().then(function (data) {
     *         return self.doSomethingAsynchronously(data.part);
     *     }).then(this.nullFunction);
     *
     * @type {function}
     */
    nullFunction: {
        value: function () {
            return null;
        }
    },

    /**
     * A shared promise resolved with a value of
     * `null`, useful for returning from methods like
     * [fetchObjectProperty()]{@link DataService#fetchObjectProperty}
     * when the requested data is already there.
     *
     * @type {external:Promise}
     */
    nullPromise: {
        get: function () {
            if (!exports.DataService._nullPromise) {
                exports.DataService._nullPromise = Promise.resolve(null);
            }
            return exports.DataService._nullPromise;
        }
    },

    /**
     * Splice an array into another array.
     *
     * @method
     * @argument {Array} array   - The array to modify.
     * @argument {Array} insert  - The items to splice into that array.
     * @argument {number} index  - The index at which to splice those items, by
     *                             default `0`.
     * @argument {number} length - The number of items of the original array to
     *                             replace with items from the spliced array, by
     *                             default `array.length`.
     */
    spliceWithArray: {
        value: function (array, insert, index, length) {
            index = index || 0;
            length = length || length === 0 ? length : Infinity;
            return insert ? array.splice.apply(array, [index, length].concat(insert)) :
                            array.splice(index, length);
        }
    }


}, /** @lends DataService */ {

    /***************************************************************************
     * Service Hierarchy
     */

    /**
     * A reference to the application's main service.
     *
     * Applications typically have one and only one
     * [root service]{@link DataService#rootService} to which all data requests
     * are sent, and this is called the application's main service. That service
     * can in turn delegate handling of different types of data to child
     * services specialized by type.
     *
     * This property will be set automatically if the {@link DataService}
     * constructor is called and if the first service created is either the
     * main service or a descendent of the main service.
     *
     * @type {DataService}
     */
    mainService: {
        get: function () {
            if (this._mainService && this._mainService.parentService) {
                this._mainService = this._mainService.rootService;
            }
            return this._mainService;
        },
        set: function (service) {
            this._mainService = service;
        }
    },

    /***************************************************************************
     * Authorization
     */

    AuthorizationPolicyType: {
        value: AuthorizationPolicyType
    },

    AuthorizationPolicy: {
        value: AuthorizationPolicy
    },

    authorizationManager: {
        value: AuthorizationManager
    }

});
