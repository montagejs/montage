var Montage = require("core/core").Montage,
    Identity;

/**
 * An Identity represents an object that defined who is using the app.
 * It's typically a person, but sometime it is anonymous and could be the
 * description of some data. Abstract, expected to be subclassed.

 * @class
 * @extends external:Montage
 */
Identity = exports.Identity = Montage.specialize(/** @lends Identity.prototype */ {

    /**
     * The applicationIdentifier (appClientId in AWS Cognito) is a public identifier for apps. Even though it’s public,
     * it’s best that it isn’t guessable by third parties, so many implementations
     * use something like a 32-character hex string. It must also be unique across
     * all clients that the authorization server handles. If the client ID is guessable,
     * it makes it slightly easier to craft phishing attacks against arbitrary applications.
     * Here are some examples of client IDs from services that support OAuth 2.0:
     *      Foursquare: ZYDPLLBWSK3MVQJSIYHB1OR2JXCY0X2C5UJ2QAR2MAAIT5Q
     *      Github: 6779ef20e75817b79602
     *      Google: 292085223830.apps.googleusercontent.com
     *      Instagram: f2a1ed52710d4533bde25be6da03b6e3
     *      SoundCloud: 269d98e4922fb3895e9ae2108cbb5064
     *      Windows Live: 00000000400ECB04
     *
     * If the developer is creating a “public” app (a mobile or single-page app),
     * then you should not issue a client_secret to the app at all. This is the only way
     * to ensure the developer won’t accidentally include it in their application.
     * If it doesn’t exist, it can’t be leaked!
     *
     * See https://www.oauth.com/oauth2-servers/client-registration/client-id-secret/
     *
     * @type {String}
     */
    applicationIdentifier: {
        value: undefined
    },

    /**
     * The provider of the identity, such as Google, Apple, Facebook, AWS Cognito, OpenId / OAuth providers, etc...
     * This would allow backend logic to know where to validate the credentials.
     *
     * @type {Objec}
     */
    provider: {
        value: undefined
    },

    /**
     * The applicationCredentials is typically a secret known only to the application
     * and the authorization server. It must be sufficiently random to not be guessable,
     * which means you should avoid using common UUID libraries which often take into account
     * the timestamp or MAC address of the server generating it. A great way to generate a secure secret
     * is to use a cryptographically-secure library to generate a 256-bit value and converting it
     * to a hexadecimal representation.
     *
     * It is critical that developers never include their applicationCredentials in public (mobile or browser-based) apps.
     * To help developers avoid accidentally doing this, it’s best to make the client secret visually different from the ID.
     * This way when developers copy and paste the ID and secret, it is easy to recognize which is which.
     * Usually using a longer string for the secret is a good way to indicate this, or prefixing the secret with “secret” or “private”.
     *
     * See https://www.oauth.com/oauth2-servers/client-registration/client-id-secret/
     *
     * @type {String}
     */
    applicationCredentials: {
        value: undefined
    },

    /**
     * An array of queries that defines the scope asked by an identity at authorization time.
     * It can be refined and/or set by access control logic during authorization.
     * In the case of a stateful connection using WebSocket through an APIGateway,
     * it can and used while the connection is open, while using HTTP typically requires to sign a token
     * issued to the client that would include it at every request that need authentication/authorization
     *
     * @type {Array<Query>}
     */
    scope: {
        value: undefined
    },

    deserializeSelf: {
        value: function (deserializer) {
            this.super(deserializer);

            var result, value;
            value = deserializer.getProperty("applicationIdentifier");
            if (value !== void 0) {
                this.applicationIdentifier = value;
            }

            value = deserializer.getProperty("applicationCredentials");
            if (value !== void 0) {
                this.applicationCredentials = value;
            }

            value = deserializer.getProperty("scope");
            if (value !== void 0) {
                this.scope = value;
            }

        }

    },
    serializeSelf: {
        value: function (serializer) {
            this.super(serializer);

            if(this.applicationIdentifier) {
                serializer.setProperty("applicationIdentifier", this.applicationIdentifier);
            }

            if(this.applicationCredentials) {
                serializer.setProperty("applicationCredentials", this.applicationCredentials);
            }

            if(this.scope) {
                serializer.setProperty("scope", this.scope);
            }
        }
    },



}, {
    AnonymousIdentity: {
        value: undefined
    }
});


Identity.AnonymousIdentity = new Identity();
Identity.AnonymousIdentity.identifier = "Anonymous";
