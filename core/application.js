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

var Target = require("./target").Target,
    Template = require("./template"),
    MontageWindow = require("../window-loader/montage-window").MontageWindow,
    Criteria = require("core/criteria").Criteria,
    DataQuery = require("data/model/data-query").DataQuery,
    UserIdentityService = undefined,
    UserIdentityManager = require("data/service/user-identity-manager").UserIdentityManager,
    Slot;

require("./dom");

var FIRST_LOAD_KEY_SUFFIX = "-is-first-load";

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
     * Provides a reference to the parent application.
     *
     * @property {Application} value
     * @default null
     */
    parentApplication: {
        value: null
    },

    name: {
        value: null
    },

    _isFirstLoad: {
        value: null
    },

    isFirstLoad: {
        get: function () {
            return this._isFirstLoad;
        }
    },

    url: {
        get: function() {
            return document && document.location
                        ? new URL(document.location)
                        :  null;
        }
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
            if (this.parentApplication === null) {
                return this._windowsSortOrder;
            } else {
                return this.mainApplication.windowsSortOrder;
            }
        },

        set: function (value) {
            if (this.parentApplication === null) {
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
            if (this.parentApplication === null) {
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
            if (!this._window && this === this.mainApplication) {
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

            if (sortOrder === "z-order") {
                return windows[0];
            } else if (sortOrder === "reverse-z-order") {
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

            var self = this,
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

                    self.attachedWindows.push(childWindow);

                    sortOrder = self.mainApplication.windowsSortOrder;
                    if (sortOrder === "z-order" || sortOrder === "reverse-open-order") {
                        self.windows.unshift(childWindow);
                    } else {
                        self.windows.push(childWindow);
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

            var param, value, separator = "", stringParamaters = "";
            if (typeof parameters === "object") {

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
                if (excludedParams.indexOf(param) === -1) {
                    value = windowParams[param];
                    if (typeof value === "boolean") {
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

            global.require.loadPackage({name: "montage"}).then(function (require) {
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
                if (sortOrder === "z-order" || sortOrder === "reverse-open-order") {
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

            if (parentApplicaton === this) {
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
            if (
                typeof window !== "undefined" &&
                    window.loadInfo && !this.parentApplication
            ) {
                this.parentApplication = window.loadInfo.parent.document.application;
            }

            UserIdentityManager.delegate = this;
        }
    },

    _load: {
        value: function (applicationRequire, callback) {
            var rootComponent,
                self = this;

            this.name = applicationRequire.packageDescription.name;
            this._loadApplicationContext();

            // assign to the exports so that it is available in the deserialization of the template
            exports.application = self;

            return require.async("ui/component").then(function(exports) {
                var authorizationPromise;

                self.rootComponent = rootComponent = exports.__root__;
                if (typeof document !== "undefined") {
                    rootComponent.element = document;
                }


                /*

                    TODO!!! Modify loading sequence to combine loader -> Authorization Panel -> Main

                    While bringing the login panel up when there's an UpfrontAuthorizationPolicy before loading Main
                    makes sense from both security and performance stand point, we shouldn't be skipping the loader.

                    We should deserialize the loader, set the authentication panel as loader's Main, show the AuthenticationManager panel,
                    and then bring the Main in
                */

                //URGENT: We need to further test that we don't already have a valid Authorization to use before authenticating.
                return require.async("data/service/user-identity-service");
            })
            .then(function(exports) {
                UserIdentityService = exports.UserIdentityService;

                var userIdentityServices = UserIdentityService.userIdentityServices,
                    userIdentityObjectDescriptors,
                    authenticationPromise,
                    //    userObjectDescriptor = this.
                    selfUserCriteria,
                    userIdentityQuery;

                //Temporarily Bypassing authentication:
                if(userIdentityServices && userIdentityServices.length > 0) {
                    //Shortcut, there could be multiple one we need to flatten.
                    userIdentityObjectDescriptors = userIdentityServices[0].types;

                    if(userIdentityObjectDescriptors.length > 0) {
                        //selfUserCriteria = new Criteria().initWithExpression("identity == $", "self");
                        userIdentityQuery = DataQuery.withTypeAndCriteria(userIdentityObjectDescriptors[0]);

                        authenticationPromise = self.mainService.fetchData(userIdentityQuery)
                        .then(function(userIdenties) {
                            self.userIdentity = userIdenties[0];
                        });

                    }
                }
                else {
                    //Needs to beef-up the case we have a first anonymous user who could come back later.
                    authenticationPromise = Promise.resolve(true);
                }

                return authenticationPromise.finally(function() {
                    // if (typeof document !== "undefined") {
                    //     rootComponent.element = document;
                    // }

                    if (typeof document !== "undefined") {
                        return Template.instantiateDocument(document, applicationRequire);
                    }

                });


/*

                if (typeof document !== "undefined") {
                    rootComponent.element = document;
                }

                return authorizationPromise.then(function(authorization) {
                    if (typeof document !== "undefined") {
                        return Template.instantiateDocument(document, applicationRequire);
                    }
                }, function(error) {
                    console.error(error);
                });
                */

            }).then(function (part) {
                self.callDelegateMethod("willFinishLoading", self);
                rootComponent.needsDraw = true;
                if (callback) {
                    callback(self);
                }
                return self;
            });
        }
    },

    //This should be replaced by a more robust user / session system with opt-in/delegate/configured
    //from the outside.
    _loadApplicationContext: {
        value: function () {
            if (this._isFirstLoad === null) {

                var hasAlreadyBeenLoaded,
                    alreadyLoadedLocalStorageKey = this.name + FIRST_LOAD_KEY_SUFFIX;

                if (typeof localStorage !== "undefined") {
                    localStorage.getItem(alreadyLoadedLocalStorageKey);

                    if (hasAlreadyBeenLoaded === null) {
                        try {
                            localStorage.setItem(alreadyLoadedLocalStorageKey, true);
                        } catch (error) {
                            //console.log("Browser is in private mode.");
                        }
                    }
                }

                this._isFirstLoad = !hasAlreadyBeenLoaded;
            }
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
    _createPopupSlot: {value: function (zIndex, className) {
        var slotEl = document.createElement('div');
        document.body.appendChild(slotEl);
        slotEl.style.zIndex = zIndex;
        slotEl.style.position = 'absolute';
        slotEl.classList.add(className);

        var popupSlot = new Slot();
        popupSlot.delegate = this;
        popupSlot.element = slotEl;
        //popupSlot.attachToParentComponent();
        return popupSlot;
    }},

    getPopupSlot: {
        value: function (type, content, callback) {

            var self = this;
            require.async("ui/slot.reel/slot")
            .then(function (exports) {
                Slot = Slot || exports.Slot;
                type = type || "custom";
                var isSystemPopup = self._isSystemPopup(type), zIndex, popupSlot, className;
                self.popupSlots = self.popupSlots || {};

                if(isSystemPopup) {
                    switch (type) {
                        case "alert":
                            zIndex = 19004;
                            className = "montage-alert";
                            break;
                        case "confirm":
                            zIndex = 19003;
                            className = "montage-confirm";
                            break;
                        case "notify":
                            zIndex = 19002;
                            className = "montage-notify";
                            break;
                    }
                } else {
                    // custom popup
                    if(!self._zIndex) {
                        self._zIndex = 17000;
                    } else {
                        self._zIndex = self._zIndex + 1;
                    }
                    zIndex = self._zIndex;
                    className = self.name;
                    className += "-";
                    className += type;
                }

                popupSlot = self.popupSlots[type];
                if (!popupSlot) {
                    popupSlot = self.popupSlots[type] = self._createPopupSlot(zIndex, className);
                }

                if(!popupSlot.inDocument) {
                    self.rootComponent.addChildComponent(popupSlot);
                }

                // use the new zIndex for custom popup
                if(!isSystemPopup) {
                  //Benoit: Modifying DOM outside of draw loop here, though it's early...
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

    slotDidSwitchContent: {
        value: function (slot) {
            if(slot.content === null) {
                slot.detachFromParentComponent();
                //Benoit: can't believe we have to do that in 2 steps....
                slot.element.parentNode.removeChild(slot.element);

            }
        }
    },

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
