/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
/**
 @module montage/core/core
 @requires montage/core/shim
 @requires montage/core/uuid
 @requires montage/core/event/binding
 @requires montage/core/event/event-manager
 */
require("core/shim");

var ATTRIBUTE_PROPERTIES = "AttributeProperties",
    UNDERSCORE = "_",
    PROTO = "__proto__",
    VALUE = "value",
    ENUMERABLE = "enumerable",
    SERIALIZABLE = "serializable",
    MODIFY = "modify";



/**
 @external Object
 */

/* Ecmascript 5 Methods. Should be external as WebKit doesn't need it, and loaded automatically */
if (!Object.create) {
    Object._creator = function _ObjectCreator() {
        this.__proto__ = _ObjectCreator.prototype;
    };
    Object.create = function(o, properties) {
        this._creator.prototype = o || Object.prototype;
        //Still needs to add properties....
        return new this._creator;
    };

    Object.getPrototypeOf = function(o) {
        return o.__proto__;
    };
}

/**
 @class module:montage/core/core.Montage
 */
var M = exports.Montage = Object.create(Object.prototype);

/**
     Creates a new Montage object.
     @function module:montage/core/core.Montage.create
     @param {Object} aPrototype The prototype object to create the new object from. If not specified, the prototype is the Montage prototype.
     @param {Object} [propertyDescriptor] An object that contains the initial properties and values for the new object.
     @returns The new object
     @example
     <caption>Creating a "empty" Montage object, using Montage as the prototype</caption>
     var alpha = Montage.create();
     @example
     <caption>Creating a new Montage component with a property descriptor object.</caption>
     var Button = Montage.create(Component , {
        state: {
            value: null
        }
     });
     */
Object.defineProperty(M, "create", {
    configurable: true,
    value: function(aPrototype, propertyDescriptor) {
        if (!propertyDescriptor) {

            var newObject = Object.create(typeof aPrototype === "undefined" ? this : aPrototype);

            if (newObject._dependenciesForProperty) {
                newObject._dependencyListeners = {};
            }

            if (typeof newObject.didCreate === "function") {
                newObject.didCreate();
            }

            return newObject;
        } else {
            var result = Object.create(aPrototype);
            M.defineProperties(result, propertyDescriptor);
            return result;
        }
    }
});

var extendedPropertyAttributes = [SERIALIZABLE, MODIFY];

// Extended property attributes, the property name format is "_" + attributeName + "AttributeProperties"
/**
@member external:Object#extendedPropertyAttributes
*/
extendedPropertyAttributes.forEach(function(name) {
    Object.defineProperty(Object.prototype, UNDERSCORE + name + ATTRIBUTE_PROPERTIES, {
        enumerable: false,
        configurable: false,
        writable: false,
        value: {}
    });
});

/**
     Defines a property on a Montage object.
     @function module:montage/core/core.Montage.defineProperty
     @param {Object} obj The object on which to define the property.
     @param {String} prop The name of the property to define, or modify.
     @param {Object} descriptor A descriptor object that defines the properties being defined or modified.
     @example
     Montage.defineProperty(Object.prototype, "_eventListenerDescriptors", {
     enumerable: false,
     serializable: true,
     value: null,
     writable: true
     });
     */
