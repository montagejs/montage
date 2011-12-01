/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
var Montage = require("montage").Montage,
    Component = require("montage/ui/component").Component;

var PhotoViewer = exports.PhotoViewer = Montage.create(Component, {

    templateDidLoad: {
        value: function() {
            console.log("PHOTOVIEWER REEL DID LOAD");
        }
    },

    deserializedFromTemplate: {
        value: function() {
            console.log("PHOTOVIEWER DESERIALIZED FROM REEL");
        }
    },

    photo: {
        enumerable: false,
        value: null
    }

});

