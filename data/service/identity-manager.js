var Montage = require("../../core/core").Montage,
    DataOperation = require("./data-operation").DataOperation,
    defaultEventManager = require("../../core/event/event-manager").defaultEventManager,
    IdentityManager;


/**
 *
 * @class
 * @extends Montage
 * @deprecated The Authorization API was moved to DataService itself.
 */
IdentityManager = Montage.specialize( /** @lends AuthorizationService.prototype */ {
    constructor: {
        value: function DataService() {
            this.defineBinding("mainService", {"<-": "mainService", source: defaultEventManager.application});
        }
    },

    registerIdentityService: {
        value: function(aService) {
            this.identityServices.push(aService);
        }
    },

    _panelsByModuleId: {
        value: new Map()
    },

    _panelWithModuleId: {
        value: function (moduleId, location, dataServiceModuleId) {
            var panel = this._panelsByModuleId.get(location+moduleId);

            return panel ? Promise.resolve(panel) : this._loadPanelWithModuleId(moduleId, location, dataServiceModuleId);
        }
    },

    _loadPanelWithModuleId: {
        value: function (panelModuleID, location, dataServiceModuleId) {
            var self = this,
                // providerInfo = Montage.getInfoForObject(provider),
                panelPromise;

            if (panelModuleID) {
                //panelPromise = providerInfo.require.async(panelModuleID)
                var panelRequire = require.packages[location];
                panelPromise = panelRequire.async(panelModuleID)
                .then(function (exports) {
                    var exportNames = Object.keys(exports),
                        panel, i, n;

                    for (i = 0, n = exportNames.length; i < n && !panel; ++i) {
                        panel = self._panelForConstructorAndProvider(exports[exportNames[i]], dataServiceModuleId);
                    }
                    //Cut the cord so it works if they're not in the same thread
                    //panel.service = provider;
                    self._panelsByModuleId.set(location+panelModuleID, panel);
                    self.authenticationManagerPanel.panels.push(panel);
                    return panel;
                });
            }

            return panelPromise;
        }
    },

    _panelForConstructorAndProvider: {
        value: function (constructor, dataServiceModuleId) {
            return this.callDelegateMethod("identityManagerWillInstantiateAuthorizationPanelForDataService", this, constructor, dataServiceModuleId) || new constructor();
        }
    },

    identityServices: {
        value: []
    },

    _mainService: {
        value: undefined
    },
    /**
     * The main data service used by this service to listen to user authentication
     * operations. We have a circular dependency pbm, so this is set by DataService
     *
     * @type {DataService}
     */

    mainService: {
        get: function() {
            return this._mainService;
        },
        set: function(value) {
            this._mainService = value;
            //We have a circular depency such that when mainService setter is called, DataOperation isn't yet on the exports symbol...
            // this._mainService.addEventListener(DataOperation.Type.UserAuthentication, this);
            // this._mainService.addEventListener(DataOperation.Type.UserAuthenticationCompleted, this);
            if(this._mainService) {
                this._mainService.addEventListener("userAuthentication", this);
                this._mainService.addEventListener("userAuthenticationCompleted", this);
            }

        }
    },

    /********************************************
     * Panels
     */

    authenticationManagerPanelModule: {
        value: "ui/authentication-manager-panel.reel"
    },

    _managerPanel: {
        value: function () {
            var self = this,
                moduleId;

            if (!this._managerPanelPromise && this.authenticationManagerPanel) {
                this.authenticationManagerPanel.authorizationManager = this;
                this._managerPanelPromise = Promise.resolve(this.authenticationManagerPanel);
            } else if (!this._managerPanelPromise) {
                moduleId = this.callDelegateMethod("identityManagerWillLoadAuthenticationManagerPanel", this, this.authenticationManagerPanelModule) || this.authenticationManagerPanelModule;
                this._managerPanelPromise = require.async(moduleId).bind(this).then(function (exports) {
                    var panel = new exports.AuthenticationManagerPanel();

                    self.authenticationManagerPanel = panel;
                    panel.identityManager = self;
                    return panel;
                }).catch(function(error) {
                    console.log(error);
                });
            }

            return this._managerPanelPromise;
        }
    },


    handleUserauthentication: {
        value: function(userAuthenticationOperation) {
            var self = this;

            console.log("handleUserauthentication:",event);
            this._managerPanel().then(function (authManagerPanel) {
                var panelModuleId = userAuthenticationOperation.authorizationPanelModuleId;
                self._panelWithModuleId(panelModuleId, userAuthenticationOperation.authorizationPanelRequireLocation,
                    userAuthenticationOperation.dataServiceModuleId)
                .then(function (authenticationPanel){
                    console.log("authenticationPanel: ",authenticationPanel);
                    authenticationPanel.identity = userAuthenticationOperation.data;
                    self.authenticationManagerPanel.runModal();
                })
            });
        }
    },

    handleUserauthenticationcompleted: {
        value: function(userAuthenticationCompletedOperation) {
            //If a cached user identity still valid, there's no
            //authenticationManagerPanel to hide.
            if(this.authenticationManagerPanel) this.authenticationManagerPanel.hide();
        }
    }
});

//Exports the singleton
exports.IdentityManager = new IdentityManager
