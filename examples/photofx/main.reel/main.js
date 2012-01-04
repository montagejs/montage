/* <copyright>
Copyright (c) 2012, Motorola Mobility, Inc

All Rights Reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

  - Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
  - Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
  - Neither the name of Motorola Mobility nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
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

            var selectedPhoto = this.photoListController.getProperty("selectedObjects.0");

            if (!selectedPhoto) {
                return;
            }

            this.photoListController.removeObjects(selectedPhoto);
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
