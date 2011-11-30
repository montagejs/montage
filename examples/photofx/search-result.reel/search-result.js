/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
var Montage = require("montage").Montage;
var Component = require("montage/ui/component").Component;

exports.SearchResult = Montage.create(Component, {

    result: {
        enumerable: false,
        value: null
    },

    addPhotoAction: {
        enumerable: false,
        value: function(evt) {
            var photo = this.result;

            var addPhotoEvent = document.createEvent("CustomEvent");
            addPhotoEvent.initCustomEvent("addphoto", true, true, {
                photo: {
                    src: photo.content.src,
                    link: photo.id.$t,
                    title: photo.title.$t,
                    source: "Picasa",
                    authors: [photo.author[0].gphoto$nickname.$t]
                }
            });
            addPhotoEvent.type = "addphoto";
            this.application.dispatchEvent(addPhotoEvent);
        }
    }


});
