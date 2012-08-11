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

/*global require,exports*/
var Montage = require("montage").Montage,
    Component = require("montage/ui/component").Component,
    Uuid = require("montage/core/uuid");

var YoutubeChannel = exports.YoutubeChannel = Montage.create(Component, {


    _userRe: {
        value: /youtube.com\/(user\/)?([a-z0-9]+)/i
    },

    imageA: {
        value: null
    },

    imageB: {
        value: null
    },

    imageC: {
        value: null
    },

    _popupElement: {
        value: null
    },

    _shouldShowPopup: {
        value: false
    },

    _channelUrl: {
        value: null
    },

    channelUrl: {
        depends: ["channel"],
        get: function() {
            return this._channelUrl;
        },
        set: function(value, fromChannel) {
            if (this._channelUrl !== value) {
                this._channelUrl = value;

                // prevent infinite loop
                if (!fromChannel) {
                    var match = this._userRe.exec(value);
                    if (match && match[2]) {
                        Object.getPropertyDescriptor(this, "channel").set.call(this, match[2], true);
                    }
                }
            }
        }
    },

    _channel: {
        enumerable: false,
        value: null
    },
    channel: {
        get: function() {
            return this._channel;
        },
        set: function(value, fromUrl) {
            if (this._channel !== value) {
                this._channel = value;

                // prevent infinite loop
                if (!fromUrl) {
                    Object.getPropertyDescriptor(this, "channelUrl").set.call(this, "http://www.youtube.com/user/" + value, true);
                }

                this._loadChannel();
            }
        }
    },

    _loadChannel: {
        enumerable: false,
        value: function() {
            var self = this;

            var callbackName = "scriptCallback" + Uuid.generate().replace(/-/g, "_");

            window[callbackName] = function(data) {
                self.handleData(data);
                delete window[callbackName];
            };

            // create url
            var url = "http://gdata.youtube.com/feeds/api/users/" + this._channel + "/uploads?v=2&alt=json-in-script&callback=" + callbackName;

            this._script = document.createElement("script");
            this._script.src = url;
            this.needsDraw = true;
        }
    },

    _script: {
        enumerable: false,
        value: null
    },

    prepareForDraw: {
        value: function() {
            this.imageA.element.addEventListener("click", this, false);
            this.imageB.element.addEventListener("click", this, false);
            this.imageC.element.addEventListener("click", this, false);

            this._positionPopup();


        }
    },

    draw: {
        value: function() {
            var self = this;

            if (this._script) {
                this.element.appendChild(this._script);
                this._script = null;
            }

            if (this._entries) {
                this.imageA.src = (this._entries[0]) ? this._entries[0]["media$group"]["media$thumbnail"][0].url : "";
                this.imageB.src = (this._entries[1]) ? this._entries[1]["media$group"]["media$thumbnail"][0].url : "";
                this.imageC.src = (this._entries[2]) ? this._entries[2]["media$group"]["media$thumbnail"][0].url : "";
            }

            if (this._videoId) {
                this.player.videoId = this._videoId;
                this._videoId = null;
            }

            if (this._shouldShowPopup) {
                this._positionPopup();

                // Need the video to be on top
                this.element.style.zIndex = 9000;

                // Fix for Canary where the thumbnail in the video doesn't
                // change until the CSS transition has finished, so wait for
                // it to change before starting the animation
                window.setTimeout(function() {
                    self._element.classList.add("show");
                    self._popupElement.classList.add("show");
                }, 50);
                if (window.Touch) {
                    document.addEventListener('touchstart', this, false);
                } else {
                    document.addEventListener('mousedown', this, false);
                    document.addEventListener('keyup', this, false);
                }
            } else {
                this.element.classList.remove("show");
                this._popupElement.classList.remove("show");
                this.player.stop();

                if (window.Touch) {
                    document.removeEventListener('touchstart', this);
                } else {
                    document.removeEventListener('mousedown', this);
                    document.removeEventListener('keyup', this);
                }

                // take the video from the top only once it's stopped animating
                window.setTimeout(function() {
                    self._element.style.zIndex = null;
                    // HACK: Trigger a redraw so that Flash in Chrome on
                    // Windows doesn't remain rendered on top of everything,
                    // despite actually being hidden
                    self.player.element.getBoundingClientRect();
                }, 510);
            }

        }
    },

    _entries: {
        enumerable: false,
        value: null
    },

    _positionPopup: {
        value: function() {
            var doc = this._element.ownerDocument;

            this._popupElement.style.width = doc.width + "px";
            this.player.width = doc.width;
            this.player.height = doc.height;

            // // Chrome
            // viewport.insertBefore(this._popupElement, viewport.firstChild);
            // this._popupElement.style.top = viewport.offsetTop;
            // this._popupElement.style.left = viewport.offsetLeft;

            var computedStyle = window.getComputedStyle(doc.body);

            // Canary
            // remove the body margin
            this._popupElement.style.top =  - (this._element.offsetTop || 0) - parseInt(computedStyle.marginTop, 10) + 'px';
            this._popupElement.style.left = - (this._element.offsetLeft || 0) - parseInt(computedStyle.marginLeft, 10) + 'px';
        }
    },

    handleClick: {
        value: function(event) {
            switch(event.target.dataset.montageId) {
                case "imageA":
                    this._videoId = this._entries[0]["media$group"]["yt$videoid"]["$t"];
                    break;
                case "imageB":
                    this._videoId = this._entries[1]["media$group"]["yt$videoid"]["$t"];
                    break;
                case "imageC":
                    this._videoId = this._entries[2]["media$group"]["yt$videoid"]["$t"];
                    break;
            }
            this._shouldShowPopup = true;
            this.needsDraw = true;
        }
    },

    handleTouchStart: {
        value: function(event) {
            this._shouldShowPopup = false;
            this.needsDraw = true;
        }
    },
    handleMousedown: {
        value: function(event) {
            if (event.button === 0) {
                this._shouldShowPopup = false;
                this.needsDraw = true;
            }
        }
    },
    handleKeyup: {
        value: function(event) {
            this._shouldShowPopup = false;
            this.needsDraw = true;
        }
    },

    handleData: {
        value: function(data) {
            this._entries = data.feed.entry || [];
            this.needsDraw = true;
        }
    },

    serializeProperties: {
        value: function(serializer) {
            serializer.set("element", this.element);
            serializer.set("channelUrl", this.channelUrl);
            serializer.set("channel", this.channel);
        }
    }
});