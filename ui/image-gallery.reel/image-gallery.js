var Component = require("ui/component").Component;

/**
 * ***Note***: ImageGallery should never be be hidden using `display: none`.
 * This will prevent it from displaying normally when `display: block` is
 * restored. Instead use `visibility: hidden`, `opacity: 0`, or a
 * [Substitution]{@link Substitution} to hide an ImageGallery when that's
 * necessary.
 *
 * @class ImageGallery
 * @extends Component
 */
exports.ImageGallery = Component.specialize(/** @lends ImageGallery# */ {

    images: {
        get: function () {
            return this._images;
        },
        set: function (value) {
            if (value !== this._images) {
                this._images = value;
                this._currentImageIndex = null;
                this.scroll = 0;
            }
        }
    },

    scroll: {
        get: function () {
            return this._flow && this._flow.scroll || 0;
        },
        set: function (value) {
            if (this._flow && this._flow.scroll !== value) {
                this._flow.scroll = value;
            } else {
                this._scroll = value;
            }
        }
    },

    _scroll: {
        set: function (value) {
            var index = value ? Math.round(value) : 0;
            if (index !== this._currentImageIndex) {
                this.dispatchBeforeOwnPropertyChange("currentImageIndex", this.currentImageIndex);
                this.dispatchBeforeOwnPropertyChange("scroll", this.currentImageIndex);
                this._currentImageIndex = index;
                this.dispatchOwnPropertyChange("scroll", index);
                this.dispatchOwnPropertyChange("currentImageIndex", index);
                this._isCurrentImageFirst = (this.currentImageIndex < 1);
                this._isCurrentImageLast = (!this.images || (this.currentImageIndex === this.images.length - 1));
            }
        }
    },

    currentImageIndex: {
        get: function () {
            return this._currentImageIndex || 0;
        }
    },

    scrollToImageIndex: {
        value: function (index) {
            this._flow.startScrollingIndexToOffset(index, 0);
        }
    },

    handlePreviousAction: {
        value: function () {
            this._flow.startScrollingIndexToOffset(this.currentImageIndex - 1, 0);

        }
    },

    handleNextAction: {
        value: function () {
            this._flow.startScrollingIndexToOffset(this.currentImageIndex + 1, 0);
        }
    }

});
