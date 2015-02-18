/**
 * @module montage/ui/window
 * @requires montage/core/core
 */
var Montage = require("../core/core").Montage;

/**
 * The Window object is responsible for managing a DOM window.
 *
 * @class MontageWindow
 * @extends Montage
 */
var MontageWindow = exports.MontageWindow = Montage.specialize( /** @lends MontageWindow.prototype # */ {

    _application: {
        value: null
    },

    /**
     * Provides the Application associated with the window.
     * @type {Application}
     */
    application: {
        get: function () { return this._application; },
        set: function (value) {
            if (this._application === null) {
                this._application = value;
                if (this.focused) {
                    this._setFocusedWindow(this);
                }
            }
        }
    },

    _window: {
        value: null
    },

    /**
     * Provides a reference to the native window.
     * @type {Window}
     */
    window: {
        get: function () { return this._window; },
        set: function (value) {
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
     * Provides a reference to the DOM document.
     * @type {document}
     */
    document: {
        get: function () { return this._window.document; }
    },

    _component: {
        value: null
    },

    /**
     * Provides a reference to the main Montage component loaded in the window.
     * @type {component}
     */
    component: {
        get: function () {return this._component;},
        set: function (value) {
            if (this._component === null) {
                this._component = value;
            }
        }
    },

    /**
     * The window title. Make sure to use MontageWindow.title to access the
     * window's title rather than directly accessing directly the title by the
     * document, else you will not be able to use binding with the window's
     * title.
     *
     * @returns {string}
     */
    title: {
        get: function () { return this.document.title; },
        set: function (value) {
            this.document.title = value;
        }
    },

    /**
     * True if the window is currently the topmost Montage Window and has
     * focus.
     * @type {boolean}
     */
    focused: {
        value: false
    },

    /**
     * Set the focus on the window, move it to the front.
     * @function
     */
    focus: {
        value: function () {
            if (this._window) {
                this._window.focus();
            }
        }
    },

    _setFocusedWindow: {
        value: function (aWindow) {
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
     * True is the window has been closed. Once a window has been close, the MontageWindow object still exist but you
     * cannot use it anymore.
     * @type {boolean}
     */
    closed: {
        get: function () { return this._window ? this._window.closed : false; }
    },

    /**
     * Close the window
     * Note: Any child window will be closed too.
     * @function
     */
    close: {
        value: function () {
            if (this._window) {
                this._window.close();
            }
        }
    },

    /**
     * Resize the window to the specified width and height
     * @function
     * @param {Integer} width The window's width desired.
     * @param {Integer} height The window's height desired.
     */
    resizeTo: {
        value: function (width, height) {
            if (this._window) {
                this._window.resizeTo(width, height);
            }
        }
    },

    /**
     * Move the window to the specified screen coordinate x and y
     * @function
     * @param {Integer} x The window's x screen position.
     * @param {Integer} y The window's y screen position.
     */
    moveTo: {
        value: function (x, y) {
            if (this._window) {
                this._window.moveTo(x, y);
            }
        }
    },

    captureFocus: {
        value: function (event) {
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
        value: function (event) {
            // Sometime, for some reason, we do not receive anymore a focus event... let presume that if we get a mouse click, we should have focus
            this.captureFocus(event);
        }
    },

    captureBeforeunload: {
        value: function (event) {

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

