var Montage = require("core/core").Montage,
    Target = require("core/target").Target,
    AuthorizationManager = require("data/service/authorization-manager").defaultAuthorizationManager,
    AuthorizationPolicy = require("data/service/authorization-policy").AuthorizationPolicy,
    UserAuthenticationPolicy = require("data/service/user-authentication-policy").UserAuthenticationPolicy,
    UserIdentityManager = require("data/service/user-identity-manager").UserIdentityManager,
    DataObjectDescriptor = require("data/model/data-object-descriptor").DataObjectDescriptor,
    Criteria = require("core/criteria").Criteria,
    DataQuery = require("data/model/data-query").DataQuery,
    DataStream = require("data/service/data-stream").DataStream,
    DataTrigger = require("data/service/data-trigger").DataTrigger,
    Map = require("core/collections/map"),
    Promise = require("core/promise").Promise,
    ObjectDescriptor = require("core/meta/object-descriptor").ObjectDescriptor,
    Set = require("core/collections/set"),
    CountedSet = require("core/counted-set").CountedSet,
    WeakMap = require("core/collections/weak-map"),
    ObjectPool = require("core/object-pool").ObjectPool,
    defaultEventManager = require("core/event/event-manager").defaultEventManager,
    DataEvent = require("data/model/data-event").DataEvent,
    PropertyDescriptor = require("core/meta/property-descriptor").PropertyDescriptor,
    DeleteRule = require("core/meta/property-descriptor").DeleteRule,
    deprecate = require("../../core/deprecate"),
    Locale = require("core/locale").Locale;

    require("core/extras/string");

var AuthorizationPolicyType = new Montage();
AuthorizationPolicyType.NoAuthorizationPolicy = AuthorizationPolicy.NONE;
AuthorizationPolicyType.UpfrontAuthorizationPolicy = AuthorizationPolicy.UP_FRONT;
AuthorizationPolicyType.OnDemandAuthorizationPolicy = AuthorizationPolicy.ON_DEMAND;
AuthorizationPolicyType.OnFirstFetchAuthorizationPolicy = AuthorizationPolicy.ON_FIRST_FETCH;

UserAuthenticationPolicy.NoAuthenticationPolicy = UserAuthenticationPolicy.NONE;
UserAuthenticationPolicy.UpfrontAuthenticationPolicy = UserAuthenticationPolicy.UP_FRONT;
UserAuthenticationPolicy.OnDemandAuthenticationPolicy = UserAuthenticationPolicy.ON_DEMAND;
UserAuthenticationPolicy.OnFirstFetchAuthenticationPolicy = UserAuthenticationPolicy.ON_FIRST_FETCH;



/**
 * Future: Look at https://www.npmjs.com/package/broadcast-channel to implement cross-tab event distribution?
 */

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
 *
 * @class
 * @extends external:Montage
 */
