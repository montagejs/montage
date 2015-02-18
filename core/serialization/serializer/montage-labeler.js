var Montage = require("../../core").Montage;
var Labeler = require("mousse/serialization/labeler").Labeler;

exports.MontageLabeler = Montage.specialize.call(Labeler, {
    _labelRegexp: {value: /^[a-zA-Z_$][0-9a-zA-Z_$]*$/},

    constructor: {
        value: function MontageLabeler() {
            Labeler.call(this);
        }
    },

    getTemplatePropertyLabel: {
        value: function (object) {
            var label = this.superForValue("getObjectLabel")(object);

            if (label[0] !== ":") {
                throw new Error("Template property's labels need to start with a colon (:), (\"" + label + "\").");
            }

            return label;
        }
    },

    getObjectLabel: {
        value: function (object) {
            var label = this.super(object);

            if (label[0] === ":") {
                throw new Error("Labels starting with colon (:) can only be used for template properties, (\"" + label + "\").");
            }

            return label;
        }
    },

    getObjectName: {
        value: function (object) {
            var identifier = object.identifier,
                objectName;

            if (identifier && this._labelRegexp.test(identifier)) {
                objectName = object.identifier;
            } else if ("getInfoForObject" in object || "getInfoForObject" in object.constructor ) {
                objectName = Montage.getInfoForObject(object).objectName;
                objectName = objectName.toLowerCase();
            } else {
                objectName = Labeler.prototype.getObjectName.call(
                                this, object);
            }

            return objectName;
        }
    }
});
