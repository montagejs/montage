var Montage = require("montage").Montage,
Converter = require("montage/core/converter/converter").Converter;

exports.Tconverter = Montage.create(Converter, {

    // convert fahrenheit to celsius (showing our non-metric heritage here)
    convert: {
        value: function(value) {
            return (parseInt(value, 10) - 32) / 1.8;
        }
    },

    // revert celsius to fahrenheit
    revert: {
        value: function(value) {
            return (1.8 * parseInt(value, 10)) + 32;
        }
    }

});

exports.PrecisionConverter = Montage.create(Converter, {

    convert: {
        value: function(value) {
            return parseFloat(value).toFixed(2);
        }
    },
    revert: {
        value: function(value) {
            return parseFloat(value).toFixed(2);
        }
    }

});
