/* <copyright>
Copyright (c) 2012, Motorola Mobility LLC.
All Rights Reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

* Redistributions of source code must retain the above copyright notice,
  this list of conditions and the following disclaimer.

* Redistributions in binary form must reproduce the above copyright notice,
  this list of conditions and the following disclaimer in the documentation
  and/or other materials provided with the distribution.

* Neither the name of Motorola Mobility LLC nor the names of its
  contributors may be used to endorse or promote products derived from this
  software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE
LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
POSSIBILITY OF SUCH DAMAGE.
</copyright> */
/*global Element */
/**
 @module montage/core/core
 @requires core/shim/object
 @requires core/shim/array
 @requires core/shim/string
 @requires core/extras/object
 @requires core/extras/array
 @requires core/extras/string
 @requires core/extras/function
 @requires core/extras/date
 @requires core/extras/element
 @requires core/extras/regexp
*/
require("collections/shim");
require("core/shim/object");
require("core/shim/array");
require("core/shim/string");
require("core/extras/object");
require("core/extras/array");
require("core/extras/date");
require("core/extras/element");
require("core/extras/function");
require("core/extras/regexp");
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
        // Allow aPrototype to be undefined to create() this
        if (aPrototype !== undefined && typeof aPrototype !== "object") {
            throw new TypeError("Object prototype may only be an Object or null, not '" + aPrototype + "'");
        }
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
        enumerable: true | false,
        serializable: "reference" | "value" | "auto" | false,
        value: null,
        writable: true | false
    });
