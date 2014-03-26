/*global require, exports*/

/**
 * @module montage/ui/base/abstract-select.reel
 */
var Montage = require("../../core/core").Montage,
    AbstractControl = require("./abstract-control").AbstractControl,
    PressComposer = require("../../composer/press-composer").PressComposer,
    RangeController = require("../../core/range-controller").RangeController,
    Dict = require("collections/dict");

/**
 * @class AbstractSelect
 * @extends AbstractControl
 * @fires action
 * @fires longAction
 */
var AbstractSelect = exports.AbstractSelect = AbstractControl.specialize( /** @lends AbstractSelect# */ {

    /**
     * Dispatched when the select is changed through a mouse click or finger
     * tap.
     * @event action
     * @memberof AbstractSelect
     * @param {Event} event
     */

    /**
     * @private
     */
    constructor: {
        value: function AbstractSelect() {
            if(this.constructor === AbstractSelect) {
                throw new Error("AbstractSelect cannot be instantiated.");
            }
            AbstractControl.constructor.call(this); // super
            this._pressComposer = new PressComposer();
            this.addComposer(this._pressComposer);
            this.contentController = new RangeController();
            this._values = this.contentController.selection;

            this.defineBindings({
                "content": {
                    "<->": "contentController.content"
                },
                // FIXME: due to issues with 2 way bindings with rangeContent()
                // we aren't currently able to have this "value" binding.
                // "value": {
                //     "<->": "values.one()"
                // },
                "contentController.multiSelect": {
                    "<-": "multiSelect"
                },
                // classList management
                "classList.has('montage--disabled')": {
                    "<-": "!enabled"
                },
                "classList.has('montage--active')": {
                    "<-": "active"
                }
            });

            // Need to draw when "content" or "values" change
            this.addRangeAtPathChangeListener("content", this, "handleContentRangeChange");
            // TODO: "value" <-> "values.one()"
            this.addRangeAtPathChangeListener("values", this, "handleValuesRangeChange");
            this.classList.add("matte-Select");
        }
    },

    /**
     * Enables or disables the Select from user input. When this property is
     * set to `false`, the "montage--disabled" CSS style is applied to the
     * select's DOM element during the next draw cycle. When set to `true` the
     * "disabled" CSS class is removed from the element's class list.
     * @type {boolean}
     */
    enabled: {
        value: true
    },

    acceptsActiveTarget: {
        value: true
    },

    _pressComposer: {
        value: null
    },

    active: {
        value: false
    },

    content: {
        value: null
    },

    contentController: {
        value: null
    },

    _labelPropertyName: {
        value: "label"
    },

    labelPropertyName: {
        set: function(value) {
            if (value) {
                this._labelPropertyName = value;
            } else {
                this._labelPropertyName = "label";
            }
            this._contentIsDirty = true;
            this.needsDraw = true;
        },
        get: function() {
            return this._labelPropertyName;
        }
    },

    _value: {
        value: null
    },

    value: {
        get: function() {
            return this._value;
        },
        set: function(value) {
            if (value !== this._value) {
                this._value = value;
                // TODO: "value" <-> "values.one()"
                if (this.values[0] !== value) {
                    this.values.splice(0, this.values.length, value);
                }
                this.needsDraw = true;
            }
        }
    },

    _values: {
        value: null
    },

    values: {
        get: function() {
            return this._values;
        },
        set: function(value) {
            var args = [0, this._values.length].concat(value);
            this._values.splice.apply(this._values, args);

            this.needsDraw = true;
        }
    },

    multiSelect: {
        value: false
    },

    _contentIsDirty: {
        value: true
    },

    prepareForActivationEvents: {
        value: function() {
            this._pressComposer.addEventListener("pressStart", this, false);
            this._pressComposer.addEventListener("press", this, false);
            this._pressComposer.addEventListener("pressCancel", this, false);
        }
    },

    // Handlers

    /**
     * Called when the user starts interacting with the component.
     */
    handlePressStart: {
        value: function(event) {
            this.active = true;

            if (event.touch) {
                // Prevent default on touchmove so that if we are inside a scroller,
                // it scrolls and not the webpage
                document.addEventListener("touchmove", this, false);
            }
        }
    },

    /**
     * Called when the user has interacted with the select.
     */
    handlePress: {
        value: function(event) {
            this.active = false;

            if (!this.enabled) {
                return;
            }

            this.dispatchActionEvent();
            document.removeEventListener("touchmove", this, false);
        }
    },

    /**
     * Called when all interaction is over.
     * @private
     */
    handlePressCancel: {
        value: function(event) {
            this.active = false;
            document.removeEventListener("touchmove", this, false);
        }
    },

    handleTouchmove: {
        value: function(event) {
            event.preventDefault();
        }
    },

    handleContentRangeChange: {
        value: function() {
            // When the content changes we need to update the "value" if none is
            // set (new content) or if the previous "value" was removed in this
            // range change.
            // FIXME: we only operate on the selection and not on the "values"
            // to avoid issues with 2-way binding to rangeContent().
            if (this.contentController.selection.length === 0 &&
                this.contentController.organizedContent.length > 0) {
                this.contentController.selection.push(this.contentController.organizedContent[0]);
            }

            this._contentIsDirty = true;
            this.needsDraw = true;
        }
    },

    handleValuesRangeChange: {
        value: function() {
            // TODO: "value" <-> "values.one()"
            if (this.values.length > 0) {
                this.value = this.values.one();
            }
            this.needsDraw = true;
        }
    },

    enterDocument: {
        value: function(firstDraw) {
            if(firstDraw) {
                this.element.setAttribute("role", "listbox");
            }
        }
    }

});

