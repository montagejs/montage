/**
 * @module ui/caption.reel
 */
var Component = require("montage/ui/component").Component;

/**
 * @class Caption
 * @extends Component
 */
exports.Caption = Component.specialize(/** @lends Caption# */ {

    captionCodeElement: {
        value: null
    },

    _caption: {
        value: null
    },

    caption: {
        get: function () {
            return this._caption;
        },
        set: function (caption) {
            if (caption !== this._caption) {
                this._caption = caption;

                if (caption) {
                    this._color = caption.color;
                }
            }
        }
    },

    __color: {
        value: null
    },

    _color: {
        get: function () {
            return this.__color;
        },
        set: function (color) {
            if (color !== this.__color) {
                this.__color = color;
                this.needsDraw = true;
            }
        }
    },

    draw: {
        value: function () {
            if (this._color) {
                this.captionCodeElement.style.backgroundColor = "#" + this._color;
            }
        }
    }
});
