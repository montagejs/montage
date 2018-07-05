var Component = require("montage/ui/component").Component;    

exports.Main = Component.specialize({

    constructor: {
        value: function () {
            this.addEventListener("action", this);
            document.addEventListener("contextmenu", this);
        }
    },

    handleToggle1Action: {
        value: function (event) {
            if (event.target.checked) {
                this.toggle2.checked = false;
            }
        }
    },

    handleToggle2Action: {
        value: function (event) {
            if (event.target.checked) {
                this.toggle1.checked = false;
            }
        }
    },

    handleContextmenu: {
        value: function (event) {   
            if (this.toggle1.checked) {
                event.preventDefault();
                this.overlay4.position.left = event.pageX;
                this.overlay4.position.top = event.pageY;
                this.overlay4.show();
            } else if (this.toggle2.checked) {
                event.preventDefault();
                this.overlay5.position.left = event.pageX - this.overlayContainer1.offsetLeft;
                this.overlay5.position.top = event.pageY - this.overlayContainer1.offsetTop;
                this.overlay5.show();
            }
        }
    }

});
