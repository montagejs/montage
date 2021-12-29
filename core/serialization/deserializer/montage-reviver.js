/*global console, Proxy */
var Montage = require("../../core").Montage,
    ValuesDeserializer = require("./values-deserializer").ValuesDeserializer,
    SelfDeserializer = require("./self-deserializer").SelfDeserializer,
    UnitDeserializer = require("./unit-deserializer").UnitDeserializer,
    ModuleReference = require("../../module-reference").ModuleReference,
    // Template = require("../../template").Template,
    Template,
    Alias = require("../alias").Alias, Bindings = require("../bindings"),
    Promise = require("../../promise").Promise,
    deprecate = require("../../deprecate"),
    camelCaseConverter = require('../../converter/camel-case-converter').singleton,
    kebabCaseConverter = require('../../converter/kebab-case-converter').singleton,
    ONE_ASSIGNMENT = "=",
    ONE_WAY = "<-",
    TWO_WAY = "<->",
    node_Module,
    node_createRequire,
    nullStringConstant = "null",
    arrayStringConstant = "array",
    objectStringConstant = "object",
    ObjectKeys = Object.keys,
    ObjectCreate = Object.create,
    PromiseIs = Promise.is,
    DateParseRFC3339 = Date.parseRFC3339,
    stringMatchRFC3339 = Date.stringMatchRFC3339,
    isArray = Array.isArray;



