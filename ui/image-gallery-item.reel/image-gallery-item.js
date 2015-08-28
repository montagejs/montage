var Component = require("ui/component").Component;

/**
 * @class ImageGalleryItem
 * @extends Component
 */
exports.ImageGalleryItem = Component.specialize(/** @lends ImageGalleryItem# */ {

    _src: {
        value: null
    },

    src: {
        set: function (value) {
            if (value) {
                if (this._src !== value) {
                    this._src = value;
                    this.needsDraw = true;
                }
            }
        }
    },

    draw: {
        value: function () {
            if (this._src) {
                this._element.style.backgroundImage = "url(" + this._src + ")";
            }
        }
    }

});
