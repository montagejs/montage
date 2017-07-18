var Montage = require("../../core").Montage;
var MontageAst = require("./montage-ast");

/**
 * ElementReference
 * @class MontageBuilder
 */
var MontageBuilder = Montage.specialize(/** @lends MontageBuilder# */ {
    _root: {value: null},
    _stack: {value: null},
    // _references structure is:
    // {
    //     <label>: [<reference>*]
    // }
    _references: {value: null},
    _placeholderProperty: {value: Object.create(null)},

    constructor: {
        value: function MontageBuilder() {
            this.init();
        }
    },

    createElementReference: {
        value: function (id) {
            return new MontageAst.ElementReference()
                .initWithRootAndId(this._root, id);
        }
    },

    createModuleReference: {
        value: function (moduleId) {
            return new MontageAst.ModuleReference()
                .initWithRootAndModuleId(this._root, moduleId);
        }
    },

    init: {
        value: function() {
            this._references = Object.create(null);
            this._root = new MontageAst.Root();
            this._stack = [this._root];

            return this;
        }
    },

    cleanup: {
        value: function() {
            this._references = null;
            this._root = null;
            this._stack = null;
        }
    },

    getExternalReferences: {
        value: function(oldLabel, newLabel) {
            var references = this._references,
                root = this._root,
                externalReferences = [];

            for (var label in references) {
                // placeholder values are not created at reference creation
                // time, so we need to check for both states, before a
                // placeholder is created and after.
                if (!root.hasProperty(label) ||
                    root.getProperty(label) === this._placeholderProperty) {
                    externalReferences.push(label);
                }
            }

            return externalReferences;
        }
    },

    relabelReferences: {
        value: function(oldLabel, newLabel) {
            var references = this._references[oldLabel];

            if (references) {
                references = references.slice(0);
                for (var i = 0, ii = references.length; i < ii; i++) {
                    references[i].value = newLabel;
                }
            }
        }
    },

    _registerReference: {
        value: function(reference) {
            var references = this._references,
                label = reference.value;

            if (references[label]) {
                references[label].push(reference);
            } else {
                references[label] = [reference];
            }
        }
    },

    _unregisterReference: {
        value: function(reference) {
            var label = reference.label,
                labelReferences = this._references[label],
                ix;

            if (labelReferences.length === 1) {
                delete this._references[label];
            } else {
                ix = labelReferences.indexOf(reference);

                if (ix === -1) {
                    console.log("BUG: reference '" + label + "' not found in registry.");
                } else {
                    labelReferences.splice(ix, 1);
                }
            }
        }
    },

    _createPlaceholdersForReferences: {
        value: function() {
            var references = this._references,
                root = this._root;

            for (var label in references) {
                if (!root.hasProperty(label)) {
                    root.setProperty(label, this._placeholderProperty);
                }
            }
        }
    },

    getSerialization: {
        value: function(indent) {
            this._createPlaceholdersForReferences();

            return this._root.serialize(indent);
        }
    },

    root: {
        get: function() {
            return this._root;
        }
    },

    top: {
        get: function() {
            return this._stack[0];
        }
    },

    push: {
        value: function(value) {
            return this._stack.unshift(value);
        }
    },

    pop: {
        value: function() {
            return this._stack.shift();
        }
    },

    createObjectLiteral: {
        value: function() {
            return new MontageAst.ObjectLiteral(this._root, Object.create(null));
        }
    },

    createArray: {
        value: function() {
            return new MontageAst.ObjectLiteral(this._root, []);
        }
    },

    createObjectReference: {
        value: function(label) {
            var reference = new MontageAst.ObjectReference(this._root, label);

            this._registerReference(reference);

            return reference;
        }
    },

    createRegExp: {
        value: function(regexp) {
            return new MontageAst.RegExpObject(this._root, regexp);
        }
    },

    createString: {
        value: function(string) {
            return new MontageAst.Value(this._root, string);
        }
    },

    createNumber: {
        value: function(number) {
            return new MontageAst.Value(this._root, number);
        }
    },

    createBoolean: {
        value: function(boolean) {
            return new MontageAst.Value(this._root, boolean);
        }
    },

    createNull: {
        value: function(boolean) {
            return new MontageAst.Value(this._root, null);
        }
    },

    createCustomObject: {
        value: function() {
            return new MontageAst.CustomObject(this._root);
        }
    }
});

exports.MontageBuilder = MontageBuilder;
