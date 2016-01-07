var Component = require("montage/ui/component").Component;

exports.Main = Component.specialize(/** @lends Main# */ {

    message: {
        value: null
    },

    handleAction: {
        value: function (event) {
            this.message = event.target.identifier + " button has been clicked";
        }
    },

    handleLongAction: {
        value: function (event) {
            this.message = event.target.identifier + " button has been clicked (long action)";
        }
    }

});
