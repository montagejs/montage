var Montage = require("core/core").Montage,
    Promise = require("core/promise").Promise,
    Map = require("collections/map"),
    application = require("core/application").application,
    AuthorizationPolicy = require("data/service/authorization-policy").AuthorizationPolicy,
    MANAGER_PANEL_MODULE = "ui/authorization-manager-panel.reel";


/**
 * Helps coordinates the needs for DataServices to get the authorization they
 * need to access data. It is meant to be a singleton, so the constructor
 * enforces that.
 *
 * @class
 * @extends external:Montage
 */
var AuthorizationManager = Montage.specialize(/** @lends AuthorizationManager.prototype */ {

    constructor: {
        value: function () {
            this._providersByModuleID = new Map();
            this._panelsByModuleID = new Map();
            this._authorizationsByProviderModuleID = new Map();
            this.defineBinding("hasPendingServices", {"<-": "_pendingServicesCount != 0"});
            return this;
        }
    },

    /********************************************
     * Caching
     */

    // Provider Module ID to Authorization Promise
    _authorizationsByProviderModuleID: {
        value: undefined
    },

    // Module ID to Panel
    _panelsByModuleID: {
        value: undefined
    },

    // Module ID to Service
    _providersByModuleID: {
        value: undefined
    },

    /********************************************
     * Panels
     */

    _managerPanel: {
        value: function () {
            var self = this,
                moduleId;

            if (!this._managerPanelPromise && this.authorizationManagerPanel) {
                this.authorizationManagerPanel.authorizationManager = this;
                this._managerPanelPromise = Promise.resolve(this.authorizationManagerPanel);
            } else if (!this._managerPanelPromise) {
                moduleId = this.callDelegateMethod("authorizationManagerWillLoadAuthorizationManagerPanel", this, MANAGER_PANEL_MODULE) || MANAGER_PANEL_MODULE;
                this._managerPanelPromise = require.async(moduleId).bind(this).then(function (exports) {
                    var panel = new exports.AuthorizationManagerPanel();
                    self.authorizationManagerPanel = panel;
                    panel.authorizationManager = self;
                    return panel;
                }).catch(function(error) {
                    console.log(error);
                });
            }

            return this._managerPanelPromise;
        }
    },

    _panelForProvider: {
        value: function (provider) {
            var moduleId = this._panelModuleIDForProvider(provider),
                panel = this._panelsByModuleID.get(moduleId);

            return panel ? Promise.resolve(panel) : this._makePanelForProvider(moduleId, provider);
        }
    },

    _panelModuleIDForProvider: {
        value: function (provider) {
            var moduleID = provider.authorizationPanel;
            return this.callDelegateMethod("authorizationManagerWillAuthorizeServiceWithPanelModuleId", this,  provider, moduleID) || moduleID;
        }
    },

    _makePanelForProvider: {
        value: function (panelModuleID, provider) {
            var self = this,
                providerInfo = Montage.getInfoForObject(provider),
                panelPromise;

            if (panelModuleID) {
                panelPromise = providerInfo.require.async(panelModuleID).then(function (exports) {
                    var exportNames = Object.keys(exports),
                        panel, i, n;

                    for (i = 0, n = exportNames.length; i < n && !panel; ++i) {
                        panel = self._panelForConstructorAndProvider(exports[exportNames[i]], provider);
                    }
                    panel.service = provider;
                    self._panelsByModuleID.set(panelModuleID, panel);
                    return panel;
                });
            }

            return panelPromise;
        }
    },

    _panelForConstructorAndProvider: {
        value: function (constructor, provider) {
            return this.callDelegateMethod("authorizationManagerWillInstantiateAuthorizationPanelForService", this, constructor, provider) || new constructor();
        }
    },

    /********************************************
     * Services/Providers
     */

    _canNotifyDataService: {
        value: function (dataService) {
            return dataService.authorizationManagerWillAuthorizeWithService && typeof dataService.authorizationManagerWillAuthorizeWithService === "function";
        }
    },

    _providersForDataService: {
        value: function (dataService) {
            var promises = [],
                dataServiceInfo = Montage.getInfoForObject(dataService),
                providerIDs = dataService.authorizationServices,
                providerPromise, i, n;

            for (i = 0, n = providerIDs.length; i < n; ++i) {
                providerPromise = this._providerWithModuleID(providerIDs[i], dataServiceInfo.require);
                promises.push(providerPromise);
            }

            return Promise.all(promises);
        }
    },

    _providerWithModuleID: {
        value: function (moduleID, require) {
            var existingService = this._providersByModuleID.get(moduleID);
            return existingService ? Promise.resolve(existingService) :
                                     this._makeProviderWithModuleID(moduleID, require);
        }
    },


    _authorizationWithProvider: {
        value: function (moduleID, require) {
            var self = this,
                provider;
            return this._providerWithModuleID(moduleID, require).then(function (instance) {
                provider = instance;
                return provider.authorize();
            }).then(function (authorization) {
                return authorization || self._authorizeProviderWithManagerPanel(provider);

            });
        }
    },

    _authorizeProviderWithManagerPanel: {
        value: function (provider) {
            var self = this,
                managerPanel;
            self._pendingServicesCount++;
            return this._managerPanel().then(function (authManagerPanel) {
                managerPanel = authManagerPanel;
                return self._panelForProvider(provider);
            }).then(function (panel) {
                return managerPanel.authorizeWithPanel(panel);
            }).then(function (authorization) {
                self._pendingServicesCount--;
                return authorization;
            });
        }
    },

    _makeProviderWithModuleID: {
        value: function (moduleID, require) {
            var self = this;
            return require.async(moduleID).then(function (exports) {
                var provider, i, providerName,
                    providerNames = Object.keys(exports);
                for (i = 0; (providerName = providerNames[i]); ++i) {
                    provider = provider || new exports[providerName]();
                }
                self.registerAuthorizationService(provider);
                return provider;
            });
        }
    },

    _notifyDataService: {
        value: function (dataService) {
            var i, n;

            if (this._canNotifyDataService(dataService)) {
                return this._providersForDataService(dataService).then(function (services) {
                    for (i = 0, n = services.length; i < n; i++) {
                        //We tell the data service we're authorizing about authorizationService we create and are about to use.
                        dataService.authorizationManagerWillAuthorizeWithService(this, services[i]);
                    }
                });
            }

            return Promise.resolve(null);
        }
    },

    /********************************************
     * Public
     */

    /**
     * Module ID of the panel that displays the UI specific to the authorization providers.
     *
     *
     * Each authorization provider has a module ID pointing to a component which displays whatever
     * UI is required to get authorization through that provider. The most common UI for
     * applications with a single auth provider is a login form. The most common UI for
     * applications with multiple providers is the view that shows a button for each provider
     * and allows the user to select their preferred provider. For example, a button for each
     * of Facebook, Linkedin, and Google. The authorizationManagerPanel is the container
     * into which the provider-specific components are placed.
     *
     * @type {string}
     */
    authorizationManagerPanel: {
        value: undefined
    },

    /**
     * Takes care of obtaining authorization for a DataService. Returns a promise of Authorization
     *
     * TODO:
     * 1. Handle repeated calls: if a DataService authorizes on-demand it's likely
     * it would come from fetching data. Multiple independent fetches could trigger repeated
     * attempts to authorize: The promise should be cached and returned when pending.
     *
     * TODO:
     * 2. A service could require mandatory authorization from 2 dataService, right now it's implemented
     * in a way that we expect user to make a choice in one of aDataService.authorizationServices,
     * not a combination of. We need another structure to represent that.
     *
     * TODO
     * right now, Promises for existing objects are resolved, meaning that the loops could see different
     * types of objects coming in. Existing objects could be just added to array filled after the Promise.all().then..
     *
     * @method
     * @argument {DataService} dataService - A dataService for which to get an authorization
     */


    authorizeService: {
        value: function (dataService, didFailAuthorization) {
            var self = this,
                authorizationPromises = [];


            if (dataService.authorizationPolicy === AuthorizationPolicy.NONE) {
                return Promise.resolve(null);
            } else {

                //[TJ] This will only work for data services with a single authorization-service
                authorizationPromises = this._authorizationsForDataService(dataService);

                if (authorizationPromises.length) {
                    return Promise.all(authorizationPromises);
                } else if (dataService.authorizationPolicy === AuthorizationPolicy.ON_DEMAND && !didFailAuthorization) {
                    return Promise.resolve(null);
                } else {

                    authorizationPromises = this._authorizationsForDataService(dataService, true);
                    return self._notifyDataService(dataService).then(function () {
                        var useModal = application.applicationModal && self.authorizationManagerPanel.runModal;
                        return useModal ? self.authorizationManagerPanel.runModal() : Promise.all(authorizationPromises);
                    }).then(function(authorizations) {
                        self.callDelegateMethod("authorizationManagerDidAuthorizeService", self, dataService);
                        //TODO [TJ] How to concatenate authorizations from different auth services
                        //TODO      into a single Authorization Object for the data-service
                        return authorizations;
                    }).catch(function () {
                        self.hasPendingServices = false;
                    });
                }
            }
        }
    },

    _authorizationsForDataService: {
        value: function (dataService, requestIfAbsent) {
            var promises = [],
                dataServiceInfo = Montage.getInfoForObject(dataService),
                promise, moduleID, i, n;
            for (i = 0, n = dataService.authorizationServices.length; i < n; i++) {
                moduleID = dataService.authorizationServices[i];
                promise = this._authorizationForServiceFromProvider(moduleID, dataServiceInfo.require, requestIfAbsent);
                if (promise) {
                    promises.push(promise);
                }
            }
            return promises;
        }
    },

    _authorizationForServiceFromProvider: {
        value: function (moduleID, require, requestIfAbsent) {
            var promise = null;
            if (this._authorizationsByProviderModuleID.has(moduleID)) {
                promise = this._authorizationsByProviderModuleID.get(moduleID);
            } else if (requestIfAbsent) {
                promise = this._authorizationWithProvider(moduleID, require);
                this._authorizationsByProviderModuleID.set(moduleID, promise);
            }
            return promise;
        }
    },


    _pendingServicesCount: {
        value: 0
    },

    delegate: {
        value: null
    },


    /**
     * Flag to track the number of services pending on the AuthorizationManagerPanel.
     * The value is true if 1 or more services is currently pending. It can be used as
     * an alternative to runModal()/closeModal()
     * @type {boolean}
     */
    hasPendingServices: {
        value: false
    },


    /**
     *
     * @method
     * @argument {DataService} dataService - A dataService to be registered as an Authorization provider
     */
    registerAuthorizationService: {
        value: function(dataService) {
            var info = Montage.getInfoForObject(dataService);
            this._providersByModuleID.set(info.moduleId, dataService);
        }
    }

});

exports.AuthorizationManager = new AuthorizationManager();
