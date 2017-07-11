/**
 * @module montage/core/core
 */

require("collections/shim");
require("./shim/object");
require("./shim/array");
require("./extras/object");
require("./extras/date");
require("./extras/element");
require("./extras/function");
require("./extras/regexp");
require("./extras/string");

var ATTRIBUTE_PROPERTIES = "AttributeProperties",
    UNDERSCORE = "_",
    PROTO = "__proto__",
    VALUE = "value",
    ENUMERABLE = "enumerable",
    DISTINCT = "distinct",
    SERIALIZABLE = "serializable",
    FUNCTION = "function",
    UNDERSCORE_UNICODE = 95,
    ARRAY_PROTOTYPE = Array.prototype,
    OBJECT_PROTOTYPE = Object.prototype,
    accessorPropertyDescriptor = {
        get: void 0,
        set: void 0,
        configurable: false,
        enumerable: false
    },
    valuePropertyDescriptor = {
        value: void 0,
        configurable: false,
        enumerable: false,
        writable: false
    },
    Map = require("collections/map"),
    WeakMap = require("collections/weak-map"),
    Set = require("collections/set"),
    __superWeakMap = new WeakMap();
    //Entry is a function and value is a set containing specialied functions that have been cached
    _superDependenciesWeakMap = new WeakMap();

    // Fix Function#name on browsers that do not support it (IE10):
    if (!Object.create.name) {
        var fnNamePrefixRegex = /^[\S\s]*?function\s*/;
        var fnNameSuffixRegex = /[\s\(\/][\S\s]+$/;

        function _name() {
          var name = "";
          if (this === Function || this === Function.prototype.constructor) {
            name = "Function";
          }
          else if (this !== Function.prototype) {
            name = ("" + this).replace(fnNamePrefixRegex, "").replace(fnNameSuffixRegex, "");
          }
          return name;
        }

        Object.defineProperty(Function.prototype, 'name', {
            get: _name
        });
    }

/**
 * The Montage constructor provides conveniences for sub-typing
 * ([specialize]{@link Montage.specialize}) and common methods for Montage
 * prototype chains.
 *
 * @class Montage
 * @classdesc The basis of all types using the MontageJS framework.
 */
var Montage = exports.Montage = function Montage() {};

var PROTO_IS_SUPPORTED = {}.__proto__ === Object.prototype;
var PROTO_PROPERTIES_BLACKLIST = {"_montage_metadata": 1, "__state__": 1, "_hasUserDefinedConstructor": 1};

Montage.defineValueProperty = function Montage_defineValueProperty(object, propertyName, value, configurable, enumerable, writable) {
    Montage_defineValueProperty.template.value = value;
    Montage_defineValueProperty.template.configurable = configurable;
    Montage_defineValueProperty.template.enumerable = enumerable;
    Montage_defineValueProperty.template.writable = writable;

    this.defineProperty(object, propertyName, Montage_defineValueProperty.template);
}
Montage.defineValueProperty.template = valuePropertyDescriptor;
Montage.defineAccessorProperty = function Montage_defineAccessorProperty(object, propertyName, get, set, configurable, enumerable) {
    Montage_defineAccessorProperty.template.get = get;
    Montage_defineAccessorProperty.template.set = set;
    Montage_defineAccessorProperty.template.configurable = configurable;
    Montage_defineAccessorProperty.template.enumerable = enumerable;

    this.defineProperty(object, propertyName, Montage_defineValueProperty.template);
}
Montage.defineAccessorProperty.template = accessorPropertyDescriptor;


valuePropertyDescriptor.value = false;
Object.defineProperty(Montage, "_hasUserDefinedConstructor", valuePropertyDescriptor);

/**
 * Customizes a type with idiomatic JavaScript constructor and prototype
 * inheritance, using ECMAScript 5 property descriptors with customizations
 * for common usage in MontageJS.
 *
 * See {@link Montage.defineProperty}
 * @function Montage.specialize
 * @param {Object} prototypeProperties a object mapping property names to
 * customized Montage property descriptors, to be applied to the new
 * prototype
 * @param {?Object} constructorProperties a object mapping property names to
 * customized Montage property descriptors, to be applied to the new
 * constructor
 * @returns {function} a constructor function for the new type, which
 * derrives prototypically from `this`, with a prototype that inherits
 * `this.prototype`, with the given property descriptors applied.
 */

valuePropertyDescriptor.value = function specialize(prototypeProperties, constructorProperties) {
        var constructor, prototype, names, propertyName, property, i, length,
            // check if this constructor has Montage capabilities
            parent = this,
            foreignParent = typeof this.specialize === "undefined";

        prototypeProperties = prototypeProperties || Object.empty;
        constructorProperties = constructorProperties || Object.empty;

        if (prototypeProperties.constructor && prototypeProperties.constructor.value) {
            constructor = prototypeProperties.constructor.value;
            constructor._hasUserDefinedConstructor = true;

        } else {
            if (this._hasUserDefinedConstructor) {
                constructor = function() {
                    return this.super() || this;
                    //return parent.apply(this, arguments) || this;
                };
            } else {
                constructor = function() {
                    return this;
                };
                constructor.name = this.name+"Specialized";
            }
        }

        if (PROTO_IS_SUPPORTED) {
            constructor.__proto__ = parent;
        } else {
            names = Object.getOwnPropertyNames(parent);

            for (i = 0, length = names.length; i < length; i++) {
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
                value: function (object) {
                    var prototype;

                    while (object !== null) {
                        prototype = Object.getPrototypeOf(object);

                        if(prototype === this) {
                            return true;
                        }

                        object = prototype;
                    }

                    return false;
                },
                enumerable: false
            });
        }

        prototype = Object.create(this.prototype);

        if (foreignParent) {
            // give the constructor all the properties of Montage
            names = Object.getOwnPropertyNames(Montage);

            for (i = 0, length = names.length; i < length; i++) {
                propertyName = names[i];
                property = Object.getOwnPropertyDescriptor(constructor, propertyName);

                if (!property || property.configurable) {
                    Montage.defineProperty(constructor, propertyName, Object.getOwnPropertyDescriptor(Montage, propertyName));
                }
            }

            // give the prototype all the properties of Montage.prototype
            names = Object.getOwnPropertyNames(Montage.prototype);

            for (i = 0, length = names.length; i < length; i++) {
                propertyName = names[i];
                property = Object.getOwnPropertyDescriptor(constructor, propertyName);

                if (!property || property.configurable) {
                    Montage.defineProperty(prototype, propertyName, Object.getOwnPropertyDescriptor(Montage.prototype, propertyName));
                }
            }
        }

        if ("objectDescriptor" in prototypeProperties) {
            Montage.defineProperty(constructor, "objectDescriptor", prototypeProperties.objectDescriptor);
        }

        if ("blueprint" in prototypeProperties) {
            Montage.defineProperty(constructor, "blueprint", prototypeProperties.blueprint);
        }

        if ("objectDescriptorModuleId" in prototypeProperties) {
            Montage.defineProperty(constructor, "objectDescriptorModuleId", prototypeProperties.objectDescriptorModuleId);
        }

        if ("blueprintModuleId" in prototypeProperties) {
            Montage.defineProperty(constructor, "blueprintModuleId", prototypeProperties.blueprintModuleId);
        }

        Montage.defineProperties(prototype, prototypeProperties, true);

        // needs to be done afterwards so that it overrides any prototype properties
        Montage.defineProperties(constructor, constructorProperties, true);

        Montage.defineProperty(constructor,"__isConstructor__", {
            value: true,
            enumerable: false
        });


        constructor.prototype = prototype;

        Montage.defineValueProperty(prototype, "constructor",constructor,true,false,true );

        // Super needs
        Montage.defineValueProperty(constructor, "constructor",constructor,true,false,true );

        return constructor;

    };
