/*global require, exports, document, Error*/
var Montage = require("montage").Montage,
    Component = require("ui/component").Component,
    Dict = require("collections/dict");

/**
 * @class AbstractControl
 * @classdesc A basis for common behavior of control components.
 * @extends Component
 */
exports.AbstractControl = Component.specialize( /** @lends AbstractControl# */ {

    dispatchActionEvent: {
        value: function() {
            return this.dispatchEvent(this.createActionEvent());
        }
    },

    _detail: {
        value: null
    },

    /**
     * The data property of the action event.
     *
     * Example to toggle the complete class: `"detail.get('selectedItem')" : {
     * "<-" : "@repetition:iteration.object"}`
     * @type {Dict}
     * @default null
     */
    detail: {
        get: function() {
            if (this._detail == null) {
                this._detail = new Dict();
            }
            return this._detail;
        }
    },

    createActionEvent: {
        value: function() {
            var actionEvent = document.createEvent("CustomEvent"),
                eventDetail;

            eventDetail = this._detail;
            actionEvent.initCustomEvent("action", true, true, eventDetail);
            return actionEvent;
        }
    }
});
