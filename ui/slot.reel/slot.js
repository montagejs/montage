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

    constructor: {
        value: function Slot() {
            this.super();
            this.content = null;
        }
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
                    element.id = value.identifier || "appendDiv"; // TODO: This should be uniquely generated

                    if (this.delegate && typeof this.delegate.slotElementForComponent === "function") {
                        element = this.delegate.slotElementForComponent(this, value, element);
                    }
                    value.element = element;
                } else {
                    element = value.element;
                }
                // The child component will need to draw; this may trigger a draw for the slot itself
                Object.getPropertyDescriptor(Component, "domContent").set.call(this, element);
                value.needsDraw = true;
            } else {
                Object.getPropertyDescriptor(Component, "domContent").set.call(this, value);
            }
            this._content = value;
            this.needsDraw = true;
        }
    },

    /**
     * Informs the `delegate` that `slotDidSwitchContent(slot, newContent,
     * oldContent)`
     * @function
     * @param newContent
     * @param oldContent
     */
    contentDidChange: {
        value: function (newContent, oldContent) {
            if (this.delegate && typeof this.delegate.slotDidSwitchContent === "function") {
                this.delegate.slotDidSwitchContent(this, newContent, (newContent ? newContent.component : null), oldContent, (oldContent ? oldContent.component : null));
            }
        }
    }

});

