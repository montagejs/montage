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

exports.FeedReader = Montage.create(Component, {

    _apiLoaded: {
        value: false
    },

    didCreate: {
        value: function() {
            var self = this;
            var apiInit = function() {
                google.load("feeds", "1", {
                    callback: function() {
                        self._apiLoaded = true;
                        self.feedURL = self._feedURL;
                        self.needsDraw = true;
                        window.initGoogleAPI = null;
                    }
                });
            };

            // set up a global function
            window.initGoogleAPI = apiInit;
        }
    },

    _feedURL: {value: null},
    feedURL: {
        serializable: true,
        get: function() {
            return this._feedURL;
        },
        set: function(value) {
            this._feedURL = value;
            // execute the search and get the entries
            if (this._apiLoaded) {
                this._fetchFeed();
            }
        }
    },

    // time in ms between slides
    interval: {value: 3, distinct: true},

    maxEntries: {value: 10, distinct: true},

    entries: {value: null},

    _feedDisplayMode: {value: null},
    feedDisplayMode: {
        serializable: true,
        get: function() {
            return this._feedDisplayMode;
        },
        set: function(value) {

            this.removeEntryAnimation();
            this._feedDisplayMode = value;

            this.addEntryAnimation();
        }
    },


    feedEntryTimer: {enumerable: false, value: null},


    activeFeedEntry: {value: null},
    _activeIndex: {value: null},
    activeIndex: {
        get: function() {
            return this._activeIndex || 0;
        },
        set: function(index) {
            if(this.entries) {
                var max = this.entries.length-1;
                if(index > max) {
                    index = 0;
                }
                if(index < 0) {
                    index = 0;
                }
                this._activeIndex = index;
                this.activeFeedEntry = this.entries[this._activeIndex];
            } else {
                this._activeIndex = 0;
            }
        }
    },

    _fetchFeed: {
        value: function() {

            var url = this.feedURL;
            var feed = new google.feeds.Feed(url);
            feed.setNumEntries(10);

            var self = this;
            self.entries = [];

            feed.load(function(result) {
                self.removeEntryAnimation();
                if(result.error) {
                    self.entries = [];
                } else {
                    //console.log('entries: ', result.feed.entries);
                    self.addEntryAnimation();
                    self.entries = result.feed.entries;
                    self.activeIndex = 0;

                }


            });
        }
    },

    addEntryAnimation: {
        value: function() {
            var self = this;
            if("animation" == this.feedDisplayMode) {
                this.element.addEventListener('webkitAnimationStart', this);
                this.element.addEventListener('webkitAnimationIteration', this);
                this.element.addEventListener('webkitAnimationEnd', this);
            } else {
                // timer
                this.feedEntryTimer = setInterval(function() {
                    self.activeIndex = self.activeIndex + 1;
                }, (this.interval * 1000));
            }
        }
    },

    removeEntryAnimation: {
        value: function() {
            if("animation" == this.feedDisplayMode) {
                this.element.removeEventListener('webkitAnimationStart', this);
                this.element.removeEventListener('webkitAnimationIteration', this);
                this.element.removeEventListener('webkitAnimationEnd', this);

            } else {
                if(this.feedEntryTimer) {
                    window.clearInterval(this.feedEntryTimer);
                }
            }
        }
    },

    handleWebkitAnimationStart: {
        value: function() {
            console.log('animation start');
        }
    },

    handleWebkitAnimationIteration: {
        value: function() {
           console.log('animation iteration');
           this.activeIndex = this.activeIndex + 1;
       }
   },

   handleWebkitAnimationEnd: {
       value: function() {
           console.log('animation end');
       }
    },

    prepareForDraw: {
        value: function() {
        }
    },

    draw: {
        value: function() {

        }
    },

    serializeProperties: {
        value: function(serializer) {
            serializer.set("element", this.element);
            serializer.set("feedURL", this.feedURL);
            serializer.set("feedDisplayMode", this.feedDisplayMode);
        }
    }

});
