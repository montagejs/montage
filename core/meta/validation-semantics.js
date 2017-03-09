var Montage = require("../core").Montage;
// TODO kriskowal: massage selectors and FRB together
var Semantics = Montage;
// var Semantics = (require)("core/selector/semantics").Semantics;
var deprecate = require("../deprecate"),
    logger = require("../logger").logger("objectDescriptor");


/**
 * @class PropertyValidationSemantics
 * @extends Semantics
 */
var PropertyValidationSemantics = exports.PropertyValidationSemantics = Semantics.specialize( /** @lends PropertyValidationSemantics# */ {

    /**
     * Create a new semantic evaluator with the object descriptor.
     * @function
     * @param {ObjectDescriptor} objectDescriptor
     * @returns itself
     */
    initWithObjectDescriptor: {
        value: function (objectDescriptor) {
            this._objectDescriptor = objectDescriptor;
            return this;
        }
    },

    _objectDescriptor: {
        value: undefined
    },

    /**
     * Component description attached to this validation rule.
     */
    objectDescriptor: {
        get: function () {
            return this._objectDescriptor;
        }
    },

    /**
     * Compile the syntax tree into a function that can be used for evaluating
     * this selector.
     * @function
     * @param {Selector} selector syntax
     * @returns function
     */
    compile: {
        value: function (syntax, parents) {
            Semantics.compile.call(this, syntax, parents);
        }
    },

    operators: {
        value: {
            isBound: function (a) {
                return !a;
            }
        }
    },

    evaluators: {
        value: {
            isBound: function (collection, modify) {
                var self = this;
                return function (value, parameters) {
                    value = self.count(collection(value, parameters));
                    return modify(value, parameters);
                };
            }
        }
    },

    /*****************************************************************
     * Deprecated Methods
     */

    /**
     * @deprecated
     * Create a new semantic evaluator with the object descriptor.
     * @function
     * @param {ObjectDescriptor} objectDescriptor
     * @returns itself
     */
    initWithBlueprint: {
        value: deprecate.deprecateMethod(void 0, function (blueprint) {
            return this.initWithObjectDescriptor(blueprint);
        }, "initWithBlueprint", "initWithObjectDescriptor")
    },

    /**
     * @deprecated
     * Component description attached to this validation rule.
     */
    blueprint: {
        get: deprecate.deprecateMethod(void 0, function () {
            return this._blueprint;
        }, "blueprint", "objectDescriptor")
    }

});

for (var operator in Semantics.operators) {
    PropertyValidationSemantics.operators[operator] = Semantics.operators[operator];
}

for (var evaluator in Semantics.evaluators) {
    PropertyValidationSemantics.evaluators[evaluator] = Semantics.evaluators[evaluator];
}
