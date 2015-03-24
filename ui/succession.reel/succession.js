"use strict";

/**
 * @module "montage/ui/succession.reel"
 */
var Slot = require("ui/slot.reel").Slot,
    RangeController = require("core/range-controller").RangeController;

/**
 * @class Succession
 * @augments Slot
 */
exports.Succession = Slot.specialize(/** @lends Succession.prototype */{
    constructor: {
        value: function () {
            /**
             * @property {RangeController} stack
             */
            this.stack = new RangeController();
            this.stack.selectAddedContent = true;

            this.defineBindings({
                /**
                 * The top Transition of the Succession stack.
                 * It is coerce to `null` as `undefined` causes issues with `Slot`.
                 *
                 * @property {Transition} top
                 * @readonly
                 * @namespace Succession
                 */
                "top": {"<-": "this.stack.selection[0] ?? null"},
                "content": {"<-": "this.top.destination"},
                /**
                 * The Transition immediately below the top of Succession stack.
                 *
                 * @property {Transition} previous
                 * @readonly
                 * @namespace Succession
                 */
                "previous": {"<-": "this.stack.content[this.stack.content.length - 2]"},
                /**
                 * The beginning Transition of the Succession stack.
                 *
                 * @property {Transition} first
                 * @readonly
                 * @namespace Succession
                 */
                "first": {"<-": "this.stack.content[0]"}
            });
        }
    },

    /**
     * @property {boolean}
     * @default false
     */
    hasTemplate: {
        enumerable: false,
        value: false
    },

    push: {
        value: function (transition) {
            if (this.top && transition.source !== this.top.destination) {
                console.error(
                    new Error("Transition source isn't what's currently on the top of the " +
                    "Succession stack. Abandoning transition.")
                );

            } else {
                this.performTransition(transition);

                // todo: push makes more sense,
                // but RangeController.push doesn't work if RangeController.content is empty
                this.stack.add(transition);
            }
        }
    },

    pop: {
        value: function () {
            this.stack.pop();
            // todo: may be able to set RangeController.avoidsEmptySelection, but it seems broken
            this.stack.selection = [this.stack.content[this.stack.content.length - 1]];
        }
    },

    clear: {
        value: function () {
            this.stack.clear();
        }
    },

    performTransition: {
        value: function (transition) {
            // execute lifecycle hooks
            if (transition.source && typeof transition.source.prepareForBuildOut === "function") {
                transition.source.prepareForBuildOut(transition);
            }
            if (typeof transition.destination.prepareForBuildIn === "function") {
                transition.destination.prepareForBuildIn(transition);
            }

            if (transition.sourceData) {
                transition.destinationData = transition.sourceData;
            }
        }
    }
});
