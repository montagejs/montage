var Montage = require("../../core").Montage;
var Malker = require("mousse/serialization/malker").Malker;
var Serializer = require("mousse/serialization/serializer").Serializer;
var MontageBuilder = require("./montage-builder").MontageBuilder;
var MontageLabeler = require("./montage-labeler").MontageLabeler;
var MontageVisitor = require("./montage-visitor").MontageVisitor;

var logger = require("../../logger").logger("montage-serializer");

var MontageSerializer = Montage.specialize.call(Serializer, {
    _require: {value: null},
    _visitor: {value: null},

    _findObjectNameRegExp: {value: /([^\/]+?)(\.reel)?$/},
    _toCamelCaseRegExp: {value: /(?:^|-)([^-])/g},
    _replaceToCamelCase: {value: function(_, g1){return g1.toUpperCase();}},

    constructor: {
        value: function MontageSerializer() {}
    },

    initWithRequire: {
        value: function(_require) {
            this._require = _require;

            this._builder = new MontageBuilder();
            this._labeler = new MontageLabeler();
            this._visitor = new MontageVisitor()
                .initWithBuilderAndLabelerAndRequireAndUnits(
                    this._builder,
                    this._labeler,
                    this._require,
                    this.constructor._units);

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
    }
}, {
    _units: {
        value: Object.create(null)
    },

    defineSerializationUnit: {
        value: function(name, funktion) {
            this._units[name] = funktion;
        }
    },

    getDefaultObjectNameForModuleId: {
        value: function(moduleId) {
            this._findObjectNameRegExp.test(moduleId);

            return RegExp.$1.replace(this._toCamelCaseRegExp, this._replaceToCamelCase);
        }
    }

});

exports.MontageSerializer = MontageSerializer;
exports.serialize = function(object, _require) {
    return new MontageSerializer().initWithRequire(_require)
        .serializeObject(object);
};
