var RawDataService = require("./raw-data-service").RawDataService,
    IdentityManager = require("./identity-manager").IdentityManager,
    IdentityService;


/**
 *
 * @class
 * @extends RawDataService
 * @deprecated The Authorization API was moved to DataService itself.
 */
exports.IdentityService = IdentityService = RawDataService.specialize( /** @lends AuthorizationService.prototype */ {


    constructor: {
        value: function IdentityService() {
            RawDataService.call(this);
            /*
                This is done in DataService's constructor as well,
                needs to decide where is best, but not do it twice.
            */
            //IdentityService.identityServices.push(this);
        }
    },
    providesIdentity: {
        value: true
    }

}, {
    registerIdentityService: {
        value: function(aService) {
            IdentityManager.registerIdentityService(aService);
        }
    },

    identityServices: {
        value: IdentityManager.identityServices
    }
});
