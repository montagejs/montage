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
        value: undefined
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
