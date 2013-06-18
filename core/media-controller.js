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
/**
	@module montage/ui/controller/media-controller
    @requires montage/core/core
    @requires montage/ui/component
    @requires montage/core/logger
*/
var Montage = require("montage").Montage;
var Target = require("core/target").Target;
var logger = require("core/logger").logger("mediacontroller");
/**
 @class MediaController
 @classdesc Controls an audio/video media player.
 @extends Montage

 */
var MediaController = exports.MediaController = Target.specialize( /** @lends MediaController# */ {
    /*-----------------------------------------------------------------------------
     MARK:   Constants
     -----------------------------------------------------------------------------*/
    /**
        @type {Property}
        @default {Number} 0
    */
    STOPPED: { enumerable: true, value: 0, writable: false },
    /**
        @type {Property}
        @default {Number} 1
    */
    PLAYING: { enumerable: true, value: 1, writable: false },
    /**
        @type {Property}
        @default {Number} 2
    */
    PAUSED:  { enumerable: true, value: 2, writable: false },
    /**
        @type {Property}
        @default {Number} 3
    */
    EMPTY:   { enumerable: true, value: 3, writable: false },
/**
  @private
*/
    _TIMEUPDATE_FREQUENCY: { value: 0.25   },  // Don't refresh too often.
    /*-----------------------------------------------------------------------------
     MARK:   Properties
     -----------------------------------------------------------------------------*/
/**
  @private
*/
    _mediaElement: {
        value: null,
        enumerable: false
    },
 /**
        @type {Function}
        @default null
    */
    mediaElement: {
        get : function() {
            return this._mediaElement;
        },
        set : function(elem) {
            this._mediaElement = elem;
        },
        enumerable: false
    },
/**
  @private
*/
    _mediaSrc: {
        value: null,
        enumerable: false
    },
/**
        @type {Function}
        @default null
    */
    mediaSrc: {
        get: function() {
            return this._mediaSrc;
        },
        set: function(mediaSrc) {
            this._mediaSrc = mediaSrc;
        }
    },

    /**
      @private
    */
    _posterSrc: {
        value: null
    },
    /**
     * @type {String}
     * @default null
     */
    posterSrc: {
        get: function() {
            return this._posterSrc;
        },
        set: function(posterSrc) {
            this._posterSrc = posterSrc;
        }
    },

    /*-----------------------------------------------------------------------------
     MARK:   Status & Attributes
     -----------------------------------------------------------------------------*/
/**
  @private
*/
    _status: {
        enumerable: false,
        value: 3
    },
 /**
        @type {Function}
        @default {Number} 3
    */
    status: {
        enumerable: false,
        get: function() {
            return this._status;
        },
        set: function(status) {
            if (status !== this._status) {
                this._status = status;
                this._dispatchStateChangeEvent();
            }
        }
    },
/**
  @private
*/
    _position: { value:null, enumerable:false },

/**
        @type {Function}
        @default null
    */
    position: {
        set: function(time, shouldNotUpdate) {
            this._position = time;
            if (!shouldNotUpdate) {
                this.currentTime = time;
            }
        },
        get: function() {
            return this._position;
        }
    },
/**
  @private
*/
    _duration: { value: null, enumerable:false },
/**
        @type {Function}
        @default null
    */
    duration: {
        set: function(time) {
            if (isNaN(time)) {
                if (logger.isDebug) {
                    logger.debug("MediaController:setDuration: duration is not valid");
                }
                return;
            }
            if (logger.isDebug) {
                logger.debug("MediaController:setDuration: duration=" + time);
            }
            this._duration = time;
        },
        get: function() {
            return this._duration;
        }
    },
    /*-----------------------------------------------------------------------------
     MARK:   Media Player Commands
     -----------------------------------------------------------------------------*/
/**
        @type {Property}
        @default {Boolean} true
    */
    autoplay: {
        enumerable: false,
        value: true
    },
/**
    @function
    */
    play: {
        value: function() {
            if (logger.isDebug) {
                logger.debug("MediaController:play()");
            }
            this.mediaElement.play();
        }
    },
/**
    @function
    */
    pause: {
        value: function() {
            if (logger.isDebug) {
                logger.debug("MediaController:pause()");
            }
            this.mediaElement.pause();
        }
    },
/**
    @function
    @returns {Boolean} !playing (true if it is now playing)
    */
    playPause: {
        value: function() {
            if (logger.isDebug) {
                logger.debug("MediaController:playPause");
            }

            var playing = (this.status === this.PLAYING);
            this.playbackRate = this.mediaElement.defaultPlaybackRate;
            if (playing) {
                this.pause();
            } else {
                this.play();
            }
            return !playing;    // true if it is now playing
        }
    },
/**
  @private
*/
    _playbackRate: {
        value: 1,
        enumerable: false
    },
/**
        @type {Function}
        @default {Number} 1
    */
    playbackRate: {
        get: function() {
            return this._playbackRate;
        },
        set: function(playbackRate) {
            if (this._playbackRate !== playbackRate) {
                this._playbackRate = playbackRate;
                this.mediaElement.playbackRate = this._playbackRate;
            }
        }
    },
/**
  @private
*/
    _currentTime: {
        value: 0,
        enumerable: false
    },
/**
  @private
*/
    _updateCurrentTime: {
        value: false,
        enumerable: false
    },
/**
        @type {Function}
        @default {Number} 0
    */
    currentTime: {
        get: function() {
            return this.mediaElement.currentTime;
        },

        set: function(currentTime) {
            try {
                if (isNaN(this.mediaElement.duration)) {
                    logger.error("MediaController:set currentTime: duration is not valid");
                    return;
                }
                if (logger.isDebug) {
                    logger.debug("current time:" + this.mediaElement.currentTime + " new time is" + currentTime);
                }
                this.mediaElement.currentTime = currentTime;
            }
            catch(err) {
                logger.error("MediaController:Exception in set currentTime" + this.mediaElement.currentTime);
            }
        }
    },
/**
    @function
    */
    rewind: {
        value: function() {
            if (this.status === this.PLAYING) {
                if (logger.isDebug) {
                    logger.debug("MediaController:rewind");
                }
                this.playbackRate = -4.0;
            }
        }
    },
/**
    @function
    */
    fastForward: {
        value: function() {
            if (this.status === this.PLAYING) {
                if (logger.isDebug) {
                    logger.debug("MediaController:fastForward");
                }
                this.playbackRate = 4.0;
            }
        }
    },
/**
    @function
    */
    stop: {
        value: function() {
            if (logger.isDebug) {
                logger.debug("MediaController:stop");
            }

            // Pause the playback
            if (this.status === this.PLAYING) {
                if (logger.isDebug) {
                    logger.debug("MediaController:stop while PLAYING: will pause");
                }
                this.pause();
            }

            // Reset the status
            this.status = this.STOPPED;
            this.position = 0;
        }
    },

    fullscreen: {
        value: function() {
            if (this.mediaElement.webkitEnterFullScreen) {
                this.mediaElement.webkitEnterFullScreen();
            } else if (this.mediaElement.webkitRequestFullScreen) {
                this.mediaElement.webkitRequestFullScreen();
            }

        }
    },



/**
    @function
    */
    reset: {
        value: function() {
            if (logger.isDebug) {
                logger.debug("MediaController:reset");
            }
            if (this.status !== this.STOPPED) {
                this.stop();
            }

            // Clear the movie
            this.mediaElement.removeAttribute('src');
        }
    },


    showPoster: {
        value: function() {
            if (this.posterSrc) {
                this.mediaElement.poster = this.posterSrc;
            } else {
                this.mediaElement.poster = null;
            }
        }
    },


/**
    @function
    */
    loadMedia: {
        value: function() {
            if (logger.isDebug) {
                logger.debug("MediaController:loadMedia");
            }

            this.mediaElement.src = this.mediaSrc;
            this._installControlEventHandlers();
            this.mediaElement.load();
        }
    },
/**
    @function
    */
    toggleRepeat: {
        value: function() {
            this.repeat = !this.repeat;
        }
    },
/**
  @private
*/
    _repeat: {
        value: false,
        enumerable: false
    },
/**
        @type {Function}
        @default {Boolean} false
    */
    repeat: {
        get: function() {
            return this._repeat;
        },

        set: function(repeat) {
            if (repeat !== this._repeat) {
                this._repeat = repeat;
                if (repeat) {
                    this.mediaElement.setAttribute("loop", "true");
                } else {
                    this.mediaElement.removeAttribute("loop");
                }
                this._dispatchStateChangeEvent();
            }
        }
    },
    /*-----------------------------------------------------------------------------
     MARK:   Volume Commands
     -----------------------------------------------------------------------------*/
/**
        @type {Function}
        @returns {Number} this.mediaElement.volume * 100
    */
    volume: {
        get: function() {
            return this.mediaElement.volume * 100;
        },

        set: function(vol) {
            var volume = vol;
            if (typeof volume === 'undefined') {
                volume = 50;
            }
            else if (volume > 100) {
                volume = 100;
            }
            else if (volume < 0) {
                volume = 0;
            }
            this.mediaElement.volume = volume / 100.0;
            this._dispatchStateChangeEvent();
        }
    },
/**
    @function
    */
    volumeIncrease: {
        value: function() {
            this.volume += 10;
        }
    },
/**
    @function
    */
    volumeDecrease: {
        value: function() {
            this.volume -= 10;
        }
    },
/**
    @function
    */
    toggleMute: {
        value: function() {
            this.mute = !this.mute;
        }
    },
/**
        @type {Function}
    */
    mute: {
        get: function() {
            return this.mediaElement.muted;
        },

        set: function(muted) {
            if (muted !== this.mediaElement.muted) {
                this.mediaElement.muted = muted;
            }
        }
    },
    /*-----------------------------------------------------------------------------
     MARK:   Event Handlers
     -----------------------------------------------------------------------------*/
/**
    @function
    @returns itself
    */
    handleLoadedmetadata: {
        value: function() {
            if (logger.isDebug) {
                logger.debug("MediaController:handleLoadedmetadata: PLAYING=" + (this.status === this.PLAYING) + " duration=" + this.mediaElement.duration);
            }
            if (isNaN(this.mediaElement.duration)) {
                if (logger.isDebug) {
                    logger.debug("MediaController:handleLoadedmetadata: duration is not valid");
                }
                return;
            }
            this.duration = this.mediaElement.duration;
            if (this.autoplay) {
                this.play();
            } else {
                this.status = this.PAUSED;
            }
        }
    },
/**
  @private
*/
    _lastCurrentTime: {
        value: 0
    },
/**
    @function
    */
    handleTimeupdate: {
        value: function() {
            if (this.status !== this.STOPPED) { // A last 'timeupdate' is sent after stop() which is unwanted because it restores the last position.
                var currentTime = this.mediaElement.currentTime;
                //if (Math.abs(this._lastCurrentTime - currentTime) >= this._TIMEUPDATE_FREQUENCY) {
                //    this._lastCurrentTime = currentTime;
                    Object.getPropertyDescriptor(this, "position").set.call(this, currentTime, true);
                //}
            }
        }
    },

/**
    @function
    */
    handlePlay: {
        value: function() {
            if (logger.isDebug) {
                logger.debug("MediaController:Play");
            }
            this.status = this.PLAYING;
        }
    },
/**
    @function
    */
    handlePlaying: {
        value: function() {
            if (logger.isDebug) {
                logger.debug("MediaController:handlePlaying: PLAYING");
            }
            this.status = this.PLAYING;
        }
    },
/**
    @function
    */
    handlePause: {
        value: function() {
            if (this.status !== this.STOPPED) {
                if (logger.isDebug) {
                    logger.debug("MediaController:handlePause: PAUSED");
                }
                this.status = this.PAUSED;
            }
            else {
                if (logger.isDebug) {
                    logger.debug("MediaController:handlePause: STOPPED");
                }
            }
        }
    },
/**
    @function
    */
    handleEnded: {
        value: function() {
            if (logger.isDebug) {
                logger.debug("MediaController:handleEnded");
            }
            this.status = this.STOPPED;
            // If the mediaElement is not in the paused=true state
            // then it won't fire a play event when you start playing again
            this.mediaElement.pause();
        }
    },
/**
    @function
    */
    handleAbort: {
        value: function() {
            if (logger.isDebug) {
                logger.debug("MediaController:handleAbort: STOPPED");
            }
            this.status = this.STOPPED;
        }
    },
/**
    @function
    @param {Event} event TODO
    */
    handleError: {
        value: function(event) {
            if (logger.isDebug) {
                logger.debug("MediaController:handleError: STOPPED");
            }
            var error = event.target.error;

            this.status = this.STOPPED;

            if (error) {
                switch (error.code) {
                    case error.MEDIA_ERR_ABORTED:
                        console.error("You aborted the video playback.");
                        break;
                    case error.MEDIA_ERR_NETWORK:
                        console.error("A network error caused the video download to fail part-way.");
                        break;
                    case error.MEDIA_ERR_DECODE:
                        console.error("The video playback was aborted due to a corruption problem or because the video used features your browser did not support.");
                        break;
                    case error.MEDIA_ERR_SRC_NOT_SUPPORTED:
                        if (this.mediaElement.src.length > 0) {
                            console.error("The video at " + this.mediaElement.src + " could not be loaded, either because the server or network failed or because the format is not supported.");
                        }
                        else {
                            console.error("No video has been selected.");
                        }
                        break;
                    default:
                        console.error("An unknown error occurred.");
                        break;
                }
            }
            this._isFullScreen = false;
        }
    },
/**
    @function
    */
    handleEmptied: {
        value: function() {
            if (logger.isDebug) {
                logger.debug("MediaController:handleEmptied: STOPPED");
            }
            this.status = this.STOPPED;
        }
    },
/**
  @private
*/
    _dispatchStateChangeEvent: {
        value: function() {
            var stateEvent = window.document.createEvent("CustomEvent");
            stateEvent.initCustomEvent("mediaStateChange", true, true, null);
            this.dispatchEvent(stateEvent);
        }
    },
/**
  @private
*/
    _installControlEventHandlers: {
        value: function() {
            this.mediaElement.addEventListener('loadedmetadata', this, false);
            this.mediaElement.addEventListener('timeupdate', this, false);
            this.mediaElement.addEventListener('play', this, false);
            this.mediaElement.addEventListener('playing', this, false);
            this.mediaElement.addEventListener('pause', this, false);
            this.mediaElement.addEventListener('abort', this, false);
            this.mediaElement.addEventListener('error', this, false);
            this.mediaElement.addEventListener('emptied', this, false);
            this.mediaElement.addEventListener('ended', this, false);
        }
    },
    /*-----------------------------------------------------------------------------
     MARK:   Configuration
     -----------------------------------------------------------------------------*/

     constructor: {
         value: function MediaController() {
             this.super();
         }
     }

});
