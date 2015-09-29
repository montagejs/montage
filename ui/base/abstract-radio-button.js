/*global require, exports, document, Error*/
var AbstractControl = require("./abstract-control").AbstractControl,
    PressComposer = require("../../composer/press-composer").PressComposer,
    KeyComposer = require("../../composer/key-composer").KeyComposer;

var CLASS_PREFIX = "montage-RadioButton";

/**
 * @class AbstractRadioButton
 * @classdesc Provides common implementation details for radio buttons.
 * @extends AbstractControl
 */
var AbstractRadioButton = exports.AbstractRadioButton = AbstractControl.specialize(
    /** @lends AbstractRadioButton# */
{

    /**
     * Dispatched when the radio button is activated through a mouse click,
     * finger tap, or when focused and the spacebar is pressed.
     * @event action
     * @memberof AbstractRadioButton
     * @param {Event} event
     */

    constructor: {
        value: function AbstractRadioButton() {
            if(this.constructor === AbstractRadioButton) {
                throw new Error("AbstractRadioButton cannot be instantiated.");
            }
            AbstractControl.constructor.call(this); // super
            this._pressComposer = new PressComposer();
            this.addComposer(this._pressComposer);

            this._keyComposer = new KeyComposer();
            this._keyComposer.component = this;
            this._keyComposer.keys = "space";
            this.addComposer(this._keyComposer);

            this.defineBindings({
                // classList management
                "classList.has('is-disabled')": { "<-": "!enabled" },
                "classList.has('is-active')": { "<-": "active" },
                "classList.has('is-checked')": { "<-": "checked" },
                
                // deprecated -> kept for backwards compatibility
                "classList.has('montage--disabled')": { "<-": "!enabled" },
                "classList.has('montage--active')": { "<-": "active" },
                "classList.has('montage-RadioButton--checked')": { "<-": "checked" }
            });
        }
    },

    /**
     * Whether the user is pressing the radio button.
     * @type {boolean}
     */
    active: {
        value: false
    },

    _checked: {
        value: null
    },

    /**
     * Whether this radio button is checked.
     * @type {boolean}
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
     * Whether this radio button is enabled.
     * @type {boolean}
     */
    enabled: {
        value: true
    },

    _keyComposer: {
        value: null
    },

    _radioButtonController: {
        value: null
    },

    /**
     * The radio button controller that ensures that only one radio button in
     * its `content` is `checked` at any time.
     * @type {RadioButtonController}
     */
    radioButtonController: {
        set: function (value) {
            if (this._radioButtonController) {
                this._radioButtonController.unregisterRadioButton(this);
            }
            this._radioButtonController = value;
            value.registerRadioButton(this);
        },
        get: function () {
            return this._radioButtonController;
        }
    },

    _pressComposer: {
        value: null
    },

    enterDocument: {
        value: function (firstTime) {
            if (firstTime) {
                this.element.setAttribute("role", "radio");
                this._keyComposer.addEventListener("keyPress", this, false);
                this._keyComposer.addEventListener("keyRelease", this, false);
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

    check: {
        value: function () {
            if (!this.enabled || this.checked) {
                return;
            }

            this.dispatchActionEvent();
            this.checked = true;
        }
    },

    /**
     Handle press event from press composer
     */
    handlePress: {
        value: function (/* event */) {
            this.active = false;
            this.check();
        }
    },

    /**
     Called when all interaction is over.
     @private
     */
    handlePressCancel: {
        value: function (/* event */) {
            this.active = false;
            document.removeEventListener("touchmove", this, false);
        }
    },

    handleKeyPress: {
        value: function () {
            this.active = true;
        }
    },

    handleKeyRelease: {
        value: function () {
            this.active = false;
            this.check();
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
            this.check();
        }
    }
});
