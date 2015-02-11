/**
 * @module core/selection-controller
 */
var Montage = require("montage").Montage;

/**
 * @class SelectionController
 * @extends external:Montage
 */
exports.SelectionController = Montage.specialize(/* @lends SelectionController.prototype */ {
    constructor: {
        value: function SelectionController() {
            this.super();
        }
    },

    /**
     * @type {boolean}
     */
    isMultipleSelectionAllowed: {
        value: false
    },

    /**
     * @type {[object]}
     */
    selection: {
        value: []
    }

});