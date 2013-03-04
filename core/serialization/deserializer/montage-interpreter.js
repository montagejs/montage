var Montage = require("core/core").Montage;
var Interpreter = require("mousse/deserialization/interpreter").Interpreter;
var Context = require("mousse/deserialization/context").Context;
var MontageReviver = require("./montage-reviver").MontageReviver;
var Promise = require("q");

var MontageInterpreter = Montage.create(Interpreter.prototype, {
    _require: {value: null},

    create: {
        value: function() {
            return Montage.create(this);
        }
    },

    initWithRequire: {
        value: function(_require) {
            this._require = _require;
            this._reviver = MontageReviver.create().init(_require);

            return this;
        }
    },

    instantiate: {
        value: function(serialization, objects) {
            var context = MontageContext.create()
                    .initWithSerializationAndReviverAndObjects(
                        serialization, this._reviver, objects);

            return context.getObjects();
        }
    },

    instantiateWithElement: {
        value: function(serialization, objects, element) {
            var context = MontageContext.create()
                    .initWithSerializationAndReviverAndObjectsAndElement(
                        serialization, this._reviver, objects, element);

            return context.getObjects();
        }
    }
});

var MontageContext = Montage.create(Context.prototype, {
    _ELEMENT_ID_ATTRIBUTE: {value: "data-montage-id"},
    _unitsToDeserialize: {value: null},
    _element: {value: null},

    create: {
        value: function() {
            return Montage.create(this);
        }
    },

    didCreate: {
        value: function() {
            this._unitsToDeserialize = [];
        }
    },

    initWithSerializationAndReviverAndObjects: {
        value: function(serialization, reviver, objects) {
            Context.call(this, serialization, reviver, objects);

            return this;
        }
    },

    initWithSerializationAndReviverAndObjectsAndElement: {
        value: function(serialization, reviver, objects, element) {
            this.initWithSerializationAndReviverAndObjects(serialization, reviver, objects);

            this._element = element;

            return this;
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