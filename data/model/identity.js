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

}, {
    AnonymousIdentity: {
        value: undefined
    }
});


Identity.AnonymousIdentity = new Identity();
Identity.AnonymousIdentity.identifier = "Anonymous";
