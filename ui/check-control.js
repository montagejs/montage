/*global require, exports */

/**
    @module montage/ui/check-control
*/
var Control = require("ui/control").Control,
    PressComposer = require("composer/press-composer").PressComposer;

/**
    The base class for the Checkbox component. You will not typically create this class directly but instead use the Checkbox component.
    @class module:montage/ui/check-input.CheckControl
    @extends module:montage/ui/control.Control
*/
exports.CheckControl =  Control.specialize({
    constructor: {
        value: function CheckControl() {

            this.defineBindings({
                "classList.has('montage--checked')": {
                     "<-": "checked"
                }
            });

            var leftExpression = "classList.has('",
                bindings = {};
            leftExpression += this.checkedClassName;
            leftExpression += "')";
            bindings[leftExpression] = {
                    "<-": "checked"
            };

            this.defineBindings(bindings);
        }
    },

    // HTMLInputElement methods

    // click() deliberately omitted, use checked = instead

    // Callbacks
    draw: {
        value: function() {
            this.super();
            this._element.setAttribute("aria-checked", this._checked);
        }
    },

    _pressComposer: {
        enumerable: false,
        value: null
    },

    prepareForActivationEvents: {
        value: function() {
            var pressComposer = this._pressComposer = new PressComposer();
            this.addComposer(pressComposer);
            pressComposer.addEventListener("pressStart", this, false);
            pressComposer.addEventListener("press", this, false);
            pressComposer.addEventListener("cancel", this, false);
            this._element.addEventListener('change', this);
        }
    },

    toggleChecked: {
        value: function () {
            if (this.disabled) {
                return;
            }
            this.checked = !this.checked;
            this.dispatchActionEvent();
        }
    },

    /**
    Fake the checking of the element.

    Changes the checked property of the element and dispatches a change event.
    Radio button overrides this.

    @private
    */
    _fakeCheck: {
        enumerable: false,
        value: function() {
            var changeEvent;
            // NOTE: this may be BAD, modifying the element outside of
            // the draw loop, but it's what a click/touch would
            // actually have done
            this._element.checked = !this._element.checked;
            changeEvent = document.createEvent("HTMLEvents");
            changeEvent.initEvent("change", true, true);
            this._element.dispatchEvent(changeEvent);
        }
    },

    /**
    Stores if we need to "fake" checking of the input element.

    When preventDefault is called on touchstart and touchend events (e.g. by
    the scroller component) the checkbox doesn't check itself, so we need
    to fake it later.

    @default false
    @private
    */
    _shouldFakeCheck: {
        enumerable: false,
        value: false
    },

    // Handlers

    handlePressStart: {
        value: function(event) {
            if (this.hasStandardElement){
                this._shouldFakeCheck = event.defaultPrevented;
            }
            else {
                this.active = true;

                if (event.touch) {
                    // Prevent default on touchmove so that if we are inside a scroller,
                    // it scrolls and not the webpage
                    document.addEventListener("touchmove", this, false);
                }
            }

        }
    },


    handlePress: {
        value: function(event) {
            if (this._shouldFakeCheck) {
                this._shouldFakeCheck = false;
                this._fakeCheck();
            }

            if (!this.hasStandardElement) {
                this.active = false;
                this.toggleChecked();

            }

        }
    },

    handlePressCancel: {
        value: function (/* event */) {
            if (!this.hasStandardElement) {
                this.active = false;
                document.removeEventListener("touchmove", this, false);
            }
        }
    },

    handleChange: {
        enumerable: false,
        value: function(event) {
            if (!this._pressComposer || this._pressComposer.state !== PressComposer.CANCELLED) {
                Object.getPropertyDescriptor(this, "checked").set.call(this,
                    this.element.checked, true);
                this._dispatchActionEvent();
            }
        }
    }
});

exports.CheckControl.addAttributes( /** @lends module:"montage/ui/native/check-control".InputCheckbox# */ {


/**
    Specifies if the checkbox is in it checked state or not.
    @type {boolean}
    @default false
*/
    checked: {value: false, dataType: 'boolean'},

/**
    The value associated with the element.
    @type {string}
    @default "on"
*/
    value: {value: 'on'}


});

