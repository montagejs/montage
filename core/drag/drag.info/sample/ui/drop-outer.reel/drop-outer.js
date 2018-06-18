/**
 * @module ui/drop-outer.reel
 */
var Component = require("montage/ui/component").Component;

/**
 * @class DropOuter
 * @extends Component
 */
exports.DropOuter = Component.specialize(/** @lends DropOuter# */ {

    enterDocument: {
        value: function () {
            this.registerDroppable();
            this.application.addEventListener("dragstart", this, false);
        }
    },

    exitDocument: {
        value: function () {
            this.unregisterDroppable();
            this.application.removeEventListener("dragstart", this, false);
        }
    },

    handleDragstart: {
        value: function (event) {
            event.dataTransfer.candidateDropTargets.add(this);
            this._addEventListeners();
        }
    },

    handleDragenter: {
        value: function (event) {
            event.stopPropagation();
            event.dataTransfer.dropEffect = "alias";
        }
    },

    handleDrop: {
        value: function (event) {
            event.stopPropagation();
            console.log('dropzone outer received drop');
        }
    },

    handleDragended: {
        value: function (event) {
            this._removeEventListeners();
        }
    },

    _addEventListeners: {
        value: function () {
            this.addEventListener("dragenter", this);
            this.addEventListener("dragended", this);
            this.addEventListener("drop", this);
        }
    },

    _removeEventListeners: {
        value: function () {
            this.removeEventListener("dragenter", this);
            this.removeEventListener("dragended", this);
            this.removeEventListener("drop", this);
        }
    }

});
