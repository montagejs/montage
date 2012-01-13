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
    UndoManager = require("montage/core/undo-manager").UndoManager,
    LOCAL_STORAGE_KEY = "montage_photofx_state",
    CORS_TEST_IMAGE = "https://lh5.googleusercontent.com/-M9uCIhQjy3c/TwTSfmO6MlI/AAAAAAAAFcw/BIMvbz3a7Z4/s1/blank.jpg";

exports.Main = Montage.create(Component, {

    supportsCrossOriginCanvas: {
        value: null
    },

    didCreate: {
        value: function() {
            this.undoManager = document.application.undoManager = UndoManager.create();

            this._testCrossOriginCanvas();
            this._loadPhotos();
        }
    },

    _loadPhotos: {
        enumerable: false,
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

    _testCrossOriginCanvas: {
        enumerable: false,
        value: function() {

            var corsImage,
                corsCanvas,
                corsContext,
                self = this;

            corsImage = document.createElement("img");
            corsImage.crossOrigin = "";
            corsImage.src = CORS_TEST_IMAGE;

            corsImage.onload = function() {
                corsCanvas = document.createElement("canvas");
                corsContext = corsCanvas.getContext("2d");
                corsContext.drawImage(corsImage, 0, 0, 1, 1);
                try {
                    corsContext.getImageData(0, 0, 1, 1);
                    self.supportsCrossOriginCanvas = true;
                } catch(e) {
                    if (18 === e.code) {
                        self.supportsCrossOriginCanvas = false;
                    } else {
                        throw e;
                    }
                }
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

            document.addEventListener("mousedown", this, false);

            window.addEventListener('beforeunload', this, false);

            this.element.addEventListener("dragenter", this, false);
            this.element.addEventListener("dragleave", this, false);
            this.element.addEventListener("dragover", this, false);
            this.element.addEventListener("drop", this, false);
            this.element.addEventListener("dragend", this, false);

            if (window.Touch) {
                this.element.classList.add("touch");
            }
        }
    },

    handleMousedown: {
        value: function(evt) {
            if (evt.button === 1) {
                this.handleToggleShowControlsButtonAction();
            }
        }
    },

    handleToggleShowControlsButtonAction: {
        value: function() {
            this.showControls = !this.showControls;
        }
    },

    _showControls: {
        enumerable: false,
        value: true
    },

    showControls: {
        get: function() {
            return this._showControls;
        },
        set: function(value) {
            if (value === this._showControls) {
                return;
            }
            this._showControls = value;
            this.needsDraw = true;
        }
    },

    handleDragenter: {
        value: function(evt) {
            if (evt.dataTransfer.types.indexOf("Files") >= 0) {
                this.willingToAcceptDrop = true;
            } else {
                evt.dataTransfer.effectAllowed = "none";
                evt.dataTransfer.dropEffect = "none";
            }
        }
    },

    handleDragleave: {
        value: function(evt) {
            this.willingToAcceptDrop = false;
        }
    },

    handleDragover: {
        value: function(evt) {
            evt.preventDefault(); //TODO this may be unnecessary, tutorial says we need ti to prevent redirecting
        }
    },

    handleDrop: {
        value: function(evt) {
            evt.stopPropagation(); // TODO this may be unnecessary, same as above, but I'd guess preventDefault would stop the browser from...doing the default action
            evt.preventDefault();

            if (!this.willingToAcceptDrop) {
                // Don't bother processing this if we don't handle it
                // that said we still wanted to preventDefaults so we act more like a native application
                // and don't simply let the browser handle opening the dropped content
                return;
            }

            var files = evt.dataTransfer.files,
                i,
                iFile;

            for (i = 0; iFile = files[i]; i++) {

                if (!iFile.type.match(/image.*/)) {
                    continue;
                }

                var reader = new FileReader();

                reader.onload =  (function(self, file) {
                    return function(evt) {

                        var photo = {
                            src: evt.target.result,
                            title: file.name
                        }
                        self.photoListController.addObjects(photo);

                    };
                })(this, iFile);

                reader.readAsDataURL(iFile);
            }
        }
    },

    handleDragend: {
        value: function(evt) {
            this.willingToAcceptDrop = false;
        }
    },

    _willingToAcceptDrop: {
        enumerable: false,
        value: false
    },

    willingToAcceptDrop: {
        get: function() {
            return this._willingToAcceptDrop;
        },
        set: function(value) {
            if (value === this._willingToAcceptDrop) {
                return;
            }
            this._willingToAcceptDrop = value;
            this.needsDraw = true;
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

    handleAddPhotosButtonAction: {
        value: function() {

            // Guard against adding cross-origin photos if we'll never be able to edit them
            if (!this.supportsCrossOriginCanvas) {
                return;
            }

            var popup = this.searchPopup;

            if(!popup) {
                popup = Popup.create();
                popup.content = this.searchPanel;
                this.searchPopup = popup;
            }

            popup.show();
        }
    },

    handleRemovePhotoButtonAction: {
        value: function() {

            // Guard against removing photos if we'll never be able to add more
            if (!this.supportsCrossOriginCanvas) {
                return;
            }

            var selectedPhoto = this.photoListController.getProperty("selectedObjects.0");

            if (!selectedPhoto) {
                return;
            }

            var index = this.photoListController.content.indexOf(selectedPhoto);
            this.removePhotoAtIndex(index);
        }
    },

    handleUndoButtonAction: {
        value: function() {
            this.undoManager.undo();
        }
    },

    handleRedoButtonAction: {
        value: function() {
            this.undoManager.redo();
        }
    },

    removePhotoAtIndex: {
        value: function(index) {

            var photo = this.photoListController.content[index];
            var undoLabel = 'remove photo "' + photo.title + '"';

            this.undoManager.add(undoLabel, this.addPhotoAtIndex, this, photo, index);

            this.photoListController.removeObjects(photo);
        }
    },

    addPhotoAtIndex: {
        value: function(photo, index) {

            var undoLabel = 'add photo "' + photo.title + '"';

            this.undoManager.add(undoLabel, this.removePhotoAtIndex, this, index);

            this.photoListController.content.splice(index, 0, photo);
            this.photoListController.selectedObjects = [photo];
        }
    },

    draw: {
        value: function() {
            if (this.showControls) {
                this.element.classList.add("showControls");
            } else {
                this.element.classList.remove("showControls");
            }

            if (this.willingToAcceptDrop) {
                this.element.classList.add("acceptsDrop");
            } else {
                this.element.classList.remove("acceptsDrop");
            }
        }
    }

});
