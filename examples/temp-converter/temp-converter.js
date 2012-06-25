/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2012 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
var Montage = require("montage").Montage,
Converter = require("montage/core/converter/converter").Converter;

exports.TempConverter = Montage.create(Converter, {

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
