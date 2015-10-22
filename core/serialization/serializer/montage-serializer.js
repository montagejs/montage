/**
 * @module montage/core/serialization/serializer/montage-serializer
 */

var Montage = require("../../core").Montage,
    MontageWalker = require("./montage-malker").MontageWalker,
    MontageBuilder = require("./montage-builder").MontageBuilder,
    MontageLabeler = require("./montage-labeler").MontageLabeler,
    MontageVisitor = require("./montage-visitor").MontageVisitor,
    logger = require("../../logger").logger("montage-serializer");

var MontageSerializer = Montage.specialize({
    _require: {value: null},
    _visitor: {value: null},
    _labeler: {value: null},
    _builder: {value: null},
    _serializationIndentation: {value: 2},
    _malker: {value: null},

    constructor: {
        value: function MontageSerializer() {}
    },

    initWithRequire: {
        value: function (_require) {
            this._require = _require;

            this._builder = new MontageBuilder();
            this._labeler = new MontageLabeler();
            this._visitor = new MontageVisitor()
                .initWithBuilderAndLabelerAndRequireAndUnits(
                    this._builder,
                    this._labeler,
                    this._require,
                    this.constructor._units
                );

            this._malker = new MontageWalker(this._visitor);

            return this;
        }
    },

    getExternalObjects: {
        value: function () {
            return this._visitor.getExternalObjects();
        }
    },

    getExternalElements: {
        value: function () {
            return this._visitor.getExternalElements();
        }
    },

    setSerializationIndentation: {
        value: function(indentation) {
            this._serializationIndentation = indentation;
        }
    },

    serialize: {
        value: function(objects) {
            var serializationString;

            this._labeler.initWithObjects(objects);

            for (var label in objects) {
                this._malker.visit(objects[label]);
            }

            serializationString = this._formatSerialization(
                this._builder.getSerialization(
                    this._serializationIndentation
                )
            );

            return serializationString;
        }
    },

    serializeObject: {
        value: function(object) {
            return this.serialize({root: object});
        }
    },

    _formatSerializationBindingsRegExp: {
        value: /\{\s*("(?:<->?)")\s*:\s*("[^"]+"\s*(?:,\s*"converter"\s*:\s*\{\s*"@"\s*:\s*"[^"]+"\s*\}\s*|,\s*"deferred"\s*:\s*(true|false)\s*)*)\}/gi
    },

    _formatSerializationBindingsReplacer: {
        value: function(_, g1, g2) {
            return '{' + g1 + ': ' +
                g2.replace(/\n\s*/g, "").replace(/,\s*/g, ", ") +
                '}';
        }
    },
    _formatSerializationBindings: {
        value: function(serialization) {
            return serialization.replace(
                this._formatSerializationBindingsRegExp,
                this._formatSerializationBindingsReplacer);
        }
    },

    _formatSerializationReferencesRegExp: {
        value: /\{\s*("[#@]")\s*:\s*("[^"]+")\s*\}/gi
    },
    _formatSerializationReferences: {
        value: function(serialization) {
            return serialization.replace(
                this._formatSerializationReferencesRegExp, "{$1: $2}");
        }
    },

    _formatSerialization: {
        value: function(serialization) {
            return this._formatSerializationBindings(
                this._formatSerializationReferences(serialization));
        }
    }

}, {
    _units: {
        value: Object.create(null)
    },

    defineSerializationUnit: {
        value: function (name, funktion) {
            this._units[name] = funktion;
        }
    },

    _toCamelCaseRegExp: {value: /(?:^|-)([^-])/g},
    _replaceToCamelCase: {value: function (_, g1) {
        return g1.toUpperCase();}
    },

    _findObjectNameRegExp: {value: /([^\/]+?)(\.reel)?$/},

    getDefaultObjectNameForModuleId: {
        value: function (moduleId) {
            this._findObjectNameRegExp.test(moduleId);

            return RegExp.$1.replace(this._toCamelCaseRegExp, this._replaceToCamelCase);
        }
    }

});

exports.MontageSerializer = MontageSerializer;
exports.serialize = function (object, _require) {
    return new MontageSerializer().initWithRequire(_require)
        .serializeObject(object);
};
