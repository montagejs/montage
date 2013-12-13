/**
 @module montage
 @requires core/shim/object
 @requires core/shim/array
 @requires core/shim/string
 @requires core/extras/object
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

var Array_prototype = Array.prototype;

var Object_prototype = Object.prototype;

// The CONSTRUCTOR_COMPATIBILITY flag marks areas that allow the migration from
// Montage.create to Constructor.specialize The following is done:
// - Any properties defined on the prototype that are used on the constructor
//   fire a deperecation warning prompting the developer to move them to the
//   second argument of specialize().
// - Adds a create method to the constructor can be used as Proto.create().
// - Adds support for 'didCreate' so that it can be used interchangeably with
//   the 'constructor' property.
// - When calling Montage.create with a function as the first argument we use
//   the function as a constructor or call specialize on it to create a
//   subtype.
var CONSTRUCTOR_COMPATIBILITY = true;

/**
 * The Montage constructor provides conveniences for sub-typing
 * ([specialize]{@link Montage.specialize}) and common methods for Montage
 * prototype chains.
 * @class Montage
 * @classdesc The basis of all types using the MontageJS framework.
 */
var Montage = exports.Montage = function Montage() {};

// to monkey patch a method on an object
Montage.deprecate = function deprecate(scope, deprecatedFunction, name, alternative) {
    var deprecationWrapper = function () {
        var depth = Error.stackTraceLimit;
        Error.stackTraceLimit = 2;
        if (typeof console !== "undefined" && typeof console.warn === "function") {
            if(alternative) {
                console.warn(name + " is deprecated, use " + alternative + " instead.", new Error("").stack);
            } else {
                //name is a complete message
                console.warn(name, new Error("").stack);
            }

        }
        Error.stackTraceLimit = depth;
        return deprecatedFunction.apply(scope ? scope : this, arguments);
    };
    deprecationWrapper.deprecatedFunction = deprecatedFunction;
    return deprecationWrapper;
}

// too call a function immediately and log a deprecation warning
Montage.callDeprecatedFunction = function callDeprecatedFunction(scope, callback, name, alternative/*, ...args */) {
    var depth = Error.stackTraceLimit,
        scopeName,
        args;

    Error.stackTraceLimit = 2;
    if (typeof console !== "undefined" && typeof console.warn === "function") {
        scopeName = Montage.getInfoForObject(scope).objectName;

        if(alternative) {
            console.warn(name + " is deprecated, use " + alternative + " instead.", scopeName);
        } else {
            //name is a complete message
            console.warn(name, scopeName);
        }

    }
    Error.stackTraceLimit = depth;
    args = Array_prototype.slice.call(arguments, 4);
    return callback.apply(scope ? scope : this, args);
};

var PROTO_IS_SUPPORTED = {}.__proto__ === Object.prototype;
var PROTO_PROPERTIES_BLACKLIST = {"_montage_metadata": 1, "__state__": 1};
var FUNCTION_PROPERTIES = Object.getOwnPropertyNames(Function);

/**
 * Customizes a type with idiomatic JavaScript constructor and prototype
 * inheritance, using ECMAScript 5 property descriptors with customizations
 * for common usage in MontageJS.
 *
 * See {@link Montage.defineProperty}
 * @method Montage.specialize
 * @param {Object} prototypeProperties a object mapping property names to
 * customized Montage property descriptors, to be applied to the new
 * prototype
 * @param {?Object} constructorProperties a object mapping property names to
 * customized Montage property descriptors, to be applied to the new
 * constructor
 * @return {function} a constructor function for the new type, which
 * derrives prototypically from `this`, with a prototype that inherits
 * `this.prototype`, with the given property descriptors applied.
 */
