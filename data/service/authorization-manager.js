var Montage = require("core/core").Montage,
    Promise = require("core/promise").Promise,
    Map = require("collections/map"),
    Set = require("collections/set"),
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
exports.AuthorizationManager = Montage.specialize(/** @lends AuthorizationManager.prototype */ {

    constructor: {
        value: function () {
            this._providersByModuleID = new Map();
            this._panelsByModuleID = new Map();
            this._authorizationsByProviderModuleID = new Map();
            this._servicesByProviderModuleID = new Map();
            this._pendingServices = new Set();
            this.defineBinding("hasPendingServices", {"<-": "_pendingServices.size > 0"});
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

    // Provider Module ID to Data Service
    _servicesByProviderModuleID: {
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

     _dataServiceDelegateMethodName: {
         value: function (dataService) {
             var prefix = "authorizationManagerWillAuthorizeWith",
                 legacySuffix = "Service",
                 suffix = "Provider",
                 methodName = prefix + suffix;

            
            if (!this._isValidFunction(dataService, methodName)) {
                methodName = prefix + legacySuffix;
                if (!this._isValidFunction(dataService, methodName)) {
                    methodName = null;
                }
            }
            return methodName;
         }
     },

     _isValidFunction: {
         value: function (dataService, functionName) {
            return dataService[functionName] && typeof dataService[functionName] === "function";
         }
     },

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
                providerID, providerPromise, i, n;

            for (i = 0, n = providerIDs.length; i < n; ++i) {
                providerID = providerIDs[i];
                providerPromise = this._providerWithModuleID(providerID, dataServiceInfo.require);
                promises.push(providerPromise);
            }

            return Promise.all(promises);
        }
    },

    _providerWithModuleID: {
        value: function (moduleID, require) {
            var provider = this._providersByModuleID.get(moduleID),
                isPromise = this._isAsync(provider),
                result;

            if (isPromise) {
                result = provider;
            } else if (provider) {
                result = Promise.resolve(provider);
            } else {
                result = this._makeProviderWithModuleID(moduleID, require);
                this._registerAuthorizationServicePromise(moduleID, result);
            }

            return result;
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
                managerPanel,
                result = null;
            
            self._pendingServices.add(provider.identifier);
            return this._managerPanel().then(function (authManagerPanel) {
                managerPanel = authManagerPanel;
                return self._panelForProvider(provider);
            }).then(function (panel) {
                return managerPanel.authorizeWithPanel(panel);
            }).then(function (authorization) {
                result = authorization;
                return authorization;
            }).finally(function () {
                self._pendingServices.delete(provider.identifier);
                return result;
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
                return provider;
            });
        }
    },

    _notifyDataService: {
        value: function (dataService) {
            var self = this,
                method = this._dataServiceDelegateMethodName(dataService),
                i, n;

            // if (this._canNotifyDataService(dataService)) {
            if (method) {
                return this._providersForDataService(dataService).then(function (providers) {
                    for (i = 0, n = providers.length; i < n; i++) {
                        //We tell the data service we're authorizing about authorizationService we create and are about to use.
                        dataService[method](self, providers[i]);
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
                authorizationPromises = this._authorizationsForDataService(dataService);

                if (authorizationPromises.length) {
                    return Promise.all(authorizationPromises);
                } else if (dataService.authorizationPolicy === AuthorizationPolicy.ON_DEMAND && !didFailAuthorization) {
                    return Promise.resolve(null);
                } else {                
                    return self._notifyDataService(dataService).then(function () {
                        authorizationPromises = self._authorizationsForDataService(dataService, true);
                        var useModal = application && application.applicationModal && self.authorizationManagerPanel.runModal;
                  
                        
                        return useModal ? self.authorizationManagerPanel.runModal() : Promise.all(authorizationPromises);
                    }).then(function(authorizations) {
                        self.callDelegateMethod("authorizationManagerDidAuthorizeService", self, dataService);
                        //TODO [TJ] Concatenate authorizations from different auth services
                        //TODO      into a single Authorization Object for the data-service. 
                        //TODO      Allow a DataService to require only one of it's auth
                        //TODO      services
                        return authorizations;
                    });
                }
            }
        }
    },

    _authorizationsForDataService: {
        value: function (dataService, requestIfAbsent) {
            var promises = [],
                promise, moduleID, i, n;

            for (i = 0, n = dataService.authorizationServices.length; i < n; i++) {
                moduleID = dataService.authorizationServices[i];
                this._registerDataServiceWithProviderID(moduleID, dataService);
                promise = this._authorizationForServiceFromProvider(moduleID, dataService, requestIfAbsent);
                if (promise) {
                    promises.push(promise);
                }
            }
            return promises;
        }
    },

    _registerDataServiceWithProviderID: {
        value: function (moduleID, dataService) {
            if (!this._servicesByProviderModuleID.has(moduleID)) {
                this._servicesByProviderModuleID.set(moduleID, new Set());
            }
            this._servicesByProviderModuleID.get(moduleID).add(dataService);
        }
    },

    _authorizationForServiceFromProvider: {
        value: function (moduleID, dataService, requestIfAbsent) {
            var self = this,
                dataServiceInfo = Montage.getInfoForObject(dataService),
                require = dataServiceInfo.require,
                promise = null;
            
            if (this._authorizationsByProviderModuleID.has(moduleID)) {
                promise = this._authorizationsByProviderModuleID.get(moduleID);
            } else if (requestIfAbsent) {
                promise = this._authorizationWithProvider(moduleID, require);
                promise.catch(function (e) {
                    self._authorizationsByProviderModuleID.delete(moduleID);
                    return null;
                });
                this._authorizationsByProviderModuleID.set(moduleID, promise);
            }
            return promise;
        }
    },

    _pendingServices: {
        value: undefined
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
    },


    _registerAuthorizationServicePromise: {
        value: function(moduleID, promise) {
            this._providersByModuleID.set(moduleID, promise);
        }
    },

    clearAuthorizationForService: {
        value: function (dataService) {
            var promises = [],
                allServices = new Set(),
                services, service, iterator,
                moduleID, i, n;

            for (i = 0, n = dataService.authorizationServices.length; i < n; ++i) {
                moduleID = dataService.authorizationServices[i];
                promises.push(this._clearAuthorizationForProviderID(moduleID));
                services = this._servicesByProviderModuleID.get(moduleID);
                this._addSetToSet(allServices, services);
            }

            iterator = allServices.values();
            while ((service = iterator.next().value)) {
                service.authorization = null;
            }

            return Promise.all(promises);
        }
    },

    _clearAuthorizationForProviderID: {
        value: function (moduleID) {
            var self = this,
                provider = this._providersByModuleID.get(moduleID),
                isPromise = this._isAsync(provider),
                result;

            if (this._authorizationsByProviderModuleID.has(moduleID)) {
                this._authorizationsByProviderModuleID.delete(moduleID);
            }

            if (isPromise) {
                result = provider.then(function (provider) {
                    return self._clearAuthorizationForProvider(provider);
                });
            } else if (provider) {
                result = self._clearAuthorizationForProvider(provider);
            }
            return result;
        }
    },
    

    // AuthorizationService is responsible for propagating the logOut to  
    // the Authorization objects
    _clearAuthorizationForProvider: {
        value: function (provider) {
            var promises = [],
                authorization = provider.authorization;

            if (typeof provider.logOut === "function") {
                promises.push(provider.logOut());
            }
            if (Array.isArray(authorization)) {
                promises = promises.concat(authorization.map(function (item) {
                    return item.logOut();
                }));
            } else if (authorization) {
                promises.push(authorization.logOut());
            }

            return Promise.all(promises);
        }
    },

    //Utils

    _addSetToSet: {
        value: function (target, source) {
            var iterator = source && source.values(),
                item;
            
            while (iterator && (item = iterator.next().value)) {
                target.add(item);
            }
        }
    },

    _isAsync: {
        value: function (object) {
            return object && object.then && typeof object.then === "function";
        }
    },

    /**
     * A shared promise resolved with a value of
     * `null`
     *
     * @type {external:Promise}
     */
    nullPromise: {
        get: function () {
            if (!exports.AuthorizationManager._nullPromise) {
                exports.AuthorizationManager._nullPromise = Promise.resolve(null);
            }
            return exports.AuthorizationManager._nullPromise;
        }
    },

    _nullPromise: {
        value: undefined
    }

});

exports.defaultAuthorizationManager = new exports.AuthorizationManager();
