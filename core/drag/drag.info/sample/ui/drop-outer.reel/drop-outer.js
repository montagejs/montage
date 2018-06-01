/**
 * @module ui/drop-outer.reel
 */
var Component = require("montage/ui/component").Component,
    DraggingOperationType = require("montage/core/drag/dragging-operation-type").DraggingOperationType;

/**
 * @class DropOuter
 * @extends Component
 */
exports.DropOuter = Component.specialize(/** @lends DropOuter# */ {

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
            draggingOperationInfo.dropEffect = DraggingOperationType.Link;
        }
    },

    performDragOperation: {
        value: function (draggingOperationInfo) {
            console.log('dropzone outer received dragging operation');
        }
    }

});
