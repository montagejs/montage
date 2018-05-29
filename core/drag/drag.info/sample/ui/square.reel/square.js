/**
 * @module ui/square.reel
 */
var Component = require("montage/ui/component").Component,
    DragManager = require("montage/core/drag/drag-manager").DragManager;

/**
 * @class Square
 * @extends Component
 */
exports.Square = Component.specialize(/** @lends Square# */ {

    enableMoveOperation: {
        value: false
    },

    enableVisiblePlaceholder: {
        value: false
    },

    secret: {
        value: null
    },

    enterDocument: {
        value: function () {
            this.registerForDragSource();
        }
    },

    exitDocument: {
        value: function () {
            this.unregisterForDragSource();
        }
    },

    beginDraggingOperation: {
        value: function (draggingOperationInfo) {
            if (this.enableMoveOperation) {
                draggingOperationInfo.draggingOperationType = DragManager.DragOperationMove;
            }

            if (this.enableVisiblePlaceholder) {
                draggingOperationInfo.draggingSourcePlaceholderStrategy = (
                    DragManager.DraggingSourcePlaceholderStrategyVisible
                );
            }
            
            if (this.secret) {
                draggingOperationInfo.data.set("secret", this.secret);
            }
        }
    }

});
