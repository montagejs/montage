var Montage = require("../../core").Montage,
    Interpreter = require("mousse/deserialization/interpreter").Interpreter,
    Context = require("mousse/deserialization/context").Context,
    MontageReviver = require("./montage-reviver").MontageReviver,
    Promise = require("../../promise").Promise;

var MontageInterpreter = Montage.specialize.call(Interpreter, {
    _require: {value: null},
    _reviver: {value: null},

    init: {
        value: function(_require, objectRequires) {
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
        value: function(serialization, objects, element) {
            var context;

            context = new MontageContext()
                .init(serialization, this._reviver, objects, element, this._require);

            return context.getObjects();
        }
    },

    preloadModules: {
        value: function(serialization) {
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
                    if (Promise.isPromise(module)) {
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

var MontageContext = Montage.specialize.call(Context, {
    _ELEMENT_ID_ATTRIBUTE: {value: "data-montage-id"},
    _unitsToDeserialize: {value: null},
    _element: {value: null},
    _require: {value: null},

    constructor: {
        value: function() {
            this._unitsToDeserialize = [];
        }
    },

    init: {
        value: function(serialization, reviver, objects, element, _require) {
            Context.call(this, serialization, reviver, objects);

            this._element = element;
            this._require = _require;

            return this;
        }
    },

    hasObject: {
        value: function(label) {
            return label in this._serialization;
        }
    },

    getRequire: {
        value: function () {
            return this._require;
        }
    },

    getElement: {
        value: function() {
            return this._element;
        }
    },

    getElementById: {
        value: function(id) {
            var selector = '*[' + this._ELEMENT_ID_ATTRIBUTE + '="' + id + '"]';

            return this._element.querySelector(selector);
        }
    },

    setUnitsToDeserialize: {
        value: function(object, objectDesc, unitNames) {
            this._unitsToDeserialize.push({
                object: object,
                objectDesc: objectDesc,
                unitNames: unitNames
            });
        }
    },

    getUnitsToDeserialize: {
        value: function() {
            return this._unitsToDeserialize;
        }
    }
});

exports.MontageInterpreter = MontageInterpreter;
exports.MontageContext = MontageContext;
