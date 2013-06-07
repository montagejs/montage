"use strict";
/**
 @module montage/core/meta/validation-semantics
 @requires montage/core/core
 @requires core/exception
 @requires core/promise
 @requires core/logger
 */
var Montage = require("montage").Montage;
// TODO kriskowal: massage selectors and FRB together
var Semantics = Montage;
// var Semantics = (require)("core/selector/semantics").Semantics;

var logger = require("core/logger").logger("blueprint");

/**
 @class PropertyValidationSemantics
 @extends Semantics
 */
var PropertyValidationSemantics = exports.PropertyValidationSemantics = Semantics.create(Semantics, /** @lends PropertyValidationSemantics# */ {

    constructor: {
        value: function PropertyValidationSemantics() {
            this.super();
        }
    },

    /**
     Create a new semantic evaluator with the blueprint.
     @function
     @param {Blueprint} blueprint
     @returns itself
     */
    initWithBlueprint: {
        value: function(blueprint) {
            this._blueprint = blueprint;
            return this;
        }
    },

    /*
     * @private
     */
    _blueprint: {
        value: null
    },

    /*
     * Component description attached to this validation rule.
     */
    blueprint: {
        get: function() {
            return this._blueprint;
        }
    },

    /**
     * Compile the syntax tree into a function that can be used for evaluating this selector.
     * @function
     * @param {Selector} selector syntax
     * @returns function
     */
    compile: {
        value: function(syntax, parents) {
            Semantics.compile.call(this, syntax, parents);
        }
    },

    operators: {
        value: {
            isBound: function(a) {
                return !a;
            }
        }
    },

    evaluators: {
        value: {
            isBound: function(collection, modify) {
                var self = this;
                return function(value, parameters) {
                    value = self.count(collection(value, parameters));
                    return modify(value, parameters);
                };
            }
        }
    }

});

for (var operator in Semantics.operators) {
    PropertyValidationSemantics.operators[operator] = Semantics.operators[operator];
}

for (var evaluator in Semantics.evaluators) {
    PropertyValidationSemantics.evaluators[evaluator] = Semantics.evaluators[evaluator];
}
