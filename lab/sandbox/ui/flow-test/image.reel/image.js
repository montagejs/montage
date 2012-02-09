var Montage = require("montage").Montage,
    Component = require("montage/ui/component").Component;

var Image = exports.Image = Montage.create(Component, {

    _src: {value: null},

    src: {
        set: function(value) {
            this._src = value;
            this.needsDraw = true;
        }
    },

    draw: {
        value: function() {
            this._element.style.background = "url(" + this._src + ")";
        }
    }
});
