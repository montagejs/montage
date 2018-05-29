var Montage = require("../core").Montage;

// name -> DraggingOperationContext?
exports.DraggingOperationInfo = Montage.specialize({

    source: {
        value: null
    },

    draggingImage: {
        value: null
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
