/* <copyright>
Copyright (c) 2012, Motorola Mobility, Inc

All Rights Reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

  - Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
  - Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
  - Neither the name of Motorola Mobility nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
</copyright> */

/**
    @module montage/ui/application
    @require montage/core/event/event-manager
    @require montage/ui/template
*/

var Montage = require("core/core").Montage,
    EventManager = require("core/event/event-manager").EventManager,
    Template = require("ui/template").Template,
    Component = require("ui/component").Component,
    Slot;

    require("ui/dom");

/**
 This module defines the {@link module:ui/application.Application} prototype.
 @module ui/application
 @requires event/event-manager
 @requires template
 @requires ui/popup/popup
 @requires ui/popup/alert
 @requires ui/popup/confirm
 @requires ui/loading
 @requires ui/popup/growl
 @requires ui/slot
 */

/**
 The Application object is responsible for loading its component tree. TODO finish description
 @class module:montage/ui/application.Application
 @extends module:montage/core/core.Montage
 */
var Application = exports.Application = Montage.create(Montage, /** @lends montage/ui/application.Application# */ {

    /**
     Provides a reference to the Montage event manager used in the application.
     @type {module:montage/core/event/event-manager.EventManager}
     */
    eventManager: {
        value: null
    },

    /**
     Returns the event manager for the specified window object.
     @function
     @param {Property} aWindow The browser window whose event manager object should be returned.
     @returns aWindow.defaultEventMananger
     */
    eventManagerForWindow: {
        value: function(aWindow) {
            return aWindow.defaultEventMananger;
        }
    },

    /**
     Contains the window associated with the document.
     @type {Property}
     @default document.defaultView
     */
    focusWindow: {
        value: document.defaultView
    },

    /**
     An array of the windows associated with the application.
     @type {Array}
     @default {Array} []
     */
    attachedWindows: {
        value: []
    },

    /**
     Opens a URL in a new browser window, and registers the window with the Montage event manager.<br>
     The document URL must be in the same domain as the calling script.
     @function
     @param {URL} url The URL to open in the new window.
     @returns newWindow
     @example
     var app = document.application;
     app.openWindow("docs/help.html");
     */
    openWindow: {
        value: function(url) {
            var newWindow = window.open(url);

            // Make the required modules available to the new window
            newWindow.require = require;
            newWindow.document.application = this;

            this.eventManager.registerWindow(newWindow);
            this.attachedWindows.push(newWindow);
            return newWindow;
        }
    },

    /**
     Registers an event listener on the application instance.
     @function
     @param {Property} type The event type to listen for.
     @param {Object} listener A listener object that defines an event handler function, or a function to handle the event.
     @param {Function} useCapture If <code>true</code>, the listener will only be notified during the event's capture phase.<br>
     If <code>false</code> (the default) the listener will be notified during the event's bubble phase.
     */
    addEventListener: {
        value: function(type, listener, useCapture) {
            Object.getPrototypeOf(Application)["addEventListener"].call(this, type, listener, useCapture);
        }
    },

    /**
     Removes a previously registered event listener on the application instance.
     @function
     @param {Property} type The event type that was originally registered.
     @param {Object} listener The listener object or function that was registered to handle the event.
     @param {Function} useCapture TODO
     */
    removeEventListener: {
        value: function(type, listener, useCapture) {
            Object.getPrototypeOf(Application)["addEventListener"].call(this, type, listener, useCapture);
        }
    },

    /**
     The application's delegate object.<br>
     The application delegate is notified of events during the application's life cycle.
     @type {Object}
     @default null
     */
    delegate: {
        value: null
    },

    /**
     Description TODO
     @function
     @param {Function} callback A function to invoke after the method has completed.
     */
    load: {
        value: function(callback) {
            var template = Template.create().initWithDocument(window.document),
                component,
                self = this;

            self = Application.isPrototypeOf(self) ? self : Application.create();

            // assign to the exports so that it is available in the deserialization of the template
            exports.application = self;

            template.instantiateWithOwnerAndDocument(null, window.document, function() {
                require("ui/component").__root__.needsDraw = true;
                if (callback) {
                    callback(self);
                }
            });
        }
    },

    // @private
    _alertPopup: {value: null, enumerable: false},
    _confirmPopup: {value: null, enumerable: false},
    _notifyPopup: {value: null, enumerable: false},


    getPopupSlot: {
        value: function(type, content, callback) {

            var self = this;
            require.async("ui/slot.reel/slot", function(exports) {
                Slot = Slot || exports.Slot;

                type = type || "custom";
                // type = custom|alert|confirm
                self.popupSlots = self.popupSlots || {};
                var popupSlot = self.popupSlots[type];
                // create a slot for this type of popup
                if (!popupSlot) {
                    var slotEl = document.createElement('div'), zIndex;
                    slotEl.style.position = 'absolute';

                    switch (type) {
                        case "alert":
                            zIndex = 9004;
                            break;
                        case "confirm":
                            zIndex = 9003;
                            break;
                        case "loading":
                            zIndex = 9002;
                            break;
                        default:
                            zIndex = 9001;
                            break;
                    }
                    slotEl.style['z-index'] = zIndex;

                    document.body.appendChild(slotEl);
                    popupSlot = Slot.create();
                    popupSlot.element = slotEl;
                    self.popupSlots[type] = popupSlot;
                }

                popupSlot.content = content;
                callback.call(this, popupSlot);

            });
        }
    }

});
