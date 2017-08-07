var Montage = require("montage").Montage,
    Component = require("montage/ui/component").Component;

exports.MenuItem = Component.specialize( {

    hasTemplate: {
        value: false
    },

    acceptsActiveTarget: {
        value: true
    },

    menu: {
        value: null
    },

    prepareForActivationEvents: {
        value: function () {
            this.element.addEventListener("mouseup", this);
        }
    },

    handleMouseup: {
        value: function () {
            this.dispatchEventNamed("action", true, true);
        }
    },

    willBecomeActiveTarget: {
        value: function (oldTarget) {
            this.menu.storedTarget = oldTarget;
        }
    }

});
