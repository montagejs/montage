var Montage = require("core/core").Montage;
var Malker = require("mousse/serialization/malker").Malker;
var Serializer = require("mousse/serialization/serializer").Serializer;
var MontageBuilder = require("./montage-builder").MontageBuilder;
var MontageLabeler = require("./montage-labeler").MontageLabeler;
var MontageVisitor = require("./montage-visitor").MontageVisitor;

var logger = require("core/logger").logger("montage-serializer");

var MontageSerializer = Montage.specialize.call(Serializer, {
    _require: {value: null},
    _visitor: {value: null},
    _units: {value: Object.create(null)},

    _findObjectNameRegExp: {value: /([^\/]+?)(\.reel)?$/},
    _toCamelCaseRegExp: {value: /(?:^|-)([^-])/g},
    _replaceToCamelCase: {value: function(_, g1){return g1.toUpperCase()}},

    constructor: {
        value: function MontageSerializer() {}
    },

    initWithRequire: {
        value: function(_require) {
            this._require = _require;

            this._builder = MontageBuilder.create();
            this._labeler = MontageLabeler.create();
            this._visitor = MontageVisitor.create()
                .initWithBuilderAndLabelerAndRequireAndUnits(
                    this._builder,
                    this._labeler,
                    this._require,
                    this._units);

            this._malker = new Malker(this._visitor);

            return this;
        }
    },

    getExternalObjects: {
        value: function() {
            return this._visitor.getExternalObjects();
        }
    },

    getExternalElements: {
        value: function() {
            return this._visitor.getExternalElements();
        }
    },

    getDefaultObjectNameForModuleId: {
        value: function(moduleId) {
            this._findObjectNameRegExp.test(moduleId);

            return RegExp.$1.replace(this._toCamelCaseRegExp, this._replaceToCamelCase);
        }
    },

    defineSerializationUnit: {
        value: function(name, funktion) {
            this._units[name] = funktion;
        }
    }
});

exports.MontageSerializer = MontageSerializer;
exports.serialize = function(object, _require) {
    return MontageSerializer.create().initWithRequire(_require)
        .serializeObject(object);
};