exports.DataService = Target.specialize(/** @lends DataService.prototype */ {

    /***************************************************************************
     * Initializing
     */

    constructor: {
        value: function DataService() {
            exports.DataService.mainService = ObjectDescriptor.mainService = exports.DataService.mainService || this;
            if(this === DataService.mainService) {
                UserIdentityManager.mainService = DataService.mainService;
                //this.addOwnPropertyChangeListener("userLocales", this);
                this.addRangeAtPathChangeListener("userLocales", this, "handleUserLocalesRangeChange");
            }

            //Deprecated now
            //this._initializeAuthorization();

            if (this.providesAuthorization) {
                exports.DataService.authorizationManager.registerAuthorizationService(this);
            }

            if(this.providesUserIdentity === true) {
                UserIdentityManager.registerUserIdentityService(this);
            }

            this._initializeOffline();
        }
    },

    /***************************************************************************
     * Serialization
     */

    deserializeSelf: {
        value:function (deserializer) {
            var self = this,
                result = this,
                value;

            value = deserializer.getProperty("name");
            if (value) {
                this.name = value;
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

            value = deserializer.getProperty("isUniquing");
            if (value !== undefined) {
                this.isUniquing = value;
            }

            value = deserializer.getProperty("childServices");
            if (value) {
                this._deserializedChildServices = value;
            }

            value = deserializer.getProperty("authorizationPolicy");
            if (value) {
                this.authorizationPolicy = value;
            }

            value = deserializer.getProperty("userAuthenticationPolicy");
            if (value) {
                this.userAuthenticationPolicy = value;
            }

            return this;
        }
    },

    _deserializedChildServices: {
        value: undefined
    },

    deserializedFromSerialization: {
        value: function (label) {
            if(Array.isArray(this._deserializedChildServices) && this._deserializedChildServices.length > 0) {
                //var childServices = this._childServices;
                if(!this._childServices) {
                    this._childServices = [];
                }
                this.addChildServices(this._deserializedChildServices);
            }

            if (this.authorizationPolicy === AuthorizationPolicyType.UpfrontAuthorizationPolicy) {
                exports.DataService.authorizationManager.registerServiceWithUpfrontAuthorizationPolicy(this);
            }

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
     * @type {Array.<DataObjectDescriptor>}
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
     * Service Hierarchy
     */

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
     * Adds child Services to the receiving service.
     *
     * @param {Array.<DataServices>} childServices. childServices to add.
     */

    addChildServices: {
        value: function (childServices) {
            var i, countI, iChild, j, countJ, mappings, jMapping, types, jType, jResult, typesPromises;

            for(i=0, countI = childServices.length;(i<countI);i++) {
                iChild = childServices[i];

                if(this._childServices.indexOf(iChild) !== -1) {
                    continue;
                }

                if((types = iChild.types)) {
                    this._registerTypesForService(types,iChild);

                    // for(j=0, countJ = types.length;(j<countJ);j++ ) {
                    //     jType = types[j];
                    //     jResult = this._makePrototypeForType(iChild, jType);
                    //     if(Promise.is(jResult)) {
                    //         (typesPromises || (typesPromises = [])).push(jResult);
                    //     }
                    // }

                }

                if((mappings = iChild.mappings)) {
                    for(j=0, countJ = mappings.length;(j<countJ);j++ ) {
                        jMapping = mappings[j];
                        iChild.addMappingForType(jMapping, jMapping.objectDescriptor);
                    }
                }

                this.addChildService(iChild);

        //Process Mappings
        //this._childServiceMappings / addMappingForType(mapping, type)

            }

            // if(typesPromises) {
            //     this._childServiceRegistrationPromise = Promise.all(typesPromises);
            // }

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

    _addChildService: {
        value: function (child, types) {
            var children, type, i, n, nIfEmpty = 1, isNotParentService;

            types = types || (child.model && child.model.objectDescriptors) || child.types;
            isNotParentService = (child._parentService !== this);
            // If the new child service already has a parent, remove it from
            // that parent.
            // Adding more test to allow a service to register types in multiple
            // calls, which can happen if the service is deserilized multiple times
            if (child._parentService && isNotParentService) {
                child._parentService.removeChildService(child);
            }

            // Add the new child to this service's children set.
            if(isNotParentService) {
                this.childServices.add(child);
                this._childServicesByIdentifier.set(child.identifier, child);
            }
            // Add the new child service to the services array of each of its
            // types or to the "all types" service array identified by the
            // `null` type, and add each of the new child's types to the array
            // of child types if they're not already there.

            for (i = 0, n = types && types.length || nIfEmpty; i < n; i += 1) {
                type = types && types.length && types[i] || null;
                children = this._childServicesByType.get(type) || [];

                //Checking in case this is called multiple times
                if(children.indexOf(child) === -1 ) {
                    children.push(child);
                    if (children.length === 1) {
                        this._childServicesByType.set(type, children);
                        if (type) {
                            this._childServiceTypes.push(type);
                        }
                    }

                }
            }
            // Set the new child service's parent.
            child._parentService = child.nextTarget = this;
        }
    },

    __childServiceRegistrationPromise: {
        value: null
    },

    _childServiceRegistrationPromise: {
        get: function() {
            return this.__childServiceRegistrationPromise || (this.__childServiceRegistrationPromise = Promise.resolve());
        },
        set: function(value) {
            this.__childServiceRegistrationPromise = value;
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
                self._registerTypesForService(objectDescriptors,child);
                return self._registerChildServiceMappings(child, mappings);
            }).then(function () {
                return self._makePrototypesForTypes(child, objectDescriptors);
            }).then(function () {
                self.addChildService(child, types);
                return null;
            });
        }
    },

    _resolveAsynchronousTypes: {
        value: function (types) {
            var self = this;
            return Promise.all(this._flattenArray(types).map(function (type) {
                return type;
            })).then(function (descriptors) {
                return self._flattenArray(descriptors);
            });
        }
    },

    _flattenArray: {
        value: function (array) {
            return Array.prototype.concat.apply([], array);
        }
    },

    _registerTypesForService: {
        value: function (types, service) {
            var map = this._moduleIdToObjectDescriptorMap, typesPromises,
                j, countJ, jObjectDescriptor, jModule, jModuleId;

            for(j=0, countJ = types.length;(j<countJ);j++ ) {
                jObjectDescriptor = types[j];
                jResult = this._makePrototypeForType(service, jObjectDescriptor);
                if(Promise.is(jResult)) {
                    (typesPromises || (typesPromises = [])).push(jResult);
                }

                jModule = jObjectDescriptor.module;
                if(!jModule) {
                    jModuleId = Montage.getInfoForObject(this).moduleId;
                } else {
                    jModuleId = [jModule.id, jObjectDescriptor.exportName].join("/");
                }
                map[jModuleId] = jObjectDescriptor;

                //Setup the event propagation chain
                /*
                    this is now done in objectDescriptor as it follows the hierachy of objectDescriptor before getting to DataServices.
                */
                // jObjectDescriptor.nextTarget = service;
            }

            // types.forEach(function (objectDescriptor) {
            //     var module = objectDescriptor.module,
            //         moduleId = [module.id, objectDescriptor.exportName].join("/");
            //     map[moduleId] = objectDescriptor;
            // });

            if(typesPromises) {
                this._childServiceRegistrationPromise = Promise.all(typesPromises);
            }

        }
    },

    _registerChildServiceMappings: {
        value: function (child, mappings) {
            var self = this;
            return Promise.all(mappings.map(function (mapping) {
                return self._addMappingToChild(mapping, child);
            }));
        }
    },

    _makePrototypesForTypes: {
        value: function (childService, types) {
            var self = this;
            return Promise.all(types.map(function (objectDescriptor) {
                return self._makePrototypeForType(childService, objectDescriptor);
            }));
        }
    },

    _makePrototypeForType: {
        value: function (childService, objectDescriptor) {

            if(objectDescriptor.object) {
                return this.__makePrototypeForType(childService, objectDescriptor, objectDescriptor.object);
            } else {
                var self = this,
                module = objectDescriptor.module;
                if(module) {
                    return module.require.async(module.id).then(function (exports) {
                        return self.__makePrototypeForType(childService, objectDescriptor, exports[objectDescriptor.exportName]);
                    });
                } else {
                    return Promise.resolveNull;
                }
            }
        }
    },

    __makePrototypeForType: {
        value: function (childService, objectDescriptor, constructor) {
            var prototype = Object.create(constructor.prototype),
            mapping = childService.mappingForType(objectDescriptor),
            requisitePropertyNames = mapping && mapping.requisitePropertyNames || new Set(),
            dataTriggers = this.DataTrigger.addTriggers(this, objectDescriptor, prototype, requisitePropertyNames),
            mainService = this.rootService;

            Object.defineProperty(prototype,"dataIdentifier", {
                enumerable: true,
                get: function() {
                    return mainService.dataIdentifierForObject(this);
                }
            });
            Object.defineProperty(prototype,"nextTarget", {
                enumerable: true,
                    get: function() {
                        return objectDescriptor;
                }
            });

        this._dataObjectPrototypes.set(constructor, prototype);
        this._dataObjectPrototypes.set(objectDescriptor, prototype);
        this._dataObjectTriggers.set(objectDescriptor, dataTriggers);
        this._constructorToObjectDescriptorMap.set(constructor, objectDescriptor);
        return null;

        }
    },

    _addMappingToChild: {
        value: function (mapping, child) {
            var service = this;
            return Promise.all([
                mapping.objectDescriptor,
                mapping.schemaDescriptor
            ]).spread(function (objectDescriptor, schemaDescriptor) {
                // TODO -- remove looking up by string to unique.
                var type = [objectDescriptor.module.id, objectDescriptor.name].join("/");
                objectDescriptor = service._moduleIdToObjectDescriptorMap[type];
                mapping.objectDescriptor = objectDescriptor;
                mapping.schemaDescriptor = schemaDescriptor;
                mapping.service = child;
                child.addMappingForType(mapping, objectDescriptor);
                return null;
            });
        }
    },

    objectDescriptorForType: {
        value: function (type) {
            var descriptor = this._constructorToObjectDescriptorMap.get(type) ||
                             typeof type === "string" && this._moduleIdToObjectDescriptorMap[type];

            return  descriptor || type;
        }
    },

    _objectDescriptorForType: {
        value: function (type) {
            return this.objectDescriptorForType(type);
        }
    },

    _constructorToObjectDescriptorMap: {
        value: new Map()
    },

    _moduleIdToObjectDescriptorMap: {
        value: {}
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
                chidren = this._childServicesByType.get(type);
                index = chidren ? chidren.indexOf(child) : -1;
                if (index >= 0 && chidren.length > 1) {
                    chidren.splice(index, 1);
                } else if (index === 0) {
                    this._childServicesByType.delete(type);
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
     * @type {Map<DataObjectDescriptor, Array.<DataService>>}
     */
    _childServicesByType: {
        get: function () {
            if (!this.__childServicesByType) {
                this.__childServicesByType = new Map();
            }
            return this.__childServicesByType;
        }
    },

    __childServicesByType: {
        value: undefined
    },

    _childServicesByIdentifier: {
        get: function () {
            if (!this.__childServicesByIdentifier) {
                this.__childServicesByIdentifier = new Map();
            }
            return this.__childServicesByIdentifier;
        }
    },

    __childServicesByIdentifier: {
        value: undefined
    },

    /**
     * An array of the data types handled by all child services of this service.
     *
     * The contents of this map should not be modified outside of
     * [addChildService()]{@link DataService#addChildService} and
     * [removeChildService()]{@link DataService#removeChildService}.
     *
     * @private
     * @type {Array.<DataObjectDescriptor>}
     */
    _childServiceTypes: {
        get: function() {
            if (!this.__childServiceTypes) {
                this.__childServiceTypes = [];
            }
            return this.__childServiceTypes;
        }
    },

    __childServiceTypes: {
        value: undefined
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
    _getChildServiceForObject: {
        value: function (object) {
            return this.childServiceForType(this.rootService._getObjectType(object));
        }
    },

    /**
     * Get the first child service that can handle data of the specified type,
     * or `null` if no such child service exists.
     *
     * @private
     * @method
     * @argument {DataObjectDescriptor} type
     * @returns {Set.<DataService,number>}
     */
    childServiceForType: {
        value: function (type) {
            var services;
            type = type instanceof ObjectDescriptor ? type : this.objectDescriptorForType(type);
            services = this._childServicesByType.get(type) || this._childServicesByType.get(null);
            return services && services[0] || null;
        }
    },


    /***************************************************************************
     * Mappings
     */

    /**
     * Adds a mapping to the service for the specified
     * type.
     * @param {DataMapping} mapping.  The mapping to use.
     * @param {ObjectDescriptor} type.  The object type.
     */
    addMappingForType: {
        value: function (mapping, type) {
            mapping.service = mapping.service || this;
            this._mappingByType.set(type, mapping);
        }
    },

    /**
     * Return the mapping to use for the specified type.
     * @param {ObjectDescriptor} type.
     * @returns {DataMapping|null} returns the specified mapping or null
     * if a mapping is not defined for the specified type.
     *
     * If an immediate mapping isn't found, we look up the parent chain
     */
    mappingForType: {
        value: function (type) {

            if(this.isRootService) {
                var childService = this.childServiceForType(type);
                if(childService) {
                    return childService.mappingForType(type);
                } else {
                    return null;
                }
            } else {
                var mapping, localType = this.objectDescriptorForType(type);

                while(localType && !(mapping = this._mappingByType.has(localType) && this._mappingByType.get(localType))) {
                    localType = localType.parent;
                }
                return mapping || null;
            }
        }
    },

    mappingWithType: {
        value: deprecate.deprecateMethod(void 0, function (type) {
            return this.mappingForType(type);
        }, "mappingWithType", "mappingForType")
    },

    _mappingByType: {
        get: function () {
            if (!this.__mappingByType) {
                this.__mappingByType = new Map();
            }
            return this.__mappingByType;
        }
    },

    __mappingByType: {
        value: undefined
    },

    _childServiceMappings: {
        get: function () {
            if (!this.__childServiceMappings) {
                this.__childServiceMappings = [];
            }
            return this.__childServiceMappings;
        }
    },

    __childServiceMappings: {
        value: undefined
    },

    /***************************************************************************
     * Models
     */

    /**
     * The [model]{@link ObjectModel} that this service supports.  If the model is
     * defined the service supports all the object descriptors contained within the model.
     */
    model: {
        value: undefined
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
                this.authorizationPromise = exports.DataService.authorizationManager.authorizeService(this).then(function(authorization) {
                    self.authorization = authorization;
                    return authorization;
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
     * holds authorization object after a successful authorization
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

    /********* New set of methods for user identity and authentication **********/

    /**
     * Indicates whether a service can provide application user-identity .
     * Defaults to false. Concrete services need to override this as
     * needed.
     *
     * @type {boolean}
     */

    providesUserIdentity: {
        value: false
    },

    /**
     * Returns the UserAuthenticationPolicyType used by a DataService. For enabling both
     * system to co-exists for upgradability, there is no default here.
     * DataServices suclass have to provide it.
     *
     * @type {AuthorizationPolicyType}
     */
    userAuthenticationPolicy: {
        value: AuthorizationPolicyType.NoAuthorizationPolicy
    },

    /**
     * The user identity for the data service. It could be an unauthenticated/
     * anonymous user identity
     *
     * @type {Object}
     */

    userIdentity: {
        value: undefined
    },

    /**
     * a promise to the user identity for the data service. This is necessary to buffer
     * fetch/data operations that can't be executed until a valid user identity is known.
     *
     * @type {Object}
     */

    userIdentityPromise: {
        value: Promise.resolve()
    },

    /**
     * The list of DataServices a service accepts to provide
     * authorization on its behalf. If an array has multiple
     * authorizationServices, the final choice will be up to the App user
     * regarding which one to use. This array is expected to return moduleIds,
     * not objects, allowing the AuthorizationManager to manage unicity
     *
     * @type {string[]}
     */
    userIdentityServices: {
        value: null
    },


    /**
     *
     * @method
     * @returns Promise
     */
    logOut: {
        value: undefined
    },


    /***************************************************************************
     * Data Object Types
     */

    /**
     * Returns an object descriptor for the provided object.  If this service
     * does not have an object descriptor for this object it will ask its
     * parent for one.
     *
     * TODO: looks like we're looping all the time and not caching a lookup"
     * Why isn't objectDescriptorWithModuleId used??
     *
     * @param {object}
     * @returns {ObjectDescriptor|null} if an object descriptor is not found this
     * method will return null.
     */
    objectDescriptorForObject: {
        value: function (object) {
            var types = this.types,
                objectInfo = Montage.getInfoForObject(object),
                moduleId = objectInfo.moduleId,
                objectName = objectInfo.objectName,
                module, exportName, objectDescriptor, i, n;

            objectDescriptor = this.objectDescriptorWithModuleId(moduleId);
            for (i = 0, n = types.length; i < n && !objectDescriptor; i += 1) {
                module = types[i].module;
                exportName = module && types[i].exportName;
                if (module && moduleId === module.id && objectName === exportName) {
                    if(objectDescriptor !== types[i]) {
                        console.error("objectDescriptorWithModuleId cached an objectDescriptor and objectDescriptorForObject finds another")
                    }
                    objectDescriptor = types[i];
                }
            }
            return objectDescriptor || this.parentService && this.parentService.objectDescriptorForObject(object);
        }
    },

    _objectDescriptorByModuleId: {
        value:undefined
    },
    _mjsonExtension: {
        value: ".mjson"
    },
    objectDescriptorWithModuleId: {
        value: function (objectDescriptorModuleId) {

            if(!this._objectDescriptorByModuleId) {
                var map = this._objectDescriptorByModuleId = new Map();

                var types = this.types, i, n, iType, iInfo, iModuleId, mjsonExtension = this._mjsonExtension;
                for (i = 0, n = types.length; i < n; i++) {
                    iType = types[i];
                    if(!iType.module) {
                        iInfo = Montage.getInfoForObject(iType);
                        iModuleId = iInfo.moduleId;
                        if(iModuleId.endsWith(mjsonExtension)) {
                            iModuleId = iModuleId.removeSuffix(mjsonExtension);
                        }
                        map.set(iModuleId,types[i]);
                    } else {
                        map.set(iType.module.id,types[i]);
                    }
                }

            }
            return this._objectDescriptorByModuleId.get(objectDescriptorModuleId);
        }
    },

    /**
     * Get the type of the specified data object.
     *
     * @private
     * @method
     * @argument {Object} object       - The object whose type is sought.
     * @returns {DataObjectDescriptor} - The type of the object, or undefined if
     * no type can be determined.
     */
    _getObjectType: {
        value: function (object) {
            var type = this._typeRegistry.get(object),
                moduleId = typeof object === "string" ? object : this._getModuleIdForObject(object);
            while (!type && object) {
                if (object.constructor.TYPE instanceof DataObjectDescriptor) {
                    type = object.constructor.TYPE;
                } else if (this._moduleIdToObjectDescriptorMap[moduleId]) {
                    type = this._moduleIdToObjectDescriptorMap[moduleId];
                } else {
                    object = Object.getPrototypeOf(object);
                }
            }
            return type;
        }
    },

    _getModuleIdForObject: {
        value: function (object) {
            var info = Montage.getInfoForObject(object);
            return [info.moduleId, info.objectName].join("/");
        }
    },

    /**
     * Register the type of the specified data object if necessary.
     *
     * @private
     * @method
     * @argument {Object} object
     * @argument {DataObjectDescriptor} type
     */
    _setObjectType: {
        value: function (object, type) {
            if (this._getObjectType(object) !== type){
                this._typeRegistry.set(object, type);
            }
        }
    },

    _typeRegistry: {
        get: function () {
            if (!this.__typeRegistry){
                this.__typeRegistry = new WeakMap();
            }
            return this.__typeRegistry;
        }
    },

    /***************************************************************************
     * Data Object Triggers
     */

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
    _getPrototypeForType: {
        value: function (type) {
            var info, triggers, prototypeToExtend, prototype;
            type = this.objectDescriptorForType(type);
            prototype = this._dataObjectPrototypes.get(type);
            if (type && !prototype) {
                //type.objectPrototype is legacy and should be depreated over time
                prototypeToExtend = type.objectPrototype || Object.getPrototypeOf(type.module) || Montage.prototype;
                prototype = Object.create(prototypeToExtend);
                prototype.constuctor = type.objectPrototype     ? type.objectPrototype.constructor
                                                                : type.module;

                if(prototype.constuctor.name === "constructor" ) {
                    Object.defineProperty(prototype.constuctor, "name", { value: type.typeName });
                }

                this._dataObjectPrototypes.set(type, prototype);
                if (type instanceof ObjectDescriptor || type instanceof DataObjectDescriptor) {
                    triggers = this.DataTrigger.addTriggers(this, type, prototype);
                } else {
                    info = Montage.getInfoForObject(type.prototype);
                    console.warn("Data Triggers cannot be created for this type. (" + (info && info.objectName) + ") is not an ObjectDescriptor");
                    triggers = [];
                }
                this._dataObjectTriggers.set(type, triggers);
                //We add a property that returns an object's snapshot
                //We add a property that returns an object's primaryKey
                //Let's postponed this for now and revisit when we need
                //add more properties/logic to automatically track changes
                //on objects

                // Object.defineProperties(prototype, {
                //      "montageDataSnapshot": {
                //          get: this.__object__snapshotMethodImplementation
                //      },
                //      "montageDataPrimaryKey": {
                //          get: this.__object_primaryKeyMethodImplementation
                //      }
                //  });

                //Adds support for event structure, setting the classes as instances next target
                //if there's type.module
                if(type.module) {
                    Object.defineProperty(prototype, "nextTarget", { value: type.module });

                    //setting objectDescriptor as classes next target:
                    Object.defineProperty(type.module, "nextTarget", { value: type });
                } else {
                    //If no known custom JS constructor, we go straight to the object descriptor:
                    Object.defineProperty(prototype, "nextTarget", { value: type });
                }

                // //set data service as objectDescriptor next target:
                // Object.defineProperty(type, "nextTarget", { value: this.mainService });

            }
            return prototype;
        }
    },

    // __object__snapshotMethodImplementation: {
    //     value: function() {
    //         return exports.DataService.mainService._getChildServiceForObject(this).snapshotForObject(this);
    //     }
    // },
    // __object_primaryKeyMethodImplementation: {
    //     value: function() {
    //         return exports.DataService.mainService.dataIdentifierForObject(this).primaryKey;
    //     }
    // },

    /**
     * Returns the [data triggers]{@link DataTrigger} set up for objects of the
     * specified type.
     *
     * @private
     * @method
     * @argument {Object} object
     * @returns {Object<string, DataTrigger>}
     */
    _getTriggersForObject: {
        value: function (object) {
            var type = this._getObjectType(object);
            return type && this._dataObjectTriggers.get(type);
        }
    },

    _dataObjectPrototypes: {
        // get: function () {
        //     if (!this.__dataObjectPrototypes){
        //         this.__dataObjectPrototypes = new Map();
        //     }
        //     return this.__dataObjectPrototypes;
        // },
        value: new Map()
    },

    __dataObjectPrototypes: {
        value: undefined
    },

    _dataObjectTriggers: {
        get: function () {
            if (!this.__dataObjectTriggers){
                this.__dataObjectTriggers = new Map();
            }
            return this.__dataObjectTriggers;
        }
    },

    __dataObjectTriggers: {
        value: undefined
    },

    /***************************************************************************
     * Data Object Properties
     */

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
                    triggers = this._getTriggersForObject(object),
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

            if(!object) {
                return Promise.resolve(null);
            }
            /*
                Benoit:

                - If we create an object, properties that are not relations can't
                be fetched. We need to make sure we don't actually try.

                - If a property is a relationship and it wasn't set on the object,
                as an object, we can't get it either.
            */
            if(this.isObjectCreated(object)) {
                //Not much we can do there anyway, punt
                return Promise.resolve(true);
            } else if (this.isRootService) {
                // Get the data, accepting property names as an array or as a list
                // of string arguments while avoiding the creation of any new array.
                //var names = Array.isArray(propertyNames) ? propertyNames : Array.prototype.slice.call(arguments, 1),
                var names = Array.isArray(propertyNames) ? propertyNames : arguments,
                start = names === propertyNames ? 0 : 1;
                return this._getOrUpdateObjectProperties(object, names, start, false);
            }
            else {
                return this.rootService.getObjectProperties(object, propertyNames);
            }
        }
    },

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
                    /*
                        This only works for expressions that are pure, chained
                        property traversals, aka property path. A more general walk
                        would be needed using the expression syntax to be totally
                        generic and support any kind of expression.
                    */
                    var split = expression.split(".");
                    // if (split.length == 1) {
                    //     promises.push(self.getObjectProperties(object, split[0]));
                    // } else {
                        promises.push(self._getPropertiesOnPath(object, split));
                    // }

                });


                return Promise.all(promises);


            } else {
                return this.rootService.getObjectPropertyExpressions(object, propertyValueExpressions);
            }
        }
    },

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

    /**
     * Fetch the value of a data object's property, possibly asynchronously.
     *
     * The default implementation of this method delegates the fetching to a
     * child services, or does nothing but return a fulfilled promise for `null`
     * if no child service can be found to handle the specified object.
     *
     * [Raw data service]{@link RawDataService} subclasses should override
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
            var isHandler = this.parentService && this.parentService._getChildServiceForObject(object) === this,
                useDelegate = isHandler && typeof this.fetchRawObjectProperty === "function",
                delegateFunction = !useDelegate && isHandler && this._delegateFunctionForPropertyName(propertyName),
                propertyDescriptor = !useDelegate && !delegateFunction && isHandler && this._propertyDescriptorForObjectAndName(object, propertyName),
                childService = !isHandler && this._getChildServiceForObject(object),
                debug = exports.DataService.debugProperties.has(propertyName);


            // Check if property is included in debugProperties. Intended for debugging
            if (debug) {
                console.debug("DataService.fetchObjectProperty", object, propertyName);
                console.debug("To debug ExpressionDataMapping.mapRawDataToObjectProperty for " + propertyName + ", set a breakpoint here.");
            }

            return  useDelegate
                        ?   this.fetchRawObjectProperty(object, propertyName)
                        :   delegateFunction
                                ?   delegateFunction.call(this, object)
                                :   isHandler && propertyDescriptor
                                    ?   this._fetchObjectPropertyWithPropertyDescriptor(object, propertyName, propertyDescriptor)
                                    : childService
                                        ?   childService.fetchObjectProperty(object, propertyName)
                                        :   this.nullPromise;
        }
    },

    _delegateFunctionForPropertyName: {
        value: function (propertyName) {
            var capitalized = propertyName.charAt(0).toUpperCase() + propertyName.slice(1),
                functionName = "fetch" + capitalized + "Property";
            return typeof this[functionName] === "function" && this[functionName];
        }
    },

    _isAsync: {
        value: function (object) {
            return object && object.then && typeof object.then === "function";
        }
    },

    /* TODO: Remove when mapping is moved in the webworker. This is used right now to know
    when an object is bieng mapped so we can avoid tracking changes happening during that time. This issue will disappear when mapping is done in a web worker and not on the object directly.
    */
    _objectsBeingMapped: {
        value: new CountedSet()
    },

    _rawDataToObjectMappingPromiseByObject: {
        value: new Map()
    },

    _setMapRawDataToObjectPromise: {
        value: function (rawData, object, promise) {
            var objectMap = this._rawDataToObjectMappingPromiseByObject.get(object),
                rawDataPromise;
            if(!objectMap) {
                objectMap = new Map();
                this._rawDataToObjectMappingPromiseByObject.set(object,objectMap);
            }

            if(!objectMap.has(rawData)) {
                objectMap.set(rawData,promise);
            } else {
                if(objectMap.get(rawData) !== promise) {
                    console.error("Overriding existing mapping promise for object:",object," rawData:",rawData," existing Promise:",objectMap.get(rawData)," new Promise:", promise) ;
                } else {
                    console.error("Overriding existing mapping promise with same promise for object:",object," rawData:",rawData," existing Promise:",objectMap.get(rawData));
                }
            }
        }
    },

    _getMapRawDataToObjectPromise: {
        value: function (rawData, object) {
            var objectMap = this._rawDataToObjectMappingPromiseByObject.get(object);
            return objectMap && objectMap.get(rawData);
        }
    },

    _deleteMapRawDataToObjectPromise: {
        value: function (rawData, object) {
            var objectMap = this._rawDataToObjectMappingPromiseByObject.get(object);
            // console.log(object.dataIdentifier.objectDescriptor.name+" _deleteMapRawDataToObjectPromise: id: "+object.dataIdentifier.primaryKey);
            // if(!objectMap.has(rawData)) {
            //     console.log(object.dataIdentifier.objectDescriptor.name+" _deleteMapRawDataToObjectPromise: id: "+object.dataIdentifier.primaryKey+" !!! COULDN'T FIND rawData entry");
            // }
            return objectMap && objectMap.delete(rawData);
        }
    },


    _fetchObjectPropertyWithPropertyDescriptor: {
        value: function (object, propertyName, propertyDescriptor) {
            var self = this,
                objectDescriptor = propertyDescriptor.owner,
                mapping = objectDescriptor && this.mappingForType(objectDescriptor),
                data = {},
                result;


            if (mapping) {
                /*
                    @marchant: Why aren't we passing this.snapshotForObject(object) instead of copying everying in a new empty object?

                    @tejaede: The criteria source was a first attempt to support derived properties. It's a bucket in which we can put data from the cooked object in order to fetch other cooked properties. The cooked data placed in the criteria source does not belong in the snapshot.

                    For example, take this model:

                    A Foo model includes a bars property and a baz property.
                    Foo.baz is derived from the value of Foo.bars.
                    When the application triggers a fetch for Foo.baz, the value of Foo.bars needs to be available to build the criteria for the fetch. However, the value of Foo.bars is cooked and does not belong in the snapshot. Therefore, we create a copy of the snapshot called the "criteria source" into which we can put Foo.bars.

                    All of this said, I don't know this is the right way to solve the problem. The issue at the moment is that this functionality is being used so we cannot remove it without an alternative.
                */
                Object.assign(data, this.snapshotForObject(object));

                self._objectsBeingMapped.add(object);

                result = mapping.mapObjectToCriteriaSourceForProperty(object, data, propertyName);
                if (this._isAsync(result)) {
                    return result.then(function() {
                        Object.assign(data, self.snapshotForObject(object));
                        result = mapping.mapRawDataToObjectProperty(data, object, propertyName);

                        if (!self._isAsync(result)) {
                            self._objectsBeingMapped.delete(object);
                        }
                        else {
                            result = result.then(function(resolved) {

                                self._objectsBeingMapped.delete(object);
                                return resolved;
                            }, function(failed) {
                                self._objectsBeingMapped.delete(object);
                            });
                        }
                        return result;
                    }, function(error) {
                        self._objectsBeingMapped.delete(object);
                        throw error;
                    });
                } else {
                    //This was already done a few lines up. Why are we re-doing this?
                    Object.assign(data, self.snapshotForObject(object));
                    result = mapping.mapRawDataToObjectProperty(data, object, propertyName);
                    if (!this._isAsync(result)) {
                        result = this.nullPromise;
                        this._objectsBeingMapped.delete(object);
                    }
                    else {
                        result = result.then(function(resolved) {
                            self._objectsBeingMapped.delete(object);
                            return resolved;
                        }, function(failed) {
                            self._objectsBeingMapped.delete(object);
                        });
                    }
                    return result;
                }
            } else {
                return this.nullPromise;
            }
        }
    },

    /**
     * @private
     * @method
     */
    _getOrUpdateObjectProperties: {
        value: function (object, names, start, isUpdate) {
            var triggers, trigger, promises, promise, i, n;
            // Request each data value separately, collecting unique resulting
            // promises into an array and a set, but avoid creating any array
            // or set unless that's necessary.
            triggers = this._getTriggersForObject(object);
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
     * @private
     * @method
     */
    _setObjectPropertyValue: {
        value: function (object, propertyName, propertyValue, updateInverse) {
            var triggers = this._getTriggersForObject(object),
                trigger = triggers ? triggers[propertyName] : null;

            if(trigger) {
                trigger._setValue(object,propertyValue, false)
            }

        }
    },

    /***************************************************************************
     * Data Object Creation
     */

    /**
     * Find an existing data object corresponding to the specified raw data, or
     * if no such object exists, create one.
     *
     * Since root services are responsible for tracking and creating data
     * objects, subclasses whose instances will not be root services should
     * override this method to call their root service's implementation of it.
     *
     * @method
     * @argument {DataObjectDescriptor} type - The type of object to find or
     *                                         create.
     * @argument {Object} data               - An object whose property values
     *                                         hold the object's raw data. That
     *                                         data will be used to determine
     *                                         the object's unique identifier.
     * @argument {?} context                 - A value, usually passed in to a
     *                                         [raw data service's]{@link RawDataService}
     *                                         [addRawData()]{@link RawDataService#addRawData}
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
                // TODO [Charles]: Object uniquing.
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

    isUniquing: {
        value: false
    },

    _identifier: {
        value: undefined
    },

    identifier: {
        get: function() {
            return this._identifier || (this._identifier = Montage.getInfoForObject(this).moduleId);
        }
    },

    __dataIdentifierByObject: {
        value: null
    },

    _dataIdentifierByObject: {
        // This property is shared with all child services.
        // If created lazily the wrong data identifier will be returned when
        // accessed by a child service.
        value: new WeakMap()
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
     * Records an object's DataIdentifier
     *
     * @method
     * @argument {object} object                        - an Object.
     * @argument {DataIdentifier} dataIdentifier        - The object whose property values are
     */
    recordDataIdentifierForObject: {
        value: function(dataIdentifier, object) {
            if(this._dataIdentifierByObject.has(object) && this._dataIdentifierByObject.get(object) !== dataIdentifier) {
                throw new Error("recordDataIdentifierForObject when one already exists:"+JSON.stringify(object));
            }
            this._dataIdentifierByObject.set(object, dataIdentifier);
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
            console.log("removeDataIdentifierForObject(",object);
            this._dataIdentifierByObject.delete(object);
        }
    },

    __objectByDataIdentifier: {
        value: null
    },

    _objectByDataIdentifier: {
        get: function() {
            return this.__objectByDataIdentifier || (this.__objectByDataIdentifier = new WeakMap());
        }
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
     * Records an object's DataIdentifier
     *
     * @method
     * @argument {DataIdentifier} dataIdentifier    - DataIdentifier
     * @argument {object} object                    - object represented by dataIdentifier
     */
    recordObjectForDataIdentifier: {
        value: function(object, dataIdentifier) {
            this._objectByDataIdentifier.set(dataIdentifier, object);
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
    _eventPoolFactoryForEventType: {
        value: function () {
            return new DataEvent();
        }
    },

    __dataEventPoolByEventType: {
        value: null
    },
    _dataEventPoolForEventType: {
        value: function (eventType) {
            var pool = (this.__dataEventPoolByEventType || (this.__dataEventPoolByEventType = new Map())).get(eventType);
            if(!pool) {
                this.__dataEventPoolByEventType.set(eventType,(pool = new ObjectPool(this._eventPoolFactoryForEventType)));
            }
            return pool;
        }
    },
    __preparedConstructorsForDataEvents: {
        value: null
    },

    isConstructorPreparedToHandleDataEvents: {
        value: function (objectConstructor) {
            return (this.__preparedConstructorsForDataEvents || (this.__preparedConstructorsForDataEvents = new Set())).has(objectConstructor);
        }
    },

    prepareConstructorToHandleDataEvents: {
        value: function (objectConstructor, event) {
            if(typeof objectConstructor.prepareToHandleDataEvents === "function") {
                objectConstructor.prepareToHandleDataEvents(event);
            }
            //prepareToHandleDataEvent or prepareToHandleCreateEvent
            this.__preparedConstructorsForDataEvents.add(objectConstructor);
        }
    },

    dispatchDataEventTypeForObject: {
        value: function (eventType, object, detail) {
            /*
                This needs to be made more generic in EventManager, which has "prepareForActivationEvent,
                but it's very specialized for components. Having all prototypes of DO register as eventListeners upfront
                would be damaging performance wise. We should do it as things happen.
            */
            if(object.dispatchEvent) {
                var eventPool = this._dataEventPoolForEventType(eventType),
                objectDescriptor = this.objectDescriptorForObject(object),
                objectConstructor = object.constructor,
                dataEvent = eventPool.checkout();

                dataEvent.type = eventType;
                dataEvent.target = objectDescriptor;
                dataEvent.dataService = this;
                dataEvent.dataObject = object;
                dataEvent.detail = detail;

                if(!this.isConstructorPreparedToHandleDataEvents(objectConstructor)) {
                    this.prepareConstructorToHandleDataEvents(objectConstructor, dataEvent);
                }

                object.dispatchEvent(dataEvent);
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
     * @argument {DataObjectDescriptor} type - The type of object to create.
     * @returns {Object}                     - The created object.
     */
    //TODO add the creation of a temporary identifier to pass to _createDataObject
    createDataObject: {
        value: function (type) {
            if (this.isRootService) {
                var service = this.childServiceForType(type),
                    //Gives a chance to raw data service to provide a primary key for clien-side creation/
                    //Especially useful for systems that use uuid as primary keys.
                    //object = this._createDataObject(type, service.dataIdentifierForNewDataObject(type));
                    object = this._createDataObject(type, service.dataIdentifierForNewDataObject(this.objectDescriptorForType(type)));
                this.createdDataObjects.add(object);

                this.dispatchDataEventTypeForObject(DataEvent.create, object);

                return object;
            } else {
                this.rootService.createDataObject(type);
            }
        }
    },

    /**
     * Create a data object without registering it in the new object map.
     *
     * @private
     * @method
     * @argument {DataObjectDescriptor} type - The type of object to create.
     * @returns {Object}                     - The created object.
     */
    _createDataObject: {
        value: function (type, dataIdentifier) {
            var objectDescriptor = this.objectDescriptorForType(type),
                object = Object.create(this._getPrototypeForType(objectDescriptor));
            if (object) {

                //This needs to be done before a user-land code can attempt to do
                //anyting inside its constructor, like creating a binding on a relationships
                //causing a trigger to fire, not knowing about the match between identifier
                //and object... If that's feels like a real situation, it is.
                this.registerUniqueObjectWithDataIdentifier(object, dataIdentifier);
                // if (dataIdentifier && this.isUniquing) {
                //     this.recordDataIdentifierForObject(dataIdentifier, object);
                //     this.recordObjectForDataIdentifier(object, dataIdentifier);
                // }

                object = object.constructor.call(object) || object;
                if (object) {
                    this._setObjectType(object, objectDescriptor);
                }
            }
            return object;
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
            //Benoit, this is currently relying on a manual turn-on of isUniquing on the MainService, which is really not something people should have to worry about...
            if (object && dataIdentifier && this.isRootService && this.isUniquing) {
                this.recordDataIdentifierForObject(dataIdentifier, object);
                this.recordObjectForDataIdentifier(object, dataIdentifier);
            }
        }
    },

    /***************************************************************************
     * Data Object Changes
     */

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

    isObjectCreated: {
        value: function(object) {
            var isObjectCreated = this.createdDataObjects.has(object);

            if(!isObjectCreated) {
                var service = this._getChildServiceForObject(object);
                if(service) {
                    isObjectCreated = service.isObjectCreated(object);
                } else {
                    isObjectCreated = false;
                }
            }
            return isObjectCreated;
        }
    },

    /**
     * A set of the data objects moified by the user after they were fetched.
     *     *
     * @type {Set.<Object>}
     */
    changedDataObjects: {
        get: function () {
            if (this.isRootService) {
                if (!this._changedDataObjects) {
                    this._changedDataObjects = new Set();
                }
                return this._changedDataObjects;
            }
            else {
                return this.rootService.changedDataObjects;
            }
        }
    },

    /**
     * A Map of the data objects managed by this service or any other descendent
     * of this service's [root service]{@link DataService#rootService} that have
     * been changed since that root service's data was last saved, or since the
     * root service was created if that service's data hasn't been saved yet
     *
     * Since root services are responsible for tracking data objects, subclasses
     * whose instances will not be root services should override this property
     * to return their root service's value for it.
     *
     * The key are the objects, the value is a Set containing the property changed
     *
     * @type {Map.<Object>}
     */
    dataObjectChanges: {
        get: function () {
            if (this.isRootService) {
                return this._dataObjectChanges || (this._dataObjectChanges = new Map());
            }
            else {
                return this.rootService.dataObjectChanges;
            }
        }
    },

    _dataObjectChanges: {
        value: undefined
    },

    /**
     * A Map containing the changes for an object. Keys are the property modified,
     * values are either a single value, or a map with added/removed keys for properties
     * that have a cardinality superior to 1. The underlyinng collection doesn't matter
     * at that level.
     *
     * Retuns undefined if no changes have been registered.
     *
     * @type {Map.<Object>}
     */

    changesForDataObject: {
        value: function (dataObject) {
            return this.dataObjectChanges.get(dataObject);
        }
    },

    /**
     * handles the propagation of a value set to a property's inverse property, fka "addToBothSidesOfRelationship..."
     * This doesn't handle range changes, which is done in another method.
     *
     * @private
     * @method
     * @argument {Object} dataObject
     * @returns {Promise}

     */
    _setDataObjectPropertyDescriptorValueForInversePropertyName: {
        value: function (dataObject, propertyDescriptor, value, inversePropertyName) {
            //Now set the inverse if any
            if(inversePropertyName) {
                var inversePropertyDescriptor = propertyDescriptor._inversePropertyDescriptor /* Sync */;
                if(!inversePropertyDescriptor) {
                    var self = this;
                    return propertyDescriptor.inversePropertyDescriptor.then(function(inversePropertyDescriptorResolved) {
                        self._setDataObjectPropertyDescriptorValueForInversePropertyDescriptor(dataObject, propertyDescriptor, value, inversePropertyDescriptorResolved);
                    })
                } else {
                    this._setDataObjectPropertyDescriptorValueForInversePropertyDescriptor(dataObject, propertyDescriptor, value, inversePropertyDescriptor);
                    return Promise.resolveTrue;
                }
            }
       }
    },

    _setDataObjectPropertyDescriptorValueForInversePropertyDescriptor: {
        value: function (dataObject, propertyDescriptor, value, inversePropertyDescriptor, previousValue) {
            if(!inversePropertyDescriptor) {
                return;
            }

            var inversePropertyName = inversePropertyDescriptor.name,
                inversePropertyCardinality = inversePropertyDescriptor.cardinality,
                inverseValue;

            if(propertyDescriptor.cardinality === 1) {
                //value should not be an array
                if(Array.isArray(value)) {
                    console.warn("Something's off...., the value of propertyDescriptor:",propertyDescriptor, " of data object:",dataObject," should not be an array");
                }

                if(value) {
                    if(inversePropertyCardinality > 1) {
                        /*
                            value needs to be added to the other's side:

                            BUT - TODO - doing value[inversePropertyName] actually fires the trigger if wasn't there alredy.
                            In some cases, we rely on the value being there so it gets saved properly, by putting a foreignKey in for example.
                            It might be possible to handle that when we save only, or we could do the lookup using the property getter's secret shouldFetch argument.

                             inverseValue = Object.getPropertyDescriptor(value,inversePropertyName).get(false); //<-shouldFetch false

                            If we add the value and we don't know what was there (because we didn't fetch), we won't be able to do optimistic locking
                            We also would need to mark that property as "incommplete?", which we would need to do to able to add to a relationship without resolving it.
                            such that if the user actually fetch that property we can re-apply what was added/removed locally to what was actually fetched.

                            Also value[inversePropertyName] does fire the trigger, but it's async, so we're likely missing the value here and we migh need to use a promise with
                            getObjectProperty/ies

                        */
                        inverseValue = value[inversePropertyName];
                        if(inverseValue) {
                            /*
                                We might be looping back, but in any case, we shouldn't add the same object again, so we need to check if it is there. I really don't like doinf indexOf() here, but it's not a set...
                            */
                           if(inverseValue.indexOf(dataObject) === -1) {
                            inverseValue.push(dataObject)
                           }
                        } else {
                            //No existing array so we create one on the fly
                            value[inversePropertyName] = [dataObject];
                        }
                    } else {
                        /*
                            A 1-1 then. Let's not set if it's the same...
                        */
                        if(value[inversePropertyName] !== dataObject) {
                            value[inversePropertyName] = dataObject;
                        }
                    }
                }

                if(previousValue) {
                    if(inversePropertyCardinality > 1) {
                        /*
                            previousValue needs to be removed from the other's side:
                        */
                        inverseValue = previousValue[inversePropertyName];
                        if(inverseValue) {
                            /*
                                Assuming it only exists once in the array as it should...
                            */
                            inverseValue.delete(dataObject)
                        }
                        // else {
                        //     //No existing array so nothing to do....
                        // }
                    } else {
                        //A 1-1 then
                        previousValue[inversePropertyName] = null;
                    }

                }

            } else if(propertyDescriptor.cardinality > 1) {
                //value should  be an array
                if(!Array.isArray(value)) {
                    console.warn("Something's off...., the value of propertyDescriptor:",propertyDescriptor, " of data object:",dataObject," should be an array");
                }

                this._addDataObjectPropertyDescriptorValuesForInversePropertyDescriptor(dataObject, propertyDescriptor, value, inversePropertyDescriptor);

                if(previousValue) {
                    this._removeDataObjectPropertyDescriptorValuesForInversePropertyDescriptor(dataObject, propertyDescriptor, previousValue, inversePropertyDescriptor);
                }
                // for(var i=0, countI = value.length, iValue; (i<countI); i++) {
                //     iValue = value[i];

                //     if(inversePropertyCardinality > 1) {
                //         //many to many:
                //         //value needs to be added to the other's side:
                //         inverseValue = value[inversePropertyName];
                //         if(inverseValue) {
                //             inverseValue.push(dataObject)
                //         } else {
                //             //No existing array so we create one on the fly
                //             value[inversePropertyName] = [dataObject];
                //         }

                //     } else {
                //         //A many-to-one
                //         iValue[inversePropertyName] = dataObject;
                //     }

                // }

            }
        }
    },


    /**
     * handles the propagation of a values added to a property's array value to it's inverse property, fka "addToBothSidesOfRelationship..."
     *
     * @private
     * @method
     * @argument {Object} dataObject
     * @returns {Promise}

     */
    _addDataObjectPropertyDescriptorValuesForInversePropertyName: {
        value: function (dataObject, propertyDescriptor, value, inversePropertyName) {
            //Now set the inverse if any
            if(inversePropertyName) {
                var inversePropertyDescriptor = propertyDescriptor._inversePropertyDescriptor /* Sync */;
                if(!inversePropertyDescriptor) {
                    var self = this;
                    return propertyDescriptor.inversePropertyDescriptor.then(function(inversePropertyDescriptorResolved) {
                        self._addDataObjectPropertyDescriptorValuesForInversePropertyDescriptor(dataObject, propertyDescriptor, value, inversePropertyDescriptorResolved);
                    })
                } else {
                    this._addDataObjectPropertyDescriptorValuesForInversePropertyDescriptor(dataObject, propertyDescriptor, value, inversePropertyDescriptor);
                    return Promise.resolveTrue;
                }
            }
       }
    },

    _addDataObjectPropertyDescriptorValuesForInversePropertyDescriptor: {
        value: function (dataObject, propertyDescriptor, values, inversePropertyDescriptor) {
            if(inversePropertyDescriptor) {
                //value should  be an array
                if(!Array.isArray(values) || !(propertyDescriptor.cardinality > 0)) {
                    console.warn("Something's off...., values added to propertyDescriptor:",propertyDescriptor, " of data object:",dataObject," should be an array");
                }

                var inversePropertyName = inversePropertyDescriptor.name,
                    inversePropertyCardinality = inversePropertyDescriptor.cardinality,
                    i, countI;

                for(i=0, countI = values.length; (i<countI); i++) {
                    this._addDataObjectPropertyDescriptorValueForInversePropertyDescriptor(dataObject, propertyDescriptor, values[i], inversePropertyDescriptor, inversePropertyCardinality, inversePropertyName);

                }
                }
        }
    },

    _addDataObjectPropertyDescriptorValueForInversePropertyDescriptor: {
        value: function (dataObject, propertyDescriptor, value, inversePropertyDescriptor, _inversePropertyCardinality, _inversePropertyName) {
            if(inversePropertyDescriptor && value) {

                if((_inversePropertyCardinality || inversePropertyDescriptor.cardinality) > 1) {
                    //many to many:
                    //value, if there is one, needs to be added to the other's side:
                    inverseValue = value[_inversePropertyName || inversePropertyDescriptor.name];
                    if(inverseValue) {
                        /*
                            We shouldn't add the same object again, so we need to check if it is there. I really don't like doinf indexOf() here, but it's not a set...
                        */
                        if(inverseValue.indexOf(dataObject) === -1) {
                            inverseValue.push(dataObject);
                        }
                    } else {
                        //No existing array so we create one on the fly
                        value[_inversePropertyName || inversePropertyDescriptor.name] = [dataObject];
                    }

                } else {
                    //A many-to-one
                    if(value[_inversePropertyName || inversePropertyDescriptor.name] !== dataObject) {
                        value[_inversePropertyName || inversePropertyDescriptor.name] = dataObject;
                    }
                }
            }
        }
    },


    /**
     * handles the propagation of a values added to a property's array value to it's inverse property, fka "addToBothSidesOfRelationship..."
     *
     * @private
     * @method
     * @argument {Object} dataObject
     * @returns {Promise}

     */
    _removeDataObjectPropertyDescriptorValuesForInversePropertyName: {
        value: function (dataObject, propertyDescriptor, value, inversePropertyName) {
            //Now set the inverse if any
            if(inversePropertyName) {
                var inversePropertyDescriptor = propertyDescriptor._inversePropertyDescriptor /* Sync */;
                if(!inversePropertyDescriptor) {
                    var self = this;
                    return propertyDescriptor.inversePropertyDescriptor.then(function(inversePropertyDescriptorResolved) {
                        self._removeDataObjectPropertyDescriptorValuesForInversePropertyDescriptor(dataObject, propertyDescriptor, value, inversePropertyDescriptorResolved);
                    })
                } else {
                    this._removeDataObjectPropertyDescriptorValuesForInversePropertyDescriptor(dataObject, propertyDescriptor, value, inversePropertyDescriptor);
                    return Promise.resolveTrue;
                }
            }
       }
    },


    _removeDataObjectPropertyDescriptorValuesForInversePropertyDescriptor: {
        value: function (dataObject, propertyDescriptor, values, inversePropertyDescriptor) {
            if(inversePropertyDescriptor) {

                //value should  be an array
                if(!Array.isArray(values) || !(propertyDescriptor.cardinality > 0)) {
                    console.warn("Something's off...., values added to propertyDescriptor:",propertyDescriptor, " of data object:",dataObject," should be an array");
                }

                var inversePropertyName = inversePropertyDescriptor.name,
                    inversePropertyCardinality = inversePropertyDescriptor.cardinality,
                    i, countI;

                for(i=0, countI = values.length; (i<countI); i++) {
                    this._removeDataObjectPropertyDescriptorValueForInversePropertyDescriptor(dataObject, propertyDescriptor, values[i], inversePropertyDescriptor, inversePropertyCardinality, inversePropertyName);
                }
            }
        }
    },

    _removeDataObjectPropertyDescriptorValueForInversePropertyDescriptor: {
        value: function (dataObject, propertyDescriptor, value, inversePropertyDescriptor, _inversePropertyCardinality, _inversePropertyName) {
            if(inversePropertyDescriptor && value) {

                if((_inversePropertyCardinality || inversePropertyDescriptor.cardinality) > 1) {
                    /*
                        many to many:
                        value needs to be renoved to the other's side, unless it doesn't exists (which would be the case if it wasn't fetched).
                    */
                    inverseValue = value[_inversePropertyName || inversePropertyDescriptor.name];
                    if(inverseValue) {
                        inverseValue.delete(dataObject);
                    }

                } else {
                    //A many-to-one, sever the ties
                    value[_inversePropertyName || inversePropertyDescriptor.name] = null;
                }
            }
        }
    },

    registerDataObjectChangesFromEvent: {
        value: function (changeEvent) {
            var dataObject =  changeEvent.target,
                key = changeEvent.key,
                objectDescriptor = this.objectDescriptorForObject(dataObject),
                propertyDescriptor = objectDescriptor.propertyDescriptorForName(key);


            //Property with definitions are read-only shortcuts, we don't want to treat these as changes the raw layers will want to know about
            if(propertyDescriptor.definition) {
                return;
            }


            var inversePropertyName = propertyDescriptor.inversePropertyName,
                inversePropertyDescriptor;

            if(inversePropertyName) {
                inversePropertyDescriptor = propertyDescriptor._inversePropertyDescriptor /* Sync */;
                if(!inversePropertyDescriptor) {
                    var self = this;
                    return propertyDescriptor.inversePropertyDescriptor.then(function(_inversePropertyDescriptor) {
                        if(!_inversePropertyDescriptor) {
                            console.error("objectDescriptor "+objectDescriptor.name+"'s propertyDescriptor "+propertyDescriptor.name+ " declares an inverse property named "+inversePropertyName+" on objectDescriptor "+propertyDescriptor._valueDescriptorReference.name+", no matching propertyDescriptor could be found on "+propertyDescriptor._valueDescriptorReference.name);
                        } else {
                            self._registerDataObjectChangesFromEvent(changeEvent, propertyDescriptor, _inversePropertyDescriptor);
                        }
                    });
                } else {
                    this._registerDataObjectChangesFromEvent(changeEvent, propertyDescriptor, inversePropertyDescriptor);
                }
            } else {
                this._registerDataObjectChangesFromEvent(changeEvent, propertyDescriptor, inversePropertyDescriptor);
            }

        }
    },

    _registerDataObjectChangesFromEvent: {
        value: function (changeEvent, propertyDescriptor, inversePropertyDescriptor) {

            var dataObject =  changeEvent.target,
                isCreatedObject = this.isObjectCreated(dataObject),
                key = changeEvent.key,
                keyValue = changeEvent.keyValue,
                addedValues = changeEvent.addedValues,
                removedValues = changeEvent.removedValues,
                changesForDataObject = this.dataObjectChanges.get(dataObject),
                inversePropertyDescriptor,
                self = this;

            if(!isCreatedObject) {
                this.changedDataObjects.add(dataObject);
            }

            if(!changesForDataObject) {
                changesForDataObject = new Map();
                this.dataObjectChanges.set(dataObject,changesForDataObject);
            }




            /*
                While a single change Event should be able to model both a range change
                equivalent of minus/plus and a related length property change at
                the same time, a changeEvent from the perspective of tracking data changes
                doesn't really care about length, or the array itself. The key of the changeEvent will be one of the target's and the added/removedValues would be from that property's array if it's one.

                Which means that data objects setters should keep track of an array
                changing on the object itself, as well as mutation done to the array itself while modeling that object's relatioonship.

                Client side we're going to have partial views of a whole relationship
                as we may not want to fetch everything at once if it's big. Which means
                that even if we can track add / removes to a property's array, what we
                may consider as an add / remove client side, may be a no-op while it reaches the server, and we may want to be able to tell the client about that specific fact.


            */
            if( changeEvent.hasOwnProperty("key") && changeEvent.hasOwnProperty("keyValue") && key !== "length" &&
            /* new for blocking re-entrant */ changesForDataObject.get(key) !== keyValue) {
            changesForDataObject.set(key,keyValue);

                //Now set the inverse if any
                if(inversePropertyDescriptor) {
                    self._setDataObjectPropertyDescriptorValueForInversePropertyDescriptor(dataObject, propertyDescriptor, keyValue, inversePropertyDescriptor, changeEvent.previousKeyValue);
                }
            }

            //A change event could carry both a key/value change and addedValues/remove, like a splice, where the key would be "length"

            if(addedValues || removedValues) {
                //For key that can have add/remove the value of they key is an object
                //that itself has two keys: addedValues and removedValues
                //which value will be a set;
                var manyChanges = changesForDataObject.get(key),
                    i, countI;

                if(!manyChanges) {
                    manyChanges = {};
                    changesForDataObject.set(key,manyChanges);
                }

                //Not sure if we should consider evaluating added values regarded
                //removed ones, one could be added and later removed.
                //We later need to convert these into dataIdentifers, we could avoid a loop later
                //doing so right here.
                if(addedValues) {

                    /*
                        In this case, the array already contains the added value and we'll save it all anyway. So we just propagate.
                    */
                    if(Array.isArray(manyChanges) && isCreatedObject) {
                        self._addDataObjectPropertyDescriptorValuesForInversePropertyDescriptor(dataObject, propertyDescriptor, addedValues, inversePropertyDescriptor);
                    } else {
                        var registeredAddedValues = manyChanges.addedValues;
                        if(!registeredAddedValues) {

                            manyChanges.addedValues = (registeredAddedValues = new Set(addedValues));
                            self._addDataObjectPropertyDescriptorValuesForInversePropertyDescriptor(dataObject, propertyDescriptor, addedValues, inversePropertyDescriptor);

                        } else {

                            for(i=0, countI=addedValues.length;i<countI;i++) {
                                registeredAddedValues.add(addedValues[i]);
                                self._addDataObjectPropertyDescriptorValueForInversePropertyDescriptor(dataObject, propertyDescriptor, addedValues[i], inversePropertyDescriptor);
                            }
                        }
                    }
                }

                if(removedValues) {
                    /*
                        In this case, the array already contains the added value and we'll save it all anyway. So we just propagate.
                    */
                    if(Array.isArray(manyChanges) && isCreatedObject) {
                        self._removeDataObjectPropertyDescriptorValuesForInversePropertyDescriptor(dataObject, propertyDescriptor, removedValues, inversePropertyDescriptor);
                    } else {
                        var registeredRemovedValues = manyChanges.removedValues;
                        if(!registeredRemovedValues) {
                            manyChanges.removedValues = (registeredRemovedValues = new Set(removedValues));
                            self._removeDataObjectPropertyDescriptorValuesForInversePropertyDescriptor(dataObject, propertyDescriptor, removedValues, inversePropertyDescriptor);
                        } else {
                            for(i=0, countI=removedValues.length;i<countI;i++) {
                                registeredRemovedValues.delete(removedValues[i]);
                                self._removeDataObjectPropertyDescriptorValueForInversePropertyDescriptor(dataObject, propertyDescriptor, removedValues[i], inversePropertyDescriptor);
                            }
                        }
                    }
                    /*
                        Work on local graph integrity. When objects are disassociated, it could mean some deletions may happen bases on delete rules.
                        App side goal is to maintain the App graph, server's side is to maintain database integrity. Both needs to act on delete rules:
                        - get object's descriptor
                        - get PropertyDescriptor from key
                        - get PropertyDescriptor's .deleteRule
                            deleteRule can be:
                                - DeleteRule.NULLIFY
                                - DeleteRule.CASCADE
                                - DeleteRule.DENY
                                - DeleteRule.IGNORE
                    */

                    //,,,,,TODO
                }
            }



        }
    },

    clearRegisteredChangesForDataObject: {
        value: function (dataObject) {
            this.dataObjectChanges.set(dataObject,null);
        }
    },

    /**
     * A set of the data objects managed by this service or any other descendent
     * of this service's [root service]{@link DataService#rootService} that have
     * been set for deletion since that root service's data was last saved, or since the
     * root service was created if that service's data hasn't been saved yet
     *
     * Since root services are responsible for tracking data objects, subclasses
     * whose instances will not be root services should override this property
     * to return their root service's value for it.
     *
     * @type {Set.<Object>}
     */
    deletedDataObjects: {
        get: function () {
            if (this.isRootService) {
                this._deletedDataObjects = this._deletedDataObjects || new Set();
                return this._deletedDataObjects;
            }
            else {
                return this.rootService.deletedDataObjects;
            }
        }
    },

    _deletedDataObjects: {
        value: undefined
    },


    /***************************************************************************
     * Fetching Data
     */

    /**
     * Fetch data from the service using its child services.
     *
     * This method accept [types]{@link DataObjectDescriptor} as alternatives to
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

            if(!queryOrType) {
                return Promise.resolveNull;
            }

            var self = this,
                isSupportedType = !(queryOrType instanceof DataQuery),
                type = isSupportedType && queryOrType,
                criteria = optionalCriteria instanceof DataStream ? undefined : optionalCriteria,
                query = type ? DataQuery.withTypeAndCriteria(type, criteria) : queryOrType,
                stream = optionalCriteria instanceof DataStream ? optionalCriteria : optionalStream;

            // make sure type is an object descriptor or a data object descriptor.
            query.type = this.objectDescriptorForType(query.type);

            // Set up the stream.
            stream = stream || new DataStream();
            stream.query = query;
            stream.dataExpression = query.selectExpression;

            this._dataServiceByDataStream.set(stream, this._childServiceRegistrationPromise.then(function() {
                var service;
                //This is a workaround, we should clean that up so we don't
                //have to go up to answer that question. The difference between
                //.TYPE and Objectdescriptor still creeps-in when it comes to
                //the service to answer that to itself
                if (self.parentService && self.parentService.childServiceForType(query.type) === self && typeof self.fetchRawData === "function") {
                    service = self;
                    service._fetchRawData(stream);
                } else {

                    // Use a child service to fetch the data.
                    try {

                        service = self.childServiceForType(query.type);
                        if (service) {
                            //Here we end up creating an extra stream for nothing because it should be third argument.
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
            }));
            // Return the passed in or created stream.
            return stream;
        }
    },

    _fetchRawData: {
        value: function (stream) {
            var self = this,
                childService = this._childServiceForQuery(stream.query);

            if (childService) {
                childService._fetchRawData(stream);
            } else {
                //this is the new path for services with a userAuthenticationPolicy
                if (this.userAuthenticationPolicy) {
                    var userIdentityPromise,
                        shouldAuthenticate;
                    //If this is the service providing providesUserIdentity for the query's type: UserIdentityService for the UserIdentity type required.
                    //the query is either for the UserIdentity itself, or something else.
                    //If it's for the user identity itself, it's a simple fetch
                    //but if it's for something else, we may need to fetch the identity first, and then move on to the query at hand.
                    if(this.providesUserIdentity) {
                        //Regardless of the policy, we're asked to fetch a user identity
                        var streamQuery = stream.query;
                        if(stream.query.criteria) {
                            stream.query = self.mapSelectorToRawDataQuery(streamQuery);
                        }
                        this.fetchRawData(stream);
                        //Switch it back
                        stream.query = streamQuery;
                    }
                    else {
                        if(!this.userIdentity) {
                            if(this.userIdentityPromise) {
                                userIdentityPromise = this.userIdentityPromise;
                            }
                            else if ((this.authenticationPolicy === AuthenticationPolicyType.UpfrontAuthenticationPolicy) ||
                                    (
                                        (this.authenticationPolicy === AuthenticationPolicy.ON_DEMAND) &&
                                        (shouldAuthenticate = typeof this.queryRequireAuthentication === "function") && this.queryRequireAuthentication(stream.query)
                                    )) {

                                        this.userIdentityPromise = userIdentityPromise = new Promise(function(resolve,reject) {
                                        var userIdentityServices = this.userIdentityServices,
                                        userIdentityObjectDescriptors,
                                        selfUserCriteria,
                                        userIdentityQuery;


                                        //Shortcut, there could be multiple one we need to flatten.
                                        userIdentityObjectDescriptors = userIdentityServices[0].types;
                                        //selfUserCriteria = new Criteria().initWithExpression("identity == $", "self");
                                        userIdentityQuery = DataQuery.withTypeAndCriteria(userIdentityObjectDescriptors[0]);

                                        this.rootService.fetchData(userIdentityQuery)
                                        .then(function(userIdenties) {
                                            self.userIdentity = userIdenties[0];
                                            resolve(self.userIdentity);
                                        },
                                        function(error) {
                                            console.error(error);
                                            reject(error);
                                        });

                                    });

                                }
                                else userIdentityPromise = Promise.resolve(true);
                        }
                        else {
                            userIdentityPromise = Promise.resolve(true);
                        }

                        userIdentityPromise.then(function (authorization) {
                            var streamSelector = stream.query;
                            stream.query = self.mapSelectorToRawDataQuery(streamSelector);
                            self.fetchRawData(stream);
                            stream.query = streamSelector;
                        }).catch(function (e) {
                            stream.dataError(e);
                            self.userIdentityPromise = Promise.resolve(null);
                        });

                    }
                }
                else {
                    if (this.authorizationPolicy === AuthorizationPolicy.ON_DEMAND) {
                        var prefetchAuthorization = typeof this.shouldAuthorizeForQuery === "function" && this.shouldAuthorizeForQuery(stream.query);
                        if (prefetchAuthorization || !this.authorization) {
                            this.authorizationPromise = exports.DataService.authorizationManager.authorizeService(this, prefetchAuthorization).then(function(authorization) {
                                self.authorization = authorization;
                                return authorization;
                            });

                        }
                    }

                    this.authorizationPromise.then(function (authorization) {
                        var streamSelector = stream.query;
                        stream.query = self.mapSelectorToRawDataQuery(streamSelector);
                        self.fetchRawData(stream);
                        stream.query = streamSelector;
                    }).catch(function (e) {
                        stream.dataError(e);
                        self.authorizationPromise = Promise.resolve(null);
                    });
                }
            }
        }
    },


    /*
        ObjectDescriptors are what should dispatch events, as well as model objec intances
        So an imperative method on DataService would internally create the operation/event and dispatch it on the object descriptor. It would internally addEventListener for the "symetric event", for a Read, it would be a ReadUpdated, for a ReadUpdate/ a ReadUpdated as well.

        This would help re-implementing fetchData to be backward compatible.

        What is clear is that we need for a read for example, a stable array that can be relied on by bindings and be mutated over time.

        If we have anObjecDescriptor.dispatchEvent("read"), then someone whose job it to act on that read is an EventListener for it, and that's the RawDataServices running in the DataServiceWorker. This is where we need an intermediary whose job is to send these events over postMesssage so they get dispatched in the DataServiceWorker.

        So as a developer what am I writing if I'm not doing

            mainService.fetchData(query); //?

            mainService.readData(query); //?
            mainService.saveData(query); //?

            mainService.performOperation(readOperation);


    */

   readData: {
        value: function (dataOperation, optionalStream) {
            var self = this,
                objectDescriptor = dataOperation.objectDescriptor || dataOperation.dataType,
                stream = optionalStream,
                dataService, dataServicePromise;

            // Set up the stream.
            stream = stream || new DataStream();
            stream.operation = dataOperation;

            if(!(dataService = this._dataServiceByDataStream.get(stream))) {
                this._dataServiceByDataStream.set(stream, (dataServicePromise = this._childServiceRegistrationPromise.then(function() {
                    var service;
                    //This is a workaround, we should clean that up so we don't
                    //have to go up to answer that question. The difference between
                    //.TYPE and Objectdescriptor still creeps-in when it comes to
                    //the service to answer that to itself
                    if (self.parentService && self.parentService.childServiceForType(objectDescriptor) === self && typeof self.fetchRawData === "function") {
                        service = self;
                        service._fetchRawData(stream);
                    } else {

                        // Use a child service to fetch the data.
                            service = self.childServiceForType(objectDescriptor);
                            if (service) {
                                //Here we end up creating an extra stream for nothing because it should be third argument.
                                self._dataServiceByDataStream.set(stream, service);
                            } else {
                                throw new Error("Can't fetch data of unknown type - " + objectDescriptor.name);
                            }
                    }

                    return service;
                })));
            }
            else {
                dataServicePromise = Promise.resolve(dataService);
            }

            dataServicePromise.then(function(dataService) {
                try {
                    //Direct access for now
                    stream = dataService.handleRead(dataOperation);
                } catch (e) {
                    stream.dataError(e);
                }

            })

            // Return the passed in or created stream.
            return stream;
        }
    },


    _childServiceForQuery: {
        value: function (query) {
            var serviceModuleID = this._serviceIdentifierForQuery(query),
                service = serviceModuleID && this._childServicesByIdentifier.get(serviceModuleID);


            if (!service && this._childServicesByType.has(query.type)) {
                service = this._childServicesByType.get(query.type);
                service = service && service[0];
            }

            return service || null;
        }
    },

    _serviceIdentifierForQuery: {
        value: function (query) {
            var parameters = (query && query.criteria) ? query.criteria.parameters : null,
                serviceModuleID = parameters && parameters.serviceIdentifier,
                mapping, propertyName;

            if (!serviceModuleID) {
                mapping = this.mappingForType(query.type);
                propertyName = mapping && parameters && parameters.propertyName;
                serviceModuleID = propertyName && mapping.serviceIdentifierForProperty(propertyName);
            }

            return serviceModuleID;
        }
    },

    __dataServiceByDataStream: {
        value: null
    },

    _dataServiceByDataStream: {
        get: function() {
            return this.__dataServiceByDataStream || (this.__dataServiceByDataStream = new WeakMap());
        }
    },

    dataServiceForDataStream: {
        get: function(dataStream) {
            return this._dataServiceByDataStream.get(dataStream);
        }
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

    _cancelServiceDataStream: {
        value: function (rawDataService, dataStream, reason) {
            rawDataService.cancelRawDataStream(dataStream, reason);
            this._dataServiceByDataStream.delete(dataStream);
        }
    },


    /**
     * EventChange handler, begining of tracking objects changes via Triggers right now,
     * which are installed on propertyDescriptors. We might need to refine that by adding the
     * ability to model wether a property is persisted or not. If it's not meant to be persisted,
     * then a DataService most likely doesn't have much to do with it.
     * Right now, this is unfortunately called even during the mapRawDataToObject.
     * We need a way to ignore this as early as possible
     *
     * @method
     * @argument {ChangeEvent} [changeEvent] - The changeEvent
     *
     */
    handleChange: {
        value: function(changeEvent) {
            //Commentting out the restriction to exclude created objects as we might want to
            //use it for them as well

            // if(!this._createdDataObjects || (this._createdDataObjects && !this._createdDataObjects.has(changeEvent.target))) {
                //Needs to register the change so saving changes / update operations can use it later to decise what to send
                //console.log("handleChange:",changeEvent);
                this.registerDataObjectChangesFromEvent(changeEvent);
            //}
        }
    },

    /***************************************************************************
     * Saving Data
     */

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
            var saved = !this.isObjectCreated(object);
            this.deletedDataObjects.add(object);
            return this._updateDataObject(object, saved && "deleteDataObject");
        }
    },

    /**
     * Resets an object to the last value in the snapshot.
     * @method
     * @argument {Object} object - The object who will be reset.
     * @returns {external:Promise} - A promise fulfilled when the object has
     * been mapped back to its last known state.
     */
    resetDataObject: {
        value: function (object) {
            var service = this._getChildServiceForObject(object),
                promise;

            if (service) {
                promise = service.resetDataObject(object);
            }

            return promise;
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
    saveDataObject: {
        value: function (object) {
            //return this._updateDataObject(object, "saveDataObject");

            //TODO
            //First thing we should be doing here is run validation
            //on the object, using objectDescriptor's
            //draft: - could/should become async and return a promise.
            //var validatity = this.objectDescriptorForObject(object).evaluateRules(object);


            var self = this,
                service,
                promise = this.nullPromise,
                mappingPromise;

            if (this.parentService && this.parentService._getChildServiceForObject(object) === this) {
                var record = {};
                mappingPromise =  this._mapObjectToRawData(object, record);
                if (!mappingPromise) {
                    mappingPromise = this.nullPromise;
                }
                return mappingPromise.then(function () {
                        return self.saveRawData(record, object)
                            .then(function (data) {
                                self.rootService.createdDataObjects.delete(object);
                                return data;
                            });
                 });
            }
            else {
                service = this._getChildServiceForObject(object);
                if (service) {
                    var result = service.saveDataObject(object);
                    if(result) {
                        return result.then(function(success) {
                            self.rootService.createdDataObjects.delete(object);
                            //Duck test of an operation
                            // if(success.data) {
                            //     return success.data;
                            // }
                            // else {
                                return success;
                            // }

                        }, function(error) {
                            console.log(error);
                            return Promise.reject(error);
                        });
                    }
                }
                else {
                    return promise;
                }
            }
        }
    },


    _updateDataObject: {
        value: function (object, action) {
            var self = this,
                service,
                promise = this.nullPromise;

            if (this.parentService && this.parentService._getChildServiceForObject(object) === this) {
                service = action && this;
            }
            else {
                service = action && this._getChildServiceForObject(object);
                if (service) {
                    return service._updateDataObject(object, action);
                }
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

    _saveDataObject: {
        value: function (object) {
            var record = {};
            this._mapObjectToRawData(object, record);
            return this.saveRawData(record, object);
        }
    },
    // _updateDataObject: {
    //     value: function (object, action) {
    //         var self = this,
    //             service = action && this._getChildServiceForObject(object),
    //             promise = this.nullPromise;

    //         if (!action) {
    //             self.createdDataObjects.delete(object);
    //         } else if (service) {
    //             promise = service[action](object).then(function () {
    //                 self.createdDataObjects.delete(object);
    //                 return null;
    //             });
    //         }
    //         return promise;
    //     }
    // },

    /**
     * Returns a pomise of a DataOperation to save (create/updates) pending changes to an object
     * @method
     * @argument {Object} object - The object who will be reset.
     * @returns {external:Promise} - A promise fulfilled when the data operation is ready.
     */
    saveDataOperationFoObject: {
        value: function (object) {

        }
    },


    /**
     * Save all changes made since the last call. This method currently delegates to rawDataServices for the actual work
     * Some of it might migrate back up here later when the dust settles.
     *
     * TEMPORARY implementation assuming a single RawDataService that creates
     * operations. We might need to officially make that kind of subclass the
     * mainService.
     *
     * @method
     * @returns {external:Promise} - A promise fulfilled when the save operation is complete or failed.
     */

    saveChanges: {
        value: function () {
            var self = this,
                service,
                promise = this.nullPromise,

                service = this.childServices[0];
                if (service && typeof service.saveChanges === "function") {
                    return service.saveChanges();
                }
                else {
                    return promise;
                }
            }
    },



    /***************************************************************************
     * Offline
     */

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

    _isOfflineInitialized: {
        value: false
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
                this.isOffline = !navigator.onLine;
            }
            return this._isOffline;
        },
        set: function (offline) {
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

    _isOffline: {
        // `undefined` on startup, otherwise always `true` or `false`.
        value: false
    },

    _willBeOffline: {
        // `true` or `false` while _goOnline() is in progress, `null` just after
        // it's done, `undefined` otherwise.
        value: undefined
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

    __offlineOperationServices: {
        value: undefined
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
                method = type && this[this._getOfflineOperationMethodName(type)];
            return typeof(method) === "function" ? method.call(this, operation) :
                                                   this.performOfflineOperation(operation);
        }
    },

    _getOfflineOperationMethodName: {
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

    // To be overridden by subclasses as necessary
    onlinePrimaryKeyForOfflinePrimaryKey: {
        value: function(offlinePrimaryKey) {
            return this.offlineService ?
                this.offlineService.onlinePrimaryKeyForOfflinePrimaryKey(offlinePrimaryKey) : null;
        }
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



    /***************************************************************************
     * Access Control methods
     */

    /**
     * Answers wether logged-in application user can create a DataObject.
     *
     * Services overriding the (plural)
     * @method
     * @argument {ObjectDescriptor} dataObjectDescriptor
     * @returns {Promise} - A promise fulfilled with a boolean value.
     *
     */
    canUserCreateDataObject: {
        value: function(dataObjectDescriptor) {
            /*
                TODO: implement by leveraging Expression Based Access Control mapping/rules if available
            */
            return Promise.resolve(true);
        }
    },

    /**
     * Answers wether logged-in application user can edit/update? a DataObject.
     *
     * Services overriding the (plural)
     * @method
     * @argument {Object} dataObject
     * @returns {Promise} - A promise fulfilled with a boolean value.
     *
     */
    canUserEditDataObject: {
        value: function(dataObject) {
            /*
                	return this.canPerfomDataOperation(DataOperation.toUpdateDataObject(dataObject));
            */
           return Promise.resolve(true);
        }
    },
    canUserDeleteDataObject: {
        value: function(dataObject) {
            /*
                	return this.canPerfomDataOperation(DataOperation.toDeleteDataObject(dataObject));
            */
            return Promise.resolve(true);
        }
    },


    /***************************************************************************
     * Utilities
     */

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

    _nullPromise: {
        value: undefined
    },

    /**
     * @todo Document.
     */
    emptyArrayPromise: {
        get: function () {
            if (!exports.DataService._emptyArrayPromise) {
                exports.DataService._emptyArrayPromise = Promise.resolve([]);
            }
            return exports.DataService._emptyArrayPromise;
        }
    },

    _emptyArrayPromise: {
        value: undefined
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
    },

    /**
     * Returns by default an array the Locale.systemLocale
     * Subclasses have the opporyunity to oveorrides to get useLocale
     * from more specific data objects (DO)
     *
     * @property Array {Locale}
     */

    _userLocales: {
        value: undefined
   },

   userLocales: {
       get: function() {
           return this.isRootService
                ? this._userLocales || ((this._userLocales = [Locale.systemLocale]) && this._userLocales)
                : this.rootService.userLocales;
       },
       set: function(value) {
           if(value !== this._userLocales) {
               this._userLocales = value;
           }
       }
   },

   _userLocalesCriteria: {
       value: undefined
   },

   userLocalesCriteria: {
       get: function() {
        return this.isRootService
            ?  this._userLocalesCriteria || (this._userLocalesCriteria = this._createUserLocalesCriteria())
            : this.rootService.userLocalesCriteria;

       },
       set: function(value) {
           if(value !== this._userLocalesCriteria) {
               this._userLocalesCriteria = value;
           }
       }
   },

   _createUserLocalesCriteria: {
        value: function() {
            return new Criteria().initWithExpression("locales == $DataServiceUserLocales", {
                DataServiceUserLocales: this.userLocales
            });
        }
   },

    handleUserLocalesChange: {
        value: function (value, key, object) {
            this.userLocalesCriteria = this._createUserLocalesCriteria();
        }
    },

    handleUserLocalesRangeChange: {
        value: function (plus, minus){
            this.userLocalesCriteria = this._createUserLocalesCriteria();
        }
    },

    /**
     * Returns the locales for a specific object's locale. Default implementation
     * returns userLocales. Subclasses can override to offer a per-object
     * localization to be different than the session's one.
     * Subclasses have the opporyunity to oveorrides to get useLocale
     * from more specific data objects (DO)
     *
     * @returns Array{Locale}
     */

    localesForObject: {
        value: function(object) {
            return this.userLocales;
        }
    },

    /**
     * Returns a criteria the locales for a specific object. Default implementation
     * returns userLocales. Subclasses can override to offer a per-object
     * localization to be different than the session's one.
     * Subclasses have the opporyunity to oveorrides to get useLocale
     * from more specific data objects (DO)
     *
     * @returns Array{Locale}
     */

    localesCriteriaForObject: {
        value: function(object) {
            return this.userLocalesCriteria;
        }
    },

    /**
     * The DataTrigger class used by the montage data stack
     *
     * @property {DataTrigger}
     */

    DataTrigger: {
        value: DataTrigger
    },

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
    },


    /***************************************************************************
     * Debugging
     */

     debugProperties: {
         value: new Set()
     }

});



//WARNING Shouldn't be a problem, but avoiding a potential require-cycle for now:
DataStream.DataService = exports.DataService;
