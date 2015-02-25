var Montage = require("montage").Montage,
    Component = require("montage/ui/component").Component,
    logger = require("montage/core/logger").logger("Simple"),
    SimpleTestComposer = require("composer/simple-test-composer").SimpleTestComposer,
    LazyLoadComposer = require("composer/simple-test-composer").LazyLoadTestComposer;
var TestController = require("montage-testing/test-controller").TestController;

exports.Test = TestController.specialize( {

    simpleTestComposer: {
        value: null
    }

});

exports.ProgrammaticTest = TestController.specialize( {

    simpleTestComposer: {
        value: null
    },

    deserializedFromTemplate: {
        value: function () {
            this.simpleTestComposer = new SimpleTestComposer();
            this.dynamicTextC.addComposer(this.simpleTestComposer);
        }
    }

});

exports.ProgrammaticLazyTest = TestController.specialize( {

    simpleTestComposer: {
        value: null
    },

    deserializedFromTemplate: {
        value: function () {
            this.simpleTestComposer = new LazyLoadComposer();
            this.dynamicTextC.addComposer(this.simpleTestComposer);
        }
    }


});