Object.defineProperty(Montage, "specialize", {
    value: function specialize(prototypeProperties, constructorProperties) {
        var constructor, prototype, names, propertyName, property, i, constructorProperty,
            // check if this constructor has Montage capabilities
            parent = this,
            foreignParent = typeof this.specialize === "undefined";

        prototypeProperties = prototypeProperties || Object.empty;
        constructorProperties = constructorProperties || Object.empty;

        if (prototypeProperties.constructor && prototypeProperties.constructor.value) {
            constructor = prototypeProperties.constructor.value;
        } else if (prototypeProperties.didCreate && prototypeProperties.didCreate.value) {
            constructor = Montage.deprecate(null, prototypeProperties.didCreate.value, "didCreate", "constructor");
            //constructor = prototypeProperties.didCreate.value;
        } else {
            constructor = function Anonymous() {
                return this.superForValue("constructor")() || this;
                //return parent.apply(this, arguments) || this;
            };
        }
        if (PROTO_IS_SUPPORTED) {
            constructor.__proto__ = parent;
        } else {
            names = Object.getOwnPropertyNames(parent);
            for (var i = 0; i < names.length; i++) {
                propertyName = names[i];
                if (!(PROTO_PROPERTIES_BLACKLIST.hasOwnProperty(propertyName))) {
                    property = Object.getOwnPropertyDescriptor(constructor, propertyName);
                    if (!property || property.configurable) {
                        Montage.defineProperty(constructor, propertyName, Object.getOwnPropertyDescriptor(parent, propertyName));
                    }
                }
            }
            constructor.__constructorProto__ = parent;
            Montage.defineProperty(constructor, "isPrototypeOf", {
                value: function(object) {
                    while (object !== null) {
                        if(Object.getPrototypeOf(object) === this) {
                            return true;
                        }
                        object = Object.getPrototypeOf(object)
                    }
                    return false;
                },
                enumerable: false
            });
        }

        prototype = Object.create(this.prototype);

        if(foreignParent) {
            // give the constructor all the properties of Montage
            names = Object.getOwnPropertyNames(Montage);
            for ( i = 0; i < names.length; i++) {
                propertyName = names[i];
                property = Object.getOwnPropertyDescriptor(constructor, propertyName);
                if (!property || property.configurable) {
                    Montage.defineProperty(constructor, propertyName, Object.getOwnPropertyDescriptor(Montage, propertyName));
                }
            }
            // give the prototype all the properties of Montage.prototype
            names = Object.getOwnPropertyNames(Montage.prototype);
            for ( i = 0; i < names.length; i++) {
                propertyName = names[i];
                property = Object.getOwnPropertyDescriptor(constructor, propertyName);
                if (!property || property.configurable) {
                    Montage.defineProperty(prototype, propertyName, Object.getOwnPropertyDescriptor(Montage.prototype, propertyName));
                }
            }
        }

        Montage.defineProperties(prototype, prototypeProperties);

        if (CONSTRUCTOR_COMPATIBILITY) {
            // to catch class properties
            constructorProperty = function(original, constructor, propertyName) {
                function deprecationWrapper() {
                    if(this === constructor) {
                        console.warn("Deprecated - " + Montage.getInfoForObject(constructor).objectName + "."
                            + propertyName + " should be moved to constructorProperties");
                    }
                    return original.apply(this, arguments);
                }
                deprecationWrapper.deprecatedFunction = original;
                return deprecationWrapper;
            };
            for (propertyName in prototypeProperties) {
                if(FUNCTION_PROPERTIES.has(propertyName)) {
                    // illegal properties on function
                    delete prototypeProperties[propertyName];
                } else {
                    property = prototypeProperties[propertyName];
                    if(property.value && typeof property.value === "function" && !property.value.__isConstructor__) {
                        property.value = constructorProperty(property.value, constructor, propertyName);
                    } else {
                        if(property.get) {
                            property.get = constructorProperty(property.get, constructor, propertyName);
                         }
                        if(property.set) {
                            property.set = constructorProperty(property.set, constructor, propertyName);
                        }
                    }
                }
            }
            Montage.defineProperties(constructor, prototypeProperties);
            Montage.defineProperty(constructor, "create", {
                value: function() {
                    return new constructor();
                },
                enumerable: false
            });
            if (! prototype.hasOwnProperty("didCreate")) {
                Montage.defineProperty(prototype, "didCreate", {
                    value: constructor,
                    enumerable: false
                });
            }
            if (! constructor.hasOwnProperty("didCreate")) {
                Montage.defineProperty(constructor, "didCreate", {
                    value: constructor,
                    enumerable: false
                });
            }
        }
        // end compatibility code
        // needs to be done afterwards so that it overrides any prototype properties
        Montage.defineProperties(constructor, constructorProperties);
        Montage.defineProperty(constructor, "__isConstructor__", {
            value: true,
            enumerable: false
        });
        Montage.defineProperty(constructor, "_superCache", {
            value: {},
            enumerable: false
        });
        constructor.prototype = prototype;
        Montage.defineProperty(prototype, "constructor", {
            value: constructor,
            enumerable: false
        });
        return constructor;

    },
    writable: true,
    configurable: true,
    enumerable: false
});
if (!PROTO_IS_SUPPORTED) {
    // If the __proto__ property isn't supported than we need to patch up behavior for constructor functions
    var originalGetPrototypeOf = Object.getPrototypeOf;
    Object.getPrototypeOf = function getPrototypeOf(object) {
        if (typeof object === "function" && object.__constructorProto__) {
            // we have set the __constructorProto__ property of the function to be it's parent constructor
            return object.__constructorProto__;
        } else {
            return originalGetPrototypeOf.apply(Object, arguments);
        }
    };
}

