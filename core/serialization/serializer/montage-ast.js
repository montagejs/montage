var Montage = require("montage").Montage;
var Value = require("mousse/serialization/ast").Value;

/**
 * ElementReference
 *
 * @extends Value
 */
var ElementReference = Montage.create(Value.prototype, {
    create: {
        value: function() {
            return Object.create(ElementReference);
        }
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

exports.ElementReference = ElementReference;