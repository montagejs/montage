var Montage = require("core/core").Montage,
    DataObjectDescriptor = require("data/model/data-object-descriptor").DataObjectDescriptor,
    ObjectDescriptor = require("data/model/object-descriptor").ObjectDescriptor,
    WeakMap = require("collections/weak-map"),
    DataTrigger;

/**
 * Intercepts all calls to get and set an object's property and triggers any
 * Montage Data action warranted by these calls.
 *
 * DataTrigger is a JavaScript Objects subclass rather than a Montage subclass
 * so data triggers can be as lightweight as possible: They need to be
 * lightweight because many will be created (one for each relationship or
 * lazily loaded property of each model class) and there's no benefit for them
 * to be derived from the Montage prototype because they don't use any of the
 * Montage class functionality.
 *
 * @private
 * @class
 * @extends Object
 */
DataTrigger = exports.DataTrigger = function () {};

exports.DataTrigger.prototype = Object.create({}, /** @lends DataTrigger.prototype */ {

    /**
     * The constructor function for all trigger instances.
     *
     * @type {function}
     */
    constructor: {
        configurable: true,
        writable: true,
        value: exports.DataTrigger
    },

    /**
     * The service used by this trigger to perform Montage Data actions.
     *
     * Typically a number of triggers use the same service so this property
     * is defined in a single DataTrigger instance for each service and all
     * triggers that share that service are then derived from that instance.
     * This avoids the need for each trigger to have a reference to the service
     * it uses and saves memory. See
     * [_getTriggerPrototype()]{@link DataTrigger._getTriggerPrototype} for
     * the implementation of this behavior.
     *
     * @private
     * @type {Service}
     */
    _service: {
        configurable: true,
        writable: true,
        value: undefined
    },

    /**
     * The prototype of objects whose property is managed by this trigger.
     *
     * @private
     * @type {Object}
     */
    _objectPrototype: {
        configurable: true,
        writable: true,
        value: undefined
    },

    /**
     * The name of the property managed by this trigger.
     *
     * @private
     * @type {string}
     */
    _propertyName: {
        configurable: true,
        writable: true,
        value: undefined
    },

    /**
     * The name of the private property corresponding to the public property
     * managed by this trigger.
     *
     * The private property name is the
     * [_propertyName]{@link DataTrigger#_propertyName} value prefixed with an
     * underscore. To minimize the time and memory used by a trigger's call
     * intercepts this private property name is generated lazilly the first time
     * it is needed and then cached.
     *
     * @private
     * @type {string}
     */
    _privatePropertyName: {
        configurable: true,
        get: function () {
            if (!this.__privatePropertyName && this._propertyName) {
                this.__privatePropertyName = "_" + this._propertyName;
            }
            return this.__privatePropertyName;
        }
    },

    /**
     * Whether this trigger is for a global property or not.
     *
     * When a trigger is global and the value of the trigger's property is
     * obtained or set for one object managed by the trigger then that
     * property's value is assumed to have also been obtained or set for all
     * objects managed by the trigger.
     *
     * Setting this value clears the
     * [_valueStatus]{@link DataTrigger#_valueStatus} and should only be done
     * before a trigger is used.
     *
     * @private
     * @type {string}
     */
    _isGlobal: {
        configurable: true,
        get: function () {
            // To save memory a separate _isGlobal boolean is not maintained and
            // the _isGlobal value is derived from the _valueStatus type.
            return !(this._valueStatus instanceof WeakMap);
        },
        set: function (global) {
            global = global ? true : false;
            if (global !== this._isGlobal) {
                this._valueStatus = global ? undefined : new WeakMap();
            }
        }
    },

    /**
     * For global triggers, holds the status of this trigger's property value.
     * For other triggers, holds a map from objects whose property is managed
     * by this trigger to the status of that property's value for each of those
     * objects.
     *
     * See [_getValueStatus()]{@link DataTrigger#_getValueStatus} for the
     * possible status values.
     *
     * @private
     * @type {Object|WeakMap}
     */
    _valueStatus: {
        configurable: true,
        writable: true,
        value: undefined
    },

    /**
     * Gets the status of a property value managed by this trigger:
     *
     * - The status will be `undefined` when the value has not yet been
     *   requested or set.
     *
     * - The status will be `null` when the value was requested and has already
     *   been obtained or when it has been set.
     *
     * - When the value has been requested but is still in the process of being
     *   obtained, the status will be an object with a "promise" property set to
     *   a promise that will be resolved when the value is obtained and a
     *   "resolve" property set to a function that will resolve that promise.
     *
     * @private
     * @method
     * @argument {Object} object
     * @returns {Object}
     */
    _getValueStatus: {
        configurable: true,
        value: function (object) {
            return this._isGlobal ? this._valueStatus : this._valueStatus.get(object);
        }
    },

    /**
     * Sets the status of a property value managed by this trigger.
     *
     * See [_getValueStatus()]{@link DataTrigger#_getValueStatus} for the
     * possible status values.
     *
     * @private
     * @method
     * @argument {Object} object
     * @argument {Object} status
     */
    _setValueStatus: {
        configurable: true,
        value: function (object, status) {
            if (this._isGlobal) {
                this._valueStatus = status;
            } else if (status !== undefined) {
                this._valueStatus.set(object, status);
            } else {
                this._valueStatus.delete(object);
            }
        }
    },

    /**
     * @method
     * @argument {Object} object
     * @returns {Object}
     *
     * #Performance #ToDo: Looks like the same walk-up logic
     * is going to be done many times for individual instances,
     * we should improve that.
     */
    _getValue: {
        configurable: true,
        writable: true,
        value: function (object) {
            var prototype, descriptor, getter;
            // Start an asynchronous fetch of the property's value if necessary.
            this.getObjectProperty(object);
            
            // Search the prototype chain for a getter for this property,
            // starting just after the prototype that called this method.
            prototype = Object.getPrototypeOf(this._objectPrototype);
            while (prototype) {
                descriptor = Object.getOwnPropertyDescriptor(prototype, this._propertyName);
                getter = descriptor && descriptor.get;
                prototype = !getter && Object.getPrototypeOf(prototype);
            }
            // Return the property's current value.
            return getter ? getter.call(object) : object[this._privatePropertyName];
        }
    },

    /**
     * Note that if a trigger's property value is set after that values is
     * requested but before it is obtained from the trigger's service the
     * property's value will only temporarily be set to the specified value:
     * When the service finishes obtaining the value the property's value will
     * be reset to that obtained value.
     *
     * @method
     * @argument {Object} object
     * @argument {} value
     */
    _setValue: {
        configurable: true,
        writable: true,
        value: function (object, value) {
            var status, prototype, descriptor, getter, setter, writable;
            // Get the value's current status and update that status to indicate
            // the value has been obtained. This way if the setter called below
            // requests the property's value it will get the value the property
            // had before it was set, and it will get that value immediately.
            status = this._getValueStatus(object);
            this._setValueStatus(object, null);
            // Search the prototype chain for a setter for this trigger's
            // property, starting just after the trigger prototype that caused
            // this method to be called.
            prototype = Object.getPrototypeOf(this._objectPrototype);
            while (prototype) {
                descriptor = Object.getOwnPropertyDescriptor(prototype, this._propertyName);
                getter = descriptor && descriptor.get;
                setter = getter && descriptor.set;
                writable = !descriptor || setter || descriptor.writable;
                prototype = writable && !setter && Object.getPrototypeOf(prototype);
            }
            // Set this trigger's property to the desired value, but only if
            // that property is writable.
            if (setter) {
                setter.call(object, value);
            } else if (writable) {
                object[this._privatePropertyName] = value;
            }
            // Resolve any pending promise for this trigger's property value.
            if (status) {
                status.resolve(null);
            }
        }
    },

    /**
     * @todo Rename and document API and implementation.
     *
     * @method
     */
    decacheObjectProperty: {
        value: function (object) {
            this._setValueStatus(object, undefined);
        }
    },
    /**
     * Request a fetch of the value of this trigger's property for the
     * specified object but only if that data isn't already in the process
     * of being obtained and only if it wasn't previously obtained or
     * set. To unconditionally request a fetch of this property data use
     * [updateObjectProperty()]{@link DataTrigger#updateObjectProperty}.
     *
     * @method
     * @argument {Object} object
     * @returns {external:Promise}
     */
    getObjectProperty: {
        value: function (object) {
            var status = this._getValueStatus(object);
            return  status ?             status.promise :
                    status === null ?   this._service.nullPromise :
                                        this.updateObjectProperty(object);
        }
    },

    /**
     * If the value of this trigger's property for the specified object isn't in
     * the process of being obtained, request the most up to date value of that
     * data from this trigger's service.
     *
     * @method
     * @argument {Object} object
     * @returns {external:Promise}
     */
    updateObjectProperty: {
        value: function (object) {
            var self = this,
                status = this._getValueStatus(object) || {};
            if (!status.promise) {
                this._setValueStatus(object, status);
                status.promise = new Promise(function (resolve, reject) {
                    status.resolve = resolve;
                    status.reject = reject;
                    self._fetchObjectProperty(object);
                });
            }
            // Return the existing or just created promise for this data.
            return status.promise;
        }
    },

    /**
     * @private
     * @method
     * @argument {Object} object
     * @returns {external:Promise}
     */
    _fetchObjectProperty: {
        value: function (object) {
            var self = this;
            this._service.fetchObjectProperty(object, this._propertyName).then(function () {
                return self._fulfillObjectPropertyFetch(object);
            }).catch(function (error) {
                console.error(error);
                return self._fulfillObjectPropertyFetch(object, error);
            });
        }
    },

    _fulfillObjectPropertyFetch: {
        value: function (object, error) {
            var status = this._getValueStatus(object);
            this._setValueStatus(object, null);
            if (status && !error) {
                status.resolve(null);
            } else if (status && error) {
                console.error(error);
                status.reject(error);
            }
            return null;
        }
    }

});

