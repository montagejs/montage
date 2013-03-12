var Montage = require("montage").Montage,
    Component = require("montage/ui/component").Component,
    logger = require("montage/core/logger").logger("Simple"),
    SimpleTestComposer = require("composer/simple-test-composer").SimpleTestComposer,
    LazyLoadComposer = require("composer/simple-test-composer").LazyLoadTestComposer;
var TestController = require("montage-testing/test-controller").TestController;

exports.Test = Montage.create(TestController, {

    simpleTestComposer: {
        value: null
    }

});

exports.ProgrammaticTest = Montage.create(TestController, {

    simpleTestComposer: {
        value: null
    },

    deserializedFromTemplate: {
        value: function() {
            this.simpleTestComposer = SimpleTestComposer.create();
            this.dynamicTextC.addComposer(this.simpleTestComposer);
        }
    }

});

exports.ProgrammaticLazyTest = Montage.create(TestController, {

    simpleTestComposer: {
        value: null
    },

    deserializedFromTemplate: {
        value: function() {
            this.simpleTestComposer = LazyLoadComposer.create();
            this.dynamicTextC.addComposer(this.simpleTestComposer);
        }
    }


});
