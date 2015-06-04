"use strict";

var Component = require("ui/component").Component,
    Montage = require("core/core").Montage,
    Foo = require("ui/succession.info/sample/ui/foo.reel").Foo,
    Bar = require("ui/succession.info/sample/ui/bar.reel").Bar,
    Passage = require("ui/passage").Passage,
    observe = require("frb/observe"),
    generateUUID = require('core/uuid').generate;

exports.Main = Component.specialize({
    fooCount: {value: 0},

    foo: {
        get: function () {
            this.fooCount++;

            var component = new Foo();

            // enable logger to work
            Montage.getInfoForObject(this).objectName = 'Foo';

            component.identifier = 'Foo' + this.fooCount;
            component.title = component.title + this.fooCount;
            //component.buildInCssClass = null;
            //component.buildInTransitionCssClass = null;
            //component.buildOutCssClass = null;
            //component.buildInCssClass = "zoomInDown";
            //component.buildInTransitionCssClass = null;
            //component.buildOutCssClass = "zoomOutDown";
            //component.classList.add("absolute");

            //Object.observe(component, function (changes) {
            //    changes.forEach(function (change) {
            //        if (change.name === '_inDocument') {
            //            console.log("Property " + '_inDocument' + " changed");
            //            console.log(change);
            //            debugger;
            //        }
            //    });
            //})
            return component;
        }
    },

    barCount: {value: 0},

    bar: {
        get: function () {
            this.barCount++;

            var component = new Bar();

            // enable logger to work
            Montage.getInfoForObject(this).objectName = 'Bar';

            component.identifier = 'Bar' + this.barCount;
            component.title = component.title + this.barCount;

            return component;
        }
    },

    handlePushComponentAction: {
        value: function () {
            var component;

            if (this.templateObjects.Succession1.top) {
                component = this.templateObjects.Succession1.top.destination instanceof Foo ?
                    this.bar : this.foo;
            } else {
                component = this.foo;
            }

            this.templateObjects.Succession1.push(component);
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

            var passage = new Passage();
            passage.identifier = generateUUID();
            passage.source = source;
            passage.destination = destination;
            //passage.buildInCssClass = "zoomInDown";
            //passage.buildInTransitionCssClass = null;
            //passage.buildOutCssClass = "zoomOutDown";
            passage.sourceData = {};

            this.templateObjects.Succession1.push(passage);
        }
    },

    handlePopAction: {
        value: function () {
            this.templateObjects.Succession1.pop();
        }
    },

    handleContentComponentAction: {
        value: function () {
            this.templateObjects.Succession1.content = this.foo;
        }
    },

    handleContentNullAction: {
        value: function () {
            this.templateObjects.Succession1.content = null;
        }
    },

    handleMultiOpAction: {
        value: function () {
            var numberOfPushes = 10,
                numberOfPops = 5,
                self = this;

            var pushInterval = window.setInterval(function () {
                self.handlePushAction();
                numberOfPushes--;

                if (numberOfPushes === 0) {
                    window.clearInterval(pushInterval);
                }
            }, 500)

            window.setTimeout(function () {
                var popInterval = window.setInterval(function () {
                    self.handlePopAction();
                    numberOfPops--;

                    if (numberOfPops === 0) {
                        window.clearInterval(popInterval);
                    }
                }, 750)
            }, 900)

        }
    },

    handlePushx5Action: {
        value: function () {
            var numberOfPushes = 5,
                self = this;

            var pushInterval = window.setInterval(function () {
                numberOfPushes--;

                self.handlePushAction();

                if (numberOfPushes === 0) {
                    window.clearInterval(pushInterval);
                }
            }, 500)
        }
    },

    handlePopx5Action: {
        value: function () {
            var numberOfPops = 5,
                self = this;

            var popInterval = window.setInterval(function () {
                numberOfPops--;

                self.handlePopAction();

                if (numberOfPops === 0) {
                    window.clearInterval(popInterval);
                }
            }, 750)

        }
    },

    handleToggleOverflowAction: {
        value: function () {
            this.templateObjects.Succession1.classList.toggle("overflow-hidden");
        }
    },

    handleSetSuccessionBuildInOutAction: {
        value: function () {
            this.templateObjects.Succession1.contentBuildInCssClass = "bounceInDown";
            this.templateObjects.Succession1.contentBuildOutCssClass = "bounceOutDown";
        }
    },

    handleClearSuccessionBuildInOutAction: {
        value: function () {
            this.templateObjects.Succession1.contentBuildInCssClass = undefined;
            this.templateObjects.Succession1.contentBuildInTransitionCssClass = undefined;
            this.templateObjects.Succession1.contentBuildOutCssClass = undefined;
        }
    },

    handleDetachAction: {
        value: function () {
            this.templateObjects.Bar2.detachFromParentComponent();
            this.templateObjects.text.detachFromParentComponent();

            this.templateObjects.Bar3.detachFromParentComponent();

            this.templateObjects.Container.domContent = this.templateObjects.innerText.element;
        }
    },

    handleSubstitutionMultiOpAction: {
        value: function () {
            var self = this;

            self.templateObjects.substitution.switchValue =
                self.templateObjects.substitution.switchValue === 'Foo' ? 'Bar' : 'Foo';

            window.setTimeout(function () {
                self.templateObjects.substitution.switchValue =
                    self.templateObjects.substitution.switchValue === 'Foo' ? 'Bar' : 'Foo';
            }, 500)

            window.setTimeout(function () {
                self.templateObjects.substitution.switchValue =
                    self.templateObjects.substitution.switchValue === 'Foo' ? 'Bar' : 'Foo';
            }, 1000)
        }
    }
});
