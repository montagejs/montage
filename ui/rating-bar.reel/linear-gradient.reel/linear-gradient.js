/**
 * @module ui/linear-gradient.reel
 * @requires montage/ui/component
 */
var Component = require("ui/component").Component;

/**
 * @class LinearGradient
 * @extends Component
 */
exports.LinearGradient = Component.specialize(/** @lends LinearGradient# */ {


    _linearGradientElement: {
        value: null
    },


    _firstStopElement: {
        value: null
    },


    _lastStopElement: {
        value: null
    },


    _firstStopOffset: {
        value: 0
    },


    firstStopOffset: {
        set: function (value) {
            if (!isNaN(value)) {
                this._firstStopOffset = Math.round(value);
                this.needsDraw = true;
            }
        },
        get: function () {
            return this._firstStopOffset;
        }
    },


    _lastStopOffset: {
        value: 0
    },


    lastStopOffset: {
        set: function (value) {
            if (!isNaN(value)) {
                this._lastStopOffset = Math.round(value);
                this.needsDraw = true;
            }
        },
        get: function () {
            return this._lastStopOffset;
        }
    },


    enterDocument: {
        value: function (firstTime) {
            if (firstTime) {
                // id needed for filling the ratingBarItem svg element.
                this._linearGradientElement.setAttribute("id", this.uuid);
            }
        }
    },


    draw: {
        value: function () {
            this._firstStopElement.setAttribute("offset", this._firstStopOffset + "%");
            this._lastStopElement.setAttribute("offset", this._lastStopOffset + "%");
        }
    }

});
