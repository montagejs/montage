/**
 * @module ui/version.reel
 */
var Component = require("montage/ui/component").Component;

/**
 * @class Item
 * @extends Component
 */
exports.ItemsSelected = Component.specialize(/** @lends Item# */ {
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
          // https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API/Drag_operations#drop
          this._element.addEventListener("drop", this, false);
          this._element.addEventListener("dragenter", this, false);
          this._element.addEventListener("dragleave", this, false);
          this._element.addEventListener("dragover", this, false);
       }
    },

    handleDrop: {
       value: function (event) {
           console.log("handleDrop", event);
           event.preventDefault();
       }
    },

    handleDragenter: {
       value: function (event) {
           console.log("handleDragenter", event);
       }
    },

    handleDragleave: {
       value: function (event) {
           console.log("handleDragleave", event);
       }
    },

    handleDragover: {
       value: function (event) {
          event._currentTarget.setAttribute('id', Date.now());
          event.dataTransfer.dropEffect = "move"
          event.dataTransfer.setData('target', event._currentTarget.getAttribute('id'));
          event.preventDefault();

          console.log("handleDragover", event);
       }
    }
});