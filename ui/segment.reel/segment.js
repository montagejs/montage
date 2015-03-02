"use strict";

/**
 * @module "ui/segmented-bar.reel/segment.reel"
 * @requires montage/ui/component
 */
var Component = require("ui/component").Component;

/**
 * @class Segment
 *
 * A `Segment` to be used inside a {@link SegmentedBar}.
 * Each `Segment`'s `length` is a percentage of the entire `SegmentedBar`. Can optional have a `label`.
 *
 * @extends Component
 */
exports.Segment = Component.specialize( /** @lends Segment.prototype */ {
    /**
     * @private
     */
    _label: {value: null},

    /**
     * Text label for each `Segment`. Bound to `Text` component in template.
     *
     * @property {String} label - optional
     */
    label: {
        get: function () {return this._label},
        set: function (label) {
            if (label !== this._label) {
                this._label = label;
                this.needsDraw = true;
            }
        }
    },

    /**
     * @private
     */
    _length: {value: null},

    /**
     * Used to draw `Segment` length using Flexbox.
     *
     * @property {Number} newData.length
     */
    length: {
        get: function () {return this._length},
        set: function (length) {
            if (length !== this._length) {
                this._length = length;
                this.needsDraw = true;
            }
        }
    },

    /**
     * Redraw based on updated length.
     *
     * @function
     */
    draw: {
        value: function () {
            if (this.length) {
                // Autoprefixer > 1%, last 2 versions, Firefox ESR, Opera 12.1
                this.element.style.webkitBoxFlex = this.length;
                this.element.style.webkitFlex = this.length;
                this.element.style.msFlex = this.length;
                this.element.style.flex = this.length;
            }
        }
    }
});
