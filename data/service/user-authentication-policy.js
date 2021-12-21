var Montage = require("../../core/core").Montage;

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
var UserAuthenticationPolicy = exports.UserAuthenticationPolicy = Montage.specialize({

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
UserAuthenticationPolicy.ON_DEMAND = UserAuthenticationPolicy.withID("ON_DEMAND");
UserAuthenticationPolicy.ON_FIRST_FETCH = UserAuthenticationPolicy.withID("ON_FIRST_FETCH");
UserAuthenticationPolicy.NONE = UserAuthenticationPolicy.withID("NONE");
UserAuthenticationPolicy.UP_FRONT = UserAuthenticationPolicy.withID("UP_FRONT");
