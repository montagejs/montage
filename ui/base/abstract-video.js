/*global require, exports*/

/**
 @module montage/ui/base/abstract-video.reel
 */
var Montage = require("montage").Montage,
    Component = require("ui/component").Component,
    MediaController = require("core/media-controller").MediaController;

/**
 * @class AbstractVideo
 * @extends Component
 */
var AbstractVideo = exports.AbstractVideo = Component.specialize( /** @lends AbstractVideo# */ {

    /**
     * @private
     */
    constructor: {
        value: function AbstractVideo() {
            if(this.constructor === AbstractVideo) {
                throw new Error("AbstractVideo cannot be instantiated.");
            }
            Component.constructor.call(this); // super
        }
    },
    
    mediaElement: {
        value: null
    },
    
    _controller: {
        value: null
    },
    
    /**
        The MediaController instance used by the video component.
        @type {module:montage/core/media-controller.MediaController}
        @default null
    */
    controller: {
        get: function() {
            return this._controller;
        },
        set: function(controller) {
            if (controller) {
                this._controller = controller;
                if (this.mediaElement) {
                    this.mediaElement.controller = controller.mediaController;
                }
            }
        }
    },
    
    /**
    @private
    */
    _src: {
        value: null
    },
    /**
     * @type {String}
     * @default null
     */
    src: {
        get: function() {
            return this._src;
        },
        set: function(src) {
            this._src = src;
        }
    },

    /**
    @private
    */
    _sources: {
        value: null
    },
    /**
     * @type {Array}
     * @default null
     */
    sources: {
        get: function() {
            return [];
        },
        set: function(sources) {
            if (sources && sources.length) {
                var mediaElement = document.createElement("video");
                for (var i=0;i<sources.length;i++) {
                    var mediaSrc = sources[i].src,
                        mediaType = sources[i].type;
                    if (mediaType && mediaElement.canPlayType(mediaType)) {
                        this.src = mediaSrc;
                        break;
                    }
                }
                this._sources = sources;
            }
        }
    },

    /**
    @function
    */
    loadMedia: {
        value: function() {
            this.mediaElement.load();
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

    /**
    @function
    */
    showPoster: {
        value: function() {
            if (this.posterSrc && this.mediaElement) {
                this.mediaElement.poster = this.posterSrc;
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

    enterDocument: {
        value: function(firstTime) {
            if (firstTime) {
            
                // look for src attribute on original element
                if (this.originalElement.hasAttribute("src") && this.originalElement.getAttribute("src")) {
                    this.src = this.originalElement.getAttribute("src");
                } else {
                    // try to grab <source> child elements from original element
                    var sources = this.originalElement.getElementsByTagName("source"),
                        mediaSrc, mediaType;
                    for (var i=0;i<sources.length;i++) {
                        mediaSrc = sources[i].getAttribute("src");
                        mediaType = sources[i].getAttribute("type");
                        if (mediaType && !this.originalElement.canPlayType(mediaType)) {
                            continue;
                        }
                        this.src = mediaSrc;
                        break;
                    }
                }
                
                // try to grab <track> child elements from original element
                var tracks = this.originalElement.getElementsByTagName("track");
                for (var i=0;i<tracks.length;i++) {
                    var trackKind = tracks[i].getAttribute("kind");
                    if (trackKind == "captions" || trackKind == "subtitles") {
                        var track = document.createElement("track");
                        track.kind = trackKind;
                        track.label = tracks[i].getAttribute("label");
                        track.src = tracks[i].getAttribute("src");
                        track.srclang = tracks[i].getAttribute("srclang");
                        track.default = tracks[i].hasAttribute("default");
                        this.mediaElement.appendChild(track);
                        this.mediaElement.textTracks[this.mediaElement.textTracks.length-1].mode = "showing";
                    }
                }

                if (!this.controller) {
                    this.controller = Montage.create(MediaController);
                }
                this.mediaElement.controller = this.controller.mediaController;

                this._installMediaEventListeners();
            }
        }
    },

    draw: {
        value: function() {
            if (this.controller.status === this.controller.EMPTY) {
                this.mediaElement.src = this.src;
            }
        }
    }

});
