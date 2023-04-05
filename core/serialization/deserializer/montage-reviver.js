/*global console, Proxy */
var Montage = require("../../core").Montage,
    ValuesDeserializer = require("./values-deserializer").ValuesDeserializer,
    SelfDeserializer = require("./self-deserializer").SelfDeserializer,
    UnitDeserializer = require("./unit-deserializer").UnitDeserializer,
    ModuleReference = require("../../module-reference").ModuleReference,
    Alias = require("../alias").Alias, Bindings = require("../bindings"),
    Promise = require("../../promise").Promise,
    deprecate = require("../../deprecate"),
    camelCaseConverter = require('../../converter/camel-case-converter').singleton,
    kebabCaseConverter = require('../../converter/kebab-case-converter').singleton,
    ONE_ASSIGNMENT = "=",
    ONE_WAY = "<-",
    TWO_WAY = "<->";

require("../../shim/string");
require("core/extras/date");

var PROXY_ELEMENT_MAP = new WeakMap();
var DATA_ATTRIBUTES_MAP = new Map();

/**
 * Element methods that are implemented natively and throw an invocation error
 * if applied to the wrong type. When an element proxy proxies these methods,
 * it needs to call `bind(element)` to avoid the invocation error.
 */
var ELEMENT_NATIVE_METHODS = [
    "dispatchEvent", "addEventListener",
    "firstElementChild", "firstChild",
    "getAttribute", "getAttributeNames", "getAttributeNode",
    "getElementsByClassName", "getElementsByTagName"
];

var ModuleLoader = Montage.specialize({

    _require: {
        value: null
    },

    _objectRequires: {
        value: null
    },

    init: {
        value: function (_require, objectRequires) {
            if (typeof _require !== "function") {
                throw new Error("Function 'require' missing.");
            }
            if (typeof _require.location !== "string") {
                throw new Error("Function 'require' location is missing");
            }
            if (typeof objectRequires !== "object" &&
                typeof objectRequires !== "undefined") {
                throw new Error("Parameter 'objectRequires' should be an object.");
            }

            this._require = _require;
            this._objectRequires = objectRequires;

            return this;
        }
    },

    getModuleDescriptor: {
        value: function (_require, moduleId) {
            var moduleDescriptor = _require.getModuleDescriptor(_require.resolve(moduleId));

            while (moduleDescriptor.redirect !== void 0) {
                moduleDescriptor = _require.getModuleDescriptor(module.redirect);
            }

            if (moduleDescriptor.mappingRedirect !== void 0) {
                return moduleDescriptor.mappingRequire.getModuleDescriptor(moduleDescriptor.mappingRedirect);

                // return this.getExports(
                //     moduleDescriptor.mappingRequire,
                //     moduleDescriptor.mappingRedirect
                // );
            }

            return moduleDescriptor;
        }
    },

    getModule: {
        value: function (moduleId, label, reviver) {
            var objectRequires = this._objectRequires,
                _require, module;

            if (objectRequires && label in objectRequires) {
                _require = objectRequires[label];
            } else {
                _require = this._require;
            }

            try {
                module = _require(moduleId);
            } catch (err) {
                if (!module && (moduleId.endsWith(".mjson") || moduleId.endsWith(".meta"))) {
                    module = this.getModuleDescriptor(_require, moduleId).text;
                }

                if (!module && !reviver._isSync) {
                    module = _require.async(moduleId);
                } else {
                    throw err;
                }
            }

            return module;
        }
    }
});

/**
 * @class MontageReviver
 */
