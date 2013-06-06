/*global require, exports*/

/**
 @module montage/ui/base/abstract-select.reel
 */
var Montage = require("montage").Montage,
    AbstractControl = require("ui/base/abstract-control").AbstractControl,
    PressComposer = require("composer/press-composer").PressComposer,
    RangeController = require("core/range-controller").RangeController,
    Dict = require("collections/dict");

/**
 * @class AbstractSelect
 * @extends AbstractControl
 * @fires action
 * @fires longAction
 */
var AbstractSelect = exports.AbstractSelect = AbstractControl.specialize( /** @lends AbstractSelect# */ {

    /**
     * Dispatched when the select is changed through a mouse click or finger tap.
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
            this._values = [];

            this.defineBindings({
                "content": {
                    "<->": "contentController.content"
                },
                "values": {
                    "<->": "contentController.selection"
                },
                "value": {
                    "<->": "values.0"
                },
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
            this.addRangeAtPathChangeListener("values", this, "handleValuesRangeChange");
            this.classList.add("matte-Select");
        }
    },

    /**
     * Enables or disables the Select from user input. When this property is set to `false`,
     * the "montage--disabled" CSS style is applied to the select's DOM element during the next draw cycle. When set to
     * `true` the "disabled" CSS class is removed from the element's class list.
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
            this._values = value;
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
     Called when the user starts interacting with the component.
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
     Called when the user has interacted with the select.
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
     Called when all interaction is over.
     @private
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
            this._contentIsDirty = true;
            this.needsDraw = true;
        }
    },

    handleValuesRangeChange: {
        value: function() {
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
