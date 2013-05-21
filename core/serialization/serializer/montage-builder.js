var Montage = require("montage").Montage;
var Builder = require("mousse/serialization/builder").Builder;
var MontageAst = require("./montage-ast");

/**
 * ElementReference
 *
 * @extends Value
 */
var MontageBuilder = Montage.extend.call(Builder, {
    constructor: {
        value: function MontageBuilder() {
            Builder.call(this);
        }
    },

    createElementReference: {
        value: function(id) {
            return MontageAst.ElementReference.create()
                .initWithRootAndId(this._root, id);
        }
    }
});

exports.MontageBuilder = MontageBuilder;
