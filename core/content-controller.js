"use strict";

var Montage = require("montage").Montage;

// The content controller is responsible for determining which content from a
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

// The controller can determine which content to display and the order in which
// to render them in a variety of ways.  You can either use a "selector" to
// filter and sort the content or use a "visibleIndexes" array.  The controller
// binds the content of "visibleContent" depending on which strategy you use.
//
// The content of "visibleContent" is then reflected with corresponding
// incremental changes to "iterations".  The "iterations" array will always
// have an "iteration" corresponding to the "object" in "visibleContent" at the
// same position.

var ContentController = exports.ContentController = Montage.create(Montage, {

    didCreate: {
        value: function () {
            // input
            this.content = null;
            this.selector = null;
            this.selection = [];
            this.visibleIndexes = null;
            this.selectAddedContent = false;
            this.deselectInvisibleContent = false;
            this.avoidsEmptySelection = false;
            // TODO this.start = null;
            // TODO this.length = null;
            // internal
            this.visibleContent = [];
            this.visibleContent.addRangeChangeListener(this, "visibleContent");
            this.defineBinding("visibleContent.rangeContent()", {"<-": "content"});
            // We do not need to directly observe changes to the selection
            // array since the controlled iterations bind directly to that
            // path.
            this.addRangeAtPathChangeListener("content", this, "handleContentRangeChange");
            this.addPathChangeListener("selector", this, "handleSelectorChange");
            this.addPathChangeListener("visibleIndexes", this, "handleVisibleIndexesChange");
            // output
            this.iterations = [];
        }
    },

    initWithContent: {
        value: function (content) {
            this.content = content;
            return this;
        }
    },

    handleSelectorChange: {
        value: function (selector) {
            this.cancelBinding("visibleContent.rangeContent()");
            if (selector) {
                try {
                    this.defineBinding("visibleContent.rangeContent()", {"<-": selector, "source": this.content});
                } catch (error) {
                    this.defineBinding("visibleContent.rangeContent()", {"<-": "content"});
                    throw error;
                }
            } else {
                this.defineBinding("visibleContent.rangeContent()", {"<-": "content"});
            }
        }
    },

    handleVisibleIndexesChange: {
        value: function (visibleIndexes) {
            this.cancelBinding("visibleContent.rangeContent()");
            if (visibleIndexes) {
                this.defineBinding("visibleContent.rangeContent()", {"<-": "visibleIndexes.map{$content[]}"}, this);
            } else {
                this.defineBinding("visibleContent.rangeContent()", {"<-": "content"});
            }
        }
    },

    handleContentRangeChange: {
        value: function (plus, minus, index) {
            if (this.selection) {
                if (this.selectAddedContent) {
                    this.selection.addEach(plus);
                }
                this.selection.deleteEach(minus);
                if (this.avoidsEmptySelection && minus.length) {
                    this.selection.add(minus.one());
                }
            }
        }
    },

    handleVisibleContentRangeChange: {
        value: function (plus, minus, index) {
            if (this.deselectInvisibleContent && this.selection) {
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

