var Montage = require("montage").Montage,
    Component = require("montage/ui/component").Component;

var Image3D = exports.Image3D = Montage.create(Component, {

    _data: {value: null},
    
    data: {
        set: function(value) {
            this._data = value;
            this.needsDraw = true;
        }
    },
    
    draw: {
        value: function() {
            this._element.style.background = "url(" + this._data["src"] + ")";
            this.left.textContent = this._data["text"];
            this.right.textContent = this._data["text"];            
            //this.left.style.background = "-webkit-gradient(linear, left top, left bottom, from(rgba(50,50,50,.7)), color-stop(10%, rgba(10,10,10,.5)), to(black)) left top no-repeat, url(" + this._src + ") left top no-repeat";
            //this.left.style.backgroundSize="10000% 10000%";
        }
    }
});