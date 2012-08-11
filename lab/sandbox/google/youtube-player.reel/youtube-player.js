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

/*global require,exports,YT */
var Montage = require("montage").Montage,
    Component = require("montage/ui/component").Component;

var YoutubePlayer = exports.YoutubePlayer = Montage.create(Component, {

    // Stores a queue of function calls to make on the player in the draw
    // function
    _playerQueue: {
        enumerable: false,
        value: []
    },

    _ready: {
        enumerable: false,
        value: false
    },

    _player: {
        enumerable: false,
        value: null
    },
    player: {
        get: function() {
            return this._player;
        },
        set: function(value) {
            if (this._player !== value) {
                this._player = value;
            }
        }
    },

    _width: {
        enumerable: false,
        value: 640
    },
    width: {
        get: function() {
            return this._width;
        },
        set: function(value) {
            if (this._width !== value) {
                this._width = value;
                this.needsDraw = true;
            }
        }
    },
    _height: {
        enumerable: false,
        value: 385
    },
    height: {
        get: function() {
            return this._height;
        },
        set: function(value) {
            if (this._height !== value) {
                this._height = value;
                this.needsDraw = true;
            }
        }
    },

    _autoplay: {
        enumerable: false,
        value: false
    },
    autoplay: {
        get: function() {
            return this._autoplay;
        },
        set: function(value) {
            if (this._autoplay !== value) {
                this._autoplay = value;
                this.needsDraw = true;
            }
        }
    },

    _videoId: {
        enumerable: false,
        value: null
    },
    videoId: {
        get: function() {
            return this._videoId;
        },
        set: function(value) {
            if (this._videoId !== value) {
                // TODO handle URLs as well
                this._videoId = value;

                // If the video isn't in the playlist, clear the playlist,
                if (this._playlist && this._playlist.indexOf(value) === -1) {
                    this._playlist = null;
                }
                // TODO if the video is in the playlist use playVideoAt

                if (this._autoplay) {
                    this._playerQueue.push(["loadVideoById", value]);
                } else {
                    this._playerQueue.push(["cueVideoById", value]);
                }
                this.needsDraw = true;
            }
        }
    },

    _playlist: {
        enumerable: false,
        value: null
    },
    playlist: {
        get: function() {
            return this._playlist;
        },
        set: function(value) {
            if (this._playlist !== value) {
                this._playlist = value;

                if (this._autoplay) {
                    this._playerQueue.push(["loadPlaylist", value]);
                } else {
                    this._playerQueue.push(["cuePlaylist", value]);
                }
                this.needsDraw = true;
            }
        }
    },

    play: {
        value: function() {
            this._playerQueue.push("playVideo");
            this.needsDraw = true;
        }
    },
    pause: {
        value: function() {
            this._playerQueue.push("pauseVideo");
            this.needsDraw = true;
        }
    },
    stop: {
        value: function() {
            this._playerQueue.push("stopVideo");
            this.needsDraw = true;
        }
    },

    prepareForDraw: {
        value: function() {
            // Create the callback if it doesn't exist, and make it dispatch
            // an event on the document instead
            if (!window.onYouTubePlayerAPIReady) {
                window.onYouTubePlayerAPIReady = function() {
                    var event = document.createEvent("CustomEvent");
                    event.initEvent("youtubePlayerApiReady", true, true);
                    document.dispatchEvent(event);
                };
            }

            this._element.src +=  (this._videoId ? "/" + this._videoId : "") + "?enablejsapi=1";

            if (typeof YT !== "undefined" && YT.Player) {
                this.handleYoutubePlayerApiReady();
            } else {
                document.addEventListener("youtubePlayerApiReady", this, false);
            }
        }
    },

    handleYoutubePlayerApiReady: {
        value: function(event) {
            document.removeEventListener("youtubePlayerApiReady", this);

            var self = this;
            this.player = new YT.Player(this._element, { events: {
                onReady: function(event) {
                    self._ready = true;
                    self.needsDraw = true;
                }
            }});
        }
    },

    draw: {
        value: function() {
            if (!this._ready) {
                return;
            }

            for (var i = 0, len = this._playerQueue.length; i < len; i++) {
                var fnName, args;
                if (typeof this._playerQueue[i] === "string") {
                    fnName = this._playerQueue[i];
                    args = [];
                } else {
                    fnName = this._playerQueue[i].shift();
                    args = this._playerQueue[i];
                }

                this._player[fnName].apply(this._player, args);
            }
            this._playerQueue.length = 0;

            this._element.width = this._width;
            this._element.height = this._height;
        }
    }
});