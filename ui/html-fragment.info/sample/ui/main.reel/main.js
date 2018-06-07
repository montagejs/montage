var Component = require("montage/ui/component").Component;

exports.Main = Component.specialize({

    constructor: {
        value: function () {
            this.content1 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
            this.content2 = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
        }
    },

    htmlFragmentWillUseValueForNodeAttribute: {
        value: function (htmlFragment, value, node, attributeName) {            
            if (htmlFragment === this._fragment8 && attributeName === 'data-name') {
                return 'Bob [Delgate method]';
            }
        }
    },

});