Object.defineProperties(exports.DataTrigger, /** @lends DataTrigger */ {

    /**
     * @method
     * @argument {DataService} service
     * @argument {Object} prototype
     * @argument {Set} property names to exclude from triggers.
     * @returns {Object.<string, DataTrigger>}
     */
    addTriggers: {
        value: function (service, type, prototype, requisitePropertyNames) {
            // This function was split into two to provide backwards compatibility
            // to existing Montage data projects.  Future montage data projects
            // should base their object descriptors on Montage's version of object
            // descriptor.
            var isMontageDataType = type instanceof DataObjectDescriptor || type instanceof ObjectDescriptor;
            return isMontageDataType ?  this._addTriggersForMontageDataType(service, type, prototype, name) :
                                        this._addTriggers(service, type, prototype, requisitePropertyNames);
        }
    },

    _addTriggersForMontageDataType: {
        value: function (service, type, prototype) {
            var triggers = {},
                names = Object.keys(type.propertyDescriptors),
                trigger, name, i;
            for (i = 0; (name = names[i]); ++i) {
                trigger = this.addTrigger(service, type, prototype, name);
                if (trigger) {
                    triggers[name] = trigger;
                }
            }
            return triggers;
        }
    },

    _addTriggers: {
        value: function (service, objectDescriptor, prototype, requisitePropertyNames) {
            var triggers = {}, 
                propertyDescriptors = objectDescriptor.propertyDescriptors,
                propertyDescriptor, trigger, name, i;

            for (i = 0; (propertyDescriptor = propertyDescriptors[i]); i += 1) {
                name = propertyDescriptor.name;
                trigger = this.addTrigger(service, objectDescriptor, prototype, name);
                if (trigger) {
                    triggers[name] = trigger;
                }
            }
            return triggers;
        }
    },

    /**
     * @method
     * @argument {DataService} service
     * @argument {Object} prototype
     * @argument {string} name
     * @returns {?DataTrigger}
     */
    addTrigger: {
        value: function (service, type, prototype, name) {
            // This function was split into two to provide backwards compatibility
            // to existing Montage data projects.  Future montage data projects
            // should base their object descriptors on Montage's version of object
            // descriptor.
            var isMontageDataType = type instanceof DataObjectDescriptor || type instanceof ObjectDescriptor;
            return isMontageDataType ?  this._addTriggerForMontageDataType(service, type, prototype, name) :
                                        this._addTrigger(service, type, prototype, name);
        }
    },

    _addTriggerForMontageDataType: {
        value: function (service, type, prototype, name) {
            var descriptor = type.propertyDescriptors[name],
                trigger;
            if (descriptor && descriptor.isRelationship) {
                trigger = Object.create(this._getTriggerPrototype(service));
                trigger._objectPrototype = prototype;
                trigger._propertyName = name;
                trigger._isGlobal = descriptor.isGlobal;
                Montage.defineProperty(prototype, name, {
                    get: function () {
                        return trigger._getValue(this);
                    },
                    set: function (value) {
                        trigger._setValue(this, value);
                    }
                });
            }
            return trigger;
        }
    },

    /**
     * #Performance #ToDO: Here we're creating a trigger instance right away
     * when we could do it only when the defineProperty get/set are called.
     * This means this method wouldn't return the trigger which is added
     * by caller in service._getTriggersForObject. Instead, when created in the
     * get/set, we would added it to the service's ._getTriggersForObject.
     * First draft is bellow, working with bugs, need baking
     *
     * @private
     * @method
     * @argument {DataService} service
     * @argument {ObjectDescriptor} objectDescriptor
     * @argument {Object} prototype
     * @argument {String} name
     * @returns {DataTrigger}
     */
    _createTrigger: {
        value: function(service, objectDescriptor, prototype, name, propertyDescriptor) {
            var trigger = Object.create(this._getTriggerPrototype(service)),
                serviceTriggers = service._dataObjectTriggers.get(objectDescriptor);
            trigger._objectPrototype = prototype;
            trigger._propertyName = name;
            trigger._isGlobal = propertyDescriptor.isGlobal;
            if(!serviceTriggers) {
                serviceTriggers = {};
                service._dataObjectTriggers.set(objectDescriptor,serviceTriggers);
            }
            serviceTriggers[name] = trigger;
            return trigger;
        }
    },
    _addTrigger: {
        value: function (service, objectDescriptor, prototype, name) {
            var descriptor = objectDescriptor.propertyDescriptorForName(name),
                trigger;
            if (descriptor) {
                trigger = Object.create(this._getTriggerPrototype(service));
                trigger._objectPrototype = prototype;
                trigger._propertyName = name;
                trigger._isGlobal = descriptor.isGlobal;
                if (descriptor.definition) {
                    Montage.defineProperty(prototype, name, {
                        get: function () {
                            if (!this.getBinding(name)) {
                                this.defineBinding(name, {"<-": descriptor.definition});
                            }
                            return trigger._getValue(this);
                            // return (trigger||(trigger = DataTrigger._createTrigger(service, objectDescriptor, prototype, name,descriptor)))._getValue(this);
                        },
                        set: function (value) {
                            trigger._setValue(this, value);
                            // (trigger||(trigger = DataTrigger._createTrigger(service, objectDescriptor, prototype, name,descriptor)))._setValue(this, value);
                        }
                    });
                } else {
                    Montage.defineProperty(prototype, name, {
                        get: function () {
                            return trigger._getValue(this);
                            // return (trigger||(trigger = DataTrigger._createTrigger(service, objectDescriptor, prototype, name,descriptor)))._getValue(this);
                        },
                        set: function (value) {
                            trigger._setValue(this, value);
                            // (trigger||(trigger = DataTrigger._createTrigger(service, objectDescriptor, prototype, name,descriptor)))._setValue(this, value);
                        }
                    });
                }
            }
            return trigger;
        }
    },

    /**
     * To avoid having each trigger hold a reference to the service it uses, all
     * triggers that use a service are derived from a prototype that contains
     * this references. See [_service]{@link DataTrigger#_service} for details.
     *
     * @private
     * @method
     * @argument {DataService} service
     * @returns {DataTrigger}
     */
    _getTriggerPrototype: {
        value: function (service) {
            var trigger = this._triggerPrototypes && this._triggerPrototypes.get(service);
            if (!trigger) {
                trigger = new this();
                trigger._service = service;
                this._triggerPrototypes = this._triggerPrototypes || new WeakMap();
                this._triggerPrototypes.set(service, trigger);
            }
            return trigger;
        }
    },

    /**
     * @method
     * @argument {Object.<string, DataTrigger>} triggers
     * @argument {Object} prototype
     */
    removeTriggers: {
        value: function (triggers, prototype) {
            var triggerNames = Object.keys(triggers),
                name, i;
            for (i = 0; (name = triggerNames[i]); ++i) {
                this.removeTrigger(triggers[name], prototype, name);
            }
        }
    },

    /**
     * @method
     * @argument {DataTrigger} trigger
     * @argument {Object} prototype
     */
    removeTrigger: {
        value: function (trigger, prototype) {
            if (trigger) {
                delete prototype[trigger.name];
            }
        }
    }

});
