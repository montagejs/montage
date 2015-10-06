/**
 * @module core/application
 * @requires event/event-manager
 * @requires template
 * @requires ui/popup/popup
 * @requires ui/popup/alert
 * @requires ui/popup/confirm
 * @requires ui/loading
 * @requires ui/popup/growl
 * @requires ui/slot
 */

var Montage = require("./core").Montage,
    Target = require("./target").Target,
    MontageWindow = require("../window-loader/montage-window").MontageWindow,
    Slot;

require("./dom");

/**
 * The application is a singleton, it initially loads and oversees the running program.
 * It is also responsible for window management.
 * The behavior of the application can be modified by implementing a delegate
 * {@link Application#delegate}.
 * It is also possible to subclass the application by specifying an
 * `applicationPrototype"` in the `package.json`.
 *
 * @class Application
 * @extends Target
 */
var Application = exports.Application = Target.specialize( /** @lends Application.prototype # */ {

    /**
     * Provides a reference to the Montage event manager used in the
     * application.
     *
     * @property {EventManager} value
     * @default null
     */
    eventManager: {
        value: null
    },

    /**
     * Provides a reference to the parent application.
     *
     * @property {Application} value
     * @default null
     */
    parentApplication: {
        value: null
    },

    /**
     * Provides a reference to the main application.
     *
     * @type {Application}
     * @default this
     */
    mainApplication: {
        get: function () {
            // JFD TODO: We should cache the result, would need to update it
            // when the window is detached or attached
            var mainApplication = this;
            while (mainApplication.parentApplication) {
                mainApplication = mainApplication.parentApplication;
            }
            return mainApplication;
        }
    },

    /**
     * possible values: "z-order", "reverse-z-order", "z-order", "reverse-open-order"
     * @private
     * @property {String} value
     */
    _windowsSortOrder: {
        value: "reverse-z-order"
    },

    /**
     * Determines the sort order for the Application.windows array.
     * Possible values are: z-order, reverse-z-order, open-order,
     * reverse-open-order
     *
     * @returns {string}
     * @default "reverse-z-order"
     */
    windowsSortOrder: {
        get: function () {
            if (this.parentApplication == null) {
                return this._windowsSortOrder;
            } else {
                return this.mainApplication.windowsSortOrder;
            }
        },

        set: function (value) {
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
     * Provides a reference to all the windows opened by the main application
     * or any of its descendents, including the main window itself.
     * The list is kept sorted, the sort order is determined by the
     * `Application.windowsSortOrder` property
     *
     * @returns {Array<MontageWindow>}
     */
    windows: {
        get: function () {
            if (this.parentApplication == null) {
                if (!this._windows) {
                    var theWindow = new MontageWindow();
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
     * Provides a reference to the MontageWindow associated with the
     * application.
     *
     * @returns {MontageWindow}
     */
    window: {
        get: function () {
            if (!this._window && this == this.mainApplication) {
                var theWindow = new MontageWindow();
                theWindow.application = this;
                theWindow.window = window;
                this._window = theWindow;
            }
            return this._window;
        },

        set: function (value) {
            if (!this._window) {
                this._window = value;
            }
        }
    },

    /**
     * An array of the child windows attached to the application.
     * @type {Array<MontageWindow>}
     * @default {Array} []
     */
    attachedWindows: {
        value: []
    },

    /**
     * Returns the event manager for the specified window object.
     * @function
     * @param {Window} aWindow The browser window whose event manager object should be returned.
     * @returns aWindow.defaultEventMananger
     */
    eventManagerForWindow: {
        value: function (aWindow) {
            return aWindow.defaultEventMananger;
        }
    },

    /**
     * Return the top most window of any of the Montage Windows.
     * @type {MontageWindow}
     * @default document.defaultView
     */
    focusWindow: {
        get: function () {
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
     * The application's delegate object, it can implement a
     * `willFinishLoading` method that will be called right after the
     * index.html is loaded.
     * The application delegate is also the next event target after the
     * application.
     * @type {Object}
     * @default null
     */
    delegate: {
        value: null
    },

    nextTarget: {
        get: function () {
            return this.delegate;
        }
    },

    /**
     * Opens a component in a new browser window, and registers the window with
     * the Montage event manager.
     *
     * The component URL must be in the same domain as the calling script. Can
     * be relative to the main application
     *
     * @function
     * @param {string} component, the path to the reel component to open in the
     * new window.
     * @param {string} name, the component main class name.
     * @param {Object} parameters, the new window parameters (accept same
     * parameters than window.open).
     *
     * @example
     * var app = document.application;
     * app.openWindow("docs/help.reel", "Help", "{width:300, height:500}");
     */
    openWindow: {
        value: function (component, name, parameters) {
            var thisRef = this,
                childWindow = new MontageWindow(),
                childApplication,
                event,
                windowParams = {
                    location: false,
                    // height: <pixels>,
                    // width: <pixels>,
                    // left: <pixels>,
                    // top: <pixels>,
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
                callback: function (aWindow, aComponent) {
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

            self.mr.loadPackage({name: "montage"}).then(function (require) {
                var newWindow = window.open(require.location + "window-loader/index.html", "_blank", stringParamaters);
                newWindow.loadInfo = loadInfo;
            });

            return childWindow;
        }
    },

    /**
     * Attach a window to a parent application.
     * When a window open, it is automatically attached to the Application used
     * to create the window.
     * @function
     * @param {MontageWindow} window to detach.
     */
    attachWindow: {
        value: function (montageWindow) {
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
                montageWindow.focus();
            }
            return montageWindow;
        }
    },

    /**
     * Detach the window from its parent application.
     * If no montageWindow is specified, the current application's windows will
     * be detached.
     * @function
     * @param {MontageWindow} window to detach.
     */
    detachWindow: {
        value: function (montageWindow) {
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

    constructor: {
        value: function Application() {
            if (window.loadInfo && !this.parentApplication) {
                this.parentApplication = window.loadInfo.parent.document.application;
            }
        }
    },

    _load: {
        value: function (applicationRequire, callback) {
            var rootComponent,
                self = this;

            // assign to the exports so that it is available in the deserialization of the template
            exports.application = self;

            return require.async("ui/component")
            .then(function(exports) {
                rootComponent = exports.__root__;
                rootComponent.element = document;

                return require("./template").instantiateDocument(window.document, applicationRequire)
                .then(function (part) {
                    self.callDelegateMethod("willFinishLoading", self);
                    rootComponent.needsDraw = true;
                    if (callback) {
                        callback(self);
                    }
                    return self;
                });
            });
        }
    },

    /**
     * @private
     */
    _alertPopup: {value: null, enumerable: false},
    /**
     * @private
     */
    _confirmPopup: {value: null, enumerable: false},
    /**
     * @private
     */
    _notifyPopup: {value: null, enumerable: false},
    /**
     * @private
     */
    _zIndex: {value: null},

    /**
     * @private
     */
    _isSystemPopup: {value: function (type) {
        return (type === 'alert' || type === 'confirm' || type === 'notify');
    }},

    /**
     * @private
     */
    _createPopupSlot: {value: function (zIndex) {
        var slotEl = document.createElement('div');
        document.body.appendChild(slotEl);
        slotEl.style.zIndex = zIndex;
        slotEl.style.position = 'absolute';

        var popupSlot = new Slot();
        popupSlot.element = slotEl;
        popupSlot.attachToParentComponent();
        return popupSlot;
    }},

    getPopupSlot: {
        value: function (type, content, callback) {

            var self = this;
            require.async("ui/slot.reel/slot")
            .then(function (exports) {
                Slot = Slot || exports.Slot;
                type = type || "custom";
                var isSystemPopup = self._isSystemPopup(type), zIndex, popupSlot;
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

    returnPopupSlot: {value: function (type) {
        var self = this;
        if(self.popupSlots && self.popupSlots[type]) {
            var popupSlot = self.popupSlots[type];
            popupSlot.content = null;
            // is there a way to remove the Slot
            // OR should we remove the slotEl from the DOM to clean up ?
        }

    }},

    /**
     * @private
     */
    _getActivePopupSlots: {
        value: function () {
            var arr = [];
            if(this.popupSlots) {
                var keys = Object.keys(this.popupSlots);
                if(keys && keys.length > 0) {
                    var i, len = keys.length, slot;
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

