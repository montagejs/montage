/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
var Montage = require("montage").Montage,
    Converter = require("montage/core/converter/converter").Converter;

exports.MarkAllReadValueConverter = Montage.create(Converter, {

    convert: {
        value: function(unfinishedTasks) {

            if (!unfinishedTasks) {
                return "";
            }

            if (0 === unfinishedTasks.length) {
                return "Mark all as incomplete";
            } else {
                return "Mark all as complete";
            }
        }
    }

});
