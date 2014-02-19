var Montage = require("../../core").Montage;
var Builder = require("mousse/serialization/builder").Builder;
var MontageAst = require("./montage-ast");

/**
 * ElementReference
 * @class MontageBuilder
 */
var MontageBuilder = Montage.specialize.call(Builder, /** @lends MontageBuilder# */ {
    constructor: {
        value: function MontageBuilder() {
            Builder.call(this);
        }
    },

    createElementReference: {
        value: function(id) {
            return new MontageAst.ElementReference()
                .initWithRootAndId(this._root, id);
        }
    },

    createModuleReference: {
        value: function(moduleId) {
            return new MontageAst.ModuleReference()
                .initWithRootAndModuleId(this._root, moduleId);
        }
    }
});

exports.MontageBuilder = MontageBuilder;
