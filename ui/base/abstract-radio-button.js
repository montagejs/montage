/*global require, exports, document, Error*/
var AbstractControl = require("./abstract-control").AbstractControl,
    PressComposer = require("../../composer/press-composer").PressComposer,
    KeyComposer = require("../../composer/key-composer").KeyComposer;

var CLASS_MONTAGE_DISABLED = "montage--disabled",
    CLASS_MONTAGE_ACTIVE = "montage--active",
    CLASS_MONTAGE_CHECKED = "montage-RadioButton--checked";

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
        }
    },

    /**
     * Whether the user is pressing the radio button.
     * @type {boolean}
     */
    _active: {
        value: false
    },

    active: {
        set: function (_active) {
            _active = !!_active;

            if (this._active !== _active) {
                this._active = _active;

                if (_active) {
                    this.classList.add(this.activeClass);
                } else {
                    this.classList.remove(this.activeClass);
                }
            }
        },
        get: function () {
            return this._active;
        }
    },

    _checked: {
        value: null
    },

    /**
     * Whether this radio button is checked.
     * @type {boolean}
     */
    checked: {
        set: function (_checked) {
            _checked = !!_checked;

            if (this._checked !== _checked) {
                this._checked = _checked;

                if (_checked) {
                    this.classList.add(this.checkedClass);
                } else {
                    this.classList.remove(this.checkedClass);
                }
            }
        },
        get: function () {
            return this._checked;
        }
    },

    _disabledClass: {
        value: null
    },

    disabledClass: {
        set: function (_disabledClass) {
            var previousClass = this.disabledClass; // need to call the getter

            if (_disabledClass && typeof _disabledClass === "string" && previousClass !== _disabledClass) {
                this._swapClassNameIfNeeded(previousClass, _disabledClass);
                this._disabledClass = _disabledClass;
            }
        },
        get: function () {
            return this._disabledClass || CLASS_MONTAGE_DISABLED;
        }
    },

    _activeClass: {
        value: null
    },

    activeClass: {
        set: function (_activeClass) {
            var previousClass = this.activeClass; // need to call the getter

            if (_activeClass && typeof _activeClass === "string" && previousClass !== _activeClass) {
                this._swapClassNameIfNeeded(previousClass, _activeClass);
                this._activeClass = _activeClass;
            }
        },
        get: function () {
            return this._activeClass || CLASS_MONTAGE_ACTIVE;
        }
    },

    _checkedClass: {
        value: null
    },

    checkedClass: {
        set: function (_checkedClass) {
            var previousClass = this.checkedClass; // need to call the getter

            if (_checkedClass && typeof _checkedClass === "string" && previousClass !== _checkedClass) {
                this._swapClassNameIfNeeded(previousClass, _checkedClass);
                this._checkedClass = _checkedClass;
            }
        },
        get: function () {
            return this._checkedClass || CLASS_MONTAGE_CHECKED;
        }
    },

    _swapClassNameIfNeeded: {
        value: function (_previous, _new) {
            if (_previous && _new && this.classList.has(_previous)) {
                this.classList.remove(_previous);
                this.classList.add(_new);
            }
        }
    },

    /**
     * Whether this radio button is enabled.
     * @type {boolean}
     */
    _enabled: {
        value: true
    },

    enabled: {
        set: function (_enabled) {
            _enabled = !!_enabled;

            if (this._enabled !== _enabled) {
                this._enabled = _enabled;

                if (!_enabled) {
                    this.classList.add(this.disabledClass);
                } else {
                    this.classList.remove(this.disabledClass);
                }
            }
        },
        get: function () {
            return this._enabled;
        }
    },

    __keyComposer: {
        value: null
    },

    _keyComposer: {
        get: function () {
            if (!this.__keyComposer) {
                this.__keyComposer = new KeyComposer();
                this.__keyComposer.keys = "space";
                this.addComposer(this.__keyComposer);
            }

            return this.__keyComposer;
        }
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

    __pressComposer: {
        value: null
    },

    _pressComposer: {
        get: function () {
            if (!this.__pressComposer) {
                this.__pressComposer = new PressComposer();
                this.addComposer(this.__pressComposer);
            }

            return this.__pressComposer;
        }
    },

    enterDocument: {
        value: function (firstTime) {
            if (firstTime) {
                this.element.setAttribute("role", "radio");
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
            this._keyComposer.addEventListener("keyPress", this, false);
            this._keyComposer.addEventListener("keyRelease", this, false);

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
