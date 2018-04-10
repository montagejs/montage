var Component = require("montage/ui/component").Component;

exports.Main = Component.specialize({

    htmlFragmentWillUseValueForNodeAttribute: {
        value: function (htmlFragment, value, node, attributeName) {            
            if (htmlFragment === this._fragment8 && attributeName === 'data-name') {
                return 'Bob';
            }
        }
    },

});
