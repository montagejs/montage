var Montage = require("montage").Montage,
    Component = require("montage/ui/component").Component;

var HomeWidget = exports.HomeWidget = Montage.create(Component, {

    _src: {value: null},
    
    src: {
        set: function(value) {
            this._src = value;
            this.needsDraw = true;
        }
    },
    
    draw: {
        value: function() {
            this._element.src = this._src;
        }
    }
});