var Montage = require("../../core").Montage;
var Promise = require("../../promise").Promise;

var UnitDeserializer = Montage.specialize(/** @lends UnitDeserializer# */ {
    _context: {value: null},

    create: {
        value: function() {
            return new this();
        }
    },

    initWithContext: {
        value: function(context) {
            this._context = context;

            return this;
        }
    },

    _templatePropertyRegExp: {
        value: /^([^:]+)(:.*)$/
    },

    /**
     * A valid template property reference is one that references a component
     * that exists and has the format: @<component>:<property>.
     */
    isValidTemplatePropertyReference: {
        value: function(label) {
            var templateProperty = this._templatePropertyRegExp.exec(label);

            if (templateProperty) {
                var componentLabel = templateProperty[1];

                if (this._context.hasObject(componentLabel)) {
                    return true;
                } else {
                    return false;
                }
            } else {
                return false;
            }
        }
    },

    getObjectByLabel: {
        value: function(label) {
            if (this._context.hasObject(label)) {
                // All labels that exist are immediately resolved into an object
                // even if they are a valid template property reference. This
                // "trick" can be used to speed up template property lookups.
                return this._context.getObject(label);
            } else if (this.isValidTemplatePropertyReference(label)) {
                // Ignore valid template property references that are not
                // available yet. This can happen during the instantiation of
                // the repetition's content.
                return null;
            } else {
                throw new Error("Object with label '" + label + "' was not found.");
            }
        }
    }
});

exports.UnitDeserializer = UnitDeserializer;
