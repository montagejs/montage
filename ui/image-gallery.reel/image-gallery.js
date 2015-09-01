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

    _scroll: {
        set: function (value) {
            var index = value ? Math.round(value) : 0;
            if (index !== this._currentImageIndex) {
                this.dispatchBeforeOwnPropertyChange("currentImageIndex", this.currentImageIndex);
                this._currentImageIndex = index;
                this.dispatchOwnPropertyChange("currentImageIndex", index);
                this._isCurrentImageFirst = (this.currentImageIndex < 1);
                this._isCurrentImageLast = (!this.images || (this.currentImageIndex === this.images.length - 1));
            }
        }
    },

    images: {
        get: function () {
            return this._images;
        },
        set: function (value) {
            if (value !== this._images) {
                this._images = value;
                this._currentImageIndex = null;
                if (this._flow) {
                    this._flow.scroll = 0;
                } else {
                    this._scroll = 0;
                }
            }
        }
    },

    currentImageIndex: {
        get: function () {
            return this._currentImageIndex || 0;
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
