var Application = require("montage/core/application").Application;

exports.TestApplication = Application.specialize(/** @lends Main# */ {
    constructor: {
        value: function Application() {
            console.log("Custom TestApplication constructed");
        }
    },


});
