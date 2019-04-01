var Montage = require("../../core").Montage,
    MontageReviver = require("./montage-reviver").MontageReviver,
    Promise = require("../../promise").Promise,
    deprecate = require("../../deprecate"),
    Set = require("collections/set"),
    ONE_ASSIGNMENT = "=",
    ONE_WAY = "<-",
    TWO_WAY = "<->";

/**
 * @deprecated
 */
var MontageInterpreter = Montage.specialize({
    _require: {value: null},
    _reviver: {value: null},

    init: {
        value: function (_require, reviver) {
            deprecate.deprecationWarningOnce("MontageInterpreter", "MontageDeserializer");
            if (typeof _require !== "function") {
                throw new Error("Function 'require' missing.");
            }

            this._reviver = reviver;
            this._require = _require;

            return this;
        }
    },

    instantiate: {
        value: function (serialization, objects, element) {
            var context;

            context = new exports.MontageContext()
                .init(serialization, this._reviver, objects, element, this._require);

            return context.getObjects();
        }
    },

    preloadModules: {
        value: function (serialization) {
            var reviver = this._reviver,
                moduleLoader = reviver.moduleLoader,
                object,
                locationId,
                locationDesc,
                module,
                promises = [];

            for (var label in serialization) {
                if (serialization.hasOwnProperty(label)) {
                    object = serialization[label];
                    locationId = object.prototype || object.object;

                    if (locationId) {
                        if (typeof locationId !== "string") {
                            throw new Error(
                                "Property 'object' of the object with the label '" +
                                label + "' must be a module id"
                            );
                        }
                        locationDesc = MontageReviver.parseObjectLocationId(locationId);
                        module = moduleLoader.getModule(
                            locationDesc.moduleId, label);
                        if (Promise.is(module)) {
                            promises.push(module);
                        }
                    }
                }
            }

            if (promises.length > 0) {
                return Promise.all(promises);
            }
        }
    }
});