// DEPRECATED
Object.defineProperty(Montage, "create", {
    configurable: true,
    value: function(aPrototype, propertyDescriptors) {
        if (aPrototype !== undefined && (typeof aPrototype !== "object"
                && /* CONSTRUCTOR_COMPATIBILITY*/typeof aPrototype !== "function")) {
            throw new TypeError("Object prototype may only be an Object or null, not '" + aPrototype + "'");
        }
        aPrototype = typeof aPrototype === "undefined" ? this : aPrototype;
        // CONSTRUCTOR_COMPATIBILITY
        // if aPrototype is a function then we behave as a constructor.
        if (typeof aPrototype === "function") {
            if (!propertyDescriptors) {
                return new aPrototype();
            } else {
                return aPrototype.specialize(propertyDescriptors);
            }
            // Otherwise behave like Object.create()
        } else {
            var result = Object.create(aPrototype);
            if(propertyDescriptors) {
                Montage.defineProperties(result, propertyDescriptors);
            }
            return result;
        }
    }
});

var extendedPropertyAttributes = [SERIALIZABLE];

// Extended property attributes, the property name format is "_" + attributeName + "AttributeProperties"
/**
 * @member external:Object#extendedPropertyAttributes
 */
extendedPropertyAttributes.forEach(function(name) {
    Object.defineProperty(Object.prototype, UNDERSCORE + name + ATTRIBUTE_PROPERTIES, {
        enumerable: false,
        configurable: false,
        writable: true,
        value: {}
    });
});

/**
 * Defines a property on an object using a Montage property descriptor.
 * Montage property descriptors extend and slightly vary ECMAScript 5 property
 * descriptors.
 *
 *  - `value`
 *  - `get`
 *  - `set`
 *  - `enumerable` is `true` by default, but `false` if `value` is a function
 *  - `writable` is `true` by default, but `false` if the `name` begins with
 *    an underscore, `_`.
 *  - `configurable` is `true` by default
 *  - `distinct` is deprecated, but conveys the intention that the `value`
 *    should be duplicated for each instance, but the means of cloning is
 *    ill-defined and temperamental.
 *
 * @function Montage.defineProperty
 * @method Montage.defineProperty
 * @param {Object} object The object on which to define the property.
 * @param {string} name The name of the property to define, or modify.
 * @param {Object} descriptor A descriptor object that defines the properties
 * being defined or modified.
 * @example
 * Montage.defineProperty(Object.prototype, "_eventListenerDescriptors", {
 *     enumerable: true | false,
 *     serializable: "reference" | "value" | "auto" | false,
 *     value: null,
 *     writable: true | false
 * });
 */
