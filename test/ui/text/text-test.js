var Montage = require("montage").Montage;
var TestController = require("support/test-controller").TestController;

exports.TextTest = Montage.create(TestController, {

    dynamictext: {
        value: null
    },

    plainText: {
        value: null
    }

});
