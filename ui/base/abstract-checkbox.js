/*global require, exports, document, Error*/
var Montage = require("montage").Montage,
    Component = require("ui/component").Component,
    PressComposer = require("composer/press-composer").PressComposer,
    Dict = require("collections/dict");

var CLASS_PREFIX = "montage-Checkbox";

/**
 * @class AbstractCheckbox
 * @extends Component
 */
var AbstractCheckbox = exports.AbstractCheckbox = Montage.create(Component,
    /* @lends AbstractCheckbox# */
    {
        create: {
            value: function() {
                if(this === AbstractCheckbox) {
                    throw new Error("AbstractCheckbox cannot be instantiated.");
                } else {
                    return Component.create.apply(this, arguments);
                }
            }
        },

        didCreate: {
            value: function() {
                Component.didCreate.call(this); // super
                this._pressComposer = PressComposer.create();
                this.addComposer(this._pressComposer);

                this.defineBindings({
                    // classList management
                    "classList.has('montage--disabled')": {
                        "<-": "!enabled"
                    },
                    "classList.has('montage--active')": {
                        "<-": "active"
                    },
                    "classList.has('montage-Checkbox--checked')": {
                        "<-": "checked"
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

        _checked: {
            value: null
        },

        checked: {
            set: function(value) {
                this._checked = value;
            },
            get: function() {
                return this._checked;
            }
        },

        enabled: {
            value: true
        },

        _pressComposer: {
            value: null
        },

        handlePressStart: {
            value: function(event) {
                this.active = true;

                if (event.touch) {
                    // Prevent default on touchmove so that if we are inside a scroller,
                    // it scrolls and not the webpage
                    document.addEventListener("touchmove", this, false);
                }
            }
        },

        /**
         Handle press event from press composer
         */
        handlePress: {
            value: function(/* event */) {
                this.active = false;

                if (!this.enabled) {
                    return;
                }

                this._dispatchActionEvent();
                this.checked = !this.checked;
            }
        },

        /**
         Called when all interaction is over.
         @private
         */
        handlePressCancel: {
            value: function(/* event */) {
                this.active = false;
                document.removeEventListener("touchmove", this, false);
            }
        },

        prepareForActivationEvents: {
            value: function() {
                this._pressComposer.addEventListener("pressStart", this, false);
                this._pressComposer.addEventListener("press", this, false);
                this._pressComposer.addEventListener("pressCancel", this, false);
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
        }
    });
