var Montage = require("montage").Montage,
    Component = require("montage/ui/component").Component;

exports.ComponentNoelement = Montage.create(Component, {
    hasTemplate: {value: false},
    
    deserializedFromSerialization: {
        value: function() {
            var element = document.createElement("div");
            
            this.element = element;
            this.needsDraw = true;
        }
    },
    
    draw: {
        value: function() {
            this.element.textContent = this.value;
        }
    }
});