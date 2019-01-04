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

    droppable: {
        value: true
    },

    enterDocument: {
        value: function () {
            this.application.addEventListener("dragstart", this);
        }
    },

    exitDocument: {
        value: function () {
            this.application.removeEventListener("dragstart", this);
        }
    },

    handleDragstart: {
        value: function (event) {
            var shouldAccept = !!(event.dataTransfer.types && 
            event.dataTransfer.types.indexOf('Files') > -1);
            
            if (shouldAccept) {
                event.dataTransfer.dropTargetCandidates.add(this);
                this._addEventListeners();
            }
        }
    },

    handleDrop: {
        value: function (event) {
            console.log(event.dataTransfer.files);
            this.fileName = event.dataTransfer.files[0].name;
        }
    },

    handleDragended: {
        value: function (event) {
            this._removeEventListeners();
        }
    },

    _addEventListeners: {
        value: function () {
            this.application.addEventListener("dragend", this);
            this.addEventListener("drop", this);
        }
    },

    _removeEventListeners: {
        value: function () {
            this.application.removeEventListener("dragend", this);
            this.removeEventListener("drop", this);
        }
    }

});
