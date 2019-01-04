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
                return this.getExports(
                    moduleDescriptor.mappingRequire,
                    moduleDescriptor.mappingRedirect
                );
            }

            return moduleDescriptor;
        }
    },

    getExports: {
        value: function (_require, moduleId) {
            var moduleDescriptor = this.getModuleDescriptor(_require, moduleId);
            return moduleDescriptor ? moduleDescriptor.exports : void 0;
        }
    },

    getModule: {
        value: function (moduleId, label) {
            var objectRequires = this._objectRequires,
                _require, module;

            if (objectRequires && label in objectRequires) {
                _require = objectRequires[label];
            } else {
                _require = this._require;
            }

            module = this.getExports(_require, moduleId);

            if (!module && (moduleId.endsWith(".mjson") || moduleId.endsWith(".meta"))) {
                module = this.getModuleDescriptor(_require, moduleId).text;
            }

            if (!module) {
                module = _require.async(moduleId);
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
        value: function (_require, objectRequires, deserializerConstructor) {
            this.moduleLoader = new ModuleLoader().init(_require, objectRequires);
            this._require = _require;
            this._deserializerConstructor = deserializerConstructor;
            return this;
        }
    },

    getTypeOf: {
        value: function (value) {
            var typeOf = typeof value;

            if (value === null) {
                return "null";
            } else if (Array.isArray(value)) {
                return "array";
            } else if (typeOf === "object" && Object.keys(value).length === 1) {
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
                return Promise.reject(error);
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
                return Promise.reject(new Error("Element with id '" + elementId + "' was not found."));
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
                module = this.moduleLoader.getModule(locationDesc.moduleId, label);
                objectName = locationDesc.objectName;
            }

            if (typeof module === "string" && isObjectDescriptor &&
                this._deserializerConstructor.moduleContexts.has(
                    (location = context._require.location + locationId)
                )) {
                // We have a circular reference. If we wanted to forbid circular
                // references this is where we would throw an error.
                return Promise.resolve(this._deserializerConstructor.moduleContexts.get(location)._objects.root);
            }

            if (isObjectDescriptor && !Promise.is(module) && !module.montageObject) {
                module = context._require.async(locationDesc.moduleId);
            }

            if (Promise.is(module)) {
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
            var moduleId = value.prototype || value.object,
                object;

            if (moduleId && (moduleId.endsWith(".mjson") || moduleId.endsWith(".meta"))) {
                object = value && "prototype" in value ?
                    Object.create(module.montageObject) : module.montageObject;
                context.setObjectLabel(object, label);
                return this.instantiateMJSONObject(value, object, objectName, context, label);
            } else {
                object = this.getMontageObject(value, module, objectName, context, label);
                context.setObjectLabel(object, label);
                return this.instantiateMontageObject(value, object, objectName, context, label);
            }
        }
    },

    getMontageObject: {
        value: function (value, module, objectName, context, label) {
            var object;

            if (context.hasUserObject(label)) {

                return context.getUserObject(label);

            } else if ("prototype" in value) {

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
                object.isDeserializing = true;
                return object;
            } else if ("object" in value) {
                if (value.object.endsWith(".json")) {
                    return module;
                }

                if (!(objectName in module)) {
                    throw new Error('Error deserializing "' + label +
                        '": object named "' + object +
                        "' was not found given '" + value.object + "'");
                }
                return module[objectName];

            } else {
                throw new Error("Error deserializing " + JSON.stringify(value) + ", might need \"prototype\" or \"object\" on label " + JSON.stringify(label));
            }
        }
    },

    instantiateMJSONObject: {
        value: function (serialization, object, objectName, context, label) {
            var self = this,
                montageObjectDesc;

            if (object !== null && object !== void 0) {
                object.isDeserializing = true;
            }

            context.setBindingsToDeserialize(object, serialization);
            montageObjectDesc = this.reviveObjectLiteral(serialization, context);

            if (Promise.is(montageObjectDesc)) {
                return montageObjectDesc.then(function(montageObjectDesc) {
                    return self.deserializeMontageObject(montageObjectDesc, object, context, label);
                });
            } else {
                return this.deserializeMontageObject(montageObjectDesc, object, context, label);
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

            context.setBindingsToDeserialize(object, serialization);
            montageObjectDesc = this.reviveObjectLiteral(serialization, context);

            if (Promise.is(montageObjectDesc)) {
                return montageObjectDesc.then(function(montageObjectDesc) {
                    if (typeof object.deserializeSelf === "function") {
                        return self.deserializeCustomMontageObject(object, montageObjectDesc, context, label);
                    } else {
                        return self.deserializeMontageObject(montageObjectDesc, object, context, label);
                    }
                });
            } else {
                if (typeof object.deserializeSelf === "function") {
                    return this.deserializeCustomMontageObject(object, montageObjectDesc, context, label);
                } else {
                    return this.deserializeMontageObject(montageObjectDesc, object, context, label);
                }
            }
        }
    },

    deserializeMontageObject: {
        value: function (montageObjectDesc, object, context, label) {
            var values;

            // Units are deserialized after all objects have been revived.
            // This happens at didReviveObjects.
            context.setUnitsToDeserialize(object, montageObjectDesc, MontageReviver._unitNames);
            values = this.deserializeMontageObjectValues(
                object,
                montageObjectDesc.values || montageObjectDesc.properties, //deprecated
                context
            );

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

    deserializeCustomMontageObject: {
        value: function (object, objectDesc, context, label) {
            var substituteObject;

            var selfDeserializer = new SelfDeserializer()
                .initWithObjectAndObjectDescriptorAndContextAndUnitNames(object, objectDesc, context, MontageReviver._unitNames);
            substituteObject = object.deserializeSelf(selfDeserializer);

            if (Promise.is(substituteObject)) {
                return substituteObject.then(function(substituteObject) {
                    context.setObjectLabel(substituteObject, label);
                    return substituteObject;
                });
            } else if (typeof substituteObject !== "undefined") {
                context.setObjectLabel(substituteObject, label);
                return substituteObject;
            } else {
                return object;
            }
        }
    },

    didReviveObjects: {
        value: function (objects, context) {
            var self = this;

            return Promise.all([
                this._deserializeBindings(context),
                this._deserializeUnits(context)
            ]).then(function () {
                self._invokeDeserializedFromSerialization(objects, context);
            });
        }
    },

    // TODO: can deserializeSelf make deserializedFromSerialization irrelevant?
    _invokeDeserializedFromSerialization: {
        value: function (objects, context) {
            var object;

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

    _deserializeBindings: {
        value: function (context) {
            var bindingsToDeserialize = context.getBindingsToDeserialize(),
                unitDeserializer = new UnitDeserializer(),
                bindingsToDeserializeDesc;

            if (bindingsToDeserialize) {
                try {
                    for (var i = 0, length = bindingsToDeserialize.length; i < length; i++) {
                        bindingsToDeserializeDesc = bindingsToDeserialize[i];
                        Bindings.deserializeObjectBindings(
                            unitDeserializer.initWithContext(context),
                            bindingsToDeserializeDesc.object,
                            bindingsToDeserializeDesc.bindings
                        );
                    }
                } catch (ex) {
                    return Promise.reject(ex);
                }
            }
        }
    },

    _deserializeUnits: {
        value: function (context) {
            var unitsToDeserialize = context.getUnitsToDeserialize(),
                unitDeserializer = new UnitDeserializer(),
                unitNames;

            try {
                for (var i = 0, unitsDesc; (unitsDesc = unitsToDeserialize[i]); i++) {
                    unitNames = unitsDesc.unitNames;

                    for (var j = 0, unitName; (unitName = unitNames[j]); j++) {
                        if (unitName in unitsDesc.objectDesc) {
                            unitDeserializer.initWithContext(context);
                            MontageReviver._unitRevivers.get(unitName)(unitDeserializer, unitsDesc.object, unitsDesc.objectDesc[unitName]);
                        }
                    }
                }
            } catch (ex) {
                return Promise.reject(ex);
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
        value: function(value, context, label) {
            var type = this.getTypeOf(value);

            if (type === "string" || type === "number" || type === "boolean" || type === "null" || type === "undefined") {
                return this.reviveNativeValue(value, context, label);
            } else if (type === "regexp") {
                return this.reviveRegExp(value, context, label);
            } else if (type === "reference") {
                return this.reviveObjectReference(value, context, label);
            } else if (type === "array") {
                return this.reviveArray(value, context, label);
            } else if (type === "object") {
                return this.reviveObjectLiteral(value, context, label);
            } else if (type === "Element") {
                return this.reviveElement(value, context, label);
            } else if (type === "binding") {
                return value;
            } else {
                return this._callReviveMethod("revive" + type, value, context, label);
            }
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
        value: function(value, context, label, filterKeys) {
            var item,
                promises = [];

            if (label) {
                context.setObjectLabel(value, label);
            }

            for (var propertyName in value) {
                if (value.hasOwnProperty(propertyName) && (!filterKeys || filterKeys.indexOf(propertyName) > -1)) {
                    if (value[propertyName] === value) {
                        // catch object property that point to its parent
                        return value;
                    }

                    item = this.reviveValue(value[propertyName], context);

                    if (Promise.is(item)) {
                        promises.push(
                            item.then(this._createAssignValueFunction(
                                    value, propertyName)
                            )
                        );
                    } else {
                        value[propertyName] = item;
                    }
                }
            }

            if (promises.length === 0) {
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

    reviveObjectReference: {
        value: function(value, context, label) {
            var valuePath = value["@"],
                object = context.getObject(valuePath);

            return object;
        }
    },

    reviveArray: {
        value: function(value, context, label) {
            var item,
                promises = [];

            if (label) {
                context.setObjectLabel(value, label);
            }

            for (var i = 0, ii = value.length; i < ii; i++) {
                item = this.reviveValue(value[i], context);

                if (Promise.is(item)) {
                    promises.push(
                        item.then(this._createAssignValueFunction(value, i))
                    );
                } else {
                    value[i] = item;
                }
            }

            if (promises.length === 0) {
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
            return Promise.reject(
                new Error("External object '" + label + "' not found in user objects.")
            );
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

MontageReviver.findProxyForElement = function (element) {
    return PROXY_ELEMENT_MAP.get(element);
};

if (typeof exports !== "undefined") {

    exports.MontageReviver = MontageReviver;
}
