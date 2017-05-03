var Component = require("montage/ui/component").Component;

/**
 * @class Main
 * @extends external:Component
 */
exports.Main = Component.specialize(/** @lends Main# */ {

    /*
     * Note: The fifth image of this sample is deliberately set to an invalid
     * image path to allow testing of ImageGallery's handling of image loading
     * errors.
     */

    _gallery: { // Set in serialization.
        get: function () {
            return this.__gallery;
        },
        set: function (gallery) {
            var images = [];
            this.__gallery = gallery;
            if (this.__gallery) {
                // Simulates lazy loading of images.
                this.__gallery.images = images;
                setTimeout(function () {
                    images.splice(
                        0, images.length,
                        "ui/main.reel/asset/cezanne.jpg",
                        "ui/main.reel/asset/gaugin.jpg",
                        "ui/main.reel/asset/monet.jpg",
                        "ui/main.reel/asset/renoir.jpg",
                        "image_that_can_not_be_loaded",
                        "ui/main.reel/asset/seurat.jpg"
                    );
                }, 0);
            }
        }
    },

    _isSliderActive: { // Bound in serialization.
        get: function () {
            return this.__isSliderActive || false;
        },
        set: function (isActive) {
            isActive = isActive ? true : false;
            if (isActive !== this._isSliderActive) {
                this.__isSliderActive = isActive;
                if (!isActive) {
                    this._gallery.scrollToImageIndex(this._gallery.currentImageIndex);
                }
            }
        }
    }

});
