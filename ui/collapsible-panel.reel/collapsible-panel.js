/**
 * @module ui/collapsible-panel.reel
 * @requires montage/ui/component
 */
var Component = require("../component").Component,
    PressComposer = require("../../composer/press-composer").PressComposer;

/**
 * A collapsible panel that can be expanded or collapsed with header and body.
 *
 * @class CollapsiblePanel
 * @extends Component
 */
exports.CollapsiblePanel = Component.specialize(/** @lends CollapsiblePanel# */ {

    _pressComposer: {
        value: null
    },

    /**
     * There is no animation when collapsible panel displaying. The animation will only be triggered when peoiple click
     * header to collapse or expand a panel by setting this property to true.
     * @private
     */
    _isTransition: {
        value: false
    },

    _isExpanded: {
        value: null
    },

    /**
     * Is the collapsible panel expanded or collapsed.
     * @type {boolean}
     */
    isExpanded: {
        set: function (value) {
            if (value != this._isExpanded) {
                this._isExpanded = value;
                this.needsDraw = true;
            }
            //Can't use this simple statement because isExpanded now is set twice when clicking on header
            //I think one is from pressHandler another one is from selection.has() binding.
            //this.needsDraw = (this._isExpanded != value);
        },
        get: function () {
            return this._isExpanded;
        }
    },

    prepareForActivationEvents: {
        value: function () {
            var transitionEndListener = {};
            var bodyWrapper = this.element.children[1];
            this._pressComposer.addEventListener("press", this, false);
            //Listen css transition call back.
            bodyWrapper.addEventListener('webkitTransitionEnd', this.handleTransitionEnd);
            bodyWrapper.addEventListener('transitionend', this.handleTransitionEnd);
        }
    },

    handleTransitionEnd: {
        value: function () {
            this.component.parentComponent._isTransition = false;
        }
    },

    /**
     * Do expand or collapse when click on the header.
     * @method
     * @private
     */
    handlePress: {
        value: function (event) {
            //Only trigger css animation when clicking on header, this may need change base on how SelectionController handle
            //multipleSelection and singleSelection.
            this._isTransition = true;
            this.isExpanded = !this.isExpanded;
        }
    },

    enterDocument: {
        value: function (firstTime) {
            if (firstTime) {
                var header = this.element.children[0];
                this._pressComposer = new PressComposer();
                //Register composer here and add event in prepareForActivationEvents.
                this.addComposerForElement(this._pressComposer, header);
            }
        }
    }

});