Object.defineProperty(Montage, "defineProperty", {

    value: function(obj, prop, descriptor) {
        if (! (typeof obj === "object" || typeof obj === "function") || obj === null) {
            throw new TypeError("Object must be an object, not '" + obj + "'");
        }

        var isValueDescriptor = (VALUE in descriptor);

        if (DISTINCT in descriptor && !isValueDescriptor) {
            throw new TypeError("Cannot use distinct attribute on non-value property '" + prop + "'");
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

        if (SERIALIZABLE in descriptor) {
            // get the _serializableAttributeProperties property or creates it through the entire chain if missing.
            getAttributeProperties(obj, SERIALIZABLE)[prop] = descriptor.serializable;
        }

        // TODO replace this with Object.clone from collections - @kriskowal
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
            // clear the cache in any descendants that use this property for super()
            var superDependencies, i, j;
            if (obj._superDependencies) {
                if (typeof descriptor.value === "function" && (superDependencies = obj._superDependencies[prop + ".value"])) {
                    for (i=0,j=superDependencies.length;i<j;i++) {
                        delete superDependencies[i]._superCache[prop + ".value"];
                    }
                }
                if (typeof descriptor.get === "function" && (superDependencies = obj._superDependencies[prop + ".get"])) {
                    for (i=0,j=superDependencies.length;i<j;i++) {
                        delete superDependencies[i]._superCache[prop + ".get"];
                    }
                }
                if (typeof descriptor.set === "function" && (superDependencies = obj._superDependencies[prop + ".set"])) {
                    for (i=0,j=superDependencies.length;i<j;i++) {
                        delete superDependencies[i]._superCache[prop + ".set"];
                    }
                }
            }

            return Object.defineProperty(obj, prop, descriptor);
        }
    }});

