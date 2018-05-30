var Montage = require("../core").Montage;

// name -> DraggingOperationContext?
exports.DraggingOperationInfo = Montage.specialize({

    source: {
        value: null
    },

    draggedImage: {
        set: function (image) {
            if (!this.isDragging) {
                this._draggedImage = image;
            }
        },
        get: function () {
            return this._draggedImage;
        }
    },

    isDragging: {
        value: false
    },

    startPositionX: {
        value: 0
    },

    startPositionY: {
        value: 0
    },

    positionX: {
        value: 0
    },

    positionY: {
        value: 0
    },

    deltaX: {
        value: 0
    },

    deltaY: {
        value: 0
    },

    draggingSourcePlaceholderStrategy: {
        value: 0 // default DraggingSourcePlaceholderStrategyHidden
    },
    
    draggingOperationType: {
        value: 0 // default DragOperationCopy
    },

    _draggingSourceContainer: {
        value: null
    },

    draggingSourceContainer: {
        set: function (element) {
            if (element instanceof Element) {
                this._draggingSourceContainer = element;
            } else if (element.element instanceof Element) {
                this._draggingSourceContainer = element.element;
            }
        },
        get: function () {
            return this._draggingSourceContainer;
        }
    },

    _data: {
        value: null
    },

    data: {
        get: function () {
            return this._data || (this._data = new Map());
        }
    },

    hasBeenDrop: {
        value: false
    }

});
