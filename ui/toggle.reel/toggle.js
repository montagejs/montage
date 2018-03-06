var Component = require("../component").Component,
    PressComposer = require("../../composer/press-composer").PressComposer;

/**
 * @class Toggle
 * @extends Component
 */
var Toggle = exports.Toggle = Component.specialize({

    checked: {
        value: false
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
        value: function () {
            this._startListeningToPressIfNeeded();
        }
    },

    prepareForActivationEvents: {
        value: function () {
            this._startListeningToPress();
        }
    },

    exitDocument: {
        value: function () {
            this._startListeningToPressIfNeeded();
        }
    },

    _startListeningToPressIfNeeded: {
        value: function () {
            if (this.preparedForActivationEvents) {
                this._startListeningToPress();
            }
        }
    },

    _startListeningToPress: {
        value: function () {
            this._pressComposer.addEventListener('press', this);
        }
    },

    _stopListeningToPress: {
        value: function () {
            if (this.preparedForActivationEvents) {
                this._pressComposer.removeEventListener('press', this);
            }
        }
    },

    handlePress: {
        value: function () {
            this.checked = !this.checked;
            this.dispatchActionEvent(this.checked);
        }
    }


});
