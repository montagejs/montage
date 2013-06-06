var Montage = require("montage").Montage,
    Component = require("montage/ui/component").Component;

exports.ActionCounter = Component.specialize( {

    hasTemplate: {
        value: false
    },

    constructor: {
        value: function () {
            this.needsDraw = true;
        }
    },

    enterDocument: {
        value: function (firstTime) {
            if (firstTime) {
                this.addEventListener("menuAction", this);
            }
        }
    },

    handledMenuActionCount: {
        value: 0
    },

    handleMenuAction: {
        value: function (evt) {
            this.handledMenuActionCount++;
        }
    }

});
