var Montage = require("montage").Montage,
    Component = require("montage/ui/component").Component;

exports.Scroller = Component.specialize( {
    canDraw: {
        value: function () {
            this.needsDraw = true;
            return Component.canDraw.apply(this, arguments);
        }
    }
});
