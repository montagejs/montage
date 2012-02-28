var Montage = require("montage").Montage,
    Component = require("montage/ui/component").Component;

exports.ComponentNoelement = Montage.create(Component, {
    hasTemplate: {value: false},
    
    deserializedFromSerialization: {
        value: function() {
            var element = document.createElement("div");
            this.setElementWithParentComponent(element, this.parentOfNoElement);
            this.needsDraw = true;
        }
    },
    
    draw: {
        value: function() {
            this.element.textContent = this.value;
        }
    }
});