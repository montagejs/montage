"use strict";

var Component = require("montage/ui/component").Component,
    Montage = require("montage/core/core").Montage,
    Foo = require("ui/foo.reel").Foo,
    Bar = require("ui/bar.reel").Bar,
    observe = require("montage/frb/observe");

exports.Main = Component.specialize({
    /**
     * Starts with 1 because 1 Foo is declared in serialization as default content for succession1
     */
    fooCount: {
        value: 1
    },

    succession1: {
        value: undefined
    },

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

    barCount: {
        value: 0
    },

    bar: {
        get: function () {
            this.barCount++;

            var component = new Bar();

            // enable logger to work
            Montage.getInfoForObject(this).objectName = 'Bar';

            //component.identifier = 'Bar' + this.barCount;
            component.title = component.title + this.barCount;

            //component.buildInCssClass = null;
            //component.buildInTransitionCssClass = null;
            //component.buildOutCssClass = null;

            return component;
        }
    },

    handlePushAction: {
        value: function () {
            var component;
            if (this.succession1.content) {
                component = this.succession1.content instanceof Foo ?
                    this.bar : this.foo;
            } else {
                component = this.foo;
            }
            this.succession1.history.push(component);
        }
    },

    //handlePushAction: {
    //    value: function () {
    //        var source, destination;
    //
    //        if (this.succession1.content) {
    //            source = this.succession1.content.destination;
    //            destination = this.succession1.content.destination instanceof Foo ?
    //                this.bar : this.foo;
    //        } else {
    //            source = null;
    //            destination = this.foo;
    //        }
    //
    //        var passage = new Passage();
    //        passage.identifier = generateUUID();
    //        passage.source = source;
    //        passage.destination = destination;
    //        //passage.buildInCssClass = "zoomInDown";
    //        //passage.buildInTransitionCssClass = null;
    //        //passage.buildOutCssClass = "zoomOutDown";
    //        passage.sourceData = {};
    //
    //        this.succession1.history.push(passage);
    //    }
    //},

    handlePopAction: {
        value: function () {
            this.succession1.history.pop();
        }
    },

    handleContentComponentAction: {
        value: function () {
            this.succession1.content = this.foo;
        }
    },

    handleContentNullAction: {
        value: function () {
            this.succession1.content = null;
        }
    },

    handleMultiOpAction: {
        value: function () {
            var numberOfPushes = 10,
                numberOfPops = 5,
                self = this;

            var pushInterval = setInterval(function () {
                self.handlePushAction();
                numberOfPushes--;

                if (numberOfPushes === 0) {
                    clearInterval(pushInterval);
                }
            }, 500)

            setTimeout(function () {
                var popInterval = setInterval(function () {
                    self.handlePopAction();
                    numberOfPops--;

                    if (numberOfPops === 0) {
                        clearInterval(popInterval);
                    }
                }, 750)
            }, 900)

        }
    },

    handlePushx5Action: {
        value: function () {
            var numberOfPushes = 10,
                self = this;

            var pushInterval = setInterval(function () {
                numberOfPushes--;

                self.handlePushAction();

                if (numberOfPushes === 0) {
                    clearInterval(pushInterval);
                }
            }, 50)
        }
    },

    handlePopx5Action: {
        value: function () {
            var numberOfPops = 5,
                self = this;

            var popInterval = setInterval(function () {
                numberOfPops--;

                self.handlePopAction();

                if (numberOfPops === 0) {
                    clearInterval(popInterval);
                }
            }, 750)

        }
    },

    handleToggleOverflowAction: {
        value: function () {
            this.succession1.classList.toggle("overflow-hidden");
        }
    },

    handleSetSuccessionBuildInOutAction: {
        value: function () {
            var suffix = this.succession1.contentBuildInAnimation && this.succession1.contentBuildInAnimation.cssClass === "buildIn" ? "2" : "";

            this.succession1.contentBuildInAnimation = {
                fromCssClass: "buildInFrom" + suffix,
                cssClass: "buildIn" + suffix
            };
            this.succession1.contentBuildOutAnimation = {
                cssClass: "buildOut" + suffix,
                toCssClass: "buildOutTo" + suffix,
            };
        }
    },

    handleClearSuccessionBuildInOutAction: {
        value: function () {
            this.succession1.contentBuildInAnimation = {};
            this.succession1.contentBuildOutAnimation = {};
        }
    },

    handleDisableSuccessionBuildInOutAction: {
        value: function () {
            this.succession1.contentBuildInAnimation = null;
            this.succession1.contentBuildOutAnimation = null;
        }
    },

    handleDetachAction: {
        value: function () {
            this.templateObjects.Bar2._shouldBuildOut = true;
            this.templateObjects.text._shouldBuildOut = true;
            this.templateObjects.Bar3._shouldBuildOut = true;
            this.templateObjects.Container.domContent = this.templateObjects.innerText.element;
        }
    },

    handleSubstitutionMultiOpAction: {
        value: function () {
            var self = this;

            self.templateObjects.substitution.switchValue =
                self.templateObjects.substitution.switchValue === 'Foo' ? 'Bar' : 'Foo';

            /*setTimeout(function () {
                self.templateObjects.substitution.switchValue =
                    self.templateObjects.substitution.switchValue === 'Foo' ? 'Bar' : 'Foo';
            }, 500)

            setTimeout(function () {
                self.templateObjects.substitution.switchValue =
                    self.templateObjects.substitution.switchValue === 'Foo' ? 'Bar' : 'Foo';
            }, 1000)*/
        }
    },

    handleConditionToggleAction: {
        value: function () {
            this.templateObjects.condition.condition = !this.templateObjects.condition.condition;
        }
    },

    handleBuildInEnd: {
        value: function (event) {
            this.lastBuildInComponentIdentifier = event.target.identifier;
        }
    },

    handleBuildOutEnd: {
        value: function (event) {
            this.lastBuildOutComponentIdentifier = event.target.identifier;
        }
    }
});
