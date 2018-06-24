var Montage = require("../core").Montage;

exports.DraggingOperationContext = Montage.specialize({

    draggable: {
        value: null
    },

    draggedImage: {
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

    showPlaceholder: {
        value: false
    },

    dragEffect: {
        value: null
    },

    dropEffect: {
        value: null
    },

    effectAllowed: {
        value: null
    },

    dataTransfer: {
        value: null
    },

    hasBeenDrop: {
        value: false
    },

    dragTarget: {
        value: null
    },

    currentDropTarget: {
        value: null
    },

    _isDragging: {
        value: false
    }

});
