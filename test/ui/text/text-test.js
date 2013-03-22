var Montage = require("montage").Montage;
var TestController = require("montage-testing/test-controller").TestController;

exports.TextTest = Montage.create(TestController, {

    dynamictext: {
        value: null
    },

    plainText: {
        value: null
    }

});
