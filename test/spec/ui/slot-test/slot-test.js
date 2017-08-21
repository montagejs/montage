/* <copyright>
Copyright (c) 2012, Motorola Mobility LLC.
All Rights Reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

* Redistributions of source code must retain the above copyright notice,
  this list of conditions and the following disclaimer.

* Redistributions in binary form must reproduce the above copyright notice,
  this list of conditions and the following disclaimer in the documentation
  and/or other materials provided with the distribution.

* Neither the name of Motorola Mobility LLC nor the names of its
  contributors may be used to endorse or promote products derived from this
  software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE
LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
POSSIBILITY OF SUCH DAMAGE.
</copyright> */
var Montage = require("montage").Montage,
    Component = require("montage/ui/component").Component;

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