var MontageReviver = exports.MontageReviver = Montage.specialize(/** @lends MontageReviver# */ {

    moduleLoader: {
        value: null
    },

    /**
     * @param {Require} _require The require object to load modules
     * @param {Object} objectRequires A dictionary indexed by object label with
     *        the require object to use for a specific object of the
     *        serialization.
     * @param {Function} deserializerConstructor Function to create a new
     *        deserializer. Useful for linking to an external module
     *        that also needs to be deserialized.
     */
    init: {
        value: function (_require, objectRequires, deserializer, isSync, locationId) {
            this.moduleLoader = new ModuleLoader().init(_require, objectRequires);
            this._require = _require;
            this._deserializer = deserializer;
            this._isSync = isSync;
            this._locationId = locationId;
            return this;
        }
    },
    _isSync: {
        value: false
    },

    _locationId: {
        value: null
    },


    getTypeOf: {
        value: function (value) {
            var typeOf;

            if (value === null) {
                return "null";
            } else if (Array.isArray(value)) {
                return "array";
            }
            //TODO: would be great to optimize and not create twice a date as we do now. Once to parse
            //and another time later when we need the value
            else if(Date.parseRFC3339(value)) {
                return "date";
            //} else if (typeOf === "object" && Object.keys(value.__proto__).length === 1) {
            } else if ((typeOf = typeof value) === "object" && Object.keys(value).length === 1) {
                if ("@" in value) {
                    return "reference";
                } else if ("/" in value) {
                    return "regexp";
                } else if ("#" in value) {
                    return "Element";
                } else if ("%" in value) {
                    return "Module";
                } else if (ONE_WAY in value || TWO_WAY in value || ONE_ASSIGNMENT in value) {
                    return "binding";
                } // else return typeOf -> object
            }

            return typeOf;
        }
    },

    _checkLabel: {
        value: function (label, isTemplateProperty) {
            if (isTemplateProperty && label[0] !== ":") {
                return new Error("Aliases can only be defined in template values (start with a colon (:)), \"" + label + "\".");
            } else if (!isTemplateProperty && label[0] === ":") {
                return new Error("Only aliases are allowed as template values (start with a colon (:), \"" + label + "\".");
            }
        }
    },

    setProxyForDatasetOnElement: {
        value: function (element, montageObjectDesc) {
            var originalDataset = element.dataset;

            if (Object.getPrototypeOf(originalDataset) !== null) {
                var datasetAttributes = Object.keys(originalDataset),
                    targetObject = Object.create(null), self = this,
                    datasetAttribute, propertyNames;

                if (Proxy.prototype) { // The native Proxy has no prototype property.
                    // Workaround for Proxy polyfill https://github.com/GoogleChrome/proxy-polyfill
                    // the properties of a proxy must be known at creation time.
                    // TODO: remove when we drop the support of IE11.
                    if (montageObjectDesc.values) {
                        propertyNames = Object.keys(montageObjectDesc.values);
                    } else { // deprecated
                        propertyNames = Object.keys(montageObjectDesc.properties)
                            .concat(Object.keys(montageObjectDesc.bindings));
                    }

                    datasetAttributes = datasetAttributes.concat(
                        propertyNames.filter(function (propertyName) {
                            return propertyName.startsWith("dataset.");
                        })
                    );

                    for (var i = 0, length = datasetAttributes.length; i < length; i++) {
                        datasetAttribute = datasetAttributes[i];
                        if (originalDataset[datasetAttribute]) {
                            targetObject[datasetAttribute] =
                                originalDataset[datasetAttribute];
                        } else {
                            targetObject[datasetAttribute.replace(/^dataset\./, '')] = void 0;
                        }
                    }
                }

                Object.defineProperty(element, "dataset", {
                    value: new Proxy(targetObject, {
                        set: function (target, propertyName, value) {
                            target[propertyName] = value;
                            originalDataset[propertyName] = value;
                            element.nativeSetAttribute(
                                DATA_ATTRIBUTES_MAP.get(propertyName) ||
                                (DATA_ATTRIBUTES_MAP.set(
                                    propertyName,
                                    'data-' +
                                    kebabCaseConverter.convert(propertyName)
                                )).get(propertyName),
                                value
                            );
                            return true;
                        },
                        get: function (target, propertyName) {
                            return target[propertyName];
                        }
                    })
                });
            }
        }
    },

    setProxyOnElement: {
        value: function (element, montageObjectDesc) {
            if (!PROXY_ELEMENT_MAP.has(element)) {
                var targetObject = Object.create(null);

                if (Proxy.prototype) { // The native Proxy has no prototype property.
                    // Workaround for Proxy polyfill https://github.com/GoogleChrome/proxy-polyfill
                    // the properties of a proxy must be known at creation time.
                    // TODO: remove when we drop the support of IE11.
                    var propertyNames, propertyName;

                    for (propertyName in element) {
                        if (element.hasOwnProperty(propertyName)) {
                            targetObject[propertyName] = void 0;
                        }
                    }

                    if (montageObjectDesc.values) {
                        propertyNames = Object.keys(montageObjectDesc.values);
                    } else { // deprecated
                        propertyNames = Object.keys(montageObjectDesc.properties)
                            .concat(Object.keys(montageObjectDesc.bindings));
                    }

                    for (var i = 0, length = propertyNames.length; i < length; i++) {
                        propertyName = propertyNames[i];
                        if (!(propertyName in element) && propertyName.indexOf('.') === -1) {
                            targetObject[propertyName] = void 0;
                        }
                    }
                }

                PROXY_ELEMENT_MAP.set(element, new Proxy(targetObject, {
                    set: function (target, propertyName, value) {
                        if (!(propertyName in Object.getPrototypeOf(element))) {
                            if (Object.getOwnPropertyDescriptor(element, propertyName) === void 0) {
                                Object.defineProperty(element, propertyName, {
                                    set: function (value) {
                                        target[propertyName] = value;

                                        if (value === null || value === void 0) {
                                            element.removeAttribute(propertyName);
                                        } else {
                                            element.nativeSetAttribute(propertyName, value);
                                        }
                                    },
                                    get: function () {
                                        return target[propertyName];
                                    }
                                });
                            }
                        }

                        if (target[propertyName] !== value) {
                            element[propertyName] = value;
                        }

                        return true;
                    },
                    get: function (target, propertyName) {
                        var property = target[propertyName] || element[propertyName];
                        if (typeof property === "function" && ELEMENT_NATIVE_METHODS.indexOf(propertyName) !== -1) {
                            return property.bind(target[propertyName] ? target : element);
                        }
                        return property;
                    }
                }));
            }

            return PROXY_ELEMENT_MAP.get(element);
        }
    },

    wrapSetAttributeForElement: {
        value: function (element) {
            if (element.setAttribute === element.nativeSetAttribute) {
                var proxyElement = PROXY_ELEMENT_MAP.get(element),
                    self = this;

                element.setAttribute = function (key, value) {
                    var propertyName;
                    if (key.startsWith('data-')) {
                        propertyName = camelCaseConverter.convert(key.replace('data-', ''));
                        proxyElement.dataset[propertyName] = value;
                    } else {
                        propertyName = camelCaseConverter.convert(key);
                        proxyElement[propertyName] = value;
                    }
                    element.nativeSetAttribute(key, value);
                };
            }
        }
    },

    reviveRootObject: {
        value: function (value, context, label) {
            var error,
                object,
                isAlias = "alias" in value;

            // Only aliases are allowed as template values, everything else
            // should be rejected as an error.
            error = this._checkLabel(label, isAlias);
            if (error) {
                throw error;
            }

            // Check if the optional "debugger" unit is set for this object
            // and stop the execution. This is intended to provide a certain
            // level of debugging in the serialization.
            if (value.debugger) {
                console.debug("set a breakpoint here");
            }

            if ("value" in value) {
                // it's overriden by a user object
                if (context.hasUserObject(label)) {
                    object = context.getUserObject(label);
                    context.setObjectLabel(object, label);
                    return object;
                }

                var valueType = this.getTypeOf(value.value),
                    revivedValue = this.reviveValue(value.value, context, label),
                    revivedUnits = this.reviveObjectLiteral(value, context, undefined, MontageReviver._unitNames);

                context.setObjectLabel(revivedValue, label);

                if (valueType === "Element") {
                    if (!Promise.is(revivedValue)) {
                        var proxyElement = this.setProxyOnElement(revivedValue, value);
                        this.setProxyForDatasetOnElement(revivedValue, value);
                        this.wrapSetAttributeForElement(revivedValue);

                        context.setBindingsToDeserialize(proxyElement, revivedUnits);
                        this.deserializeMontageObjectValues(
                            proxyElement,
                            revivedUnits.values || revivedUnits.properties, //deprecated
                            context
                        );
                        context.setUnitsToDeserialize(proxyElement, revivedUnits, MontageReviver._unitNames);
                    }
                } else if (valueType === "object") {
                    context.setBindingsToDeserialize(revivedValue, revivedUnits);
                    this.deserializeMontageObjectValues(
                        revivedValue,
                        revivedUnits.values || revivedUnits.properties, //deprecated
                        context
                    );
                    context.setUnitsToDeserialize(revivedValue, revivedUnits, MontageReviver._unitNames);
                }

                return revivedValue;

            } else if (Object.keys(value).length === 0) {
                // it's an external object
                if (context.hasUserObject(label)) {
                    object = context.getUserObject(label);
                    context.setObjectLabel(object, label);
                    return object;
                }

                return this.reviveExternalObject(value, context, label);
            } else if ("alias" in value) {
                return this.reviveAlias(value, context, label);
            } else {
                return this.reviveMontageObject(value, context, label);
            }
        }
    },

    reviveElement: {
        value: function (value, context, label) {
            var elementId = value["#"],
                element = context.getElementById(elementId);

            if (element) {
                if (label) {
                    context.setObjectLabel(element, label);
                }
                return element;
            } else {
                throw new Error("Element with id '" + elementId + "' was not found.");
            }
        }
    },

    reviveModule: {
        value: function (value, context, label) {
            var moduleId = value["%"],
                _require = context.getRequire();

            moduleId = _require.resolve(moduleId);
            var module = _require.getModuleDescriptor(moduleId);

            return new ModuleReference().initWithIdAndRequire(module.id, module.require);
        }
    },

    reviveAlias: {
        value: function (value, context, label) {
            var alias = new Alias();
            alias.value = value.alias;

            context.setObjectLabel(alias, label);
            return alias;
        }
    },

    reviveMontageObject: {
        value: function (value, context, label) {
            var self = this,
                locationId = value.prototype || value.object,
                isObjectDescriptor = !!(locationId &&
                    (locationId.endsWith(".mjson") || locationId.endsWith(".meta"))),
                module, locationDesc, location, objectName;

            if (global[locationId] && typeof global[locationId] === "function") {
                module = global;
                objectName = locationId;
            } else if (locationId) {
                locationDesc = MontageReviver.parseObjectLocationId(locationId);
                module = this.moduleLoader.getModule(locationDesc.moduleId, label, this);
                objectName = locationDesc.objectName;
            }


            if (!this._isSync && isObjectDescriptor && !Promise.is(module) && !module.montageObject) {
                module = context._require.async(locationDesc.moduleId);
            }

            if(!module && this._isSync) {
                throw new Error(
                    "Tried to revive montage object with label " + label +
                    " synchronously but the module was not loaded: " + JSON.stringify(value)
                );
            } else if (Promise.is(module)) {
                if (this._isSync) {
                    throw new Error(
                        "Tried to revive montage object with label " + label +
                        " synchronously but the module was not loaded: " + JSON.stringify(value)
                    );
                }
                return module.then(function (exports) {
                    return self.instantiateObject(exports, locationDesc, value, objectName, context, label);
                }, function (error) {
                    if (error.stack) {
                        console.error(error.stack);
                    }
                    throw new Error('Error deserializing "' + label +
                        '" when loading module "' + locationDesc.moduleId +
                        "' from '" + value.prototype + "' cause: " + error.message);
                });
            } else {
                return this.instantiateObject(module, locationDesc, value, objectName, context, label);
            }
        }
    },

    instantiateObject: {
        value: function (module, locationDesc, value, objectName, context, label) {
            var object;
                object = this.getMontageObject(value, module, objectName, context, label);
                context.setObjectLabel(object, label);
                return this.instantiateMontageObject(value, object, objectName, context, label);
        }
    },

    _getMJSONObject: {
        value: function (moduleId, context) {
            var moduleDescriptor = context._require.getModuleDescriptor(context._require.resolve(moduleId)),
            dependencyContext = this._deserializer.constructor.moduleContexts.get(moduleDescriptor);
            if(!dependencyContext && moduleDescriptor.mappingRequire) {
                //Let's see if the module is known as another in Deserializer.moduleContexts
                moduleDescriptor = moduleDescriptor.mappingRequire.getModuleDescriptor(moduleDescriptor.mappingRedirect);
                dependencyContext = this._deserializer.constructor.moduleContexts.get(moduleDescriptor);
            }

            if(dependencyContext) {
                return dependencyContext.getObject("root");
            }
            return null;
        }
    },

    getMontageObject: {
        value: function (value, module, objectName, context, label) {
            var object, moduleId;

            if (context.hasUserObject(label)) {

                return context.getUserObject(label);

            } else if ("prototype" in value) {
                moduleId = value.prototype;
                if (moduleId && (moduleId.endsWith(".mjson") || moduleId.endsWith(".meta"))) {
                    object = Object.create(this._getMJSONObject(moduleId, context));
                }
                else {
                    if (!(objectName in module)) {
                        throw new Error('Error deserializing "' + label +
                            '": object named "' + objectName + '"' +
                            ' was not found in "' + value.prototype + '".' +
                            " Available objects are: " + Object.keys(module) + ".");
                    }
                    // TODO: For now we need this because we need to set
                    // isDeserilizing before calling didCreate.
                    object = module[objectName];
                    object = (typeof object === "function") ? new object() : Object.create(object);

                }
                object.isDeserializing = true;
                return object;
            } else if ("object" in value) {
                moduleId = value.object;

                if (moduleId.endsWith(".json")) {
                    return module;
                }
                else if (moduleId && (moduleId.endsWith(".mjson") || moduleId.endsWith(".meta"))) {
                    object = this._getMJSONObject(moduleId, context);
                    object.isDeserializing = true;
                    return object;
                }
                else {
                    if (!(objectName in module)) {
                        throw new Error('Error deserializing "' + label +
                            '": object named "' + object +
                            "' was not found given '" + moduleId + "'");
                    }

                    return module[objectName];
                }

            } else {
                throw new Error("Error deserializing " + JSON.stringify(value) + ", might need \"prototype\" or \"object\" on label " + JSON.stringify(label));
            }
        }
    },

    instantiateMontageObject: {
        value: function (serialization, object, objectName, context, label) {
            var self = this,
                montageObjectDesc;


            if (object !== null && object !== void 0) {
                object.isDeserializing = true;
            }

            if (serialization.bindings) {
                deprecate.deprecationWarningOnce(
                    "'bindings' block is deprecated, use 'values' instead"
                );
            }

            if (serialization.properties) {
                deprecate.deprecationWarningOnce(
                    "'properties' block is deprecated, use 'values' instead"
                );
            }

            context.setBindingsToDeserialize(object, serialization);//Looks in values for all "bindings to collect and apply later"
            montageObjectDesc = this.reviveObjectLiteral(serialization, context,undefined, undefined, object);

            if (Promise.is(montageObjectDesc)) {
                return montageObjectDesc.then(function(montageObjectDesc) {
                    return self.deserializeMontageObject(montageObjectDesc, object, context, label);
                });
            } else {
                return this.deserializeMontageObject(montageObjectDesc, object, context, label);
            }
        }
    },

    deserializeMontageObject: {
        value: function (montageObjectDesc, object, context, label) {
            // Units are deserialized after all objects have been revived.
            // This happens at didReviveObjects.
            context.setUnitsToDeserialize(object, montageObjectDesc, MontageReviver._unitNames);
            return object;
        }
    },

    deserializeMontageObjectProperties: {
        value: deprecate.deprecateMethod(void 0, function (object, values, context) {
            return this.deserializeMontageObjectValues(object, values, context);
        }, "deserializeMontageObjectProperties", "deserializeMontageObjectValues")
    },

    deserializeMontageObjectValues: {
        value: function (object, values, context) {
            var value;

            if (typeof object.deserializeProperties === "function" || typeof object.deserializeValues === "function") {
                var valuesDeserializer = new ValuesDeserializer()
                    .initWithReviverAndObjects(this, context);
                if (object.deserializeValues) {
                    value = object.deserializeValues(valuesDeserializer);
                } else { // deprecated
                    value = object.deserializeProperties(valuesDeserializer);
                }
            } else {
                /* jshint forin: true */
                for (var key in values) {
                /* jshint forin: false */
                    object[key] = values[key];
                }
            }

            return value;
        }
    },

    didReviveObjects: {
        value: function (context) {
            this._deserializeUnits(context);
            this._invokeDeserializedFromSerialization(context);

            //We avoided calling deserializedFromSerialization()
            //on pre-existing objects that are passed on deserializer.
            //We special case that in template.js, calling
            //templateDidLoad() on the owner. We could generalize
            //this here.
        }
    },

    // TODO: can deserializeSelf make deserializedFromSerialization irrelevant?
    _invokeDeserializedFromSerialization: {
        value: function (context) {
            var objects = context._objects,
                object;

            /* jshint forin: true */
            for (var label in objects) {
            /* jshint forin: false */

                object = objects[label];

                if (object !== null && object !== void 0) {
                    delete object.isDeserializing;
                }

                if (!context.hasUserObject(label)) {
                    // TODO: merge deserializedFromSerialization with
                    //       deserializedFromTemplate?
                    if (object && typeof object.deserializedFromSerialization === "function") {
                        object.deserializedFromSerialization(label);
                    }
                }
            }
        }
    },

    _deserializePropertyValues: {
        value: function (context) {
            var object, objects = context._objects,
                serialization = context._serialization,
                values, label;

            /* jshint forin: true */
            for (label in objects) {
            /* jshint forin: false */

                if((object = objects[label])) {
                    values = serialization[label];
                    this.deserializeMontageObject(values, object, context, label);
                }
            }
        }
    },

    _deserializeBindings: {
        value: function (context) {
            var bindingsToDeserialize = context.getBindingsToDeserialize(),
                unitDeserializer = new UnitDeserializer(),
                bindingsToDeserializeDesc;

            if (bindingsToDeserialize) {
                for (var i = 0, length = bindingsToDeserialize.length; i < length; i++) {
                    bindingsToDeserializeDesc = bindingsToDeserialize[i];
                    Bindings.deserializeObjectBindings(
                        unitDeserializer.initWithContext(context),
                        bindingsToDeserializeDesc.object,
                        bindingsToDeserializeDesc.bindings
                    );
                }
            }
        }
    },


    _deserializeObjectUnit: {
        value: function (context, object, unitsDesc, unitDeserializer) {

            var unitNames = unitsDesc.unitNames,
                j, unitName;

            for (j = 0; (unitName = unitNames[j]); j++) {
                this._deserializeObjectUnitNamed(context, object, unitName, unitsDesc, unitDeserializer, j);
            }
        }
    },

    _deserializeObjectUnitNamed: {
        value: function (context, object, unitName, _unitsDesc, _unitDeserializer, _unitNameIndex) {
            var unitsDesc = _unitsDesc || context.unitsToDeserialize.get(object),
            objectDesc,
            unitNames,
            unitNameIndex,
            unitDeserializer,
            moduleId;

            if(!unitsDesc) {
                return;
            }

            objectDesc = unitsDesc.objectDesc;
            unitNames = unitsDesc.unitNames;
            unitNameIndex = _unitNameIndex || unitNames.indexOf(unitName);
            unitDeserializer = _unitDeserializer || new UnitDeserializer();


            if(_unitNameIndex || unitNameIndex !== -1) {
                moduleId = objectDesc.prototype || objectDesc.object;
                if(!("isMJSON" in unitsDesc)) {
                    unitsDesc.isMJSON = moduleId && (moduleId.endsWith(".mjson") || moduleId.endsWith(".meta"));
                }

                /*
                 * If unitName === "values", but missing in objectDesc, for backward compatibility,
                 * we should process it nonetheless as objects expect to be called
                 * deserializeSelf even if there aren't any value to gained.
                 * But for .mjson this never happened before so let's not.
                 * TODO: remove in the future as it's a waste of time.
                 */

                if ((unitName === "values" && !unitsDesc.isMJSON) || unitName in unitsDesc.objectDesc) {
                    unitDeserializer.initWithContext(context);
                    //Needs to add the whole unitsDesc.objectDesc as an argument for now as SelfDeserializer currently expects it.
                    MontageReviver._unitRevivers.get(unitName)(unitDeserializer, object, objectDesc[unitName], unitsDesc);
                }
            }
        }
    },

    _deserializeMJSONDependencyUnits: {
        value: function (context) {

            var deserializer = this._deserializer,
                Deserializer,
                mjsonDependencies,
                mjsonDependenciesIteraror,
                require = context._require,
                dependencyModuleId, dependencyContext, moduleDescriptor;

            if(deserializer) {
                Deserializer = deserializer.constructor;
                mjsonDependencies = context._mjsonDependencies;
                mjsonDependenciesIteraror = mjsonDependencies ? mjsonDependencies.values() : undefined;


                if(mjsonDependencies) {
                    while((dependencyModuleId = mjsonDependenciesIteraror.next().value)) {
                        mjsonDependencies.delete(dependencyModuleId);
                        moduleDescriptor = require.getModuleDescriptor(require.resolve(dependencyModuleId));
                        dependencyContext = Deserializer.moduleContexts.get(moduleDescriptor);
                        if(!dependencyContext && moduleDescriptor.mappingRequire) {
                            //Let's see if the module is known as another in Deserializer.moduleContexts
                            moduleDescriptor = moduleDescriptor.mappingRequire.getModuleDescriptor(moduleDescriptor.mappingRedirect);
                            dependencyContext = Deserializer.moduleContexts.get(moduleDescriptor);
                        }
                        if(dependencyContext) {
                            dependencyContext._reviver._deserializeUnits(dependencyContext);
                        }
                    }
                }
            }
        }
    },

    _deserializeUnits: {
        value: function (context) {

            this._deserializeMJSONDependencyUnits(context);

            var unitsToDeserialize = context.unitsToDeserialize,
                unitsToDeserializeKeys,
                unitDeserializer,
                object;

            if(unitsToDeserialize.size > 0) {
                unitsToDeserializeKeys = unitsToDeserialize.keys();
                unitDeserializer = new UnitDeserializer();

                while((object = unitsToDeserializeKeys.next().value)) {
                            this._deserializeObjectUnit(context, object, unitsToDeserialize.get(object), unitDeserializer);
                    unitsToDeserialize.delete(object);
                }
            }
        }
    },

    _createAssignValueFunction: {
        value: function(object, propertyName) {
            return function(value) {
                object[propertyName] = value;
            };
        }
    },

    getCustomObjectTypeOf: {
        writable: true,
        value: function() {}
    },

    reviveValue: {
        value: function reviveValue(value, context, label) {
            var type = this.getTypeOf(value),
                revived = this[(reviveValue._methodByType[type] || ("revive" + type))](value, context, label);

            if (this._isSync && Promise.is(revived)) {
                throw new Error("Unable to revive value with label " + label + " synchronously: " + value);
            } else {
                return revived;
            }
        }
    },

    _reviveMethodByType: {
        value: {}
    },

    reviveBinding: {
        value: function(value, context, label) {
            return value;
        }
    },

    reviveNativeValue: {
        value: function(value, context, label) {
            if (label) {
                context.setObjectLabel(value, label);
            }

            return value;
        }
    },

    reviveObjectLiteral: {
        value: function reviveObjectLiteral(value, context, label, filterKeys) {
            var item,
                promises,
                propertyNames = context.propertyToReviveForObjectLiteralValue(value),
                propertyName,iValue,
                propertyNamesIterator = propertyNames.values();


            if (label) {
                context.setObjectLabel(value, label);
            }

            while((propertyName = propertyNamesIterator.next().value)) {
                if ((!filterKeys || filterKeys.indexOf(propertyName) > -1)) {
                    if ((iValue = value[propertyName]) === value) {
                        // catch object property that point to its parent
                        return value;
                    }

                    item = this.reviveValue(iValue, context);

                    if (Promise.is(item)) {
                        (promises || (promises = [])).push(
                            item.then(this._createAssignValueFunction(
                                    value, propertyName)
                            )
                        );
                    } else if(iValue !== item) {
                        value[propertyName] = item;
                    }

                    propertyNames.delete(propertyName);
                }
            }

            if (!promises || (promises && promises.length === 0)) {
                return value;
            } else {
                return Promise.all(promises).then(function() {
                    return value;
                });
            }
        }
    },

    reviveRegExp: {
        value: function(value, context, label) {

            var valuePath = value["/"],
                regexp = new RegExp(valuePath.source, valuePath.flags);

            if (label) {
                context.setObjectLabel(regexp, label);
            }

            return regexp;
        }
    },

    reviveDate: {
        value: function(value, context, label) {

            var date = Date.parseRFC3339(value);

            if (label) {
                context.setObjectLabel(date, label);
            }

            return date;
        }
    },

    reviveObjectReference: {
        value: function(value, context, label) {
            return context.getObject(value["@"]);
        }
    },

    reviveArray: {
        value: function(value, context, label) {
            var item,
                promises;

            if (label) {
                context.setObjectLabel(value, label);
            }

            for (var i = 0, ii = value.length; i < ii; i++) {
                item = this.reviveValue(value[i], context);

                if (Promise.is(item)) {
                    (promises || (promises = [])).push(
                        item.then(this._createAssignValueFunction(value, i))
                    );
                } else {
                    value[i] = item;
                }
            }

            if (!promises || promises.length === 0) {
                return value;
            } else {
                return Promise.all(promises).then(function() {
                    return value;
                });
            }
        }
    },

    reviveExternalObject: {
        value: function(value, context, label) {
            throw new Error("External object '" + label + "' not found in user objects.");
        }
    },

    _callReviveMethod: {
        value: function(methodName, value, context, label) {
            return this[methodName](value, context, label);
        }
    }

}, /** @lends MontageReviver. */ {
    _unitRevivers: {value: new Map()},
    _unitNames: {value: []},

    _findObjectNameRegExp: {
        value: /([^\/]+?)(\.reel)?$/
    },
    _toCamelCaseRegExp: {
        value: /(?:^|-)([^-])/g
    },
    _replaceToCamelCase: {
        value: function (_, g1) { return g1.toUpperCase(); }
    },
    // Cache of location descriptors indexed by locationId
    _locationDescCache: {value: new Map()},

    customObjectRevivers: {value: new Map()},

    /**
     * Location Id is in the form of <moduleId>[<objectName>] where
     * [<objectName>] is optional. When objectName is missing it is derived
     * from the last path component of moduleId transformed into CamelCase.
     *
     * @example "event/event-manager" has a default objectName of EventManager.
     *
     * When the last path component ends with ".reel" it is removed before
     * creating the default objectName.
     *
     * @example "matte/ui/input-range.reel" has a default objectName of
     *          InputRange.
     *
     * @returns {moduleId, objectName}
     */
    parseObjectLocationId: {
        value: function (locationId) {
            return this._locationDescCache.get(locationId) || this.createObjectLocationDesc(locationId);
        }
    },

    createObjectLocationDesc: {
        value: function (locationId) {
            var moduleId,
                objectName,
                bracketIndex = locationId.indexOf("[");

            if (bracketIndex > 0) {
                moduleId = locationId.substr(0, bracketIndex);
                objectName = locationId.slice(bracketIndex + 1, -1);
            } else {
                moduleId = locationId;
                this._findObjectNameRegExp.test(locationId);
                objectName = RegExp.$1.replace(
                    this._toCamelCaseRegExp,
                    this._replaceToCamelCase
                );
            }

            var locationDesc = {
                moduleId: moduleId,
                objectName: objectName
            };
            this._locationDescCache.set(locationId, locationDesc);
            return locationDesc;
        }
    },

    defineUnitReviver: {
        value: function (name, funktion) {
            this._unitRevivers.set(name, funktion);
            this._unitNames.push(name);
        }
    },

    getTypeOf: {
        value: function (value) {
            return this.prototype.getTypeOf.call(this, value);
        }
    },

    addCustomObjectReviver: {
        value: function(reviver) {
            var customObjectRevivers = this.customObjectRevivers;

            /* jshint forin: true */
            for (var methodName in reviver) {
            /* jshint forin: false */

                if (methodName === "getTypeOf") {
                    continue;
                }

                if (
                    typeof reviver[methodName] === "function" &&
                        methodName.substr(0, 5) === "revive"
                ) {
                    if (typeof (customObjectRevivers.get(methodName)) === "undefined") {
                        customObjectRevivers.set(methodName, reviver[methodName].bind(reviver));
                    } else {
                        return new Error("Reviver '" + methodName + "' is already registered.");
                    }
                }
            }

            this.prototype.getCustomObjectTypeOf = this.makeGetCustomObjectTypeOf(reviver.getTypeOf);
        }
    },

    resetCustomObjectRevivers: {
        value: function() {
            this.customObjectRevivers.clear();
            this.prototype.getCustomObjectTypeOf = function() {};
        }
    },

    makeGetCustomObjectTypeOf:{
        value: function (getCustomObjectTypeOf) {
            var previousGetCustomObjectTypeOf = this.prototype.getCustomObjectTypeOf;

            return function(value) {
                return getCustomObjectTypeOf(value) || previousGetCustomObjectTypeOf(value);
            };
        }
    }

});

