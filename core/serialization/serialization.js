var Montage = require("core/core").Montage,
    MontageLabeler = require("./serializer/montage-labeler").MontageLabeler,
    MontageReviver = require("./deserializer/montage-reviver").MontageReviver,
    parse = require("frb/parse"),
    stringify = require("frb/stringify");

var Serialization = Montage.specialize( {
    _serializationString: {value: null},
    _serializationObject: {value: null},

    initWithString: {
        value: function(string) {
            this._serializationString = string;
            this._serializationObject = null;

            return this;
        }
    },

    initWithObject: {
        value: function(object) {
            this._serializationString = null;
            this._serializationObject = object;

            return this;
        }
    },

    getSerializationObject: {
        value: function() {
            if (!this._serializationObject) {
                this._serializationObject = JSON.parse(this._serializationString);
            }

            return this._serializationObject;
        }
    },

    getSerializationString: {
        value: function() {
            if (!this._serializationString) {
                this._serializationString = JSON.stringify(this._serializationObject);
            }

            return this._serializationString;
        }
    },

    getSerializationLabels: {
        value: function() {
            var serializationObject = this.getSerializationObject();

            return Object.keys(serializationObject);
        }
    },

    getExternalObjectLabels: {
        value: function() {
            var serializationObject = this.getSerializationObject(),
                labels = [];

            for (var label in serializationObject) {
                if (Object.keys(serializationObject[label]).length === 0) {
                    labels.push(label);
                }
            }

            return labels;
        }
    },

    isExternalObject: {
        value: function(label) {
            var serializationObject = this.getSerializationObject();

            if (serializationObject && label in serializationObject) {
                return Object.keys(serializationObject[label]).length === 0;
            } else {
                return false;
            }
        }
    },

    getSerializationLabelsWithElements: {
        value: function(elementIds) {
            var inspector = new SerializationInspector(),
                labels = [];

            inspector.initWithSerialization(this);
            inspector.visitSerialization(function(node) {
                // Check if this is one of the elements we're looking for
                if (node.type === "Element" && elementIds.indexOf(node.data) >= 0) {
                    // Check if it's inside a "properties" block
                    node = node.parent;
                    if (node && node.name === "properties") {
                        // Check if it's in a montage object
                        node = node.parent;
                        if (node && node.type === "montageObject") {
                            labels.push(node.label);
                        }
                    }
                }
            });

            return labels;
        }
    },

    renameElementReferences: {
        value: function(elementsTable) {
            var inspector = new SerializationInspector();

            inspector.initWithSerialization(this);
            inspector.visitSerialization(function(node) {
                if (node.type === "Element" && node.data in elementsTable) {
                    node.data = elementsTable[node.data];
                }
            });
        }
    },

    renameSerializationLabels: {
        value: function(labelsTable) {
            var inspector = new SerializationInspector();

            inspector.initWithSerialization(this);
            inspector.visitSerialization(function(node) {
                if (node.label) {
                    var label = node.label;

                    if (label in labelsTable) {
                        node.label = labelsTable[label];
                    }
                }
                if (node.type === "reference") {
                    var reference = node.data;

                    if (reference in labelsTable) {
                        node.data = labelsTable[reference];
                    }
                }
            });
        }
    },

    mergeSerialization: {
        value: function(serialization) {
            return SerializationMerger.mergeSerializations(this, serialization);
        }
    },

    extractSerialization: {
        value: function(labels, externalLabels) {
            var extractor = new SerializationExtractor();

            extractor.initWithSerialization(this);
            return extractor.extractSerialization(labels, externalLabels);
        }
    }
});

var SerializationMerger = Montage.specialize(null, {
    /**
     * Merges serialization2 into serialization1.
     *
     * @param {Serialization} serialization1 The serialization to be merged and
     *        end result of the merge operation.
     * @param {Serialization} serialization2 The serialization to be merged.
     * @return {Object} The collision table with the new labels generated for
     *         label clashes.
     */
    mergeSerializations: {
        value: function(serialization1, serialization2) {
            var serializationObject1,
                serializationObject2,
                serializationString2,
                labels1,
                labels2,
                collisionTable;

            labels1 = serialization1.getSerializationLabels();
            labels2 = serialization2.getSerializationLabels();

            // Check for name collisions and generate new labels
            collisionTable = this._createCollisionTable(labels1, labels2);

            // Replace the labels with the new, non-colliding, ones
            if (collisionTable) {
                // Clone serialization2 because we don't want to modify it.
                serializationString2 = serialization2.getSerializationString();
                serialization2 = new Serialization()
                    .initWithString(serializationString2);

                serialization2.renameSerializationLabels(collisionTable);
                labels2 = serialization2.getSerializationLabels();
            }

            // Merge the two serializations without the fear of name clashing
            serializationObject1 = serialization1.getSerializationObject();
            serializationObject2 = serialization2.getSerializationObject();

            for (var i = 0, label; (label = labels2[i]); i++) {
                serializationObject1[label] = serializationObject2[label];
            }

            serialization1.initWithObject(serializationObject1);

            return collisionTable;
        }
    },

    _createCollisionTable: {
        value: function(labels1, labels2) {
            var labeler = new MontageLabeler(),
                collisionTable = {},
                hasCollision = false;

            for (var i = 0; i < labels1.length; i++) {
                labeler.setObjectLabel(null, labels1[i]);
            }

            for (var i = 0, label; (label = labels2[i]); i++) {
                if (labels1.indexOf(label) >= 0) {
                    // All new labels will be "object<N>" because we give an
                    // object.
                    collisionTable[label] = labeler.generateObjectLabel({});
                    hasCollision = true;
                }
            }

            if (hasCollision) {
                return collisionTable;
            }
        }
    }
});

