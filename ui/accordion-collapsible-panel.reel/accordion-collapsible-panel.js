/**
 * @module ui/collapsible-panel.reel
 * @requires montage/ui/component
 */
var Component = require("../component").Component;

/**
 * @class AccordionCollapsiblePanel
 * @extends Component
 *
 * The internal panel inside Accordion to display header abd body for each section
 */
exports.AccordionCollapsiblePanel = Component.specialize(/** @lends AccordionCollapsiblePanel# */ {
    constructor: {
        value: function CollapsiblePanel() {
            this.super();

        }
    },

    _pressComposer: {
        value: null
    },

    /**
     * The parent Accordion component contains this.
     */
    accordion: {
        value: null
    },

    /**
     * Is the collapsible panel expanded or collapsed
     */
    isExpanded: {
        set: function (value) {
            this._isExpanded = value;
            this.needsDraw = true;

        },
        get: function () {
            return this._isExpanded;
        }
    },

    templateDidLoad: {
        value: function () {
            var header = this.templateObjects.owner.element.children[0];
            //Should we use PressComposer for this header click event?
            header.addEventListener("mousedown", this, false);
        }
    },

    handleMousedown: {
        value: function (event) {
            //When isMultipleExpansionAllowed is false, if panel is already expanded, return.
            if (this.accordion &&
                this.accordion.expandedPanel == this &&
                this.accordion.isMultipleExpansionAllowed == false &&
                this.isExpanded) {
                return;
            }
            this.isExpanded = !this.isExpanded;
        }
    },

    draw: {
        value: function () {
            var body = this.templateObjects.owner.element.children[1];
            if (this.isExpanded) {
                if (this.accordion) {
                    //If isMultipleExpansionAllowed is false, close the open panel before open a new one.
                    if (this.accordion.isMultipleExpansionAllowed == false) {
                        if (this.accordion.expandedPanel) {
                            //Don't trigger draw
                            this.accordion.expandedPanel._isExpanded = false;
                            this.accordion.expandedPanel.templateObjects.owner.element.children[1].classList.remove('active');
                        }
                        this.accordion.expandedPanel = this;
                    }
                }
                body.classList.add('active');
            } else {
                body.classList.remove('active');
            }
        }
    }

});
