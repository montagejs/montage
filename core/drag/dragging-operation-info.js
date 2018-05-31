var Montage = require("../core").Montage;

// name -> DraggingOperationContext?
exports.DraggingOperationInfo = Montage.specialize({

    dragSource: {
        value: null
    },

    draggedImage: {
        set: function (image) {
            if (!this.isDraggOperationStarted) {
                this._draggedImage = image;
            }
        },
        get: function () {
            return this._draggedImage;
        }
    },

    isDraggOperationStarted: {
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

    dragSourcePlaceholderStrategy: {
        value: 0 // default DragSourcePlaceholderStrategyHidden
    },
    
    dragOperationType: {
        value: 0 // default DragOperationCopy
    },

    _dragSourceContainer: {
        value: null
    },

    dragSourceContainer: {
        set: function (element) {
            if (element instanceof Element) {
                this._dragSourceContainer = element;
            } else if (element.element instanceof Element) {
                this._dragSourceContainer = element.element;
            }
        },
        get: function () {
            return this._dragSourceContainer;
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
    },

    dragDestination: {
        value: null
    }

});
