var Montage = require("montage").Montage,
    Component = require("montage/ui/component").Component,
    SwipeComposer = require("montage/composer/swipe-composer").SwipeComposer;

exports.Swipe = Montage.specialize( {

    deserializedFromTemplate: {
        value: function () {
            var dummyComponent = this.dummyComponent = new Component();
            dummyComponent.hasTemplate = false;
            dummyComponent.element = document.body;
            dummyComponent.element.style.height = "400px";
            dummyComponent.element.style.width = "400px";
            dummyComponent.attachToParentComponent();
            dummyComponent.needsDraw = true;
            this.swipeComposer = new SwipeComposer();
            this.swipeComposer.lazyLoad = false;
            dummyComponent.addComposer(this.swipeComposer);
            this.swipeComposer.addEventListener("swipe", this, false);
        }
    },

    handleSwipe: {
        value: function (event) {
            console.log(event.direction)
        }
    }

});