/**
 * Defines one or more new properties to an object, or modifies existing
 * properties on the object.
 * @see {@link Montage.defineProperty}
 * @function Montage.defineProperties
 * @param {Object} object The object to which the properties are added.
 * @param {Object} properties An object that maps names to Montage property
 * descriptors.
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
    serializable: true
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

function getAttributeProperties(proto, attributeName) {
    var attributePropertyName = UNDERSCORE + attributeName + ATTRIBUTE_PROPERTIES;

    if (proto.hasOwnProperty(attributePropertyName)) {
        return proto[attributePropertyName];
    } else {
        return Object.defineProperty(proto, attributePropertyName, {
            enumerable: false, configurable: false, writable: true,
            value: Object.create(getAttributeProperties(Object.getPrototypeOf(proto), attributeName))
        })[attributePropertyName];
    }
}

Montage.defineProperty(Montage, "didCreate", {
    value: Function.noop
});

var getSuper = function(object, method) {
    var propertyNames, proto, i, propCount, propertyName, func, context, foundSuper, property;
    if (!(method._superPropertyName && method._superPropertyType)) {
        Montage.defineProperty(method, "_superPropertyType", {value:null});
        Montage.defineProperty(method, "_superPropertyName", {value:null});
        context = object;
        while (!foundSuper && context !== null) {
            propertyNames = Object.getOwnPropertyNames(context);
            proto = Object.getPrototypeOf(context);
            i = 0;
            propCount = propertyNames.length;
            for (i; i < propCount; i++) {
                propertyName = propertyNames[i];
                property = Object.getOwnPropertyDescriptor(context, propertyName);
                if ((func = property.value) != null) {
                    if (func === method || func.deprecatedFunction === method) {
                        method._superPropertyType = "value";
                        method._superPropertyName = propertyName;
                        foundSuper = true;
                        break;
                    }
                }
                if ((func = property.get) != null) {
                    if (func === method || func.deprecatedFunction === method) {
                        method._superPropertyType = "get";
                        method._superPropertyName = propertyName;
                        foundSuper = true;
                        break;
                    }
                }
                if ((func = property.set) != null) {
                    if (func === method || func.deprecatedFunction === method) {
                        method._superPropertyType = "set";
                        method._superPropertyName = propertyName;
                        foundSuper = true;
                        break;
                    }
                }
            }
            context = proto;
        }
    }
    return superForImplementation(object, method._superPropertyType, method._superPropertyName);
};


var superImplementation = function super_() {
    if (typeof superImplementation.caller !== "function") {
        throw new TypeError("Can't get super without caller. Use this.superForValue(methodName) if using strict mode.");
    }
    var superFunction = getSuper(this, superImplementation.caller);
    return typeof superFunction === "function" ? superFunction.bind(this) : Function.noop;
};

var superForImplementation = function (object, propertyType, propertyName) {
    var superFunction, superObject, property, cacheObject, boundSuper,
        context = object,
        cacheId = propertyName + "." + propertyType;

    if (!object._superContext) {
        Montage.defineProperty(object, "_superContext", {
            value: {}
        });
    }
    // is there a super context for this call? I.e. does the super() call originate in an ancestor of object?
    // If so, we use that object as the starting point (context) when looking for the super method.
    if (object._superContext[cacheId]) {
        context = object._superContext[cacheId];
    } else {
        // find out where in the prototype chain the calling function belongs
        context = object;
        while (context !== null) {
            if (context.hasOwnProperty(propertyName)) {
                property = Object.getOwnPropertyDescriptor(context, propertyName);
                if (typeof property[propertyType] === "function") {
                    break;
                }
            }
            context = Object.getPrototypeOf(context);
        }
    }

    cacheObject = context.constructor;

    // is the super for this method in the cache?
    if (cacheObject._superCache && cacheObject._superCache[cacheId]) {
        boundSuper = (function(cacheId, object, superObject, superFunction) {
            return function() {
                object._superContext[cacheId] = superObject;
                var retVal = superFunction.apply(object, arguments);
                delete object._superContext[cacheId];
                return retVal;
            };
        })(cacheId, object, cacheObject._superCache[cacheId].owner, cacheObject._superCache[cacheId].func);
        return boundSuper;
    }

    // search the prototype chain for a parent that has a matching method
    superObject = context;
    while (typeof superFunction === "undefined" && (superObject = Object.getPrototypeOf(superObject))) {
        if (!superObject._superDependencies) {
            Montage.defineProperty(superObject, "_superDependencies", {
                value: {}
            });
        }
        if (!superObject._superDependencies[cacheId]) {
            superObject._superDependencies[cacheId] = [];
        }
        superObject._superDependencies[cacheId].push(cacheObject);
        property = Object.getOwnPropertyDescriptor(superObject, propertyName);
        if (property) {
            if (typeof property[propertyType] === "function") {
                superFunction = property[propertyType];
                break;
            } else {
                // parent has property but not the right type
                break;
            }
        }
    }

    if (typeof superFunction === "function") {
        // we wrap the super method in a function that saves the context on the object
        // and immediately clears it again after the super has been called. This is needed
        // in case superFunction also calls superFor*() so superForImplementation() knows
        // which object owns the calling method.
        boundSuper = (function(cacheId, object, superObject, superFunction) {
            return function() {
                object._superContext[cacheId] = superObject;
                var retVal = superFunction.apply(object, arguments);
                delete object._superContext[cacheId];
                return retVal;
            };
        })(cacheId, object, superObject, superFunction);

        if (!cacheObject._superCache) {
            Montage.defineProperty(cacheObject, "_superCache", {
                value: {}
            });
        }

        // cache the super and the object we found it on
        cacheObject._superCache[cacheId] = {
            func: superFunction,
            owner: superObject
        };
        return boundSuper;
    } else {
        return Function.noop;
    }
};

var superForValueImplementation = function (propertyName) {
    return superForImplementation(this, "value", propertyName);
};
var superForGetImplementation = function (propertyName) {
    return superForImplementation(this, "get", propertyName);
};
var superForSetImplementation = function (propertyName) {
    return superForImplementation(this, "set", propertyName);
};

/**
 * Calls the method with the same name as the caller from the parent of the
 * constructor that contains the caller, falling back to a no-op if no such
 * method exists.
 * @method Montage.super
 * @return {function} this constructor’s parent constructor.
 */
