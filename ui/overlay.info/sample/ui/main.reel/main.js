var Component = require("montage/ui/component").Component;    

exports.Main = Component.specialize({

    constructor: {
        value: function () {
            this.addEventListener("action", this);
        }
    },

    handleButton1Action: {
        value: function () {
            this.overlay1.show();
        }
    }

});
