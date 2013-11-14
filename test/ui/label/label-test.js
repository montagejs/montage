var Montage = require("montage").Montage;
var TestController = require("montage-testing/test-controller").TestController;

exports.LabelTest = TestController.specialize( {

    label: {
        value: null
    },

    text: {
        value: null
    }

});
