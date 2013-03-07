var Montage = require("montage").Montage;
var Converter = require('montage/core/converter/converter').Converter;

exports.TargetInfoConverter = Montage.create(Converter, {

    convert: {
        value: function (value) {
            return value._montage_metadata.objectName;
        }
    }

});
