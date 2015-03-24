"use strict";

var Component = require("ui/component").Component,
    Foo = require("ui/succession.info/sample/foo.reel").Foo,
    Bar = require("ui/succession.info/sample/bar.reel").Bar,
    Transition = require("ui/transition.reel").Transition;

exports.Main = Component.specialize({
    foo: {
        get: function () {
            var component = new Foo();
            //component.classList.add("animated");
            //component.buildInCSSClassStart = "zoomInDown";
            //component.buildOutCSSClass = "zoomOutDown";
            component.buildInCSSClassStart = "transform-start";
            component.buildInCSSClassEnd = "transform-end";
            component.buildOutCSSClass = "transform-build-out";
            return component;
        }
    },
    bar: {
        get: function () {
            var component = new Bar();
            component.classList.add("animated");
            component.buildInCSSClassStart = "zoomInDown";
            component.buildOutCSSClass = "zoomOutDown";
            //component.buildInCSSClassStart = "transform-start";
            //component.buildInCSSClassEnd = "transform-end";
            //component.buildOutCSSClass = "transform-build-out";
            return component;
        }
    },

    handlePushAction: {
        value: function () {
            var source, destination;

            if (this.templateObjects.Succession1.top) {
                source = this.templateObjects.Succession1.top.destination;
                destination = this.templateObjects.Succession1.top.destination instanceof Foo ?
                    this.bar : this.foo;
            } else {
                source = null;
                destination = this.foo;
            }

            var transition = new Transition();
            transition.identifier = Math.random() * 1000000 | 0;
            transition.source = source;
            transition.destination = destination;
            transition.buildInCSSClassStart = "transform-start";
            transition.buildInCSSClassEnd = "transform-end";
            transition.buildOutCSSClass = "transform-build-out";
            transition.sourceData = {};

            this.templateObjects.Succession1.push(transition);
        }
    },

    handlePopAction: {
        value: function () {
            this.templateObjects.Succession1.pop();
        }
    },

    handleClearAction: {
        value: function () {
            this.templateObjects.Succession1.clear();
        }
    },

    handleToggleOverflowAction: {
        value: function () {
            this.templateObjects.Succession1.classList.toggle("overflow-hidden");
        }
    },

    handleDetachAction: {
        value: function () {
            this.templateObjects.Bar2.detachFromParentComponent();
            this.templateObjects.text.detachFromParentComponent();
        }
    }
});
