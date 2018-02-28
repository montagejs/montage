var Component = require("../component").Component;

/**
 * @class Icon
 * @extends Component
 */
var Icon = exports.Icon = Component.specialize({

    _src: {
        value: null
    },

    src: {
        get: function () {
            return this._src;
        },
        set: function (src) {
            if (this._src != src) {
                this._src = src;
                this._name = null;
                this.needsDraw = true;
            }
        }
    },

    _name: {
        value: null
    },

    name: {
        get: function () {
            return this._name;
        },
        set: function (name) {
            if (this._name != name) {
                this._name = name;
                this._src = null;
                this.needsDraw = true;
            }
        }
    },

    draw: { 
        value: function () {
            this.element.style.backgroundImage = this.src ? "url(" + this.src + ")" : "";
            this.element.setAttribute('data-icon', this.name || '');
        }
    }

});