Object.defineProperty(M, "defineProperty", {

    value: function(obj, prop, descriptor) {
        var dependencies = descriptor.dependencies;
        //reset defaults appropriately for framework.
        if (PROTO in descriptor) {
            descriptor.__proto__ = (VALUE in descriptor ? (typeof descriptor.value === "function" ? _defaultFunctionValueProperty : _defaultObjectValueProperty) : _defaultAccessorProperty);
        } else {
            var defaults;
            if (VALUE in descriptor) {
                if (typeof descriptor.value === "function") {
                    defaults = _defaultFunctionValueProperty;
                } else {
                    defaults = _defaultObjectValueProperty;
                }
            } else {
                defaults = _defaultAccessorProperty;
            }
            for (var key in defaults) {
                if (!(key in descriptor)) {
                    descriptor[key] = defaults[key];
                }
            }
        }


        if (!descriptor.hasOwnProperty(ENUMERABLE) && prop.charAt(0) === UNDERSCORE) {
            descriptor.enumerable = false;
        }
        if (dependencies) {
            var i = 0,
                independentProperty;

            for (; (independentProperty = dependencies[i]); i++) {
                M.addDependencyToProperty(obj, independentProperty, prop);
            }

        }

        if (SERIALIZABLE in descriptor) {
            // get the _serializableAttributeProperties property or creates it through the entire chain if missing.
            getAttributeProperties(obj, SERIALIZABLE)[prop] = descriptor.serializable;
        }

        if (MODIFY in descriptor) {
            getAttributeProperties(obj, MODIFY)[prop] = descriptor.modify;
        }

        //this is added to enable value properties with [] or Objects that are new for every instance
        if (descriptor.distinct === true && typeof descriptor.value === "object") {
            (function(internalProperty, value) {
                Object.defineProperty(obj, internalProperty, {
                    enumerable: false,
                    configurable: true,
                    writable: true,
                    value: null
                });
                if (value.constructor === Object && Object.getPrototypeOf(value) === Object.prototype) {
                    // we have an object literal {...}
                    if (Object.keys(value).length !== 0) {
                        Object.defineProperty(obj, prop, {
                            configurable: true,
                            get: function() {
                                //Special case for object to copy the values
                                var returnValue = this[internalProperty];
                                if (!returnValue) {
                                    var k;
                                    returnValue = {};
                                    for (k in value) {
                                        returnValue[k] = value[k];
                                    }
                                    this[internalProperty] = returnValue;
                                }
                                return returnValue;
                            },
                            set: function(value) {
                                this[internalProperty] = value;
                            }
                        });
                    } else {
                        Object.defineProperty(obj, prop, {
                            configurable: true,
                            get: function() {
                                return this[internalProperty] || (this[internalProperty] = {});
                            },
                            set: function(value) {
                                this[internalProperty] = value;
                            }
                        });
                    }

                } else if ((value.__proto__ || Object.getPrototypeOf(value)) === __cached__arrayProto) {
                    // we have an array literal [...]
                    if (value.length !== 0) {
                        Object.defineProperty(obj, prop, {
                            configurable: true,
                            get: function() {
                                //Special case for object to copy the values
                                var returnValue = this[internalProperty];
                                if (!returnValue) {
                                    var i, k;
                                    returnValue = [];
                                    for (i = 0; typeof (k = value[i]) !== "undefined"; i++) {
                                        returnValue[i] = k;
                                    }
                                    this[internalProperty] = returnValue;
                                }
                                return returnValue;
                            },
                            set: function(value) {
                                this[internalProperty] = value;
                            }
                        });

                    } else {
                        Object.defineProperty(obj, prop, {
                            configurable: true,
                            get: function() {
                                //Special case for array as isArray fails
                                //Object.prototype.toString.call(Object.create([].__proto)) !== "[object Array]"
                                return this[internalProperty] || (this[internalProperty] = []);
                            },
                            set: function(value) {
                                this[internalProperty] = value;
                            }
                        });
                    }
                    //This case is to deal with objects that are created with a constructor
                } else if (value.constructor.prototype === Object.getPrototypeOf(value)) {
                    Object.defineProperty(obj, prop, {
                        configurable: true,
                        get: function() {
                            //Special case for object to copy the values
                            var returnValue = this[internalProperty];
                            if (!returnValue) {
                                var k;
                                returnValue = new value.constructor;
                                for (k in value) {
                                    returnValue[k] = value[k];
                                }
                                this[internalProperty] = returnValue;
                            }
                            return returnValue;
                        },
                        set: function(value) {
                            this[internalProperty] = value;
                        }
                    });


                } else {
                    Object.defineProperty(obj, prop, {
                        configurable: true,
                        get: function() {
                            return this[internalProperty] || (this[internalProperty] = Object.create(value.__proto__ || Object.getPrototypeOf(value)));
                        },
                        set: function(value) {
                            this[internalProperty] = value;
                        }
                    });
                }
            })(UNDERSCORE + prop, descriptor.value);

        } else {
            return Object.defineProperty(obj, prop, descriptor);
        }
    }});

/**
     Description Defines one or more new properties to an object, or modifies existing properties on the object.
     @function module:montage/core/core.Montage.defineProperties
     @param {Object} obj The object to which the properties are added.
     @param {Object} properties An object that contains one or more property descriptor objects.
     */
Object.defineProperty(M, "defineProperties", {value: function(obj, properties) {

    for (var p in properties) {
        if ("_bindingDescriptors" !== p) {
            this.defineProperty(obj, p, properties[p]);
        }
    }
    return obj;
}});

/**
 @private
 */
var _defaultAccessorProperty = {
    enumerable: true,
    configurable: true
};
/**
 @private
 */
var _defaultObjectValueProperty = {
    writable: true,
    enumerable: true,
    configurable: true
};

/**
 @private
 */
