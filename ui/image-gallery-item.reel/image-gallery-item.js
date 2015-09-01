var Component = require("ui/component").Component;

/**
 * @class ImageGalleryItem
 * @extends Component
 */
exports.ImageGalleryItem = Component.specialize(/** @lends ImageGalleryItem# */ {

    enterDocument: {
        value: function () {
            this._image.addEventListener("load", this, false);
            this._image.addEventListener("error", this, false);
        }
    },

    _src: {
        value: null
    },

    _needsUpdateStatus: {
        value: false
    },

    __status: {
        value: null
    },

    _status: {
        get: function () {
            return this.__status;
        },
        set: function (value) {
            if (this.__status !== value) {
                this.__status = value;
                this._needsUpdateStatus = true;
                this.needsDraw = true;
            }
        }
    },

    handleLoad: {
        value: function () {
            window.clearTimeout(this._loaderTimeout);
            this._status = null;
        }
    },

    handleError: {
        value: function () {
            window.clearTimeout(this._loaderTimeout);
            this._status = "error";
        }
    },

    _needsUpdateSource: {
        value: false
    },

    src: {
        set: function (value) {
            if (value) {
                var image;

                if (this._src !== value) {
                    this._src = value;
                    this._needsUpdateSource = true;
                    this._status = null;
                    this.needsDraw = true;
                }
            }
        }
    },

    _loaderTimeout: {
        value: null
    },

    draw: {
        value: function () {
            var self;

            if (this._needsUpdateStatus) {
                this._needsUpdateStatus = false;
                switch (this.__status) {
                    case "loading":
                        this.loadingElement.style.display = "block";
                        this.errorElement.style.display = "none";
                        break;
                    case "error":
                        this.loadingElement.style.display = "none";
                        this.errorElement.style.display = "block";
                        break;
                    default:
                        this.loadingElement.style.display = "none";
                        this.errorElement.style.display = "none";
                }
            }
            if (this._needsUpdateSource) {
                this._needsUpdateSource = false;
                this._image.src = this._src;
                window.clearTimeout(this._loaderTimeout);
                self = this;
                this._loaderTimeout = window.setTimeout(function () {
                    self._status = "loading";
                }, 200);
                this._element.style.backgroundImage = "url(" + this._src + ")";
            }
        }
    }

});
