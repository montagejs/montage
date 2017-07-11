/**
    @module "montage/ui/input-radio.reel"
*/
var CheckControl = require("ui/check-control").CheckControl,
    PressComposer = require("../../composer/press-composer").PressComposer,
    KeyComposer = require("../../composer/key-composer").KeyComposer;
/**
 * Wraps the a &lt;input type="radio"> element with binding support for the element's standard attributes.
   @class module:"montage/ui/native/input-radio.reel".InputRadio
   @extends module:montage/ui/check-input.CheckInput
 */
var Radio = exports.Radio = CheckControl.specialize({

    // constructor: {
    //     value: function InputRadio() {
    //         this.super();
    //         return this;
    //     }
    // },

    drawsFocusOnPointerActivation : {
        value: true
    },

    hasTemplate: {
        value: false
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

            this.super();

            this._keyComposer = new KeyComposer();
            this._keyComposer.component = this;
            this._keyComposer.keys = "space";
            this.addComposer(this._keyComposer);

            this._keyComposer.addEventListener("keyPress", this, false);
            this._keyComposer.addEventListener("keyRelease", this, false);
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
            if(value) value.registerRadioButton(this);
        },
        get: function () {
            return this._radioButtonController;
        }
    }

});
