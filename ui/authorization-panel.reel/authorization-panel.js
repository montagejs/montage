var Component = require("ui/component").Component,
    AuthorizationManager = require("data/service/authorization-manager").defaultAuthorizationManager,
    AuthorizationManagerPanel = require("ui/authorization-manager-panel.reel").AuthorizationManagerPanel,
    deprecate = require("core/deprecate");

/**
 * @class Main
 * @extends Component
 */
exports.AuthorizationPanel = Component.specialize({

    dataService: {
        get: deprecate.deprecateMethod(void 0, function () {
            return !!this.service;
        }, "dataService", "service"),
        set: deprecate.deprecateMethod(void 0, function () {
            return !!this.service;
        }, "dataService", "service")
    },

    service: {
        value: null
    },

    authorizationManagerPanel: {
        get: function() {
            return AuthorizationManager.authorizationManagerPanel;
        }
    }

});
