var Montage = require("../../core").Montage;
var Value = require("mousse/serialization/ast").Value;

/**
 * @class ElementReference
 * @extends Value
 */
var ElementReference = Montage.specialize.call(Value, /** @lends ElementReference# */ {

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
 * @class ModuleReference
 * @extends Value
 */
var ModuleReference = Montage.specialize.call(Value, /** @lends ModuleReference# */ {

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
