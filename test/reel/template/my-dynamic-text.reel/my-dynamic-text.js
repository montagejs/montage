/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
exports = typeof exports !== "undefined" ? exports : {};

var Montage = require("montage").Montage;
var DynamicText = require("montage/ui/dynamic-text.reel").DynamicText;

var MyDynamicText = exports.MyDynamicText = Montage.create(DynamicText, {
    didDeserializedFromTemplate: {
        value: false
    },
    deserializedFromTemplate: {
        value: function() {
            this.didDeserializedFromTemplate = true;
        }
    }
});
