/**
 * @module ui/collapsible-panel.reel
 * @requires montage/ui/component
 */
var Component = require("ui/component").Component,
    PressComposer = require("composer/press-composer").PressComposer;

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
     *
     * @private
     */
    _isTransition: {
        value: false
    },

    _isExpanded: {
        value: false
    },

    /**
     * Is the collapsible panel expanded or collapsed. User can directly change this property to change choice in
     * expansionController.
     *
     */
    isExpanded: {
        set: function (value) {
            this._isExpanded = value;
        },
        get: function () {
            return this._isExpanded
        }
    },

    /**
     * CollapsiblePanel's data.
     *
     * @type {Object}
     */
    data: {
        value: null
    },

    /**
     * A ChoiceController that control expanded panel and multiple mode of CollapsiblePanel.
     *
     * @type {Object}
     */
    expansionController: {
        set: function (value) {
            this._expansionController = value;
            // The _isExpanded is binding to this not _expansionController, cancel it when new _expansionController passing in.
            if (this.getBinding("_isExpanded")) {
                this.cancelBinding("_isExpanded");
            }
            this.defineBinding("_isExpanded", {
                "<->": "_expansionController.choice.data.has(data)"
            });
        }
    },

    prepareForActivationEvents: {
        value: function () {
            var handler = this.handleTransitionEnd.bind(this);
            var bodyWrapper = this.element.children[1];
            this._pressComposer.addEventListener("press", this, false);
            // Listen to CSS transition call back.
            bodyWrapper.addEventListener('webkitTransitionEnd', handler);
            bodyWrapper.addEventListener('transitionend', handler);
        }
    },

    handleTransitionEnd: {
        value: function () {
            this._isTransition = false;
        }
    },

    /**
     * Do expand or collapse when click on the header.
     *
     * @method
     * @private
     */
    handlePress: {
        value: function (event) {
            // Only trigger css animation when clicking on header, this may need change base on how SelectionController
            // handle multipleSelection and singleSelection.
            this._isTransition = true;
            this._isExpanded = !this._isExpanded;
        }
    },

    enterDocument: {
        value: function (firstTime) {
            var header;
            if (firstTime) {
                header = this.element.children[0];
                this._pressComposer = new PressComposer();
                // Register composer here and add event in prepareForActivationEvents.
                this.addComposerForElement(this._pressComposer, header);
            }
        }
    }

});
