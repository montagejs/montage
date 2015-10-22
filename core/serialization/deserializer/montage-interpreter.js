var Montage = require("../../core").Montage,
    MontageReviver = require("./montage-reviver").MontageReviver,
    Promise = require("../../promise").Promise;

var MontageInterpreter = Montage.specialize({
    _require: {value: null},
    _reviver: {value: null},

    init: {
        value: function (_require, objectRequires) {
            if (typeof _require !== "function") {
                throw new Error("Function 'require' missing.");
            }

            this._reviver = new MontageReviver()
                .init(_require, objectRequires);
            this._require = _require;

            return this;
        }
    },

    instantiate: {
        value: function (serialization, objects, element) {
            var context;

            context = new MontageContext()
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
                object = serialization[label];

                locationId = object.prototype || object.object;
                if (locationId) {
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

var MontageContext = Montage.specialize({
    _ELEMENT_ID_ATTRIBUTE: {value: "data-montage-id"},
    _unitsToDeserialize: {value: null},
    _element: {value: null},
    _require: {value: null},
    _objects: {value: null},
    _userObjects: {value: null},
    _serialization: {value: null},
    _reviver: {value: null},

    constructor: {
        value: function () {
            this._unitsToDeserialize = [];
        }
    },

    init: {
        value: function (serialization, reviver, objects, element, _require) {
            this._reviver = reviver;
            this._serialization = serialization;
            this._objects = Object.create(null);

            if (objects) {
                this._userObjects = Object.create(null);

                for (var label in objects) {
                    this._userObjects[label] = objects[label];
                }
            }

            this._element = element;
            this._require = _require;

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
                object;

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
                return Promise.reject(
                    new Error("Object with label '" + label + "' was not found.")
                );
            }
        }
    },

    getObjects: {
        value: function() {
            var self = this,
                serialization = this._serialization,
                promises = [],
                result;

            for (var label in serialization) {
                result = this.getObject(label);

                if (Promise.is(result)) {
                    promises.push(result);
                }
            }

            if (promises.length === 0) {
                return Promise.resolve(this._invokeDidReviveObjects());
            } else {
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
                reviver = this._reviver,
                result;

            if (typeof reviver.didReviveObjects === "function") {
                result = reviver.didReviveObjects(this._objects, this);
                if (Promise.is(result)) {
                    return result.then(function() {
                        return self._objects;
                    });
                }
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
            var selector = '*[' + this._ELEMENT_ID_ATTRIBUTE + '="' + id + '"]';

            return this._element.querySelector(selector);
        }
    },

    setUnitsToDeserialize: {
        value: function (object, objectDesc, unitNames) {
            this._unitsToDeserialize.push({
                object: object,
                objectDesc: objectDesc,
                unitNames: unitNames
            });
        }
    },

    getUnitsToDeserialize: {
        value: function () {
            return this._unitsToDeserialize;
        }
    }
});

exports.MontageInterpreter = MontageInterpreter;
exports.MontageContext = MontageContext;
