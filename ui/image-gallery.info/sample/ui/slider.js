var AbstractSlider = require("montage/ui/base/abstract-slider").AbstractSlider;

exports.Slider = AbstractSlider.specialize(/** @lends Slider.prototype */ {

    hasTemplate: {
        value: false
    }

});
