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
     * @type {number}
     * @default {number} 0
     */
    STOPPED: { value: 0, writable: false },

    /**
     * @type {number}
     * @default {number} 1
     */
    PLAYING: { value: 1, writable: false },

    /**
     * @type {number}
     * @default {number} 2
     * */
    PAUSED: { value: 2, writable: false },

    /**
     * @type {number}
     * @default {number} 3
     */
    EMPTY: { value: 3, writable: false },

    _TIMEUPDATE_FREQUENCY: { value: 0.25   },  // Don't refresh too often.


    /*-----------------------------------------------------------------------------
     MARK:   Properties
     -----------------------------------------------------------------------------*/

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

    _status: {
        value: 3
    },
    /**
     * @type {Function}
     * @default {number} 3
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
     * @type {number}
     * @default {boolean} true
     */
    autoplay: {
        value: false
    },

    /**
     * @method
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

    _pauseTime: {
        value: null
    },

    /**
     * @method
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
     * @method
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
     * @method
     * @returns {boolean} !playing (true if it is now playing)
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

    _playbackRate: {
        value: 1
    },
    /**
     * @type {Function}
     * @default {number} 1
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
     * @default {number} 0
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
     * @method
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
     * @method
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
     * @method
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
     * @returns {number} this.mediaController.volume * 100
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
     * @method
     */
    volumeIncrease: {
        value: function () {
            this.volume += 10;
        }
    },

    /**
     * @method
     */
    volumeDecrease: {
        value: function () {
            this.volume -= 10;
        }
    },

    /**
     * @method
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
     * @method
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

    _lastCurrentTime: {
        value: 0
    },

    /**
     * @method
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
     * @method
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
     * @method
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
     * @method
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
     * @method
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
     * @method
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
     * @method
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
     * @method
     */
    handleEmptied: {
        value: function () {
            if (logger.isDebug) {
                logger.debug("MediaController:handleEmptied: STOPPED");
            }
            this.status = this.STOPPED;
        }
    },

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

