
/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
var Montage = require("montage").Montage;
var Component = require("montage/ui/component").Component;
var Popup = require("montage/ui/popup/popup.reel").Popup;

exports.Main = Montage.create(Component, {

    photos: {
        value: ["images/IMG_1337.jpg",
                "images/IMG_1375.jpg",
                "images/IMG_1414.jpg",
                "images/IMG_1416.jpg"],
        distinct: true
    },

    photoListController: {
        enumerable: false,
        value: null
    },

    prepareForDraw: {
        value: function() {
            if (window.Touch) {
                this.element.classList.add("touch");
            }
        }
    },

    searchPanel: {
        enumerable: false,
        value: null
    },

    searchPopup: {
        enumerable: false,
        value: null
    },

    addPhotosAction: {
        value: function() {
            var popup = this.searchPopup;

            if(!popup) {
                popup = Popup.create();
                popup.content = this.searchPanel;
                this.searchPopup = popup;

                this.searchPanel.addEventListener('addphoto', this, false);
            }

            popup.show();
        }
    },

    removePhotoAction: {
        value: function() {

            var selectedPhoto = this.photoListController.getProperty("selectedObjects.0");

            if (!selectedPhoto) {
                return;
            }

            this.photoListController.removeObjects(selectedPhoto);
        }
    },

    handleAddphoto: {
        value: function(evt) {
            this.photoListController.addObjects(evt.detail.photo.src);
        }
    }

});
