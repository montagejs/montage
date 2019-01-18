var Authorization = require("montage/data/service/authorization").Authorization;

exports.Authorization = Authorization.specialize(/** @lends Authorization.prototype */ {

    didLogOut: {
        value: false
    },

    logOut: {
        value: function () {
            this.didLogOut = true;
        }
    }
    
});