require("../../shim/string");
require("../../../core/extras/date");

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

    node_createRequire: {
        get: function() {
            if(!node_createRequire) {
                /* funky syntax to defeat mr's dependency parsing */
                node_createRequire = this.node_Module.createRequire;
            }
            return node_createRequire;
        }
    },

    node_Module: {
        get: function() {
            if(!node_Module) {
                /* funky syntax to defeat mr's dependency parsing */
                node_Module = (require) ('module');
            }
            return node_Module;
        }
    },

    global_node_Module: {
        get: function() {
            if(!this._global_node_Module) {
                /* funky syntax to defeat mr's dependency parsing */
                this._global_node_Module = new this.node_Module("global",null);
                this._global_node_Module.exports = global;
            }
            return this._global_node_Module;
        }
    },


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
            // if (typeof _require.location !== "string") {
            //     throw new Error("Function 'require' location is missing");
            // }
            if (typeof objectRequires !== objectStringConstant &&
                typeof objectRequires !== "undefined") {
                throw new Error("Parameter 'objectRequires' should be an object.");
            }

            this._require = _require;
            this._objectRequires = objectRequires;

            return this;
        }
    },

    getModuleDescriptor: {
        value: function getModuleDescriptor(_require, moduleId) {
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
        value: function getModule(moduleId, label, reviver) {
            var objectRequires = this._objectRequires,
                _require = (objectRequires && label in objectRequires)
                    ? objectRequires[label]
                    : this._require,
                module;

            // if (objectRequires && label in objectRequires) {
            //     _require = objectRequires[label];
            // } else {
            //     _require = this._require;
            // }

            try {
                module = _require(moduleId);
            } catch (err) {

                /*
                    for node.js:
                */
               if(err.code && err.code === "MODULE_NOT_FOUND") {

                    if(moduleId === "global") {
                        // module =  this.global_node_Module;
                        module =  global;
                    } else {
                        module = this.node_createRequire(moduleId);
                        console.log("module:",module);
                    }

               } else {
                if (!module && (moduleId.endsWith(".mjson") /*|| moduleId.endsWith(".html")*/)) {
                    module = this.getModuleDescriptor(_require, moduleId).text;
                }

                if (!module && !reviver._isSync) {
                    // if(moduleId.endsWith(".html") && !Template) {
                    //     module = require.async("../../template")
                    //     .then((exports) => {
                    //         Template = exports.Template;
                    //         return;
                    //     })
                    //     .then(() => {
                    //         return _require.async(moduleId);
                    //     });

                    //     // module = module.then((module) => {

                    //     //     var template =  new Template();

                    //     //     return template.initWithHtml(module.content, _require)
                    //     //     .then(() => {
                    //     //         return template.instantiateWithInstances(/*context._objects*/null, context._element.ownerDocument)
                    //     //         .then((documentPart) => {
                    //     //             console.log(documentPart);
                    //     //             if(documentPart) {
                    //     //                 var locationDesc = MontageReviver.parseObjectLocationId(moduleId);

                    //     //                 return documentPart.objects[locationDesc.name];
                    //     //             } else {
                    //     //                 return null;
                    //     //             }
                    //     //         });
                    //     //     });
                    //     // });

                    // } else {
                        module = _require.async(moduleId);
                    // }
                } else {
                    err.message = err.message + " synchronously";
                    throw err;
                }

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

    _global: {
        value: global
    },

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

    _getTypeOf_object: {
        value: function _getTypeOf_object(value) {
            var keys;

            return isArray(value)
            ? arrayStringConstant
            : ((keys = ObjectKeys(value)).length === 1)
                ? _getTypeOf_object._getObjectTypeOfLookup[keys[0]] || objectStringConstant
                : objectStringConstant;

            // var keys = ObjectKeys(value);
            // if(keys.length === 1) {
            //     // console.log("return `"+(this._getObjectTypeOfLookup[keys[0]] || typeOf)+"'");
            //     return _getTypeOf_object._getObjectTypeOfLookup[keys[0]] || objectStringConstant;
            // }
            // else {
            //     // console.log("return `"+typeOf+"'");
            //     return objectStringConstant;
            // }
        }
    },

    getTypeOf: {
        value: function getTypeOf(value) {
            var typeOf;

            return (value === null)
                ? nullStringConstant
                : ((typeOf = typeof value) === objectStringConstant)
                    ? this._getTypeOf_object(value)
                    : (typeOf === "string" && stringMatchRFC3339(value, true))
                        ? "date"
                        : typeOf;
        }
    },

    _checkLabel: {
        value: function (label, isTemplateProperty) {
            if (isTemplateProperty && label[0] !== ":") {
                throw new Error("Aliases can only be defined in template values (start with a colon (:)), \"" + label + "\".");
            } else if (!isTemplateProperty && label[0] === ":") {
                throw new Error("Only aliases are allowed as template values (start with a colon (:), \"" + label + "\".");
            }
        }
    },

    setProxyForDatasetOnElement: {
        value: function (element, montageObjectDesc) {
            var originalDataset = element.dataset;

            if (Object.getPrototypeOf(originalDataset) !== null) {
                var datasetAttributes = ObjectKeys(originalDataset),
                    targetObject = ObjectCreate(null), self = this,
                    datasetAttribute, propertyNames;

                if (Proxy.prototype) { // The native Proxy has no prototype property.
                    // Workaround for Proxy polyfill https://github.com/GoogleChrome/proxy-polyfill
                    // the properties of a proxy must be known at creation time.
                    // TODO: remove when we drop the support of IE11.
                    if (montageObjectDesc.values) {
                        propertyNames = ObjectKeys(montageObjectDesc.values);
                    } else { // deprecated
                        propertyNames = ObjectKeys(montageObjectDesc.properties)
                            .concat(ObjectKeys(montageObjectDesc.bindings));
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
                var targetObject = ObjectCreate(null);

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
                        propertyNames = ObjectKeys(montageObjectDesc.values);
                    } else { // deprecated
                        propertyNames = ObjectKeys(montageObjectDesc.properties)
                            .concat(ObjectKeys(montageObjectDesc.bindings));
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
        value: function reviveRootObject(value, context, label) {


            if(value === undefined) {
                var notFoundError = new Error("Object with label '" + label + "' was not found.");
                if (this._isSync) {
                    throw notFoundError;
                } else {
                    return Promise.reject(notFoundError);
                }
            }
            var valueKeys = ObjectKeys(value),
                isAlias = valueKeys.indexOf("alias") !== -1,
            // var isAlias = "alias" in value,
                valueValue,
                object;

            // Only aliases are allowed as template values, everything else
            // should be rejected as an error.
            this._checkLabel(label, isAlias);


            // Check if the optional "debugger" unit is set for this object
            // and stop the execution. This is intended to provide a certain
            // level of debugging in the serialization.
            if (value.debugger) {
                console.debug("set a breakpoint here");
            }

            if ((valueValue = value.value) !== undefined) {

                // it's overriden by a user object
                if (context.hasUserObject(label)) {
                    object = context.getUserObject(label);
                    context.setObjectLabel(object, label);

                    context.setBindingsToDeserialize(object, value);//Looks in values for all "bindings to collect and apply later"
                    var montageObjectDesc = this.reviveObjectLiteral(value, context,undefined, undefined, object);

                    if (PromiseIs(montageObjectDesc)) {
                        var self = this;
                        return montageObjectDesc.then(function(montageObjectDesc) {
                            return self.deserializeMontageObject(montageObjectDesc, object, context, label);
                        });
                    } else {
                        return this.deserializeMontageObject(montageObjectDesc, object, context, label);
                    }

                    // return object;
                } else {
                    var valueType = this.getTypeOf(valueValue),
                    revivedValue = this.reviveValue(valueValue, context, label, valueType),
                    revivedUnits = this.reviveObjectLiteral(value, context, undefined, MontageReviver._unitNames);

                    context.setObjectLabel(revivedValue, label);

                    if (valueType === "Element") {
                        if (!PromiseIs(revivedValue)) {
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
                    } else if (valueType === objectStringConstant) {
                        context.setBindingsToDeserialize(revivedValue, revivedUnits);
                        this.deserializeMontageObjectValues(
                            revivedValue,
                            revivedUnits.values || revivedUnits.properties, //deprecated
                            context
                        );
                        context.setUnitsToDeserialize(revivedValue, revivedUnits, MontageReviver._unitNames);
                    }

                    return revivedValue;
                }


            } else if (valueKeys.length === 0) {
                // it's an external object
                return context.hasUserObject(label)
                    ? context.setObjectLabel(/*object*/ context.getUserObject(label) , label)
                    : this.reviveExternalObject(value, context, label);

            } else if (isAlias) {
                return this.reviveAlias(value, context, label);
            } else {
                return this.reviveMontageObject(value, context, label);
            }
        }
    },

    reviveElement: {
        value: function reviveElement(value, context, label) {
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
        value: function reviveModule(value, context, label) {
            var moduleId = value["%"],
                _require = context.getRequire();

            /*
                Fork logic between mr where _require.getModuleDescriptor exists and node's native require where it does not.
            */
            if(_require.getModuleDescriptor) {
                moduleId = _require.resolve(moduleId);

                var module = _require.getModuleDescriptor(moduleId);

                return new ModuleReference().initWithIdAndRequire(module.id, module.require);
            } else {
                if(moduleId === "global") {
                    return new ModuleReference().initWithIdAndRequire(moduleId, this.moduleLoader.global_node_Module);
                } else {
                    moduleId = _require.resolve(moduleId);
                    return new ModuleReference().initWithIdAndRequire(moduleId, this.moduleLoader.node_createRequire(moduleId));
                }
            }
        }
    },

    reviveAlias: {
        value: function reviveAlias(value, context, label) {
            var alias = new Alias();
            alias.value = value.alias;

            context.setObjectLabel(alias, label);
            return alias;
        }
    },

    reviveMontageObject: {
        value: function reviveMontageObject(value, context, label) {
            var locationId = value.prototype || value.object,
                isObjectDescriptor,
                module, locationDesc, objectName;

            if (locationId) {
                // if (locationId.indexOf("/") === -1 && typeof this._global[locationId] === "function") {
                //     module = this._global;
                //     objectName = locationId;
                // } else {
                    locationDesc = MontageReviver.parseObjectLocationId(locationId);
                    module = this.moduleLoader.getModule(locationDesc.moduleId, label, this);
                    objectName = locationDesc.objectName;
                //}
            }


            if (    !this._isSync &&
                    (isObjectDescriptor = !!(locationId && (locationId.endsWith(".mjson")))) &&
                    !PromiseIs(module) &&
                    !module.montageObject
                ) {
                module = context._require.async(locationDesc.moduleId);
            }

            if(!module && this._isSync) {
                throw new Error(
                    "Tried to revive montage object with label " + label +
                    " synchronously but the module was not loaded: " + JSON.stringify(value)
                );
            } else if (PromiseIs(module)) {
                if (this._isSync) {
                    throw new Error(
                        "Tried to revive montage object with label " + label +
                        " synchronously but the module was not loaded: " + JSON.stringify(value)
                    );
                }
                var self = this;
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
            var object = this.getMontageObject(value, module, objectName, context, label);

            context.setObjectLabel(object, label);
            return this.instantiateMontageObject(value, object, objectName, context, label);
        }
    },

    _getMJSONObject: {
        value: function (moduleId, context) {
            if(context._require.getModuleDescriptor) {
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
            } else {
                return context._require(moduleId).montageObject;
            }
        }
    },

    getMontageObject: {
        value: function (value, module, objectName, context, label) {
            var object, moduleId;

            if (context.hasUserObject(label)) {

                return context.getUserObject(label);

            } else if ((moduleId = value.prototype) !== undefined) {

                if ((moduleId.endsWith(".mjson"))) {
                    object = ObjectCreate(this._getMJSONObject(moduleId, context));
                //}
                // else if (moduleId && (moduleId.endsWith(".html"))) {
                //     var template = module.montageObject;

                //     return template.instantiateWithInstances(/*context._objects*/null, context._element.ownerDocument)
                //     .then((documentPart) => {
                //         // console.log(documentPart);
                //         if(documentPart) {
                //             var locationDesc = MontageReviver.parseObjectLocationId(moduleId);

                //             return documentPart.objects[locationDesc.name];
                //         } else {
                //             return null;
                //         }
                //     });


                }
                else {
                    object = module[objectName];

                    if (object === undefined) {
                        throw new Error('Error deserializing "' + label +
                            '": object named "' + objectName + '"' +
                            ' was not found in "' + value.prototype + '".' +
                            " Available objects are: " + ObjectKeys(module) + ".");
                    }
                    // TODO: For now we need this because we need to set
                    // isDeserilizing before calling didCreate.
                    object = (typeof object === "function") ? new object() : ObjectCreate(object);

                }
                object.isDeserializing = true;
                return object;
            } else if ((moduleId = value.object) !== undefined) {

                if (moduleId.endsWith(".json")) {
                    return module;
                }
                else if (moduleId.endsWith(".mjson")) {
                    object = this._getMJSONObject(moduleId, context);
                    object.isDeserializing = true;
                    return object;
                }
                // else if (moduleId && (moduleId.endsWith(".html"))) {
                //     var template =  new Template();

                //     return template.initWithHtml(module.content, context._require)
                //     .then(() => {
                //         return template.instantiateWithInstances(/*context._objects*/null, context._element.ownerDocument)
                //         .then((documentPart) => {
                //             console.log(documentPart);
                //             if(documentPart) {
                //                 var locationDesc = MontageReviver.parseObjectLocationId(moduleId);

                //                 return documentPart.objects[locationDesc.name];
                //             } else {
                //                 return null;
                //             }
                //         });
                //     });


                // }
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
        value: function instantiateMontageObject(serialization, object, objectName, context, label) {
            var montageObjectDesc;

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

            if (PromiseIs(montageObjectDesc)) {
                var self = this;
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

                /*
                    A label could be both local and exist in user objects provided to the deserialization.
                    We only want to invoke deserializedFromSerialization if it's the local one.
                */
                //if (!context.hasUserObject(label)) {
                if (!context.hasUserObjectForLabel(object, label)) {
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
                unitNamesStartIndex = unitsDesc._unitNamesStartIndex || 0,
                j, unitName;

            for (j = unitNamesStartIndex; (unitName = unitNames[j]); j++) {
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
                    unitsDesc.isMJSON = moduleId && (moduleId.endsWith(".mjson"));
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

            if(context._require.getModuleDescriptor) {

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
        }
    },

    _deserializeUnits: {
        value: function (context) {

            this._deserializeMJSONDependencyUnits(context);

            var unitsToDeserialize = context.unitsToDeserialize,
                unitsToDeserializeKeys,
                unitDeserializer,
                unitsDesc, unitNames,
                object;

            if(unitsToDeserialize.size > 0) {
                unitsToDeserializeKeys = unitsToDeserialize.keys();
                unitDeserializer = new UnitDeserializer();

                /*
                    First pass to guarantee values unit is processed first, before we move on to bindinsg and events that require values to be done.

                    So we loop first on all objects, check if there's "values", if there is, process it and
                    record the start index to loop on unitNames to resume in the general case on the next one.
                */

                while((object = unitsToDeserializeKeys.next().value)) {
                    unitsDesc = unitsToDeserialize.get(object);
                    unitNames = unitsDesc.unitNames;

                    //Debug code
                    // if(unitNames.indexOf("values") !== 0) {
                    //     console.error("values may not always be firt!");
                    // }

                    if(unitNames[0] === "values") {
                        this._deserializeObjectUnitNamed(context, object, "values", unitsDesc, unitDeserializer, 0);
                        unitsDesc._unitNamesStartIndex = 1;
                    }

                }

                unitsToDeserializeKeys = unitsToDeserialize.keys();
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
        value: function reviveValue(value, context, label, valueType) {
            var revived = (
                    reviveValue._methodByType[
                        (valueType || (valueType = this.getTypeOf(value)))
                    ]
                    ||
                    this[("revive" + valueType)]
                ).call(this, value, context, label);

            if(!this._isSync) {
                return revived;
            } else if(PromiseIs(revived)) {
                throw new Error("Unable to revive value with label " + label + " synchronously: " + value);
            } else {
                return revived;
            }

            // if (this._isSync && PromiseIs(revived)) {
            //     throw new Error("Unable to revive value with label " + label + " synchronously: " + value);
            // } else {
            //     return revived;
            // }
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
        value: function reviveNativeValue(value, context, label) {
            /*
                A way to efficiently execute context.setObjectLabel(value, label) conditionally while returning value when we do.
            */
            return label
                ? context.setObjectLabel(value, label) /* setObjectLabel() returns the value set */
                : value;
        }
    },

    reviveObjectLiteral: {
        value: function reviveObjectLiteral(value, context, label, filterKeys, object) {
            var item,
                _PromiseIs = PromiseIs,
                _createAssignValueFunction = this._createAssignValueFunction,
                firstPromise,
                promises,
                // propertyNames = context.propertyToReviveForObjectLiteralValue(value),
                propertyNames = ObjectKeys(value),
                i = 0,
                propertyName, iValue;
                // propertyNamesIterator = propertyNames.values();


            if (label) {
                context.setObjectLabel(value, label);
            }

            //while((propertyName = propertyNamesIterator.next().value)) {
            while((propertyName = propertyNames[i++])) {
                if ((filterKeys && filterKeys.indexOf(propertyName) === -1)) {
                    continue;
                }

                if ((iValue = value[propertyName]) === value) {
                    // catch object property that point to its parent
                    return value;
                }

                if(iValue !== (item = this.reviveValue(iValue, context))) {
                    if (_PromiseIs(item)) {
                        item = item.then(_createAssignValueFunction(value, propertyName));

                        !firstPromise
                            ? firstPromise = item
                            : !promises
                                ? promises = [firstPromise, item]
                                : promises.push(item);

                    } else {
                        value[propertyName] = item;
                    }
                }

                /*
                    Doesn't look like this is needed as the set isn't reused once we're done looping
                */
                //propertyNames.delete(propertyName);
            }

            return firstPromise
                ? firstPromise.then(function() {
                    return value;
                })
                : promises
                    ? Promise.all(promises).then(function() {
                        return value;
                    })
                    : value;
        }
    },

    reviveRegExp: {
        value: function reviveRegExp(value, context, label) {

            var valuePath = value["/"],
                regexp = new RegExp(valuePath.source, valuePath.flags);

            return label
                ? context.setObjectLabel(regexp, label)
                : regexp;
        }
    },

    reviveDate: {
        value: function reviveDate(value, context, label) {

            var date = DateParseRFC3339(value, true);

            return label
                ? context.setObjectLabel(date, label)
                : date;
        }
    },

    reviveObjectReference: {
        value: function reviveObjectReference(value, context, label) {
            return context.getObject(value["@"]);
        }
    },

    reviveArray: {
        value: function reviveArray(value, context, label) {
            var item,
                firstPromise,
                _PromiseIs = PromiseIs,
                _Promise = Promise,
                promises;

            if (label) {
                context.setObjectLabel(value, label);
            }

            for (var i = 0, ii = value.length; i < ii; i++) {

                if (_PromiseIs((item = this.reviveValue(value[i], context)))) {
                    item = item.then(this._createAssignValueFunction(value, i));
                    if(!firstPromise) {
                        firstPromise = item;
                    } else if(!promises) {
                        promises = [firstPromise, item];
                    } else {
                        promises.push(item);
                    }

                } else {
                    value[i] = item;
                }
            }

            return firstPromise
                ? firstPromise.then(function() {
                    return value;
                })
                : promises
                    ? _Promise.all(promises).then(function() {
                        return value;
                    })
                    : value;
        }
    },

    reviveExternalObject: {
        value: function reviveExternalObject(value, context, label) {
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
                // if(moduleId.endsWith("html")) {
                //     objectName = "owner";
                // } else {
                this._findObjectNameRegExp.test(locationId);
                objectName = RegExp.$1.replace(
                        this._toCamelCaseRegExp,
                        this._replaceToCamelCase
                    );
                // }

            }

            var locationDesc = {
                moduleId: moduleId,
                objectName: objectName
            };
            return this._locationDescCache.set(locationId, locationDesc) && locationDesc;
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
            return this.prototype.getTypeOf(value);
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

_reviveMethodByType["string"] = _reviveMethodByType["number"] = _reviveMethodByType["boolean"] = _reviveMethodByType[nullStringConstant] = _reviveMethodByType["undefined"] = MontageReviverProto.reviveNativeValue;
_reviveMethodByType["date"] = MontageReviverProto.reviveDate;
_reviveMethodByType["regexp"] = MontageReviverProto.reviveRegExp;
_reviveMethodByType["reference"] = MontageReviverProto.reviveObjectReference;
_reviveMethodByType[arrayStringConstant] = MontageReviverProto.reviveArray;
_reviveMethodByType[objectStringConstant] = MontageReviverProto.reviveObjectLiteral;
_reviveMethodByType["Element"] = MontageReviverProto.reviveElement;
_reviveMethodByType["binding"] = MontageReviverProto.reviveBinding;
_reviveMethodByType["Module"] = MontageReviverProto.reviveModule;


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

MontageReviver.prototype._getTypeOf_object._getObjectTypeOfLookup = {
    "@": "reference",
    "/": "regexp",
    "#": "Element",
    "%": "Module",
    "=":  "binding",
    "<-": "binding",
    "<->": "binding"
};

if (typeof exports !== "undefined") {

    exports.MontageReviver = MontageReviver;
}
