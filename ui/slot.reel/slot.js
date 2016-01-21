/**
	@module "montage/ui/slot.reel"
    @requires montage/ui/component
*/
var Component = require("../component").Component;

/**
 * @class Slot
 * @classdesc A structural component that serves as a place-holder for some
 * other component.
 * @extends Component
 */
exports.Slot = Component.specialize( /** @lends Slot.prototype # */ {

    hasTemplate: {
        enumerable: false,
        value: false
    },

    /**
     * An optional helper object.  The slot consults
     * `delegate.slotElementForComponent(component):Element` if available for
     * the element it should use when placing a particular component on the
     * document.  The slot informs `delegate.slotDidSwitchContent(slot,
     * newContent, newComponent, oldContent, oldComponent)` if the content has
     * finished changing.  The component arguments are the `component`
     * properties of the corresponding content, or fall back to `null`.
     * @type {?Object}
     * @default null
     */
    delegate: {
        value: null
    },

    _content: {
        value: null
    },

    enterDocument:{
        value:function (firstTime) {
            if (firstTime) {
                this.element.classList.add("montage-Slot");
            }
        }
    },

    /**
     * The component that resides in this slot and in its place in the
     * template.
     * @type {Component}
     * @default null
    */
    content: {
        get: function () {
            return this._content;
        },
        set: function (value) {
            var element,
                content;

            if (value && typeof value.needsDraw !== "undefined") {
                content = this._content;

                // If the incoming content was a component; make sure it has an element before we say it needs to draw
                if (!value.element) {
                    element = document.createElement("div");

                    if (this.delegate && typeof this.delegate.slotElementForComponent === "function") {
                        element = this.delegate.slotElementForComponent(this, value, element);
                    }
                    value.element = element;
                } else {
                    element = value.element;
                }

                // The child component will need to draw; this may trigger a draw for the slot itself
                this.domContent = element;
                value.needsDraw = true;

            } else {
                this.domContent = value;
            }

            this._content = value;
            this.needsDraw = true;
        }
    },

    /**
     * Informs the `delegate` that `slotDidSwitchContent(slot)`
     * @function
     */
    contentDidChange: {
        value: function () {
            if (this.delegate && typeof this.delegate.slotDidSwitchContent === "function") {
                this.delegate.slotDidSwitchContent(this);
            }
        }
    }

});
