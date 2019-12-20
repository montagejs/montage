var RawDataService = require("data/service/raw-data-service").RawDataService,
    UserIdentityManager = require("data/service/user-identity-manager").UserIdentityManager,
    UserIdentityService;


/**
 *
 * @class
 * @extends RawDataService
 * @deprecated The Authorization API was moved to DataService itself.
 */
exports.UserIdentityService = UserIdentityService = RawDataService.specialize( /** @lends AuthorizationService.prototype */ {


    constructor: {
        value: function UserIdentityService() {
            RawDataService.call(this);
            UserIdentityService.userIdentityServices.push(this);
        }
    },
    providesUserIdentity: {
        value: true
    }

}, {
    registerUserIdentityService: {
        value: function(aService) {
            UserIdentityManager.registerUserIdentityService(aService);
        }
    },

    userIdentityServices: {
        value: UserIdentityManager.userIdentityServices
    }
});
