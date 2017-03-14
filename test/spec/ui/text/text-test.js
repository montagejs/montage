var Montage = require("montage").Montage;
var TestController = require("montage-testing/test-controller").TestController;

exports.TextTest = TestController.specialize( {

    dynamictext: {
        value: null
    },

    plainText: {
        value: null
    }

});
