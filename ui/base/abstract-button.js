 /*global require, exports*/

/**
    @module montage/ui/base/abstract-button.reel
    @requires montage/core/core
    @requires montage/ui/component
    @requires montage/ui/native-control
    @requires montage/composer/press-composer
*/
var Montage = require("montage").Montage,
    Component = require("ui/component").Component,
    PressComposer = require("composer/press-composer").PressComposer,
    Dict = require("collections/dict");

/**
 * @class AbstractButton
 * @extends Component
 * @fires action
 * @fires hold
 */
var AbstractButton = exports.AbstractButton = Montage.create(Component, /** @lends AbstractButton# */ {

    /**
     * Dispatched when the button is activated through a mouse click, finger tap,
     * or when focused and the spacebar is pressed.
     * @event action
     * @memberof AbstractButton
     * @param {Event} event
     */

    /**
     * Dispatched when the button is pressed for a period of time, set by
     * {@link holdThreshold}.
     * @event hold
     * @memberof AbstractButton
     * @param {Event} event
     */

    /**
     * @private
     */
    create: {
        value: function() {
            if(this === AbstractButton) {
                throw new Error("AbstractButton cannot be instantiated.");
            } else {
                return Component.create.apply(this, arguments);
            }
        }
    },


    /**
     * @private
     */
    didCreate: {
        value: function() {
            Component.didCreate.call(this); // super
            this._pressComposer = PressComposer.create();
            this.addComposer(this._pressComposer);
            this._pressComposer.defineBinding("longPressThreshold ", {"<-": "holdThreshold", source: this});

            this.defineBinding("enabled ", {"<->": "!disabled", source: this});

            this.addOwnPropertyChangeListener("converter", this);

            //classList management
            this.defineBinding("classList.has('montage--disabled')", {"<-": "disabled", source: this});
            this.defineBinding("classList.has('montage--active')", {"<-": "active", source: this});

        }
    },

    /**
     * Enables or disables the Button from user input. When this property is set to ```false```,
     * the "disabled" CSS style is applied to the button's DOM element during the next draw cycle. When set to
     * ```true``` the "disabled" CSS class is removed from the element's class list.
     * @type {boolean}
     */
    enabled: {
        value: true
    },


    _disabled: {
        value: false
    },

    disabled: {
        get: function () {
            return this._disabled;
        },
        set: function (value) {
            this._disabled = value;
            this.needsDraw = true;
        }
    },

    _preventFocus: {
        value: false
    },

    /**
     * Specifies whether the button should receive focus or not.
     * @type {boolean}
     * @default false
     * @event longpress
     */
    preventFocus: {
        get: function () {
            return this._preventFocus;
        },
        set: function (value) {
            this._preventFocus = !!value;
            this.needsDraw = true;
        }
    },

    acceptsActiveTarget: {
        value: function() {
            return ! this._preventFocus;
        }
    },

    willBecomeActiveTarget: {
        value: function(previousActiveTarget) {

        }
    },


    /**
     * A Montage converter object used to convert or format the label displayed by the Button instance. When a new value is assigned to ```label```, the converter object's ```convert()``` method is invoked, passing it the newly assigned label value.
     * @type {Converter}
     * @default null
     */
    converter: {
        value: null
    },
    
    handleConverterChange: {
        value: function() {
            this.label = this.label;
        }
    },

    /**
      Stores the node that contains this button's value. Only used for
      non-`<input>` elements.
      @private
    */
    _labelNode: {value:undefined, enumerable: false},

    _label: { value: undefined, enumerable: false },

    /**
        The displayed text on the button. In an &lt;input> element this is taken from the element's ```value``` attribute. On any other element (including &lt;button>) this is the first child node which is a text node. If one isn't found then it will be created.

        If the button has a non-null ```converter``` property, the converter object's ```convert()``` method is called on the value before being assigned to the button instance.

        @type {string}
        @default undefined
    */
    label: {
        get: function() {
            return this._label;
        },
        set: function(value) {
            if (typeof value !== "undefined" && this.converter) {
                try {
                    value = this.converter.convert(value);
                    if (this.error) {
                        this.error = null;
                    }
                } catch(e) {
                    // unable to convert - maybe error
                    this.error = e;
                }
            }

            this._label = "" + value;
            if (this.isInputElement) {
                this.value = this._label;
            }

            this.needsDraw = true;
        }
    },

    _setLabelInitialValue: {
        value: function(value) {
            if (this._label === undefined) {
                this._label = value;
            }
        }
    },

    /**
        The amount of time in milliseconds the user must press and hold the button a ```hold``` event is dispatched. The default is 1 second.
        @type {number}
        @default 1000
    */
    holdThreshold: {
        value: 1000
    },

    _pressComposer: {
        value: null
    },

    _active: {
        value: false
    },

    /**
        This property is true when the button is being interacted with, either through mouse click or touch event, otherwise false.
        @type {boolean}
        @default false
    */
    active: {
        get: function() {
            return this._active;
        },
        set: function(value) {
            this._active = value;
            this.needsDraw = true;
        }
    },

    prepareForActivationEvents: {
        value: function() {
            this._pressComposer.addEventListener("pressStart", this, false);
            this._pressComposer.addEventListener("press", this, false);
            this._pressComposer.addEventListener("pressCancel", this, false);
        }
    },

    // Optimisation
    addEventListener: {
        value: function(type, listener, useCapture) {
            Component.addEventListener.call(this, type, listener, useCapture);
            if (type === "hold") {
                this._pressComposer.addEventListener("longPress", this, false);
            }
        }
    },

    // Handlers

    /**
    Called when the user starts interacting with the component.
    */
    handlePressStart: {
        value: function(event) {
            this.active = true;

            if (event.touch) {
                // Prevent default on touchmove so that if we are inside a scroller,
                // it scrolls and not the webpage
                document.addEventListener("touchmove", this, false);
            }

            if (!this._preventFocus) {
                this._element.focus();
            }
        }
    },

    /**
    Called when the user has interacted with the button.
    */
    handlePress: {
        value: function(event) {
            this.active = false;
            this._dispatchActionEvent();
            document.removeEventListener("touchmove", this, false);
        }
    },

    handleKeyup: {
        value: function(event) {
            // action event on spacebar
            if (event.keyCode === 32) {
                this.active = false;
                this._dispatchActionEvent();
            }
        }
    },

    handleLongPress: {
        value: function(event) {
            // When we fire the "hold" event we don't want to fire the
            // "action" event as well.
            this._pressComposer.cancelPress();

            var holdEvent = document.createEvent("CustomEvent");
            holdEvent.initCustomEvent("hold", true, true, null);
            this.dispatchEvent(holdEvent);
        }
    },

    /**
    Called when all interaction is over.
    @private
    */
    handlePressCancel: {
        value: function(event) {
            this.active = false;
            document.removeEventListener("touchmove", this, false);
        }
    },

    handleTouchmove: {
        value: function(event) {
            event.preventDefault();
        }
    },

    /**
    If this is an input element then the label is handled differently.
    @private
    */
    isInputElement: {
        value: false
    },

    enterDocument: {
        value: function(firstDraw) {
            if(firstDraw) {
                this.isInputElement = (this.originalElement.tagName === "INPUT");
                // Only take the value from the element if it hasn't been set
                // elsewhere (i.e. in the serialization)
                if (this.isInputElement) {
                    // NOTE: This might not be the best way to do this
                    // With an input element value and label are one and the same
                    Object.defineProperty(this, "value", {
                        get: function() {
                            return this._label;
                        },
                        set: function(value) {
                            this.label = value;
                        }
                    });

                    if (this._label === undefined) {
                        this._label = this.originalElement.value;
                    }
                } else {
                    if (!this.originalElement.firstChild) {
                        this.originalElement.appendChild(document.createTextNode(""));
                    }
                    this._labelNode = this.originalElement.firstChild;
                    this._setLabelInitialValue(this._labelNode.data)
                    if (this._label === undefined) {
                        this._label = this._labelNode.data;
                    }
                }

                //this.classList.add("montage-Button");
                this.element.setAttribute("role", "button");
                this.element.addEventListener("keyup", this, false);
            }
        }
    },

    /**
    Draws the label to the DOM.
    @function
    @private
    */
    _drawLabel: {
        enumerable: false,
        value: function(value) {
            if (this.isInputElement) {
                this._element.setAttribute("value", value);
            } else if (this._labelNode) {
                this._labelNode.data = value;
            }
        }
    },

    draw: {
        value: function() {
            if (this._elementNeedsTabIndex()) {
                if (this._preventFocus) {
                    this.element.removeAttribute("tabindex");
                } else {
                    this.element.setAttribute("tabindex", "-1");
                }

            }

            this._drawLabel(this.label);
        }
    },

    _elementNeedsTabIndexRegex: {
        value: /INPUT|TEXTAREA|A|SELECT|BUTTON|LABEL/
    },
    _elementNeedsTabIndex: {
        value: function() {
            return this.element.tagName.match(this._elementNeedsTabIndexRegex) === null;
        }
    },


    _detail: {
        value: null
    },

    /**
     * The data property of the action event.
     * example to toggle the complete class: "detail.selectedItem" : { "<-" : "@repetition.objectAtCurrentIteration"}
     * @type {Dict}
     * @default null
     */
    detail: {
        get: function() {
            if (this._detail === null) {
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