Montage.defineProperty(Montage, "super", {
    get: superImplementation,
    enumerable: false
});

/**
 * Calls the method with the same name as the caller from the parent of the
 * prototype that contains the caller, falling back to a no-op if no such
 * method exists.
 */
Montage.defineProperty(Montage.prototype, "super", {
    get: superImplementation,
    enumerable: false
});

/**
 * Calls the method with the given name from the parent of the constructor that
 * contains the caller, falling backto no-op if no such method exists.
 * @param {string} name
 * @param ...arguments to forward to the parent method
 */
Montage.defineProperty(Montage, "superForValue", {
    value: superForValueImplementation,
    enumerable: false
});

/**
 * Calls the method with the given name from the parent of the prototype that
 * contains the caller, falling backto no-op if no such method exists.
 * @param {string} name
 * @param ...arguments to forward to the parent method
 */
Montage.defineProperty(Montage.prototype, "superForValue", {
    value: superForValueImplementation,
    enumerable: false
});

Montage.defineProperty(Montage, "superForGet", {
    value: superForGetImplementation,
    enumerable: false
});
Montage.defineProperty(Montage.prototype, "superForGet", {
    value: superForGetImplementation,
    enumerable: false
});

Montage.defineProperty(Montage, "superForSet", {
    value: superForSetImplementation,
    enumerable: false
});
Montage.defineProperty(Montage.prototype, "superForSet", {
    value: superForSetImplementation,
    enumerable: false
});

/**
 * Returns the names of serializable properties belonging to Montage object.
 * @function Montage.getSerializablePropertyNames
 * @param {Object} anObject A Montage object.
 * @returns {Array} An array containing the names of the serializable
 * properties belonging to `anObject`.
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
    @function Montage.getPropertyAttribute
    @param {Object} anObject A object.
    @param {string} propertyName The name of a property belonging to
    `anObject`.
    @param {string} attributeName The name of a property's attribute.
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
    @function Montage.getPropertyAttributes
    @param {Object} anObject An object.
    @param {string} attributeName The attribute name.
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
    @function Montage.getInfoForObject
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

            // don't modify the Object prototype, because this will cause
            // future calls to Montage.getInfoForObject on objects without
            // their own _montage_metadata property to return this one
            if (object === Object.prototype) {
                return Object.create(metadata, instanceMetadataDescriptor);
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

// TODO figure out why this code only works in this module.  Attempts to move
// it to core/extras/object resulted in _uuid becoming enumerable and tests
// breaking. - @kriskowal

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
            if (this instanceof Element || !info.isInstance || !(VALUE in (Object.getOwnPropertyDescriptor(this, "uuid")||{})) || !(PROTO in this /* lame way to detect IE */)) {
                //This is needed to workaround some bugs in Safari where re-defining uuid doesn't work for DOMWindow.
                this._uuid = uuid;
            }
        }
    } catch(e) {
        // NOTE Safari (as of Version 5.0.2 (6533.18.5, r78685)
        // doesn't seem to allow redefining an existing property on a DOM Element
        // Still want to redefine the property where possible for speed
    }

    // NOTE Safari (as of Version 6.1 8537.71) has a bug related to ES5
    // property values. In some situations, even when the uuid has already
    // be defined as a property value, accessing the uuid of an object can
    // make it go through the defaultUuidGet like if the property descriptor
    // was still the original one. When that happens a new uuid is created
    // for that object. To avoid that we always make sure that the object
    // have a _uuid that will be looked up to at defaultUuidGet() before
    // generating a new one. This mechanism was created to work around an
    // issue with Safari that didn't allow redefining property descriptors
    // in DOM elements.
    this._uuid = uuid;

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
Montage.defineProperty(Montage.prototype, "identifier", {
    value: null,
    serializable: true
});

