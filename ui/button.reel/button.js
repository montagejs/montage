/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
 /*global require, exports*/

/**
    @module "montage/ui/button.reel"
    @requires montage/core/core
    @requires montage/ui/component
    @requires montage/ui/native-control
    @requires montage/ui/composer/press-composer
*/
var Montage = require("montage").Montage,
    Component = require("ui/component").Component,
    NativeControl = require("ui/native-control").NativeControl,
    PressComposer = require("ui/composer/press-composer").PressComposer;

/**
    Wraps a native <code>&lt;button></code> or <code>&lt;input[type="button"]></code> HTML element. The element's standard attributes are exposed as bindable properties.
    @class module:"montage/ui/button.reel".Button
    @extends module:montage/native-control.NativeControl
    @example
<caption>JavaScript example</caption>


var b1 = Button.create();
b1.element = document.querySelector("btnElement");
b1.addEventListener("action", this);
    @example
<caption>Serialized example</caption>
{
    "aButton": {
        "prototype": "montage/ui/button.reel",
        "properties": {
            "element": {"#": "btnElement"}
        }
    }
}
&lt;button data-montage-id="btnElement"></button>
*/
var Button = exports.Button = Montage.create(NativeControl, /** @lends module:"montage/ui/button.reel".Button# */ {

    _preventFocus: {
        enumerable: false,
        value: false
    },

/**
    Specifies whether the button should receive focus or not.
    @type {boolean}
    @default false
*/
    preventFocus: {
        get: function () {
            return this._preventFocus;
        },
        set: function (value) {
            if (value === true) {
                this._preventFocus = true;
            } else {
                this._preventFocus = false;
            }
        }
    },


/**
    Enables or disables the Button from user input. When this property is set to <code>false</code>, the "disabled" CSS style is applied to the button's DOM element during the next draw cycle. When set to <code>true</code> the "disabled" CSS class is removed from the element's class list.
*/
    //TODO we should prefer positive properties like enabled vs disabled, get rid of disabled
    enabled: {
        dependencies: ["disabled"],
        get: function () {
            return !this._disabled;
        },
        set: function (value) {
            this.disabled = !value;
        }
    },

    /**
        A Montage converter object used to convert or format the label displayed by the Button instance. When a new value is assigned to <code>label</code>, the converter object's <code>convert()</code> method is invoked.
        @type {Property}
        @default null
    */
    converter: {
        value: null
    },

    /**
      Stores the node that contains this button's value. Only used for
      non-`<input>` elements.
      @private
    */
    _labelNode: {value:undefined, enumerable: false},

    _label: { value: undefined, enumerable: false },

    /**
        The label for the button. In an &lt;input> element this is taken from the element's <code>value</code> attribute. On any other element (including &lt;button>) this is the first child node which is a text node. If one isn't found then it will be created.

        If the button has a non-null <code>converter</code> property, the converter object's <code>convert()</code> method is called on the value before being assigned to the button instance.

        @type {string}
        @default undefined
    */
    label: {
        get: function() {
            return this._label;
        },
        set: function(value) {
            if (value && value.length > 0 && this.converter) {
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

            this._label = value;
            if (this._isInputElement) {
                this._value = value;
            }

            this.needsDraw = true;
        }
    },

    /**
        The amount of time in milliseconds the user must press and hold the button a <code>hold</code> event is dispatched. The default is 1 second.
        @type {number}
        @default 1000
    */
    holdTimeout: {
        get: function() {
            return this._pressComposer.longpressTimeout;
        },
        set: function(value) {
            this._pressComposer.longpressTimeout = value;
        }
    },

    _pressComposer: {
        enumberable: false,
        value: null
    },

    _active: {
        enumerable: false,
        value: false
    },

    /**
        True when the button is being interacted with, either through mouse click or touch event.
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

    didCreate: {
        value: function() {
            this._pressComposer = PressComposer.create();
            this.addComposer(this._pressComposer);
        }
    },

    prepareForActivationEvents: {
        value: function() {
            this._pressComposer.addEventListener("pressstart", this, false);
            this._pressComposer.addEventListener("press", this, false);
            this._pressComposer.addEventListener("presscancel", this, false);
        }
    },

    // Optimisation
    addEventListener: {
        value: function(type, listener, useCapture) {
            NativeControl.addEventListener.call(this, type, listener, useCapture);
            if (type === "hold") {
                this._pressComposer.addEventListener("longpress", this, false);
            }
        }
    },

    // Handlers

    /**
    Called when the user starts interacting with the component.
    */
    handlePressstart: {
        value: function(event) {
            this.active = true;

            event.preventDefault();

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
        }
    },

    handleKeyup: {
        value: function(event) {
            console.log(event.keyCode);
            // action event on spacebar
            if (event.keyCode === 32) {
                this.active = false;
                this._dispatchActionEvent();
            }
        }
    },

    handleLongpress: {
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
    */
    handlePresscancel: {
        value: function(event) {
            this.active = false;
        }
    },

    /**
    If this is an input element then the label is handled differently.
    @private
    */
    _isInputElement: {
        value: false,
        enumerable: false
    },

    didSetElement: {
        value: function() {
            NativeControl.didSetElement.call(this);

            this._element.classList.add("montage-button");
            this._element.setAttribute("aria-role", "button");

            this._isInputElement = (this._element.tagName === "INPUT");
            // Only take the value from the element if it hasn't been set
            // elsewhere (i.e. in the serialization)
            if (this._isInputElement) {
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
                    this._label = this._element.value;
                }
            } else {
                if (!this._element.firstChild) {
                    this._element.appendChild(document.createTextNode(""));
                }
                this._labelNode = this._element.firstChild;
                if (this._label === undefined) {
                    this._label = this._labelNode.data;
                }
            }

            this._element.addEventListener("keyup", this, false);

            this.needsDraw = true;
        }
    },


    /**
    Draws the label to the DOM.
    @function
    */
    _drawLabel: {
        enumerable: false,
        value: function(value) {
            if (this._isInputElement) {
                this._element.setAttribute("value", value);
            } else {
                this._labelNode.data = value;
            }
        }
    },

    draw: {
        value: function() {
            // Call super method
            Object.getPrototypeOf(Button).draw.call(this);

            if (this._disabled) {
                this._element.classList.add("disabled");
            } else {
                this._element.classList.remove("disabled");
            }

            this._drawLabel(this.label);
        }
    }
});

// TODO: Display events in JSDoc output
 /**
 @event
 @name action
 @param {Event} event

 Dispatched when the button is activated through a mouse click, finger tap,
 or when focused and the spacebar is pressed.
 */

 /**
 @event
 @name hold
 @param {Event} event

 Dispatched when the button is pressed for a period of time, set by
 {@link holdTimeout}.
 */

Button.addAttributes({
    autofocus: {value: false, dataType: 'boolean'},
    disabled: {value: false, dataType: 'boolean'},
    form: null,
    formaction: null,
    formenctype: null,
    formmethod: null,
    formnovalidate: null,
    formtarget: null,
    type: {value: 'button'},
    name: null,
    value: null
});
