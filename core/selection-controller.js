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
     * This is just a placeholder for possible isMultipleSelectionAllowed property
     * TODO implement API
     * @type {boolean}
     */
    isMultipleSelectionAllowed: {
        value: false
    },

    /**
     * This is just a placeholder for possible selection property
     * TODO implement API
     * @type {[object]}
     */
    selection: {
        value: []
    }

});
