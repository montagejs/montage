/* global DataTransfer */

var EventPrototype = Event.prototype,
    propertyDescriptor = Object.getPropertyDescriptor(EventPrototype, "target");

if (typeof DataTransfer !== "undefined") {
    var DataTransferPrototype = DataTransfer.prototype,
        oldSetDragImage = DataTransferPrototype.setDragImage;

    Object.defineProperties(DataTransferPrototype, {

        effectAllowed: {
            value: 'none',
            writable: true
        },

        dropEffect: {
            value: 'none',
            writable: true
        },

        dragEffect: {
            value: 'default',
            writable: true
        },

        _dragImage: {
            value: null,
            writable: true,
            enumerable: false
        },

        setDragImage: {
            value: function (img, xOffset, yOffset) {
                if (!this._dragImage) {
                    this._dragImage = img;
                    oldSetDragImage.call(this, img, xOffset, yOffset);
                }    
            }
        },

        getDragImage: {
            value: function (img, xOffset, yOffset) {    
                return this._dragImage;
            }
        },

        _candidateDropTargets: {
            value: null,
            writable: true,
            enumerable: false
        },

        candidateDropTargets: {
            get: function () {
                return this._candidateDropTargets || 
                    (this._candidateDropTargets = new Set());
            }
        }
        
    });
}
