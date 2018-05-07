var Montage = require("core/core").Montage;

/**
 * Represents
 *
 * @class
 * @extends external:Montage
 */
exports.RawDataOperation = Montage.specialize(/** @lends DataOperation.prototype */ {

    /***************************************************************************
     * Constructor
     */

    constructor: {
        value: function RawDataOperation() {
            this.time = Date.now();
            this._index = exports.RawDataOperation.prototype._currentIndex + 1 || 0;
            exports.RawDataOperation.prototype._currentIndex = this._index;
        }
    },

    data: {
        value: undefined,
        serializable: "value"
    },

    objectDescriptorModule: {
        value: undefined,
        serializable: "value"
    },

    serviceModule: {
        value: undefined,
        serializable: "value"
    },

    type: {
        value: undefined,
        serializable: "value"
    }


});

