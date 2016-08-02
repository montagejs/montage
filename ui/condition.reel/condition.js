/**
 * @module "montage/ui/condition.reel"
 */
var Component = require("../component").Component,
    logger = require("../../core/logger").logger("condition");

/**
 * The condition component shows its DOM content when its
 * [condition]{@link Condition#condition} property is `true`, and hides its DOM
 * content when it is `false`.
 *
 * Different strategies can be used to hide the DOM content. By default the
 * condition will remove its content from the DOM but
 * [removalStrategy]{@link Condition#removalStrategy} can be changed to alter
 * this behavior.
 *
 * @class Condition
 * @classdesc A component that shows or hides its inner template in response to
 * changes to some condition.
 * @extends Component
 */
exports.Condition = Component.specialize( /** @lends Condition.prototype # */ {

    hasTemplate: {
        value: false
    },

    _condition: {
        value: true
    },

    _contents: {
        value: null
    },

    _needsClearDomContent: {
        value: false
    },

    __contentDocumentFragment: {
        value: null
    },

    _contentDocumentFragment: {
        get: function () {
            if (!this.__contentDocumentFragment && this.element) {
                this.__contentDocumentFragment = document.createDocumentFragment();
            }

            return this.__contentDocumentFragment;
        }
    },

    /**
     * The boolean value that specifies if the contents of the condition are
     * visible (`true`) or hidden (`false`).
     * `null` is equivalent to `false`.
     *
     * @returns {boolean}
     * @default null
     */
    condition: {
        set: function (value) {

            if (value === this._condition) {
                return;
            }

            this._condition = value;
            this.needsDraw = true;
            // If it is being deserialized element might not been set yet
            if (!this.isDeserializing && this.removalStrategy === "remove") {
                if (value) {
                    this.domContent = this._contentDocumentFragment.childNodes;

                } else {
                    this._needsDraw = this._needsClearDomContent = true;
                }
            }
        },
        get: function () {
            return this._condition;
        }
    },

    _clearDomContent: {
        value: function () {
            if (this.removalStrategy === "remove" && !this._condition) {
                var childNodes = this.element.childNodes;

                while (childNodes.length) {
                    this._contentDocumentFragment.appendChild(childNodes[0]);
                }

                this.domContent = null;
                this._shouldClearDomContentOnNextDraw = false;
                this.needsDraw = false;
            }

            this._needsClearDomContent = false;
        }
    },

    deserializedFromTemplate: {
        value: function () {
            // update the DOM if the condition is false because we're preventing
            // changes at deserialization time.
            if (!this._condition) {
                this._clearDomContent();
            }
        }
    },

    _removalStrategy:{
        value: "remove"
    },

    // TODO should this strategy be part of another class?
    // TODO expose the options as an exported enum
    /**
     * The removal strategy specifies how the condition should remove its
     * content when [condition]{@link Condition#condition} is `false`.
     *
     * A value of `remove` will make the condition remove its contents from
     * the DOM.
     *
     * A value of `hide` will make the condition hide its contents through CSS
     * using the `montage-invisible` class while keeping them on the DOM. Apps using
     * `hide` should declare the `montage-invisible` class
     * which will be applied to elements.
     *
     * Example:
     *
     * ```css
     * .montage-invisible {
     *   display: none;
     * }
     * ```
     *
     * Possible values are `remove`, `hide`.
     *
     * @type {string}
     * @default "remove"
     */
    removalStrategy:{
        get:function () {
            return this._removalStrategy;
        },
        set:function (value) {
            if (this._removalStrategy !== value) {
                this._removalStrategy = value;
                this.needsDraw = true;
            }
        }
    },

    draw: {
        value: function () {
            if (this.condition) {
                this.element.classList.remove("montage-invisible");
            } else {
                this.element.classList.add("montage-invisible");
            }

           if (this._needsClearDomContent) {
               this._clearDomContent();
           }
        }
    }

});
