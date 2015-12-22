/**
 * @module ui/montage-studio-loader.reel
 */
var Loader = require("../loader.reel").Loader;

// Constants
var OFF_CLASS_NAME = "off",
    ANI_CLASS_NAME = "ani",
    TRIANGLES_CLASS_NAME = "tri",

    LOADER_STATE_INIT = 0,
    LOADER_STATE_ANIMATING = 1,
    LOADER_STATE_STOPPED = 2;

/**
 * @class MontageStudioLoader
 * @extends Component
 */
var MontageStudioLoader = exports.MontageStudioLoader = Loader.specialize(/** @lends MontageStudioLoader# */ {


    hasTemplate: {
        value: true
    },


    _state: {
        value: null
    },


    state: {
        set: function (state) {
            if (this._state !== state) {
                this._state = state;
            }
        },
        get: function () {
            if (this._state === null) {
                this._state = LOADER_STATE_INIT;
            }

            return this._state;
        }
    },


    _shouldRotate: {
        value: false
    },


    animationInterval: {
        value: 3500
    },

    minimumFirstLoadingDuration: {
        value: 6000
    },

    enterDocument: {
        value: function (firsTime) {
            Loader.prototype.enterDocument.call(this, firsTime);

            if (firsTime) {
                this.startAnimation();
            }
        }
    },


    exitDocument: {
        value: function () {
            if (this.state === LOADER_STATE_ANIMATING) {
                this.stopAnimation();
            }
        }
    },


    startAnimation: {
        value: function () {
            if (this.state !== LOADER_STATE_STOPPED) {
                var self = this;

                this._animationIntervalTimeoutID = setTimeout(function () {
                    if (self.state === LOADER_STATE_STOPPED) return;
                    self.state = LOADER_STATE_ANIMATING;

                    self.needsDraw = true;
                }, this.animationInterval);
            }
        }
    },


    stopAnimation: {
        value: function () {
            if (this.state === LOADER_STATE_ANIMATING) {
                if (this._animationIntervalTimeoutID) {
                    clearTimeout(this._animationIntervalTimeoutID);
                    this._animationIntervalTimeoutID = null;
                }

                this.state = LOADER_STATE_STOPPED;
                this.needsDraw = true;
            }
        }
    },


    draw: {
        value: function () {
            Loader.prototype.draw.call(this);

            if (this.state === LOADER_STATE_ANIMATING) {
                this._logoTrianglesElement.classList.remove(OFF_CLASS_NAME);
                this._logoWtrianglesElement.classList.remove(OFF_CLASS_NAME);
                this._logoSVGContainerElement.classList.add(ANI_CLASS_NAME);
                this._logoWtrianglesElement.classList.add(ANI_CLASS_NAME);
                this._logoLinesElement.classList.add(OFF_CLASS_NAME);

                var triangles = document.getElementsByClassName(TRIANGLES_CLASS_NAME),
                    tPrefix = "t";

                for (var i = 0; i < triangles.length; i++) {
                    triangles[i].classList.add(tPrefix + (i + 1));
                }

            } else if (this.state === LOADER_STATE_STOPPED) {
                // Avoid memory leak
                this._logoTrianglesElement = null;
                this._logoWtrianglesElement = null;
                this._logoSVGContainerElement = null;
                this._logoWtrianglesElement = null;
                this._logoLinesElement = null;

                this.element.classList.add(OFF_CLASS_NAME);
            }
        }
    }

});
