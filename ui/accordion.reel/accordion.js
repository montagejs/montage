/**
 * @module accordion
 * @requires montage/ui/montage
 * @requires montage/ui/component
 */
var Component = require("../component").Component;

/**
 * @class Accordion
 * @extends Component
 * Accordion displays collapsible content panels for presenting information in a limited amount of space.
 */
exports.Accordion = Component.specialize(/** @lends Condition# */ {

    constructor: {
        value: function Accordion() {
            this.super();
        }
    },

    /**
     * Accept an array to describe data mode of each collapsible panel inside Accordion,
     * the data structure is {'title':,'bodyName':,'value':, 'expanded':},
     * @type {Array.<Object>}
     */
    content: {
        value: null
    },

    /**
     * contentController
     * @type {RangeController}
     */
    contentController: {
        value: null
    },

    /**
     * If allow expanding more than one collapsible panel at same time.
     * @type {boolean}
     * @default false
     */
    isMultipleExpansionAllowed: {
        value: false
    },

    /**
     * The open collapsible panel
     * @type {AccordionCollapsiblePanel}
     */
    expandedPanel: {
        value: null
    },

    /**
     * The open collapsible panels, only has values when isAllowMultipleExpandedAllowed is true
     * @type {AccordionCollapsiblePanel}
     */
    expandedPanels: {
        value: null
    },

    /**
     * Add open collapsible panel to expandedPanel array
     * @method
     * @private
     * @param {AccordionCollapsiblePanel} panel
     */
    _addExpendedPanel: {
        value: function (panel) {
            if (!this.expandedPanels) {
                this.expandedPanels = [];
            }
            if (this.expandedPanels.indexOf(panel) == -1) {
                this.expandedPanels.push(panel)
            }

        }
    },

    /**
     * Remove collapsed collapsible panel from expandedPanel array
     * @method
     * @private
     * @param {AccordionCollapsiblePanel} panel
     */
    _removeExpendedPanel: {
        value: function (panel) {
            var index = this.expandedPanels.indexOf(panel);
            if (index > -1) {
                this.expandedPanels.splice(index, 1);
            }

        }
    },

    templateDidLoad: {
        value: function () {
            if (this.content) {
                this.templateObjects.repetition.defineBinding(
                    "content", {"<-": "content", source: this}
                );
            }
            if (this.contentController) {
                this.templateObjects.repetition.defineBinding(
                    "contentController", {"<-": "contentController", source: this}
                );
            }
        }
    },

    exitDocument: {
        value: function () {
            this.templateObjects.repetition.cancelBindings();
        }
    }

});
