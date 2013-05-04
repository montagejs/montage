/*global require, exports, document, Error*/
var Montage = require("montage").Montage,
    Component = require("ui/component").Component,
    KeyComposer = require("composer/key-composer").KeyComposer,
    Dict = require("collections/dict");

var CLASS_PREFIX = "montage-TextField";

/**
 * @class AbstractTextField
 * @extends Component
 */
var AbstractTextField = exports.AbstractTextField = Montage.create(Component,
    /* @lends AbstractTextField# */
{
    /**
     * Dispatched when the textfield is activated through a enter.
     * @event action
     * @memberof AbstractTextField
     * @param {Event} event
     */

    create: {
        value: function() {
            if(this === AbstractTextField) {
                throw new Error("AbstractTextField cannot be instantiated.");
            } else {
                return Component.create.apply(this, arguments);
            }
        }
    },

    didCreate: {
        value: function() {
            Component.didCreate.call(this); // super

            this._keyComposer = KeyComposer.create();
            this._keyComposer.component = this;
            this._keyComposer.keys = "enter";
            this.addComposer(this._keyComposer);

            this.defineBindings({
                // classList management
                "classList.has('montage--disabled')": {
                    "<-": "!enabled"
                }
            });
        }
    },

    hasTemplate: {
        value: false
    },

    acceptsActiveTarget: {
        value: true
    },

    enabled: {
        value: true
    },

    _placeholderValue: {
        value: null
    },

    placeholderValue: {
        set: function(value) {
            this._placeholderValue = value;
            this.needsDraw = true;
        },
        get: function() {
            return this._placeholderValue;
        }
    },

    _value: {
        value: null
    },

    value: {
        set: function(value) {
            this._value = value;
            this.needsDraw = true;
        },
        get: function() {
            return this._value;
        }
    },

    _keyComposer: {
        value: null
    },

    handleKeyPress: {
        value: function(/*event*/) {
            if (!this.enabled) {
                return;
            }

            this._dispatchActionEvent();
        }
    },

    prepareForActivationEvents: {
        value: function() {
            // Due to a current issue with how the key manager works we need
            // to listen on both the component and the key composer.
            // The key composer dispatches the event on the activeTarget
            // (the component), and we need to listen on the key composer so
            // that the listeners are installed.
            this.addEventListener("keyPress", this, false);
            this._keyComposer.addEventListener("keyPress", null, false);
        }
    },

    /**
     * The data property of the action event.
     * example to toggle the complete class: "detail.get('selectedItem')" : { "<-" : "@repetition.objectAtCurrentIteration"}
     * @type {Dict}
     * @default null
     */
    detail: {
        get: function() {
            if (this._detail == null) {
                this._detail = new Dict();
            }
            return this._detail;
        }
    },

    createActionEvent: {
        value: function() {
            var actionEvent = document.createEvent("CustomEvent"),
                eventDetail;

            eventDetail = this._detail;
            actionEvent.initCustomEvent("action", true, true, eventDetail);
            return actionEvent;
        }
    },

    enterDocument: {
        value: function(firstTime) {
            if (firstTime) {
                this.element.addEventListener("input", this, false);
                this.element.addEventListener("change", this, false);
            }
        }
    },

    draw: {
        value: function() {
            this.element.value = this.value;
            this.element.setAttribute("placeholder", this._placeholderValue);
        }
    },

    handleChange: {
        value: function() {
            this._updateValueFromDom();
        }
    },

    handleInput: {
        value: function(event) {
            this._updateValueFromDom();
        }
    },

    _updateValueFromDom: {
        value: function() {
            if (this._value !== this.element.value) {
                this._value = this.element.value;
                this.dispatchOwnPropertyChange("value", this._value);
            }
        }
    }
});
