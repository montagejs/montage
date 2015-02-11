/**
 * @module ui/collapsible-panel.reel
 * @requires montage/ui/component
 */
var Component = require("../component").Component,
    PressComposer = require("../../composer/press-composer").PressComposer;

/**
 * @class CollapsiblePanel
 * @extends Component
 *
 * A collapsible panel that can be expanded or collapsed with header and body
 */
exports.CollapsiblePanel = Component.specialize(/** @lends CollapsiblePanel# */ {
    constructor: {
        value: function CollapsiblePanel() {
            this.super();
            this._pressComposer = new PressComposer();
        }
    },

    _pressComposer: {
        value: null
    },

    /**
     * Set this to true when clicking on header to collapse or expand a panel, only trgiiger animation at this stage.
     * No animation when first time drawing
     * @private
     */
    _isCollapsing: {
        value: false
    },

    _isExpanded: {
        value: null
    },
    /**
     * Is the collapsible panel expanded or collapsed
     * @type {boolean}
     */
    isExpanded: {
        set: function (value) {
            if (this._isExpanded == value) {
                return;
            }
            this._isExpanded = value;
            this.needsDraw = true;
        },
        get: function () {
            return this._isExpanded;
        }
    },

    prepareForActivationEvents: {
        value: function () {
            var transitionEndListener = {};
            var bodyWrapper = this.element.children[1];
            //Remove animation when it's done
            transitionEndListener.handleEvent = function () {
                bodyWrapper.classList.remove("collapsing");
                this._isCollapsing = false;
            };
            this._pressComposer.addEventListener("press", this, false);
            //Listen css transition call back
            bodyWrapper.addEventListener('webkitTransitionEnd', transitionEndListener);
            bodyWrapper.addEventListener('transitionend', transitionEndListener);

        }
    },

    enterDocument: {
        value: function (firstTime) {
            if (firstTime) {
                var header = this.element.children[0];
                //Register composer here and add event in prepareForActivationEvents
                this.addComposerForElement(this._pressComposer, header);
            }
        }
    },

    /**
     * Do expand or collapse when click on the header
     * @method
     * @private
     */
    handlePress: {
        value: function (event) {
            //Only trigger css animation when clicking on header, this may need change base on how SelectionController handle
            //multipleSelection and singleSelection
            this._isCollapsing = true;
            this.isExpanded = !this.isExpanded;
        }
    },

    /**
     * Add height css animation when expanding or collapsing panel
     * @method
     * @private
     */
    _addCollapsingAnimation: {
        value: function (bodyWrapper) {
            if (this._isCollapsing) {
                bodyWrapper.classList.add("collapsing");
            }
        }
    },

    draw: {
        value: function () {
            var bodyWrapper = this.element.children[1];
            this._addCollapsingAnimation(bodyWrapper);
            if (this.isExpanded) {
                bodyWrapper.classList.add('active');
            } else {
                bodyWrapper.classList.remove('active');
            }
        }
    }

});
