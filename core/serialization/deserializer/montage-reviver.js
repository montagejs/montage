var Montage = require("../../core").Montage;
var PropertiesDeserializer = require("./properties-deserializer").PropertiesDeserializer;
var SelfDeserializer = require("./self-deserializer").SelfDeserializer;
var UnitDeserializer = require("./unit-deserializer").UnitDeserializer;
var ModuleReference = require("../../module-reference").ModuleReference;
var Alias = require("../alias").Alias;

var Promise = require("../../promise").Promise;

var ModuleLoader = Montage.specialize( {
    _require: {value: null},
    _objectRequires: {value: null},

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

    getExports: {
        value: function (_require, moduleId) {
            var module;

            // Transforms relative module ids into absolute module ids
            moduleId = _require.resolve(moduleId);
            module = _require.getModuleDescriptor(moduleId);

            while (module.redirect !== void 0) {
                module = _require.getModuleDescriptor(module.redirect);
            }

            if (module.mappingRedirect !== void 0) {
                return this.getExports(module.mappingRequire, module.mappingRedirect);
            }

            return module.exports;
        }
    },

    getModule: {
        value: function (moduleId, label) {
            var objectRequires = this._objectRequires,
                _require,
                module;

            if (objectRequires && label in objectRequires) {
                _require = objectRequires[label];
            } else {
                _require = this._require;
            }

            module = this.getExports(_require, moduleId);

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
    moduleLoader: {value: null},

    /**
     * @param {Require} _require The require object to load modules
     * @param {Object} objectRequires A dictionary indexed by object label with
     *        the require object to use for a specific object of the
     *        serialization.
     */
    init: {
        value: function (_require, objectRequires) {
            this.moduleLoader = new ModuleLoader()
                                 .init(_require, objectRequires);
            this._require = _require;
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
                } // else return typeOf -> object
            }

            return typeOf;
        }
    },

    _checkLabel: {
        value: function (label, isTemplateProperty) {
            if (isTemplateProperty && label[0] !== ":") {
                return new Error("Aliases can only be defined in template properties (start with a colon (:)), \"" + label + "\".");
            } else if (!isTemplateProperty && label[0] === ":") {
                return new Error("Only aliases are allowed as template properties (start with a colon (:), \"" + label + "\".");
            }
        }
    },

    reviveRootObject: {
        value: function (value, context, label) {
            var error,
                isAlias = "alias" in value;

            // Only aliases are allowed as template properties, everything else
            // should be rejected as an error.
            error = this._checkLabel(label, isAlias);

            if (error) {
                return Promise.reject(error);
            }

            var object;

            // Check if the optional "debugger" unit is set for this object
            // and stop the execution. This is intended to provide a certain
            // level of debugging in the serialization.
            if (value.debugger) {
                console.log("enable debugger statement here");
                //debugger;
            }

            if ("value" in value) {
                // it's overriden by a user object
                if (context.hasUserObject(label)) {
                    object = context.getUserObject(label);
                    context.setObjectLabel(object, label);
                    return object;
                }

                var revivedValue;

                if (this.getTypeOf(value.value) === "Element") {
                    revivedValue = this.reviveElement(value.value, context, label);

                    if (!Promise.is(revivedValue)) {
                        var montageObjectDesc = this.reviveObjectLiteral(value, context);
                        context.setUnitsToDeserialize(revivedValue, montageObjectDesc, MontageReviver._unitNames);
                    }
                } else {
                    revivedValue = this.reviveValue(value.value, context, label);
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
            }

            return this.reviveCustomObject(value, context, label);
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

    reviveCustomObject: {
        value: function (value, context, label) {
            if ("alias" in value) {
                return this.reviveAlias(value, context, label);
            } else {
                return this.reviveMontageObject(value, context, label);
            }
        }
    },

    reviveMontageObject: {
        value: function (value, context, label) {
            var self = this,
                module,
                locationDesc,
                locationId = value.prototype || value.object,
                objectName;

            if (locationId) {
                locationDesc = MontageReviver.parseObjectLocationId(locationId);
                module = this.moduleLoader.getModule(locationDesc.moduleId,
                    label);
                objectName = locationDesc.objectName;
            }

            if (Promise.is(module)) {
                return module.then(function(exports) {
                    if ("object" in value && value.object.endsWith(".mjson")) {
                        return self.instantiateMjsonObject(exports, locationDesc.moduleId);
                    } else {
                        return self.instantiateMontageObject(value, exports, objectName, context, label);
                    }
                }, function (error) {
                    if (error.stack) {
                        console.error(error.stack);
                    }
                    throw new Error('Error deserializing "' + label +
                        '" when loading module "' + locationDesc.moduleId +
                        "' from '" + value.prototype + "' cause: " + error.message);
                });
            } else {
                if ("object" in value && value.object.endsWith(".mjson")) {
                    return self.instantiateMjsonObject(module, locationDesc.moduleId);
                } else {
                    return this.instantiateMontageObject(value, module, objectName, context, label);
                }
            }
        }
    },

    instantiateMjsonObject: {
        value: function (json, moduleId) {
            var self = this,
                getModelRequire = function (parentRequire, modelId) {
                    // TODO: This utility function is also defined in core/meta/module-blueprint.js.
                    // Maybe it should be a helper module or baked in to deserializers.
                    var topId = parentRequire.resolve(modelId);
                    var module = parentRequire.getModuleDescriptor(topId);
                    while (module.redirect || module.mappingRedirect) {
                        if (module.redirect) {
                            topId = module.redirect;
                        } else {
                            parentRequire = module.mappingRequire;
                            topId = module.mappingRedirect;
                        }
                        module = parentRequire.getModuleDescriptor(topId);
                    }
                    return module.require;
                };
            // Need to require deserializer asynchronously because it depends on montage-interpreter, which
            // depends on this module, montage-reviver. A synchronous require would create a circular dependency.
            // TODO: Maybe this could be passed in from above instead of required here.
            return require.async("core/serialization/deserializer/montage-deserializer")
                .then(function (deserializerModule) {
                    return new deserializerModule.MontageDeserializer()
                        .init(JSON.stringify(json), getModelRequire(self._require, moduleId)) // TODO: MontageDeserializer needs an API to pass in an object instead of the stringified version of the object
                        .deserializeObject();
                });
        }
    },

    instantiateMontageObject: {
        value: function (value, module, objectName, context, label) {
            var self = this,
                object,
                montageObjectDesc;

            object = this.getMontageObject(value, module, objectName, context, label);
            context.setObjectLabel(object, label);
            
            if (object !== null && object !== void 0) {
                object.isDeserializing = true;
            }

            montageObjectDesc = this.reviveObjectLiteral(value, context);

            if (Promise.is(montageObjectDesc)) {
                return montageObjectDesc.then(function(montageObjectDesc) {
                    return self.deserializeMontageObject(montageObjectDesc, object, context, label);
                });
            } else {
                return this.deserializeMontageObject(montageObjectDesc, object,  context, label);
            }
        }
    },

    deserializeMontageObject: {
        value: function (montageObjectDesc, object, context, label) {
            var properties;

            if (typeof object.deserializeSelf === "function") {
                return this.deserializeCustomMontageObject(object, montageObjectDesc, context, label);
            } else {
                // Units are deserialized after all objects have been revived.
                // This happens at didReviveObjects.
                context.setUnitsToDeserialize(object, montageObjectDesc, MontageReviver._unitNames);
                properties = this.deserializeMontageObjectProperties(object, montageObjectDesc.properties, context);

                if (Promise.is(properties)) {
                    return properties.then(function() {
                        return object;
                    });
                } else {
                    return object;
                }
            }
        }
    },

    deserializeMontageObjectProperties: {
        value: function (object, properties, context) {
            var value;

            if (typeof object.deserializeProperties === "function") {
                var propertiesDeserializer = new PropertiesDeserializer()
                    .initWithReviverAndObjects(this, context);
                value = object.deserializeProperties(propertiesDeserializer);
            } else {
                for (var key in properties) {
                    object[key] = properties[key];
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
                object = Object.create(module[objectName].prototype);
                object.isDeserializing = true;
                if (typeof object.didCreate === "function") {
                    object.didCreate();
                } else if (typeof object.constructor === "function") {
                    object.constructor();
                }
                return object;
                //return module[objectName].create();

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

    reviveAlias: {
        value: function (value, context, label) {
            var alias = new Alias();
            alias.value = value.alias;

            context.setObjectLabel(alias, label);
            return alias;
        }
    },

    didReviveObjects: {
        value: function (objects, context) {
            var self = this,
                value;

            value = this._deserializeUnits(context);

            if (Promise.is(value)) {
                return value.then(function() {
                    self._invokeDeserializedFromSerialization(objects, context);
                });
            } else {
                this._invokeDeserializedFromSerialization(objects, context);
            }
        }
    },

    // TODO: can deserializeSelf make deserializedFromSerialization irrelevant?
    _invokeDeserializedFromSerialization: {
        value: function (objects, context) {
            var object;

            for (var label in objects) {
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

    _deserializeUnits: {
        value: function (context) {
            var unitsToDeserialize = context.getUnitsToDeserialize(),
                units = MontageReviver._unitRevivers,
                unitNames,
                unitDeserializer;

            try {
                for (var i = 0, unitsDesc; unitsDesc = unitsToDeserialize[i]; i++) {
                    unitNames = unitsDesc.unitNames;

                    for (var j = 0, unitName; unitName = unitNames[j]; j++) {
                        if (unitName in unitsDesc.objectDesc) {
                            unitDeserializer = new UnitDeserializer()
                                .initWithContext(context);
                            units[unitName](unitDeserializer, unitsDesc.object, unitsDesc.objectDesc[unitName]);
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
            }
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
        value: function(value, context, label) {
            var item,
                promises = [];

            if (label) {
                context.setObjectLabel(value, label);
            }

            for (var propertyName in value) {
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
            var value = value["/"],
                regexp = new RegExp(value.source, value.flags);

            if (label) {
                context.setObjectLabel(regexp, label);
            }

            return regexp;
        }
    },

    reviveObjectReference: {
        value: function(value, context, label) {
            var value = value["@"],
                object = context.getObject(value);

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
    _unitRevivers: {value: Object.create(null)},
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
    _locationDescCache: {value: Object.create(null)},

    customObjectRevivers: {value: Object.create(null)},

    // Location Id is in the form of <moduleId>[<objectName>] where
    // [<objectName>] is optional. When objectName is missing it is derived
    // from the last path component of moduleId transformed into CamelCase.
    //
    // Example: "event/event-manager" has a default objectName of EventManager.
    //
    // When the last path component ends with ".reel" it is removed before
    // creating the default objectName.
    //
    // Example: "matte/ui/input-range.reel" has a default objectName of
    //          InputRange.
    //
    // @returns {moduleId, objectName}
    parseObjectLocationId: {
        value: function (locationId) {
            var locationDescCache = this._locationDescCache,
                locationDesc,
                bracketIndex,
                moduleId,
                objectName;

            if (locationId in locationDescCache) {
                locationDesc = locationDescCache[locationId];
            } else {
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

                locationDesc = {
                    moduleId: moduleId,
                    objectName: objectName
                };
                locationDescCache[locationId] = locationDesc;
            }

            return locationDesc;
        }
    },

    defineUnitReviver: {
        value: function (name, funktion) {
            this._unitRevivers[name] = funktion;
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

            for (var methodName in reviver) {
                if (methodName === "getTypeOf") {
                    continue;
                }

                if (typeof reviver[methodName] === "function"
                    && /^revive/.test(methodName)) {
                    if (typeof customObjectRevivers[methodName] === "undefined") {
                        customObjectRevivers[methodName] = reviver[methodName].bind(reviver);
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
            this.customObjectRevivers = Object.create(null);
            this.prototype.getCustomObjectTypeOf = function() {};
        }
    },

    makeGetCustomObjectTypeOf:{
        value: function (getCustomObjectTypeOf) {
            var previousGetCustomObjectTypeOf = this.prototype.getCustomObjectTypeOf;

            return function(value) {
                return getCustomObjectTypeOf(value) || previousGetCustomObjectTypeOf(value);
            }
        }
    }

});

if (typeof exports !== "undefined") {
    exports.MontageReviver = MontageReviver;
}
