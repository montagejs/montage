/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
var Montage = require("montage").Montage;
var Converter = require("montage/core/converter/converter").Converter;

exports.ValidNumberConverter = Montage.create(Converter, {

    convert: {
        value: function(value) {
            // TODO accept only numbers within the range
            return 0 === value ? true : !!value;
        }
    }

});
