var Montage = require("core/core").Montage,
    DataObjectDescriptor = require("data/model/data-object-descriptor").DataObjectDescriptor,
    ObjectDescriptor = require("data/model/object-descriptor").ObjectDescriptor,
    WeakMap = require("core/collections/weak-map"),
    Map = require("core/collections/map"),
    //DataService requires DataTrigger before it sets itself on the exports object...
    //DataServiceModule = require("data/service/data-service"),
    ChangeEvent = require("../../core/event/change-event").ChangeEvent,
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
        get: function() {
            return this.propertyDescriptor.name;
        }
    },

        /**
     * The property descriptor managed by this trigger.
     *
     * @private
     * @type {string}
     */
    propertyDescriptor: {
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
            //return !(this._valueStatus instanceof Map);
        },
        set: function (global) {
            global = global ? true : false;
            if (global !== this._isGlobal) {
                this._valueStatus = global ? undefined : new WeakMap();
                //this._valueStatus = global ? undefined : new Map();
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
    __valueStatus: {
        configurable: true,
        writable: true,
        value: undefined
    },
    _valueStatus: {
        configurable: true,
        get: function() {
            return this.__valueStatus;
        },
        set: function(value) {
            this.__valueStatus = value;
        }
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

    __valueGetter: {
        value: undefined,
        writable: true,
        configurable: true,
        enumerable: false
    },
    _cacheValueGetter: {
        value: function() {
            var prototype, descriptor, getter, propertyName = this._propertyName;

            // Search the prototype chain for a getter for this property,
            // starting just after the prototype that called this method.
            prototype = Object.getPrototypeOf(this._objectPrototype);
            while (prototype) {
                descriptor = Object.getOwnPropertyDescriptor(prototype, propertyName);
                getter = descriptor && descriptor.get;
                prototype = !getter && Object.getPrototypeOf(prototype);
            }

            if(!getter) getter = null;

            this.__valueGetter = getter;
        }
    },
    _valueGetter: {
        get: function() {
            return this.__valueGetter !== undefined
                ? this.__valueGetter
                : (this._cacheValueGetter() || this.__valueGetter);
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
        value: function (object, shouldFetch) {
            var prototype, descriptor, getter = this._valueGetter, propertyName = this._propertyName;

            /*
                Experiment to see if it would make sense to avoid triggering getObjectProperty during mapping?
            */
            // if(!this._service.rootService._objectsBeingMapped.has(object)
            // ) {
                if(this._getValueStatus(object) !== null && shouldFetch !== false && !this.propertyDescriptor.definition) {


                /*
                    if the trigger's property descriptor has a definition, there are 2 cases:
                    1. this._service.childServiceForType(this.propertyDescriptor.owner) might know how to process the whole expression server side, in which case we don't do anything and it will be handled in teh back-end.

                    2. We have to yake care of it client side, which means we have to get all expression requirements individually before it can be evaluated, so we'd have to do the equivalent of getObjectProperties() rather than just the usual this.getObjectProperty(object)
                */


                // Start an asynchronous fetch of the property's value if necessary.
                this.getObjectProperty(object);
            }

            //}

            // Return the property's current value.
            return getter ? getter.call(object) : object[this._privatePropertyName];
        }
    },

    __valueSetter: {
        value: undefined,
        writable: true,
        configurable: true,
        enumerable: false
    },
    _cacheValueSetter: {
        value: function() {
            var prototype, descriptor, getter, setter, writable, propertyName = this._propertyName;

            // Search the prototype chain for a setter for this trigger's
            // property, starting just after the trigger prototype that caused
            // this method to be called.
            prototype = Object.getPrototypeOf(this._objectPrototype);
            while (prototype) {
                descriptor = Object.getOwnPropertyDescriptor(prototype, propertyName);
                getter = descriptor && descriptor.get;
                setter = getter && descriptor.set;
                writable = !descriptor || setter || descriptor.writable;
                prototype = writable && !setter && Object.getPrototypeOf(prototype);
            }
            if(!setter) setter = null;

            this.__valueSetter = setter;
            this.__isPropertyWritable = writable;
        }
    },
    _valueSetter: {
        get: function() {
            return this.__valueSetter !== undefined
                ? this.__valueSetter
                : (this._cacheValueSetter() || this.__valueSetter);
        }
    },

    __isPropertyWritable: {
        value: undefined,
        writable: true,
        configurable: true,
        enumerable: false
    },
    _isPropertyWritable: {
        get: function() {
            return this.__isPropertyWritable !== undefined
                ? this.__isPropertyWritable
                : (this._cacheValueSetter() || this.__isPropertyWritable);
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
        value: function (object, value, _dispatchChange) {
            var status, prototype, descriptor, getter, setter = this._valueSetter, writable, currentValue, isToMany, isArray, isMap, initialValue,
            dispatchChange = (arguments.length === 3) ? _dispatchChange : true,
            //shouldFetch = !this._service.rootService._objectsBeingMapped.has(object);
            shouldFetch = undefined;

            // Get the value's current status and update that status to indicate
            // the value has been obtained. This way if the setter called below
            // requests the property's value it will get the value the property
            // had before it was set, and it will get that value immediately.
            status = this._getValueStatus(object);
            this._setValueStatus(object, null);

            initialValue = this._getValue(object, shouldFetch);
            //If Array / to-Many
            isToMany = this.propertyDescriptor.cardinality !== 1;
            isArray = Array.isArray(initialValue);
            isMap  = !isArray && initialValue instanceof Map;

            // Set this trigger's property to the desired value, but only if
            // that property is writable.
            if (setter) {
                setter.call(object, value);
                //currentValue = value;
            } else if (this._isPropertyWritable) {

                if (isToMany) {
                    if(isArray) {
                        object[this._privatePropertyName].splice.apply(initialValue, [0, Infinity].concat(value));
                    } else if(isMap) {
                        //We want to maintain the same map,
                        var map = object[this._privatePropertyName],
                            //iterator are "lives" until used, so we make a copy
                            mapIterator = new Set(map.keys()).values(),
                            valueIterator = value.keys(),
                            iKey;

                        //Add what we don't have, and set if value different for same key
                        while(iKey = valueIterator.next().value) {
                            if(!map.has(iKey)) {
                                map.set(iKey,value.get(iKey));
                            } else if(map.get(iKey) !== value.get(iKey)) {
                                map.set(iKey,value.get(iKey));
                            }
                        }

                        //Remove what we had that's not in value
                        while(iKey = mapIterator.next().value) {
                            if(!value.has(iKey)) {
                                map.delete(iKey);
                            }
                        }
                    }
                    else {
                        object[this._privatePropertyName] = value;
                    }           }
                else {
                    object[this._privatePropertyName] = value;
                }

            }

            currentValue = this._getValue(object, shouldFetch);
            if(currentValue !== initialValue) {

                if(isToMany) {
                    if(initialValue) {
                        var listener = this._collectionListener.get(object);
                        if(listener) {

                            if(isArray) {
                                initialValue.removeRangeChangeListener(listener);
                            } else if(isMap) {
                                initialValue.removeMapChangeListener(listener);
                            }

                            if(!currentValue) {
                                this._collectionListener.delete(object);
                            }

                        }

                    }
                    if(currentValue) {
                        if(Array.isArray(currentValue)) {
                            var self = this,
                                listener = function _triggerArrayCollectionListener(plus, minus, index) {
                                    //If we're not in the middle of a mapping...:
                                    if(!self._service._objectsBeingMapped.has(object)) {
                                        //Dispatch update event
                                        var changeEvent = new ChangeEvent;
                                        changeEvent.target = object;
                                        changeEvent.key = self._propertyName;

                                        //This
                                        changeEvent.index = index;
                                        changeEvent.addedValues = plus;
                                        changeEvent.removedValues = minus;

                                        //Or this?
                                        //changeEvent.rangeChange = [plus, minus, index];

                                        //Or both with a getter/setter for index, addedValues and removedValues on top of rangeChange?

                                        //To deal with changes happening to an array value of that property,
                                        //we'll need to add/cancel observing on the array itself
                                        //and dispatch added/removed change in the array's change handler.

                                        //Bypass EventManager for now
                                        self._service.rootService.handleChange(changeEvent);
                                    }
                                };

                            this._collectionListener.set(object,listener);
                            currentValue.addRangeChangeListener(listener);
                        }
                        else if(currentValue instanceof Map) {
                            var self = this,
                                listener = function _triggerMapCollectionListener(value, key) {
                                    //If we're not in the middle of a mapping...:
                                    if(!self._service._objectsBeingMapped.has(object)) {
                                        //Dispatch update event
                                        var changeEvent = new ChangeEvent;
                                        changeEvent.target = object;
                                        /*
                                            Here we're saying the hosting object changed.
                                            so maybe this should be called "property","propertyValue","previousPropertyValue"
                                            which opens up the use of key for the content, for Map, but also key as index for an array. We only support expressing changes on 1 index for array, happy coincidence!

                                            !!! What if we renamed
                                                - addedValues to added
                                                    - for Array, added contains values added to the array (plus)
                                                    - for Map, added contains one, or more pairs [key,values] as entries, when it's actually added

                                                - removedValues to removed
                                                    - for Array, removed contains values removed to the array (minus)
                                                    - for Map, removed contains one, or more pairs [key,values] as entries, when it's actually deleted from the map

                                                - key/keyValue represents a set on an object as well as a map, a mutation of something that was there. For Array it's useful to use it for length on top of added/removed

                                                    - previousKeyValue if there contains the value before keyValue at key

                                        */
                                        changeEvent.key = self._propertyName;
                                        //We set the whole Map() since we don't have the tools yet to express better
                                        changeEvent.keyValue = object[self._privatePropertyName];

                                        /*
                                            Today, we'd have to listen to before change to know about the value that was previously under "key". It wouldn't be very practical for the trigger to store somewhere that value, so it can reuse it here. We probably can find a way. Another option could be to add the previous value to the arguments passed to the listener, which wouldn't break existing code and allow us to be smarter.
                                            changeEvent.previousKeyValue = initialValue;
                                        */

                                        /*
                                            Look like we're missing in collections listen the semantic to exparess the fact that a key is gone from the Map, vs the key being there and containing undefined?

                                            changeEvent.index makes no sense for a Map or an object, but it is similar to a key, it's a "slot"

                                            How could we express the disparition of a Key? We would need a removedKeys?
                                        */
                                        //We could use "key" for arrays and the value would be an integer
                                        // changeEvent.index = index;
                                        // changeEvent.addedValues = plus;
                                        // changeEvent.removedValues = minus;

                                        //Or this?
                                        //changeEvent.rangeChange = [plus, minus, index];

                                        //Or both with a getter/setter for index, addedValues and removedValues on top of rangeChange?

                                        //To deal with changes happening to an array value of that property,
                                        //we'll need to add/cancel observing on the array itself
                                        //and dispatch added/removed change in the array's change handler.

                                        //Bypass EventManager for now
                                        self._service.rootService.handleChange(changeEvent);
                                    }
                                };

                            this._collectionListener.set(object,listener);
                            currentValue.addMapChangeListener(listener);
                        }
                        else if(this.propertyDescriptor.isLocalizable) {
                            console.error("DataTrigger misses implementation to track changes on to-many localized property values");
                        } else {
                            console.error("DataTrigger misses implementation to track changes on property values that are neither Array nor Map");
                        }

                    }
                }
            }


//addRangeChangeListener

            //If we're not in the middle of a mapping...:
            if(currentValue !== initialValue && dispatchChange && !this._service._objectsBeingMapped.has(object)) {
                //Dispatch update event
                var changeEvent = new ChangeEvent;
                changeEvent.target = object;
                changeEvent.key = this._propertyName;
                changeEvent.previousKeyValue = initialValue;
                changeEvent.keyValue = currentValue;

                //To deal with changes happening to an array value of that property,
                //we'll need to add/cancel observing on the array itself
                //and dispatch added/removed change in the array's change handler.

                //Bypass EventManager for now
                this._service.rootService.handleChange(changeEvent);
            }


            // Resolve any pending promise for this trigger's property value.
            if (status) {
                status.resolve(currentValue);
            }
        }
    },

    __collectionListener: {
        value: undefined
    },
    _collectionListener: {
        get: function() {
            return this.__collectionListener || (this.__collectionListener = new WeakMap);
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
            /*
                If the object is not created and not saved, we fetch the value

                In some cases, a new object created in-memory, with enough data set on it might be able to read some propery that might be derived from the raw values of the property already set on it. So let's leave the bottom layers to figure that out.
            */
            // if(!this._service.isObjectCreated(object)) {
                var status = this._getValueStatus(object);
                return  status ?             status.promise :
                        status === null ?   this._service.nullPromise :
                                            this.updateObjectProperty(object);
            // } else {
            //     /*
            //         else the object is just created, not saved, no point fetching
            //         we wouldn't find anything anyway
            //     */

            //   this._setValueStatus(object, null);
            //     return this._service.nullPromise;
            // }
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
            //console.log("data-trigger: _fetchObjectProperty "+this._propertyName,object );
            this._service.fetchObjectProperty(object, this._propertyName).then(function (propertyValue) {
                /*
                    If there's a propertyValue, it's the actual result of the fetch and bipassed the existing path where the mapping would have added the value on object by the time we get back here. So since it wasn't done, we do it here.
                */
                // console.log(propertyValue);
                if(propertyValue === null) {
                    object[self._propertyName] = propertyValue;
                }
                else if(propertyValue && !object[self._privatePropertyName]) {
                    if(self.propertyDescriptor.cardinality > 1) {
                        object[self._propertyName] = propertyValue;
                    }
                    /*
                        When we fetch a property of an object that's not a relationship, typically a basic type, the value is returned and mapped to the existing object already. If that's the case, propertyValue[0] would be the object itself. If that's the case, then there's nothing to do.
                    */
                    else if(propertyValue[0] !== object) {
                        object[self._propertyName] = propertyValue[0];
                    }
                }
                return self._fulfillObjectPropertyFetch(object);
            }).catch(function (error) {
                console.error("DataTrigger Error _fetchObjectProperty for property \""+self._propertyName+"\"",error);
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

var DataTriggerClassMethods;
Object.defineProperties(exports.DataTrigger, /** @lends DataTrigger */ (DataTriggerClassMethods = {

    /**
     * @method
     * @argument {DataService} service
     * @argument {Object} prototype
     * @argument {Set} property names to exclude from triggers.
     * @returns {Object.<string, DataTrigger>}
     */
    addTriggers: {
        value: function (service, type, prototype, requisitePropertyDescriptors) {
            // This function was split into two to provide backwards compatibility
            // to existing Montage data projects.  Future montage data projects
            // should base their object descriptors on Montage's version of object
            // descriptor.
            var isMontageDataType = type instanceof DataObjectDescriptor || type instanceof ObjectDescriptor;
            return isMontageDataType ?  this._addTriggersForMontageDataType(service, type, prototype, name) :
                                        this._addTriggers(service, type, prototype, requisitePropertyDescriptors);
        }
    },

    _addTriggersForMontageDataType: {
        value: function (service, type, prototype) {
            var triggers = {},
            propertyDescriptors = Object.keys(type.propertyDescriptors),
                trigger, iPropertyDescriptor, i;
            for (i = 0; (iPropertyDescriptor = propertyDescriptors[i]); ++i) {
                trigger = this.addTrigger(service, type, prototype, iPropertyDescriptor);
                if (trigger) {
                    triggers[iPropertyDescriptor.name] = trigger;
                }
            }
            return triggers;
        }
    },

    _addTriggers: {
        value: function (service, objectDescriptor, prototype, requisitePropertyDescriptors) {
            var triggers = {},
                propertyDescriptors = objectDescriptor.propertyDescriptors,
                propertyDescriptor, trigger, name, i;

            for (i = 0; (propertyDescriptor = propertyDescriptors[i]); i += 1) {
                name = propertyDescriptor.name;
                trigger = this.addTrigger(service, objectDescriptor, prototype, propertyDescriptor);
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
        value: function (service, type, prototype, propertyDescriptor) {
            // This function was split into two to provide backwards compatibility
            // to existing Montage data projects.  Future montage data projects
            // should base their object descriptors on Montage's version of object
            // descriptor.
            var isMontageDataType = type instanceof DataObjectDescriptor || type instanceof ObjectDescriptor;
            return isMontageDataType ?  this._addTriggerForMontageDataType(service, type, prototype, propertyDescriptor.name) :
                                        this._addTrigger(service, type, prototype, propertyDescriptor);
        }
    },

    _addTriggerForMontageDataType: {
        value: function (service, type, prototype, name) {
            var descriptor = type.propertyDescriptors[name],
                trigger;
            if (descriptor && descriptor.isRelationship) {
                trigger = Object.create(this._getTriggerPrototype(service));
                trigger._objectPrototype = prototype;
                trigger.propertyDescriptor = descriptor;
                trigger._isGlobal = descriptor.isGlobal;
                Montage.defineProperty(prototype, name, {
                    get: function (shouldFetch) {
                        return trigger._getValue(this,shouldFetch);
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
            trigger.propertyDescriptor = propertyDescriptor;
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
        value: function (service, objectDescriptor, prototype, descriptor) {
            // var descriptor = objectDescriptor.propertyDescriptorForName(name),
            var trigger;
            if (descriptor) {
                trigger = Object.create(this._getTriggerPrototype(service));
                trigger._objectPrototype = prototype;
                trigger.propertyDescriptor = descriptor;
                trigger._isGlobal = descriptor.isGlobal;
                if (descriptor.definition) {
                    /*
                        As we create the binding for a definition like "propertyA.propertyB", we will endup doing fetchObjectProperty for propertyA, and later calling propertyB on the result of fetching propertyA. This is highly inneficient and we need to find a way to fetch propertyA with a readExpression of propertyB.

                        By the time we reach fetchObjectProperty, that info is lost, so we need to find a way to carry it in.

                        Every property change observer/listener is an opportunity to collect what "comes next", but it's only available on defineBinding, as after it's dynamically added once instances are in memory which is too late.
                    */


                    var propertyDescriptor = {
                        get: function (shouldFetch) {
                            if (!this.getBinding(descriptor.name)) {
                                /*
                                    This allows us to eventually fetch directly the equivalent of the expression and set it directly.
                                */
                                this.defineBinding(descriptor.name, {"<-": "_"+descriptor.name+" || ("+descriptor.definition+")"});
                            }
                            return trigger._getValue(this,shouldFetch);
                            // return (trigger||(trigger = DataTrigger._createTrigger(service, objectDescriptor, prototype, name,descriptor)))._getValue(this);
                        }
                    };
                    if(!descriptor.readonly) {
                        propertyDescriptor.set = function (value) {
                            trigger._setValue(this, value);
                            // (trigger||(trigger = DataTrigger._createTrigger(service, objectDescriptor, prototype, name,descriptor)))._setValue(this, value);
                        }
                    }
                    Montage.defineProperty(prototype, descriptor.name, propertyDescriptor);
                } else {
                    Montage.defineProperty(prototype, descriptor.name, {
                        get: function (shouldFetch) {
                            // if(trigger._privatePropertyName === "origin") {
                            //     debugger;
                            //     console.log("here");
                            // }
                            return trigger._getValue(this,shouldFetch);
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

}));

//Temporary share on exports for subclasses to use.
exports._DataTriggerClassMethods = DataTriggerClassMethods;
