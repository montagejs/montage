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
"use strict";
/**
	@module montage/ui/video-player
    @requires montage
    @requires montage/ui/component
    @requires core/logger
    @requires core/event/action-event-listener
    @requires ui/controller/media-controller
*/
var Montage = require("montage").Montage,
    Component = require("ui/component").Component,
    logger = require("core/logger").logger("video-player"),
    ActionEventListener = require("core/event/action-event-listener").ActionEventListener,
    MediaController = require("ui/controller/media-controller").MediaController;
/**
 @class module:montage/ui/video-player.VideoPlayer
 */
var VideoPlayer = exports.VideoPlayer = Montage.create(Component,/** @lends module:montage/ui/video-player.VideoPlayer# */ {

    /*-----------------------------------------------------------------------------
    MARK:   Constants
    -----------------------------------------------------------------------------*/
/**
    The interval in milliseconds that the control panel is displayed without interaction before being hidden.
    @type {number}
    @default 5000
*/
    CONTROL_SHOW_TIME: { enumerable: true, value: 5000, writable: false },
    /*-----------------------------------------------------------------------------
    MARK:   Element Getters
    -----------------------------------------------------------------------------*/
    /**
        The DIV element used to display the play button in the media controller.
        @type {external:Element}
        @default null
    */
    playButton: { value: null, enumerable: false },

    /**
        The DIV element used to display the repeat button in the media controller.
        @type {external:Element}
        @default null
    */
    repeatButton: { value: null, enumerable: false },

    /**
        The DIV element used to display the volume level in the media controller.
        @type {external:Element}
        @default null
    */
    volumeLevel: { value: null, enumerable: false },

    /**
        The DIV element used to display the volume level in the media controller.
        @type {external:Element}
        @default null
    */
    controls: { value: null, enumerable: false },

    /**
        The DIV element used to display the  in the media controller.
        @type {external:Element}
        @default null
    */
    fullScreenPanel: { value: null, enumerable: false },
    /**
        Description TODO
        @type {external:Element}
        @default null
    */
    fullScreenButton: { value: null, enumerable: false },

    /*-----------------------------------------------------------------------------
    MARK:   Component References
    -----------------------------------------------------------------------------*/
    /**
        The DynamicText component used to display the currently playing track's playback position.
        @type {module:montage/ui/dynamic-text.DynamicText}
        @default null
    */
    positionText: { value: null, enumerable: false },     /* montage/ui/dynamic-text */

    /**
        The DynamicText component used to display the currently playing track's duration.
        @type {module:montage/ui/dynamic-text.DynamicText}
        @default null
    */
    durationText: { value: null, enumerable: false },     /* montage/ui/dynamic-text */

    /**
        The Slider component used to control the playback position.
        @type {module:montage/ui/slider.Slider}
        @default null
    */
    slider: { value: null, enumerable: false },           /* montage/ui/slider */
    /*-----------------------------------------------------------------------------
    MARK:   Properties
    -----------------------------------------------------------------------------*/
    /**
        The MediaController instance used by the VideoPlayer.
        @type {module:montage/ui/controller/media-controller.MediaController}
        @default null
    */
    controller: { value: null, enumerable: false },     /* montage/controller/media-controller */

    /**
        The source URL for the video.
        @type {string}
        @default null
    */
    src: { value: null },
    /*-----------------------------------------------------------------------------
    MARK:   Actions
    -----------------------------------------------------------------------------*/
    /*-----------------------------------------------------------------------------
    MARK:   UI Setters
    -----------------------------------------------------------------------------*/
    /**
        Determines whether video controls are hidden automatically.
        @type {Boolean}
        @default true
    */
    autoHide: { value: true },

    /**
        Specifies whether the full screen video is supported.
        @type {Boolean}
        @default true
    */
    supportsFullScreen: { value: true },

/**
  @private
*/
    _isFullScreen: { value: false },

    templateDidLoad: {
        value: function() {
            if(logger.isDebug) {
                logger.debug("MediaController:templateDidLoad");
            }
            Object.defineBinding(this.positionText, "value", {
                    boundObject: this.controller,
                    boundObjectPropertyPath: "position",
                    boundValueMutator: this._prettyTime
                });
            Object.defineBinding(this.durationText, "value", {
                    boundObject: this.controller,
                    boundObjectPropertyPath: "duration",
                    boundValueMutator: this._prettyTime
                });
            Object.defineBinding(this.slider, "maxValue", {
                boundObject: this.controller,
                boundObjectPropertyPath: "duration",
                boundValueMutator: this._roundTime,
                oneWay: false
                });
        }
    },
/**
  @private
*/
    _prettyTime: {
        value: function(time) {
            var sec, min, hour;
            time = parseInt(time, 10);
            if (isNaN(time) || time < 0)
                return "";
            sec = time % 60;
            min = Math.floor(time / 60) % 60;
            hour = Math.floor(time / 3600);
            return (hour > 0 ? hour + ":" : "") + (min < 10 ? "0"+min : min) + ":" + (sec < 10 ? "0"+sec : sec);
        }
    },
/**
  @private
*/
    _roundTime: {
        value: function(time) {
            return (time < 0 ? 0 : Math.floor(time));
        }
    },
/**
    Description TODO
    @function
    @private
    */
    handleMediaStateChange: {
        value: function() {
            this.needsDraw = true;
        }
    },
    /*-----------------------------------------------------------------------------
    MARK:   Interaction
    -----------------------------------------------------------------------------*/
/**
  Description TODO
  @private
*/
    _showControls: {
        value: true, enumerable: false
    },
/**
  Description TODO
  @private
*/
    _hideControlsId: {
        value: null, enumerable: false
    },
/**
    Description TODO
    @function
    @private
    */
    handleMouseup: {
        value: function() {
            this.showControlsForInterval();
        }
    },
/**
    Description TODO
    @function
    @private
    */
    handleTouchend: {
        value: function() {
            this.showControlsForInterval();
        }
    },
/**
    Displays the video player controlls for the interval specified by the CONTROL_SHOW_TIME property.
    @function
    */
    showControlsForInterval: {
        value: function() {
            this._showControls = true;
            this.needsDraw = true;

            var self = this;
            var hideControls = function() {
                self._showControls = false;
                self._hideControlsId = null;
                self.needsDraw = true;
            }

            if (this._hideControlsId) {
                window.clearTimeout(this._hideControlsId);
            }
            this._hideControlsId = window.setTimeout(hideControls, this.CONTROL_SHOW_TIME);
        }
    },
/**
    Toggles full-screen playback mode.
    @function
    */
    toggleFullScreen: {
        value: function() {
            if (this.supportsFullScreen) {
                this._isFullScreen = !this._isFullScreen;
                this.needsDraw = true;
            }
        }
    },
/**
  @private
*/
    _installMediaEventListeners: {
        value: function() {
            this.controller.addEventListener("mediaStateChange", this, false);
        }
    },
/**
  @private
*/
    _installUserActionDetector: {
        value: function() {
            if (window.touch && this.autoHide) {
                this.element.addEventListener("touchstart", this, false);
            } else if (this.autoHide) {
                this.element.addEventListener("mouseup", this, false);
            }
        }
    },
/**
    @private
    */
    prepareForDraw: {
        value: function() {
            this._installUserActionDetector();
            this.controller._installControlEventHandlers();
            this._installMediaEventListeners();

            if (!this.autoHide) {
                this.element.style.paddingBottom = "50px";
            }
        }
    },
/**
    @private
    */
    draw: {
        value: function() {
            var volumeWidth;
            // Handle loading
            if (this.controller.status === this.controller.EMPTY) {
                this.controller.loadMedia();
            } else {
                // Handle playing
                if (this.controller.status === this.controller.PLAYING) {
                    if (!this.playButton.classList.contains('playing')) {
                        this.playButton.classList.add('playing');
                    }
                } else {
                    if (this.playButton.classList.contains('playing')) {
                        this.playButton.classList.remove('playing');
                    }
                }

                if (this.volumeLevel) {
                    volumeWidth = Math.floor(this.controller.volume);
                    this.volumeLevel.style.width =  volumeWidth + "%";
                }

                if (this.controller.repeat) {
                    if (!this.repeatButton.classList.contains("loop")) {
                        this.repeatButton.classList.add("loop");
                    }
                } else {
                    if (this.repeatButton.classList.contains("loop")) {
                        this.repeatButton.classList.remove("loop");
                    }
                }

                if (this._showControls) {
                    this.controls.classList.remove("hide-controls");
                    this.controls.classList.add("show-controls");
                } else {
                    this.controls.classList.remove("show-controls");
                    this.controls.classList.add("hide-controls");
                }

                if (this.supportsFullScreen) {
                    this.fullScreenPanel.classList.add("support-fullscreen");
                    this.fullScreenPanel.classList.remove("hide-fullscreen");
                    if (!this._isFullScreen) {
                        this.fullScreenButton.classList.add("enter-fullscreen");
                        this.fullScreenButton.classList.remove("exit-fullscreen");
                        this.element.classList.remove("fullscreen");
                    } else {
                        this.fullScreenButton.classList.add("exit-fullscreen");
                        this.fullScreenButton.classList.remove("enter-fullscreen");
                        this.element.classList.add("fullscreen");
                    }
                } else {
                    this.fullScreenPanel.classList.remove("support-fullscreen");
                    this.fullScreenPanel.classList.add("hide-fullscreen");
                    this.element.classList.remove("fullscreen");
                }
            }
        }
    }

});
