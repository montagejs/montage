var Montage = require("montage").Montage,
    Component = require("montage/ui/component").Component,
    SwipeComposer = require("montage/composer/swipe-composer").SwipeComposer;

exports.Swipe = Montage.specialize( {

    deserializedFromTemplate: {
        value: function () {
            var dummyComponent = new Component();
            dummyComponent.hasTemplate = false;
            dummyComponent.element = document.body;
            dummyComponent.attachToParentComponent();
            dummyComponent.needsDraw = true;
            this.swipeComposer = new SwipeComposer();
            this.swipeComposer.lazyLoad = false;
            dummyComponent.addComposer(this.swipeComposer);
            this.swipeComposer.addEventListener("swipe", this, false);
            this.swipeComposer.addEventListener("swipemove", this, false);
        }
    },

    handleSwipe: {
        value: function (event) {
        }
    },

    handleSwipemove: {
        value: function (event) {
        }
    }

});
