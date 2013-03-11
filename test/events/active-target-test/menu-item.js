var Montage = require("montage").Montage,
    Button = require("montage/ui/button.reel").Button;

exports.MenuItem = Montage.create(Button, {

    hasTemplate: {
        value: false
    },

    menu: {
        value: null
    },

    willBecomeActiveTarget: {
        value: function (oldTarget) {
            this.menu.storedTarget = oldTarget;
        }
    }

});
