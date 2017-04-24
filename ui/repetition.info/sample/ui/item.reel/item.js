/**
 * @module ui/version.reel
 */
var Component = require("montage/ui/component").Component;

/**
 * @class Item
 * @extends Component
 */
exports.Item = Component.specialize(/** @lends Item# */ {
	_value: {
        value: null
    },

    /**
     * The string to be displayed. `null` is equivalent to the empty string.
     * @type {string}
     * @default null
     */
    value: {
        get: function () {
            return this._value;
        },
        set: function (value) {
            if (this._value !== value) {
                this._value = value;
                this.needsDraw = true;
            }
        }
    },

    enterDocument: {
       value: function () {
         
       }
   	},

   	prepareForActivationEvents: {
       value: function() {
          // http://stackoverflow.com/questions/17012375/how-to-transfer-the-whole-element-using-html5-event-datatransfer
          this._element.setAttribute('draggable', 'true');
          this._element.addEventListener("dragstart", this, false);
          this._element.addEventListener("dragend", this, false);
       }
   	},

   	handleDragstart: {
       value: function (event) {
          console.log("handleDragStart", event);
          event.dataTransfer.effectAllowed = "move";
       }
   	},

    handleDragend: {
       value: function (event) {
           console.log("handleDragend", event);
           console.log(event.dataTransfer.getData('target'));
       }
    }
});