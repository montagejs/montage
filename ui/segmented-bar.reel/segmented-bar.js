"use strict";

/**
 * @module "montage/ui/segmented-bar.reel"
 * @requires montage/ui/base/abstract-button
 * @requires montage/core/range-controller
 * @requires montage/core/tree-controller
 */
var AbstractButton = require("ui/base/abstract-button").AbstractButton,
    RangeController = require("core/range-controller").RangeController,
    TreeController = require("core/tree-controller").TreeController;

/**
 * @class SegmentedBar
 *
 * A bar consisted of {@link Segment} components. Commonly used to visualize data, such as disk space usage.
 * Will accept an array of objects, `RangeController` or `TreeController` as data source.
 * `SegmentedBar` subclasses `AbstractButton` because of `AbstractButton`'s desired `PressComposer` behavior.
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/Guide/CSS/Flexible_boxes}
 * for FlexBox usage
 *
 * @extends AbstractButton
 */
exports.SegmentedBar = AbstractButton.specialize( /** @lends SegmentedBar.prototype */ {
    /**
     * Dispatches by default based on the `enabled` property.
     *
     * @event SegmentedBar#action
     * @property {Dict} detail - selected segment's data
     * @property {String} detail.get("data").label
     * @property {Number} detail.get("data").length
     *
     * @example To access passed data, do `event.detail.get('data')` in event handler
     */

    /**
     * @private
     */
    _data: {value: null},

    /**
     * @property {Object[]}
     * @default null
     */
    data: {
        get: function () {return this._repetitionDataController.content;},
        set: function (data) {
            if (data !== this._data) {
                this._data = data;

                if (data) {
                    this._dataController = null;
                    this._repetitionDataController = new RangeController(data);
                }

                this.needsDraw = true;
            }
        }
    },

    /**
     * @private
     */
    _dataController: {value: null},

    /**
     * If `TreeController` is used, it will be flattened and only leaves without `children` will be rendered.
     *
     * @property {RangeController|TreeController} value
     * @default null
     */
    dataController: {
        get: function () {return this._dataController;},
        set: function (dataController) {
            if (dataController !== this._dataController) {
                this._data = null;
                this._dataController = dataController;

                if (dataController instanceof TreeController) {
                    // Ensure TreeController always flattens
                    dataController.initiallyExpanded = true;

                    // Repetition only accepts RangeController;
                    // cannot do `new RangeController(dataController.iterations)`, need a binding,
                    // as TreeController may still be in isDeserializing state & TreeController.iterations is null here.
                    this._repetitionDataController = new RangeController();

                    // Even if TreeControllerNode has no children, it still has a .children property,
                    // hence need to check if its length is 0
                    this.defineBinding(
                        "_repetitionDataController.content", {
                            "<-": "iterations.filter{this.children.length == 0}",
                            source: dataController
                        }
                    );

                } else { // RangeController
                    this._repetitionDataController = dataController;
                }

                this.needsDraw = true;
            }
        }
    },

    /**
     * Used to bind to Repetition as Repetition only accepts RangeController.
     *
     * @private
     * @property {RangeController} value - range of `Object`s or `TreeControllerNode`s,
     * depending on the type of `dataController`.
     */
    _repetitionDataController: {value: null},

    /**
     * @private
     */
    _orientation: {value: null},

    /**
     * Orientation of the bar will always be horizontal by default,
     * can be overridden by setting this property,
     * isn't auto-responsive due to inability to react to parent container dimension changes.
     *
     * @property {String} orientation
     */
    orientation: {
        get: function () {
            return this._orientation;
        },
        set: function (orientation) {
            if (this._orientation !== orientation) {
                this._orientation = orientation;
                this.needsDraw = true;
            }
        }
    },

    /**
     * @private
     * @function
     * @param {Event} event
     */
    _setComponentDataFromEvent: {
        value: function (event) {
            // User may click on Segment or its label
            var component = event.targetElement.className === "montage-Segment" ?
                event.targetElement.component : event.targetElement.parentElement.component;

            // Inherited AbstractControl.detail is a Collections.js Dict
            if (this.detail.get("label") !== component.label || this.detail.get("length") !== component.length) {
                this.detail.set("data", {
                    label: component.label,
                    length: component.length,
                });
            }
        }
    },

    /**
     * Below event handlers augment superclass' by setting this.detail with selected segment's data.
     */

    handlePress: {
        value: function (event) {
            this._setComponentDataFromEvent(event);
            AbstractButton.handlePress.call(this);
        }
    },

    handleKeyup: {
        value: function (event) {
            this._setComponentDataFromEvent(event);
            AbstractButton.handleKeyup.call(this);
        }
    },

    handleLongPress: {
        value: function (event) {
            this._setComponentDataFromEvent(event);
            AbstractButton.handleLongPress.call(this);
        }
    },

    /**
     * Redraw based on data or orientation change.
     *
     * @function
     */
    draw: {
        value: function () {
            // Autoprefixer > 1%, last 2 versions, Firefox ESR, Opera 12.1

            if (this.orientation === "vertical" &&
                this.templateObjects.repetition.element.style.flexDirection !== "column") {

                this.templateObjects.repetition.element.style.webkitBoxOrient = "vertical";
                this.templateObjects.repetition.element.style.webkitFlexDirection = "column";
                this.templateObjects.repetition.element.style.msFlexDirection = "column";
                this.templateObjects.repetition.element.style.flexDirection = "column";

            } else if (this.orientation === "horizontal" &&
                this.templateObjects.repetition.element.style.flexDirection !== "row" &&
                this.templateObjects.repetition.element.style.flexDirection) {
                // SegmentedBar instantiates with no flex-direction value as default is "row",
                // no need to set it at that point.

                this.templateObjects.repetition.element.style.webkitBoxOrient = "horizontal";
                this.templateObjects.repetition.element.style.webkitFlexDirection = "row";
                this.templateObjects.repetition.element.style.msFlexDirection = "row";
                this.templateObjects.repetition.element.style.flexDirection = "row";
            }
        }
    },

    /**
     * Cancel bindings for performance, while ensuring to not cancel bindings
     * SegmentedBar didn't define by not doing `repetition.cancelBindings()`;
     * doing so will break Repetition after SegmentedBar enterDocument again.
     *
     * @function
     */
    exitDocument: {
        value: function () {
            this.cancelBindings();

            if (this.templateObjects.repetition.getBinding("contentController")) {
                this.templateObjects.repetition.cancelBinding("contentController");
            }
        }
    }
});
