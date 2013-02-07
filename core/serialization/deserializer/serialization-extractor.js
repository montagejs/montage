var Montage = require("core/core").Montage,
    MontageReviver = require("./montage-reviver").MontageReviver,
    parse = require("frb/parse");

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
                objects = {};

            externalLabels = externalLabels || [];

            for (var i = 0, label; (label = labels[i]); i++) {
                if (label in serialization) {
                    objects[label] = serialization[label];
                    this._findLabels(label, externalLabels);
                }
            }

            for (var i = 0, label; (label = externalLabels[i]); i++) {
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

    //
    // -- Bindings
    //

    _collectLabelsInBindings: {
        value: function(unitSerialization, labels) {
            var binding,
                sourcePath;

            for (var propertyName in unitSerialization) {
                binding = unitSerialization[propertyName];
                sourcePath = binding["<-"] || binding["<->"];
                this._collectLabelsInBindingPath(sourcePath, labels);
            }
        }
    },

    _collectLabelsInBindingPath: {
        value: function(path, labels) {
            var self = this,
                parseTree = parse(path);

            this._traverseBindingParseTree(parseTree, function(syntax) {
                self._findLabels(syntax.label, labels);
            });
        }
    },

    _traverseBindingParseTree: {
        value: function(parseTree, visitor) {
            var args = parseTree.args;

            if (parseTree.type === "component") {
                visitor(parseTree);
            }

            if (args) {
                for (var i = 0, ii = args.length; i < ii; i++) {
                    this._traverseBindingParseTree(args[i], visitor);
                }
            }
        }
    }
});

exports.SerializationExtractor = SerializationExtractor;