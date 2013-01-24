"use strict";

var Montage = require("montage").Montage;

// The content controller is responsible for determining which objects from a
// source collection are visible, their order of appearance, and whether they
// are selected.  Multiple repetitions may share a single content controller
// and thus their selection state.

// The controller manages a series of visible iterations.  Each iteration has a
// corresponding "object" and whether that iteration is "selected".  The
// controller uses a bidirectional binding to ensure that the controller's
// "selections" collection and the "selected" property of each iteration are in
// sync.

var ContentControllerIteration = exports.ContentControllerIteration = Montage.create(Montage, {

    didCreate: {
        value: function () {
            this.object = null;
            this.controller = null;
            this.defineBinding("selected", {"<->": "controller.selection.has(object)"});
        }
    },

    initWithObjectAndController: {
        value: function (object, controller) {
            this.object = object;
            this.controller = controller;
            return this;
        }
    }

});

// The controller can determine which objects to display and the order in which
// to render them in a variety of ways.  You can either use a "selector" to
// filter and sort the objects or use a "visibleIndexes" array.  The controller
// binds the content of "visibleObjects" depending on which strategy you use.
//
// The content of "visibleObjects" is then reflected with corresponding
// incremental changes to "iterations".  The "iterations" array will always
// have an "iteration" corresponding to the "object" in "visibleObjects" at the
// same position.

var ContentController = exports.ContentController = Montage.create(Montage, {

    didCreate: {
        value: function () {
            // input
            this.objects = null;
            this.selector = null;
            this.selection = [];
            this.visibleIndexes = null;
            this.selectAddedObjects = false;
            this.deselectInvisibleObjects = false;
            this.deselectDeletedObjects = true;
            // TODO this.start = null;
            // TODO this.length = null;
            // internal
            this.visibleObjects = [];
            this.visibleObjects.addRangeChangeListener(this, "visibleObjects");
            this.defineBinding("visibleObjects.*", {"<-": "objects"});
            // We do not need to directly observe changes to the selection
            // array since the controlled iterations bind directly to that
            // path.
            this.addPathChangeListener("objects", this, "handleObjectsChange");
            this.addPathChangeListener("selector", this, "handleSelectorChange");
            this.addPathChangeListener("visibleIndexes", this, "handleVisibleIndexesChange");
            // output
            this.iterations = [];
        }
    },

    initWithObjects: {
        value: function (objects) {
            this.objects = objects;
            return this;
        }
    },

    handleSelectorChange: {
        value: function (selector) {
            this.cancelBinding("visibleObjects.*");
            if (selector) {
                try {
                    this.defineBinding("visibleObjects.*", {"<-": selector, "source": this.objects});
                } catch (error) {
                    this.defineBinding("visibleObjects.*", {"<-": "objects"});
                    throw error;
                }
            } else {
                this.defineBinding("visibleObjects.*", {"<-": "objects"});
            }
        }
    },

    handleVisibleIndexesChange: {
        value: function (visibleIndexes) {
            this.cancelBinding("visibleObjects.*");
            if (visibleIndexes) {
                this.defineBinding("visibleObjects.*", {"<-": "visibleIndexes.map{$objects[]}"}, this);
            } else {
                this.defineBinding("visibleObjects.*", {"<-": "objects"});
            }
        }
    },

    handleObjectsChange: {
        value: function (objects) {
            if (objects) {
                return objects.addRangeChangeListener(this, "objects");
            }
        }
    },

    handleObjectsRangeChange: {
        value: function (plus, minus, index) {
            if (this.selection) {
                if (this.selectAddedObjects) {
                    this.selection.addEach(plus);
                }
                if (this.deselectDeletedObjects) {
                    this.selection.deleteEach(minus);
                }
            }
        }
    },

    handleVisibleObjectsRangeChange: {
        value: function (plus, minus, index) {
            if (this.deselectInvisibleObjects && this.selection) {
                this.selection.deleteEach(minus);
            }
            this.iterations.swap(index, minus.length, plus.map(function (object) {
                return this.Iteration.create().initWithObjectAndController(object, this);
            }, this));
        }
    },

    Iteration: {
        value: ContentControllerIteration
    }

});

