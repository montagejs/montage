var Component = require("montage/ui/component").Component;

exports.Main = Component.specialize({

    htmlFragmentWillUseAttributeValueForAttributeNameFromNode: {
        value: function (htmlFragment, value, name, node) {
            if (htmlFragment === this._fragment8) {
                debugger
            }
            
            if (htmlFragment === this._fragment8 && name === 'data-name') {
                return 'Bob';
            }
        }
    },

});