/**
 * Returns true if two objects are equal, otherwise returns false.
 * @method Montage#equals
 * @param {Object} anObject The object to compare for equality.
 * @returns {boolean} Returns `true` if the calling object and
 * `anObject` are identical and their `uuid` properties
 * are also equal. Otherwise, returns `false`.
 */
Montage.defineProperty(Montage.prototype, "equals", {
    value: function(anObject) {
        if (!anObject) return false;
        return this === anObject || this.uuid === anObject.uuid;
    }
});

Montage.defineProperty(Montage, "equals", {
    value: Montage.prototype.equals
});

/**
 * This method calls the method named with the identifier prefix if it exists.
 * Example: If the name parameter is "shouldDoSomething" and the caller's identifier is "bob", then
 * this method will try and call "bobShouldDoSomething"
 * @method Montage#callDelegateMethod
 * @param {string} name
*/
Montage.defineProperty(Montage.prototype, "callDelegateMethod", {
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

var PropertyChanges = require("collections/listen/property-changes");

Object.addEach(Montage, PropertyChanges.prototype);
Object.addEach(Montage.prototype, PropertyChanges.prototype);

// have to come last since they use the Montage.defineProperties to augment Object.prototype
require("core/bindings");
require("core/paths");
// has to come last since serializer and deserializer depend on logger, which
// in turn depends on montage running to completion
require("core/serialization/bindings");

/*
 * Defines the module Id for blueprints. This is externalized so that it can be subclassed.
 * <b>Note</b> This is a class method beware...
 */
exports._blueprintModuleIdDescriptor = {
    serializable:false,
    enumerable: false,
    get:function () {
        var info = Montage.getInfoForObject(this);
        var self = (info && !info.isInstance) ? this : this.constructor;
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
                value: moduleId.slice(0, dotIndex) + ".meta"
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
        var self = (info && !info.isInstance) ? this : this.constructor;
        if ((!Object.getOwnPropertyDescriptor(self, "_blueprint")) || (!self._blueprint)) {
            var blueprintModuleId = self.blueprintModuleId;
            if (blueprintModuleId === "") {
                throw new TypeError("Blueprint moduleId undefined for the module '" + JSON.stringify(self) + "'");
            }

            if (!exports._blueprintDescriptor.BlueprintModulePromise) {
                exports._blueprintDescriptor.BlueprintModulePromise = require.async("core/meta/module-blueprint").get("ModuleBlueprint");
            }
            Montage.defineProperty(self, "_blueprint", {
                enumerable: false,
                value: exports._blueprintDescriptor.BlueprintModulePromise.then(function (Blueprint) {
                    var info = Montage.getInfoForObject(self);

                    return Blueprint.getBlueprintWithModuleId(blueprintModuleId, info.require)
                    .fail(function (error) {
                        // FIXME only generate blueprint if the moduleId
                        // requested does not exist. If any parents do not
                        // exist then the error should still be thrown.
                        if (error.message.indexOf("Can't XHR") !== -1) {
                            return Blueprint.createDefaultBlueprintForObject(self).then(function (blueprint) {
                                return blueprint;
                            });
                        } else {
                            throw error;
                        }
                    });
                })
            });
        }
        return self._blueprint;
    },
    set:function (value) {
        var info = Montage.getInfoForObject(this);
        var _blueprintValue;
        var self = (info && !info.isInstance) ? this : this.constructor;
        if (value === null) {
            _blueprintValue = null;
        } else if (typeof value.then === "function") {
            throw new TypeError("Object blueprint should not be a promise");
        } else {
            value.blueprintInstanceModule = self.blueprintModule;
            _blueprintValue = require("core/promise").Promise.resolve(value);
        }
        Montage.defineProperty(self, "_blueprint", {
            enumerable: false,
            value: _blueprintValue
        });
    }
};