var _defaultFunctionValueProperty = {
    writable: true,
    enumerable: false,
    configurable: true
};

/**
 @private
 */
var __cached__arrayProto = Array.prototype;

/**
     Private collection of dependencies for all dependent keys. The collection here is keyed by the dependent propertyName
     The array for each dependent property has all the independent property names that when changed, need to signal a change in the dependent property.
     @private
     */
Object.defineProperty(Object.prototype, "_dependenciesForProperty", {
    enumerable: false,
    writable: true,
    value: null
});

 /**
     Private collection of listener functions that are for dependent properties to observe their dependency properties for changes.
     The collection here is keyed by the dependent propertyName.
     @private
     */
Object.defineProperty(Object.prototype, "_dependencyListeners", /** @lends external:Object# */ {
    enumerable: false,
    writable: true,
    value: null
});


/**
     Adds a dependent property to another property's collection of dependencies.
     When the value of a dependent property changes, it generates a <code>change@independentProperty</code> event.
     @function module:montage/core/core.Montage.addDependencyToProperty
     @param {Object} obj The object containing the dependent and independent properties.
     @param {String} independentProperty The name of the object's independent property.
     @param {String} dependentProperty The name of the object's dependent property.
     */
M.defineProperty(M, "addDependencyToProperty", { value: function(obj, independentProperty, dependentProperty) {

    // TODO optimize this so we don't keep checking over and over again
    if (!obj._dependenciesForProperty) {
        obj._dependenciesForProperty = {};
    }

    if (!obj._dependenciesForProperty[dependentProperty]) {
        obj._dependenciesForProperty[dependentProperty] = [];
    }

    obj._dependenciesForProperty[dependentProperty].push(independentProperty);
}});


/**
     Removes a dependent property from another property's collection of dependent properties.
     When the value of a dependent property changes, it generates a <code>change@independentProperty</code> event.
     @function module:montage/core/core.Montage.removeDependencyFromProperty
     @param {Object} obj The object containing the dependent and independent properties.
     @param {String} independentProperty The name of the object's independent property.
     @param {String} dependentProperty The name of the object's dependent property that you want to remove.
     */
M.defineProperty(M, "removeDependencyFromProperty", {value: function(obj, independentProperty, dependentProperty) {
    if (!obj._dependenciesForProperty) {
        return;
    }

    var dependencies = obj._dependenciesForProperty[dependentProperty];
    if (dependencies) {
        dependencies = dependencies.filter(function(element) {
            return (element !== independentProperty);
        });
    }

}});

function getAttributeProperties(proto, attributeName) {
    var attributePropertyName = UNDERSCORE + attributeName + ATTRIBUTE_PROPERTIES;

    if (proto.hasOwnProperty(attributePropertyName)) {
        return proto[attributePropertyName];
    } else {
        return Object.defineProperty(proto, attributePropertyName, {
            enumerable: false, configurable: false, writable: false,
            value: Object.create(getAttributeProperties(Object.getPrototypeOf(proto), attributeName))
        })[attributePropertyName];
    }
}

/**
 Returns the descriptor object for an object's property.
 @function external:Object#getPropertyDescriptor
 @param {Object} anObject The object containing the property.
 @param {String} propertyName The name of the property.
 @returns {Object} The object's property descriptor.
 */
Object.getPropertyDescriptor = function(anObject, propertyName) {
    var current = anObject,
        currentDescriptor;

    do {
        currentDescriptor = Object.getOwnPropertyDescriptor(current, propertyName);
    } while (!currentDescriptor && (current = current.__proto__ || Object.getPrototypeOf(current)));

    return currentDescriptor;
};

/**
 Returns the prototype object and property descriptor for a property belonging to an object.
 @function external:Object#getPrototypeAndDescriptorDefiningProperty
 @param {Object} anObject The object to return the prototype for.
 @param {String} propertyName The name of the property.
 @returns {Object} An object containing two properties named <code>prototype</code> and <code>propertyDescriptor</code> that contain the object's prototype object and property descriptor, respectively.
 */
Object.getPrototypeAndDescriptorDefiningProperty = function(anObject, propertyName) {
    var current = anObject,
        currentDescriptor;
    if (propertyName) {

        do {
            currentDescriptor = Object.getOwnPropertyDescriptor(current, propertyName);
        } while (!currentDescriptor && (current = current.__proto__ || Object.getPrototypeOf(current)));

        return {
            prototype: current,
            propertyDescriptor: currentDescriptor
        };
    }
};
/**
     Returns the names of serializable properties belonging to Montage object.
     @function module:montage/core/core.Montage.getSerializablePropertyNames
     @param {Object} anObject A Montage object.
     @returns {Array} An array containing the names of the serializable properties belonging to <code>anObject</code>.
     */
