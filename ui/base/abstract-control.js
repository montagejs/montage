/*global require, exports, document, Error*/

/**
 * @module montage/ui/base/abstract-control
 * @requires montage/ui/component
 * @requires collections/dict
 */
var Component = require("../component").Component,
    Dict = require("collections/dict");

/**
 * @class AbstractControl
 * @classdesc A basis for common behavior of control components.
 * @extends Component
 */
exports.AbstractControl = Component.specialize( /** @lends AbstractControl.prototype # */ {

    /**
     * Dispatched when the button is activated through a mouse click, finger
     * tap, or when focused and the spacebar is pressed.
     *
     * @event AbstractControl#action
     * @type {Event}
     * @property {Dict} detail - pass custom data in this property
     */

    /**
     * @function
     * @fires AbstractControl#action
     */
    dispatchActionEvent: {
        value: function () {
            return this.dispatchEvent(this.createActionEvent());
        }
    },

    /**
     * @private
     * @property {Dict} value
     * @default null
     */
    _detail: {
        value: null
    },

    /**
     * The data property of the action event.
     *
     * Example to toggle the complete class: `"detail.get('selectedItem')" : {
     * "<-" : "@repetition:iteration.object"}`
     *
     * @returns {Dict}
     */
    detail: {
        get: function () {
            if (this._detail == null) {
                this._detail = new Dict();
            }
            return this._detail;
        }
    },

    /**
     * Overrides {@link Component#createActionEvent}
     * by adding {@link AbstractControl#detail} custom data
     *
     * @function
     * @returns {AbstractControl#action}
     */
    createActionEvent: {
        value: function () {
            var actionEvent = document.createEvent("CustomEvent"),
                eventDetail;

            eventDetail = this._detail;
            actionEvent.initCustomEvent("action", true, true, eventDetail);
            return actionEvent;
        }
    }
});
