var Montage = require("montage").Montage,
    Component = require("montage/ui/component").Component,
    SwipeComposer = require("montage/composer/swipe-composer").SwipeComposer;

exports.Swipe = Montage.create(Montage, {

    deserializedFromTemplate: {
        value: function() {
            var dummyComponent = Montage.create(Component);
            dummyComponent.hasTemplate = false;
            dummyComponent.element = document.body;
            dummyComponent.needsDraw = true;
            this.swipeComposer = SwipeComposer.create();
            dummyComponent.addComposer(this.swipeComposer);
            this.swipeComposer.addEventListener("swipe", this, false);
            this.swipeComposer.addEventListener("swipemove", this, false);
        }
    },

    handleSwipe: {
        value: function(event) {
        }
    },

    handleSwipemove: {
        value: function(event) {
        }
    }

});
