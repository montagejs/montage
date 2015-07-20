var Montage = require("montage").Montage,
    Component = require("montage/ui/component").Component;

exports.Main = Component.specialize(/** @lends Main# */ {
    constructor: {
        value: function Main() {
            this.super();
        }
    }

});

var Media = Montage.specialize( {

    type: {
        value: null
    },

    description: {
        value: null
    }

});

var PhotoMedia = Media.specialize( {

    type: {
        value: "photo"
    },

    location: {
        value: null
    }

});

var VideoMedia = Media.specialize( {

    type: {
        value: "video"
    },

    duration: {
        value: null
    }

});

var SlotTest = exports.SlotTest = Component.specialize( {

    init: {
        value: function () {
            this.video = new VideoMedia();
            this.video.duration = "VIDEO 81 Minutes";
            this.video.description = "VIDEO: The Last Dispatch"

            this.photo = new PhotoMedia();
            this.photo.location = "PHOTO North Attleboro, MA";
            this.photo.description = "PHOTO Go Big Red";

            this.currentMedia = this.photo;

            this.showContent(null);

            return this;
        }
    },

    deserializedFromTemplate: {
        value: function () {
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

    hasTemplate: {
        value: true
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

    enterDocument: {
        enumerable: false,
        value: function (firstTime) {
            if (firstTime) {
                this.componentWithNoElementButton.addEventListener("action", this);
                this.componentInPageWithElementButton.addEventListener("action", this);
                this.barButton.addEventListener("action", this);
                this.bazButton.addEventListener("action", this);
                this.quxButton.addEventListener("action", this);
                this.emptyButton.addEventListener("action", this);

                this.videoButton.addEventListener("action", this);
                this.photoButton.addEventListener("action", this);
            }
        }
    },

    handleComponentWithNoElementButtonPress: {
        enumerable: false,
        value: function () {
            this.showContent(this.componentWithNoElement);
        }
    },

    handleComponentInPageWithElementButtonPress: {
        enumerable: false,
        value: function () {
            this.showContent(this.componentInPageWithElement);
        }
    },

    handleVideoButtonPress: {
        enumerable: false,
        value: function () {
            this.currentMedia = this.video;
            this.showContent(this.videoViewer);
        }
    },

    handlePhotoButtonPress: {
        enumerable: false,
        value: function () {
            this.currentMedia = this.photo;
            this.showContent(this.photoViewer);
        }
    },

    handleBarButtonPress: {
        enumerable: false,
        value: function () {
            this.showContent(this.barContent);
        }
    },

    handleBazButtonPress: {
        enumerable: false,
        value: function () {
            this.showContent(this.bazContent);
        }
    },

    handleQuxButtonPress: {
        enumerable: false,
        value: function () {
            this.showContent(this.quxContent);
        }
    },

    handleEmptyButtonPress: {
        enumerable: false,
        value: function () {
            this.showContent(null);
        }
    },

    showContent: {
        enumerable: false,
        value: function (content) {
            //console.log("chooser showContent:", content);
            this.slot.content = content;
        }
    }

});

