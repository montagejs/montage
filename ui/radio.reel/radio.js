/**
    @module "montage/ui/input-radio.reel"
*/
var CheckControl = require("ui/check-control").CheckControl;
/**
 * Wraps the a &lt;input type="radio"> element with binding support for the element's standard attributes.
   @class module:"montage/ui/native/input-radio.reel".InputRadio
   @extends module:montage/ui/check-input.CheckInput
 */
var Radio = exports.Radio = CheckControl.specialize({
    
    constructor: {
        value: function InputRadio() {
            this.super();
            this.defineBindings({
                "classList.has('montage-RadioButton--checked')": {
                    "<-": "checked"
                }
            });
        }
    },

    enterDocument: {
        value: function (firstTime) {
            if (firstTime) {
                this.element.setAttribute("role", "radio");
            }
        }
    },
    
    prepareForActivationEvents: {
        value: function() {
            
            this._pressComposer = new PressComposer();
            this.addComposer(this._pressComposer);

            this._pressComposer.addEventListener("pressStart", this, false);
            this._pressComposer.addEventListener("press", this, false);
            this._pressComposer.addEventListener("pressCancel", this, false);

            this._keyComposer = new KeyComposer();
            this._keyComposer.component = this;
            this._keyComposer.keys = "space";
            this.addComposer(this._keyComposer);
            
            this._keyComposer.addEventListener("keyPress", this, false);
            this._keyComposer.addEventListener("keyRelease", this, false);
        }
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
    
    activate: {
        value: function () {
            this.check();
        }
    }

});
