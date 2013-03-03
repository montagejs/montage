var Montage = require("montage").Montage,
    TestController = require("support/test-controller").TestController;

var Test = exports.Test = Montage.create(TestController, {

    dynamicElement: {
        value: null
    },

    dynamicElementClassList: {
        value: null
    },

    dynamicElementClassInMarkup: {
        value: null
    },

    class1: {
        value: true
    },

    class2: {
        value: false
    },

    self: {
        get: function() {
            return this;
        }
    }
});
