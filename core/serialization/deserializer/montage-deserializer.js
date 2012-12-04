var Montage = require("core/core").Montage;
var Interpreter = require("mousse/deserialization/interpreter").Interpreter;
var Deserializer = require("mousse/deserialization/deserializer").Deserializer;
var MontageInterpreter = require("./montage-interpreter").MontageInterpreter;
var MontageReviver = require("./montage-reviver").MontageReviver;
var SerializationExtractor = require("./serialization-extractor").SerializationExtractor;
var Promise = require("q");

var logger = require("core/logger").logger("montage-deserializer");

var MontageDeserializer = Montage.create(Deserializer.prototype, {
    _interpreter: {value: null},
    _serializationString: {value: null},
    _serialization: {value: null},

    create: {
        value: function() {
            return Montage.create(this);
        }
    },

    initWithSerializationStringAndRequire: {
        value: function(serializationString, _require) {
            if (! this.isSerializationStringValid(serializationString)) {
                throw new Error("Serialization string is invalid: " + serializationString);
            }

            this._serializationString = serializationString;
            this._serialization = null;
            this._interpreter = MontageInterpreter.create()
                .initWithRequire(_require);

            return this;
        }
    },

    serialization: {
        get: function() {
            var serialization = this._serialization;

            if (!serialization) {
                serialization = JSON.parse(this._serializationString);
                this._serialization = serialization;
            }

            return serialization;
        }
    },

    deserializeWithElement: {
        value: function(instances, element) {
            var serialization;

            try {
                serialization = JSON.parse(this._serializationString);
            } catch (error) {
                return Promise.reject(error);
            }

            return this._interpreter.instantiateWithElement(serialization, instances, element);
        }
    },

    defineDeserializationUnit: {
        value: function(name, funktion) {
            MontageReviver.defineUnitReviver(name, funktion);
        }
    },

    getExternalObjectLabels: {
        value: function() {
            var serialization = this.serialization,
                labels = [];

            for (var label in serialization) {
                if (Object.keys(serialization[label]).length === 0) {
                    labels.push(label);
                }
            }

            return labels;
        }
    },

    findMontageObjectLabelsWithElements: {
        value: function(elementIds) {
            var serialization = this.serialization,
                type,
                object,
                labels = [],
                expectedCount = elementIds.length,
                count,
                elementId,
                element;

            for (var label in serialization) {
                object = serialization[label];

                if (object.properties) {
                    element = object.properties.element;
                    type = MontageReviver.getTypeOf(element);

                    if (type === "Element") {
                        elementId = element["#"];

                        if (elementIds.indexOf(elementId) >= 0) {
                            count = labels.push(label);
                            if (count === expectedCount) {
                                break;
                            }
                        }
                    }
                }
            }

            return labels;
        }
    },

    extractSerialization: {
        value: function(objectLabels, externalLabels) {
            var serialization = this.serialization,
                extractor = SerializationExtractor.create(),
                newSerialization;

            extractor.initWithSerialization(serialization);
            newSerialization = extractor.extractObjects(objectLabels, externalLabels);

            return JSON.stringify(newSerialization);
        }
    },

    isSerializationStringValid: {
        value: function(serializationString) {
            try {
                JSON.parse(serializationString);
                return true;
            } catch (ex) {
                return false;
            }
        }
    }
});

exports.MontageDeserializer = MontageDeserializer;
exports.deserialize = function(serializationString, _require) {
    return MontageDeserializer.create().
        initWithSerializationStringAndRequire(serializationString, _require)
        .deserializeObject();
}

