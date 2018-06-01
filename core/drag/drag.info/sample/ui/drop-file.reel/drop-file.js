/**
 * @module ui/drop-file.reel
 */
var Component = require("montage/ui/component").Component;

/**
 * @class DropFile
 * @extends Component
 */
exports.DropFile = Component.specialize(/** @lends DropFile# */ {

    fileName: {
        value: null
    },

    enterDocument: {
        value: function () {
            this.fileName = 
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
            return !!(draggingOperationInfo.data.has('types') && 
                draggingOperationInfo.data.get('types').indexOf('Files') > -1);
        }
    },

    performDragOperation: {
        value: function (draggingOperationInfo) {
            console.log(draggingOperationInfo.data.get("files"));
            this.fileName = draggingOperationInfo.data.get("files")[0].name;
        }
    }
});
