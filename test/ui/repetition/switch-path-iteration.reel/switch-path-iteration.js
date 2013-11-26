var Montage = require("montage").Montage,
    Component = require("montage/ui/component").Component,
    RangeController = require("montage/core/range-controller").RangeController;

exports.SwitchPathIteration = Montage.create(Component, {
    _isEven: {
        value: true
    },
    isEven: {
        get: function() {
            this._isEven = !this._isEven;
            return this._isEven;
        }
    }
});
