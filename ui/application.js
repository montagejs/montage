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
    @module montage/ui/application
    @requires montage/core/core
    @requires montage/core/event/event-manager
    @requires montage/ui/template
    @requires montage/ui/component

    @requires montage/ui/dom
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

    _load: {
        value: function(applicationRequire, callback) {
            var template = Template.create().initWithDocument(window.document, applicationRequire),
                rootComponent,
                self = this;

            // assign to the exports so that it is available in the deserialization of the template
            exports.application = self;

            require.async("ui/component").then(function(exports) {
                rootComponent = exports.__root__;
                rootComponent.element = document;
                template.instantiateWithOwnerAndDocument(null, window.document, function() {
                    self.callDelegateMethod("willFinishLoading", self);
                    rootComponent.needsDraw = true;
                    if (callback) {
                        callback(self);
                    }

                });
            }).end();
        }
    },

    // @private
    _alertPopup: {value: null, enumerable: false},
    _confirmPopup: {value: null, enumerable: false},
    _notifyPopup: {value: null, enumerable: false},
    _zIndex: {value: null},

    _isSystemPopup: {value: function(type) {
        return (type === 'alert' || type === 'confirm' || type === 'notify');
    }},

    _createPopupSlot: {value: function(zIndex) {
        var slotEl = document.createElement('div');
        document.body.appendChild(slotEl);
        slotEl.style.zIndex = zIndex;
        slotEl.style.position = 'absolute';

        var popupSlot = Slot.create();
        popupSlot.element = slotEl;
        return popupSlot;
    }},

    getPopupSlot: {
        value: function(type, content, callback) {

            var self = this;
            require.async("ui/slot.reel/slot", function(exports) {
                Slot = Slot || exports.Slot;
                type = type || "custom";
                var isSystemPopup = self._isSystemPopup(type), zIndex, slotEl, popupSlot;
                self.popupSlots = self.popupSlots || {};

                if(isSystemPopup) {
                    switch (type) {
                        case "alert":
                            zIndex = 9004;
                            break;
                        case "confirm":
                            zIndex = 9003;
                            break;
                        case "notify":
                            zIndex = 9002;
                            break;
                    }
                } else {
                    // custom popup
                    if(!self._zIndex) {
                        self._zIndex = 7000;
                    } else {
                        self._zIndex = self._zIndex + 1;
                    }
                    zIndex = self._zIndex;
                }

                popupSlot = self.popupSlots[type];
                if (!popupSlot) {
                    popupSlot = self.popupSlots[type] = self._createPopupSlot(zIndex);
                }
                // use the new zIndex for custom popup
                if(!isSystemPopup) {
                    popupSlot.element.style.zIndex = zIndex;
                }

                popupSlot.content = content;
                callback.call(this, popupSlot);

            });
        }
    },

    returnPopupSlot: {value: function(type) {
        var self = this;
        if(self.popupSlots && self.popupSlots[type]) {
            var popupSlot = self.popupSlots[type];
            popupSlot.content = null;
            // is there a way to remove the Slot
            // OR should we remove the slotEl from the DOM to clean up ?
        }

    }},

    // private
    _getActivePopupSlots: {
        value: function() {
            var arr = [];
            if(this.popupSlots) {
                var keys = Object.keys(this.popupSlots);
                if(keys && keys.length > 0) {
                    var i=0, len = keys.length, slot;
                    for(i=0; i< len; i++) {
                        slot = this.popupSlots[keys[i]];
                        if(slot && slot.content !== null) {
                            arr.push(slot);
                        }

                    }
                }
            }
            return arr;
        }
    }

});
