var Montage = require("montage").Montage;
var Value = require("mousse/serialization/ast").Value;

/**
 * ElementReference
 *
 * @extends Value
 */
var ElementReference = Montage.specialize.call(Value, {

    constructor: {
        value: function ElementReference() {}
    },

    initWithRootAndId: {
        value: function(root, id) {
            Value.call(this, root, id);
            return this;
        }
    },

    _getSerializationValue: {
        value: function() {
            return {"#": this.value};
        }
    }
});

/**
 * ModuleReference
 *
 * @extends Value
 */
var ModuleReference = Montage.specialize.call(Value, {

    constructor: {
        value: function ModuleReference() {}
    },

    initWithRootAndModuleId: {
        value: function(root, moduleId) {
            Value.call(this, root, moduleId);
            return this;
        }
    },

    _getSerializationValue: {
        value: function() {
            return {"%": this.value};
        }
    }
});

exports.ElementReference = ElementReference;
exports.ModuleReference = ModuleReference;
