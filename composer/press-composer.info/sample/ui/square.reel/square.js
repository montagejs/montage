/**
 * @module ui/square.reel
 */
var Component = require("montage/ui/component").Component,
    PressComposer = require("montage/composer/press-composer").PressComposer;

/**
 * @class Square
 * @extends Component
 */
var Square = exports.Square = Component.specialize(/** @lends Square# */ {

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

    _state: {
        value: null
    },

    state: {
        get: function () {
            return this._state;
        },
        set: function (state) {
            if (state !== this._state) {
                if (typeof state === "string" && state !== Square.PRESS_START_STATE) {
                    this._scheduleReset();
                }

                this._state = state;

                this.needsDraw = true;
            }
        }
    },

    resetTimeout: {
        value: 200 // ms
    },

    _resetTimeoutID: {
        value: null
    },

    //lazy function
    _handleReset: {
        value: null
    },

    enterDocument: {
        value: function () {
            this._startListenToPressStartIfNeeded();
        }
    },

    exitDocument: {
        value: function () {
            this._stopListenToPressStartIfNeeded();
        }
    },

    prepareForActivationEvents: {
        value: function () {
            this._startListenToPressStartIfNeeded(true);
        }
    },

    handlePressStart: {
        value: function (event) {
            this.state = Square.PRESS_START_STATE;
            this._logEvent(event);

            this._addEventListeners();
        }
    },

    handlePressCancel: {
        value: function (event) {
            this.state = Square.PRESS_CANCEL_STATE;
            this._logEvent(event);

            this._removeEventListeners();
        }
    },

    handlePress: {
        value: function (event) {
            this.state = Square.PRESS_STATE;
            this._logEvent(event);

            this._removeEventListeners();
        }
    },

    _startListenToPressStartIfNeeded: {
        value: function (force) {
            if (force || this.preparedForActivationEvents) {
                this._pressComposer.addEventListener("pressStart", this, false);
            }
        }
    },

    _stopListenToPressStartIfNeeded: {
        value: function () {
            if (this.preparedForActivationEvents) {
                this._pressComposer.removeEventListener("pressStart", this, false);
            }
        }
    },

    _addEventListeners: {
        value: function () {
            this._pressComposer.addEventListener("press", this, false);
            this._pressComposer.addEventListener("pressCancel", this, false);
        }
    },

    _removeEventListeners: {
        value: function () {
            this._pressComposer.removeEventListener("press", this, false);
            this._pressComposer.removeEventListener("pressCancel", this, false);
        }
    },

    _scheduleReset: {
        value: function () {
            if (this._resetTimeoutID) {
                clearTimeout(this._resetTimeoutID);
                this._resetTimeoutID = null;
            }

            if (!this._handleReset) {
                var handleReset = function () {
                    if (this.state !== Square.PRESS_START_STATE) {
                        this.state = null;
                        this._logEvent();
                    }
                };

                this._handleReset = handleReset.bind(this);
            }

            this._resetTimeoutID = setTimeout(this._handleReset, this.resetTimeout)
        }
    },

    _logEvent: {
        value: function (event) {
            console.log(this.identifier, event ? event.type : "reset");
        }
    },

    draw: {
        value: function () {
            if (this.state === Square.PRESS_START_STATE) {
                this.classList.remove(Square.PRESS_CANCEL_STATE);
                this.classList.remove(Square.PRESS_STATE);
                this.classList.add(Square.PRESS_START_STATE);

            } else if (this.state === Square.PRESS_CANCEL_STATE) {
                this.classList.remove(Square.PRESS_START_STATE);
                this.classList.remove(Square.PRESS_STATE);
                this.classList.add(Square.PRESS_CANCEL_STATE);

            } else if (this.state === Square.PRESS_STATE) {
                this.classList.remove(Square.PRESS_CANCEL_STATE);
                this.classList.remove(Square.PRESS_START_STATE);
                this.classList.add(Square.PRESS_STATE);

            } else {
                this.classList.remove(Square.PRESS_START_STATE);
                this.classList.remove(Square.PRESS_STATE);
                this.classList.remove(Square.PRESS_CANCEL_STATE);
            }
        }
    }

}, {

    PRESS_START_STATE: {
        value: "active"
    },

    PRESS_CANCEL_STATE: {
        value: "canceled"
    },

    PRESS_STATE: {
        value: "pressed"
    }

});
