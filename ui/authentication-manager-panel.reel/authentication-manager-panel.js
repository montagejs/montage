var Component = require("ui/component").Component,
    Promise  = require("core/promise").Promise,
    application = require("core/application").application,
    Map = require("core/collections/map"),
    Montage = require("montage").Montage;

/**
 * @class Main
 * @extends Component
 */
exports.AuthenticationManagerPanel = Component.specialize({

    panels: {
        get: function () {
            if (!this._panels) {
                this._panels = [];
            }
            return this._panels;
        },
        set: function (value) {
            console.warn("AuthenticationManagerPanel.panels.set", value);
        }
    },

    identityManager: {
        value: undefined
    },

    // approveAuthorization: {
    //     value: function (authorization, panel) {

    //         if (panel) {
    //             this._deregisterPanel(panel, authorization);
    //         }

    //         if (!this.panels.length && this._authorizationResolve) {
    //             this._authorizationResolve(authorization);
    //         }
    //     }
    // },

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

    // cancelAuthorization: {
    //     value: function(panel) {
    //         if (panel) {
    //             this._deregisterPanel(panel);
    //         }

    //         if (application.applicationModal) {
    //             application.applicationModal.hide(this);
    //         }
    //         if (this._authorizationResolve) {
    //             this._authorizationReject("CANCEL");
    //         }
    //     }
    // },

    // _authorizationReject: {
    //     value: void 0
    // },

    runModal: {
        value: function() {
            var self = this;
            return new Promise(function(resolve, reject) {
                self._authorizationResolve = resolve;
                self._authorizationReject = reject;
                // FIXME This is temporary shortcut for FreeNAS while we fix Montage's modal.
                if (application && application.applicationModal) {
                    application.applicationModal.show(self);
                }
                else {
                    self.show();
                }
            });
        }
    },

    show: {
        value: function() {
            if(this.application) {
                var type = this.type,
                self = this;
                this.application.getPopupSlot(type, this, function(slot) {
                    self._popupSlot = slot;
                    self.displayed = true;
                    self._addEventListeners();
                });
            }
        }
    },

    /**
    * Hide the popup
    */
    hide: {
        value: function() {
            if(this.application) {

                var type = this.type,
                    self = this;

                this.application.getPopupSlot(type, this, function(slot) {
                    self._removeEventListeners();
                    self.application.returnPopupSlot(type);
                    self.displayed = false;
                });
            }
        }
    },

    type: {
        value: "authentication"
    },

    _addEventListeners: {
        value: function() {
            if (window.Touch) {
                this.element.ownerDocument.addEventListener('touchstart', this, false);
            } else {
                this.element.ownerDocument.addEventListener('mousedown', this, false);
                this.element.ownerDocument.addEventListener('keyup', this, false);
            }
            window.addEventListener('resize', this);
        }
    },

    _removeEventListeners: {
        value: function() {
            if (window.Touch) {
                this.element.ownerDocument.removeEventListener('touchstart', this, false);
            } else {
                this.element.ownerDocument.removeEventListener('mousedown', this, false);
                this.element.ownerDocument.removeEventListener('keyup', this, false);
            }
            window.removeEventListener('resize', this);
        }
    }

});


// FIXME: Selection needs to be managed by a selection controller
