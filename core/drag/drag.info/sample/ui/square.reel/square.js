/**
 * @module ui/square.reel
 */
var Component = require("montage/ui/component").Component;

/**
 * @class Square
 * @extends Component
 */
exports.Square = Component.specialize(/** @lends Square# */ {

    enableMoveOperation: {
        value: false
    },

    enableVisiblePlaceholder: {
        value: false
    },

    enterDocument: {
        value: function () {
            this.registerDraggable();
            this.addEventListener("dragstart", this, false);
        }
    },

    exitDocument: {
        value: function () {
            this.removeEventListener("dragstart", this, false);
            this.unregisterDraggable();
        }
    },

    handleDragstart: {
        value: function (event) {
            if (this.enableMoveOperation) {
                event.dataTransfer.effectAllowed = "move";
                event.dataTransfer.dragEffect = "move";
            } else {
                event.dataTransfer.effectAllowed = "all";
            }
            

            if (this.container) {
                this.draggableContainer = this.container;
            } else {
                this.draggableContainer = null;
            }

            if (this.enableVisiblePlaceholder) {
                event.dataTransfer.draggablePlaceholderStrategy = "visible";
            }
            
            event.dataTransfer.setData("text/plain", this.value);

            if (this.switchDraggedImage) {
                var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg'),
                    circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');

                circle.setAttributeNS(null, 'cx', 25);
                circle.setAttributeNS(null, 'cy', 25);
                circle.setAttributeNS(null, 'r', 25);
                circle.setAttributeNS(null, 'style', 'fill: #e74c3c;');
                svg.appendChild(circle);
                event.dataTransfer.setDragImage(svg, 50, 50);
            }
        }
    }

});
