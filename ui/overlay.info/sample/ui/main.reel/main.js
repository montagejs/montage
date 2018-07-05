var Component = require("montage/ui/component").Component;    

exports.Main = Component.specialize({

    constructor: {
        value: function () {
            this.addEventListener("action", this);
        }
    },

    handleToggle1Action: {
        value: function (event) {
            if (event.target.checked) {
                document.addEventListener("contextmenu", this);
            } else {
                document.removeEventListener("contextmenu", this);
                this.overlay4.hide();
            }
        }
    },

    handleContextmenu: {
        value: function (event) {   
            event.preventDefault();
            this.overlay4.position.left = event.pageX;
            this.overlay4.position.top = event.pageY;
            this.overlay4.show();
        }
    }

});
