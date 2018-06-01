/**
 * @module ui/drop-inner.reel
 */
var Component = require("montage/ui/component").Component,
    DraggingOperationType = require("montage/core/drag/dragging-operation-type").DraggingOperationType;

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

    draggingEntered: {
        value: function (draggingOperationInfo) {
            draggingOperationInfo.dropEffect = DraggingOperationType.Move;
        }
    },

    performDragOperation: {
        value: function (draggingOperationInfo) {
            console.log('dropzone inner received dragging operation');
        }
    }

});
