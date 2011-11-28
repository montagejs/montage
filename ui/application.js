/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
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
     A collection of components that the application creates at startup.
     @type {Object}
     @default null
     */
    components: {
        value: null
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
     @private
     */
    _template: {
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
                components, component,
                self = this,
                isInstance = Application.isPrototypeOf(this);

            template.instantiateWithOwnerAndDocument(isInstance ? this : null, window.document, function(rootObject) {
                // The states we need to take care of:
                // 1) Static Application.load() called and the template root object is an application
                // 2) Static Application.load() called and the template root object is NOT an application
                // 3) Instance application.load() called and the template root object is an application
                // 4) Instance application.load() called and the template root object is NOT an application
                if (rootObject !== self) { // Need to setup the application object
                    if (Application.isPrototypeOf(rootObject)) { // the root object is an application already, use it
                        self = rootObject;
                    } else { // the root object is something else, need to create an application to "wrap" it or use "this" in case of an instance (vs static) call
                        self = isInstance ? self : Application.create();
                        self.components = [rootObject];
                        if(Component.isPrototypeOf(rootObject)) {
                            rootObject.needsDraw = true;
                        } else {
                            require("ui/component").__root__.needsDraw = true;
                        }
                    }
                }

                self._template = template;
                components = self.components || [];
                for (var i = 0; (component = components[i]); i++) {
                    component.needsDraw = true;
                }

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