M.defineProperty(M, "getSerializablePropertyNames", {value: function(anObject) {

    var propertyNames = [],
        attributes = anObject._serializableAttributeProperties;

    if (attributes) {
        for (var name in attributes) {
            if (attributes[name]) {
                propertyNames.push(name);
            }
        }
    }

    return propertyNames;
}});

/**
     Returns the attribute of a property belonging to an object.
     @function module:montage/core/core.Montage.getPropertyAttribute
     @param {Object} anObject A object.
     @param {String} propertyName The name of a property belonging to <code>anObject</code>.
     @param {String} attributeName The name of a property's attribute.
     @returns attributes array
     */
M.defineProperty(M, "getPropertyAttribute", {value: function(anObject, propertyName, attributeName) {

    var attributePropertyName = UNDERSCORE + attributeName + ATTRIBUTE_PROPERTIES,
        attributes = anObject[attributePropertyName];

    if (attributes) {
        return attributes[propertyName];
    }
}});


 /**
     @function module:montage/core/core.Montage.getPropertyAttributes
     @param {Object} anObject An object.
     @param {String} attributeName The attribute name.
     @returns {Object} TODO getPropertyAttributes returns description
     */
M.defineProperty(M, "getPropertyAttributes", {value: function(anObject, attributeName) {
    var attributeValues = {},
        attributePropertyName = UNDERSCORE + attributeName + ATTRIBUTE_PROPERTIES,
        attributes = anObject[attributePropertyName];

    if (!attributes) {
        return;
    }

    for (var name in attributes) {
        attributeValues[name] = attributes[name];
    }

    return attributeValues;
}});

var _instanceMetadataDescriptor = {
    isInstance: {value: true}
};

var _functionInstanceMetadataDescriptor = {
    objectName: {value: "Function"},
    isInstance: {value: true}
};

/**
     @function module:montage/core/core.Montage.getInfoForObject
     @param {Object} object An object.
     @returns {Object} object._montage_metadata
     */
M.defineProperty(M, "getInfoForObject", {
    value: function(object) {
        var metadata;
        var instanceMetadataDescriptor;

        if (object.hasOwnProperty("_montage_metadata")) {
            return object._montage_metadata;
        } else {
            metadata = object._montage_metadata || (object.constructor && object.constructor._montage_metadata) || null;
            if (object.constructor === Function) {
                instanceMetadataDescriptor = _functionInstanceMetadataDescriptor;
            } else {
                instanceMetadataDescriptor = _instanceMetadataDescriptor;
            }
            try {
                return Object.defineProperty(object, "_montage_metadata", {
                    enumerable: false,
                    // this object needs to be overriden by the SerializationCompiler because this particular code might be executed on an exported object before the Compiler takes action, for instance, if this function is called within the module definition itself (happens with __core__).
                    writable: true,
                    value: Object.create(metadata, instanceMetadataDescriptor)
                })._montage_metadata;
            } catch(e) {
                // NOTE Safari (as of Version 5.0.2 (6533.18.5, r78685)
                // doesn't seem to allow redefining an existing property on a DOM Element
                return (object._montage_metadata = Object.create(metadata, instanceMetadataDescriptor));
            }
        }
    }
});
/**
    @function module:montage/core/core.Montage.doNothing
    @default function
    */

Object.defineProperty(M, "doNothing", {
    value: function() {
    }
});

/**
    @function module:montage/core/core.Montage#self
    @default function
    @returns itself
    */
Object.defineProperty(M, "self", {
    value: function() {
        return this;
    }
});

/**
    @private
    */
Object.defineProperty(M, "__OBJECT_COUNT", {
    value: 0,
    writable: true
});


var Uuid = require("core/uuid").Uuid;
/**
     Generates and returns a unique identifier.
     @function module:montage/core/core.Montage.generateUID
     @returns {String} A unique ID.
     @example
     <caption>Generates a new unique ID and assigns to a variable.</caption>
     var id = document.application.generateUID();
     console.log(id); // "249C2AE9-37BA-4E2F-8B31-A534E757B957"
     */
Object.defineProperty(M, "generateUID", {
    value: function() {
        return Uuid.generate();
    }
});

