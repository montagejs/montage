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
 This module defines the {@link module:ui/window.MontageWindow} prototype.
 @module ui/window
 @requires montage/core/core
 */

/**
 The Window object is responsible for managing a DOM window.
 @class module:montage/ui/window.MontageWindow
 @extends module:montage/core/core.Montage
 */
var MontageWindow = exports.MontageWindow = Montage.create(Montage, /** @lends montage/ui/window.MontageWindow# */ {

    /**
     @private
     */
    _application: {
        value: null
    },

    /**
     Provides the Application associated with the window.
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
     Provides a reference to the native window.
     @type {Window object}
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
     Provides a reference to the main Montage component loaded in the window.
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
     The window title. Make sure to use MontageWindow.title to access the window's title rather than directly accessing
     directly the title by the document, else you will not be able to use binding with the window's title.
     @type {string}
     */
    title: {
        get: function() { return this.document.title },
        set: function(value) {
            this.document.title = value;
        }
    },

    /**
     True if the window is currently the topmost Montage Window and has focus.
     @type {boolean}
     */
    focused: {
          value: false
    },

    /**
     Set the focus on the window, move it to the front.
     @function
     */
    focus: {
        value: function() {
            if (this._window) {
                this._window.focus();
            }
        }
    },

    /**
     @private
     */
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

    /**
     True is the window has been closed. Once a window has been close, the MontageWindow object still exist but you
     cannot use it anymore.
     @type {boolean}
     */
    closed: {
        get: function() { return this._window ? this._window.closed : false }
    },

    /**
     Close the window
     Note: Any child window will be closed too.
     @function
     */
    close: {
        value: function() {
            if (this._window) {
                this._window.close();
            }
        }
    },

    /**
     Resize the window to the specified width and height
     @function
     @param {Integer} width The window's width desired.
     @param {Integer} height The window's height desired.
     */
    resizeTo: {
        value: function(width, height) {
            if (this._window) {
                this._window.resizeTo(width, height);
            }
        }
    },

    /**
     Move the window to the specified screen coordinate x and y
     @function
     @param {Integer} x The window's x screen position.
     @param {Integer} y The window's y screen position.
     */
    moveTo: {
        value: function(x, y) {
            if (this._window) {
                this._window.moveTo(x, y);
            }
        }
    },

    /**
     @private
     */
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

    /**
     @private
     */
    captureMousedown: {
        value: function(event) {
            // Sometime, for some reason, we do not receive anymore a focus event... let presume that if we get a mouse click, we should have focus
            this.captureFocus(event);
        }
    },

    /**
     @private
     */
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
