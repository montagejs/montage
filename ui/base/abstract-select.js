/*global require, exports*/

/**
 * @module montage/ui/base/abstract-select.reel
 */
var AbstractControl = require("./abstract-control").AbstractControl,
    PressComposer = require("../../composer/press-composer").PressComposer,
    RangeController = require("../../core/range-controller").RangeController;

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
            if (this.constructor === AbstractSelect) {
                throw new Error("AbstractSelect cannot be instantiated.");
            }

            this.defineBindings({
                // classList management
                "classList.has('montage--disabled')": {
                    "<-": "!enabled"
                },
                "classList.has('montage--active')": {
                    "<-": "active"
                }
            });

            // Need to draw when "content" change
            this.addRangeAtPathChangeListener("content", this, "handleContentRangeChange");
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

    active: {
        value: false
    },

    content: {
        get: function () {
            if (this._contentController) {
                return this._contentController.content;
            }

            return null;
        },
        set: function (content) {
            if (content !== this.contentController.content) {
                this._contentController.content = content;
            }
        }
    },

    __pressComposer: {
        value: null
    },

    _pressComposer: {
        get: function() {
            if (!this.__pressComposer) {
                this.__pressComposer = new PressComposer();
                this.addComposer(this.__pressComposer);
            }

            return this.__pressComposer;
        }
    },

    _contentController: {
        value: null
    },

    contentController: {
        get: function () {
            if (!this._contentController) {
                this._contentController = new RangeController();
            }

            return this._contentController;
        },
        set: function (contentController) {
            if (this._contentController !== contentController) {
                this._contentController  = contentController;
                this.content  = contentController.content;
            }
        }
    },

    _labelPropertyName: {
        value: "label"
    },

    labelPropertyName: {
        set: function (value) {
            if (value) {
                this._labelPropertyName = value;
            } else {
                this._labelPropertyName = "label";
            }

            this._contentIsDirty = true;
            this.needsDraw = true;
        },
        get: function () {
            return this._labelPropertyName;
        }
    },

    _value: {
        value: null
    },

    value: {
        get: function () {
            return this._value;
        },
        set: function (value) {
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
        get: function () {
            return this._values;
        },
        set: function (values) {
            if (this.multiSelect && values !== this._values) {
                this._values = values;

                this.needsDraw = true;
            }
        }
    },

    multiSelect: {
        get: function () {
            return this.contentController.multiSelect;
        },
        set: function (multiSelect) {
            multiSelect = !!multiSelect;

            if (multiSelect !== this.contentController.multiSelect) {
                this.contentController.multiSelect = multiSelect;

                if (multiSelect) {
                    this.addRangeAtPathChangeListener("values", this, "handleValuesRangeChange");
                    this.value = null;
                    this.values =  this._contentController.selection;

                } else {
                    //FIXME: removeRangeAtPathChangeListener not implemented?
                    //this.removeRangeAtPathChangeListener("values", this, "handleValuesRangeChange");
                    this.values = null;
                }
            }
        }
    },

    _contentIsDirty: {
        value: true
    },

    prepareForActivationEvents: {
        value: function () {
            this._pressComposer.addEventListener("pressStart", this, false);
        }
    },

    // Handlers

    /**
     * Called when the user starts interacting with the component.
     */
    handlePressStart: {
        value: function (event) {
            this.active = true;

            //TODO need to be tested.
            if (event.touch) {
                // Prevent default on touchmove so that if we are inside a scroller,
                // it scrolls and not the webpage
                document.addEventListener("touchmove", this, false);
            }

            this._pressComposer.addEventListener("press", this, false);
            this._pressComposer.addEventListener("pressCancel", this, false);
        }
    },

    /**
     * Called when the user has interacted with the select.
     */
    handlePress: {
        value: function (event) {
            this.active = false;

            if (!this.enabled) {
                return;
            }

            this.dispatchActionEvent();
            this._removeEventListeners();
        }
    },

    /**
     * Called when all interaction is over.
     * @private
     */
    handlePressCancel: {
        value: function (event) {
            this.active = false;
            this._removeEventListeners();
        }
    },

    handleTouchmove: {
        value: function (event) {
            event.preventDefault();
        }
    },

    _removeEventListeners: {
        value: function () {
            document.removeEventListener("touchmove", this, false);
            this._pressComposer.removeEventListener("press", this, false);
            this._pressComposer.removeEventListener("pressCancel", this, false);
        }
    },

    enterDocument: {
        value: function (firstDraw) {
            if (firstDraw) {
                this.element.setAttribute("role", "listbox");
            }
        }
    },

    handleValuesRangeChange: {
        value: function () {
            //FIXME: removeRangeAtPathChangeListener not implemented
            if (this.multiSelect) {
                this.needsDraw = true;
            }
        }
    },

    handleContentRangeChange: {
        value: function () {
            var content = this.content;

            if (this.multiSelect) {
                this.values =  this._contentController.selection;

            } else {
                this.value = content && content.length ? content[0] : null;
            }

            this._contentIsDirty = true;
            this.needsDraw = true;
        }
    }

});

