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

var Montage = require("montage/core/core").Montage,
    Component = require("montage/ui/component").Component;

exports.Main = Montage.create(Component, {
    camera: {
        value: null
    },

    flash: {
        value: null
    },

    doFlash: {
        value: true
    },

    countdown: {
        value: null
    },

    gallery: {
        value: null
    },

    filterGallery: {
        value: null
    },

    filters: {
        value: [],
        distinct: true
    },

    snapshotController: {
        value: null
    },

    handleSnapshotAction: {
        value: function() {
            this.countdownSnapshot();
        }
    },

    handleNextFilterAction: {
        value: function() {
            this.camera.useNextFilter();
        }
    },

    handlePrevFilterAction: {
        value: function() {
            this.camera.usePrevFilter();
        }
    },

    handleFiltersloaded: {
        value: function() {
            this.filterGallery.filterController.selectedObjects = this.camera.filters[0];
        }
    },

    countdownSnapshot: {
        value: function() {
            var self = this;

            if(!this.doFlash) {
                self.takeSnapshot();
                return;
            }

            // Yes, yes, I know. Drawing shouldn't be done here.
            // It's a demo. Deal with it.
            self.flash.classList.add("showCountdown");
            self.countdown.value = "3";
            setTimeout(function() {
                self.countdown.value = "2";
                setTimeout(function() {
                    self.countdown.value = "1";
                    setTimeout(function() {
                        self.countdown.value = "";
                        self.flash.classList.remove("showCountdown");
                        // Flash the screen
                        self.flash.classList.add("flash");
                        setTimeout(function() {
                            self.takeSnapshot();
                            self.flash.classList.remove("flash");
                        }, 500);
                    }, 1000);
                }, 1000);
            }, 1000);
        }
    },

    takeSnapshot: {
        value: function() {
            var src = this.camera.getSnapshotURL();
            this.gallery.addSnapshot(src);
        }
    },

    templateDidLoad: {
        value: function() {
            var self = this;

            this.camera.addPropertyChangeListener("filterIndex", function() {
                self.filterSelect.element.selectedIndex = self.camera.filterIndex;
            }, false);
        }
    }
});
