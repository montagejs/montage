/* <copyright>
Copyright (c) 2012, Motorola Mobility LLC.
All Rights Reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

* Redistributions of source code must retain the above copyright notice,
  this list of conditions and the following disclaimer.

* Redistributions in binary form must reproduce the above copyright notice,
  this list of conditions and the following disclaimer in the documentation
  and/or other materials provided with the distribution.

* Neither the name of Motorola Mobility LLC nor the names of its
  contributors may be used to endorse or promote products derived from this
  software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE
LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
POSSIBILITY OF SUCH DAMAGE.
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
        value: null
    },

/**
    The action (function) to invoke on the handler object.
    @type {Property}
    @default {Event handler} null
*/
    action: {
        value: null
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
