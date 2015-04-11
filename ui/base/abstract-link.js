/*global require, exports, document, Error*/

var AbstractControl = require("./abstract-control").AbstractControl,
    PressComposer = require("../../composer/press-composer").PressComposer;

var CLASS_PREFIX = "montage-Link";

/**
 * @class AbstractLink
 * @extends AbstractControl
 */
var AbstractLink = exports.AbstractLink = AbstractControl.specialize(
/** @lends AbstractLink# */
{

    /**
     * Dispatched when the link is activated through a mouse click,
     * finger tap.
     * @event action
     * @memberof AbstractLink
     * @param {Event} event
     */

    constructor: {
        value: function AbstractLink() {
            if(this.constructor ===  AbstractLink) {
                throw new Error("AbstractLink cannot be instantiated.");
            }
            AbstractControl.constructor.call(this); // super
            this._pressComposer = new PressComposer();
            this.addComposer(this._pressComposer);

            this.defineBindings({
                // classList management
                "classList.has('montage--disabled')": {
                    "<-": "!enabled"
                },
                "classList.has('montage--active')": {
                    "<-": "active"
                }
            });
        }
    },

    hasTemplate: {
        value: false
    },

    active: {
        value: false
    },

    enabled: {
        value: true
    },

    _pressComposer: {
        value: null
    },

    _url: {
        value: null
    },

    url: {
        set: function (value) {
            this._url = value;
            this.needsDraw = true;
        },
        get: function () {
            return this._url;
        }
    },

    _label: {
        value: null
    },

    label: {
        set: function (value) {
            this._label = value;
            this.needsDraw = true;
        },
        get: function () {
            return this._label;
        }
    },

    _textAlternative: {
        value: null
    },

    textAlternative: {
        set: function (value) {
            this._textAlternative = value;
            this.needsDraw = true;
        },
        get: function () {
            return this._textAlternative;
        }
    },

    _opensNewWindow: {
        value: null
    },

    opensNewWindow: {
        set: function (value) {
            this._opensNewWindow = value;
            this.needsDraw = true;
        },
        get: function () {
            return this._opensNewWindow;
        }
    },

    enterDocument: {
        value: function (firstTime) {
            if (firstTime) {
                if (!this.hasOwnProperty("_label")) {
                    this.label = this.element.textContent;
                }
            }
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
     * Handles press event from press composer.
     * @private
     */
    handlePress: {
        value: function (/* event */) {
            this.active = false;

            if (!this.enabled) {
                return;
            }

            this.dispatchActionEvent();
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

    prepareForActivationEvents: {
        value: function () {
            this._pressComposer.addEventListener("pressStart", this, false);
            this._pressComposer.addEventListener("press", this, false);
            this._pressComposer.addEventListener("pressCancel", this, false);
        }
    }

});