var uuidGetGenerator = function() {

    var uuid = Uuid.generate(),
        info = M.getInfoForObject(this);
    try {
        if (info !== null && info.isInstance === false) {
            this._uuid = uuid;
            Object.defineProperty(this, "uuid", {
                get: function() {
                    if (this.hasOwnProperty("uuid")) {
                        // we are calling uuid on the prototype
                        return this._uuid;
                    } else {
                        // we are calling uuid on instance of this prototype
                        return uuidGetGenerator.call(this);
                    }
                }
            });
        } else {
            //This is needed to workaround some bugs in Safari where re-defining uuid doesn't work for DOMWindow.
            if (info.isInstance) {
                Object.defineProperty(this, "uuid", {
                    configurable: true,
                    enumerable: false,
                    writable: false,
                    value: uuid
                });
            }
            //This is really because re-defining the property on DOMWindow actually doesn't work, so the original property with the getter is still there and return this._uuid if there.
            if (this instanceof Element || !info.isInstance || !(VALUE in Object.getOwnPropertyDescriptor(this, "uuid")) || !(PROTO in this /* lame way to detect IE */)) {
                //This is needed to workaround some bugs in Safari where re-defining uuid doesn't work for DOMWindow.
                this._uuid = uuid;
            }
        }
    } catch(e) {
        // NOTE Safari (as of Version 5.0.2 (6533.18.5, r78685)
        // doesn't seem to allow redefining an existing property on a DOM Element
        // Still want to redefine the property where possible for speed
        this._uuid = uuid;
    }

    return uuid;
};

var defaultUuidGet = function defaultUuidGet() {
    return (this.hasOwnProperty("_uuid") ? this._uuid : uuidGetGenerator.call(this));
};

/**
     @private
     */
Object.defineProperty(Object.prototype, "_uuid", {
    enumerable: false,
    value: null,
    writable: true
});

/**
     Contains an object's unique ID.
     @member external:Object#uuid
     @default null
     */
Object.defineProperty(Object.prototype, "uuid", {
    configurable: true,
    get: defaultUuidGet,
    set: function() {
    }
});

/**
     Returns true if two objects are equal, otherwise returns false.
     @function module:montage/core/core.Montage#equals
     @param {Object} anObject The object to compare for equality.
     @returns {Boolean} Returns <code>true</code> if the calling object and <code>anObject</code> are identical and their <code>uuid</code> properties are also equal. Otherwise, returns <code>false</code>.
     */
Object.defineProperty(M, "equals", {
    value: function(anObject) {
        return this === anObject || this.uuid === anObject.uuid;
    }
});

if (!Object.isSealed) {
    Object.defineProperty(Object, "isSealed", {
        value: function() {
            return false;
        }
    });
}

if (!Object.seal) {
    Object.defineProperty(Object, "seal", {
        value: function(object) {
            return object;
        }
    });
}

/*
 * If it exists this method calls the method named with the identifier prefix.
 * Example: If the name parameter is "shouldDoSomething" and the caller's identifier is "bob", then
 * this method will try and call "bobShouldDoSomething"
*/

/**
 * @function module:montage/core/core.Montage#callDelegateMethod
 * @param {string} name
 */
Object.defineProperty(M, "callDelegateMethod", {
    value: function(name) {
        var delegate = this.delegate, delegateFunctionName, delegateFunction;
        if (typeof this.identifier === "string") {
            delegateFunctionName = this.identifier + name.toCapitalized();
            if (delegate && typeof (delegateFunction = delegate[delegateFunctionName]) === "function") {
                // remove first argument
                Array.prototype.shift.call(arguments);
                return delegateFunction.apply(delegate, arguments);
            }
        }

        if (delegate && typeof (delegateFunction = delegate[name]) === "function") {
            // remove first argument
            Array.prototype.shift.call(arguments);
            return delegateFunction.apply(delegate, arguments);
        }
    }
});

