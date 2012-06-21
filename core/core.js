/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2012 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
/*global Element */
/**
 @module montage/core/core
 @requires montage/core/shim
 @requires montage/core/uuid
 @requires montage/core/event/binding
 @requires montage/core/event/event-manager
 */
require("core/shim/object");
require("core/shim/array");
require("core/extras/object");
require("core/extras/array");
require("core/extras/string");

var ATTRIBUTE_PROPERTIES = "AttributeProperties",
    UNDERSCORE = "_",
    PROTO = "__proto__",
    VALUE = "value",
    ENUMERABLE = "enumerable",
    DISTINCT = "distinct",
    SERIALIZABLE = "serializable",
    MODIFY = "modify";

/**
 @private
 */
var Array_prototype = Array.prototype;

/**
 @private
 */
var Object_prototype = Object.prototype;

/**
 @class module:montage/core/core.Montage
 */
var Montage = exports.Montage = {};

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
Object.defineProperty(Montage, "create", {
    configurable: true,
    value: function(aPrototype, propertyDescriptor) {
        if (!propertyDescriptor) {

            var newObject = Object.create(typeof aPrototype === "undefined" ? this : aPrototype);

            if (typeof newObject.didCreate === "function") {
                newObject.didCreate();
            }

            return newObject;
        } else {
            var result = Object.create(aPrototype);
            Montage.defineProperties(result, propertyDescriptor);
            return result;
        }
    }
});

var extendedPropertyAttributes = [SERIALIZABLE];

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
Object.defineProperty(Montage, "defineProperty", {

    value: function(obj, prop, descriptor) {

        var dependencies = descriptor.dependencies,
            isValueDescriptor = (VALUE in descriptor);

        if (DISTINCT in descriptor && !isValueDescriptor) {
            throw ("Cannot use distinct attribute on non-value property '" + prop + "'");
        }


        //reset defaults appropriately for framework.
        if (PROTO in descriptor) {
            descriptor.__proto__ = (isValueDescriptor ? (typeof descriptor.value === "function" ? _defaultFunctionValueProperty : _defaultObjectValueProperty) : _defaultAccessorProperty);
        } else {
            var defaults;
            if (isValueDescriptor) {
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
                Montage.addDependencyToProperty(obj, independentProperty, prop);
            }

        }

        if (SERIALIZABLE in descriptor) {
            // get the _serializableAttributeProperties property or creates it through the entire chain if missing.
            getAttributeProperties(obj, SERIALIZABLE)[prop] = descriptor.serializable;
        }

        //this is added to enable value properties with [] or Objects that are new for every instance
        if (descriptor.distinct === true && typeof descriptor.value === "object") {
            (function(prop,internalProperty, value, obj) {
                Object.defineProperty(obj, internalProperty, {
                    enumerable: false,
                    configurable: true,
                    writable: true,
                    value: null
                });
                if (value.constructor === Object && Object.getPrototypeOf(value) === Object_prototype) {
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

                } else if ((value.__proto__ || Object.getPrototypeOf(value)) === Array_prototype) {
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
                                //Object_prototype.toString.call(Object.create([].__proto)) !== "[object Array]"
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
            })(prop, UNDERSCORE + prop, descriptor.value, obj);

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
Object.defineProperty(Montage, "defineProperties", {value: function(obj, properties) {
    for (var property in properties) {
        if ("_bindingDescriptors" !== property) {
            this.defineProperty(obj, property, properties[property]);
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
     Adds a dependent property to another property's collection of dependencies.
     When the value of a dependent property changes, it generates a <code>change@independentProperty</code> event.
     @function module:montage/core/core.Montage.addDependencyToProperty
     @param {Object} obj The object containing the dependent and independent properties.
     @param {String} independentProperty The name of the object's independent property.
     @param {String} dependentProperty The name of the object's dependent property.
     */
Montage.defineProperty(Montage, "addDependencyToProperty", { value: function(obj, independentProperty, dependentProperty) {

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
Montage.defineProperty(Montage, "removeDependencyFromProperty", {value: function(obj, independentProperty, dependentProperty) {
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
     Returns the names of serializable properties belonging to Montage object.
     @function module:montage/core/core.Montage.getSerializablePropertyNames
     @param {Object} anObject A Montage object.
     @returns {Array} An array containing the names of the serializable properties belonging to <code>anObject</code>.
     */
Montage.defineProperty(Montage, "getSerializablePropertyNames", {value: function(anObject) {

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
Montage.defineProperty(Montage, "getPropertyAttribute", {value: function(anObject, propertyName, attributeName) {

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
Montage.defineProperty(Montage, "getPropertyAttributes", {value: function(anObject, attributeName) {
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
Montage.defineProperty(Montage, "getInfoForObject", {
    value: function(object) {
        var metadata;
        var instanceMetadataDescriptor;

        if (hasOwnProperty.call(object, "_montage_metadata")) {
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

Object.defineProperty(Montage, "doNothing", {
    value: function() {
    }
});

/**
    @function module:montage/core/core.Montage#self
    @default function
    @returns itself
    */
Object.defineProperty(Montage, "self", {
    value: function() {
        return this;
    }
});

/**
    @private
    */
Object.defineProperty(Montage, "__OBJECT_COUNT", {
    value: 0,
    writable: true
});


// TODO figure out why this code only works in this module.  Attempts to move
// it to core/extras/object resulted in _uuid becoming enumerable and tests
// breaking.

var UUID = require("core/uuid");

var hasOwnProperty = Object.prototype.hasOwnProperty;

var uuidGetGenerator = function() {

    var uuid = UUID.generate(),
        info = Montage.getInfoForObject(this);
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
    return (hasOwnProperty.call(this, "_uuid") ? this._uuid : uuidGetGenerator.call(this));
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

Montage.defineProperty(Montage, "identifier", {
    value: null,
    serializable: true
});

/**
     Returns true if two objects are equal, otherwise returns false.
     @function module:montage/core/core.Montage#equals
     @param {Object} anObject The object to compare for equality.
     @returns {Boolean} Returns <code>true</code> if the calling object and <code>anObject</code> are identical and their <code>uuid</code> properties are also equal. Otherwise, returns <code>false</code>.
     */
Object.defineProperty(Montage, "equals", {
    value: function(anObject) {
        return this === anObject || this.uuid === anObject.uuid;
    }
});



/*
 * If it exists this method calls the method named with the identifier prefix.
 * Example: If the name parameter is "shouldDoSomething" and the caller's identifier is "bob", then
 * this method will try and call "bobShouldDoSomething"
*/

/**
 * @function module:montage/core/core.Montage#callDelegateMethod
 * @param {string} name
 */
Object.defineProperty(Montage, "callDelegateMethod", {
    value: function(name) {
        var delegate = this.delegate, delegateFunctionName, delegateFunction;
        if (typeof this.identifier === "string") {
            delegateFunctionName = this.identifier + name.toCapitalized();
            if (delegate && typeof (delegateFunction = delegate[delegateFunctionName]) === "function") {
                // remove first argument
                Array_prototype.shift.call(arguments);
                return delegateFunction.apply(delegate, arguments);
            }
        }

        if (delegate && typeof (delegateFunction = delegate[name]) === "function") {
            // remove first argument
            Array_prototype.shift.call(arguments);
            return delegateFunction.apply(delegate, arguments);
        }
    }
});
