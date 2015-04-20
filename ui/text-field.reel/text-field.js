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

    acceptsActiveTarget: {
        get: function () {
            var shouldBeginEditing = this.callDelegateMethod("shouldBeginEditing", this);
            return (shouldBeginEditing !== false);
        }
    },

    willBecomeActiveTarget: {
        value: function (event) {
            this._hasFocus = true;
            this.callDelegateMethod("didBeginEditing", this);
        }
    },

    surrendersActiveTarget: {
        value: function (event) {
            var shouldEnd = this.callDelegateMethod("shouldEndEditing", this);
            if (shouldEnd === false) {
                return false;
            } else {
                this._hasFocus = false;
                this.callDelegateMethod("didEndEditing", this);
            }
            return true;
        }
    },

    select: {
        value: function() {
            this._element.select();
        }
    }

});

