/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
var Montage = require("montage").Montage,
Converter = require("montage/core/converter/converter").Converter;

exports.ObjectToJsonConverter = Montage.create(Converter, {

    // convert an Object to JSON string
    convert: {
        value: function(value) {
            if(value) {
                return JSON.stringify(value);
            }
            return '';
        }
    },

    // json string to object
    revert: {
        value: function(value) {
            if(value) {
                return JSON.parse(value);
            }
        }
    }

});
