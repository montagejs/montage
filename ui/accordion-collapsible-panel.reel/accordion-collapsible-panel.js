/**
 * @module ui/collapsible-panel.reel
 * @requires montage/ui/component
 */
var Component = require("../component").Component;

/**
 * @class AccordionCollapsiblePanel
 * @extends Component
 *
 * The internal panel inside Accordion to display header abd body
 */
exports.AccordionCollapsiblePanel = Component.specialize(/** @lends AccordionCollapsiblePanel# */ {
    constructor: {
        value: function CollapsiblePanel() {
            this.super();
        }
    },

    /**
     * The parent Accordion component contains this.
     * @type {Accordion}
     */
    accordion: {
        value: null
    },

    /**
     * Is the collapsible panel expanded or collapsed
     * @type {boolean}
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

    enterDocument: {
        value: function (firstTime) {
            if (firstTime) {
                var header = this.templateObjects.owner.element.children[0];
                header.addEventListener("mouseup", this, false);
            }
        }
    },

    /**
     * Do expand or collapse when click on the header
     * @method
     * @private
     */
    handleMouseup: {
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

    /**
     * Set expanded panel(s) in Accordion
     * @method
     * @private
     */
    _setAccordionExpandedPanel: {
        value: function () {
            //If isMultipleExpansionAllowed is false, close the open panel before open a new one.
            if (this.accordion.isMultipleExpansionAllowed == false) {
                if (this.accordion.expandedPanel) {
                    //Don't trigger draw
                    this.accordion.expandedPanel._isExpanded = false;
                    //Trigger css height transition
                    this.accordion.expandedPanel.templateObjects.owner.element.children[1].style.height = '0px'
                    this.accordion.expandedPanel.templateObjects.owner.element.children[1].classList.remove('active');
                }
                this.accordion.expandedPanel = this;
            } else {
                this.accordion._addExpendedPanel(this);
            }
        }
    },

    draw: {
        value: function () {
            var bodyWrapper = this.templateObjects.owner.element.children[1];
            var body = bodyWrapper.children[0];
            if (this.isExpanded) {
                if (this.accordion) {
                    this._setAccordionExpandedPanel();
                }
                //Trigger css height transition
                if (body.clientHeight > 0) {
                    bodyWrapper.style.height = body.clientHeight + 'px'
                }
                bodyWrapper.classList.add('active');
            } else {
                //Trigger css height transition
                bodyWrapper.style.height = '0px'
                bodyWrapper.classList.remove('active');
                if (this.accordion && this.accordion.isMultipleExpansionAllowed) {
                    this.accordion._removeExpendedPanel(this);
                }

            }
        }
    }

});
