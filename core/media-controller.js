/**
 * @module montage/ui/controller/media-controller
 * @requires montage/core/core
 * @requires montage/ui/component
 * @requires montage/core/logger
 */
var Target = require("./target").Target,
    logger = require("./logger").logger("mediacontroller");

/**
 * @class MediaController
 * @classdesc Controls an audio/video media player.
 * @extends Target
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

    _TIMEUPDATE_FREQUENCY: { value: 0.25 },  // Don't refresh too often.


    /*-----------------------------------------------------------------------------
     MARK:   Properties
     -----------------------------------------------------------------------------*/

    _mediaElement: {
        value: null
    },

    mediaElement: {
        get: function () {
            return this._mediaElement;
        },
        set: function (mediaElement) {
            if (this._mediaElement !== mediaElement) {
                if (this._mediaElement) {
                    this._removeControlEventHandlers();
                }

                this._mediaElement = mediaElement;
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
     * @function
     */
    play: {
        value: function () {
            if (logger.isDebug) {
                logger.debug("MediaController:play()");
            }

            // setting currentTime will throw if video not loaded yet(?)
            if (this._mediaElement.currentTime !== 0) {
                this._mediaElement.currentTime = 0;
            }
            this._mediaElement.play();
            this._pauseTime = null;
        }
    },

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
            this._pauseTime = this._mediaElement.currentTime;
            this._mediaElement.pause();
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
                this._mediaElement.currentTime = this._pauseTime;
            }

            this._mediaElement.play();
        }
    },

    /**
     * @function
     * @returns {boolean} !playing (true if it is now playing)
     */
    playPause: {
        value: function () {
            if (logger.isDebug) {
                logger.debug("MediaController:playPause()");
            }

            var playing = (this.status === this.PLAYING),
                paused = (this.status === this.PAUSED);

            this.playbackRate = this._mediaElement.defaultPlaybackRate;

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
                this._mediaElement.playbackRate = this._playbackRate;
            }
        }
    },


    defaultPlaybackRate: {
        set: function (defaultPlaybackRate) {
            return this._mediaElement.defaultPlaybackRate = defaultPlaybackRate;
        },
        get: function () {
            return this._mediaElement.defaultPlaybackRate;
        }
    },

    /**
     * @type {Function}
     * @default {number} 0
     */
    currentTime: {
        get: function () {
            return this._mediaElement.currentTime;
        },
        set: function (currentTime) {
            if (this.status === this.EMPTY) {
                return;
            }

            try {
                if (isNaN(this._mediaElement.duration)) {
                    logger.error("MediaController:set currentTime: duration is not valid");
                    return;
                }

                var oldTime = this._mediaElement.currentTime;

                if (oldTime !== currentTime) {
                    if (this._position !== currentTime && this.status !== this.STOPPED) {
                        this._position = currentTime;
                    }

                    this._mediaElement.currentTime = currentTime;
                }

            } catch (err) {
                logger.error("MediaController:Exception in set currentTime" + this._mediaElement.currentTime);
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
            this._mediaElement.pause();
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
     * @returns {number} this.mediaElement.volume * 100
     */
    volume: {
        get: function () {
            return this._mediaElement.volume * 100;
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
            this._mediaElement.volume = volume / 100.0;
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
            return this._mediaElement.muted;
        },
        set: function (muted) {
            if (muted !== this._mediaElement.muted) {
                this._mediaElement.muted = muted;
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
            if (isNaN(this._mediaElement.duration)) {
                if (logger.isDebug) {
                    logger.debug("MediaController:handleLoadedmetadata: duration is not valid");
                }
                return;
            }
            this.duration = this._mediaElement.duration;
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
     * @function
     */
    handleTimeupdate: {
        value: function () {
            if (this.status !== this.STOPPED) { // A last 'timeupdate' is sent after stop() which is unwanted because it restores the last position.
                var currentTime = this._mediaElement.currentTime;
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
            this._mediaElement.pause();
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

    _installControlEventHandlers: {
        value: function () {
            this._mediaElement.addEventListener('loadedmetadata', this);
            this._mediaElement.addEventListener('timeupdate', this);
            this._mediaElement.addEventListener('play', this);
            this._mediaElement.addEventListener('playing', this);
            this._mediaElement.addEventListener('pause', this);
            this._mediaElement.addEventListener('abort', this);
            this._mediaElement.addEventListener('error', this);
            this._mediaElement.addEventListener('emptied', this);
            this._mediaElement.addEventListener('ended', this);
        }
    },

    _removeControlEventHandlers: {
        value: function () {
            this._mediaElement.removeEventListener('loadedmetadata', this);
            this._mediaElement.removeEventListener('timeupdate', this);
            this._mediaElement.removeEventListener('play', this);
            this._mediaElement.removeEventListener('playing', this);
            this._mediaElement.removeEventListener('pause', this);
            this._mediaElement.removeEventListener('abort', this);
            this._mediaElement.removeEventListener('error', this);
            this._mediaElement.removeEventListener('emptied', this);
            this._mediaElement.removeEventListener('ended', this);
        }
    }

}, {

    blueprintModuleId:require("./core")._blueprintModuleIdDescriptor,

    blueprint:require("./core")._blueprintDescriptor

});
