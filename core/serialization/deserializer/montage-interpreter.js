var Montage = require("../../core").Montage,
    MontageReviver = require("./montage-reviver").MontageReviver,
    Promise = require("../../promise").Promise,
    deprecate = require("../../deprecate"),
    Set = require("../../collections/set"),
    ObjectCreate = Object.create,
    ObjectKeys = Object.keys,
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
                promises = [],
                i, keys, label;

            for (i =0, keys = ObjectKeys(serialization);(label = keys[i]); i++) {
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
            this._objects = ObjectCreate(null);
            return this;
        }
    },

    init: {
        value: function (serialization, reviver, objects, element, _require, isSync) {
            this._reviver = reviver;
            this._serialization = serialization;

            if (objects) {
                this._userObjects = objects;
                /*
                    #PERF
                    Benoit Performance Improvement:
                    this._userObjects is used for lookup, it's never changed,
                    therefore there's no reason to create a new object,
                    and loop over it to copy the data over, just use it.
                */
                // this._userObjects = Object.create(null);

                // /* jshint forin: true */
                // for (var label in objects) {
                // /* jshint forin: false */
                //     this._userObjects[label] = objects[label];
                // }
            }

            this._element = element;
            this._require = _require;
            this._isSync = isSync;

            return this;
        }
    },

    _isSync: {value: false},
    isSync: {
        get: function() {
            return this._isSync;
        }
    },

    setObjectLabel: {
        value: function(object, label) {
            return (this._objects[label] = object);
        }
    },

    // _getObject_build: {
    //     value: function _getObject_build(label) {
    //         // If no object has been set by the reviver we safe its
    //         // return, it could be a value or a promise, we need to
    //         // make sure the object won't be revived twice.
    //         return this._objects[label] || (this._objects[label] = this._reviver.reviveRootObject(this._serialization[label], this, label));
    //     }
    // },

    // _getObject_error: {
    //     value: function getObject(label) {
    //         var notFoundError = new Error("Object with label '" + label + "' was not found.");
    //         if (this._isSync) {
    //             throw notFoundError;
    //         } else {
    //             return Promise.reject(notFoundError);
    //         }
    //     }
    // },

    getObject: {
        value: function getObject(label) {

            // If no object has been set by the reviver we safe its
            // return, it could be a value or a promise, we need to
            // make sure the object won't be revived twice.
            return this._objects[label] || (this._objects[label] = this._reviver.reviveRootObject(this._serialization[label], this, label));

            // return this._getObject_build(label);

            // var objects = this._objects;

            // var b = (label in objects)
            // ? objects[label]
            // : (label in this._serialization)
            //     ? this._getObject_build(label)
            //     : this._getObject_error(label);

            // if(a != b) {
            //     debugger;
            // }

            // return b;
        }
    },

    getObjects: {
        value: function getObjects() {
            var serialization = this._serialization,
                promises,
                result,
                objectKeys;

            if(serialization) {
                objectKeys = ObjectKeys(serialization);
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
                var self = this;

                return Promise.all(promises).then(function() {
                    return self._invokeDidReviveObjects();
                });
            }
        }
    },

    hasUserObjectForLabel: {
        value: function(object, label) {
            var userObjects = this._userObjects;

            if (userObjects) {
                return this.hasUserObject(label) && userObjects[label] === object;
                //return label in userObjects && userObjects[label] === object;
            } else {
                return false;
            }
        }
    },

    hasUserObject: {
        value: function(label) {
            var userObjects = this._userObjects;

            // return userObjects && ((userObjects.hasOwnProperty && userObjects.hasOwnProperty(label)) || label in userObjects);

            return userObjects
                ? userObjects.hasOwnProperty
                    ? userObjects.hasOwnProperty(label)
                    : label in userObjects
                : false;
                // return label in userObjects;
        }
    },

    getUserObject: {
        value: function(label) {
            return (this._userObjects && this._userObjects[label]) || undefined;
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
    _propertyToReviveEmptySet: {
        value: new Set()
    },
    propertyToReviveForObjectLiteralValue: {
        value: function (objectLiteralValue) {

            return ObjectKeys(objectLiteralValue);

            var  propertyToRevive;
            // if(!(propertyToRevive = this._propertyToReviveForObjectLiteralValue.get(objectLiteralValue))) {
                propertyToRevive = ObjectKeys(objectLiteralValue);
                if(propertyToRevive.length === 0) {
                    propertyToRevive = this._propertyToReviveEmptySet;
                } else {
                    propertyToRevive = new Set(propertyToRevive);
                }
                // this._propertyToReviveForObjectLiteralValue.set(objectLiteralValue,propertyToRevive);
            // }
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



    // setBindingsToDeserialize: {
    //     value: function (object, objectDesc) {
    //         var values;


    //         //This is where we support backward compatib
    //          if((values = objectDesc.properties)) {
    //             objectDesc.values = values;
    //             delete objectDesc.properties;
    //          }
    //          else {
    //             if((values = objectDesc.values)) {
    //                 var keys = ObjectKeys(values),
    //                     bindings,
    //                     value;

    //                 for (var i=0, key;(key = keys[i]);i++) {
    //                     value = values[key];

    //                     //An expression based property
    //                     if (value && (typeof value === "object" &&
    //                         (ONE_WAY in value || TWO_WAY in value || ONE_ASSIGNMENT in value)) ||
    //                         key.indexOf('.') > -1
    //                     ) {
    //                         (bindings || ( bindings = objectDesc.bindings || (objectDesc.bindings = {})))[key] = value;
    //                         delete values[key];
    //                     }
    //                 }

    //             }
    //         }


    //         return bindings;
    //     }
    // },

    setUnitsToDeserialize: {
        value: function (object, objectDesc, unitNames) {

            var moduleId = objectDesc.prototype || objectDesc.object,
                isMJSONDependency = moduleId && (moduleId.endsWith(".mjson")),
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
                        if(unitsDescObjectDesc[iUniteName] && objectDesc[iUniteName]) {
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