/**
@function external:Object#getProperty
@param {Object} aPropertyPath
@param {Property} unique
@param {Property} preserve
@param {Function} visitedComponentCallback
@param {Array} currentIndex
@returns result
*/
Object.defineProperty(Object.prototype, "getProperty", {
    value: function(aPropertyPath, unique, preserve, visitedComponentCallback, currentIndex) {
        var dotIndex,
            result,
            currentPathComponent,
            nextDotIndex,
            remainingPath = null;

        if (aPropertyPath == null) {
            return;
        }

        dotIndex = aPropertyPath.indexOf(".", currentIndex);
        currentIndex = currentIndex || 0;
        currentPathComponent = aPropertyPath.substring(currentIndex, (dotIndex === -1 ? aPropertyPath.length : dotIndex));

        if (currentPathComponent in this) {
            result = this[currentPathComponent];
        } else {
            result = typeof this.undefinedGet === "function" ? this.undefinedGet(currentPathComponent) : undefined;
        }

        if (visitedComponentCallback) {
            nextDotIndex = aPropertyPath.indexOf(".", currentIndex);
            if (nextDotIndex != -1) {
                remainingPath = aPropertyPath.substr(nextDotIndex+1);
            }
            visitedComponentCallback(this, currentPathComponent, result, null, remainingPath);
        }

        if (visitedComponentCallback && result && -1 === dotIndex) {

            // We resolved the last object on the propertyPath, be sure to give the visitor a chance to handle this one
            //visitedComponentCallback(result, null, null, null, null);

        } else if (result && dotIndex !== -1) {
            // We resolved that component of the path, but there's more path components; go to the next

            if (result.getProperty) {
                result = result.getProperty(aPropertyPath, unique, preserve, visitedComponentCallback, dotIndex + 1);
            } else {
                // TODO track when this happens, right now it's only happening with CanvasPixelArray in WebKit
                result = Object.prototype.getProperty.call(result, aPropertyPath, unique, preserve, visitedComponentCallback, dotIndex + 1);
            }
        }
        // Otherwise, we reached the end of the propertyPath, or at least as far as we could; stop
        return result;
    },
    enumerable: false
});
/**
  @private
*/
Object.defineProperty(M, "_propertySetterNamesByName", {
    value: {}
});
/**
  @private
*/
Object.defineProperty(M, "_propertySetterByName", {
    value: {}
});

/**
Description
@member external:Object#setProperty
@function
@param {Object} aPropertyPath
@param {Object} value
@returns itself
*/
Object.defineProperty(Object.prototype, "setProperty", {
    value: function(aPropertyPath, value) {
        var propertyIsNumber = !isNaN(aPropertyPath),
            lastDotIndex = propertyIsNumber ? -1 : aPropertyPath.lastIndexOf("."),
            setObject,
            lastObjectAtPath,
            propertyToSetOnArray;

        if (lastDotIndex !== -1) {
            //The propertyPath describes a property that is deeper inside this object
            setObject = this.getProperty(aPropertyPath.substring(0, lastDotIndex));

            if (!setObject) {
                this.undefinedSet(aPropertyPath);
                return;
            }

            aPropertyPath = aPropertyPath.substring(lastDotIndex + 1);
        } else {
            // The property path describes a property on this object
            setObject = this;
        }

        lastObjectAtPath = setObject.getProperty(aPropertyPath);

        // TODO clean up some of the duplicated code here

        if (lastObjectAtPath && Array.isArray(lastObjectAtPath)) {
            if (lastObjectAtPath !== value) {
                // if the value does not match the object described by this propertyPath; set it as the new value

                if (Array.isArray(setObject)) {
                    // If the setObject is an array itself; splice (typically called by set) to trigger bindings, do it here to save time
                    propertyToSetOnArray = parseInt(aPropertyPath, 10);
                    if (!isNaN(propertyToSetOnArray)) {
                        if (setObject.length < propertyToSetOnArray) {
                            // TODO while I could set the value here I'm setting null and letting the splice,
                            // which we need to do anyway to trigger bindings, do the actual setting
                            setObject[propertyToSetOnArray] = null;
                        }

                        setObject.splice(propertyToSetOnArray, 1, value);

                    } else {
                        setObject[aPropertyPath] = value;
                    }

                } else {
                    setObject[aPropertyPath] = value;
                }

            } else {
                // Otherwise, they are the same object, a mutation event probably happened

                // If the object at the property we're "setting" is itself an array, see if there was an event passed along
                // as part of a change and whether we need to call the setObject's changeProperty method
                var changeEvent = this.setProperty.changeEvent, modify;

                // For these mutation/addition/removal events, use the 'modify' attribute of this property's descriptor
                if (changeEvent && changeEvent.isMutation &&
                        (modify = M.getPropertyAttribute(setObject, aPropertyPath, MODIFY))) {

                    modify.call(setObject, changeEvent.type, changeEvent.newValue, changeEvent.prevValue);
                }
            }
        } else if (Array.isArray(setObject)) {
            // If the setObject is an array itself; splice (typically called by set) to trigger bindings, do it here to save time
            propertyToSetOnArray = parseInt(aPropertyPath, 10);
            if (!isNaN(propertyToSetOnArray)) {
                if (setObject.length < propertyToSetOnArray) {
                    // TODO while I could set the value here I'm setting null and letting the splice,
                    // which we need to do anyway to trigger bindings, do the actual setting
                    setObject[propertyToSetOnArray] = null;
                }
            }
            setObject.splice(propertyToSetOnArray, 1, value);
        } else {
            setObject[aPropertyPath] = value;
        }
    },
    enumerable: false
});

