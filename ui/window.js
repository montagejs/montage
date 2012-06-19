/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
/**
	@module montage/ui/window
    @requires montage/core/core
    @requires montage/ui/reel
    @requires montage/core/gate
    @requires montage/core/logger | component
    @requires montage/core/logger | drawing
    @requires montage/core/event/event-manager
*/
var Montage = require("montage").Montage;

/**
 This module defines the {@link module:ui/window.WindowProxy} prototype.
 @module ui/window
 @requires montage/core/core
 */

/**
 The Window object is responsible for managing a DOM window.
 @class module:montage/ui/window.WindowProxy
 @extends module:montage/core/core.Montage
 */
var WindowProxy = exports.WindowProxy = Montage.create(Montage, /** @lends montage/ui/window.WindowProxy# */ {

    /**
     @private
     */
    _application: {
        value: null
    },

    /**
     Provides a reference to the application.
     @type {module:montage/ui/application.Application}
     */
    application: {
        get: function() { return this._application },
        set: function(value) {
            if (this._application === null) {
                this._application = value;

                if (this.focused) {
                    this._setFocusedWindow(this);
                }
            }
        }
    },

    /**
     @private
     */
    _window: {
        value: null
    },

    /**
     Provides a reference to the DOM window.
     @type {window object}
     */
    window: {
        get: function() { return this._window },
        set: function(value) {
            if (this._window === null) {
                var body = value.document.body;

                this._window = value;

                value.addEventListener("beforeunload", this, true);
                value.addEventListener("focus", this, true);
                value.addEventListener("mousedown", this, true);

                // In order to receive focus event, we need to make sure the body is focusable
                if (body.getAttribute("tabIndex") === null) {
                    body.setAttribute("tabIndex", -1);
                    body.focus();
                }
            }
        }
    },

    /**
     Provides a reference to the DOM document.
     @type {document object}
     */
    document: {
        get: function() { return this._window.document }
    },

    /**
     @private
     */
    _component: {
        value: null
    },

    /**
     Provides a reference to the main component of the window.
     @type {component}
     */
    component: {
        get: function() {return this._component},
        set: function(value) {
            if (this._component === null) {
                this._component = value;
            }
        }
    },

    /**
     Allow to set or get the window's title.
     @type {string}
     */
    title: {
        get: function() { return this.document.title },
        set: function(value) {
            this.document.title = value;
        }
    },

    focused: {
          value: false
    },

    focus: {
        value: function() {
            if (this._window) {
                this._window.focus();
            }
        }
    },

    _setFocusedWindow: {
        value: function(aWindow) {
            var application = this.application,
                windows,
                theWindow,
                i;

            if (application._multipleWindow) {
                windows = application.windows;
                for (i in windows) {
                    theWindow = windows[i];
                    if (theWindow.window === aWindow) {
                        if (theWindow.focused !== true) {
                            theWindow.focused = true;
                            if (application.windowsSortOrder == "z-order") {
                                windows.splice(i, 1);
                                windows.unshift(theWindow);
                            } else if (application.windowsSortOrder == "reverse-z-order") {
                                windows.splice(i, 1);
                                windows.push(theWindow);
                            }
                        }
                    } else {
                        theWindow.focused = false;
                    }
                }
            } else {
                this.focused = true;
            }
        }
    },

    closed: {
        get: function() { return this._window ? this._window.closed : false }
    },

    close: {
        value: function() {
            if (this._window) {
                this._window.close();
            }
        }
    },

    captureFocus: {
        value: function(event) {
            var application = this.application;

            if (!this.application) {
                // the Application has not yet been set, just mark the windows has being focused
                this.focused = true;
                return;
            }
            if (application.parentApplication) {
                application.mainApplication.window.captureFocus(event);
            } else {
                var target = (event.target.ownerDocument ? event.target.ownerDocument.defaultView : null) ||
                                event.target.defaultView || event.target;

                this._setFocusedWindow(target);
            }
        }
    },

    captureMousedown: {
        value: function(event) {
            // Sometime, for some reason, we do not receive anymore a focus event... let presume that if we get a mouse click, we should have focus
            this.captureFocus(event);
        }
    },

    captureBeforeunload: {
        value: function(event) {

            var application = this.application,
                windows = application.windows,
                attachedWindows = application.attachedWindows,
                i;

            // Close the attached windows
            application.attachedWindows = []; // this is necessary to prevent the unload of the child window to mess with the array while we iterate it
            for (var i in attachedWindows) {
                attachedWindows[i].close();
            }

            if (application.parentApplication) {
                attachedWindows = application.parentApplication.attachedWindows;   // We need the parent windows list
                i = attachedWindows.indexOf(this);
                if (i !== -1) {
                    attachedWindows.splice(i, 1);
                }

                i = windows.indexOf(this);
                if (i !== -1) {
                    windows.splice(i, 1);
                }

                this.window.removeEventListener("beforeunload", this, true);
                this.close();    // Force close the window in case the user is reloading it.
            }
        }
    }
});
