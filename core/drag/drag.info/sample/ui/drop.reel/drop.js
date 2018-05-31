/**
 * @module ui/drop.reel
 */
var Component = require("montage/ui/component").Component,
    DragManager = require("montage/core/drag/drag-manager").DragManager;

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
            var value = draggingOperationInfo.dragSource.value;
            return value && this.data.indexOf(value) === -1 && 
                this.dataSource.indexOf(value) > -1;
        }
    },

    performDragOperation: {
        value: function (draggingOperationInfo) {
            console.log(
                draggingOperationInfo.dragSource.identifier + 
                ': ' + draggingOperationInfo.data.get('secret')
            );

            var value = draggingOperationInfo.dragSource.value;

            if (value && this.data.indexOf(value) === -1) {
                this.data.push(value);

                if (draggingOperationInfo.dragOperationType === DragManager.DragOperationMove) {
                    var index;

                    if (this.dataSource && (index = this.dataSource.indexOf(value)) > -1) {
                        this.dataSource.splice(index, 1);
                    }
                }
            }
        }
    }

});