/**
Description
@member external:Array#getProperty
@function
@param {Object} aPropertyPath
@param {Property} unique
@param {Property} preserve
@param {Function} visitedComponentCallback
@param {Array} currentIndex
*/
var _index_array_regexp = /^[0-9]+$/;
Object.defineProperty(Array.prototype, "getProperty", {
    value: function(aPropertyPath, unique, preserve, visitedComponentCallback, currentIndex) {

        if (aPropertyPath == null) {
            return;
        }

        currentIndex = currentIndex || 0;

        var result,
            propertyIsNumber = _index_array_regexp.test(aPropertyPath),//!isNaN(aPropertyPath),
            parenthesisStartIndex = propertyIsNumber ? -1 : aPropertyPath.indexOf("(", currentIndex),
            parenthesisEndIndex = propertyIsNumber ? -1 : aPropertyPath.lastIndexOf(")"),
            currentPathComponentEndIndex = propertyIsNumber ? -1 : aPropertyPath.indexOf(".", currentIndex),
            nextDelimiterIndex = -1,
            itemResult,
            index,
            currentPathComponent,
            functionName,
            functionArgPropertyPath,
            tmpResult,
            uniques;

        // PARSE: Determine the indices of the currentPathComponent we're concerned with

        if (currentPathComponentEndIndex > -1 && parenthesisStartIndex > -1) {
            // We have both a dot and an open parenthesis somewhere in the path, figure out the next path component
            if (currentPathComponentEndIndex > parenthesisStartIndex) {
                // The next dot was actually inside the function call; use the entire function call: foo.bar(a.b.c) -> bar(a.b.c)
                nextDelimiterIndex = parenthesisEndIndex + 1;
                functionName = aPropertyPath.substring(currentIndex, parenthesisStartIndex);
            } else {
                // The next dot comes before the start of the function parenthesis; use the dot: foo.bar(a.b.c) -> foo
                nextDelimiterIndex = currentPathComponentEndIndex;
            }
        } else {
            // We have either a dot, parenthesis, or neither
            if (parenthesisStartIndex > -1) {
                // we had a starting parenthesis; use the END parenthesis to include the entire function call
                nextDelimiterIndex = parenthesisEndIndex + 1;
                functionName = aPropertyPath.substring(currentIndex, parenthesisStartIndex);
            } else {
                nextDelimiterIndex = currentPathComponentEndIndex;
            }
        }

        // Find the component of the propertyPath we want to deal with during this particular invocation of this function
        currentPathComponent = propertyIsNumber ? aPropertyPath : aPropertyPath.substring(currentIndex, (nextDelimiterIndex === -1 ? aPropertyPath.length : nextDelimiterIndex));

        // EVALUATE: Determine the value of the currentPathComponent

        if (functionName) {
            // We have a function to execute as part of this propertyPath; execute it assuming that it will know
            // how to handle the property path being passed along

            // TODO do we call this before or after finding the result (probably before to maintain the chain
            // of one invocation's discovered value being the context of the next invocation
            if (visitedComponentCallback) {
                visitedComponentCallback(this, functionName + "()", null, null, null);
            }

            functionArgPropertyPath = aPropertyPath.substring(parenthesisStartIndex + 1, parenthesisEndIndex);
            result = this[functionName](functionArgPropertyPath, visitedComponentCallback);


        } else {

            // TODO we don't provide any way to access properties that are actually accessible on the array itself
            // we assume that by default, any property in a propertyPath after an array refers to a property
            // you are interested in getting on each member of the array

            if (isNaN(currentPathComponent)) {

                if (visitedComponentCallback) {
                    //console.log("....",  currentPathComponent, aPropertyPath , currentPathComponentEndIndex != -1 ? aPropertyPath.slice(currentPathComponentEndIndex + 1) : null);
                    //console.log(aPropertyPath.slice(currentIndex));
                    visitedComponentCallback(this, null, undefined, null, aPropertyPath.slice(currentIndex));
                }

                result = [];
                index = 0;

                // The currentPathComponent is some property not directly on this array, and not an index in the array
                // so we'll be getting an array of resolving this currentPathComponent on each member in the array
                if (preserve) {

                    while((itemResult = this[index]) != null) {
                        result[index] = itemResult.getProperty(aPropertyPath, unique, preserve, visitedComponentCallback, currentIndex);
                        index++;
                    }

                } else {

                    // TODO in either case, why do we stop if we encounter null|undefined? there could be useful
                    // values after that in the collection. I already had to fix an issue here where a zero
                    // would short-circuit the loop
                    while((itemResult = this[index]) != null) {
                        tmpResult = itemResult.getProperty(aPropertyPath, unique, preserve, visitedComponentCallback, currentIndex);

                        if (Array.isArray(tmpResult)) {
                            result = result.concat(tmpResult);
                        } else {
                            result[index] = tmpResult;
                        }
                        index++;
                    }

                    if (unique) {
                        var uniques = {}; // TODO reuse this object if possible
                        // TODO don't recreate this filter function each time
                        result = result.filter(function(element) {
                            return uniques[element] ? false : (uniques[element] = true);
                        });
                    }

                }

            } else {

                // The currentPathComponent is an index into this array
                result = this[currentPathComponent];


                if (visitedComponentCallback) {
                    visitedComponentCallback(this, currentPathComponent, result, null, currentPathComponentEndIndex != -1 ? aPropertyPath.slice(currentPathComponentEndIndex + 1) : null);
                }

                if (currentPathComponentEndIndex > 0) {
                    result = result ? result.getProperty(aPropertyPath, unique, preserve, visitedComponentCallback, currentPathComponentEndIndex + 1) : undefined;
                } else if (visitedComponentCallback && currentPathComponentEndIndex === -1 && result) {
                    // If we're at the end of the path, but have a result, visit it
                    //visitedComponentCallback(result, null, null, null, null);
                }
            }
        }

        return result;
    },
    enumerable: false
});

