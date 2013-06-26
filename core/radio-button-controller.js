var Montage = require("montage").Montage,
    RangeController = require("core/range-controller").RangeController;

exports.RadioButtonController = Montage.specialize( {

    _radioButtons: {
        value: null
    },

    _content: {
        value: null
    },

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

    selectedRadioButton: {
        value: null
    },

    _value: {
        value: null
    },

    value: {
        set: function(value) {
            if (this._value !== value) {
                this._value = value;
                this._updateRadioButtons();
            }
        },
        get: function() {
            return this._value;
        }
    },

    /**
     * @private
     */
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
        value: function() {
            var value = this._value;

            for (var i = 0, ii = this._radioButtons.length; i < ii; i++) {
                if (value === this._radioButtons[i].value) {
                    this._radioButtons[i].checked = true;
                    break;
                }
            }
        }
    },

    registerRadioButton: {
        value: function(radioButton) {
            if (this._radioButtons.indexOf(radioButton) === -1) {
                this._radioButtons.push(radioButton);
                this._updateRadioButtons();
            }
        }
    },

    unregisterRadioButton: {
        value: function(radioButton) {
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
        value: function(plus, minus, index) {
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
});
