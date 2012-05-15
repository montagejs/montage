/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
var Montage = require("montage").Montage,
    Component = require("montage/ui/component").Component;

var Media = Montage.create(Montage, {

    type: {
        value: null
    },

    description: {
        value: null
    }

});

var PhotoMedia = Montage.create(Media, {

    type: {
        value: "photo"
    },

    location: {
        value: null
    }

});

var VideoMedia = Montage.create(Media, {

    type: {
        value: "video"
    },

    duration: {
        value: null
    }

});

var SlotTest = exports.SlotTest = Montage.create(Component, {

    init: {
        value: function() {
            this.video = VideoMedia.create();
            this.video.duration = "VIDEO 81 Minutes";
            this.video.description = "VIDEO: The Last Dispatch"

            this.photo = PhotoMedia.create();
            this.photo.location = "PHOTO North Attleboro, MA";
            this.photo.description = "PHOTO Go Big Red";

            this.currentMedia = this.photo;

            this.showContent(null);

            return this;
        }
    },

    deserializedFromTemplate: {
        value: function() {
            this.init();
        }
    },

    video: {
        value: null
    },

    photo: {
      value: null
    },

    currentMedia: {
        value: null
    },

    // TODO move this into a template eventually
    hasTemplate: {
        value: false
    },

    componentWithNoElement: {
        enumerable: false,
        value: null
    },

    componentInPageWithElement: {
        enumerable: false,
        value: null
    },

    barContent: {
        enumerable: false,
        value: null
    },

    bazContent: {
        enumerable: false,
        value: null
    },

    quxContent: {
        enumerable: false,
        value: null
    },

    slot: {
        enumerable: false,
        value: null
    },

    componentWithNoElementButton: {
        enumerable: false,
        value: null
    },

    componentInPageWithElementButton: {
        enumerable: false,
        value: null
    },

    videoViewer: {
        enumerable: false,
        value: null
    },

    photoViewer: {
        enumerable: false,
        value: null
    },

    barButton: {
        enumerable: false,
        value: null
    },

    bazButton: {
        enumerable: false,
        value: null
    },

    quxButton: {
        enumerable: false,
        value: null
    },

    emptyButton: {
        enumerable: false,
        value: null
    },

    mediaButton: {
        enumerable: false,
        value: null
    },

    videoButton: {
        enumerable: false,
        value: null
    },

    photoButton: {
        enumerable: false,
        value: null
    },

    prepareForDraw: {
        enumerable: false,
        value: function() {
            this.componentWithNoElementButton.addEventListener("action", this);
            this.componentInPageWithElementButton.addEventListener("action", this);
            this.barButton.addEventListener("action", this);
            this.bazButton.addEventListener("action", this);
            this.quxButton.addEventListener("action", this);
            this.emptyButton.addEventListener("action", this);

            this.videoButton.addEventListener("action", this);
            this.photoButton.addEventListener("action", this);
        }
    },

    handleComponentWithNoElementButtonAction: {
        enumerable: false,
        value: function() {
            this.showContent(this.componentWithNoElement);
        }
    },

    handleComponentInPageWithElementButtonAction: {
        enumerable: false,
        value: function() {
            this.showContent(this.componentInPageWithElement);
        }
    },

    handleVideoButtonAction: {
        enumerable: false,
        value: function() {
            this.currentMedia = this.video;
            this.showContent(this.videoViewer);
        }
    },

    handlePhotoButtonAction: {
        enumerable: false,
        value: function() {
            this.currentMedia = this.photo;
            this.showContent(this.photoViewer);
        }
    },

    handleBarButtonAction: {
        enumerable: false,
        value: function() {
            this.showContent(this.barContent);
        }
    },

    handleBazButtonAction: {
        enumerable: false,
        value: function() {
            this.showContent(this.bazContent);
        }
    },

    handleQuxButtonAction: {
        enumerable: false,
        value: function() {
            this.showContent(this.quxContent);
        }
    },

    handleEmptyButtonAction: {
        enumerable: false,
        value: function() {
            this.showContent(null);
        }
    },

    showContent: {
        enumerable: false,
        value: function(content) {
            console.log("chooser showContent:", content);
            this.slot.content = content;
        }
    }

});
