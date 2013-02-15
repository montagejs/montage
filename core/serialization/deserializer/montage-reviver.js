var Montage = require("core/core").Montage;
var Reviver = require("mousse/deserialization/reviver").Reviver;
var PropertiesDeserializer = require("./properties-deserializer").PropertiesDeserializer;
var SelfDeserializer = require("./self-deserializer").SelfDeserializer;
var UnitDeserializer = require("./unit-deserializer").UnitDeserializer;

var Promise = require("q");

var ModuleLoader = Montage.create(Object.prototype, {
    _modules: {value: Object.create(null)},
    _moduleKeyPrefix: {value: null},
    _require: {value: null},

    create: {
        value: function() {
            return Montage.create(this);
        }
    },

    initWithRequire: {
        value: function(_require) {
            if (typeof _require !== "function") {
                throw new Error("Function 'require' missing.");
            }

            if (typeof _require.location !== "string") {
                throw new Error("Function 'require' location is missing");
            }

            this._require = _require;
            this._moduleKeyPrefix = _require.location + "#";

            return this;
        }
    },

    getModule: {
        value: function(moduleId) {
            var modules = this._modules,
                moduleKey = this._moduleKeyPrefix + moduleId,
                _require = this._require,
                module = modules[moduleKey];

            if (!module) {
                // require.getModuleDescriptor(id).exports != null tell us if
                // a module is ready to go.
                if (_require.getModuleDescriptor(moduleId).exports != null) {
                    module = _require(moduleId);
                } else {
                    module = _require.async(moduleId).then(function(exports) {
                        // Store the final module and skip promises the next
                        // time.
                        return (modules[moduleKey] = exports);
                    });
                }
                // store the promise for use until the module is loaded
                modules[moduleKey] = module;
            }

            return module;
        }
    }
});