*/
Object.defineProperty(Montage, "defineProperty", {

    value: function(obj, prop, descriptor) {
        if (typeof obj !== "object" || obj === null) {
            throw new TypeError("Object must be an object, not '" + obj + "'");
        }

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
        if (!descriptor.hasOwnProperty(SERIALIZABLE)) {
            if (! descriptor.enumerable) {
                descriptor.serializable = false;
            } else if (descriptor.get && !descriptor.set) {
                descriptor.serializable = false;
            } else if (descriptor.writable === false) {
                descriptor.serializable = false;
            }
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
                var defineInternalProperty = function(obj, internalProperty, value) {
                    Object.defineProperty(obj, internalProperty, {
                        enumerable: false,
                        configurable: true,
                        writable: true,
                        value: value
                    });
                };
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
                                    if(!this.hasOwnProperty(internalProperty)) {
                                        defineInternalProperty(this, internalProperty, returnValue);
                                    } else {
                                        this[internalProperty] = returnValue;
                                    }
                                }
                                return returnValue;
                            },
                            set: function(value) {
                                if(!this.hasOwnProperty(internalProperty)) {
                                    defineInternalProperty(this, internalProperty, value);
                                } else {
                                    this[internalProperty] = value;
                                }
                            }
                        });
                    } else {
                        Object.defineProperty(obj, prop, {
                            configurable: true,
                            get: function() {
                                var returnValue = this[internalProperty];
                                if (!returnValue) {
                                    returnValue = {};
                                    if (this.hasOwnProperty(internalProperty))  {
                                        this[internalProperty] = returnValue
                                    } else {
                                        defineInternalProperty(this, internalProperty, returnValue);
                                    }
                                }
                                return returnValue;
                            },
                            set: function(value) {
                                if(!this.hasOwnProperty(internalProperty)) {
                                    defineInternalProperty(this, internalProperty, value);
                                } else {
                                    this[internalProperty] = value;
                                }
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
                                    if(!this.hasOwnProperty(internalProperty)) {
                                        defineInternalProperty(this, internalProperty, returnValue);
                                    } else {
                                        this[internalProperty] = returnValue;
                                    }
                                }
                                return returnValue;
                            },
                            set: function(value) {
                                if(!this.hasOwnProperty(internalProperty)) {
                                    defineInternalProperty(this, internalProperty, value);
                                } else {
                                    this[internalProperty] = value;
                                }
                            }
                        });

                    } else {
                        Object.defineProperty(obj, prop, {
                            configurable: true,
                            get: function() {
                                var returnValue = this[internalProperty];
                                if (!returnValue) {
                                    returnValue = [];
                                    if (this.hasOwnProperty(internalProperty))  {
                                        this[internalProperty] = returnValue
                                    } else {
                                        defineInternalProperty(this, internalProperty, returnValue);
                                    }
                                }
                                return returnValue;
                            },
                            set: function(value) {
                                if(!this.hasOwnProperty(internalProperty)) {
                                    defineInternalProperty(this, internalProperty, value);
                                } else {
                                    this[internalProperty] = value;
                                }
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
                                if(!this.hasOwnProperty(internalProperty)) {
                                    defineInternalProperty(this, internalProperty, returnValue);
                                } else {
                                    this[internalProperty] = returnValue;
                                }
                            }
                            return returnValue;
                        },
                        set: function(value) {
                            if(!this.hasOwnProperty(internalProperty)) {
                                defineInternalProperty(this, internalProperty, value);
                            } else {
                                this[internalProperty] = value;
                            }
                        }
                    });


                } else {
                    Object.defineProperty(obj, prop, {
                        configurable: true,
                        get: function() {
                            var returnValue = this[internalProperty];
                            if (!returnValue) {
                                returnValue = Object.create(value.__proto__ || Object.getPrototypeOf(value));
                                if (this.hasOwnProperty(internalProperty))  {
                                    this[internalProperty] = returnValue
                                } else {
                                    defineInternalProperty(this, internalProperty, returnValue);
                                }
                            }
                            return returnValue;
                        },
                        set: function(value) {
                            if(!this.hasOwnProperty(internalProperty)) {
                                defineInternalProperty(this, internalProperty, value)
                            } else {
                                this[internalProperty] = value;
                            }
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
    if (typeof properties !== "object" || properties === null) {
        throw new TypeError("Properties must be an object, not '" + properties + "'");
    }
    for (var property in properties) {
        if ("_bindingDescriptors" !== property) {
            this.defineProperty(obj, property, properties[property]);
        }
    }
    return obj;
}});

var _defaultAccessorProperty = {
    enumerable: true,
    configurable: true,
    serializable: "reference"
};
var _defaultObjectValueProperty = {
    writable: true,
    enumerable: true,
    configurable: true,
    serializable: "reference"
};
var _defaultFunctionValueProperty = {
    writable: true,
    enumerable: false,
    configurable: true,
    serializable: false
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
        Montage.defineProperty(obj, "_dependenciesForProperty", {
            value: {}
        });
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
    Get the metadata Montage has on the given object
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
    @function module:montage/core/core.Montage.self
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

// HACK: This is to fix an IE10 bug where a getter on the window prototype chain
// gets some kind of proxy Window object which cannot have properties defined
// on it, instead of the `window` itself. Adding the uuid directly to the
// window removes the needs to call the getter.
if (typeof window !== "undefined") {
    window.uuid = UUID.generate();
}

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
    @function module:montage/core/core.Montage.equals
    @param {Object} anObject The object to compare for equality.
    @returns {Boolean} Returns <code>true</code> if the calling object and <code>anObject</code> are identical and their <code>uuid</code> properties are also equal. Otherwise, returns <code>false</code>.
*/
Object.defineProperty(Montage, "equals", {
    value: function(anObject) {
        return this === anObject || this.uuid === anObject.uuid;
    }
});

/*
    This method calls the method named with the identifier prefix if it exists.
    Example: If the name parameter is "shouldDoSomething" and the caller's identifier is "bob", then
    this method will try and call "bobShouldDoSomething"
    @function module:montage/core/core.Montage.callDelegateMethod
    @param {string} name
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

/*
 * Defines the module Id for blueprints. This is externalized so that it can be subclassed.
 * <b>Note</b> This is a class method beware...
 */
exports._blueprintModuleIdDescriptor = {
    serializable:false,
    enumerable: false,
    get:function () {
        var info = Montage.getInfoForObject(this);
        var self = (info && !info.isInstance) ? this : Object.getPrototypeOf(this);
        if ((!Object.getOwnPropertyDescriptor(self, "_blueprintModuleId")) || (!self._blueprintModuleId)) {
            info = Montage.getInfoForObject(self);
            var moduleId = info.moduleId,
                slashIndex = moduleId.lastIndexOf("/"),
                dotIndex = moduleId.lastIndexOf(".");
            slashIndex = ( slashIndex === -1 ? 0 : slashIndex + 1 );
            dotIndex = ( dotIndex === -1 ? moduleId.length : dotIndex );
            dotIndex = ( dotIndex < slashIndex ? moduleId.length : dotIndex );
            Montage.defineProperty(self, "_blueprintModuleId", {
                enumerable: false,
                value: moduleId.slice(0, dotIndex) + "-blueprint.json"
            });
        }
        return self._blueprintModuleId;
    }
};

exports._blueprintDescriptor = {
    serializable:false,
    enumerable: false,
    get:function () {
        var info = Montage.getInfoForObject(this);
        var self = (info && !info.isInstance) ? this : Object.getPrototypeOf(this);
        if ((!Object.getOwnPropertyDescriptor(self, "_blueprint")) || (!self._blueprint)) {
            var blueprintModuleId = self.blueprintModuleId;
            if (blueprintModuleId === "") {
                throw new TypeError("Blueprint moduleId undefined for the module '" + JSON.stringify(self) + "'");
            }

            if (!exports._blueprintDescriptor.BlueprintModulePromise) {
                exports._blueprintDescriptor.BlueprintModulePromise = require.async("core/meta/blueprint").get("Blueprint");
            }
            Montage.defineProperty(self, "_blueprint", {
                enumerable: false,
                value: exports._blueprintDescriptor.BlueprintModulePromise.then(function (Blueprint) {
                    var info = Montage.getInfoForObject(self);
                    return Blueprint.getBlueprintWithModuleId(blueprintModuleId, info.require).then(null, function () {
                        var blueprint = Blueprint.createDefaultBlueprintForObject(self);
                        blueprint.blueprintInstanceModuleId = blueprintModuleId;
                        return blueprint;
                    });
                })
            });
        }
        return self._blueprint;
    },
    set:function (value) {
        var info = Montage.getInfoForObject(this);
        var _blueprintValue;
        var self = (info && !info.isInstance) ? this : Object.getPrototypeOf(this);
        if (value === null) {
            _blueprintValue = null;
        } else if (typeof value.then === "function") {
            throw new TypeError("Object blueprint should not be a promise '" + JSON.stringify(value) + "'");
        } else {
            value.blueprintInstanceModuleId = self.blueprintModuleId;
            _blueprintValue = require("core/promise").Promise.resolve(value);
        }
        Montage.defineProperty(self, "_blueprint", {
            enumerable: false,
            value: _blueprintValue
        });
    }
};
