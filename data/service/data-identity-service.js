var IdentityService = require("data/service/identity-service").IdentityService,
    IdentityManager = require("data/service/identity-manager").IdentityManager,
    IdentityService;


/**
 *
 * @class
 * @extends IdentityService
 * @deprecated The Authorization API was moved to DataService itself.
 */
exports.DataIdentityService = DataIdentityService = IdentityService.specialize( /** @lends DataIdentityService.prototype */ {


    constructor: {
        value: function DataIdentityService() {
            IdentityService.call(this);
            /*
                This is done in DataService's constructor as well,
                needs to decide where is best, but not do it twice.
            */
            //IdentityService.identityServices.push(this);
        }
    }

}, {
});
