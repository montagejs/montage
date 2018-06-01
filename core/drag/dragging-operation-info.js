var Montage = require("../core").Montage,
    DraggingOperationType = require("./dragging-operation-type").DraggingOperationType;

// name -> DraggingOperationContext?
var DraggingOperationInfo = exports.DraggingOperationInfo = Montage.specialize({

    dragSource: {
        value: null
    },

    _draggedImage: {
        value: null
    },

    draggedImage: {
        set: function (image) {
            if (!this.isDragOperationStarted) {
                this._draggedImage = image;
            }
        },
        get: function () {
            return this._draggedImage;
        }
    },

    isDragOperationStarted: {
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
    
    _dropEffect: {
        value: null
    },

    dropEffect: {
        set: function (effect) {
            if (
                effect && 
                DraggingOperationType.ALLOWED_EFFECTS.indexOf(effect) > -1 &&
                DraggingOperationInfo.isDropEffectAllowed(
                    effect, this.dropEffectAllowed
                )
            ) {
                this._dropEffect = effect;
            } else {
                this._dropEffect = null;
            }
        }, 
        get: function () {
            if (!this._dropEffect) {
                var index;

                if (
                    this.dropEffectAllowed === DraggingOperationType.All || 
                    this.dropEffectAllowed.startsWith('c')
                ) {
                    this._dropEffect = DraggingOperationType.Copy;
                } else if ((index = DraggingOperationType.ALLOWED_EFFECTS.indexOf(
                    this.dropEffectAllowed)) > -1
                ) {
                    this._dropEffect = DraggingOperationType.ALLOWED_EFFECTS[index];
                } else {
                    this._dropEffect = DraggingOperationType.Link;
                }
            }

            return this._dropEffect;
        }
    },

    _dragEffect: {
        value: null
    },

    dragEffect: {
        set: function (effect) {
            if (
                !this.isDragOperationStarted && 
                DraggingOperationType.ALLOWED_EFFECTS.indexOf(effect) > -1
            ) {
                this._dragEffect = effect;
            }
        }, 
        get: function () {
            return this._dragEffect || DraggingOperationType.Default;
        }
    },

    _dropEffectAllowed: {
        value: null
    },

    dropEffectAllowed: {
        set: function (effect) {
            if (
                !this.isDragOperationStarted && 
                DraggingOperationType.ALLOWED_DROP_EFFECTS.indexOf(effect) > -1
            ) {
                this._dropEffectAllowed = effect;
            }
        }, 
        get: function () {
            return this._dropEffectAllowed || DraggingOperationType.All;
        }
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

}, {

    isDropEffectAllowed: {
        value: function (effect, effectAllowed) {
            return effectAllowed === DraggingOperationType.All ||
                effect === effectAllowed ||
                (effect === DraggingOperationType.Copy && 
                    (
                        effectAllowed === DraggingOperationType.CopyMove || 
                        effectAllowed === DraggingOperationType.CopyLink
                    )
                ) ||
                (effect === DraggingOperationType.Move && 
                    (
                        effectAllowed === DraggingOperationType.CopyMove || 
                        effectAllowed === DraggingOperationType.LinkMove
                    )
                ) ||
                (effect === DraggingOperationType.Link && 
                    (
                        effectAllowed === DraggingOperationType.LinkMove || 
                        effectAllowed === DraggingOperationType.CopyLink
                    )
                );
        }
    }

});
