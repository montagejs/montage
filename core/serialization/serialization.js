var Montage = require("../core").Montage,
    MontageLabeler = require("./serializer/montage-labeler").MontageLabeler,
    MontageReviver = require("./deserializer/montage-reviver").MontageReviver,
    parse = require("frb/parse"),
    stringify = require("frb/stringify");

/**
 * @class Serialization
 */
var Serialization = Montage.specialize( /** @lends Serialization# */ {
    _serializationString: {value: null},
    _serializationObject: {value: null},
    _serializationLabels: {value: null},

    initWithString: {
        value: function(string) {
            this._serializationString = string;
            this._serializationObject = null;
            this._serializationLabels = null;

            return this;
        }
    },

    initWithObject: {
        value: function(object) {
            this._serializationString = null;
            this._serializationObject = object;
            this._serializationLabels = null;

            return this;
        }
    },

    clone: {
        value: function() {
            var serialization = new Serialization();

            serialization.initWithString(this.getSerializationString());

            return serialization;
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
            var serializationObject;

            if (!this._serializationLabels) {
                if (serializationObject = this.getSerializationObject()) {
                    this._serializationLabels = Object.keys(serializationObject);
                }
            }

            return this._serializationLabels;
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

    hasSerializationLabel: {
        value: function(label) {
            return label in this.getSerializationObject();
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

    isAlias: {
        value: function(label) {
            var serializationObject = this.getSerializationObject();

            if (serializationObject && label in serializationObject) {
                return "alias" in serializationObject[label];
            } else {
                return false;
            }
        }
    },

    getElementId: {
        value: function(label) {
            var object = this.getSerializationObject();

            // TODO: much faster than using the visitor, need to make the visitor
            // faster.
            var element = Montage.getPath.call(object, label + ".properties.element");
            if (element) {
                return element["#"];
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
        value: function(serialization, delegate) {
            return SerializationMerger.mergeSerializations(this, serialization, delegate);
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

/**
 * @class SerializationMerger
 */
var SerializationMerger = Montage.specialize(null, /** @lends SerializationMerger */ {
    /**
     * This delegate method is called when merging an object from serialization2
     * into serialization1. It allows the delegate to change how the object is
     * going to be merged by saying that the object already exists in
     * serialization1 under a different or the same label.
     *
     * When the delegate method doesn't return a string then the default
     * behavior is to add a new object to serialization1. If the object's label
     * collides with another label in serialization1 then a new label is
     * generated and used.
     *
     * By returning a label that exists in serialization1 from the delegate
     * method all references to the object being merged will change to point
     * to the object from serialization1 instead and the object will not be
     * merged.
     * By returning a label that does not exist in both serializations the
     * object will be merged into serialization2 with this new label instead.
     *
     * @callback delegateWillMergeObjectWithLabel
     * @param {string} label The object label.
     * @param {string} newLabel The new label generated by the collision
     *                 resolver in case of collision.
     * @return {string|undefined} the new label for this object.
     */

    /**
     * Merges serialization2 into serialization1.
     *
     * @param {Serialization} serialization1 The serialization to be merged and
     *        end result of the merge operation.
     * @param {Serialization} serialization2 The serialization to be merged.
     * @param {{willMergeObjectWithLabel: delegateWillMergeObjectWithLabel}} delegate The delegate to override the default behavior.
     * @return {Object} The collision table with the new labels generated for
     *         label clashes.
     */
    mergeSerializations: {
        value: function(serialization1, serialization2, delegate) {
            var serializationObject1,
                serializationObject2,
                labels1,
                labels2,
                collisionTable = {},
                foundCollisions,
                hasCollisionTableChanged;

            labels1 = serialization1.getSerializationLabels();
            labels2 = serialization2.getSerializationLabels();

            // Check for name collisions and generate new labels
            foundCollisions = this._createCollisionTable(labels1, labels2, collisionTable, delegate && delegate.labeler);

            if (delegate && delegate.willMergeObjectWithLabel) {
                hasCollisionTableChanged = this._willMergeObjectWithLabel(delegate, serialization1, serialization2, collisionTable);
                foundCollisions = foundCollisions || hasCollisionTableChanged;
            }

            // Replace the labels with the new, non-colliding, ones
            if (foundCollisions) {
                // Clone serialization2 because we don't want to modify it.
                serialization2 = serialization2.clone();
                serialization2.renameSerializationLabels(collisionTable);
                labels2 = serialization2.getSerializationLabels();
            }

            // Merge the two serializations without the fear of name clashing
            serializationObject1 = serialization1.getSerializationObject();
            serializationObject2 = serialization2.getSerializationObject();

            for (var i = 0, label; (label = labels2[i]); i++) {
                // If this label already exists in serialization1 don't merge
                // it as it means they are the same object.
                if (labels1.indexOf(label) === -1) {
                    serializationObject1[label] = serializationObject2[label];
                }
            }

            serialization1.initWithObject(serializationObject1);

            return collisionTable;
        }
    },

    _willMergeObjectWithLabel: {
        value: function(delegate, serialization1, serialization2, collisionTable) {
            var newLabel,
                collisionLabel,
                collisionLabels,
                inDestination,
                renameLabel,
                hasCollisionTableChanged = false,
                labels2 = serialization2.getSerializationLabels();

            if (collisionTable) {
                collisionLabels = [];
                Object.keys(collisionTable).forEach(function(label) {
                    collisionLabels.push(collisionTable[label]);
                });
            }

            for (var i = 0, label; (label = labels2[i]); i++) {
                collisionLabel = collisionTable && collisionTable[label];
                newLabel = delegate.willMergeObjectWithLabel(label, collisionLabel);

                if (typeof newLabel === "string") {
                    // If the delegate returns a new label there are two
                    // possible interpretations:
                    // 1) The label is on the destination serialization so it
                    //    means that we don't need to move this object there
                    //    because it is already there under a different label.
                    //    We just need to update the references to point to the
                    //    right name.
                    // 2) The label doesn't exist anywhere so it means we just
                    //    need to move the object under this new different
                    //    label.
                    inDestination = this._isLabelValidInSerialization(
                        newLabel, serialization1);
                    if (!inDestination) {
                        renameLabel = !this._isLabelValidInSerialization(
                            newLabel, serialization2)
                            && collisionLabels.indexOf(newLabel) === -1;
                    }

                    if (inDestination || renameLabel) {
                        hasCollisionTableChanged = true;
                        collisionTable[label] = newLabel;
                    } else {
                        throw new Error("willMergeObjectWithLabel either needs to return a label that exists in the destination serialization to indicate it's the same object or return a completely new label to rename the object being merged. \"" + newLabel + "\"  destination: " + serialization1.getSerializationString() + "\n source: " + serialization2.getSerializationString() + "\n collision table: " + JSON.stringify(collisionTable, null, 4));
                    }
                }
            }

            return hasCollisionTableChanged;
        }
    },

    /**
     * This function returns true when the label is part of the serialization,
     * or, if a template property, it refers to a component label that is part
     * of the serialization.
     * @private
     */
    _isLabelValidInSerialization: {
        value: function(label, serialization) {
            var componentLabel,
                ix;

            if (serialization.hasSerializationLabel(label)) {
                return true;
            } else {
                ix = label.indexOf(":");
                // It's a template property, if the component part is
                // in the serialization then it's a valid label too.
                if (ix > 0) {
                    componentLabel = label.slice(0, ix);
                    if (serialization.hasSerializationLabel(componentLabel)) {
                        return true;
                    }
                }
            }

            return false;
        }
    },

    /**
     * This function creates a collision table between labels1 and labels2.
     * The collision table offers renames for the labels in the labels2 array
     * that already exist in the labels1 array.
     *
     * This function knows how to deal with labels that refer to template
     * properties. A label for a template property has the following syntax:
     * <component label>:<label>.
     * The collision table guarantees that template properties' labels will
     * always be in sync with their corresponding component label.
     *
     * When a collision exist with a label for a template property the
     * collision is solved by creating a new label for the component and
     * adopting that new label: <new component label>:<label>. In this
     * case the component label will also be part of the resulting collision
     * table even if there was no original collision in labels1.
     *
     * Example:
     * labels1: ["repetition:iteration"]
     * labels2: ["repetition", "repetition:iteration"]
     * collisionTable: {"repetition:iteration": "object:iteration",
     *                  "repetition": "object"}
     *
     * @private
     */
    _createCollisionTable: {
        value: function(labels1, labels2, collisionTable, labeler) {
            var labeler = labeler || new MontageLabeler(),
                foundCollisions = false,
                componentLabel,
                labels1Index = Object.create(null),
                newLabel,
                label,
                ix;

            for (var i = 0; i < labels1.length; i++) {
                label = labels1[i];

                // If this label is a property template then we need to register
                // the component name too, it could be that it's not present
                // on labels1. We want to avoid the possibility of generating
                // a label that conflicts with the component part of the template
                // property.
                ix = label.indexOf(":");
                if (ix > 0) {
                    componentLabel = label.slice(0, ix);
                    labeler.addLabel(componentLabel);
                    labels1Index[componentLabel] = 1;
                }
                labeler.addLabel(label);
                labels1Index[label] = 1;
            }

            for (var i = 0; (label = labels2[i]); i++) {
                // If the label is a template property then check to see if
                // the component label has been renamed already or if the entire
                // label or component label have a collision to solve.
                ix = label.indexOf(":");
                if (ix > 0) {
                    componentLabel = label.slice(0, ix);
                    newLabel = collisionTable[componentLabel];

                    if (newLabel) {
                        collisionTable[label] = newLabel + ":" + label.slice(ix+1);
                        foundCollisions = true;
                    } else if (componentLabel in labels1Index) {
                        // Renaming a label that is a property template is
                        // the same as renaming the component part of the
                        // label.
                        newLabel = labeler.generateLabel(labeler.getLabelBaseName(componentLabel));
                        // Rename the component label too if it exists.
                        if (labels2.indexOf(componentLabel) >= 0) {
                            collisionTable[componentLabel] = newLabel;
                        }
                        collisionTable[label] = newLabel + label.slice(ix);
                        foundCollisions = true;
                    } else {
                        labeler.addLabel(componentLabel);
                    }
                }
                // Also check if the label already has a new label, this can
                // happen if a template property on that component was renamed.
                else if (label in labels1Index && !(label in collisionTable)) {
                    collisionTable[label] = labeler.generateLabel(labeler.getLabelBaseName(label));
                    foundCollisions = true;
                } else {
                    labeler.addLabel(label);
                }
            }

            return foundCollisions;
        }
    }
});


/**
 * @class SerializationInspector
 */
var SerializationInspector = Montage.specialize(/** @lends SerializationInspector# */ {
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
     * @private
     * @param parentObject {Object} The parent object of the object to walk
     * @param key {string} The key of the object in the parent object
     * @param label {string} Optional label for when the object has no
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
            parseTree = Object.clone(parse(sourcePath));
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
     * @private
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


/**
 * @class SerializationExtractor
 */
var SerializationExtractor = Montage.specialize( /** @lends SerializationExtractor# */ {
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
                        // We don't process template properties here, meaning
                        // that if we have "table" and a reference like
                        // "@table:cell" the latter will be considered an
                        // external reference even though the component is in
                        // scope.
                        // We do this on purpose because it allow us to process
                        // all template properties of the serialization without
                        // having to walk the entire serialization tree looking
                        // for them.
                        // If for some reason we need to "correct" this behavior
                        // then we also need to change the way we resolve
                        // template properties' alias in
                        // Template.expandParameters.
                        // Instead of relying on willMergeObjectWithLabel we
                        // need to walk the serialization looking for these.
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
