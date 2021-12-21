var Montage = require("../../core/core").Montage;

/**
 * AuthorizationPolicyType
 *
 * UpfrontAuthorizationPolicy
 *     Authorization is assessed upfront, immediately after data service is
 *     created / launch of an app/data worker .
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
AuthorizationPolicy.ON_DEMAND = AuthorizationPolicy.OnDemand = AuthorizationPolicy.withID("OnDemand");
AuthorizationPolicy.ON_CONNECT = AuthorizationPolicy.OnConnect = AuthorizationPolicy.withID("OnConnect");
AuthorizationPolicy.ON_FIRST_FETCH = AuthorizationPolicy.OnFirstFetch = AuthorizationPolicy.withID("OnFirstFetch");
AuthorizationPolicy.NONE = AuthorizationPolicy.None = AuthorizationPolicy.withID("None");
AuthorizationPolicy.UP_FRONT = AuthorizationPolicy.UpFront = AuthorizationPolicy.withID("UpFront");
