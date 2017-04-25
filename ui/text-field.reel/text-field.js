/**
    @module "montage/ui/native/input-text.reel"
*/
var TextInput = require("ui/text-input").TextInput,
    KeyComposer = require("../../composer/key-composer").KeyComposer;
/**
 * Wraps the a &lt;input type="text"> element with binding support for the element's standard attributes.
   @class module:"montage/ui/native/input-text.reel".InputText
   @extends module:montage/ui/text-input.TextInput

 */
exports.TextField = TextInput.specialize({
    constructor: {
        value: function TextField() {
            TextInput.constructor.call(this); // super

            this._keyComposer = new KeyComposer();
            this._keyComposer.component = this;
            this._keyComposer.keys = "enter";
            this.addComposer(this._keyComposer);

        }
    },

    hasTemplate: {
        value: false 
    },

    handleKeyPress: {
        value: function (evt) {
            if (this.disabled || evt.keyComposer !== this._keyComposer) {
                return;
            }

            this.takeValueFromElement();
            this.dispatchActionEvent();
        }
    },

    prepareForActivationEvents: {
        value: function () {
            TextInput.prototype.prepareForActivationEvents.call(this) ;
            this._keyComposer.addEventListener("keyPress", this, false);
        }
    }



});
