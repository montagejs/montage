/**
 * @module "montage/ui/label.reel"
 */
var Text = require("../text.reel/text").Text,
    PressComposer = require("../../composer/press-composer").PressComposer;

/* FIXME:
- docs,
- tests,
- emit events?
- handle keyboard events?
*/

var Label = exports.Label = Text.specialize({
    constructor: {
        value: function () {
            this._pressComposer = new PressComposer();
            this.addComposer(this._pressComposer);
        }
    },

    hasTemplate: {
        value: false 
    },

    prepareForActivationEvents: {
        value: function () {
            this.super();
            this._pressComposer.addEventListener("press", this, false);
        }
    },

    _pressComposer: {
        value: null
    },

    target: {
        value: null
    },

    action: {
        value: "activate"
    },

    handlePress: {
        value: function (event) {
            this.super(event);
            if(this.target && typeof this.target[this.action] == "function") {
                this.target[this.action]({ from: this });
            }
        }
    },
});
