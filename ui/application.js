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
    Template = require("ui/template").Template,
    Component = require("ui/component").Component,
    MontageWindow = require("ui/montage-window").MontageWindow,
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
     Provides a reference to the parent application.
     @type {module:montage/ui/application.Application}
     @default null
     */
    parentApplication: {
        value: null
    },

    /**
     Provides a reference to the main application.
     @type {module:montage/ui/application.Application}
     @default this
     */
    mainApplication: {
        get: function() {
            // JFD TODO: We should cache the result, would need to update it when the window is detached or attached
            var mainApplication = this;
            while (mainApplication.parentApplication) {
                mainApplication = mainApplication.parentApplication;
            }
            return mainApplication;
        }
    },

    // possible values: "z-order", "reverse-z-order", "z-order", "reverse-open-order"
    _windowsSortOrder: {
        value: "reverse-z-order"
    },

    /**
     Determines the sort order for the Application.windows array.
     Possible values are: z-order, reverse-z-order, open-order, reverse-open-order
     @type {String}
     @default {String} {"reverse-z-order"}
     */
    windowsSortOrder: {
        get: function() {
            if (this.parentApplication == null) {
                return this._windowsSortOrder;
            } else {
                return this.mainApplication.windowsSortOrder;
            }
        },

        set: function(value) {
            if (this.parentApplication == null) {
                if (["z-order", "reverse-z-order", "z-order", "reverse-open-order"].indexOf(value) !== -1) {
                    this._windowsSortOrder = value;
                }
            } else {
                this.mainApplication.windowsSortOrder = value;
            }
        }
    },

    /**
     Provides a reference to all the windows opened by the main application or any of its descendents, including the main
     window itself The list is kept sorted, the sort order is determined by the Application.windowsSortOrder property
     @type {array}
     @type {Array}
     */
    windows: {
        get: function() {
            var theWindow;

            if (this.parentApplication == null) {
                if (!this._windows) {
                    var theWindow = MontageWindow.create();
                    theWindow.application = this;
                    theWindow.window = window;
                    this.window = theWindow;

                    this._windows = [this.window];
                    this._multipleWindow = true;
                }
                return this._windows;
            } else {
                return this.mainApplication.windows;
            }
        }
    },

    _window: {
        value: null
    },

    /**
     Provides a reference to the MontageWindow associated with the application.
     @type {module:montage/ui/montage-windows.js/MontageWindow}
     */
    window: {
        get: function() {
            if (!this._window && this == this.mainApplication) {
                var theWindow = MontageWindow.create();
                theWindow.application = this;
                theWindow.window = window;
                this._window = theWindow;
            }
            return this._window;
        },

        set: function(value) {
            if (!this._window) {
                this._window = value;
            }
        }
    },

    /**
     An array of the child windows attached to the application.
     @type {Array}
     @default {Array} []
     */
    attachedWindows: {
        value: []
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
     Return the top most window of any of the Montage Windows.
     @type {Property}
     @default document.defaultView
     */
    focusWindow: {
        get: function() {
            var windows = this.windows,
                sortOrder = this.windowsSortOrder;

            if (sortOrder == "z-order") {
                return windows[0];
            } else if (sortOrder == "reverse-z-order") {
                return windows[windows.length - 1];
            } else {
                for (var i in windows) {
                    if (windows[i].focused) {
                        return windows[i];
                    }
                }
            }
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
            Object.getPrototypeOf(Application)["removeEventListener"].call(this, type, listener, useCapture);
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
     Opens a component in a new browser window, and registers the window with the Montage event manager.<br>
     The component URL must be in the same domain as the calling script. Can be relative to the main application
     @function
     @param {PATH} component, the path to the reel component to open in the new window.
     @param {STRING} name, the component main class name.
     @param {OBJECT} parameters, the new window parameters (accept same parameters than window.open).
     @example
     var app = document.application;
     app.openWindow("docs/help.reel", "Help", "{width:300, height:500}");
     */
    openWindow: {
        value: function(component, name, parameters) {
            var thisRef = this,
                childWindow = MontageWindow.create(),
                childApplication,
                event,
                windowParams = {
                    location: false,
//                  height: <pixels>,
//                  width: <pixels>,
//                  left: <pixels>,
//                  top: <pixels>,
                    menubar: false,
                    resizable: true,
                    scrollbars: true,
                    status: false,
                    titlebar: true,
                    toolbar: false
                };

            var loadInfo = {
                module: component,
                name: name,
                parent: window,
                callback: function(aWindow, aComponent) {
                    var sortOrder;

                    // Finishing the window object initialization and let the consumer knows the window is loaded and ready
                    childApplication = aWindow.document.application;
                    childWindow.window = aWindow;
                    childWindow.application = childApplication;
                    childWindow.component = aComponent;
                    childApplication.window = childWindow;

                    thisRef.attachedWindows.push(childWindow);

                    sortOrder = thisRef.mainApplication.windowsSortOrder;
                    if (sortOrder == "z-order" || sortOrder == "reverse-open-order") {
                        thisRef.windows.unshift(childWindow);
                    } else {
                        thisRef.windows.push(childWindow);
                    }

                    event = document.createEvent("CustomEvent");
                    event.initCustomEvent("load", true, true, null);
                    childWindow.dispatchEvent(event);
                }
            };

            // If this is the first time we open a window, let's install a focus listener and make sure the body element is focusable
            // Applicable only on the main application
            if (this === this.mainApplication && !this._multipleWindow) {
                var montageWindow = this.window;    // Will cause to create a Montage Window for the mainApplication and install the needed event handlers
            }

            if (typeof parameters == "object") {
                var param, value, separator = "", stringParamaters = "";

                // merge the windowParams with the parameters
                for (param in parameters) {
                    if (parameters.hasOwnProperty(param)) {
                        windowParams[param] = parameters[param];
                    }
                }
            }

            // now convert the windowParams into a string
            var excludedParams = ["name"];
            for (param in windowParams) {
                if (excludedParams.indexOf(param) == -1) {
                    value = windowParams[param];
                    if (typeof value == "boolean") {
                        value = value ? "yes" : "no";
                    } else {
                        value = String(value);
                        if (value.match(/[ ,"]/)) {
                            value = '"' + value.replace(/"/g, "\\\"") + '"';
                        }
                    }
                    stringParamaters += separator + param + "=" + value;
                    separator = ",";
                }
            }

            window.require.loadPackage({name: "montage"}).then(function(require) {
                var newWindow = window.open(require.location + "ui/window-loader/index.html", "_blank", stringParamaters);
                newWindow.loadInfo = loadInfo;
            }).end();

            return childWindow;
        }
    },

    /**
     Attach a window to a parent application. When a window open, it's automatically attach to the Application used to
     create the window.
     @function
     @param {module:montage/ui/montage-windows.js/MontageWindow} window to detach.
     */
    attachWindow: {
        value: function(montageWindow) {
            var parentApplicaton = montageWindow.application.parentApplication,
                sortOrder;

            if (parentApplicaton !== this) {
                if (parentApplicaton) {
                    parentApplicaton.detachWindow(montageWindow);
                }

                montageWindow.parentApplication = this;
                this.attachedWindows.push(montageWindow);

                sortOrder = this.mainApplication.windowsSortOrder;
                if (sortOrder == "z-order" || sortOrder == "reverse-open-order") {
                    this.windows.unshift(montageWindow);
                } else {
                    this.windows.push(montageWindow);
                }
                montageWindow.focus()
            }
            return montageWindow;
        }
    },

    /**
     Detach the window from its parent application. If no montageWindow is specified, the current application's windows
     will be detached
     @function
     @param {module:montage/ui/montage-windows.js/MontageWindow} window to detach.
     */
    detachWindow: {
        value: function(montageWindow) {
            var index,
                parentApplicaton,
                windows = this.windows;

            if (montageWindow === undefined) {
                montageWindow = this.window;
            }
            parentApplicaton = montageWindow.application.parentApplication;

            if (parentApplicaton == this) {
                index = this.attachedWindows.indexOf(montageWindow);
                if (index !== -1) {
                    this.attachedWindows.splice(index, 1);
                }
                index = windows.indexOf(montageWindow);
                if (index !== -1) {
                    windows.splice(index, 1);
                }
                montageWindow.application.parentApplication = null;
            } else if (parentApplicaton) {
                parentApplicaton.detachWindow(montageWindow);
            }
            return montageWindow;
        }
    },

    /**
     @private
     */
    didCreate: {
        value: function() {
            if (window.loadInfo && !this.parentApplication) {
                this.parentApplication = window.loadInfo.parent.document.application;
            }
        }
    },

    _load: {
        value: function(applicationRequire, callback) {
            var template = Template.create().initWithDocument(window.document, applicationRequire),
                rootComponent,
                self = this;

            // assign to the exports so that it is available in the deserialization of the template
            exports.application = self;

            require.async("ui/component")
            .end(function(exports) {
                rootComponent = exports.__root__;
                rootComponent.element = document;
                template.instantiateWithOwnerAndDocument(null, window.document, function() {
                    self.callDelegateMethod("willFinishLoading", self);
                    rootComponent.needsDraw = true;
                    if (callback) {
                        callback(self);
                    }
                });
            })
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

    _createPopupSlot: {value: function(zIndex, useFixed) {
        var slotEl = document.createElement('div');
        document.body.appendChild(slotEl);
        slotEl.style.zIndex = zIndex;
        slotEl.style.position = useFixed ? 'fixed' : 'absolute';

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
                var isSystemPopup = self._isSystemPopup(type), zIndex, slotEl, popupSlot, useFixed;
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
                            useFixed = true;
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
                    popupSlot = self.popupSlots[type] = self._createPopupSlot(zIndex, useFixed);
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
