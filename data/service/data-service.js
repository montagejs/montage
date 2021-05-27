var Montage = require("core/core").Montage,
    Target = require("core/target").Target,
    defaultEventManager = require("core/event/event-manager").defaultEventManager,
    ObjectDescriptor = require("core/meta/object-descriptor").ObjectDescriptor,
    DataService,
    AuthorizationManager = require("data/service/authorization-manager").defaultAuthorizationManager,
    AuthorizationPolicy = require("data/service/authorization-policy").AuthorizationPolicy,
    UserAuthenticationPolicy = require("data/service/user-authentication-policy").UserAuthenticationPolicy,
    IdentityManager = require("data/service/identity-manager").IdentityManager,
    DataObjectDescriptor = require("data/model/data-object-descriptor").DataObjectDescriptor,
    Criteria = require("core/criteria").Criteria,
    DataQuery = require("data/model/data-query").DataQuery,
    DataStream = require("data/service/data-stream").DataStream,
    DataTrigger = require("data/service/data-trigger").DataTrigger,
    Map = require("core/collections/map"),
    Promise = require("core/promise").Promise,
    Set = require("core/collections/set"),
    CountedSet = require("core/counted-set").CountedSet,
    WeakMap = require("core/collections/weak-map"),
    ObjectPool = require("core/object-pool").ObjectPool,
    DataEvent = require("data/model/data-event").DataEvent,
    PropertyDescriptor = require("core/meta/property-descriptor").PropertyDescriptor,
    DeleteRule = require("core/meta/property-descriptor").DeleteRule,
    deprecate = require("../../core/deprecate"),
    currentEnvironment = require("core/environment").currentEnvironment,
    PropertyChanges = require("../../core/collections/listen/property-changes"),
    DataOperation = require("data/service/data-operation").DataOperation,
    Locale = require("core/locale").Locale,
    ReadEvent = require("../model/read-event").ReadEvent,
    Transaction = require("../model/transaction").Transaction,
    TransactionEvent = require("../model/transaction-event").TransactionEvent;

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
DataService = exports.DataService = Target.specialize(/** @lends DataService.prototype */ {

    /***************************************************************************
     * Initializing
     */

    constructor: {
        value: function DataService() {

            this.defineBinding("mainService", {"<-": "mainService", source: defaultEventManager.application});

            // exports.DataService.mainService = exports.DataService.mainService || this;
            // if(this === DataService.mainService) {
            //     // IdentityManager.mainService = DataService.mainService;
            //     //this.addOwnPropertyChangeListener("userLocales", this);
            //     this.addRangeAtPathChangeListener("userLocales", this, "handleUserLocalesRangeChange");
            // }

            //Deprecated now
            //this._initializeAuthorization();

            if (this.providesAuthorization) {
                exports.DataService.authorizationManager.registerAuthorizationService(this);
            }

            if(this.providesIdentity === true) {
                IdentityManager.registerIdentityService(this);
            }

            this._initializeOffline();

            this._thenableByOperationId = new Map();
            //this._pendingOperationById = new Map();

            // this._serializer = new MontageSerializer().initWithRequire(require);
            // this._deserializer = new Deserializer();

            //this.addOwnPropertyChangeListener("mainService", this);
        }
    },

    /**
     * A reference to the application's main service.
     *
     * Applications typically have one and only one
     * [root service]{@link DataService#rootService} to which all data requests
     * are sent, and this is called the application's main service. That service
     * can in turn delegate handling of different types of data to child
     * services specialized by type.
     *
     * This property will be set automatically by bindings
     *
     * @type {DataService}
     */
        mainService: {
        get: function () {
            return this._mainService;
        },
        set: function (service) {
            if(service !== this._mainService) {
                this._mainService = service;

                if(this._mainService) {
                    this.addMainServiceEventListeners();
                }
            }
        }
    },

    addMainServiceEventListeners: {
        value: function() {

        }
    },

    //Works with this.addOwnPropertyChangeListener("mainService", this)
    handleMainServiceChange: {
        value: function (mainService) {
            //That only happens once
            if(mainService) {


                // mainService.addEventListener(DataOperation.Type.ReadOperation,this,false);
                // mainService.addEventListener(DataOperation.Type.UpdateOperation,this,false);
                // mainService.addEventListener(DataOperation.Type.CreateOperation,this,false);
                // mainService.addEventListener(DataOperation.Type.DeleteOperation,this,false);
                // mainService.addEventListener(DataOperation.Type.CreateTransactionOperation,this,false);
                // mainService.addEventListener(DataOperation.Type.BatchOperation,this,false);
                // mainService.addEventListener(DataOperation.Type.CommitTransactionOperation,this,false);
                // mainService.addEventListener(DataOperation.Type.RollbackTransactionOperation,this,false);


                mainService.addEventListener(DataOperation.Type.NoOp,this,false);
                mainService.addEventListener(DataOperation.Type.ReadFailedOperation,this,false);
                mainService.addEventListener(DataOperation.Type.ReadCompletedOperation,this,false);
                mainService.addEventListener(DataOperation.Type.UpdateFailedOperation,this,false);
                mainService.addEventListener(DataOperation.Type.UpdateCompletedOperation,this,false);
                mainService.addEventListener(DataOperation.Type.CreateFailedOperation,this,false);
                mainService.addEventListener(DataOperation.Type.CreateCompletedOperation,this,false);
                mainService.addEventListener(DataOperation.Type.DeleteFailedOperation,this,false);
                mainService.addEventListener(DataOperation.Type.DeleteCompletedOperation,this,false);
                mainService.addEventListener(DataOperation.Type.CreateTransactionFailedOperation,this,false);
                mainService.addEventListener(DataOperation.Type.CreateTransactionCompletedOperation,this,false);
                // mainService.addEventListener(DataOperation.Type.BatchCompletedOperation,this,false);
                // mainService.addEventListener(DataOperation.Type.BatchFailedOperation,this,false);
                // mainService.addEventListener(DataOperation.Type.TransactionUpdatedOperation,this,false);
                // mainService.addEventListener(DataOperation.Type.CommitTransactionFailedOperation,this,false);
                // mainService.addEventListener(DataOperation.Type.CommitTransactionCompletedOperation,this,false);
                // mainService.addEventListener(DataOperation.Type.RollbackTransactionFailedOperation,this,false);
                // mainService.addEventListener(DataOperation.Type.RollbackTransactionCompletedOperation,this,false);
            }
        }
    },

    application: {
        get: function() {
            return defaultEventManager.application;
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

            value = deserializer.getProperty("identifier");
            if (value) {
                this._identifier = value;
            }

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
                var childServiceTypes = this._childServiceTypes;
                childServiceTypes.push.apply(childServiceTypes, value);
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

            value = deserializer.getProperty("performsAccessControl");
            if (value) {
                this.performsAccessControl = value;
            }

            value = deserializer.getProperty("authorizedIdenitiesNamedCriteria");
            if (value) {
                this.authorizedIdenitiesNamedCriteria = value;
            }

            value = deserializer.getProperty("accessPolicies");
            if (value) {
                /*
                    accessPolicies are cumulative, but unfortunately we're missing an operator to add (nor remove) to a property that is an array with frb. We only have a replace

                    TODO if we need AccessPolicy to have access to it's data service, we need to introduce a new addAccessPolicy() where we'll be able to add a policy.service = this.
                */

               this.accessPolicies.push.apply(this.accessPolicies, value);
            }

            value = deserializer.getProperty("shouldAuthenticateReadOperation");
            if (value) {
                this.shouldAuthenticateReadOperation = value;
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

    currentEnvironment: {
        value: currentEnvironment
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

    /**
     * A property that identifies the root DataService, from the outside.
     * set by application, on both client and server side.
     *
     * It should be the same as rootService, which can only be known really when all DataServices
     * and rawDataServices have been loaded, and is used from the perspectibe of child dataServices
     * within their trees.
     *
     * @type {boolean}
     */

    _isMainService: {
        value: false
    },
    isMainService: {
        get: function() {
            return this._isMainService;
        },
        set: function(value) {

            if(value !== this._isMainService) {
                this._isMainService = value;
                if(value) {
                    this.addRangeAtPathChangeListener("userLocales", this, "handleUserLocalesRangeChange");

                    this.addEventListener(DataOperation.Type.NoOp,this,false);
                    this.addEventListener(DataOperation.Type.ReadFailedOperation,this,false);
                    this.addEventListener(DataOperation.Type.ReadCompletedOperation,this,false);
                    this.addEventListener(DataOperation.Type.UpdateFailedOperation,this,false);
                    this.addEventListener(DataOperation.Type.UpdateCompletedOperation,this,false);
                    this.addEventListener(DataOperation.Type.CreateFailedOperation,this,false);
                    this.addEventListener(DataOperation.Type.CreateCompletedOperation,this,false);
                    this.addEventListener(DataOperation.Type.DeleteFailedOperation,this,false);
                    this.addEventListener(DataOperation.Type.DeleteCompletedOperation,this,false);
                    this.addEventListener(DataOperation.Type.CreateTransactionFailedOperation,this,false);
                    this.addEventListener(DataOperation.Type.CreateTransactionCompletedOperation,this,false);
                    // this.addEventListener(DataOperation.Type.BatchCompletedOperation,this,false);
                    // this.addEventListener(DataOperation.Type.BatchFailedOperation,this,false);
                    // this.addEventListener(DataOperation.Type.TransactionUpdatedOperation,this,false);
                    // this.addEventListener(DataOperation.Type.CommitTransactionFailedOperation,this,false);
                    // this.addEventListener(DataOperation.Type.CommitTransactionCompletedOperation,this,false);
                    // this.addEventListener(DataOperation.Type.RollbackTransactionFailedOperation,this,false);
                    // this.addEventListener(DataOperation.Type.RollbackTransactionCompletedOperation,this,false);



                } else {
                    this.removeRangeAtPathChangeListener("userLocales", this, "handleUserLocalesRangeChange");
                }

            }

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
                this.supportsDataOperation = this.supportsDataOperation && child.supportsDataOperation;
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
            /*
                FIXME
                we're "lucky" here as when this is called, the current DataService hasn't registered yet the maappings, so we end up creating triggers for all property descriptors.
            */
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

            /*
                OPTIMIZE ME: We need to be smarter and only do that for the highest levels as it will be inherited
            */
           Object.defineProperty(prototype, "propertyChanges_prototype_addOwnPropertyChangeListener", { value: this.propertyChanges_prototype_addOwnPropertyChangeListener });
           Object.defineProperty(prototype, "addOwnPropertyChangeListener", { value: this._dataObject_addOwnPropertyChangeListener });

           Object.defineProperty(prototype, "propertyChanges_prototype_removeOwnPropertyChangeListener", { value: this.propertyChanges_prototype_removeOwnPropertyChangeListener });
           Object.defineProperty(prototype, "removeOwnPropertyChangeListener", { value: this._dataObject_removeOwnPropertyChangeListener });



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

    handlesType: {
        value: function(type) {
            return (this.rootService._childServicesByType.get(type).indexOf(this) !== -1);
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
     *
     * Authorization
     *
     ***************************************************************************/

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

    providesIdentity: {
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

    identity: {
        value: undefined
    },

    /**
     * a promise to the user identity for the data service. This is necessary to buffer
     * fetch/data operations that can't be executed until a valid user identity is known.
     *
     * @type {Object}
     */

    identityPromise: {
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
    identityServices: {
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

             var objectDescriptor = this._objectDescriptorForObjectCache.get(object);

             if(!objectDescriptor) {
                var types = this.types,
                    objectInfo = Montage.getInfoForObject(object),
                    moduleId = objectInfo.moduleId,
                    objectName = objectInfo.objectName,
                    module, exportName, i, n;

                objectDescriptor = this.objectDescriptorWithModuleId(moduleId);
                for (i = 0, n = types.length; i < n && !objectDescriptor; i += 1) {
                    module = types[i].module;
                    exportName = module && types[i].exportName;
                    if (module && moduleId === module.id && objectName === exportName) {
                        if(objectDescriptor !== types[i]) {
                            console.error("objectDescriptorWithModuleId cached an objectDescriptor and objectDescriptorForObject finds another");
                        }
                        objectDescriptor = types[i];
                    }
                }
                return objectDescriptor || this.parentService && this.parentService.objectDescriptorForObject(object);
             } else {
                 return objectDescriptor;
             }
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


    shouldListenForRemoteObjectPropertyChange: {
        value: function(dataObjecy, key, beforeChange) {
            return false;
        }
    },

    propertyChanges_prototype_addOwnPropertyChangeListener: {
        value: PropertyChanges.prototype.addOwnPropertyChangeListener
    },
    propertyChanges_prototype_removeOwnPropertyChangeListener: {
        value: PropertyChanges.prototype.removeOwnPropertyChangeListener
    },

    /*
        This is executed on DataObject instances, so this is an instance of a DataObject.
    */
    __dataObject_addOwnPropertyChangeListener: {
        value: undefined
    },

    _dataObject_addOwnPropertyChangeListener: {
        get: function() {

            if(!this.__dataObject_addOwnPropertyChangeListener) {
                var dataService = this;

                this.__dataObject_addOwnPropertyChangeListener = function (key, listener, beforeChange, trackRemoteChanges) {
                    if(trackRemoteChanges || dataService.shouldListenForRemoteObjectPropertyChange(this,key,beforeChange)) {
                    // if(dataService.shouldAddEventListenerForObjectRemotePropertyChange(this,key,beforeChange)) {
                        dataService.trackRemoteObjectPropertyChanges(this,key);
                    }
                    return this.propertyChanges_prototype_addOwnPropertyChangeListener(key, listener, beforeChange);
                };
            }
            return this.__dataObject_addOwnPropertyChangeListener;
        }
    },

    __dataObject_removeOwnPropertyChangeListener: {
        value: undefined
    },
    _dataObject_removeOwnPropertyChangeListener: {
        get: function() {

            if(!this.__dataObject_removeOwnPropertyChangeListener) {
                var dataService = this;

                this.__dataObject_removeOwnPropertyChangeListener = function (key, listener, beforeChange, trackRemoteChanges) {

                    if(trackRemoteChanges || dataService.shouldListenForRemoteObjectPropertyChange(this,key,beforeChange)) {
                        // if(dataService.shouldAddEventListenerForObjectRemotePropertyChange(this,key,beforeChange)) {
                            dataService.removeEventListener("");
                    }

                    return this.propertyChanges_prototype_removeOwnPropertyChangeListener(key, listener, beforeChange);
                };
            }
            return this.__dataObject_removeOwnPropertyChangeListener;
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


                COUNTER: If an object created already has the info to make it's primary key, we should go forward.

                The real test could be that if it's mapped as a relationship, then we might be able to get something.

                - If a property is a relationship and it wasn't set on the object,
                as an object, we can't get it either.
            */
            // if(this.isObjectCreated(object)) {
            //     //Not much we can do there anyway, punt
            //     return Promise.resolve(true);
            // } else
            if (this.isRootService) {
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

    /**
     * perform getObjectProperties for each object with propertyNames
     * @method
     * @argument {object[]} objects       - The objects whose property values are
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

    getObjectsProperties: {
        value: function (objects, propertyNames) {
            var promises = [], i, countI;

            if(!objects || objects.length === 0) {
                return Promise.resolve(null);
            }
            for(i=0, countI = objects.length; (i<countI); i++) {
                promises.push(this.getObjectProperties(objects[i],propertyNames));
            }

            return Promise.all(promises);
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
     * @argument {object} object            - The object whose property value is being
     *                                      requested.
     *
     * @argument {string} name              - The name of the single property whose value
     *                                      is being requested.
     *
     * @argument {array} readExpressions    - A list of object[propertyName] properties to get
     *                                      at the same time we're getting object[propertyName].
     * @returns {external:Promise} - A promise fulfilled when the requested
     * value has been received and set on the specified property of the passed
     * in object.
     */
    fetchObjectProperty: {
        value: function (object, propertyName, isObjectCreated, readExpressions) {
            var isHandler = this.parentService && this.parentService._getChildServiceForObject(object) === this,
                useDelegate = isHandler && typeof this.fetchRawObjectProperty === "function",
                delegateFunction = !useDelegate && isHandler && this._delegateFunctionForPropertyName(propertyName),
                propertyDescriptor = !useDelegate && !delegateFunction && isHandler && this._propertyDescriptorForObjectAndName(object, propertyName),
                childService = !isHandler && this._getChildServiceForObject(object),
                isObjectCreated = this.isObjectCreated(object),
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
                                    ?   this._fetchObjectPropertyWithPropertyDescriptor(object, propertyName, propertyDescriptor, isObjectCreated)
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
        value: function (object, propertyName, propertyDescriptor, isObjectCreated) {
            var self = this,
            objectDescriptor = this.objectDescriptorForObject(object),
            mapping = objectDescriptor && this.mappingForType(objectDescriptor),
                data = {},
                result;


            if (mapping) {

                /*
                    To open the ability to get derived values from non-saved objects, some failsafes blocking a non-saved created object to get any kind of property resolved/fetched were removed. So we need to be smarter here and do the same.

                    If an object is created (which we don't know here, but we can check), fetching a property relies on the primary key and that the primarty key is one property only (like a uuid) and there's already a value (client-side generated like uuid can be), than it can't be fetched and we shoould resolve to null.

                    Another approch would be to map all dependencies and let the rule's converter assess if it has everytrhing it needs to do the job, but at that level, the converter doesn't know the object, but it has the primaryKey in the criteria's syntax and the value in the associated parameters, so it could find out if there's a corresponding object that is created. It might be needed, let's see if this first heuristic works first.
                */
                if(isObjectCreated) {
                    var rule = mapping.objectMappingRules.get(propertyName),
                        rawDataPrimaryKeys = mapping.rawDataPrimaryKeys,
                        requiredRawProperties = rule && rule.requirements;

                    /*
                        rawDataPrimaryKeys.length === 1 is to assess if it's a traditional id with no intrinsic meaning
                    */
                    if(rawDataPrimaryKeys.length === 1 && requiredRawProperties.indexOf(rawDataPrimaryKeys[0] !== -1)){
                        /*
                            Fetching depends on something that doesn't exists on the other side, we bail:
                        */
                       return this.nullPromise;
                    }
                }

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
                            result = this.nullPromise;
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
                trigger._setValue(object,propertyValue, false);
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

                var propagationPromise = dataEvent.propagationPromise;
                if(Promise.is(propagationPromise)) {
                    return propagationPromise.then(function() {
                        eventPool.checkin(dataEvent);
                    });
                } else {
                    eventPool.checkin(dataEvent);
                }

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
                this.registerCreatedDataObject(object);

                this.dispatchDataEventTypeForObject(DataEvent.create, object);

                return object;
            } else {
                this.rootService.createDataObject(type);
            }
        }
    },

    /**
     * A DataObject will always be decribed by only one ObjectDescriptor, even when we support more "main" dataServices.
     * So caching on prototype so it serves everyone.
     *
     * @private
     * @method
     * @argument {DataObjectDescriptor} type - The type of object to create.
     * @returns {Object}                     - The created object.
     */

    _objectDescriptorForObjectCache: {
        value: new WeakMap()
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
                    this._objectDescriptorForObjectCache.set(object,objectDescriptor);
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
     *
     * Data Object Changes
     *
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
    _objectDescriptorsWithChangedObjects: {
        value: undefined
    },
    objectDescriptorsWithChangedObjects: {
        get: function () {
            return this._objectDescriptorsWithChangedObjects || (this._objectDescriptorsWithChangedObjects = new CountedSet());
        }
    },
    createdDataObjects: {
        get: function () {
            if (this.isRootService) {
                if (!this._createdDataObjects) {
                    this._createdDataObjects = new Map();
                }
                return this._createdDataObjects;
            }
            else {
                return this.rootService.createdDataObjects;
            }
        }
    },

    registerCreatedDataObject: {
        value: function(dataObject) {
            var objectDescriptor = this.objectDescriptorForObject(dataObject),
                createdDataObjects = this.createdDataObjects,
                value = createdDataObjects.get(objectDescriptor);
            if(!value) {
                createdDataObjects.set(objectDescriptor, (value = new Set()));
            }
            value.add(dataObject);
            this.objectDescriptorsWithChangedObjects.add(objectDescriptor);
        }
    },

    unregisterCreatedDataObject: {
        value: function(dataObject) {
            var objectDescriptor = this.objectDescriptorForObject(dataObject),
                value = this.createdDataObjects.get(objectDescriptor);
            if(value) {
                value.delete(dataObject);
                this.objectDescriptorsWithChangedObjects.delete(objectDescriptor);
            }
        }
    },


    isObjectCreated: {
        value: function(object) {
            var objectDescriptor = this.objectDescriptorForObject(object),
                createdDataObjects = this.createdDataObjects.get(objectDescriptor),
                isObjectCreated = createdDataObjects && createdDataObjects.has(object);

            if(!isObjectCreated) {
                var service = this._getChildServiceForObject(object);
                if(service) {
                    isObjectCreated = (service.isObjectCreated(object) || !service.hasSnapshotForObject(object));
                } else {
                    isObjectCreated = false;
                }
            }

            if(!isObjectCreated) {
                var pendingTransactions = this._pendingTransactions;

                if(pendingTransactions && pendingTransactions.length) {
                    for(var i=0, countI = pendingTransactions.length; (i < countI); i++ ) {
                        if(pendingTransactions[i].createdDataObjects.has(object)) {
                            return true;
                        }
                    }
                    return false;
                } else {
                    return false;
                }
            }

            return isObjectCreated;
        }
    },

    /**
     * A set of the data objects modified by the user after they were fetched.
     *     *
     * @type {Set.<Object>}
     */
    changedDataObjects: {
        get: function () {
            if (this.isRootService) {
                if (!this._changedDataObjects) {
                    this._changedDataObjects = new Map();
                }
                return this._changedDataObjects;
            }
            else {
                return this.rootService.changedDataObjects;
            }
        }
    },
    registerChangedDataObject: {
        value: function(dataObject) {
            var objectDescriptor = this.objectDescriptorForObject(dataObject),
                changedDataObjects = this.changedDataObjects,
                value = changedDataObjects.get(objectDescriptor);
            if(!value) {
                changedDataObjects.set(objectDescriptor, (value = new Set()));
            }
            value.add(dataObject);
            this.objectDescriptorsWithChangedObjects.add(objectDescriptor);
        }
    },

    unregisterChangedDataObject: {
        value: function(dataObject) {
            var objectDescriptor = this.objectDescriptorForObject(dataObject),
                value = this.changedDataObjects.get(objectDescriptor);

            if(value) {
                value.delete(dataObject);
                this.objectDescriptorsWithChangedObjects.delete(objectDescriptor);
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
                    });
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
                            inverseValue.push(dataObject);
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
                            inverseValue.delete(dataObject);
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
                    });
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
                    });
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
                //WARNING TEST: THIS WAS REDEFINING THE PASSED ARGUMENT
                //inversePropertyDescriptor,
                self = this;


            /*
                Benoit refactoring saveChanges: shouldn't we be able to know that if there are no changesForDataObject, as we create on, it would ve the only time we'd have to call:

                                this.registerChangedDataObject(dataObject);

                ?
                #TODO TEST!!
            */


            if(!isCreatedObject) {
                //this.changedDataObjects.add(dataObject);
                this.registerChangedDataObject(dataObject);
            }

            if(!changesForDataObject) {
                changesForDataObject = new Map();
                this.dataObjectChanges.set(dataObject,changesForDataObject);
            }


            /*

                TODO / WARNING / FIX: If an object's property that has not been fetched, mapped and assigned is accessed, it will be undefined and will trigger a fetch to get it. If the business logic then assumes it's not there and set a value synchronously, when the fetch comes back, we will have a value and the set will look like an update.

                This situation is poorly handled and should be made more robust, here and in DataTrigger.

                Should we look into the snapshot to help? Then map what's there first, and then compare before acting?

                var dataObjectSnapshot = this._getChildServiceForObject(dataObject)._snapshot.get(dataObject.dataIdentifier);

                Just because it's async, doesn't mean we couldn't get it right, since we can act after the sync code action and reconciliate the 2 sides.

            */




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
                            /*
                                FIXME: we ended up here with manyChanges being an array, containing the same value as addedValues. And we end up setting addedValues property on that array. So let's correct it. We might not want to track toMany as set at all, and just stick to added /remove. This might happens on remove as well, we need to check further.
                            */
                           if(Array.isArray(manyChanges) && manyChanges.equals(addedValues)) {
                                manyChanges = {};
                                changesForDataObject.set(key, manyChanges);
                           }

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
                this._deletedDataObjects = this._deletedDataObjects || new Map();
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

    registerDeletedDataObject: {
        value: function(dataObject) {
            var objectDescriptor = this.objectDescriptorForObject(dataObject),
                deletedDataObjects = this.deletedDataObjects,
                value = deletedDataObjects.get(objectDescriptor);
            if(!value) {
                deletedDataObjects.set(objectDescriptor, (value = new Set()));
            }
            value.add(dataObject);
            this.objectDescriptorsWithChangedObjects.add(objectDescriptor);
        }
    },

    unregisterDeletedDataObject: {
        value: function(dataObject) {
            var objectDescriptor = this.objectDescriptorForObject(dataObject),
                value = this.deletedDataObjects.get(objectDescriptor);
            if(value) {
                value.delete(dataObject);
                this.objectDescriptorsWithChangedObjects.delete(objectDescriptor);
            }
        }
    },


    // handleBatchCompletedOperation: {
    //     value: function (operation) {
    //         this.handleOperationCompleted(operation);
    //     }
    // },
    // handleBatchFailedOperation: {
    //     value: function (operation) {
    //         this.handleOperationFailed(operation);
    //     }
    // },
    // handleCommitTransactionCompletedOperation: {
    //     value: function (operation) {
    //         this.handleOperationCompleted(operation);
    //     }
    // },
    // handleCommitTransactionFailedOperation: {
    //     value: function (operation) {
    //         this.handleOperationFailed(operation);
    //     }
    // },
    // handleRollbackTransactionCompletedOperation: {
    //     value: function (operation) {
    //         this.handleOperationCompleted(operation);
    //     }
    // },
    // handleRollbackTransactionFailedOperation: {
    //     value: function (operation) {
    //         this.handleOperationFailed(operation);
    //     }
    // },


    /**
     * evaluates the validity of objects and store results in invaliditySates
     * @param {Array} objects objects whose validity needs to be evaluated
     * @param {Map} invaliditySates a Map where the key is an object and the value a validity state offering invalidity details.
     * @returns {Promise} Promise resolving to invaliditySates when all is complete.
     */

     _evaluateObjectValidity: {
        value: function (object, invalidityStates) {
            var objectDescriptorForObject = this.objectDescriptorForObject(object);

            return objectDescriptorForObject.evaluateObjectValidity(object)
            .then(function(objectInvalidityStates) {
                if(objectInvalidityStates.size != 0) {
                    invalidityStates.set(object,objectInvalidityStates);
                }
                return objectInvalidityStates;
            }, function(error) {
                console.error(error);
                reject(error);
            });
        }
    },

    _evaluateObjectsValidity: {
        value: function (objects, invalidityStates, validityEvaluationPromises) {
            //Bones only for now
            //It's a bit weird, createdDataObjects is a set, but changedDataObjects is a Map, but changedDataObjects has entries
            //for createdObjects as well, so we might be able to simlify to just dealing with a Map, or send the Map keys?
            var mapIterator = objects.values(),
                iObjectSet,
                setIterator,
                iObject;

            while((iObjectSet = mapIterator.next().value)) {
                setIterator = iObjectSet.values();
                while((iObject = setIterator.next().value)) {
                    validityEvaluationPromises.push(this._evaluateObjectValidity(iObject,invalidityStates));
                }
            }

            // return promises.length > 1 ? Promise.all(promises) : promises[0];
        }
    },

    _dispatchObjectsInvalidity: {
        value: function(dataObjectInvalidities) {
            var invalidObjectIterator = dataObjectInvalidities.keys(),
                anInvalidObject, anInvalidityState;

            while((anInvalidObject = invalidObjectIterator.next().value)) {
                this.dispatchDataEventTypeForObject(DataEvent.invalid, object, dataObjectInvalidities.get(anInvalidObject));
            }
        }
    },


    _pendingTransactions: {
        value: undefined
    },
    addPendingTransaction: {
        value: function(aCreateTransactionOperation) {
            (this._pendingTransactions || (this._pendingTransactions = [])).push(aCreateTransactionOperation);
        }
    },
    deletePendingTransaction: {
        value: function(aCreateTransactionOperation) {
            if(this._pendingTransactions) {
                this._pendingTransactions.delete(aCreateTransactionOperation);
            }
        }
    },

    _dispatchTransactionEventTypeWithObjects: {
        value: function(transaction, eventType, objects) {
            var criteriaIterator = objects.keys(),
            iteration,
            iObjectDescriptor,
            iObjects,
            iTransactionEvent,
            propagationPromises,
            propagationPromise;


            /*
                dispatch transactionCreate()
            */
            while(!(iteration = criteriaIterator.next()).done) {
                iObjectDescriptor = iteration.value;
                iObjects = objects.get(iObjectDescriptor);

                iTransactionEvent = TransactionEvent.checkout();

                iTransactionEvent.type = eventType;
                iTransactionEvent.transaction = transaction;
                iTransactionEvent.data = iObjects;

                iObjectDescriptor.dispatchEvent(iTransactionEvent);
                propagationPromise = dataEvent.propagationPromise;
                if(Promise.is(propagationPromise)) {
                    (propagationPromises || (propagationPromises = [])).push(propagationPromise);
                    propagationPromise.then(function() {
                        eventPool.checkin(dataEvent);
                    });
                } else {
                    eventPool.checkin(dataEvent);
                }
            }

            return propagationPromises ? Promise.all(propagationPromises) : null;

        }
    },



    /**
     *
     * Prepare.
     *
     */

    handleTransactionCreateStart: {
        value: function(transactionPrepareStartEvent) {
            var preparingParticipant = transactionPrepareStartEvent.target,
                handledObjectDescriptors = transactionPrepareStartEvent.data;

            /*
                TODO Future: use handledObjectDescriptors:
                objectDescriptor -> Map {
                    "createdDatabjects" -> Set,
                    "changedDatabjects" -> Set,
                    "deletedDatabjects" -> Set
                }

                along with handleTransationPrepareProgress() to track progress
            */

                //transactionPrepareStartEvent.transaction.createCompletionPromiseForParticipant(preparingParticipant);

            /*
                listen for both complete and fail
            */
            preparingParticipant.addEventListener(TransactionEvent.transationPrepareProgress, this, false);
            preparingParticipant.addEventListener(TransactionEvent.transationPrepareComplete, this, false);
        }
    },


    /**
     *
     * Prepare.
     *
     */

    handleTransactionPrepareStart: {
        value: function(transactionPrepareStartEvent) {
            var preparingParticipant = transactionPrepareStartEvent.target,
                handledObjectDescriptors = transactionPrepareStartEvent.data;

            /*
                TODO Future: use handledObjectDescriptors:
                objectDescriptor -> Map {
                    "createdDatabjects" -> Set,
                    "changedDatabjects" -> Set,
                    "deletedDatabjects" -> Set
                }

                along with handleTransationPrepareProgress() to track progress
            */

                //transactionPrepareStartEvent.transaction.createCompletionPromiseForParticipant(preparingParticipant);

            /*
                listen for both complete and fail
            */
            preparingParticipant.addEventListener(TransactionEvent.transationPrepareProgress, this, false);
            preparingParticipant.addEventListener(TransactionEvent.transationPrepareComplete, this, false);
        }
    },

    handleTransactionPrepareProgress: {
        value: function(transactionPrepareProgressEvent) {
            var preparingParticipant = transactionPrepareProgressEvent.target;
            //boilerplate for now
        }
    },

    handleTransactionPrepareComplete: {
        value: function(transactionPrepareCompleteEvent) {
            var participant = transactionPrepareCompleteEvent.target,
                transaction = transactionPrepareCompleteEvent.transaction;

            //resolve the matching completionPromise with the participant.
            //transaction.resolveCompletionPromiseForParticipant(participant);
        }
    },

    handleTransactionPrepareFail: {
        value: function(transactionPrepareFailEvent) {
            var participant = transactionPrepareFailEvent.target,
                transaction = transactionPrepareFailEvent.transaction,
                error = transactionPrepareFailEvent.data;

            //reject the matching completionPromise with the participant.
            // transaction.rejectCompletionPromiseForParticipantWithError(participant, error);
        }
    },





    /**
     *
     * Cancel/abort
     *
     */

    handleTransactionRollbackStart: {
        value: function(transactionRollbackStartEvent) {
            var participant = transactionRollbackStartEvent.target,
                handledObjectDescriptors = participant.data;

            /*
                TODO Future: use handledObjectDescriptors:
                objectDescriptor -> Map {
                    "createdDatabjects" -> Set,
                    "changedDatabjects" -> Set,
                    "deletedDatabjects" -> Set
                }

                along with handleTransationPrepareProgress() to track progress
            */
            //transactionRollbackStartEvent.transaction.createCompletionPromiseForParticipant(participant);

            /*
                listen for both complete and fail
            */
            participant.addEventListener(TransactionEvent.transationCancelProgress, this, false);
            participant.addEventListener(TransactionEvent.transationCancelComplete, this, false);
        }
    },

    handleTransactionRollbackProgress: {
        value: function(transactionRollbackProgressEvent) {
            var participant = transactionRollbackProgressEvent.target;
            //boilerplate for now
        }
    },

    handleTransactionRollbackComplete: {
        value: function(transactionRollbackCompleteEvent) {
            var participant = transactionRollbackCompleteEvent.target,
                transaction = transactionRollbackCompleteEvent.transaction;

            //resolve the matching completionPromise with the participant.
            //transaction.resolveCompletionPromiseForParticipant(participant);
        }
    },

    handleTransactionRollbackFail: {
        value: function(transactionRollbackFailEvent) {
            var participant = transactionRollbackFailEvent.target,
                transaction = transactionRollbackFailEvent.transaction,
                error = transactionRollbackFailEvent.data;

            //reject the matching completionPromise with the participant.
            //transaction.rejectCompletionPromiseForParticipantWithError(participant, error);
        }
    },





    /**
     *
     * Perform/commit.
     *
     */

     handleTransactionCommitStart: {
        value: function(transactionCommitStartEvent) {
            var participant = transactionCommitStartEvent.target,
                handledObjectDescriptors = participant.data;

            /*
                TODO Future: use handledObjectDescriptors:
                objectDescriptor -> Map {
                    "createdDatabjects" -> Set,
                    "changedDatabjects" -> Set,
                    "deletedDatabjects" -> Set
                }

                along with handleTransationPrepareProgress() to track progress
            */
            //transactionCommitStartEvent.transaction.createCompletionPromiseForParticipant(participant);

            /*
                listen for both complete and fail
            */
            participant.addEventListener(TransactionEvent.transationPerformProgress, this, false);
            participant.addEventListener(TransactionEvent.transationPerformComplete, this, false);
        }
    },

    handleTransactionCommitProgress: {
        value: function(transactionCommitProgressEvent) {
            var participant = transactionCommitProgressEvent.target;
            //boilerplate for now
        }
    },

    handleTransactionCommitComplete: {
        value: function(transactionCommitCompleteEvent) {
            var participant = transactionCommitCompleteEvent.target,
                transaction = transactionCommitCompleteEvent.transaction;

            //resolve the matching completionPromise with the participant.
            //transaction.resolveCompletionPromiseForParticipant(participant);
        }
    },

    handleTransactionCommitFail: {
        value: function(transactionCommitFailEvent) {
            var participant = transactionCommitFailEvent.target,
                transaction = transactionCommitFailEvent.transaction,
                error = transactionCommitFailEvent.data;

            //reject the matching completionPromise with the participant.
            //transaction.rejectCompletionPromiseForParticipantWithError(participant, error);
        }
    },

    /*
        When it gets time to add/handle timeouts:

        https://advancedweb.hu/how-to-add-timeout-to-a-promise-in-javascript/

    */

    clearChanges: {
        value: function() {
            this.createdDataObjects.clear();
            this.changedDataObjects.clear();
            this.deletedDataObjects.clear();
            this.dataObjectChanges.clear();
            this.objectDescriptorsWithChangedObjects.clear();
        }
    },

    saveChanges: {
        value: function () {
            //If nothing to do, we bail out as early as possible.
            if(this.createdDataObjects.size === 0 && this.changedDataObjects.size === 0 && this.deletedDataObjects.size === 0) {
                var noOpOperation = new DataOperation();
                noOpOperation.type = DataOperation.Type.NoOp;
                return Promise.resolve(noOpOperation);
            }

            var transaction = new Transaction(),
                self = this,
                //Ideally, this should be saved in IndexedDB so if something happen
                //we can at least try to recover.
                createdDataObjects = transaction.createdDataObjects = new Map(this.createdDataObjects),//Map
                changedDataObjects = transaction.changedDataObjects = new Map(this.changedDataObjects),//Map
                deletedDataObjects = transaction.deletedDataObjects = new Map(this.deletedDataObjects),//Map
                dataObjectChanges = transaction.dataObjectChanges = new Map(this.dataObjectChanges),//Map
                objectDescriptorsWithChangedObjects = transaction.objectDescriptors = new Set(this.objectDescriptorsWithChangedObjects);



            this.addPendingTransaction(transaction);

            //We've made copies, so we clear right away to make room for a new cycle:
            this.clearChanges();
            // this.createdDataObjects.clear();
            // this.changedDataObjects.clear();
            // this.deletedDataObjects.clear();
            // this.dataObjectChanges.clear();
            // this.objectDescriptorsWithChangedObjects.clear();

            return new Promise(function(resolve, reject) {
                try {
                    var deletedDataObjectsIterator,
                        operation,
                        createTransaction,
                        createTransactionPromise,
                        transactionObjectDescriptors = transaction.objectDescriptors,
                        transactionObjectDescriptorArray,
                        batchOperation,
                        transactionOperations,
                        dataOperationsByObject,
                        changedDataObjectOperations = new Map(),
                        deletedDataObjectOperations = new Map(),
                        createOperationType = DataOperation.Type.CreateOperation,
                        updateOperationType = DataOperation.Type.UpdateOperation,
                        deleteOperationType = DataOperation.Type.DeleteOperation,
                        i, countI, iObject, iOperation, iOperationPromise,
                        createdDataObjectInvalidity = new Map(),
                        changedDataObjectInvalidity = new Map(),
                        deletedDataObjectInvalidity = new Map(),
                        validityEvaluationPromises = [], validityEvaluationPromise,
                        commitTransactionOperation,
                        commitTransactionOperationPromise,
                        rollbackTransactionOperation,
                        rollbackTransactionOperationPromise,
                        createTransactionCompletedId,
                        transactionCreate,
                        transactionPrepareEvent,
                        transactionCommitEvent;

                    //We first remove from create and update objects that are also deleted:
                    deletedDataObjectsIterator = deletedDataObjects.values();
                    while((iObject = deletedDataObjectsIterator.next().value)) {
                        createdDataObjects.delete(iObject);
                        changedDataObjects.delete(iObject);
                    }


                    //If nothing to do, we bail out
                    if(createdDataObjects.size === 0 && changedDataObjects.size === 0 && deletedDataObjects.size === 0) {
                        operation = new DataOperation();
                        operation.type = DataOperation.Type.NoOp;
                        resolve(operation);
                    }



                        /*
                            TODO: turn the validation phase into events:

                            Right now validation is one “action” on a type of object, but would it be desirable/necessary to validate for a create vs validate for an update vs validate for a delete, so basically the type of operation would influence there kind of validation to perform. Even if the sum would be the same, if there was one validation step where you’d handle all cases because you wouldn’t know, maybe knowing the type of operation could either be an optimization as less logic might need to be run knowing the context or, it might be necessary? for example a cascade delete, is something you only want to run when you know an object is being deleted.

                            What was done for access control points to this, needing to have different rules/logic depending on multiple factors and the type of operation being one.

                            the immediate implication here would be to have multiple types of transactionValidate TransactionEvent vs one, like ?
                            - transactionValidateCreate
                            - transactionValidateUpdate
                            - transactionValidateDelete
                        */

                        //we assess createdDataObjects's validity:
                        self._evaluateObjectsValidity(createdDataObjects,createdDataObjectInvalidity, validityEvaluationPromises);

                        //then changedDataObjects.
                        self._evaluateObjectsValidity(changedDataObjects,changedDataObjectInvalidity, validityEvaluationPromises);

                        //Finally deletedDataObjects: it's possible that some validation logic prevent an object to be deleted, like
                        //a deny for a relationship that needs to be cleared by a user before it could be deleted.
                        self._evaluateObjectsValidity(deletedDataObjects,deletedDataObjectInvalidity, validityEvaluationPromises);

                        //TODO while we need to wait for both promises to resolve before we can check
                        //that there are no validation issues and can proceed to save changes
                        //it might be better to dispatch events as we go within each promise
                        //so we don't block the main thread all at once?
                        //Waiting has the benefit to enable a 1-shot rendering.
                    Promise.all(validityEvaluationPromises)
                    .then(function() {
                        // self._dispatchObjectsInvalidity(createdDataObjectInvalidity);
                        self._dispatchObjectsInvalidity(changedDataObjectInvalidity);
                        if(changedDataObjectInvalidity.size > 0) {
                            //Do we really need the DataService itself to dispatch another event with all invalid data together at once?
                            //self.mainService.dispatchDataEventTypeForObject(DataEvent.invalid, self, detail);

                            var validatefailedOperation = new DataOperation();
                            validatefailedOperation.type = DataOperation.Type.ValidateFailedOperation;
                            //At this point, it's the dataService
                            validatefailedOperation.target = self.mainService;
                            validatefailedOperation.data = changedDataObjectInvalidity;
                            //Exit, can't move on
                            resolve(validatefailedOperation);
                        }
                        else {
                            return transactionObjectDescriptors;
                        }
                    }, function(error) {
                        reject(error);
                    })
                    .then(function(_transactionObjectDescriptors) {
                        var operationCount = createdDataObjects.size + changedDataObjects.size + deletedDataObjects.size,
                            currentPropagationPromise,
                            operationIndex = 0,
                            iterator,
                            propagationPromises = [];

                        /*
                            Now that we passed validation, we're going to start the transaction
                        */

                        /*
                            Make sure we listen on ourselve (as events from RawDataServices will bubble to main)
                            for "transactionPrepareStart"
                        */
                        //addEventListener(TransactionEvent.transactionCreateStart, self, false);


                        transactionCreateEvent = TransactionEvent.checkout();

                        transactionCreateEvent.type = TransactionEvent.transactionCreate;
                        transactionCreateEvent.transaction = transaction;
                        self.dispatchEvent(transactionCreateEvent);

                        return (transactionCreateEvent.propagationPromise || Promise.resolve());
                    })
                    .then(function() {
                        return transaction.completionPromise;
                    })
                    .then(function(){
                        /*
                            Make sure we listen on ourselve (as events from RawDataServices will bubble to main)
                            for "transactionPrepareStart"
                        */
                        self.addEventListener(TransactionEvent.transactionPrepareStart, self, false);


                        /*
                            Now dispatch transactionPrepare:

                            Listened to by RawDataServices to know if they should be involved in dealing with transaction.
                        */
                        transactionPrepareEvent = TransactionEvent.checkout();

                        transactionPrepareEvent.type = TransactionEvent.transactionPrepare;
                        transactionPrepareEvent.transaction = transaction;
                        self.dispatchEvent(transactionPrepareEvent);

                        return (transactionPrepareEvent.propagationPromise || Promise.resolve());
                    })
                    .then(function() {
                        /*
                            Return the event to the pool
                        */
                        TransactionEvent.checkin(transactionPrepareEvent);
                        return transaction.completionPromise;
                    })
                    .then(function() {

                        /*
                            Now all RawDataServices involved created the data operation they needed.

                            time to dispatch transactionCommit: Once that's done, we wait for completionPromise

                        */

                        /*
                            Make sure we listen on ourselve (as events from RawDataServices will bubble to main)
                            for "transactionPrepareStart"
                        */
                        self.addEventListener(TransactionEvent.transactionCommitStart, self, false);

                        transactionCommitEvent = TransactionEvent.checkout();

                        transactionCommitEvent.type = TransactionEvent.transactionCommit;
                        transactionCommitEvent.transaction = transaction;
                        self.dispatchEvent(transactionCommitEvent);

                        return transactionCommitEvent.propagationPromise
                            ? transactionCommitEvent.propagationPromise
                            : Promise.resolve(true);

                    })
                    .then(function(){

                        /*
                            Now transactionCommit has been dispatched to all listeners.

                            transaction.participantCompletionPromises contains the final list of promises for when listeners will be done preaparing for the transation.

                            We make a Promise.all() of it and wait to proceed or fail
                        */

                        /*
                            Return the event to the pool
                        */
                        TransactionEvent.checkin(transactionCommitEvent);

                        return transaction.completionPromise;

                    })
                    .then(function(){
                        /*
                            If we're here, the transaction succeeded, all listeners successfully completed their work.
                        */
                        // dataOperationsByObject = transaction.dataOperationsByObject;

                        // self.didCreateDataObjects(createdDataObjects, dataOperationsByObject);
                        // self.didUpdateDataObjects(changedDataObjects, dataOperationsByObject);
                        // self.didDeleteDataObjects(deletedDataObjects, dataOperationsByObject);

                        /*
                            We could also add an event to advertise teh result, but the transaction object already has everything.
                        */
                       resolve(transaction);

                    })
                    .catch(function(error) {
                        /*
                            TODO:...
                            At least one listener (typically a RawDataService) failed to execute transactionCommit/Commit, we have to return to a stable state.... if possible and finish the process.

                                                    /*
                            At least one listener (typically a RawDataService) failed to prepare, we have to abort and return to a stable state....

                            There was a problem executing transactionCreate, at least one RawDataService couldn't create a transaction. DB may not be reachable? Operation may have been refused for lack of authorization?

                            We still need to tell everyone it's off.

                        */


                        /*
                            If we're here, the transaction failed
                        */
                        return self._cancelTransaction(transaction, error, reject);
                    });
                }
                catch (error) {
                    self._cancelTransaction(transaction, error, reject);
                }
            });
        }
    },

    _cancelTransaction: {
        value: function(transaction, cancelError, rejectFunction) {

            this.addEventListener(TransactionEvent.transactionRollbackStart, this, false);

            transactionRollbackEvent = TransactionEvent.checkout();

            transactionRollbackEvent.type = TransactionEvent.transactionRollback;
            transactionRollbackEvent.transaction = transaction;
            this.dispatchEvent(transactionRollbackEvent);

            return (transactionRollbackEvent.propagationPromise || Promise.resolve())
            .then(function() {
                TransactionEvent.checkin(transactionRollbackEvent);
                return transaction.completionPromise;
            })
            .then(function() {
                rejectFunction(cancelError)
            })
            .catch(function(error) {
                rejectFunction(error)
            });

        }
    },




    /**
         * supportsDataOperation
         *
         * #WARNING Backward compatibility breaking
         *
         * @property {boolean} assess that a DataService supports supportsDataOperations.
         * Legacy ones that don't need to overrides it to false to work as expected
         */

    supportsDataOperation: {
        value: true
    },

    // operationReferrer: {
    //     value: function(operation) {
    //         return this._pendingOperationById.get(operation.referrerId);
    //     }
    // },

    // registerPendingOperation: {
    //     value: function(operation, referrer) {
    //         this._pendingOperationById.set(operation.id, operation);

    //     }
    // },

    // unregisterOperationReferrer: {
    //     value: function(operation) {
    //         this._pendingOperationById.delete(operation.referrerId);
    //     }
    // },

    // _operationListenerNamesByType: {
    //     value: new Map()
    // },
    // _operationListenerNameForType: {
    //     value: function(type) {
    //         return this._operationListenerNamesByType.get(type) || this._operationListenerNamesByType.set(type,"handle"+type.toCapitalized()).get(type);
    //     }
    // },

    shouldAuthenticateReadOperation: {
        value: false
    },

    //This probably isn't right and should be fetchRawData, but switching creates a strange error.
    // _fetchDataWithOperation: {
    //     value: function (query, stream) {

    //         var self = this;
    //         stream = stream || new DataStream();
    //         stream.query = query;

    //         // make sure type is an object descriptor or a data object descriptor.
    //         // query.type = this.rootService.objectDescriptorForType(query.type);


    //         var objectDescriptor = query.type,
    //             criteria = query.criteria,
    //             criteriaWithLocale,
    //             parameters,
    //             rawParameters,
    //             readOperation = new DataOperation(),
    //             rawReadExpressions = [],
    //             rawOrderings,
    //             promises;
    //             // localizableProperties = objectDescriptor.localizablePropertyDescriptors;

    //         /*
    //             We need to turn this into a Read Operation. Difficulty is to turn the query's criteria into
    //             one that doesn't rely on objects. What we need to do before handing an operation over to another context
    //             bieng a worker on the client side or a worker on the server side, is to remove references to live objects.
    //             One way to do this is to replace every object in a criteria's parameters by it's data identifier.
    //             Another is to serialize the criteria.
    //         */
    //         readOperation.type = DataOperation.Type.ReadOperation;
    //         readOperation.target = objectDescriptor;
    //         //readOperation.data = {};

    //         //Need to add a check to see if criteria may have more spefific instructions for "locale".
    //         /*
    //             1/19/2021 - we were only adding locale when the object descriptor being fetched has some localizableProperties, but a criteria may involve a subgraph and we wou'd have to go through the syntactic tree of the criteria, and readExpressions, to figure out if anywhere in that subgraph, there might be localizable properties we need to include the locales for.

    //             Since we're localized by default, we're going to include it no matter what, it's going to be more rare that it is not needed than it is.
    //         */
    //         /*
    //             WIP Adds locale as needed. Most common case is that it's left to the framework to qualify what Locale to use.

    //             A core principle is that each data object (DO) has a locale property behaving in the following way:
    //             locales has 1 locale value, a locale object.
    //             This is the most common use case. The property’s getter returns the user’s locale.
    //             Fetching an object with a criteria asking for a specific locale will return an object in that locale.
    //             Changing the locale property of an object to another locale instance (singleton in Locale’s case), updates all the values of its localizable properties to the new locale set.
    //             locales has either no value, or “*” equivalent, an “All Locale Locale”
    //             This feches the json structure and returns all the values in all the locales
    //             locales has an array of locale instances.
    //             If locale’s cardinality is > 1 then each localized property would return a json/dictionary of locale->value instead of 1 value.
    //         */

    //         readOperation.locales = self.userLocales;


    //         if(criteria) {
    //             readOperation.criteria = criteria;
    //         }

    //         if(query.fetchLimit) {
    //             readOperation.data.readLimit = query.fetchLimit;
    //         }

    //         if(query.orderings && query.orderings > 0) {
    //             rawOrderings = [];
    //             // self._mapObjectDescriptorOrderingsToRawOrderings(objectDescriptor, query.sortderings,rawOrderings);
    //             // readOperation.data.orderings = rawOrderings;
    //             readOperation.data.orderings = query.orderings;
    //         }

    //         /*
    //             for a read operation, we already have criteria, shouldn't data contains the array of
    //             expressions that are expected to be returned?
    //         */
    //         /*
    //             The following block is from PhrontClientService, we shouldn't map to rawReadExpressions just yet.
    //         */
    //         // self._mapObjectDescriptorReadExpressionToRawReadExpression(objectDescriptor, query.readExpressions,rawReadExpressions);
    //         // if(rawReadExpressions.length) {
    //         //     readOperation.data.readExpressions = rawReadExpressions;
    //         // }
    //         if(query.readExpressions && query.readExpressions.length) {
    //             readOperation.data.readExpressions = query.readExpressions;
    //         }

    //         /*
    //             We need to do this in node's DataWorker, it's likely that we'll want that client side as well, where it's some sort of token set post authorization.
    //         */
    //         if(this.application.identity && this.shouldAuthenticateReadOperation) {
    //             readOperation.identity = this.application.identity;
    //         }

    //         /*

    //             this is half-assed, we're mapping full objects to RawData, but not the properties in the expression.
    //             phront-service does it, but we need to stop doing it half way there and the other half over there.
    //             SaveChanges is cleaner, but the job is also easier there.

    //         */
    //         parameters = criteria ? criteria.parameters : undefined;
    //         rawParameters = parameters;

    //         if(parameters && typeof criteria.parameters === "object") {
    //             var keys = Object.keys(parameters),
    //                 i, countI, iKey, iValue, iRecord;

    //             rawParameters = Array.isArray(parameters) ? [] : {};

    //             for(i=0, countI = keys.length;(i < countI); i++) {
    //                 iKey  = keys[i];
    //                 iValue = parameters[iKey];
    //                 if(!iValue) {
    //                     throw "fetchData: criteria with no value for parameter key "+iKey;
    //                 } else {
    //                     if(iValue.dataIdentifier) {
    //                         /*
    //                             this isn't working because it's causing triggers to fetch properties we don't have
    //                             and somehow fails, but it's wastefull. Going back to just put primary key there.
    //                         */
    //                         // iRecord = {};
    //                         // rawParameters[iKey] = iRecord;
    //                         // (promises || (promises = [])).push(
    //                         //     self._mapObjectToRawData(iValue, iRecord)
    //                         // );
    //                         rawParameters[iKey] = iValue.dataIdentifier.primaryKey;
    //                     } else {
    //                         rawParameters[iKey] = iValue;
    //                     }
    //                 }

    //             }
    //             // if(promises) promises = Promise.all(promises);
    //         }
    //         // if(!promises) promises = Promise.resolve(true);
    //         // promises.then(function() {
    //         if(criteria) {
    //             readOperation.criteria.parameters = rawParameters;
    //         }
    //         //console.log("fetchData operation:",JSON.stringify(readOperation));
    //         self._dispatchReadOperation(readOperation, stream);

    //         if(criteria) {
    //             readOperation.criteria.parameters = parameters;
    //         }

    //         // });

    //         return stream;
    //     }
    // },

    // _dispatchReadOperation: {
    //     value: function(operation, stream) {
    //         this._thenableByOperationId.set(operation.id, stream);
    //         this._dispatchOperation(operation);
    //     }
    // },
    // _dispatchOperation: {
    //     value: function(operation) {
    //         this._pendingOperationById.set(operation.id, operation);

    //         defaultEventManager.handleEvent(operation);

    //         // var serializedOperation = this._serializer.serializeObject(operation);

    //         // // if(operation.type === "batch") {
    //         // //     var deserializer = new Deserializer();
    //         // //     deserializer.init(serializedOperation, require, undefined, module, true);
    //         // //     var deserializedOperation = deserializer.deserializeObject();

    //         // //     console.log(deserializedOperation);

    //         // // }
    //         // console.log("----> send operation "+serializedOperation);
    //         // this._socket.send(serializedOperation);
    //     }
    // },

    // registeredDataStreamForDataOperation: {
    //     value: function(dataOperation) {
    //         return this._thenableByOperationId
    //             ? dataOperation.referrerId
    //                 ? this._thenableByOperationId.get(dataOperation.referrerId)
    //                 : this._thenableByOperationId.get(dataOperation.id)
    //             : undefined;
    //     }
    // },
    // unregisterDataStreamForDataOperation: {
    //     value: function(dataOperation) {
    //         this._thenableByOperationId
    //             ? dataOperation.referrerId
    //                 ? this._thenableByOperationId.delete(dataOperation.referrerId)
    //                 : this._thenableByOperationId.delete(dataOperation.id)
    //             : undefined;
    //     }
    // },

    // handleReadUpdateOperation: {
    //     value: function (operation) {
    //         var referrer = operation.referrerId,
    //             objectDescriptor = operation.target,
    //             records = operation.data,
    //             stream = this._thenableByOperationId.get(referrer),
    //             streamObjectDescriptor;
    //         // if(operation.type === DataOperation.Type.ReadCompletedOperation) {
    //         //     console.log("handleReadCompleted  referrerId: ",operation.referrerId, "records.length: ",records.length);
    //         // } else {
    //         //     console.log("handleReadUpdateOperation  referrerId: ",operation.referrerId, "records.length: ",records.length);
    //         // }
    //         //if(operation.type === DataOperation.Type.ReadUpdateOperation) console.log("handleReadUpdateOperation  referrerId: ",referrer);

    //         if(stream) {
    //             streamObjectDescriptor = stream.query.type;
    //             /*

    //                 We now could get readUpdate that are reads for readExpressions that are properties (with a valueDescriptor) of the ObjectDescriptor of the referrer. So we need to add a check that the obectDescriptor maatch, otherwise, it needs to be assigned to the right instance, or created in memory and mapping/converters will find it.
    //             */

    //             if(streamObjectDescriptor === objectDescriptor) {
    //                 if(records && records.length > 0) {
    //                     //We pass the map key->index as context so we can leverage it to do record[index] to find key's values as returned by RDS Data API
    //                     this.addRawData(stream, records, operation);
    //                 } else if(operation.type !== DataOperation.Type.ReadCompletedOperation){
    //                     console.log("operation of type:"+operation.type+", has no data");
    //                 }
    //             } else {
    //                 console.log("Received "+operation.type+" operation that is for a readExpression of referrer ",referrer);
    //             }
    //         } else {
    //             console.log("receiving operation of type:"+operation.type+", but can't find a matching stream");
    //         }
    //     }
    // },

    // handleReadCompletedOperation: {
    //     value: function (operation) {
    //         this.handleReadUpdateOperation(operation);
    //         //The read is complete
    //         var stream = this._thenableByOperationId.get(operation.referrerId);
    //         if(stream) {
    //             this.rawDataDone(stream);
    //             this._thenableByOperationId.delete(operation.referrerId);
    //         } else {
    //             console.log("receiving operation of type:"+operation.type+", but can't find a matching stream");
    //         }
    //         //console.log("handleReadCompleted -clear _thenableByOperationId- referrerId: ",operation.referrerId);

    //     }
    // },

    // handleReadFailedOperation: {
    //     value: function (operation) {
    //         var stream = this._thenableByOperationId.get(operation.referrerId);
    //         this.rawDataError(stream,operation.data);
    //         this._thenableByOperationId.delete(operation.referrerId);
    //     }
    // },

    // handleOperationCompleted: {
    //     value: function (operation) {
    //         var referrerOperation = this._pendingOperationById.get(operation.referrerId);

    //         /*
    //             Right now, we listen for the types we care about, on the mainService, so we're receiving it all,
    //             even those from other data services / types we don' care about, like the PlummingIntakeDataService.

    //             One solution is to, when we register the types in the data service, to test if it handles operations, and if it does, the add all listeners. But that's a lot of work which will slows down starting time. A better solution would be to do like what we do with Components, where we find all possibly interested based on DOM structure, and tell them to prepare for a first delivery of that type of event. We could do the same as we know which RawDataService handle what ObjectDescriptor, which would give the RawDataService the ability to addListener() right when it's about to be needed.

    //             Another solution could involve different "pools" of objects/stack, but we'd lose the universal bus.

    //         */
    //         if(!referrerOperation) {
    //             return;
    //         }

    //         /*
    //             After creation we need to do this:                   self.rootService.registerUniqueObjectWithDataIdentifier(object, dataIdentifier);

    //             The referrerOperation could get hold of object, but it doesn't right now.
    //             We could also create a uuid client side and not have to do that and deal wih it all in here which might be cleaner.

    //             Now resolving the promise finishes the job in saveObjectData that has the object in scope.
    //         */
    //         referrerOperation._promiseResolve(operation);
    //     }
    // },

    // handleOperationFailed: {
    //     value: function (operation) {
    //         var referrerOperation = this._pendingOperationById.get(operation.referrerId);

    //         /*
    //             After creation we need to do this:                   self.rootService.registerUniqueObjectWithDataIdentifier(object, dataIdentifier);

    //             The referrerOperation could get hold of object, but it doesn't right now.
    //             We could also create a uuid client side and not have to do that and deal wih it all in here which might be cleaner.

    //             Now resolving the promise finishes the job in saveObjectData that has the object in scope.
    //         */
    //         if(referrerOperation) {
    //                 referrerOperation._promiseResolve(operation);
    //         }
    //     }
    // },

    // handleCreateCompletedOperation: {
    //     value: function (operation) {
    //         this.handleOperationCompleted(operation);
    //     }
    // },


    // handleUpdateCompletedOperation: {
    //     value: function (operation) {
    //         this.handleOperationCompleted(operation);
    //     }
    // },

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

                /*
                    This a switch for 0% operations vs 100% operations. It should be possible to mix but it's more risky for side effects in older versions.

                    supportsDataOperation will be determined by all RawDataServices supportsDataOperation
                */

                if(self.supportsDataOperation) {
                    try {

                        var readEvent = ReadEvent.checkout();

                        readEvent.type = ReadEvent.read;
                        readEvent.query = query;
                        readEvent.dataStream = stream;
                        query.type.dispatchEvent(readEvent);
                        if(readEvent.propagationPromise) {
                            readEvent.propagationPromise.finally(function() {
                                ReadEvent.checkin(readEvent);
                            });
                        } else {
                            ReadEvent.checkin(readEvent);
                        }
                    } catch (e) {
                        stream.dataError(e);
                    }

                    // try {
                    //     self._fetchDataWithOperation(query, stream);
                    // } catch (e) {
                    //     stream.dataError(e);
                    // }
                } else {
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
                }
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
                    var identityPromise,
                        shouldAuthenticate;
                    //If this is the service providing providesIdentity for the query's type: IdentityService for the Identity type required.
                    //the query is either for the Identity itself, or something else.
                    //If it's for the user identity itself, it's a simple fetch
                    //but if it's for something else, we may need to fetch the identity first, and then move on to the query at hand.
                    if(this.providesIdentity) {
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
                        if(!this.identity) {
                            if(this.identityPromise) {
                                identityPromise = this.identityPromise;
                            }
                            else if ((this.authenticationPolicy === AuthenticationPolicyType.UpfrontAuthenticationPolicy) ||
                                    (
                                        (this.authenticationPolicy === AuthenticationPolicy.ON_DEMAND) &&
                                        (shouldAuthenticate = typeof this.queryRequireAuthentication === "function") && this.queryRequireAuthentication(stream.query)
                                    )) {

                                        this.identityPromise = identityPromise = new Promise(function(resolve,reject) {
                                        var identityServices = this.identityServices,
                                        identityObjectDescriptors,
                                        selfUserCriteria,
                                        identityQuery;


                                        //Shortcut, there could be multiple one we need to flatten.
                                        identityObjectDescriptors = identityServices[0].types;
                                        //selfUserCriteria = new Criteria().initWithExpression("identity == $", "self");
                                        identityQuery = DataQuery.withTypeAndCriteria(identityObjectDescriptors[0]);

                                        this.rootService.fetchData(identityQuery)
                                        .then(function(userIdenties) {
                                            self.identity = userIdenties[0];
                                            resolve(self.identity);
                                        },
                                        function(error) {
                                            console.error(error);
                                            reject(error);
                                        });

                                    });

                                }
                                else identityPromise = Promise.resolve(true);
                        }
                        else {
                            identityPromise = Promise.resolve(true);
                        }

                        identityPromise.then(function (authorization) {
                            var streamSelector = stream.query;
                            stream.query = self.mapSelectorToRawDataQuery(streamSelector);
                            self.fetchRawData(stream);
                            stream.query = streamSelector;
                        }).catch(function (e) {
                            stream.dataError(e);
                            self.identityPromise = Promise.resolve(null);
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
            this.registerDeletedDataObject(object);
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
                self.unregisterCreatedDataObject(object);
            } else if (service) {
                promise = service[action](object).then(function () {
                    self.unregisterCreatedDataObject(object);
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

    // saveChanges: {
    //     value: function () {
    //         var self = this,
    //             promise = this.nullPromise,
    //             service = this.childServices[0];

    //             if (service && typeof service.saveChanges === "function") {
    //                 return service.saveChanges();
    //             }
    //             else {
    //                 return promise;
    //             }
    //         }
    // },



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
     *
     * Access Control related methods
     *
     ***************************************************************************/

    _performsAccessControl: {
        value: false
    },
    performsAccessControl: {
        get: function() {
            return this._performsAccessControl;
        },
        set: function(value) {
            if(this._performsAccessControl !== value) {
                if(this._performsAccessControl && !value) {
                    this.application.removeEventListener(DataOperation.Type.ReadOperation,this,true);
                }
                this._performsAccessControl = value;

                //Until we have a generic prepareForActivation
                //Intended for access control: we capture at the highest level:
                if(this.performsAccessControl) {
                    this.application.addEventListener(DataOperation.Type.ReadOperation,this,true);
                    /*
                        To assess ObjectDescriptor-level access
                    */
                    this.application.addEventListener(DataOperation.Type.CreateTransactionOperation,this,true);

                    /*
                        To assess AppendTransactionOperation's operations access
                    */
                    this.application.addEventListener(DataOperation.Type.AppendTransactionOperation,this,true);

                }
            }
        }
    },

    _accessPolicies: {
        value: undefined
    },
    accessPolicies: {
        get: function() {
            if(!this._accessPolicies) {
                this._accessPolicies = [];
                this._accessPolicies.addRangeChangeListener(this, "accessPolicies");
            }
            return this._accessPolicies;
        }
    },
    handleAccessPoliciesRangeChange: {
        value: function (plus, minus, index) {

            //if (!this.isDeserializing) {
                this._registerAccessPoliciesByObjectDescriptor(plus);
                this._unregisterAccessPoliciesByObjectDescriptor(minus);
            //}

            // var i, countI, iAccessPolicy, iObjectDescriptor,
            //     j, countJ, jOperationTypes;
            // for(i=0, countI = plus.length; (i<countI); i++) {
            //     iAccessPolicy = plus[i];
            //     iObjectDescriptor = iAccessPolicy.objectDescriptor;
            //     jOperationTypes = Object.keys(iAccessPolicy.dataOperationTypePolicyRules);

            //     for(j=0, countJ = jOperationTypes.length; (j < countJ); j++) {
            //         this.registerAccessPolicyForDataOperationTypeOnObjectDescriptor(iAccessPolicy, jOperationTypes[j], iObjectDescriptor);
            //     }
            // }

            // for(i=0, countI = minus.length; (i<countI); i++) {
            //     iAccessPolicy = minus[i];
            //     iObjectDescriptor = iAccessPolicy.objectDescriptor;
            //     jOperationTypes = Object.keys(iAccessPolicy.dataOperationTypePolicyRules);

            //     for(j=0, countJ = jOperationTypes.length; (j < countJ); j++) {
            //         this.unregisterAccessPolicyForDataOperationTypeOnObjectDescriptor(iAccessPolicy, jOperationTypes[j], iObjectDescriptor);
            //     }

            // }


        }
    },

    _registerAccessPoliciesByObjectDescriptor: {
        value: function(accessPolicies) {
            var i, countI, iAccessPolicy;

            for(i=0, countI = accessPolicies.length; (i<countI); i++) {
                iAccessPolicy = accessPolicies[i];
                iAccessPolicy.dataService = this;
                this.registerAccessPolicyForObjectDescriptor(iAccessPolicy, iAccessPolicy.objectDescriptor);
            }
        }
    },

    _unregisterAccessPoliciesByObjectDescriptor: {
        value: function(accessPolicies) {
            var i, countI, iAccessPolicy;

            for(i=0, countI = accessPolicies.length; (i<countI); i++) {
                iAccessPolicy = accessPolicies[i];
                this.unregisterAccessPolicyForObjectDescriptor(iAccessPolicy, iAccessPolicy.objectDescriptor);
            }
        }
    },

    __accessPoliciesByObjectDescriptor: {
        value: undefined
    },
    _accessPoliciesByObjectDescriptor: {
        get: function() {
            return this.__accessPoliciesByObjectDescriptor || (this.__accessPoliciesByObjectDescriptor = new Map());
        }
    },

    /*
        We're also keeping a similar indexing inside a DataAccessPolicy which still needs to do a lookup on data operation type to get to the rules to evalutate.
    */
    registerAccessPolicyForObjectDescriptor: {
        value:function(accessPolicy, objectDescriptor) {
            var accessPolicies = this._accessPoliciesByObjectDescriptor.get(objectDescriptor);

            if(!accessPolicies) {
                this._accessPoliciesByObjectDescriptor.set(objectDescriptor,[accessPolicy]);
            } else {
                accessPolicies.push(accessPolicy);
            }

        }
    },
    unregisterAccessPolicyForObjectDescriptor: {
        value:function(accessPolicy, objectDescriptor) {
            var accessPolicies = this._accessPoliciesByObjectDescriptorByOperationType.get(objectDescriptor),
                index;

            if(accessPolicies && ((index = accessPolicies.indexOf(accessPolicy)) !== -1)) {
                accessPolicies.splice(index,1);
            }
        }
    },

    /***************************************************************************
     *
     * Read Access Control related methods:
     *
     ***************************************************************************/

    _captureReadOperationPostAccessPoliciesEvaluation: {
        value: function(readOperation) {
            if(!this.isDataOperationAuthorized(readOperation)) {
                readOperation.stopImmediatePropagation();

                var readFailedOperation = new DataOperation();

                readFailedOperation.referrerId = readOperation.id;
                readFailedOperation.type = DataOperation.Type.ReadFailedOperation;
                readFailedOperation.target = readOperation.target;
                readFailedOperation.context = readOperation.context;
                readFailedOperation.clientId = readOperation.clientId;
                readFailedOperation.data = new Error("Unauthorized");

                //console.log("Unauthorized Read Operation for type: "+readOperation.target.name, readOperation);
                console.log("Unauthorized "+ readOperation.type + " for type: "+readOperation.target.name, readOperation);

                readFailedOperation.target.dispatchEvent(readFailedOperation);
            }

        }
    },
    captureReadOperation: {
        value: function(readOperation) {
            //console.log("captureReadOperation: "+readOperation.target.name+", criteria.expression: "+readOperation.criteria.expression+", criteria.parameters: "+JSON.stringify(readOperation.criteria.parameters), readOperation);
            if(this.performsAccessControl) {
                var self = this,
                    result = this.evaluateAccessPoliciesForDataOperation(readOperation);

                if(this._isAsync(result)) {
                    /*
                        Returning a promise from the event handler ensures the next listener inline doesn't get involed until we're done.
                    */
                    return result.then(function(value) {
                        return self._captureReadOperationPostAccessPoliciesEvaluation(readOperation);
                    })

                } else {
                    self._captureReadOperationPostAccessPoliciesEvaluation(readOperation);
                }
            }
        }
    },

    /***************************************************************************
     *
     * Transaction Access Control related methods:
     *
     ***************************************************************************/
    _captureCreateTransactionOperationPostAccessPoliciesEvaluation: {
        value: function(createTransactionOperation) {
            if(!this.isDataOperationAuthorized(createTransactionOperation)) {
                createTransactionOperation.stopImmediatePropagation();

                var createTransactionFailedOperation = new DataOperation();

                createTransactionFailedOperation.referrerId = createTransactionOperation.id;
                createTransactionFailedOperation.type = DataOperation.Type.CreateTransactionFailedOperation;
                createTransactionFailedOperation.target = createTransactionOperation.target;
                createTransactionFailedOperation.context = createTransactionOperation.context;
                createTransactionFailedOperation.clientId = createTransactionOperation.clientId;
                createTransactionFailedOperation.data = new Error("Unauthorized");

                // console.log("Unauthorized Read Operation for type: "+createTransactionOperation.target.name, createTransactionOperation);
                console.log("Unauthorized "+ createTransactionOperation.type + " for type: "+createTransactionOperation.target.name, createTransactionOperation);

                createTransactionFailedOperation.target.dispatchEvent(createTransactionFailedOperation);
            }

        }
    },

    /*

        The core strategy for access control here is to either:
            - look at the difference between the object descriptors in the transaction and a list of authorized ones. That difference should be empty.

            https://medium.com/@alvaro.saburido/set-theory-for-arrays-in-es6-eb2f20a61848

            let difference = arrA.filter(x => !arrB.includes(x));

            or

            - look at the intersection between the object descriptors in the transaction and a list of non-authorized ones. That intersection should be empty.

    */
    captureCreateTransactionOperation: {
        value: function(createTransactionOperation) {
            //console.log("captureCreateTransactionOperation: "+createTransactionOperation.target.name+", criteria.expression: "+createTransactionOperation.criteria.expression+", criteria.parameters: "+JSON.stringify(createTransactionOperation.criteria.parameters), createTransactionOperation);

            //console.log("objectDescriptors: ", createTransactionOperation.objectDescriptors);

            if(this.performsAccessControl) {
                var self = this,
                    result = this.evaluateAccessPoliciesForDataOperation(createTransactionOperation);

                if(this._isAsync(result)) {
                    /*
                        Returning a promise from the event handler ensures the next listener inline doesn't get involed until we're done.
                    */
                    return result.then(function(value) {
                        return self._captureCreateTransactionOperationPostAccessPoliciesEvaluation(createTransactionOperation);
                    })

                } else {
                    this._captureCreateTransactionOperationPostAccessPoliciesEvaluation(createTransactionOperation);
                }
            }
        }
    },

    /**
     * If the operation isn't authorized, stopImmediatePropagation and dispatch the appropriate operation/event to say so.
     * Returns the fail operation if created.
     *
     * @method
     * @argument {DataOperation} appendTransactionOperation
     * @returns undefined
     */
    _dispatchAppendTransactionFailedOperationFor: {
        value: function(appendTransactionOperation, error) {

            appendTransactionOperation.stopImmediatePropagation();

            var appendTransactionFailedOperation = new DataOperation();

            appendTransactionFailedOperation.referrerId = appendTransactionOperation.id;
            appendTransactionFailedOperation.type = DataOperation.Type.AppendTransactionFailedOperation;
            appendTransactionFailedOperation.target = appendTransactionOperation.target;
            appendTransactionFailedOperation.context = appendTransactionOperation.context;
            appendTransactionFailedOperation.clientId = appendTransactionOperation.clientId;
            appendTransactionFailedOperation.data = error ? error : (new Error("Unauthorized"));

            console.log("Unauthorized "+ appendTransactionOperation.type + " for type: "+appendTransactionOperation.target.name, appendTransactionOperation);

            appendTransactionFailedOperation.target.dispatchEvent(appendTransactionFailedOperation);
            return appendTransactionFailedOperation;
        }
    },


    __evaluateCaptureAppendTransactionOperationAuthorized: {
        value: function(iOperation, failedOperations) {
            var result;

            result = this.evaluateAccessPoliciesForDataOperation(iOperation);
            if(this._isAsync(result)) {
                /*
                    Returning a promise from the event handler ensures the next listener inline doesn't get involed until we're done.
                */
                var self = this;
                return result.then(function(value) {
                    if(!self.isDataOperationAuthorized(iOperation)) {
                        failedOperations.push(iOperation);
                        return false;
                    } else {
                        return true;
                    }
                });

            } else {
                if(!this.isDataOperationAuthorized(iOperation)) {
                    failedOperations.push(iOperation);
                    return false;
                } else {
                    return true;
                }
            }

        }
    },

    /**
     * Returns the first Fail Operation if evaluation is synchronous so we can stop as early as possible
     *
     * @type {Set}
     */
    _evaluateCaptureAppendTransactionOperationAuthorized: {
        value: function(appendTransactionOperation, operations, failedOperations, operationAccessPoliciesEvaluationPromises, abortAtFirstNonAuthorized) {
            var self = this,
                i, countI, iOperation, iResult, iFailOperation, iPromise;

            for(i = 0, countI = operations.length; (i<countI); i++) {
                iOperation = operations[i];

                /*
                    So far, we've been setting the clientId as the WebSocket connectionId given by AWS API Gateway, from the lambda, which saves having to send it back en forth which HTTP connection would have to do.

                    But we're setting that on the appendTransaction operation, which contains others, so to avoid looping on all to do it, we do it as we go.
                */
                if(!iOperation.clientId) {
                    iOperation.clientId = appendTransactionOperation.clientId;
                }
                if(!iOperation.identity) {
                    iOperation.identity = appendTransactionOperation.identity;
                }
                if(!iOperation.context) {
                    iOperation.context = appendTransactionOperation.context;
                }

                iResult = this.__evaluateCaptureAppendTransactionOperationAuthorized(iOperation, failedOperations);

                if(this._isAsync(iResult)) {
                    (operationAccessPoliciesEvaluationPromises || (operationAccessPoliciesEvaluationPromises = [])).push(
                        (iPromise = iResult.then(function(isAuthorized) {
                            if(!isAuthorized && abortAtFirstNonAuthorized) {
                                // iFailOperation = self._dispatchAppendTransactionFailedOperationFor(appendTransactionOperation);
                                throw new Error("Not Authorized");
                            }
                        })));
                        return iPromise;

                } else if(!iResult/*isAuthorized*/ && abortAtFirstNonAuthorized ) {
                    //iFailOperation = self._dispatchAppendTransactionFailedOperationFor(appendTransactionOperation);
                    return iResult;
                }
            }

            return true;

        }
    },

    captureAppendTransactionOperation: {
        value: function(appendTransactionOperation) {

            if(this.performsAccessControl) {
                /*
                    Returning a promise from the event handler ensures the next listener inline doesn't get involed until we're done.
                */
                var self = this;
                return new Promise(function(resolve, reject) {
                    try {
                        var operations = appendTransactionOperation.data.operations,
                            objectDescriptorModuleIds = Object.keys(operations),
                            i, countI, iOperation, iOperationsByType, iResult, isAuthorized,
                            operationAccessPoliciesEvaluationPromises = [],
                            operationAccessPoliciesEvaluationPromise,
                            push = Array.prototype.push,
                            /*
                                For debug purpose this could be turned to false
                            */
                            abortAtFirstNonAuthorized = true,
                            failedOperations = [];

                        /*

                            operations is an object: {
                                "moduleId": {
                                    "createOperations": [],
                                    "updateOperations": [],
                                    "deleteOperations": []
                                }
                            }
                        */

                        for(i=0, countI = objectDescriptorModuleIds.length; (i<countI); i++) {
                            iObjectDescriptorModuleId = objectDescriptorModuleIds[i];
                            iOperationsByType = operations[iObjectDescriptorModuleId];

                            if(iOperationsByType.createOperations) {
                                isAuthorized = self._evaluateCaptureAppendTransactionOperationAuthorized(appendTransactionOperation, iOperationsByType.createOperations, failedOperations, operationAccessPoliciesEvaluationPromises, abortAtFirstNonAuthorized);
                                if(typeof isAuthorized === "boolean" && !isAuthorized && abortAtFirstNonAuthorized) {
                                    break;
                                }
                            }
                            if(iOperationsByType.updateOperations) {
                                isAuthorized = self._evaluateCaptureAppendTransactionOperationAuthorized(appendTransactionOperation, iOperationsByType.updateOperations, failedOperations, operationAccessPoliciesEvaluationPromises, abortAtFirstNonAuthorized);
                                if(typeof isAuthorized === "boolean" && !isAuthorized && abortAtFirstNonAuthorized) {
                                    break;
                                }
                            }
                            if(iOperationsByType.deleteOperations) {
                                isAuthorized = self._evaluateCaptureAppendTransactionOperationAuthorized(appendTransactionOperation, iOperationsByType.deleteOperations, failedOperations, operationAccessPoliciesEvaluationPromises, abortAtFirstNonAuthorized);
                                if(typeof isAuthorized === "boolean" && !isAuthorized && abortAtFirstNonAuthorized) {
                                    break;
                                }
                            }
                        }


                        // for(i = 0, countI = operations.length; (i<count); i++) {
                        //     iOperation = operations[i];

                        //     iResult = this.__evaluateCaptureAppendTransactionOperationAuthorized(iOperation, failedOperations);

                        //     if(this._isAsync(iResult)) {
                        //         (operationAccessPoliciesEvaluationPromises || (operationAccessPoliciesEvaluationPromises = [])).push(
                        //             iResult.then(function(isAuthorized) {
                        //                 if(!isAuthorized && abortAtFirstNonAuthorized) {
                        //                     iFailOperation = self._dispatchAppendTransactionFailedOperationFor(appendTransactionOperation);

                        //                     reject(iFailOperation.data);
                        //                 }
                        //             }));

                        //     } else if(!iResult/*isAuthorized*/ && abortAtFirstNonAuthorized ) {
                        //         iFailOperation = self._dispatchAppendTransactionFailedOperationFor(appendTransactionOperation);

                        //         reject(iFailOperation.data);
                        //         break;
                        //     }
                        // }


                        /*
                            If we havent' failed yet with a sync non-authorized, we wait for all promises:
                        */
                        if(typeof isAuthorized !== "boolean") {
                            if(operationAccessPoliciesEvaluationPromises && operationAccessPoliciesEvaluationPromises.length) {
                                Promise.all(operationAccessPoliciesEvaluationPromises)
                                .then(function() {
                                    if(failedOperations && failedOperations.length > 0) {
                                        iFailOperation = self._dispatchAppendTransactionFailedOperationFor(appendTransactionOperation);
                                        reject(iFailOperation.data);
                                    } else {
                                        resolve(true);
                                    }
                                })
                                .catch(function(error) {
                                    iFailOperation = self._dispatchAppendTransactionFailedOperationFor(appendTransactionOperation, error);
                                    reject(iFailOperation.data);
                                });
                            }
                        }
                    }
                    catch (error) {
                        iFailOperation = self._dispatchAppendTransactionFailedOperationFor(appendTransactionOperation, error);
                        reject(error);
                    }
                });
            }
        }
    },


    captureCreateOperation: {
        value: function(readOperation) {
        }
    },

    accessPoliciesForDataOperation: {
        value: function(dataOperation) {

            return this.accessPolicies;


            if(!this.__accessPoliciesByObjectDescriptor) {
                this._registerAccessPoliciesByObjectDescriptor(this._accessPolicies);
            }

            var accessPolicies = this._accessPoliciesByObjectDescriptor.get(dataOperation.target);

            return accessPolicies ? accessPolicies : null;
        }
    },
    /**
     * Assess wether a DataService (and it's children data services can perform an operation.
     *
     * Implemented by default by delegating to DataAccessPolicy
     * @method
     * @argument {DataOperation} authorizeConnectionOperation
     * @returns {Promise} - A promise fulfilled with a boolean value.
     *
     */

    //isDataOperationAuthorized:
    isDataOperationAuthorized: {
        value: function(dataOperation) {
            return dataOperation.isAuthorized;
        }
    },

    authorizesDataOperationsWithoutAccessPolicy: {
        value: false
    },

    evaluateAccessPoliciesForDataOperation: {
        value: function(dataOperation) {
            //console.log("evaluateAccessPoliciesForDataOperation "+dataOperation.type+" "+dataOperation.target.name,dataOperation);

            //Let's try that if an operation is coming from inside the DataWorker, it's authorized.
            if(!dataOperation.clientId && this.currentEnvironment.isNode) {
                return (dataOperation.isAuthorized = true);
            } else {
                var accessPolicies = this.accessPoliciesForDataOperation(dataOperation);

                if(!accessPolicies || (accessPolicies && accessPolicies.length === 0)) {
                    console.log("accessPolicies: this.authorizesDataOperationsWithoutAccessPolicy is ",this.authorizesDataOperationsWithoutAccessPolicy);
                    return (dataOperation.isAuthorized = this.authorizesDataOperationsWithoutAccessPolicy);

                } else {
                    var i, countI, iAccessPolicy, iAccessPolicyEvaluation, iAccessPolicyEvaluationPromises,
                    self = this;

                    for( i=0, countI=accessPolicies ? accessPolicies.length : 0; (i<countI); i++ ) {
                        iAccessPolicy = accessPolicies[i];
                        iAccessPolicyEvaluation = iAccessPolicy.evaluate(dataOperation);

                        if(this._isAsync(iAccessPolicyEvaluation)) {
                            (iAccessPolicyEvaluationPromises || (iAccessPolicyEvaluationPromises = [])).push(iAccessPolicyEvaluation);
                        }

                        /* If sync so far... */
                        if(!iAccessPolicyEvaluationPromises && !this.isDataOperationAuthorized(dataOperation)) {
                            return false;
                        }
                    }


                    if(iAccessPolicyEvaluationPromises && iAccessPolicyEvaluationPromises.length > 0) {
                        return Promise.all(iAccessPolicyEvaluationPromises)
                        .then(function() {
                            return self.isDataOperationAuthorized(dataOperation);
                        });
                    } else {
                        //whatever the rules do, they set a state on the dataOperation, so nothing to resolve.
                        return this.isDataOperationAuthorized(dataOperation);
                    }

                }

            }
        }
    },

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
            return object.locales || this.userLocales;
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
            //console.debug("mainService set: ",service);
            this._mainService = service;
            if(service) {
                service.isMainService = true;
            }
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


DataService.defineBinding("mainService", {"<-": "application.mainService", source: defaultEventManager});

//WARNING Shouldn't be a problem, but avoiding a potential require-cycle for now:
DataStream.DataService = exports.DataService;
