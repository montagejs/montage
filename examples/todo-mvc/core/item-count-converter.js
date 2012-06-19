/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2012 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
var Montage = require("montage").Montage,
    Converter = require("montage/core/converter/converter").Converter;

exports.ItemCountConverter = Montage.create(Converter, {

    convert: {
        value: function(itemCount) {

            if (1 === itemCount) {
                return "1 item";
            } else {
                return  itemCount + " items";
            }
        }
    }

});
