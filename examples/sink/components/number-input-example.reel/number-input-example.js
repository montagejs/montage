/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
var Montage = require("montage/core/core").Montage,
    Component = require("montage/ui/component").Component,
    Converter = require("montage/core/converter/converter").Converter;

/* Custom converter to convert from Celsius to Fahrenheit and vice-versa */
exports.TempConverter = Montage.create(Converter, {

    allowPartialConversion: {
        value: true
    },

    // convert fahrenheit to celsius (showing our non-metric heritage here)
    convert: {
        value: function(value) {
            value = parseInt(value, 10);
            if(!isNaN(value)) {
                return ((value - 32) / 1.8).toFixed(2);
            }
            return null;
        }
    },

    // revert celsius to fahrenheit
    revert: {
        value: function(value) {
            value = parseInt(value, 10);
            if(!isNaN(value)) {
                return ((1.8 * value) + 32).toFixed(2);
            }
            return null;
        }
    }

});

exports.NumberInputExample = Montage.create(Component, {
    prepareForDraw: {
        value: function() {
            // Invoke Google pretty printer on source code samples
            prettyPrint();
        }
    },

    logger: {
        value: null,
        serializable: true
    }
});
