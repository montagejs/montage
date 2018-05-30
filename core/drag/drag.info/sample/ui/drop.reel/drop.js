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
            var value = draggingOperationInfo.source.value;
            return value && this.data.indexOf(value) === -1 && 
                this.dataSource.indexOf(value) > -1;
        }
    },

    performDropOperation: {
        value: function (draggingOperationInfo) {
            console.log(
                draggingOperationInfo.source.identifier + 
                ': ' + draggingOperationInfo.data.get('secret')
            );

            var value = draggingOperationInfo.source.value;

            if (value && this.data.indexOf(value) === -1) {
                this.data.push(value);

                if (draggingOperationInfo.draggingOperationType === DragManager.DragOperationMove) {
                    var index;

                    if (this.dataSource && (index = this.dataSource.indexOf(value)) > -1) {
                        this.dataSource.splice(index, 1);
                    }
                }
            }
        }
    }

});
