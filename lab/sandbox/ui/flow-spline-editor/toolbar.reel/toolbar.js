var Montage = require("montage").Montage,
    Component = require("montage/ui/component").Component;

// TODO: Redo the toolbar with proper Montage UI controls and draw cycle

exports.Toolbar = Montage.create(Component, {

    selectedTool: {
        value: "add"
    },

    handleClick: {
        enumerable: false,
        value: function (event) {
            if (event.target !== this._element) {
                var elements = this.element.getElementsByTagName("*"),
                    i;

                for (i = 0; i < elements.length; i++) {
                    elements[i].classList.remove("selected");
                }
                event.target.classList.add("selected");
                this.selectedTool = event.target.getAttribute("data-tool")
            }
            event.preventDefault();
        }
    },

    prepareForActivationEvents: {
        enumerable: false,
        value: function () {
            this._element.addEventListener("click", this, false);
        }
    }
});