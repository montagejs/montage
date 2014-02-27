var Montage = require("../../core").Montage;
var Reviver = require("mousse/deserialization/reviver").Reviver;
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
        value: function(_require, objectRequires) {
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
        value: function(_require, moduleId) {
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
        value: function(moduleId, label) {
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
var MontageReviver = exports.MontageReviver = Montage.specialize.call(Reviver, /** @lends MontageReviver# */ {
    moduleLoader: {value: null},

    /**
     * @param {Require} _require The require object to load modules
     * @param {Object} objectRequires A dictionary indexed by object label with
     *        the require object to use for a specific object of the
     *        serialization.
     */
    init: {
        value: function(_require, objectRequires) {
            this.moduleLoader = new ModuleLoader()
                                 .init(_require, objectRequires);

            return this;
        }
    },

    getTypeOf: {
        value: function(value) {
            if (value !== null &&
                typeof value === "object" &&
                Object.keys(value).length === 1
            ) {
                if ("#" in value) {
                    return "Element";
                } else if ("%" in value) {
                    return "Module";
                }
            }

            return Reviver.prototype.getTypeOf.call(this, value);
        }
    },

    _checkLabel: {
        value: function(label, isTemplateProperty) {
            if (isTemplateProperty && label[0] !== ":") {
                return new Error("Aliases can only be defined in template properties (start with a colon (:)), \"" + label + "\".");
            } else if (!isTemplateProperty && label[0] === ":") {
                return new Error("Only aliases are allowed as template properties (start with a colon (:), \"" + label + "\".");
            }
        }
    },

    reviveRootObject: {
        value: function(value, context, label) {
            var error,
                isAlias = "alias" in value;

            // Only aliases are allowed as template properties, everything else
            // should be rejected as an error.
            error = this._checkLabel(label, isAlias);
            if (error) {
                return Promise.reject(error);
            }

            // TODO: this.super returns noop here in some situations (just run
            // montage-deserializer-spec to reproduce
            //return this.super(value, context, label);
            return Reviver.prototype.reviveRootObject.apply(this, arguments);
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

    reviveModule: {
        value: function(value, context, label) {
            var moduleId = value["%"],
                _require = context.getRequire();

            moduleId = _require.resolve(moduleId);
            var module = _require.getModuleDescriptor(moduleId);

            return new ModuleReference().initWithIdAndRequire(module.id, module.require);
        }
    },

    reviveCustomObject: {
        value: function(value, context, label) {
            if ("alias" in value) {
                return this.reviveAlias(value, context, label);
            } else {
                return this.reviveMontageObject(value, context, label);
            }
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
                locationDesc = MontageReviver.parseObjectLocationId(locationId);
                module = this.moduleLoader.getModule(locationDesc.moduleId,
                    label);
                objectName = locationDesc.objectName;
            }

            if (Promise.isPromise(module)) {
                return module.then(function(exports) {
                    return self.instantiateMontageObject(value, exports, objectName, context, label);
                }, function (error) {
                    if (error.stack) {
                        console.error(error.stack);
                    }
                    throw new Error('Error deserializing "' + label +
                        '" when loading module "' + locationDesc.moduleId +
                        "' from '" + value.prototype + "'");
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
                context.setUnitsToDeserialize(object, montageObjectDesc, MontageReviver._unitNames);
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
        value: function(object, objectDesc, context, label) {
            var substituteObject;

            var selfDeserializer = new SelfDeserializer()
                .initWithObjectAndObjectDescriptorAndContextAndUnitNames(object, objectDesc, context, MontageReviver._unitNames);
            substituteObject = object.deserializeSelf(selfDeserializer);

            if (Promise.isPromise(substituteObject)) {
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
        value: function(value, module, objectName, context, label) {
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
        value: function(value, context, label) {
            var alias = new Alias();
            alias.value = value.alias;

            context.setObjectLabel(alias, label);
            return alias;
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
        value: function(context) {
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
        value: function(_, g1) { return g1.toUpperCase(); }
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
    // Example: "matte/ui/input-range.reel" has a default objectName of
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
    },

    defineUnitReviver: {
        value: function(name, funktion) {
            this._unitRevivers[name] = funktion;
            this._unitNames.push(name);
        }
    },

    getTypeOf: {
        value: function(value) {
            return this.prototype.getTypeOf.call(this, value);
        }
    }

});

if (typeof exports !== "undefined") {
    exports.MontageReviver = MontageReviver;
}