valuePropertyDescriptor.writable = false;
valuePropertyDescriptor.configurable = true;
valuePropertyDescriptor.enumerable = false;
Object.defineProperty(Montage, "specialize", valuePropertyDescriptor);


if (!PROTO_IS_SUPPORTED) {
    // If the __proto__ property isn't supported than we need to patch up behavior for constructor functions
    var originalGetPrototypeOf = Object.getPrototypeOf;
    Object.getPrototypeOf = function getPrototypeOf(object) {
        if (typeof object === FUNCTION && object.__constructorProto__) {
            // we have set the __constructorProto__ property of the function to be it's parent constructor
            return object.__constructorProto__;
        } else {
            return originalGetPrototypeOf.apply(Object, arguments);
        }
    };
}

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
 * @function Montage.defineProperty
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
valuePropertyDescriptor.writable = valuePropertyDescriptor.configurable = valuePropertyDescriptor.enumerable = false;
valuePropertyDescriptor.value = function Montage_defineProperty(obj, prop, descriptor, inSpecialize) {
        if (! (typeof obj === "object" || typeof obj === FUNCTION) || obj === null) {
            throw new TypeError("Object must be an object, not '" + obj + "'");
        }

        var isValueDescriptor = (VALUE in descriptor);

        if (DISTINCT in descriptor && !isValueDescriptor) {
            throw new TypeError("Cannot use distinct attribute on non-value property '" + prop + "'");
        }


        //reset defaults appropriately for framework.
        if (PROTO in descriptor) {
            descriptor.__proto__ = (isValueDescriptor ? (typeof descriptor.value === FUNCTION ? _defaultFunctionValueProperty : _defaultObjectValueProperty) : _defaultAccessorProperty);
        } else {
            var defaults;
            if (isValueDescriptor) {
                if (typeof descriptor.value === FUNCTION) {
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

        if (!descriptor.hasOwnProperty(ENUMERABLE) && prop.charCodeAt(0) === UNDERSCORE_UNICODE) {
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

        //clear the cache for super() for property we're about to redefine.
        //But If we're defining a property as part of a Type/Class construction, we most likely don't need to worry about
        //clearing super calls caches.
        if(!inSpecialize) __clearSuperDepencies(obj,prop, descriptor);

        return Object.defineProperty(obj, prop, descriptor);
    };
Object.defineProperty(Montage, "defineProperty", valuePropertyDescriptor);

/**
 * Defines one or more new properties to an object, or modifies existing
 * properties on the object.
 * @see {@link Montage.defineProperty}
 * @function Montage.defineProperties
 * @param {Object} object The object to which the properties are added.
 * @param {Object} properties An object that maps names to Montage property
 * descriptors.
 */
Object.defineProperty(Montage, "defineProperties", {value: function (obj, properties, inSpecialize) {
    if (typeof properties !== "object" || properties === null) {
        throw new TypeError("Properties must be an object, not '" + properties + "'");
    }
    var property, propertyKeys = Object.getOwnPropertyNames(properties);
    for (var i = 0; (property = propertyKeys[i]); i++) {
        if ("_bindingDescriptors" !== property) {
            this.defineProperty(obj, property, properties[property], inSpecialize);
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
    configurable: true
    /*,
    serializable: false
    */
};


var _serializableAttributeProperties = "_serializableAttributeProperties";
Object.defineProperty(Montage.prototype, _serializableAttributeProperties, {
    enumerable: false,
    configurable: false,
    writable: true,
    value: {}
});

var ObjectAttributeProperties = new Map();
function getAttributeProperties(proto, attributeName, privateAttributeName) {
    var attributePropertyName = privateAttributeName || (
        attributeName === SERIALIZABLE
        ? _serializableAttributeProperties
        : (UNDERSCORE + attributeName + ATTRIBUTE_PROPERTIES));

        if(proto !== Object.prototype) {
            if (proto.hasOwnProperty(attributePropertyName)) {
                return proto[attributePropertyName];
            } else {
               return Object.defineProperty(proto, attributePropertyName, {
                    enumerable: false,
                    configurable: false,
                    writable: true,
                    value: Object.create(getAttributeProperties(Object.getPrototypeOf(proto), attributeName, attributePropertyName))
                })[attributePropertyName];
            }
        }
        else {
            if(!ObjectAttributeProperties.has(attributeName)) {
                ObjectAttributeProperties.set(attributeName,{});
            }
            return ObjectAttributeProperties.get(attributeName);
        }
}

Montage.defineProperty(Montage, "didCreate", {
    value: Function.noop
});


/*
 * Call a function of the same name in a superclass.
 *
 * E.g., if A is a superclass of B, then:
 *
 *      A.prototype.calc = function ( x ) {
 *          return x * 2;
 *      }
 *      B.prototype.calc = function ( x ) {
 *          return this._super( x ) + 1;
 *      }
 *
 *      var b = new B();
 *      b.calc( 3 );         // = 7
 *
 * This assumes a standard prototype-based class system in which all classes have
 * a member called "superclass" pointing to their parent class, and all instances
 * have a member called "constructor" pointing to the class which created them.
 *
 * This routine has to do some work to figure out which class defined the
 * calling function. It will have to walk up the class hierarchy and,
 * if we're running in IE, do a bunch of groveling through function
 * definitions. To speed things up, the first call to _super() within a
 * function creates a property called "_superFn" on the calling function;
 * subsequent calls to _super() will use the memoized answer.
 *
 * Some prototype-based class systems provide a _super() function through the
 * use of closures. The closure approach generally creates overhead whether or
 * not _super() will ever be called. The approach below adds no overhead if
 * _super() is never invoked, and adds minimal overhead if it is invoked.
 * This code relies upon the JavaScript .caller method, which many claims
 * has slow performance because it cannot be optimized. However, "slow" is
 * a relative term, and this approach might easily have acceptable performance
 * for many applications.
 */

function _superForValue(methodName) {
      var callerFn = ( _superForValue && _superForValue.caller )
        ? _superForValue.caller             // Modern browser
        : arguments.callee.caller,        // IE9 and earlier
      superFn = __super.call(this,callerFn,methodName,true,false,false),
        self = this;

    //We may need to cache that at some point if it gets called too often
    return superFn ? function() {
        return superFn.apply( self, arguments );
    }
    : Function.noop;
};

function _superForGet(methodName) {
     var callerFn = ( _superForGet && _superForGet.caller )
        ? _superForGet.caller             // Modern browser
        : arguments.callee.caller,        // IE9 and earlier
       superFn = __super.call(this,callerFn,methodName,false,true,false),
        self = this;

    //We may need to cache that at some point if it gets called too often
    return superFn ? function() {
        return superFn.apply( self, arguments );
    }
    : Function.noop;
};


function _superForSet(methodName) {
     var callerFn = ( _superForSet && _superForSet.caller )
        ? _superForSet.caller             // Modern browser
        : arguments.callee.caller,        // IE9 and earlier
       superFn = __super.call(this,callerFn,methodName,false,false,true),
        self = this;

    //We may need to cache that at some point if it gets called too often
    return superFn ? function() {
        return superFn.apply( self, arguments );
    }
    : Function.noop;
};


function _super() {
    // Figure out which function called us.
    var callerFn = ( _super && _super.caller )
        ? _super.caller             // Modern browser
        : arguments.callee.caller,        // IE9 and earlier
        superFn = __super.call(this,callerFn);
    return superFn
        ? superFn.apply( this, arguments )  // Invoke superfunction
        : undefined;;
};




function _superDependenciesFor(anObject) {
    var dependents = _superDependenciesWeakMap.get(anObject);
    if(!dependents) {
        _superDependenciesWeakMap.set(anObject,(dependents = new Set()));
    }
    return dependents;
}

var _superMethodDependenciesMap = new Map();
function _superMethodDependenciesFor(anObject) {
    var dependents = _superMethodDependenciesMap.get(anObject);
    if(!dependents) {
        _superMethodDependenciesMap.set(anObject,(dependents = new Set()));
    }
    return dependents;
}


function __super(callerFn, methodPropertyName, isValue, isGetter, isSetter) {
    if ( !callerFn && !methodPropertyName) {
        return undefined;
    }

    // Have we called super() within the calling function before?
    var superFn = __superWeakMap.get(callerFn);

    if ( !superFn ) {
        var isFunctionSuper = typeof this === FUNCTION, dependents;

        // Find the class implementing this method.
        superFn = findSuperMethodImplementation( callerFn, isFunctionSuper ? this : this.constructor , isFunctionSuper, methodPropertyName, isValue, isGetter, isSetter);
        if ( superFn ) {
            __superWeakMap.set(callerFn,superFn);
            _superMethodDependenciesFor(superFn).add(callerFn);
        }
    }

    return superFn;
};

function __clearSuperDepencies(obj, prop, replacingDescriptor) {

    var superWeakMap = __superWeakMap,
        descriptor = Object.getOwnPropertyDescriptor(obj, prop),
        dependencies,
        iterator,
        dependency,
        methodFn;

    if(descriptor) {
        if(typeof descriptor.value === FUNCTION && typeof replacingDescriptor.value === FUNCTION) {
            superWeakMap.delete(descriptor.value);
            dependencies = _superMethodDependenciesFor(descriptor.value);
            iterator = dependencies.values();
            while (dependency = iterator.next().value) {
                superWeakMap.delete(dependency);
            }
        }
        else {
            if(typeof descriptor.get === FUNCTION && typeof replacingDescriptor.get === FUNCTION) {
                superWeakMap.delete(descriptor.get);
                dependencies = _superMethodDependenciesFor(descriptor.get);
                iterator = dependencies.values();
                while (dependency = iterator.next().value) {
                    superWeakMap.delete(dependency);
                }
            }
            if(typeof descriptor.set === FUNCTION && typeof replacingDescriptor.set === FUNCTION) {
                superWeakMap.delete(descriptor.set);
                dependencies = _superMethodDependenciesFor(descriptor.set);
                iterator = dependencies.values();
                while (dependency = iterator.next().value) {
                    superWeakMap.delete(dependency);
                }
            }
        }
    }

    dependencies = _superDependenciesWeakMap.get(obj);
    if(dependencies) {
        iterator = dependencies.values();
        while (dependency = iterator.next().value) {
            __clearSuperDepencies(dependency, prop, replacingDescriptor);
        }
    }

}

/*
 * Find the super implementation for the given method, starting at the given
 * point in the class hierarchy and walking up.
 *
 * This is done first by enumerating all object's own prototype members to find the
 * function identical to the method we're looking for in order to know which property name it's attached to
 * We walk up until we find one.
 *
 * Once found, then we continue walking up to find the true super now looking only for that known property.
 *
 * Returns the function once found
 */
var _propertyNames = [];
function findSuperMethodImplementation( method, classFn, isFunctionSuper, methodPropertyNameArg, isValueArg, isGetterArg, isSetterArg) {

    // See if this particular class defines the function.
    //var prototype = classFn.prototype;
    var Object = global.Object,
        propertyNames,
        i, propertyName, property, func,
        methodPropertyName,
        isValue = isValueArg,
        isGetter = isGetterArg,
        isSetter = isSetterArg,
        startContext, previousContext, context, foundSuper;

        //context = isFunctionSuper ? Object.getPrototypeOf(classFn) : classFn.prototype;
        startContext = context = isFunctionSuper ? classFn : classFn.prototype;

        while (!foundSuper && context !== null) {

            if(!methodPropertyName) {
                //If methodPropertyNameArg is passed as an argument, we know what to look for,
                //But it may not be there...
                propertyNames = methodPropertyNameArg
                    ? (_propertyNames[0] = methodPropertyNameArg) && _propertyNames
                    : Object.getOwnPropertyNames(context);

                //As we start, we don't really know which property name points to method, we're going to find out:
                for (i=0;(propertyName = propertyNames[i]);i++) {
                    if((property = Object.getOwnPropertyDescriptor(context, propertyName))) {
                        if ((func = property.value) != null) {
                            if (func === method || func.deprecatedFunction === method) {
                                methodPropertyName = propertyName;
                                isValue = true;
                                break;
                            }
                        }
                        else {
                            if ((func = property.get) != null) {
                                if (func === method || func.deprecatedFunction === method) {
                                    methodPropertyName = propertyName;
                                    isGetter = true;
                                    break;
                                }
                            }
                            if ((func = property.set) != null) {
                                if (func === method || func.deprecatedFunction === method) {
                                    methodPropertyName = propertyName;
                                    isSetter = true;
                                    break;
                                }
                            }
                        }
                    }
                }
            }
            //Now that we know the property name pointing to method and wether it's a value or getter/setter
            //We're going to walk up the tree.
            else {

                if((property = Object.getOwnPropertyDescriptor(context, methodPropertyName))) {
                    if (property.hasOwnProperty("value")) {
                        func = property.value;
                        foundSuper = true;
                        break;
                    }
                    else if (isGetter && property.hasOwnProperty("get")) {
                        func = property.get;
                        foundSuper = true;
                        break;
                    }
                    else if (isSetter && property.hasOwnProperty("set")) {
                        func = property.set;
                        foundSuper = true;
                        break;
                    }
                }
            }

            previousContext = context;
            if(context = Object.getPrototypeOf(context)) {
                _superDependenciesFor(context).add(previousContext);
            }

        }

        return foundSuper && typeof func === FUNCTION ? func : Function.noop;
}


/**
 * Calls the method with the same name as the caller from the parent of the
 * constructor that contains the caller, falling back to a no-op if no such
 * method exists.
 * @function Montage.super
 * @returns {function} this constructor’s parent constructor.
 */
Montage.defineProperty(Montage, "super", {
    value: _super,
    enumerable: false
});

/**
 * Calls the method with the same name as the caller from the parent of the
 * prototype that contains the caller, falling back to a no-op if no such
 * method exists.
 */
Montage.defineProperty(Montage.prototype, "super", {
    value: _super,
    enumerable: false
});

/**
 * Calls the method with the given name from the parent of the constructor that
 * contains the caller, falling backto no-op if no such method exists.
 * @param {string} name
 * @param ...arguments to forward to the parent method
 */
Montage.defineProperty(Montage, "superForValue", {
    value: _superForValue,
    enumerable: false
});

/**
 * Calls the method with the given name from the parent of the prototype that
 * contains the caller, falling backto no-op if no such method exists.
 * @param {string} name
 * @param ...arguments to forward to the parent method
 */
Montage.defineProperty(Montage.prototype, "superForValue", {
    value: _superForValue,
    enumerable: false
});

Montage.defineProperty(Montage, "superForGet", {
    value: _superForGet,
    enumerable: false
});
Montage.defineProperty(Montage.prototype, "superForGet", {
    value: _superForGet,
    enumerable: false
});

Montage.defineProperty(Montage, "superForSet", {
    value: _superForSet,
    enumerable: false
});
Montage.defineProperty(Montage.prototype, "superForSet", {
    value: _superForSet,
    enumerable: false
});

/**
 * Returns the names of serializable properties belonging to Montage object.
 * @function Montage.getSerializablePropertyNames
 * @param {Object} anObject A Montage object.
 * @returns {Array} An array containing the names of the serializable
 * properties belonging to `anObject`.
 */
Montage.defineProperty(Montage, "getSerializablePropertyNames", {value: function (anObject) {


    var propertyNames,
        attributes = getAttributeProperties(anObject, SERIALIZABLE);

    if (attributes) {
        propertyNames = []
        for (var name in attributes) {
            if (attributes[name]) {
                propertyNames.push(name);
            }
        }
        return propertyNames;
    }
    else {
        return Array.empty;
    }

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
Montage.defineProperty(Montage, "getPropertyAttribute", {value: function (anObject, propertyName, attributeName) {
    var attributes = getAttributeProperties(anObject, attributeName);
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
Montage.defineProperty(Montage, "getPropertyAttributes", {value: function (anObject, attributeName) {
    var attributes = getAttributeProperties(anObject, attributeName),
        attributeValues;

    if (!attributes) {
        return;
    }

    attributeValues = {};
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

Object.defineProperty(Montage.prototype, "_montage_metadata", {
    enumerable: false,
    writable: true,
    value: undefined
});

/**
 * Get the metadata Montage has on the given object.
 * @function Montage.getInfoForObject
 * @param {Object} object
 * @returns {Object} If the object was exported by a module, `property` is the
 * name it has on the exports object, `aliases` is an array of all other names
 * if there was more than one, `require` is the package it comes from, `module`
 * is the identifier for the module in that package, and `isInstance` discerns
 * constructors and prototypes from instances.
 */
Montage.defineProperty(Montage, "getInfoForObject", {
    value: function Montage_getInfoForObject(object) {
        var metadata;
        var instanceMetadataDescriptor;

        //jshint -W106

        if (hasOwnProperty.call(object, "_montage_metadata") && object._montage_metadata) {
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
                //For Object instances we do _montage_metadata per instance
                if(object.constructor === Object) {
                    return Object.defineProperty(object, "_montage_metadata", {
                        enumerable: false,
                        // this object needs to be overriden by the SerializationCompiler because this particular code might be executed on an exported object before the Compiler takes action, for instance, if this function is called within the module definition itself (happens with __core__).
                        writable: true,
                        value: Object.create(metadata, instanceMetadataDescriptor)
                    })._montage_metadata;

                }
                //For everything else we go more efficient and declare the property only once per prototype
                else {
                    if(!("_montage_metadata" in object.constructor.prototype)) {
                    //if(!hasOwnProperty.call(object.constructor.prototype, "_montage_metadata")) {
                        Object.defineProperty(object.constructor.prototype, "_montage_metadata", {
                            enumerable: false,
                            // this object needs to be overriden by the SerializationCompiler because this particular code might be executed on an exported object before the Compiler takes action, for instance, if this function is called within the module definition itself (happens with __core__).
                            writable: true,
                            value: undefined
                        });
                    }

                    return (object._montage_metadata = Object.create(metadata, instanceMetadataDescriptor)) || object._montage_metadata;
                }
            } catch(e) {
                // NOTE Safari (as of Version 5.0.2 (6533.18.5, r78685)
                // doesn't seem to allow redefining an existing property on a DOM Element
                return (object._montage_metadata = Object.create(metadata, instanceMetadataDescriptor));
            }
        }
        //jshint +W106
    }
});


var hasOwnProperty = Object.prototype.hasOwnProperty;


Montage.defineProperty(Montage, "identifier", {
    value: null,
    serializable: true
});
Montage.defineProperty(Montage.prototype, "identifier", {
    value: null,
    serializable: true
});



/**
 * The version of an object (integer). This is intended to represent the current version of an Object.
 * As an object evolves, properties are added, removed, re-factored, an object's moduleId doesn't change
 * and deserialisation needs to be able to deserialize older versions, with the abilty to look at the version
 * serialized vs the current one at deserialization.
 *
 * @type {Number} .
 */
Montage.defineProperty(Montage.prototype, "version", {
    value: 1,
    serializable: false //This should be on my default, but will have to require testing and some adaptation around the code base. Specialized objects off Montage will have to override it if they want the default serialization of the version property, or to deal with it in serialize/deserializeSelf
});


/**
 * Returns true if two objects are equal, otherwise returns false.
 * @function Montage#equals
 * @param {Object} anObject The object to compare for equality.
 * @returns {boolean} Returns `true` if the calling object and
 * `anObject` are identical and their `uuid` properties
 * are also equal. Otherwise, returns `false`.
 */
Montage.defineProperty(Montage.prototype, "equals", {
    value: function (anObject) {
        if (!anObject) return false;
        return this === anObject || (this.uuid && this.uuid === anObject.uuid);
    }
});

Montage.defineProperty(Montage, "equals", {
    value: Montage.prototype.equals
});

/**
 * This method calls the method named with the identifier prefix if it exists.
 * Example: If the name parameter is "shouldDoSomething" and the caller's identifier is "bob", then
 * this method will try and call "bobShouldDoSomething"
 * @function Montage#callDelegateMethod
 * @param {string} name
*/
Montage.defineProperty(Montage.prototype, "callDelegateMethod", {
    value: function (name) {
        var delegate = this.delegate, delegateFunction;

        if (delegate) {

            if ((typeof this.identifier === "string") && (typeof (delegateFunction = delegate[this.identifier + name.toCapitalized()]) === FUNCTION)) {}
            else if (typeof (delegateFunction = delegate[name]) === FUNCTION) {}

            if (delegateFunction) {
                if(arguments.length === 2) {
                    return delegateFunction.call(delegate,arguments[1]);
                }
                else if(arguments.length === 3) {
                    return delegateFunction.call(delegate,arguments[1],arguments[2]);
                }
                else if(arguments.length === 4) {
                    return delegateFunction.call(delegate,arguments[1],arguments[2],arguments[3]);
                }
                else if(arguments.length === 5) {
                    return delegateFunction.call(delegate,arguments[1],arguments[2],arguments[3],arguments[4]);
                }
                else {
                    // remove first argument
                    ARRAY_PROTOTYPE.shift.call(arguments);
                    return delegateFunction.apply(delegate, arguments);
                }
            }
        }
    }
});

// Property Changes

var PropertyChanges = require("collections/listen/property-changes");
Object.addEach(Montage, PropertyChanges.prototype);
Object.addEach(Montage.prototype, PropertyChanges.prototype);

/**
 * Adds a change listener for the named property of this instance.  The handler
 * may be a function or an object with a handler method.  When the property
 * changes on this object, the handler will be notified *on the stack*.
 *
 * The dispatcher will try to dispatch to *only* the most specific handler
 * method available, from `handle` + PropertyName (bactrian camel case) +
 * `Change`, to `handlePropertyChange`, or if the `beforeChange` flag is set,
 * `handle` + PropertyName + `WillChange` then `handlePropertyWillChange`.  The
 * arguments to the handler are `value`, `name`, and this.
 *
 * @function Montage#addOwnPropertyChangeListener
 * @param {string} name The name of the property to observe.
 * @param {object|function} handler On which to dispatch change notifications.
 * @param {boolean} beforeChange Whether to observer changes before they occur.
 * To avoid the boolean trap, try to use `addBeforeOwnPropertyChangeListener`
 * instead, unless `beforeChange` is truly variable.
 * @returns {function} `cancel`, useful for removing the change listener
 * without having to retain and reconstruct all of the arguments.
 * @see Montage#addBeforeOwnPropertyChangeListener
 */

/**
 * Cancels a change listener established with the same given parameters.  For
 * the meanings of the parameters, see `addOwnPropertyChangeListener`.
 * @see Montage#addOwnPropertyChangeListener
 * @function Montage#removeOwnPropertyChangeListener
 * @param {string} name
 * @param {object|function} handler
 * @param {boolean} beforeChange
 */

/**
 * Adds a listener that will be notified *before* a property changes.  See
 * `addOwnPropertyChangeListener` for details.
 * @see Montage#addOwnPropertyChangeListener
 * @function Montage#addBeforeOwnPropertyChangeListener
 * @param {string} name
 * @param {object|function} handler
 * @returns {function} cancel
 */

/**
 * Removes a change listener established by `addBeforeOwnPropertyChangeListener`
 * or `addOwnPropertyChangeListener` with the `beforeChange` flag.
 * Call with the same arguments used to set up the observer.
 * @see Montage#addOwnPropertyChangeListener
 * @see Montage#addBeforeOwnPropertyChangeListener
 * @function Montage#removeBeforeOwnPropertyChangeListener
 * @param {string} name
 * @param {object|function} handler
 */

/**
 * Produces the descriptor for a property change listener. The descriptor is an
 * object that will contain two arrays, `willChangeListeners` and
 * `changeListeners`. Each listener will be the `handler` given to establish
 * the change listener on `addOwnPropertyChangeListener` or
 * `addBeforeOwnPropertyChangeListener`.
 * @see Montage#addOwnPropertyChangeListener
 * @see Montage#addBeforeOwnPropertyChangeListener
 * @function Montage#getOwnPropertyChangeDescriptor
 * @param {string} name
 * @returns the property change descriptor for this name, created if necessary.
 */

/**
 * Manually dispatches a property change notification on this object.  This can
 * be useful if the property is a getter or setter and its value changes as a
 * side effect of some other operation, like cache invalidation. It is
 * unnecessary to dispatch a change notification in the setter of a property if
 * it modifies its own value, but if changing `celicius` has a side effect on
 * `fahrenheit`, they can manually dispatch changes to the other. Be sure
 * to dispatch both the change and before the change.
 * @function Montage#dispatchOwnPropertyChange
 * @param {string} name
 * @param value
 * @param {boolean} beforeChange Avoid the boolean trap and use
 * `dispatchBeforeOwnPropertyChange`. You are not likely to encounter a case
 * where `beforeChange` is a named variable.
 */

/**
 * Manually dispatches a notification that a property is about to change.
 * See `dispatchOwnPropertyChange`.
 * @see Montage#dispatchOwnPropertyChange
 * @function Montage#dispatchBeforeOwnPropertyChange
 * @param {string} name
 * @param value
 */

/**
 * An overridable method for ensuring that changes to the named property
 * dispatch notifications. The default behavior is to wrap the property with a
 * getter and setter.
 * @function Montage#makePropertyObservable
 * @param {string} name
 */

/**
 * Determines whether a property has ever been observed. Removing all property
 * change listeners does not destroy this record.
 * @function Montage#hasOwnPropertyChangeDescriptor
 * @param {string} name
 */

/**
 * @class Bindings
 * @extends frb
 * @typedef {string} FRBExpression
 */
var Bindings = exports.Bindings = require("frb");

var bindingPropertyDescriptors = {

    /**
     * Establishes a binding between two FRB expressions.  See the
     * [FRB](http://documentup.com/montagejs/frb/) documentation for
     * information about FRB paths/expressions. There can only be one binding
     * per target path on an object.
     * @param {string} targetPath
     * @param {object} descriptor A descriptor has at least an arrow property,
     * `"<-"`, `"<->"`. The corresponding string is the `sourcePath` for the
     * binding and the type of arrow determines whether the binding is one way
     * (from source to target) or if data flows both directions. The
     * `descriptor` may contain a `converter` or `reverter` object, or directly
     * provide `convert` and `revert` functions. Converters and reverters have
     * `convert` and `revert` methods.  The `convert` function or method
     * transforms data from the source to the target. The `revert` function or
     * method transforms data from the target to the source and is necessary if
     * there is a converter on a two-way binding. A `reverter` is the same as a
     * `converter`, but the polarity is reversed. This is useful for reusing
     * converters that were designed for data flowing the “wrong” way.  The
     * `descriptor` may also provide a `trace` flag for console debugging.
     * @function Montage#defineBinding
     */
    // The `commonDescriptor` is deliberately not documented as its use is
    // specific to the `defineBindings` implementation and not intended to
    // be used directly.
    defineBinding: {
        value: function (targetPath, descriptor, commonDescriptor) {
            return Bindings.defineBinding(this, targetPath, descriptor, commonDescriptor);
        }
    },

    /**
     * Establishes multiple bindings.
     * @see Montage#defineBinding
     * @function Montage#defineBindings
     * @param descriptors {object} an object for which every property is a
     * source path and every value is a binding descriptor as described by
     * `defineBinding`.
     * @param commonDescriptor {?object} a partial binding descriptor with
     * properties intended to be shared by all of the established bindings.
     */
    defineBindings: {
        value: function (descriptors, commonDescriptor) {
            return Bindings.defineBindings(this, descriptors, commonDescriptor);
        }
    },

    /**
     * Cancels a binding and removes its descriptor from the object's binding
     * descriptor index. This will in turn cause any change listeners needed on
     * far reaching objects for the binding to be canceled.  A component should
     * call this if the binding reaches into objects it does not itself own to
     * ensure that they are available for garbage collection.
     *
     * @function
     * @param {string} targetPath The target path used to establish the
     * binding.
     */
    cancelBinding: {
        value: function (targetPath) {
            return Bindings.cancelBinding(this, targetPath);
        }
    },

    /**
     * Cancels all registered bindings on this object.
     *
     * @function
     */
    cancelBindings: {
        value: function () {
            return Bindings.cancelBindings(this);
        }
    },

    /**
     * Gets the binding descriptor for a target path.
     *
     * @function
     * @param {string} targetPath
     * @returns {object} the descriptor for the binding
     * @see {@link Montage#defineBinding} for information on the descriptor type.
     */
    getBinding: {
        value: function (targetPath) {
            return Bindings.getBinding(this, targetPath);
        }
    },

    /**
     * Gets the binding descriptors for all target paths.
     * @function Montage#getBindings
     * @returns {object} an object that maps traget paths to binding
     * descriptors.
     * See `defineBinding` for information on the descriptor type.
     * @see Montage#defineBinding
     */
    getBindings: {
        value: function () {
            return Bindings.getBindings(this);
        }
    }

};

Montage.defineProperties(Montage, bindingPropertyDescriptors);
Montage.defineProperties(Montage.prototype, bindingPropertyDescriptors);

// Paths

var parse = require("frb/parse"),
    evaluate = require("frb/evaluate"),
    assign = require("frb/assign"),
    bind = require("frb/bind"),
    compileObserver = require("frb/compile-observer"),
    Scope = require("frb/scope"),
    Observers = require("frb/observers"),
    autoCancelPrevious = Observers.autoCancelPrevious;


var PathChangeDescriptor = function PathChangeDescriptor() {
    this._willChangeListeners = null;
    this._changeListeners = null;
	return this;
}

Object.defineProperties(PathChangeDescriptor.prototype,{
	_willChangeListeners: {
		value:null,
		writable: true
	},
	willChangeListeners: {
		get: function() {
			return this._willChangeListeners || (this._willChangeListeners = new Map());
		}
	},
	_changeListeners: {
		value:null,
		writable: true
	},
    changeListeners: {
		get: function() {
			return this._changeListeners || (this._changeListeners = new Map());
		}
	}

});

var pathChangeDescriptors = new WeakMap();

var pathPropertyDescriptors = {

    /**
     * Evaluates an FRB expression from this object and returns the value.
     * The evaluator does not establish any change listeners.
     * @function Montage#getPath
     * @param {string} path an FRB expression
     * @returns the current value of the expression
     */
    getPath: {
        value: function (path, parameters, document, components) {
            return evaluate(
                path,
                this,
                parameters || this,
                document,
                components
            );
        }
    },

    /**
     * Assigns a value to the FRB expression from this object. Not all
     * expressions can be assigned to. Property chains will work, but will
     * silently fail if the target object does not exist.
     * @function Montage#setPath
     * @param {string} path an FRB expression designating the value to replace
     * @param value the new value
     */
    setPath: {
        value: function (path, value, parameters, document, components) {
            return assign(
                this,
                path,
                value,
                parameters || this,
                document,
                components
            );
        }
    },

    /**
     * Observes changes to the value of an FRB expression.  The content of the
     * emitted value may react to changes, particularly if it is an array.
     * @function Montage#observePath
     * @param {string} path an FRB expression
     * @param {function} emit a function that receives new values in response
     * to changes.  The emitter may return a `cancel` function if it manages
     * event listeners that must be collected when the value changes.
     * @returns {function} a canceler function that will remove all involved
     * change listeners, prevent new values from being observed, and prevent
     * previously emitted values from reacting to any further changes.
     */
    observePath: {
        value: function (path, emit) {
            var syntax = parse(path);
            var observe = compileObserver(syntax);
            return observe(autoCancelPrevious(emit), new Scope(this));
        }
    },

    /**
     * Observes changes to the content of the value for an FRB expression.
     * The handler will receive “ranged content change” messages.  When a
     * change listener is added, the handler will be immediately invoked with
     * the initial content added at index 0 for the expression.
     * @function Montage#addRangeAtPathChangeListener
     * @param {string} path an FRB expression that produces content changes
     * @param handler a function that accepts `plus`, `minus`, and `index`
     * arguments, or a handler object with a designated method by that
     * signature.  `plus` and `minus` are arrays of values that were added
     * or removed.  `index` is the offset at which the `minus` was removed,
     * then the `plus` was added.
     * @param {?string} methodName the name of the method on the handler object
     * that should receive change messages.
     * @returns {function} cancel function for removing the range at path
     * change listener. Until `removeRangeAtPathChangeListener` is implemented,
     * this is the only way to disable this kind of observer.
     */
    addRangeAtPathChangeListener: {
        value: function (path, handler, methodName, parameters, document, components) {
            methodName = methodName || "handleRangeChange";
            function dispatch(plus, minus, index) {
                if (handler[methodName]) {
                    handler[methodName](plus, minus, index);
                } else if (handler.call) {
                    handler.call(null, plus, minus, index);
                } else {
                    throw new Error("Can't dispatch range change to " + handler);
                }
            }
            var minus = [];
            return this.addPathChangeListener(path, function (plus) {
                if (plus && plus.toArray && plus.addRangeChangeListener) {
                    // Give copies to avoid modification by the listener.
                    dispatch(plus.toArray(), minus.toArray(), 0);
                    minus = plus;
                    return plus.addRangeChangeListener(dispatch);
                } else {
                    plus = [];
                    dispatch(plus, minus, 0);
                    minus = plus;
                }
            }, void 0, void 0, parameters, document, components);
        }
    },

    // TODO removeRangeAtPathChangeListener
    // TODO add/removeMapAtPathChangeListener

    /**
     * Returns an internal index of all of the path change descriptors
     * associated with this instance.
     * @see Montage#getPathChangeDescriptor
     * @function Montage#getPathChangeDescriptors
     * @returns an object that maps property names to an object with two
     * Maps, `changeListeners` and `willChangeListeners`. Each of these
     * maps handler objects to path change descriptors. See
     * `getPathChangeDescriptor` for a description of that type.
     */
    getPathChangeDescriptors: {
        value: function () {
            if (!pathChangeDescriptors.has(this)) {
                pathChangeDescriptors.set(this, new Map());
            }
            return pathChangeDescriptors.get(this);
        }
    },

    /**
     * Gets the path change descriptor object for an observer established
     * previously by `addPathChangeListener` or `addBeforePathChangeListener`.
     * @function Montage#getPathChangeDescriptor
     * @param {string} path an FRB expression
     * @param handler a function that will receive a value change notification,
     * or an object with a method that will receive the change notifications
     * @param {boolean} beforeChange
     * @returns a path change descriptor. Such objects have `path`, `handler`,
     * `beforeChange`, and `cancel` properties. The `cancel` method is for
     * internal use only. It cancels the observer, but does not perform any
     * book keeping on the index of path change descriptors.
     */
    getPathChangeDescriptor: {
        value: function (path, handler, beforeChange) {
            var descriptors = Montage.getPathChangeDescriptors.call(this);
            if (!descriptors.has(path)) {
                descriptors.set(path, new PathChangeDescriptor);
            }

            descriptors = descriptors.get(path);
            descriptors = beforeChange ? descriptors.willChangeListeners : descriptors.changeListeners;

            if (!descriptors.has(handler)) {
                descriptors.set(handler, {
                    path: path,
                    handler: handler,
                    beforeChange: beforeChange,
                    cancel: Function.noop
                });
            }

            return descriptors.get(handler);
        }
    },

    /**
     * Creates an observer for the value of an FRB expression. The observer
     * will immediately dispatch a notification to the handler of the initial
     * value of the expression, before returning.
     *
     * If the expression's value is an array, this will be the final
     * notification and all subsequent changes will be reflected by the content
     * of the array. Use `addRangeAtPathChangeListener` if you want discrete
     * notifications for changes to the content of an expression that evaluates
     * to an array.
     *
     * Use `removePathChangeListener` to cancel all involved change listeners.
     *
     * @function Montage#addPathChangeListener
     * @param {string} path an FRB expression.
     * @param {object|function} handler an object with a handler method, or a
     * function. The handler will be called with `value`, `path`, and this as
     * arguments.
     * @param {string} handlerMethodName the method name on the handler on
     * which to dispatch change notifications, if the handler is not a
     * function.
     * @param {boolean} beforeChange instructs the path change listener to
     * dispatch before the change has occurred. Avoid using this boolean trap
     * by making use of the named method `addBeforePathChangeListener`. Using
     * this flag remains desireable only if `beforeChange` is indeed variable.
     */
    addPathChangeListener: {
        value: function (path, handler, methodName, beforeChange, parameters, document, components) {
            var self = this;

            handler = handler || Function.noop;

            var descriptor = Montage.getPathChangeDescriptor.call(this, path, handler, beforeChange);
            descriptor.cancel();

            var syntax = parse(path);

            var initialValue;
            var initialized;
            var emit;
            if (handler === Function.noop) {
                emit = function (value) {
                    if (initialized) {
                        throw new Error("Path change handler needs a handler because it emits new values when the source changes: " + JSON.stringify(path));
                    } else {
                        initialized = true;
                        initialValue = value;
                    }
                };
            } else if (methodName) {
                emit = function (value) {
                    return handler[methodName].call(handler, value, path, self);
                };
            } else if (handler.handlePathChange) {
                emit = function (value) {
                    return handler.handlePathChange.call(handler, value, path, self);
                };
            } else if (typeof handler === FUNCTION) {
                emit = function (value) {
                    return handler.call(self, value, path, self);
                };
            } else {
                throw new Error("Can't recognize handler type: " + handler + ". Must be function or delegate implementing handlePathChange.");
            }

            var observe = compileObserver(syntax);
            var scope = new Scope(this);
            scope.beforeChange = beforeChange;
            scope.parameters = parameters;
            scope.document = document;
            scope.components = components;
            var cancel = observe(autoCancelPrevious(emit), scope);

            descriptor.cancel = cancel;

            if (initialized) {
                return initialValue;
            } else {
                return cancel;
            }
        }
    },

    /**
     * Removes a path change listener previously established by a call to
     * `addPathChangeListener`. The given arguments must match the original.
     * See `addPathChangeListener` for descriptions of their meaning.
     * @see Montage#addPathChangeListener
     * @function Montage#removePathChangeListener
     * @param {string} path
     * @param {object|function} handler
     * @param {boolean} beforeChange
     */
    removePathChangeListener: {
        value: function (path, handler, beforeChange) {
            handler = handler || Function.noop;
            var descriptorsForObject = Montage.getPathChangeDescriptors.call(this);
            var phase = beforeChange ? "willChangeListeners" : "changeListeners";

            var descriptorsForPath = descriptorsForObject.get(path);
            if (!descriptorsForPath) {
                throw new Error("Can't find " + phase + " for " + JSON.stringify(path));
            }
            var descriptorsForPhase = descriptorsForPath[phase];
            if (!descriptorsForPhase.has(handler)) {
                throw new Error("Can't find " + phase + " for " + JSON.stringify(path));
            }
            var descriptor = descriptorsForPhase.get(handler);
            descriptor.cancel();
            descriptorsForPhase.delete(handler);
            if (
                descriptorsForPath.willChangeListeners.size === 0 &&
                descriptorsForPath.changeListeners.size === 0
            ) {
                descriptorsForObject.delete(path);
            }
            // if there are no other handlers
            if (descriptorsForObject.size < 1) {
                pathChangeDescriptors["delete"](this);
            }
        }
    },

    /**
     * Establishes an observer such that the handler will receive a
     * notification when the value of an FRB expression is about to change.
     * See `addPathChangeListener` for details.
     * @see Montage#addPathChangeListener
     * @function Montage#addBeforePathChangeListener
     * @param {string} path
     * @param {object|function}
     * @param {string} handlerMethodName
     */
    addBeforePathChangeListener: {
        value: function (path, handler, methodName, parameters, document, components) {
            return Montage.addPathChangeListener.call(this, path, handler, methodName, true, parameters, document, components);
        }
    },

    /**
     * Removes a path change listener previously established by a call to
     * `addBeforePathChangeListener`. The given arguments must match the
     * original. See `addPathChangeListener` for descriptions of their meaning.
     * @see Montage#addBeforePathChangeListener
     * @see Montage#addPathChangeListener
     * @function Montage#removeBeforePathChangeListener
     * @param {string} path
     * @param {object|function}
     * @param {string} handlerMethodName
     * @param {boolean} beforeChange
     */
    removeBeforePathChangeListener: {
        value: function (path, handler, methodName) {
            return Montage.removePathChangeListener.call(this, path, handler, true);
        }
    }

};

Montage.defineProperties(Montage, pathPropertyDescriptors);
Montage.defineProperties(Montage.prototype, pathPropertyDescriptors);

// has to come last since serializer and deserializer depend on logger, which
// in turn depends on montage running to completion
require("./serialization/bindings");

/*
 * Defines the module Id for object descriptors. This is externalized so that it can be subclassed.
 * <b>Note</b> This is a class method beware...
 */
exports._objectDescriptorModuleIdDescriptor = {
    serializable:false,
    enumerable: false,
    get:function () {
        var info = Montage.getInfoForObject(this);
        var self = (info && !info.isInstance) ? this : this.constructor;
        if ((!Object.getOwnPropertyDescriptor(self, "_objectDescriptorModuleId")) || (!self._objectDescriptorModuleId)) {
            info = Montage.getInfoForObject(self);
            var moduleId = info.moduleId,
                slashIndex = moduleId.lastIndexOf("/"),
                dotIndex = moduleId.lastIndexOf(".");
            slashIndex = ( slashIndex === -1 ? 0 : slashIndex + 1 );
            dotIndex = ( dotIndex === -1 ? moduleId.length : dotIndex );
            dotIndex = ( dotIndex < slashIndex ? moduleId.length : dotIndex );
            Montage.defineProperty(self, "_objectDescriptorModuleId", {
                enumerable: false,
                value: moduleId.slice(0, dotIndex) + ".mjson"
            });
        }
        return self._objectDescriptorModuleId;
    }
};

/***
 * @deprecated use exports._objectDescriptorModuleIdDescriptor
 */
exports._blueprintModuleIdDescriptor = {
    serializable:false,
    enumerable: false,
    get:function () {
        var info = Montage.getInfoForObject(this);
        var self = (info && !info.isInstance) ? this : this.constructor;
        if ((!Object.getOwnPropertyDescriptor(self, "_objectDescriptorModuleId")) || (!self._objectDescriptorModuleId)) {
            info = Montage.getInfoForObject(self);
            var moduleId = info.moduleId,
                slashIndex = moduleId.lastIndexOf("/"),
                dotIndex = moduleId.lastIndexOf(".");
            slashIndex = ( slashIndex === -1 ? 0 : slashIndex + 1 );
            dotIndex = ( dotIndex === -1 ? moduleId.length : dotIndex );
            dotIndex = ( dotIndex < slashIndex ? moduleId.length : dotIndex );
            Montage.defineProperty(self, "_objectDescriptorModuleId", {
                enumerable: false,
                value: moduleId.slice(0, dotIndex) + ".meta"
            });
        }
        return self._objectDescriptorModuleId;
    }
};

exports._objectDescriptorDescriptor = {
    serializable:false,
    enumerable: false,
    get:function () {
        var info = Montage.getInfoForObject(this);
        var self = info && !info.isInstance ? this : this.constructor;
        if (!Object.getOwnPropertyDescriptor(self, "_objectDescriptor") || !self._objectDescriptor) {
            var objectDescriptorModuleId = self.objectDescriptorModuleId || self.blueprintModuleId;
            if (!objectDescriptorModuleId) {
                throw new TypeError("ObjectDescriptor moduleId undefined for the module '" + JSON.stringify(self) + "'");
            }
            if (!exports._objectDescriptorDescriptor.ObjectDescriptorModulePromise) {
                exports._objectDescriptorDescriptor.ObjectDescriptorModulePromise = require.async("core/meta/module-object-descriptor").get("ModuleObjectDescriptor");
            }
            Montage.defineProperty(self, "_objectDescriptor", {
                enumerable: false,
                value: exports._objectDescriptorDescriptor.ObjectDescriptorModulePromise.then(function (ObjectDescriptor) {
                    var info = Montage.getInfoForObject(self);

                    return ObjectDescriptor.getObjectDescriptorWithModuleId(objectDescriptorModuleId, info.require)
                        .catch(function (error) {
                            // FIXME only generate object descriptor if the moduleId
                            // requested does not exist. If any parents do not
                            // exist then the error should still be thrown.
                            if (error.message.indexOf("Can't XHR") !== -1) {
                                return ObjectDescriptor.createDefaultObjectDescriptorForObject(self).then(function (objectDescriptor) {
                                    return objectDescriptor;
                                });
                            } else {
                                throw error;
                            }
                        });
                })
            });
        }
        return self._objectDescriptor;
    },
    set:function (value) {
        var info = Montage.getInfoForObject(this);
        var _objectDescriptorValue;
        var self = (info && !info.isInstance) ? this : this.constructor;
        if (value === null) {
            _objectDescriptorValue = null;
        } else if (typeof value.then === FUNCTION) {
            throw new TypeError("Object descriptor should not be a promise");
        } else {
            value.objectDescriptorInstanceModule = self.objectDescriptorModule;
            _objectDescriptorValue = require("./promise").Promise.resolve(value);
        }
        Montage.defineProperty(self, "_objectDescriptor", {
            enumerable: false,
            value: _objectDescriptorValue
        });
    }
};

/**
 * @deprecated use exports._objectDescriptorDescriptor
 */
exports._blueprintDescriptor = exports._objectDescriptorDescriptor;
