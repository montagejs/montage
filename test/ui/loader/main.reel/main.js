
var Montage = require("montage").Montage,
    Component = require("montage/ui/component").Component;

exports.Main = Montage.create(Component, /** @lends Main# */ {
    text: {
        value: "Main Draw"
    },

    draw: {
        value: function() {
            this.element.textContent = this.text;
        }
    }
});
