var Montage = require("core/core").Montage;

/**
 * AuthorizationPolicyType
 *
 * UpfrontAuthorizationPolicy
 *     Authorization is asked upfront, immediately after data service is
 *     created / launch of an app.
 *
 * OnDemandAuthorizationPolicy
 *     Authorization is required when a request fails because of lack of
 *     authorization. This is likely to be a good strategy for DataServices
 *     that offer data to both anonymous and authorized users.
 *
 */
var AuthorizationPolicy = exports.AuthorizationPolicy = Montage.specialize({

    id: {
        value: undefined
    }

}, {
    withID: {
        value: function (id) {
            var policy = new this();
            policy.id = id;
            return policy;
        }
    }
});
AuthorizationPolicy.ON_DEMAND = AuthorizationPolicy.withID("ON_DEMAND");
AuthorizationPolicy.ON_FIRST_FETCH = AuthorizationPolicy.withID("ON_FIRST_FETCH");
AuthorizationPolicy.NONE = AuthorizationPolicy.withID("NONE");
AuthorizationPolicy.UP_FRONT = AuthorizationPolicy.withID("UP_FRONT");