/**
Description
@function external:Array#sum
@param {Object} propertyPath
@param {Function} visitedCallback
@returns sum
*/
Object.defineProperty(Array.prototype, "sum", {
    value: function(propertyPath, visitedCallBack) {
        var sum = 0, result, resultSum;
        if (propertyPath) {
            this.map(function(value) {
                result = value.getProperty(propertyPath, null, null, visitedCallBack);
                if (Array.isArray(result)) {
                    resultSum = 0;
                    result.map(function(value) {
                        return (resultSum += Number(value));
                    });
                    result = resultSum;
                }
                return (sum += Number(result));
            });
        }
        else {
            this.map(function(value) {
                return (sum += Number(value));
            });
        }
        return sum;
    }
});

/**
Description
@member external:Array#any
@function
@param {Object} propertyPath
@param {Function} visitedCallback
@returns result
*/
Object.defineProperty(Array.prototype, "any", {
    value: function(propertyPath, visitedCallback) {
        var result;
        if (propertyPath) {
            result = this.some(function(value) {
                return !!value.getProperty(propertyPath, null, null, visitedCallback);
            });
        } else {
            result = this.some(function(value) {
                return !!value;
            });
        }
        return result;
    }
});

/**
@member external:Array#count
@function
@returns this.length
*/
Object.defineProperty(Array.prototype, "count", {
    value: function() {
        return this.length;
    }
});
/**

 @function module:montage/core/core.Montage#undefinedGet
 @param {Object} aPropertyName The object property name.
 */
Object.defineProperty(M, "undefinedGet", {
    value: function(aPropertyName) {
        console.warn("get undefined property -" + aPropertyName + "-");
    },
    writable: true
});

/**
@member external:Array#undefinedGet
*/
Object.defineProperty(Array.prototype, "undefinedGet", {
    value: M.undefinedGet,
    writable: true
});

/**

 @function module:montage/core/core.Montage#undefinedSet
 @param {Object} aPropertyName The object property name.
 */
Object.defineProperty(M, "undefinedSet", {
    value: function(aPropertyName) {
        console.warn("set undefined property -" + aPropertyName + "-");
    },
    writable: true
});

/**
@member external:Array#undefinedSet
*/
Object.defineProperty(Array.prototype, "undefinedSet", {
    value: M.undefinedSet,
    writable: true
});

/**
@member external:Object#parentProperty
@default null
*/
Object.defineProperty(Object.prototype, "parentProperty", {
    enumerable: false,
    value: null,
    writable: true
});

// XXX Does not presently function server-side
if (typeof window !== "undefined") {

    var EventManager = require("core/event/event-manager").EventManager;
    EventManager.create().initWithWindow(window);

    // Now that we have a defaultEventManager we can setup the bindings system
    require("core/event/binding");

}

