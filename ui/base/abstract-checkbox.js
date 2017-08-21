/*global require, exports, document, Error*/
var AbstractControl = require("./abstract-control").AbstractControl,
    PressComposer = require("../../composer/press-composer").PressComposer;

var CLASS_PREFIX = "montage-Checkbox";

/**
 * @class AbstractCheckbox
 * @extends AbstractControl
 */
var AbstractCheckbox = exports.AbstractCheckbox = AbstractControl.specialize( /** @lends AbstractCheckbox# */ {

    /**
     * Dispatched when the checkbox is activated through a mouse click,
     * finger tap, or when focused and the spacebar is pressed.
     * @event action
     * @memberof AbstractCheckbox
     * @param {Event} event
     */

    constructor: {
        value: function AbstractCheckbox() {
            if(this.constructor === AbstractCheckbox) {
                throw new Error("AbstractCheckbox cannot be instantiated.");
            }

            this._pressComposer = new PressComposer();
            this.addComposer(this._pressComposer);

            this.defineBindings({
                // classList management
                "classList.has('montage--disabled')": {
                    "<-": "!enabled"
                },
                "classList.has('montage--active')": {
                    "<-": "active"
                },
                "classList.has('montage-Checkbox--checked')": {
                    "<-": "checked"
                }
            });
        }
    },

    hasTemplate: {
        value: false
    },

    /**
     * This property is true when the checkbox is being interacted with, either through mouse click or touch event, otherwise false.
     * @type {boolean}
     * @default false
     */
    active: {
        value: false
    },

    value: {
        value: null
    },

    _checked: {
        value: false
    },

    /**
     * This property reflect the checked state of the checkbox.
     * @type {boolean}
     * @default false
     */
    checked: {
        set: function (value) {
            this._checked = value;
        },
        get: function () {
            return this._checked;
        }
    },

    /**
     * Enables or disables the checkbox from user input. When this property is set to ```false```,
     * the "montage--disabled" CSS class is applied to the checkbox's DOM element during the next draw cycle. When set to
     * ```true``` the "montage--disabled" CSS class is removed from the element's class list.
     * @type {boolean}
     */
    enabled: {
        value: true
    },

    _pressComposer: {
        value: null
    },

    enterDocument: {
        value: function (firstTime) {
            if (firstTime) {
                this.element.setAttribute("role", "checkbox");
            }
        }
    },

    draw: {
        value: function () {
            if (this.checked) {
                this.element.setAttribute("aria-checked", "true");
            } else {
                this.element.setAttribute("aria-checked", "false");
            }
        }
    },

    toggleChecked: {
        value: function () {
            if (!this.enabled) {
                return;
            }
            this.checked = !this.checked;
            this.dispatchActionEvent();
        }
    },

    handlePressStart: {
        value: function (event) {
            this.active = true;

            if (event.touch) {
                // Prevent default on touchmove so that if we are inside a scroller,
                // it scrolls and not the webpage
                document.addEventListener("touchmove", this, false);
            }
        }
    },

    /**
     * Handle press event from press composer
     */
    handlePress: {
        value: function (/* event */) {
            this.active = false;
            this.toggleChecked();
        }
    },

    /**
     * Called when all interaction is over.
     * @private
     */
    handlePressCancel: {
        value: function (/* event */) {
            this.active = false;
            document.removeEventListener("touchmove", this, false);
        }
    },

    prepareForActivationEvents: {
        value: function () {
            this._pressComposer.addEventListener("pressStart", this, false);
            this._pressComposer.addEventListener("press", this, false);
            this._pressComposer.addEventListener("pressCancel", this, false);
        }
    },

    activate: {
        value: function () {
            this.toggleChecked();
        }
    }

});

