/**
 * @module "montage/ui/loader.reel"
 */
var Montage = require("../../core/core").Montage,
    Component = require("../component").Component,
    logger = require("../../core/logger").logger("loader"),
    defaultEventManager = require("../../core/event/event-manager").defaultEventManager,
    bootstrappingTimeoutPropertyName = "_montageStartBootstrappingTimeout",
    MONTAGE_BOOTSTRAPPER_ELEMENT_ID = "montage-app-bootstrapper",
    MONTAGE_LOADER_ELEMENT_ID = "montage-app-loader",
    BOOTSTRAPPING_CLASS_NAME = "montage-app-bootstrapping",
    LOADING_CLASS_NAME = "montage-app-loading",
    LOADED_CLASS_NAME = "montage-app-loaded";

/**
 * @const
 * @type {number}
 * @default
 */
var PRELOADING = 0,
    BOOTSTRAPPING = 1,
    LOADING = 2,
    LOADED = 3;

/**
 @class Loader
 @extends Component
 */
exports.Loader = Component.specialize( /** @lends Loader.prototype # */ {
    /**
     * @constructs Loader
     */
    constructor: {
        value: function Loader() {
            this.super();
        }
    },

    // Configuration Properties

    /**
     * The main module to require
     */
    mainModule: {
        value: "ui/main.reel"
    },

    /**
     * The name of the object to read from the mainModule exports
     */
    mainName: {
        value: "Main"
    },

    /**
     * Whether or not to include framework modules in the collection of required and initialized modules
     */
    includeFrameworkModules: {
        value: false
    },

    /**
     * The minimum amount of time the bootstrapping indicator must be shown for
     */
    minimumBootstrappingDuration: {
        value: 1500
    },

    /**
     * The minimum amount of time the loading indicator must be shown for
     */
    minimumLoadingDuration: {
        value: 2000
    },

    _initializedModules: {
        value: null
    },

    /**
     */
    initializedModules: {
        dependencies: ["includeFrameworkModules"],
        enumerable: false,
        get: function () {
            if (!this._initializedModules || this.includeFrameworkModules) {
                return this._initializedModules;
            } else {
                return this._initializedModules.slice(this._frameworkModuleCount - 1);
            }
        },
        set: function (value) {
            this._initializedModules = value;
        }
    },

    _requiredModules: {
        value: null
    },

    /**
     */
    requiredModules: {
        dependencies: ["includeFrameworkModules"],
        enumerable: false,
        get: function () {
            if (!this._requiredModules || this.includeFrameworkModules) {
                return this._requiredModules;
            } else {
                return this._requiredModules.slice(this._frameworkModuleCount - 1);
            }
        },
        set: function (value) {
            this._requiredModules = value;
        }
    },

    // States

    _currentStage: {
        value: PRELOADING
    },

    /**
     */
    currentStage: {
        get: function () {
            return this._currentStage;
        },
        set: function (value) {
            if (value === this._currentStage) {
                return;
            }

            if (logger.isDebug) {
                logger.debug(this, "CURRENT STAGE: " + value);
            }
            this._currentStage = value;
            this.needsDraw = true;
        }
    },

    _readyToShowLoader: {
        value: false
    },

    /**
     * Whether the loader is loading the application's main component at this
     * time.
     * @type {boolean}
     */
    isLoadingMainComponent: {
        value: null
    },

    /**
     */
    readyToShowLoader: {
        get: function () {
            return this._readyToShowLoader;
        },
        set: function (value) {
            if (value !== this._readyToShowLoader) {
                return;
            }

            this._readyToShowLoader = value;
            this.needsDraw = true;
        }
    },

    /**
     * Specifies whether the main component is ready to be displayed.
     */
    readyToShowMainComponent: {
        get: function () {
            return !!this._mainComponent;
        }
    },

    // Internal Properties

    _frameworkModuleCount: {
        enumerable: false,
        value: null
    },

    hasTemplate: {
        enumerable: false,
        value: false
    },

    _mainComponent: {
        value: null
    },

    _mainComponentEnterDocument: {
        value: null
    },

    _showLoadingTimeout: {
        enumerable: false,
        value: null
    },

    _showMainComponentTimeout: {
        enumerable: false,
        value: null
    },

    // Implementation

    templateDidLoad: {
        value: function () {

            if (logger.isDebug) {
                logger.debug(this, "templateDidLoad");
            }

            if (!this.element) {
                this.element = document.documentElement;
                this.attachToParentComponent();
            }
            this.readyToShowLoader = true;

            var timing = document._montageTiming,
                remainingBootstrappingDelay,
                self = this;

            if (timing.bootstrappingStartTime) {

                if (logger.isDebug) {
                    logger.debug(this, "had already started bootstrapping");
                }

                // We just found out we were bootstrapping…
                this.currentStage = BOOTSTRAPPING;

                // but we're technically done bootstrapping and can show loader now if we should
                timing.bootstrappingEndTime = Date.now();

                remainingBootstrappingDelay = this.minimumBootstrappingDuration - (timing.bootstrappingEndTime - timing.bootstrappingStartTime);

                if (remainingBootstrappingDelay > 0) {
                    if (logger.isDebug) {
                        logger.debug(this, "still need to show bootstrapper for another " + remainingBootstrappingDelay + "ms");
                    }
                    this._showLoadingTimeout = setTimeout(function () {
                        self._revealLoader();
                    }, remainingBootstrappingDelay);
                } else {
                    this._revealLoader();
                }
            } else {
                // The bootstrapper hasn't decided to show yet, that's fine let's try to load main
                if (logger.isDebug) {
                    logger.debug(this, "bootstrapping has not started yet…");
                }
                this._loadMainComponent();
            }
        }
    },

    _revealLoader: {
        value: function () {

            if (logger.isDebug) {
                logger.debug(this, "_revealLoader");
            }

            this.currentStage = LOADING;
            document._montageTiming.loadingStartTime = Date.now();

            var i,
                loaderElement = document.getElementById(MONTAGE_LOADER_ELEMENT_ID),
                children,
                iChild,
                iComponent;

            if (loaderElement) {
                children = loaderElement.children;

                for (i = 0; (iChild = children[i]); i++) {
                    if ((iComponent = iChild.component)) {
                        iComponent.attachToParentComponent();
                        iComponent.needsDraw = true;
                    }
                }
            }

        }
    },

    _revealMainComponent: {
        value: function () {
            if (logger.isDebug) {
                logger.debug(this, "_revealMainComponent");
            }
            this.currentStage = LOADED;
        }
    },

    _loadMainComponent: {
        value: function () {
            if (logger.isDebug) {
                logger.debug(this, "_loadMainComponent");
            }
            this.isLoadingMainComponent = true;
            var self = this;
            mr.async(this.mainModule)
            .then(function (exports) {
                if (!(self.mainName in exports)) {
                    throw new Error(self.mainName + " was not found in " + self.mainModule);
                }
                return self._mainLoadedCallback(exports);
            })
            .done();
        }
    },

    _mainLoadedCallback: {
        value: function (exports) {
            if (logger.isDebug) {
                logger.debug(this, "_mainLoadedCallback");
            }
            // We've loaded the class for the mainComponent
            // instantiate it and lets find out what else we need to load
            // based on its template
            this._mainComponent = exports[this.mainName].create();
            this._mainComponentEnterDocument = this._mainComponent.enterDocument;
            this._mainComponent.enterDocument = this.mainComponentEnterDocument.bind(this);
            this._mainComponent.setElementWithParentComponent(document.createElement("div"), this);
            this._mainComponent.attachToParentComponent();
            this._mainComponent._canDrawOutsideDocument = true;
            this._mainComponent.needsDraw = true;
        }
    },

    mainComponentEnterDocument: {
        value: function () {
            var self = this,
                insertionElement;

            if (logger.isDebug) {
                logger.debug(this, "main preparing to draw");
            }
            this.isLoadingMainComponent = false;

            // Determine old content
            this._contentToRemove = document.createRange();

            // If installing classnames on the documentElement (to affect as high a level as possible)
            // make sure content only ends up inside the body
            insertionElement = this.element === document.documentElement ? document.body : this.element;
            this._contentToRemove.selectNodeContents(insertionElement);

            // Add new content so mainComponent can actually draw
            this.childComponents = [this._mainComponent];
            insertionElement.appendChild(this._mainComponent.element);

            var startBootstrappingTimeout = document[bootstrappingTimeoutPropertyName],
                timing = document._montageTiming,
                remainingBootstrappingDelay,
                remainingLoadingDelay;

            // if we hadn't even started to say we were bootstrapping…
            if (!timing.bootstrappingStartTime) {
                // don't bother showing bootstrapping, just show the mainComponent
                if (logger.isDebug) {
                    logger.debug(this, "bootstrapper never shown");
                }
                clearTimeout(startBootstrappingTimeout);
                startBootstrappingTimeout = null;
                this._revealMainComponent();
            }

            // Otherwise if we started bootstrapping, but never started loading…
            else if (timing.bootstrappingStartTime && !timing.loadingStartTime) {

                // don't ever show the loader and wait until we've bootstrapped for the minimumBootstrappingDuration
                clearTimeout(this._showLoadingTimeout);
                this._showLoadingTimeout = null;

                timing.bootstrappingEndTime = Date.now();

                if ((remainingBootstrappingDelay = this.minimumBootstrappingDuration - (timing.bootstrappingEndTime - timing.bootstrappingStartTime)) > 0) {
                    if (logger.isDebug) {
                        logger.debug(this, "show bootstrapper for another " + remainingBootstrappingDelay + "ms");
                    }
                    this._showMainComponentTimeout = setTimeout(function () {
                        if (logger.isDebug) {
                            logger.debug(this, "ok, shown bootstrapper long enough");
                        }
                        self._revealMainComponent();
                    }, remainingBootstrappingDelay);
                } else {
                    setTimeout(function () {
                        if (logger.isDebug) {
                            logger.debug(this, "ok, showing bootstrapper now");
                        }
                        self._revealMainComponent();
                    }, 0);
                }
            }

            //Otherwise, we apparently started showing loading progress…
            else if (timing.loadingStartTime) {
                timing.loadingEndTime = Date.now();

                // wait until we've loaded for the minimumLoadingDuration
                // TODO this is not precise, but it's a decent start for scheduling the delay
                if ((remainingLoadingDelay = this.minimumLoadingDuration - (timing.loadingEndTime - timing.loadingStartTime)) > 0) {
                    if (logger.isDebug) {
                        logger.debug(this, "show loader for another " + remainingLoadingDelay + "ms");
                    }
                    this._showMainComponentTimeout = setTimeout(function () {
                        if (logger.isDebug) {
                            logger.debug(this, "ok, shown loader long enough");
                        }
                        self._revealMainComponent();
                    }, remainingLoadingDelay);
                } else {
                    // or we showed loading long enough, go ahead and show mainComponent
                    this._revealMainComponent();
                }
            }

            var mainComponent = this._mainComponent;

            // Remove the connection from the Loader to the DOM tree and add
            // the main component to the component tree.
            defaultEventManager.unregisterEventHandlerForElement(this.element);
            mainComponent.attachToParentComponent();

            // When the main component enters the document it is loaded, update
            // the currentStage to reflect that situation if we're behind.
            if (this.currentStage < LOADED) {
                this.currentStage = LOADED;
            }

            mainComponent.enterDocument = this._mainComponentEnterDocument;
            if (mainComponent.enterDocument) {
                return mainComponent.enterDocument.apply(mainComponent, arguments);
            }
        }
    },

    /**
     * Specifies whether to remove the loading content when load is completed.
     * @property {boolean} value
     * @default true
    */
    removeContentOnLoad: {
        value: true
    },

    _forceContentRemoval: {
        enumerable: false,
        value: false
    },

    _contentToRemove: {
        enumerable: false,
        value: null
    },

    /**
     * Forces a manual removal of loading content.
     */
    removeContent: {
        value: function () {
            this._forceContentRemoval = true;
            this.needsDraw = true;
        }
    },

    draw: {
        value: function () {
            // start loading the mainComponent if we haven't already
            if (!this.readyToShowMainComponent && !this.isLoadingMainComponent) {
                if (logger.isDebug) {
                    logger.debug(this, "draw; start loading main component");
                }
                this._loadMainComponent();
            }

            // Reflect the current loading stage
            if (LOADING === this.currentStage) {

                this.element.classList.remove(BOOTSTRAPPING_CLASS_NAME);
                this.element.classList.add(LOADING_CLASS_NAME);

            } else if (LOADED === this.currentStage && this._contentToRemove) {

                this.element.classList.remove(BOOTSTRAPPING_CLASS_NAME);
                this.element.classList.remove(LOADING_CLASS_NAME);

                if(this.removeContentOnLoad || this._forceContentRemoval) {
                    this._contentToRemove.extractContents();
                    this._contentToRemove = null;
                }

                this.element.classList.add(LOADED_CLASS_NAME);

                var loadEvent = document.createEvent("CustomEvent");
                loadEvent.initCustomEvent("componentLoaded", true, true, this._mainComponent);
                this.dispatchEvent(loadEvent, true, true);
                // Remove the Loader from the component tree, we can only do
                // this after the last draw the Loader needs to make.
                this.detachFromParentComponent();
            }

        }
    }

});

