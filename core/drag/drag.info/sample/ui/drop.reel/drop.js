/**
 * @module ui/drop.reel
 */
var Component = require("montage/ui/component").Component,
    DragManager = require("montage/core/drag/drag-manager").DragManager,
    DraggingOperationType = require("montage/core/drag/dragging-operation-type").DraggingOperationType;

/**
 * @class Drop
 * @extends Component
 */
exports.Drop = Component.specialize(/** @lends Drop# */ {

    dataSource: {
        value: null
    },

    data: {
        value: null
    },

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
            if (draggingOperationInfo.dragSource) {
                var value = draggingOperationInfo.dragSource.value;
                return value && this.data.indexOf(value) === -1 && 
                    this.dataSource.indexOf(value) > -1;
            }
            return false;
        }
    },

    performDragOperation: {
        value: function (draggingOperationInfo) {
            if (draggingOperationInfo.dragSource) {
                console.log(
                    draggingOperationInfo.dragSource.identifier + 
                    ': ' + draggingOperationInfo.data.get('secret')
                );
    
                var value = draggingOperationInfo.dragSource.value;
    
                if (value && this.data.indexOf(value) === -1) {
                    this.data.push(value);
    
                    if (
                        draggingOperationInfo.dragEffect === 
                        DraggingOperationType.Move
                    ) {
                        var index;
    
                        if (
                            this.dataSource && 
                            (index = this.dataSource.indexOf(value)) > -1
                        ) {
                            this.dataSource.splice(index, 1);
                        }
                    }
                }
            }
        }
    }

});
