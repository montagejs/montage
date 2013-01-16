"use strict";

var Montage = require("montage").Montage;

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
            global.controller = this; // TODO redact
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
                this.defineBinding("visibleObjects.*", {"<-": "visibleIndexes.map{$visibleObjects[]}"}, this);
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

