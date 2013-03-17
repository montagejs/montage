var Montage = require("montage").Montage;
var Builder = require("mousse/serialization/builder").Builder;
var MontageAst = require("./montage-ast");

/**
 * ElementReference
 *
 * @extends Value
 */
var MontageBuilder = Montage.create(Builder.prototype, {
    create: {
        value: function() {
            var self = Object.create(this);

            Builder.call(self);

            return self;
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