var Montage = require("../../core").Montage;

var Root = exports.Root = Montage.specialize({

    constructor: {
        value:  function Root() {
            this.object = Object.create(null);
        }
    },

    object: {value: null},

    setProperty: {
        value: function(name, value) {
            if (name != null) {
                this.object[name] = value;
            }
        }
    },

    getProperty: {
        value: function(name) {
            return this.object[name];
        }
    },

    clearProperty: {
        value: function(name) {
            delete this.object[name];
        }
    },

    hasProperty: {
        value: function(name) {
            return name in this.object;
        }
    },

    serialize: {
        value: function(indent) {
            return JSON.stringify(this, null, indent);
        }
    },

    toJSON: {
        value: function() {
            var result = Object.create(null),
                object;

            for (var label in this.object) {
                object = this.object[label];

                if (object.toJSON) {
                    result[label] = object.toJSON(label, 1);
                } else {
                    result[label] = object;
                }
            }

            return result;
        }
    }
});


var Value = exports.Value = Montage.specialize({
    root: {value: null},
    label: {value: null},
    value: {value: null},

    constructor: {
        value: function Value(root, value) {
            this.root = root;
            this.value = value;
        }
    },

    setLabel: {
        value: function(label) {
            if (this.label) {
                this.root.clearProperty(this.label);
            }

            this.label = label;
            this.root.setProperty(label, this);
        }
    },

    getLabel: {
        value: function() {
            return this.label;
        }
    },

    clearLabel: {
        value: function() {
            this.root.clearProperty(this.label);
            this.label = null;
        }
    },

    _getSerializationValue: {
        value: function() {
            return this.value;
        }
    },

    toJSON: {
        value: function(index, level) {
            var value = this._getSerializationValue();

            if (level === 1) {
                return {value: value};
            } else {
                return value;
            }
        }
    }
});

/**
 * @class ElementReference
 * @extends Value
 */
var ElementReference = exports.ElementReference = Value.specialize(/** @lends ElementReference# */ {

    constructor: {
        value: function ElementReference() {}
    },

    initWithRootAndId: {
        value: function (root, id) {
            Value.call(this, root, id);
            return this;
        }
    },

    _getSerializationValue: {
        value: function () {
            return {"#": this.value};
        }
    }
});

/**
 * @class ModuleReference
 * @extends Value
 */
var ModuleReference = exports.ModuleReference = Value.specialize( /** @lends ModuleReference# */ {

    constructor: {
        value: function ModuleReference() {}
    },

    initWithRootAndModuleId: {
        value: function (root, moduleId) {
            Value.call(this, root, moduleId);
            return this;
        }
    },

    _getSerializationValue: {
        value: function () {
            return {"%": this.value};
        }
    }
});


var ObjectReference = exports.ObjectReference = Value.specialize( /** @lends ObjectReference# */ {

    constructor: {
        value: function ObjectReference(root, referenceLabel) {
            Value.call(this, root, referenceLabel);
        }
    },

    _getSerializationValue: {
        value: function() {
            return {"@": this.value};
        }
    }
});


var CustomObject = exports.CustomObject = Value.specialize( /** @lends CustomObject# */ {

    constructor: {
        value: function CustomObject(root) {
            Value.call(this, root, Object.create(null));
        }
    },

    setProperty: {
        value: function(name, value) {
            if (name != null) {
                this.value[name] = value;
            }
        }
    },

    getProperty: {
        value: function(name) {
            return this.value[name];
        }
    },

    clearProperty: {
        value: function(name) {
            delete this.value[name];
        }
    },

    toJSON: {
        value: function(index, level) {
            var reference,
                value = this._getSerializationValue();

            if (level === 1) {
                return value;
            } else {
                reference = new ObjectReference(this.root, this.label);

                return reference.toJSON();
            }
        }
    }
});

var ReferenceableValue = exports.ReferenceableValue = Value.specialize( /** @lends ObjectLiteral# */ {

    constructor: {
        value: function ReferenceableValue(root, value) {
            Value.call(this, root, value);
        }
    },

    toJSON: {
        value: function(index, level) {
            var reference,
                value = this._getSerializationValue();

            if (level === 1) {
                return {value: value};
            } else if (this.label) {
                reference = new ObjectReference(this.root, this.label);
                return reference.toJSON();
            } else {
                return value;
            }
        }
    }
});

var ObjectLiteral = exports.ObjectLiteral = ReferenceableValue.specialize( /** @lends ObjectLiteral# */ {

    constructor: {
        value: function ObjectLiteral(root, object) {
            Value.call(this, root, object);
        }
    },

    setProperty: {
        value: function(name, value) {
            if (name != null) {
                this.value[name] = value;
            }
        }
    },

    getProperty: {
        value: function(name) {
            return this.value[name];
        }
    },

    clearProperty: {
        value: function(name) {
            delete this.value[name];
        }
    },

    getPropertyNames: {
        value: function() {
            return Object.keys(this.value);
        }
    }
});

var RegExpObject = exports.RegExpObject = ReferenceableValue.specialize( /** @lends RegExpObject# */ {

    constructor: {
        value: function RegExpObject(root, regexp) {
            Value.call(this, root, regexp);
        }
    },

    _getSerializationValue: {
        value: function() {
            var regexp = this.value;

            return {"/": {
                source: regexp.source,
                flags: (regexp.global ? "g" : "") + (regexp.ignoreCase ? "i" : "") + (regexp.multiline ? "m" : "")
            }};
        }
    }
});
