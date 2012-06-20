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
    Slot, HashbangStateDelegate;

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

    useHash: {
        value: true,
        serializable: true
    },

    state: {
        serializable: true,
        value: null
    },

    stateKeys: {
        serializable: true,
        value: null
    },

    routes: {
        serializable: true,
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

                if(self.stateKeys) {
                    self._createState();
                    if(!self._defaultStateDelegate) {
                        //self._defaultStateDelegate = Montage.create(DefaultStateDelegate);
                        self._defaultStateDelegate = Montage.create(HashbangStateDelegate);
                        self._defaultStateDelegate.stateKeys = self.stateKeys;
                    }

                    if(typeof window.history.pushState !== "undefined") {
                        window.onpopstate = function(event) {
                            var state = event.state;
                            self._willPopState(event);
                        };
                    } else {
                        window.onhashchange = function(event) {
                            event.preventDefault();
                            self._willPopState(event);
                        };
                    }

                    // initial state from URL
                    self._willPopState();
                }


                if (callback) {
                    callback(self);
                }
            });
        }
    },

    _defineStateProperty: {
        value: function(name) {
            var _name = '_' + name, self = this, stateDelegate = this.stateDelegate;
            var newDescriptor = {
                configurable: true,
                enumerable: true,
                serializable: true,
                set: (function(name, attrName) {
                    return function(value) {
                        if((typeof value !== 'undefined') && this[attrName] !== value) {
                            // this = state
                            this[attrName] = value;
                            self._willPushState();
                        }
                    };
                }(name, _name)),
                get: (function(name, attrName) {
                    return function() {
                        return this[attrName];
                    };
                }(name, _name))
            };

            // Define _ property
            Montage.defineProperty(this.state, _name, {value: null});
            // Define property getter and setter
            Montage.defineProperty(this.state, name, newDescriptor);
        }
    },

    _createState: {
        value: function() {
            this.state = Montage.create(Montage, {});
            if(this.stateKeys && this.stateKeys.length > 0) {
                var i, len = this.stateKeys.length;
                for(i=0; i< len; i++) {
                    this._defineStateProperty(this.stateKeys[i]);
                }
            }
        }
    },

    _synching : {value: null},

    _defaultStateDelegate: {value: null},

    _willPopState: {
        value: function(event) {
            this._synching = true;
            var options = {
                location: window.location,
                url: window.location.href,
                title: window.title,
                state: event ? event.state : null
            };
            if(this.delegate && typeof this.delegate["willPopState"] === 'function') {
                this.delegate["willPopState"].call(this.delegate, options, this.state);
            } else {
                // update state using default mechanism
                this._defaultStateDelegate.willPopState(options, this.state);
            }
            this._synching = false;
        }
    },

    _willPushState: {
        value: function() {
            this._synching = true;
            var options = {
                url: window.location.href,
                location: window.location,
                title: window.title
            };

            if(this.delegate && typeof this.delegate["willPushState"] === 'function') {
                this.delegate["willPushState"].call(this.delegate, options, this.state);
            } else {
                // get the URL from the pattern OR /context/stateKey[0]/stateKey[1]
                // @todo
                this._defaultStateDelegate.willPushState(options, this.state);
            }
            if(typeof window.history.pushState !== 'undefined') {
                window.history.pushState(this.state, options.title, options.url);
            } else {
                window.location.hash = options.url;
            }
            this._synching = false;
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




/**
* StateDelegate that implements the #! url strategy
*/
HashbangStateDelegate = Montage.create(Montage, {

    stateKeys: {value: null},

    _getHash: {
        value: function(location) {
            var hash = location.hash;
            if(hash && hash.length > 0 && hash.indexOf('#!/') == 0) {
                hash = hash.substring(hash.indexOf('#')+3);
            }
            return hash;
        }
    },

    willPushState: {
       value: function(options, appState) {
           // push appState to url
           console.log('DefaultStateDelegate: willPushState ', this._urlPrefix, appState, options);

           if(appState) {
               var i, len = this.stateKeys.length;
               var arr = [], value;
               for(i=0; i< len; i++) {
                   var value = appState[this.stateKeys[i]];
                   if(value) {
                       arr.push(value);
                   }
               }
               var hash = arr.join('/');
               options.url = '#!/' + hash;
           }

       }
    },

    willPopState: {
       value: function(options, appState) {
           console.log('updating AppState from URL');
           appState = appState || {};
           var hash = this._getHash(options.location); // location
           // #!/a/b/c
           var parts;
           console.log('hash ', hash);
           if(hash) {
               parts = hash.split('/');
           }

           if(parts) {
               var i, len = this.stateKeys.length, partsLen = parts.length;
               for(i=0; i< len; i++) {
                   if(i < partsLen) {
                       appState[this.stateKeys[i]] = parts[i];
                   }
               }
           }
       }
    }

});
