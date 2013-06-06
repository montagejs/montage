var Montage = require("montage").Montage;
var Labeler = require("mousse/serialization/labeler").Labeler;

exports.MontageLabeler = Montage.specialize.call(Labeler, {
    _labelRegexp: {value: /^[a-zA-Z_$][0-9a-zA-Z_$]*$/},

    constructor: {
        value: function MontageLabeler() {
            Labeler.call(this);
        }
    },

    getObjectName: {
        value: function(object) {
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