var MontageReviverProto = MontageReviver.prototype,
    _reviveMethodByType =  MontageReviverProto._reviveMethodByType;

_reviveMethodByType["string"] = _reviveMethodByType["number"] = _reviveMethodByType["boolean"] = _reviveMethodByType["null"] = _reviveMethodByType["undefined"] = "reviveNativeValue";
_reviveMethodByType["date"] = "reviveDate";
_reviveMethodByType["regexp"] = "reviveRegExp";
_reviveMethodByType["reference"] = "reviveObjectReference";
_reviveMethodByType["array"] = "reviveArray";
_reviveMethodByType["object"] = "reviveObjectLiteral";
_reviveMethodByType["Element"] = "reviveElement";
_reviveMethodByType["binding"] = "reviveBinding";
_reviveMethodByType["Module"] = "reviveModule";


MontageReviverProto.reviveValue._methodByType = _reviveMethodByType;

MontageReviverProto = _reviveMethodByType = null;


MontageReviver.findProxyForElement = function (element) {
    return PROXY_ELEMENT_MAP.get(element);
};


MontageReviver.defineUnitReviver("values", function (unitDeserializer, object, values,_unitsDesc) {
    var context = unitDeserializer.context,
        montageObjectDesc = _unitsDesc.objectDesc,
        substituteObject;

    if (typeof object.deserializeSelf === "function") {


        var selfDeserializer = new SelfDeserializer();
        //If the context is sync, we carry the info to the selfDeserializer
        selfDeserializer.isSync = context.isSync;
        selfDeserializer.initWithObjectAndObjectDescriptorAndContextAndUnitNames(object, montageObjectDesc, context, MontageReviver._unitNames);
        substituteObject = (substituteObject || object).deserializeSelf(selfDeserializer);

        if (typeof substituteObject !== "undefined" && substituteObject !== object) {
            //The deserialization used to be inlined, so it was easy to substitute.
            //setObjectLabel only replaces the object on the root dictionary. It's possible
            //that properties pointing to the original object would do after the substitution
            //even in the previous implementation.
            //we got to find how to substitute.... We don't know which label it is
            //This is rare so we're just going to walk objets.
            var label,
                context_objects = context._objects;

            for(label in context_objects) {
                if(context_objects[label] === object) {
                    context.setObjectLabel(substituteObject, label);
                    break;
                }
            }

        }
    }
    else if(values) {
        context._reviver.deserializeMontageObjectValues(
            object,
            values || montageObjectDesc.properties, //deprecated
            context
        );
    }



});


if (typeof exports !== "undefined") {

    exports.MontageReviver = MontageReviver;
}
