/**
 * @module ui/drop-inner.reel
 */
var Component = require("montage/ui/component").Component;

/**
 * @class DropInner
 * @extends Component
 */
exports.DropInner = Component.specialize(/** @lends DropInner# */ {

    enterDocument: {
        value: function () {
            this.data = [];
            this.registerForDragDestination();
        }
    },

    exitDocument: {
        value: function () {
            this.unregisterForDragDestination();
        }
    },

    draggingStarted: {
        value: function (draggingOperationInfo) {
           return true;
        }
    },

    performDropOperation: {
        value: function (draggingOperationInfo) {
            console.log('dropzone inner received dragging operation');
        }
    }

});
