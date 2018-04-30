var Component = require("../../../../../ui/component").Component;

exports.Store = Component.specialize({
    
    constructor: {
        value: function () {
            this.iconSrc = 'http://' + window.location.host +
                '/test/mocks/data/icons/svgs/stores.svg';
        }
    }

});
