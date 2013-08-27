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
 * @module montage/ui/controller/media-controller
 * @requires montage/core/core
 * @requires montage/ui/component
 * @requires montage/core/logger
 */
var Montage = require("montage").Montage;
var Target = require("core/target").Target;
var logger = require("core/logger").logger("mediacontroller");

/**
 * @class MediaController
 * @classdesc Controls an audio/video media player.
 * @extends Montage
 */
var MediaController = exports.MediaController = Target.specialize(/** @lends MediaController# */ {

    /*-----------------------------------------------------------------------------
     MARK:   Constants
     -----------------------------------------------------------------------------*/

    /**
     * @type {Number}
     * @default {Number} 0
     */
    STOPPED: { value: 0, writable: false },

    /**
     * @type {Number}
     * @default {Number} 1
     */
    PLAYING: { value: 1, writable: false },

    /**
     * @type {Number}
     * @default {Number} 2
     * */
    PAUSED: { value: 2, writable: false },

    /**
     * @type {Number}
     * @default {Number} 3
     */
    EMPTY: { value: 3, writable: false },

    /**
     * @private
     */
    _TIMEUPDATE_FREQUENCY: { value: 0.25   },  // Don't refresh too often.


    /*-----------------------------------------------------------------------------
     MARK:   Properties
     -----------------------------------------------------------------------------*/

    /**
     * @private
     */
    _mediaController: {
        value: null
    },
    /**
     * @type {Function}
     * @default null
     */
    mediaController: {
        get: function () {
            if (!this._mediaController) {
                this._mediaController = new window.MediaController();
                this._installControlEventHandlers();
            }
            return this._mediaController;
        },
        set: function (controller) {
            if (this._mediaController !== controller) {
                if (this._mediaController) {
                    this._removeControlEventHandlers();
                }
                this._mediaController = controller;
                this._installControlEventHandlers();
            }
        }
    },


    /*-----------------------------------------------------------------------------
     MARK:   Status & Attributes
     -----------------------------------------------------------------------------*/

    /**
     * @private
     */
    _status: {
        value: 3
    },
    /**
     * @type {Function}
     * @default {Number} 3
     */
    status: {
        get: function () {
            return this._status;
        },
        set: function (status) {
            if (status !== this._status) {
                if (logger.isDebug) {
                    logger.debug("MediaController:status: " + status);
                }
                this._status = status;
            }
        }
    },

    /**
     * @private
     */
    _position: {
        value: null
    },
    /**
     * @type {Function}
     * @default null
     */
    position: {
        set: function (time, shouldNotUpdate) {
            this._position = time;
            if (!shouldNotUpdate) {
                this._pauseTime = null;
                this.currentTime = time;
            }
        },
        get: function () {
            return this._position;
        }
    },

    /**
     * @private
     */
    _duration: {
        value: null
    },
    /**
     * @type {Function}
     * @default null
     */
    duration: {
        set: function (time) {
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
        get: function () {
            return this._duration;
        }
    },


    /*-----------------------------------------------------------------------------
     MARK:   Media Player Commands
     -----------------------------------------------------------------------------*/

    /**
     * @type {Number}
     * @default {Boolean} true
     */
    autoplay: {
        value: false
    },

    /**
     * @function
     */
    play: {
        value: function () {
            if (logger.isDebug) {
                logger.debug("MediaController:play()");
            }
            // setting currentTime will throw if video not loaded yet(?)
            if (this.mediaController.currentTime !== 0) {
                this.mediaController.currentTime = 0;
            }
            this.mediaController.play();
            this._pauseTime = null;
        }
    },

    /**
     * @private
     */
    _pauseTime: {
        value: null
    },

    /**
     * @function
     */
    pause: {
        value: function () {
            if (logger.isDebug) {
                logger.debug("MediaController:pause()");
            }
            // temporary workaround for Chrome issue: https://code.google.com/p/chromium/issues/detail?id=242839
            this._pauseTime = this.mediaController.currentTime;
            this.mediaController.pause();
        }
    },

    /**
     * @function
     */
    unpause: {
        value: function () {
            if (logger.isDebug) {
                logger.debug("MediaController:unpause()");
            }
            if (this._pauseTime !== null) {
                this.mediaController.currentTime = this._pauseTime;
            }
            this.mediaController.unpause();
        }
    },

    /**
     * @function
     * @returns {Boolean} !playing (true if it is now playing)
     */
    playPause: {
        value: function () {
            if (logger.isDebug) {
                logger.debug("MediaController:playPause()");
            }

            var playing = (this.status === this.PLAYING);
            var paused = (this.status === this.PAUSED);
            this.playbackRate = this.mediaController.defaultPlaybackRate;
            if (playing) {
                this.pause();
            } else if (paused) {
                this.unpause();
            } else {
                this.play();
            }
            return !playing;    // true if it is now playing
        }
    },

    /**
     * @private
     */
    _playbackRate: {
        value: 1
    },
    /**
     * @type {Function}
     * @default {Number} 1
     */
    playbackRate: {
        get: function () {
            return this._playbackRate;
        },
        set: function (playbackRate) {
            if (this._playbackRate !== playbackRate) {
                this._playbackRate = playbackRate;
                this.mediaController.playbackRate = this._playbackRate;
            }
        }
    },

    /**
     * @type {Function}
     * @default {Number} 0
     */
    currentTime: {
        get: function () {
            return this.mediaController.currentTime;
        },
        set: function (currentTime) {
            if (this.status === this.EMPTY) {
                return;
            }
            try {
                if (isNaN(this.mediaController.duration)) {
                    logger.error("MediaController:set currentTime: duration is not valid");
                    return;
                }
                if (logger.isDebug) {
                    logger.debug("current time: " + this.mediaController.currentTime + ", new time: " + currentTime);
                }
                var oldTime = this.mediaController.currentTime;
                if (oldTime !== currentTime) {
                    this.mediaController.currentTime = currentTime;
                }
            }
            catch (err) {
                logger.error("MediaController:Exception in set currentTime" + this.mediaController.currentTime);
            }
        }
    },

    /**
     * @function
     */
    rewind: {
        value: function () {
            if (this.status === this.PLAYING) {
                if (logger.isDebug) {
                    logger.debug("MediaController:rewind()");
                }
                this.playbackRate = -4.0;
            }
        }
    },

    /**
     * @function
     */
    fastForward: {
        value: function () {
            if (this.status === this.PLAYING) {
                if (logger.isDebug) {
                    logger.debug("MediaController:fastForward()");
                }
                this.playbackRate = 4.0;
            }
        }
    },

    /**
     * @function
     */
    stop: {
        value: function () {
            if (logger.isDebug) {
                logger.debug("MediaController:stop()");
            }

            // Pause the playback
            this.mediaController.pause();
            this._pauseTime = null;
            // Reset the status
            this.status = this.STOPPED;
            this.position = 0;
        }
    },


    /*-----------------------------------------------------------------------------
     MARK:   Volume Commands
     -----------------------------------------------------------------------------*/

    /**
     * @type {Function}
     * @returns {Number} this.mediaController.volume * 100
     */
    volume: {
        get: function () {
            return this.mediaController.volume * 100;
        },

        set: function (vol) {
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
            this.mediaController.volume = volume / 100.0;
        }
    },

    /**
     * @function
     */
    volumeIncrease: {
        value: function () {
            this.volume += 10;
        }
    },

    /**
     * @function
     */
    volumeDecrease: {
        value: function () {
            this.volume -= 10;
        }
    },

    /**
     * @function
     */
    toggleMute: {
        value: function () {
            this.mute = !this.mute;
        }
    },

    /**
     * @type {Function}
     */
    mute: {
        get: function () {
            return this.mediaController.muted;
        },
        set: function (muted) {
            if (muted !== this.mediaController.muted) {
                this.mediaController.muted = muted;
            }
        }
    },


    /*-----------------------------------------------------------------------------
     MARK:   Event Handlers
     -----------------------------------------------------------------------------*/

    /**
     * @function
     * @returns itself
     */
    handleLoadedmetadata: {
        value: function () {
            if (logger.isDebug) {
                logger.debug("MediaController:handleLoadedmetadata: PLAYING=" + (this.status === this.PLAYING) + " duration=" + this.mediaController.duration);
            }
            if (isNaN(this.mediaController.duration)) {
                if (logger.isDebug) {
                    logger.debug("MediaController:handleLoadedmetadata: duration is not valid");
                }
                return;
            }
            this.duration = this.mediaController.duration;
            if (this.autoplay) {
                if (logger.isDebug) {
                    logger.debug("MediaController:handleLoadedmetadata: autoplay");
                }
                this.play();
            } else {
                this.status = this.STOPPED;
            }
        }
    },

    /**
     * @private
     */
    _lastCurrentTime: {
        value: 0
    },

    /**
     * @function
     */
    handleTimeupdate: {
        value: function () {
            if (this.status !== this.STOPPED) { // A last 'timeupdate' is sent after stop() which is unwanted because it restores the last position.
                var currentTime = this.mediaController.currentTime;
                //if (Math.abs(this._lastCurrentTime - currentTime) >= this._TIMEUPDATE_FREQUENCY) {
                //    this._lastCurrentTime = currentTime;
                Object.getPropertyDescriptor(this, "position").set.call(this, currentTime, true);
                //}
            }
        }
    },

    /**
     * @function
     */
    handlePlay: {
        value: function () {
            if (logger.isDebug) {
                logger.debug("MediaController:handlePlay");
            }
            this.status = this.PLAYING;
        }
    },
    /**
     * @function
     */
    handlePlaying: {
        value: function () {
            if (logger.isDebug) {
                logger.debug("MediaController:handlePlaying: PLAYING");
            }
            this.status = this.PLAYING;
        }
    },
    /**
     * @function
     */
    handlePause: {
        value: function () {
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
     * @function
     */
    handleEnded: {
        value: function () {
            if (logger.isDebug) {
                logger.debug("MediaController:handleEnded");
            }
            // If the media controller is not in the paused=true state
            // then it won't fire a play event when you start playing again
            this.mediaController.pause();
            this.status = this.STOPPED;
        }
    },
    /**
     * @function
     */
    handleAbort: {
        value: function () {
            if (logger.isDebug) {
                logger.debug("MediaController:handleAbort: STOPPED");
            }
            this.status = this.STOPPED;
        }
    },
    /**
     * @function
     * @param {Event} event TODO
     */
    handleError: {
        value: function (event) {
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
                        console.error("The selected video could not be loaded, either because the server or network failed, the format is not supported, or no video has been selected.");
                        break;
                    default:
                        console.error("An unknown error occurred.");
                        break;
                }
            }
        }
    },

    /**
     * @function
     */
    handleEmptied: {
        value: function () {
            if (logger.isDebug) {
                logger.debug("MediaController:handleEmptied: STOPPED");
            }
            this.status = this.STOPPED;
        }
    },

    /**
     * @private
     */
    _installControlEventHandlers: {
        value: function () {
            this.mediaController.addEventListener('loadedmetadata', this);
            this.mediaController.addEventListener('timeupdate', this);
            this.mediaController.addEventListener('play', this);
            this.mediaController.addEventListener('playing', this);
            this.mediaController.addEventListener('pause', this);
            this.mediaController.addEventListener('abort', this);
            this.mediaController.addEventListener('error', this);
            this.mediaController.addEventListener('emptied', this);
            this.mediaController.addEventListener('ended', this);
        }
    },

    _removeControlEventHandlers: {
        value: function () {
            this.mediaController.removeEventListener('loadedmetadata', this);
            this.mediaController.removeEventListener('timeupdate', this);
            this.mediaController.removeEventListener('play', this);
            this.mediaController.removeEventListener('playing', this);
            this.mediaController.removeEventListener('pause', this);
            this.mediaController.removeEventListener('abort', this);
            this.mediaController.removeEventListener('error', this);
            this.mediaController.removeEventListener('emptied', this);
            this.mediaController.removeEventListener('ended', this);
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

}, {

    blueprintModuleId:require("montage")._blueprintModuleIdDescriptor,

    blueprint:require("montage")._blueprintDescriptor

});