var SerializationInspector = Montage.specialize( {
    initWithSerialization: {
        value: function(serialization) {
            this._serialization = serialization;
        }
    },

    visitSerialization: {
        value: function(visitor) {
            var serialization = this._serialization.getSerializationObject();

            this._walkRootObjects(visitor, serialization);
            this._serialization.initWithObject(serialization);
        }
    },

    visitSerializationObject: {
        value: function(label, visitor) {
            var serialization = this._serialization.getSerializationObject();

            if (label in serialization) {
                this._walkRootObject(visitor, serialization, label);
                this._serialization.initWithObject(serialization);
            } else {
                throw new Error('Object "' + label + '" does not exist in ' + this._serialization.getSerializationString());
            }
        }
    },

    changeLabel: {
        value: function(oldLabel, newLabel) {
            var serialization = this._serialization.getSerializationObject(),
                object;

            object = serialization[oldLabel];
            delete serialization[oldLabel];
            serialization[newLabel] = object;
        }
    },

    _walkRootObjects: {
        value: function(visitor, objects) {
            var object,
                type;

            for (var label in objects) {
                this._walkRootObject(visitor, objects, label);
            }
        }
    },

    _walkRootObject: {
        value: function(visitor, objects, label) {
            var object = objects[label];

            if ("value" in object) {
                this._walkObject(visitor, object, "value", label);
            } else {
                this._walkCustomObject(visitor, objects, label);
            }
        }
    },

    /**
     * @param parentObject {Object} The parent object of the object to walk
     * @param key {String} The key of the object in the parent object
     * @param label {String} Optional label for when the object has no
     *                       parent
     * @param parent {Object} The representation of the object's parent
     */
    _walkObject: {
        value: function(visitor, parentObject, key, label, parent) {
            var object = parentObject[key],
                type = MontageReviver.getTypeOf(object),
                value,
                serialization,
                data;

            // Create the value representing this object in the serialization.
            value = {
                type: type
            };
            if (label) {
                value.label = label;
            } else {
                value.name = key;
            }
            if (parent) {
                value.parent = parent;
            }

            // Visit the value
            if (type === "number" || type === "string" || type === "null") {
                value.data = object;
                visitor(value);
                parentObject[key] = value.data;

            } else if (type === "regexp") {
                value.data = object["/"];
                visitor(value);
                object["/"] = value.data;

            } else if (type === "reference") {
                value.data = object["@"];
                visitor(value);
                object["@"] = value.data;

            } else if (type === "Element") {
                value.data = object["#"];
                visitor(value);
                object["#"] = value.data;

            } else if (type === "array") {
                value.data = object;
                visitor(value);
                parentObject[key] = object = value.data;

                for (var i = 0, ii = object.length; i < ii; i++) {
                    this._walkObject(visitor, object, ""+i, null, value);
                }

            } else if (type === "object") {
                value.data = object;
                visitor(value);
                parentObject[key] = object = value.data;

                for (var key in object) {
                    this._walkObject(visitor, object, key, null, value);
                }
            }

            // Update the label if it was changed.
            if (value.label != label) {
                this.changeLabel(label, value.label);
            }
        }
    },

    _walkCustomObject: {
        value: function(visitor, objects, label) {
            var object = objects[label],
                value;

            value = {
                type: "montageObject",
                label: label,
                data: object
            };

            visitor(value);
            objects[label] = object = value.data;
            if (value.label != label) {
                this.changeLabel(label, value.label);
            }

            if (object.properties) {
                this._walkObject(visitor, object, "properties", null, value);
            }
            if (object.listeners) {
                this._walkObject(visitor, object, "listeners", null, value);
            }
            if (object.bindings) {
                this._walkBindings(visitor, object, null, value);
            }
            if (object.localizations) {
                this._walkLocalizations(visitor, object, null, value);
            }
        }
    },

    _walkBindings: {
        value: function(visitor, parentObject, parent) {
            var object = parentObject.bindings,
                value;

            value = {
                type: "bindings",
                data: object,
                parent: parent
            };

            visitor(value);
            parentObject.bindings = object = value.data;

            for (var key in object) {
                this._walkBinding(visitor, object, key, value);
            }
        }
    },

    _walkBinding: {
        value: function(visitor, parentObject, key, parent) {
            var object = parentObject[key],
                value;

            value = {
                type: "binding",
                name: key,
                data: object,
                parent: parent
            };

            visitor(value);
            parentObject[key] = object = value.data;

            this._walkBindingData(visitor, object, value);
        }
    },

    _walkBindingData: {
        value: function(visitor, object, parent) {
            var sourcePath,
                parseTree,
                modified = false;

            sourcePath = object["<-"] || object["<->"];
            parseTree = parse(sourcePath);
            this._walksBindingReferences(parseTree, function(syntax) {
                var value = {
                    type: "reference",
                    data: syntax.label
                };
                visitor(value);
                if (syntax.label !== value.data) {
                    syntax.label = value.data;
                    modified = true;
                }
            });

            if (modified) {
                if ("<-" in object) {
                    object["<-"] = stringify(parseTree);
                } else {
                    object["<->"] = stringify(parseTree);
                }
            }

            if (object.converter) {
                this._walkObject(visitor, object, "converter", null, parent);
            }
        }
    },

    _walkLocalizations: {
        value: function(visitor, parentObject, parent) {
            var object = parentObject.localizations,
                value;

            value = {
                type: "localizations",
                data: object,
                parent: parent
            };

            visitor(value);
            parentObject.localizations = object = value.data;

            for (var key in object) {
                this._walkLocalization(visitor, object, key, value);
            }
        }
    },

    _walkLocalization: {
        value: function(visitor, parentObject, key, parent) {
            var object = parentObject[key],
                value,
                data;

            value = {
                type: "localization",
                name: key,
                data: object,
                parent: parent
            };

            visitor(value);
            parentObject[key] = object = value.data;

            if (typeof object.key === "object") {
                this._walkBindingData(visitor, object.key, value);
            }

            if (typeof object.default === "object") {
                this._walkBindingData(visitor, object.default, value);
            }

            if (typeof object.data === "object") {
                data = object.data;

                for (var key in data) {
                    this._walkBindingData(visitor, data[key], value);
                }
            }
        }
    },

    /**
     * Visits all object references made in the binding parsing tree
     */
    _walksBindingReferences: {
        value: function(parseTree, visitor) {
            var args = parseTree.args;

            if (parseTree.type === "component") {
                visitor(parseTree);
            }

            if (args) {
                for (var i = 0, ii = args.length; i < ii; i++) {
                    this._walksBindingReferences(args[i], visitor);
                }
            }
        }
    }
});

