var Montage = require("core/core").Montage,
    MontageReviver = require("./montage-reviver").MontageReviver;


var SerializationExtractor = Montage.create(Montage, {
    _serialization: {value: null},

    initWithSerialization: {
        value: function(serialization) {
            this._serialization = serialization;
        }
    },

    extractObjects: {
        value: function(labels, externalLabels) {
            var serialization = this._serialization,
                label,
                objects = {};

            externalLabels = externalLabels || [];

            for (var i = 0, label; label = labels[i]; i++) {
                if (label in serialization) {
                    objects[label] = serialization[label];
                    this._findLabels(label, externalLabels)
                }
            }

            for (var i = 0, label; label = externalLabels[i]; i++) {
                if (!(label in objects) && (label in serialization)) {
                    objects[label] = {};
                }
            }

            return JSON.parse(JSON.stringify(objects));
        }
    },

    _findLabels: {
        value: function(label, labels) {
            var serialization;

            if (labels.indexOf(label) === -1) {
                if (!(label in this._serialization)) {
                    throw new Error("Object '" + label + "' not found.");
                }
                labels.push(label);

                serialization = this._serialization[label];
                this._collectLabels(serialization, labels);
                this._collectLabelsInUnits(serialization, labels);
            }
        }
    },

    _collectLabels: {
        value: function(serialization, labels) {
            var type = MontageReviver.getTypeOf(serialization),
                label;

            if (type === "reference") {
                label = serialization["@"];
                this._findLabels(label, labels);
            } else if (type === "array") {
                for (var i = 0, ii = serialization.length; i < ii; i++) {
                    this._collectLabels(serialization[i], labels);
                }
            } else if (type === "object") {
                for (var key in serialization) {
                    this._collectLabels(serialization[key], labels);
                }
            }
        }
    },

    _collectLabelsInUnits: {
        value: function(objectSerialization, objects) {
            if ("bindings" in objectSerialization) {
                this._collectLabelsInBindings(objectSerialization.bindings, objects);
            }
        }
    },

    // TODO: temporary until frb kicks in
    _collectLabelsInBindings: {
        value: function(unitSerialization, labels) {
            var binding,
                path,
                label;

            for (var propertyName in unitSerialization) {
                binding = unitSerialization[propertyName];
                path = binding["<-"] || binding["<->"];

                dotIndex = path.indexOf(".");
                if (dotIndex > 0) {
                    label = path.slice(1, dotIndex);
                } else {
                    label = path;
                }

                this._findLabels(label, labels);
            }
        }
    }
});

exports.SerializationExtractor = SerializationExtractor;