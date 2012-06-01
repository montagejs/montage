/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
/**
 @module montage/core/event/action-event-listener
 @requires montage/core/core
 */
var Montage = require("montage").Montage;

/**
 @class module:montage/core/event/action-event-listener.ActionEventListener
 @extends module:montage/core/core.Montage
 */
var ActionEventListener = exports.ActionEventListener = Montage.create(Montage, /** @lends module:montage/core/event/action-event-listener.ActionEventListener# */ {

/**
    The object to handle the event.
    @type {Property}
    @default {Event handler} null
*/
    handler: {
        value: null,
        serializable: true
    },

/**
    The action (function) to invoke on the handler object.
    @type {Property}
    @default {Event handler} null
*/
    action: {
        value: null,
        serializable: true
    },

/**
    Returns a new ActionEventListener instance with the specified handler and action.
    @function
    @param {Event} handler The event handler.
    @param {Event} action The event handler action.
    @returns itself
*/
    initWithHandler_action_: {
        value: function(handler, action) {
            this.handler = handler;
            this.action = action;

            return this;
        }
    },

/**
    @private
*/
    handleEvent: {
        value: function(event) {
            if (typeof this.action === "function") {
                // TODO call this in what context?
                this.action(event);
            } else {
                this.handler[this.action](event);
            }
        }
    },

/**
    @private
*/
    serializeProperties: {
        value: function(serializer) {
            serializer.set("handler", this.handler, "reference");
            serializer.set("action", this.action);
        }
    }

});