var SerializationExtractor = Montage.specialize( {
    _serialization: {value: null},

    initWithSerialization: {
        value: function(serialization) {
            this._serialization = serialization;
        }
    },

    /**
     * Creates a new serialization with the labels given.
     */
    extractSerialization: {
        value: function(labels, externalLabels) {
            var inspector = new SerializationInspector(),
                serializationObject,
                objects = {},
                references = [];

            serializationObject = this._serialization.getSerializationObject();
            inspector.initWithSerialization(this._serialization);

            for (var i = 0, label; (label = labels[i]); i++) {
                objects[label] = serializationObject[label];

                inspector.visitSerializationObject(label, function(node) {
                    var label;

                    if (node.type === "reference") {
                        label = node.data;
                        if (references.indexOf(label) === -1 &&
                            labels.indexOf(label) === -1) {
                            references.push(label);
                        }
                    }
                });
            }

            if (externalLabels) {
                for (var i = 0, label; (label = externalLabels[i]); i++) {
                    // Make sure we don't add objects that are not part of the
                    // serialization we're extracting from.
                    // If the same label is defined in both labels and
                    // externalLabels then labels takes precedence.
                    if (label in serializationObject && !(label in objects)) {
                        objects[label] = {};
                    }
                }
            }

            for (var i = 0, label; (label = references[i]); i++) {
                objects[label] = {};
            }

            return new Serialization().initWithObject(objects);
        }
    }
});

exports.Serialization = Serialization;
exports.SerializationMerger = SerializationMerger;
exports.SerializationInspector = SerializationInspector;
exports.SerializationExtractor = SerializationExtractor;
