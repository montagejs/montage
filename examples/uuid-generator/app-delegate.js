/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2012 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
var Montage = require("montage").Montage;
var Uuid = require("montage/core/uuid").Uuid;

exports.AppDelegate = Montage.create(Montage, {

    uuids: {
        enumerable: false,
        value: null
    },

    deserializedFromTemplate: {
        enumerable: false,
        value: function() {
            this.uuids = [];

        }
    },


    handleGenerateUUIDAction: {
        enumerable: false,
        value: function(event) {
            this.uuids.push(Uuid.generate());
        }
    }


});
