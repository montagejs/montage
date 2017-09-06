/**
 * @module montage/core/event/action-event-listener
 * @requires montage/core/core
 */
var Montage = require("../core").Montage;

/**
 * @class ActionEventListener
 * @extends Montage
 */
var ActionEventListener = exports.ActionEventListener = Montage.specialize( /** @lends ActionEventListener.prototype # */ {

    /**
     * The logical object handling received events
     * @type {Object}
     * @default null
     */
    handler: {
        value: null
    },

    /**
     * The name of the method to invoke on the handler object, or a function to
     * call with the handler as its context.
     *
     * If there is no handler set, the function is invoked with this
     * actionEventListener as the context.
     *
     * If neither handler nor action is set, the event is ignored.
     *
     * @property {String|Function} value
     * @default null
     *
     */
    action: {
        value: null
    },

    /**
     * Returns a new ActionEventListener instance with the specified handler
     * and action.
     *
     * @function
     * @param {Object} handler - The event handler
     * @param {String|Function} action - The event handler action
     * @returns {ActionEventListener} - The initialized ActionEventListener
     * */
    initWithHandler_action_: {
        value: function (handler, action) {
            this.handler = handler;
            this.action = action;
            return this;
        }
    },

    /**
     * @function
     * @param {Event} event
     */
    handleEvent: {
        value: function (event) {
            if (typeof this.action === "function") {
                var context = this.handler ? this.handler : this;
                this.action.call(context, event);
            } else if (this.handler && this.action) {
                this.handler[this.action](event);
            }
        }
    },

    /**
     * @function
     * @param {Serializer} serializer
     */
    serializeProperties: {
        value: function (serializer) {
            serializer.set("handler", this.handler, "reference");
            // TODO accepting an actual function is less than ideal from the
            // serialization standpoint
            serializer.set("action", this.action);
        }
    }

}, {
    objectDescriptorModuleId: require("../core")._objectDescriptorModuleIdDescriptor,
    objectDescriptor: require("../core")._objectDescriptorDescriptor
});

