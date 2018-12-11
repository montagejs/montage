var Component = require("ui/component").Component,
    Promise  = require("core/promise").Promise,
    application = require("core/application").application,
    Map = require("collections/map"),
    Montage = require("montage").Montage;

/**
 * @class Main
 * @extends Component
 */
exports.AuthorizationManagerPanel = Component.specialize({

    panels: {
        get: function () {
            if (!this._panels) {
                this._panels = [];
            }
            return this._panels;
        },
        set: function (value) {
            console.warn("AuthorizationManagerPanel.panels.set", value);
        }
    },

    authorizationManager: {
        value: undefined
    },

    approveAuthorization: {
        value: function (authorization, panel) {

            if (panel) {
                this._deregisterPanel(panel, authorization);
            }

            if (!this.panels.length && this._authorizationResolve) {
                this._authorizationResolve(authorization);
            }
        }
    },

    _deregisterPanel: {
        value: function (panel, authorization) {
            var index = this.panels.indexOf(panel),
                panelInfo = Montage.getInfoForObject(panel);

            if (index !== -1) {
                this.panels.splice(index, 1);
            }

            if (authorization) {
                this._authorizationPromiseByPanel.get(panel).resolve(authorization);
            } else {
                this._authorizationPromiseByPanel.get(panel).reject(new Error("Authorization Rejected for panel (" + panelInfo.id +")"));
            }
            this._authorizationPromiseByPanel.delete(panel);
        }
    },

    _authorizationPromiseByPanel: {
        get: function () {
            if (!this.__authorizationPromiseByPanel) {
                this.__authorizationPromiseByPanel = new Map();
            }
            return this.__authorizationPromiseByPanel;
        }
    },

    authorizeWithPanel: {
        value: function (panel) {
            var self = this,
                promise;

            if (!this._authorizationPromiseByPanel.has(panel)) {
                promise = new Promise(function (resolve, reject) {
                    self._authorizationPromiseByPanel.set(panel, {
                        resolve: resolve,
                        reject: reject
                    });
                });
                this.panels.push(panel);
            } else {
                promise = Promise.resolve(null);
            }

            return promise;
        }
    },

    _authorizationResolve: {
        value: void 0
    },

    cancelAuthorization: {
        value: function(panel) {
            if (panel) {
                this._deregisterPanel(panel);
            }
            
            if (application.applicationModal) {
                application.applicationModal.hide(this);
            }
            if (this._authorizationResolve) {
                this._authorizationReject("CANCEL");
            }
        }
    },

    _authorizationReject: {
        value: void 0
    },

    runModal: {
        value: function() {
            var self = this;
            return new Promise(function(resolve, reject) {
                self._authorizationResolve = resolve;
                self._authorizationReject = reject;
                // FIXME This is temporary shortcut for FreeNAS while we fix Montage's modal.
                if (application.applicationModal) {
                    application.applicationModal.show(self);
                }
            });
        }
    }

});


// FIXME: Selection needs to be managed by a selection controller
