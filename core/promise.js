
// Montage promises are implemented in the bluebird package.  If Montage Require is
// used for bootstrapping, this file will never actually be required, but will
// be injected instead.
exports.Promise = require("bluebird");
