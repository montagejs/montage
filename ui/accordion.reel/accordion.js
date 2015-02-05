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
     * Accept an array to describe data mode of each collapsible panel inside Accordion
     */
    content: {
        value: null
    },

    /**
     * contentController accepts a 'RangeController'
     */
    contentController: {value: null},

    /**
     * If allow expanding more than one section at a time.
     */
    isAllowMultipleExpandedAllowed: {
        value: false
    },

    /**
     * The open section
     */
    expandedPanel: {
        value: null
    },

    /**
     * TODO
     * The open sections, only has values when isAllowMultipleExpandedAllowed is true
     */
    expandedPanels: {
        value: null
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