var idCount = 0;
var MontageContext = Montage.specialize({
    _ELEMENT_ID_ATTRIBUTE: {value: "data-montage-id"},
    _ELEMENT_ID_SELECTOR_PREFIX: {value: '*[data-montage-id="'},
    _ELEMENT_ID_SELECTOR_SUFFIX: {value: '"]'},
    unitsToDeserialize: {value: null},
    _mjsonDependencies: {value: null},
    _element: {value: null},
    _require: {value: null},
    _objects: {value: null},
    _userObjects: {value: null},
    _serialization: {value: null},
    _reviver: { value: null },
    _bindingsToDeserialize: { value: null },

    constructor: {
        value: function () {
            this.unitsToDeserialize = new Map();
        }
    },

    init: {
        value: function (serialization, reviver, objects, element, _require, isSync) {
            this._reviver = reviver;
            this._serialization = serialization;
            this._objects = Object.create(null);

            if (objects) {
                this._userObjects = Object.create(null);

                /* jshint forin: true */
                for (var label in objects) {
                /* jshint forin: false */
                    this._userObjects[label] = objects[label];
                }
            }

            this._element = element;
            this._require = _require;
            this._isSync = isSync;

            return this;
        }
    },

    setObjectLabel: {
        value: function(object, label) {
            this._objects[label] = object;
        }
    },

    getObject: {
        value: function(label) {
            var serialization = this._serialization,
                reviver = this._reviver,
                objects = this._objects,
                object, notFoundError;

            if (label in objects) {
                return objects[label];
            } else if (label in serialization) {
                object = reviver.reviveRootObject(serialization[label], this, label);
                // If no object has been set by the reviver we safe its
                // return, it could be a value or a promise, we need to
                // make sure the object won't be revived twice.
                if (!(label in objects)) {
                    objects[label] = object;
                }

                return object;
            } else {
                notFoundError = new Error("Object with label '" + label + "' was not found.");
                if (this._isSync) {
                    throw notFoundError;
                } else {
                    return Promise.reject(notFoundError);
                }
            }
        }
    },

    getObjects: {
        value: function() {
            var self = this,
                serialization = this._serialization,
                promises,
                result,
                objectKeys;

            if(serialization) {
                objectKeys = Object.keys(serialization);
                for (var i=0, label;(label = objectKeys[i]); i++) {
                    result = this.getObject(label);

                    if (Promise.is(result)) {
                        (promises || (promises = [])).push(result);
                    }
                }
            }

            if (!promises || promises.length === 0) {
                result = this._invokeDidReviveObjects();
                return this._isSync ? result : Promise.is(result) ? result : Promise.resolve(result);
            } else {
                // We shouldn't get here if this._isSync is true
                return Promise.all(promises).then(function() {
                    return self._invokeDidReviveObjects();
                });
            }
        }
    },

    hasUserObject: {
        value: function(label) {
            var userObjects = this._userObjects;

            if (userObjects) {
                return label in userObjects;
            } else {
                return false;
            }
        }
    },

    getUserObject: {
        value: function(label) {
            var userObjects = this._userObjects;

            if (userObjects) {
                return userObjects[label];
            }
        }
    },

    _invokeDidReviveObjects: {
        value: function() {
            var self = this,
                reviver = this._reviver;

            if (typeof reviver.didReviveObjects === "function") {
                reviver.didReviveObjects(this);
                return self._objects;
            }

            return this._objects;
        }
    },

    hasObject: {
        value: function (label) {
            return label in this._serialization;
        }
    },

    getRequire: {
        value: function () {
            return this._require;
        }
    },

    getElement: {
        value: function () {
            return this._element;
        }
    },

    getElementById: {
        value: function (id) {
            return this._element.querySelector(this._ELEMENT_ID_SELECTOR_PREFIX + id + this._ELEMENT_ID_SELECTOR_SUFFIX);
        }
    },

    _classifyValuesToDeserialize: {
        value: function (object, objectDesc) {
            var values,
                value,
                keys,
                bindings;


            //This is where we support backward compatib
             if((values = objectDesc.properties)) {
                objectDesc.values = values;
                delete objectDesc.properties;
             }
             else {
                if((values = objectDesc.values)) {
                    keys = Object.keys(values);
                    bindings = objectDesc.bindings || (objectDesc.bindings = {});
                    for (var i=0, key;(key = keys[i]);i++) {
                        value = values[key];

                        //An expression based property
                        if ((typeof value === "object" && value &&
                            Object.keys(value).length === 1 &&
                            (ONE_WAY in value || TWO_WAY in value || ONE_ASSIGNMENT in value)) ||
                            key.indexOf('.') > -1
                        ) {
                            bindings[key] = value;
                            delete values[key];
                        }
                    }

                }
            }


            return bindings;
        }
    },

    getBindingsToDeserialize: {
        value: function () {
            return this._bindingsToDeserialize;
        }
    },

    __propertyToReviveForObjectLiteralValue: {
        value: undefined
    },
    _propertyToReviveForObjectLiteralValue: {
        get: function() {
            return this.__propertyToReviveForObjectLiteralValue || (this.__propertyToReviveForObjectLiteralValue = new WeakMap());
        }
    },
    propertyToReviveForObjectLiteralValue: {
        value: function (objectLiteralValue) {
            var  propertyToRevive;
            if(!(propertyToRevive = this._propertyToReviveForObjectLiteralValue.get(objectLiteralValue))) {
                this._propertyToReviveForObjectLiteralValue.set(objectLiteralValue,(propertyToRevive = new Set(Object.keys(objectLiteralValue))));
            }
            return propertyToRevive;
        }
    },

    _objectDynamicValuesToDeserialize: {
        value: undefined
    },
    _objectValuesToDeserialize: {
        value: undefined
    },
    objectValuesToDeserialize: {
        get: function() {
            return this._objectValuesToDeserialize || (this._objectValuesToDeserialize = new Map());
        }
    },



    setBindingsToDeserialize: {
        value: function (object, objectDesc) {
                this._classifyValuesToDeserialize(object, objectDesc);
        }
    },

    setUnitsToDeserialize: {
        value: function (object, objectDesc, unitNames) {

            var moduleId = objectDesc.prototype || objectDesc.object,
                isMJSONDependency = moduleId && (moduleId.endsWith(".mjson") || moduleId.endsWith(".meta")),
                unitsDesc = this.unitsToDeserialize.get(object);

            if(isMJSONDependency) {
                (this._mjsonDependencies || (this._mjsonDependencies = new Set())).add(moduleId);
            }

            if(unitsDesc) {
                if(unitNames !== unitsDesc.unitNames || unitsDesc.objectDesc !== objectDesc) {
                    var unitsDescObjectDesc = unitsDesc.objectDesc,
                        unitsDescUnitNames = unitsDesc.unitNames;

                    for(var i=0, iUniteName, countI = unitNames.length;(i<countI);i++) {
                        iUniteName = unitNames[i];
                        if(objectDesc[iUniteName]) {
                            Object.assign(unitsDescObjectDesc[iUniteName],objectDesc[iUniteName]);
                        }
                        if(!unitsDescUnitNames.has(iUniteName)) {
                            unitsDescUnitNames.splice(i,0,iUniteName);
                        }
                    }
                }
            }
            else {

                this.unitsToDeserialize.set(object,{
                    objectDesc: objectDesc,
                    unitNames: unitNames
                });
            }

        }
    }


});

exports.MontageInterpreter = MontageInterpreter;
exports.MontageContext = MontageContext;