var MontageReviver = exports.MontageReviver = Montage.create(Reviver.prototype, {
    _moduleLoader: {value: null},
    _unitRevivers: {value: Object.create(null)},
    _unitNames: {value: []},

    create: {
        value: function() {
            return Montage.create(this);
        }
    },

    initWithRequire: {
        value: function(_require) {
            this._moduleLoader = ModuleLoader.create()
                                 .initWithRequire(_require);

            return this;
        }
    },

    defineUnitReviver: {
        value: function(name, funktion) {
            this._unitRevivers[name] = funktion;
            this._unitNames.push(name);
        }
    },

    getTypeOf: {
        value: function(value) {
            if (value !== null && typeof value === "object"
                && Object.keys(value).length === 1 && "#" in value) {
                return "Element";
            } else {
                return Reviver.prototype.getTypeOf.call(this, value);
            }
        }
    },

    reviveElement: {
        value: function(value, context, label) {
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

    reviveCustomObject: {
        value: function(value, context, label) {
            //if ("prototype" in value || "object" in value) {
                return this.reviveMontageObject(value, context, label);
            //}
        }
    },

    reviveMontageObject: {
        value: function(value, context, label) {
            var self = this,
                module,
                locationDesc,
                locationId = value.prototype || value.object,
                objectName;

            if (locationId) {
                locationDesc = this.parseObjectLocationId(locationId);
                module = this._moduleLoader.getModule(locationDesc.moduleId);
                objectName = locationDesc.objectName;
            }

            if (Promise.isPromise(module)) {
                return module.then(function(exports) {
                    return self.instantiateMontageObject(value, exports, objectName, context, label);
                }, function (error) {
                    throw new Error('Error deserializing "' + label +
                        '": module named "' + locationDesc.moduleId +
                        "' was not found given '" + value.prototype + "'");
                });
            } else {
                return this.instantiateMontageObject(value, module, objectName, context, label);
            }
        }
    },

    instantiateMontageObject: {
        value: function(value, module, objectName, context, label) {
            var self = this,
                object,
                montageObjectDesc;

            object = this.getMontageObject(value, module, objectName, context, label);
            context.setObjectLabel(object, label);
            object.isDeserializing = true;

            montageObjectDesc = this.reviveObjectLiteral(value, context);

            if (Promise.isPromise(montageObjectDesc)) {
                return montageObjectDesc.then(function(montageObjectDesc) {
                    return self.deserializeMontageObject(montageObjectDesc, object, context, label);
                });
            } else {
                return this.deserializeMontageObject(montageObjectDesc, object,  context, label);
            }
        }
    },

    deserializeMontageObject: {
        value: function(montageObjectDesc, object, context, label) {
            var properties;

            if (typeof object.deserializeSelf === "function") {
                return this.deserializeCustomMontageObject(object, montageObjectDesc, context, label);
            } else {
                // Units are deserialized after all objects have been revived.
                // This happens at didReviveObjects.
                context.setUnitsToDeserialize(object, montageObjectDesc, this._unitNames);
                properties = this.deserializeMontageObjectProperties(object, montageObjectDesc.properties, context);

                if (Promise.isPromise(properties)) {
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
        value: function(object, properties, context) {
            var value;

            if (typeof object.deserializeProperties === "function") {
                var propertiesDeserializer = PropertiesDeserializer.create()
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
        value: function(object, objectDesc, context, label) {
            var substituteObject;

            var selfDeserializer = SelfDeserializer.create()
                .initWithObjectAndObjectDescriptorAndContextAndUnitNames(object, objectDesc, context, this._unitNames);
            substituteObject = object.deserializeSelf(selfDeserializer);

            if (Promise.isPromise(substituteObject)) {
                return value.then(function() {
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
        value: function(value, module, objectName, context, label) {
            var object;

            if (context.hasUserObject(label)) {

                return context.getUserObject(label);

            } else if ("prototype" in value) {

                if (!(objectName in module)) {
                    throw new Error('Error deserializing "' + label +
                        '": object named "' + object +
                        "' was not found given '" + value.prototype + "'");
                }
                // TODO: For now we need this because we need to set
                // isDeserilizing before calling didCreate.
                object = Object.create(module[objectName]);
                object.isDeserializing = true;
                if (typeof object.didCreate === "function") {
                    object.didCreate();
                }
                return object;
                //return module[objectName].create();

            } else if ("object" in value) {

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

    didReviveObjects: {
        value: function(objects, context) {
            var self = this,
                value;

            value = this._deserializeUnits(context);

            if (Promise.isPromise(value)) {
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
        value: function(objects, context) {
            var object;

            for (var label in objects) {
                object = objects[label];

                if (object != null) {
                    delete object.isDeserializing;
                }

                if (!context.hasUserObject(label)) {
                    if (object && typeof object.deserializedFromSerialization === "function") {
                        object.deserializedFromSerialization(label);
                    }
                }
            }
        }
    },

    _deserializeUnits: {
        value: function(context) {
            var unitsToDeserialize = context.getUnitsToDeserialize(),
                unitsDesc,
                units = this._unitRevivers;

            for (var i = 0, unitsDesc; unitsDesc = unitsToDeserialize[i]; i++) {
                var unitNames = unitsDesc.unitNames;

                for (var j = 0, unitName; unitName = unitNames[j]; j++) {
                    var unitDeserializer = UnitDeserializer.create()
                        .initWithContext(context);

                    if (unitName in unitsDesc.objectDesc) {
                        units[unitName](unitDeserializer, unitsDesc.object, unitsDesc.objectDesc[unitName]);
                    }
                }
            }
        }
    },

    _findObjectNameRegExp: {
        value: /([^\/]+?)(\.reel)?$/
    },
    _toCamelCaseRegExp: {
        value: /(?:^|-)([^-])/g
    },
    _replaceToCamelCase: {
        value: function(_, g1) { return g1.toUpperCase() }
    },
    // Cache of location descriptors indexed by locationId
    _locationDescCache: {value: Object.create(null)},

    // Location Id is in the form of <moduleId>[<objectName>] where
    // [<objectName>] is optional. When objectName is missing it is derived
    // from the last path component of moduleId transformed into CamelCase.
    //
    // Example: "event/event-manager" has a default objectName of EventManager.
    //
    // When the last path component ends with ".reel" it is removed before
    // creating the default objectName.
    //
    // Example: "montage/ui/input-range.reel" has a default objectName of
    //          InputRange.
    //
    // @returns {moduleId, objectName}
    parseObjectLocationId: {
        value: function(locationId) {
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
    }
});

if (typeof exports !== "undefined") {
    exports.MontageReviver = MontageReviver;
}
