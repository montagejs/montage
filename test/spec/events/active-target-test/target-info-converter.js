var Montage = require("montage").Montage;
var Converter = require('montage/core/converter/converter').Converter;

exports.TargetInfoConverter = Converter.specialize( {

    convert: {
        value: function (value) {
            return value && value._montage_metadata ? value._montage_metadata.objectName : null;
        }
    }

});
