/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2012 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
var Montage = require("montage").Montage;
var Component = require("montage/ui/component").Component;

exports.SearchResult = Montage.create(Component, {

    photoListController: {
        value: null,
        serializable: true
    },

    result: {
        value: null,
        serializable: true
    },

    resultAlreadyImported: {
        dependencies: ["result", "photoListController.content.count()"],
        get: function() {

            if (!this.result || !this.photoListController) {
                return false;
            }

            var importedIdList = this.photoListController.content.getProperty("id");
            return importedIdList.indexOf(this.result.gphoto$id.$t) >= 0;
        }
    },

    addPhotoAction: {
        value: function() {

            if (this.resultAlreadyImported) {
                return;
            }

            var result = this.result,
                photo;

            // TODO preserve all the original picasa data
            photo = {
                id: result.gphoto$id.$t,
                src: result.content.src,
                thumbnailSrc: result.getProperty("media$group.media$thumbnail.0.url"),
                link: result.id.$t,
                title: result.title.$t,
                source: "Picasa",
                authors: [result.author[0].gphoto$nickname.$t]
            }

            this.photoListController.addObjects(photo);
        }
    }


});

var Converter = require("montage/core/converter/converter").Converter;

exports.ActionSwitchValueConverter = Montage.create(Converter, {

    convert: {
        value: function(value) {
            return value ? "oldPhoto" : "newPhoto";
        }
    }

});
