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
            this._images = this._images || [];
            return this._images;
        },
        set: function (value) {
            if (value ? value !== this._images : this._images) {
                this._images = value;
                this.scroll = 0;
            }
        }
    },

    scroll: {
        get: function () {
            return this._flow ? this._flow.scroll : this._flowScroll;
        },
        set: function (value) {
            value = Number(value) || 0;
            if (!this._flow) {
                this._flowScroll = value;
            } else if (value !== this._flow.scroll) {
                this._flow.scroll = value;
            }
        }
    },

    _flowScroll: {
        get: function () {
            return this.__flowScroll || 0;
        },
        set: function (value) {
            value = Number(value) || 0;
            if (Math.round(value) !== this.currentImageIndex) {
                this.dispatchBeforeOwnPropertyChange("scroll", this._flowScroll);
                this.dispatchBeforeOwnPropertyChange("currentImageIndex", this.currentImageIndex);
                this.__flowScroll = value;
                this.dispatchOwnPropertyChange("currentImageIndex", this.currentImageIndex);
                this.dispatchOwnPropertyChange("scroll", this._flowScroll);
            } else if (value ? value !== this.__flowScroll : this.__flowScroll) {
                this.dispatchBeforeOwnPropertyChange("scroll", this._flowScroll);
                this.__flowScroll = value;
                this.dispatchOwnPropertyChange("scroll", this._flowScroll);
            }
        }
    },

    currentImageIndex: {
        get: function () {
            return Math.round(this._flowScroll);
        }
    },

    scrollToImageIndex: {
        value: function (index) {
            if (this._flow) {
                this._flow.startScrollingIndexToOffset(index, 0);
            }
        }
    },

    handlePreviousAction: {
        value: function () {
            this.scrollToImageIndex(this.currentImageIndex - 1);

        }
    },

    handleNextAction: {
        value: function () {
            this.scrollToImageIndex(this.currentImageIndex + 1);
        }
    }

});
