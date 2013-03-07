var Montage = require("montage").Montage,
    Component = require("montage/ui/component").Component;

exports.ActionCounter = Montage.create(Component, {

    hasTemplate: {
        value: false
    },

    prepareForDraw: {
        value: function () {
            this.addEventListener("menuAction", this);
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
