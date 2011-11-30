/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
var Montage = require("montage").Montage,
    Component = require("montage/ui/component").Component,
    Popup = require("montage/ui/popup/popup.reel").Popup,
    Serializer = require("montage/core/serializer").Serializer,
    Deserializer = require("montage/core/deserializer").Deserializer,
    LOCAL_STORAGE_KEY = "montage_photofx_state";

exports.Main = Montage.create(Component, {

    templateDidLoad: {
        value: function() {
            var stateSerialization,
                deserializer,
                self;

            if (localStorage) {
                stateSerialization = localStorage.getItem(LOCAL_STORAGE_KEY);

                if (stateSerialization) {
                    deserializer = Deserializer.create();
                    self = this;

                    try {

                        deserializer.initWithStringAndRequire(stateSerialization, require).deserializeObject(function(savedState) {
                            self.photos = savedState.photos;
                        }, require);

                    } catch(e) {
                        console.error("Could not load saved state.");
                        console.debug("Could not deserialize", stateSerialization);
                        console.log(e.stack);
                    }
                }
            }

            // Restore default images if there are no photos and we didn't have a serialization
            if (!this.photos && !stateSerialization) {
                this.photos = [
                    {src: "images/IMG_1337.jpg", title: "Piston", authors: ["mike"]},
                    {src: "images/IMG_1375.jpg", title: "Big Sky", authors: ["mike"]},
                    {src: "images/IMG_1414.jpg", title: "5771", authors: ["mike"]},
                    {src: "images/IMG_1416.jpg", title: "Horizon", authors: ["mike"]}
                ];
            }

        }
    },

    photos: {
        value: null
    },

    photoListController: {
        enumerable: false,
        value: null
    },

    prepareForDraw: {
        value: function() {

            this.application.addEventListener('addphoto', this, false);
            window.addEventListener('beforeunload', this, false);

            if (window.Touch) {
                this.element.classList.add("touch");
            }
        }
    },

    handleBeforeunload: {
        value: function() {
            this.saveState();
        }
    },

    saveState: {
        value: function() {

            if (!localStorage) {
                return;
            }

            var savedState = {
                photos: this.photos
            };

            var serializer = Serializer.create().initWithRequire(require);
            localStorage.setItem(LOCAL_STORAGE_KEY, serializer.serializeObject(savedState));
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
            this.photoListController.addObjects(evt.detail.photo);
        }
    }

});
