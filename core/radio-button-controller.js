
var Montage = require("./core").Montage,
    RangeController = require("./range-controller").RangeController;

/**
 * The radio button controller intermediates between a set of options and their
 * visual representation as radio buttons. The controller maintains the
 * invariant that only one radio button at a time may be selected and provides
 * a value property with the currently-selected option.
 *
 * @class RadioButtonController
 * @classdesc Manages the selection of mutually-exclusive [RadioButton]{@link
 * AbstractRadioButton}s.
 * @extends Montage
 */
exports.RadioButtonController = Montage.specialize(/** @lends RadioButtonController# */ {

    _radioButtons: {
        value: null
    },

    _content: {
        value: null
    },

    /**
     * The list of possible options.
     * @type Array.<Object>
     */
    content: {
        get: function () {
            return this.getPath("contentController.content");
        },
        set: function (content) {
            this.contentController = new RangeController()
                .initWithContent(content);
        }
    },

    contentController: {
        value: null
    },

    /**
     * The radio button component corresponding to the currently-selected option.
     * @type {?Component}
     */
    selectedRadioButton: {
        value: null
    },

    _value: {
        value: null
    },

    /**
     * The currently-selected option.
    */
    value: {
        set: function (value) {
            if (this._value !== value) {
                this._value = value;
                this._updateRadioButtons();
            }
        },
        get: function () {
            return this._value;
        }
    },

    constructor: {
        value: function RadioButtonController() {
            this._radioButtons = [];

            this.addRangeAtPathChangeListener("_radioButtons.map{checked}", this, "handleRadioButtonChange");
            this.defineBinding("value ", {
                "<->": "contentController.selection.0"
            });
        }
    },

    _updateRadioButtons: {
        value: function () {
            var value = this._value;

            for (var i = 0, ii = this._radioButtons.length; i < ii; i++) {
                if (value === this._radioButtons[i].value) {
                    this._radioButtons[i].checked = true;
                    break;
                }
            }
        }
    },

    /**
     * Add a radio button to be managed by this controller.
     * @function
     * @param {RadioButton} radioButton
     * @returns {undefined}
     */
    registerRadioButton: {
        value: function (radioButton) {
            if (this._radioButtons.indexOf(radioButton) === -1) {
                this._radioButtons.push(radioButton);
                this._updateRadioButtons();
            }
        }
    },

    /**
     * Remove a radio button from being managed by this controller.
     * @function
     * @param {RadioButton} radioButton
     * @returns {undefined}
     */
    unregisterRadioButton: {
        value: function (radioButton) {
            var ix = this._radioButtons.indexOf(radioButton);
            if (ix >= 0) {
                this._radioButtons.splice(ix, 1);
                if (radioButton === this.selectedRadioButton) {
                    this.selectedRadioButton = null;
                }
            }
        }
    },

    handleRadioButtonChange: {
        value: function (plus, minus, index) {
            if (plus[0] === true) {
                for (var i = 0, ii = this._radioButtons.length; i < ii; i++) {
                    if (i === index) {
                        this.selectedRadioButton = this._radioButtons[i];
                        this.value = this.selectedRadioButton.value;
                    } else {
                        this._radioButtons[i].checked = false;
                    }
                }
            }
        }
    }

}, /** @lends RadioButtonController. */ {

    blueprintModuleId:require("./core")._blueprintModuleIdDescriptor,

    blueprint:require("./core")._blueprintDescriptor

});

