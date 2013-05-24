/*global require, exports, document, Error*/
var Montage = require("montage").Montage,
    AbstractControl = require("ui/base/abstract-control").AbstractControl,
    PressComposer = require("composer/press-composer").PressComposer;

var CLASS_PREFIX = "montage-Checkbox";

/**
 * @class AbstractCheckbox
 * @extends AbstractControl
 */
var AbstractCheckbox = exports.AbstractCheckbox = Montage.create(AbstractControl,
    /* @lends AbstractCheckbox# */
    {
        /**
         * Dispatched when the checkbox is activated through a mouse click,
         * finger tap, or when focused and the spacebar is pressed.
         * @event action
         * @memberof AbstractCheckbox
         * @param {Event} event
         */

        create: {
            value: function() {
                if(this === AbstractCheckbox) {
                    throw new Error("AbstractCheckbox cannot be instantiated.");
                } else {
                    return AbstractControl.create.apply(this, arguments);
                }
            }
        },

        didCreate: {
            value: function() {
                AbstractControl.didCreate.call(this); // super
                this._pressComposer = PressComposer.create();
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

        active: {
            value: false
        },

        _checked: {
            value: false
        },

        checked: {
            set: function(value) {
                this._checked = value;
            },
            get: function() {
                return this._checked;
            }
        },

        enabled: {
            value: true
        },

        _pressComposer: {
            value: null
        },

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
         Handle press event from press composer
         */
        handlePress: {
            value: function(/* event */) {
                this.active = false;

                if (!this.enabled) {
                    return;
                }

                this.dispatchActionEvent();
                this.checked = !this.checked;
            }
        },

        /**
         Called when all interaction is over.
         @private
         */
        handlePressCancel: {
            value: function(/* event */) {
                this.active = false;
                document.removeEventListener("touchmove", this, false);
            }
        },

        prepareForActivationEvents: {
            value: function() {
                this._pressComposer.addEventListener("pressStart", this, false);
                this._pressComposer.addEventListener("press", this, false);
                this._pressComposer.addEventListener("pressCancel", this, false);
            }
        }
    });
