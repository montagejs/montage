/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
 /*global require, exports*/
var Montage = require("montage").Montage,
    Component = require("ui/component").Component,
    NativeControl = require("ui/native-control").NativeControl,
    PressComposer = require("ui/composer/press-composer").PressComposer;
/**
 * The Button input
 */
var Button = exports.Button = Montage.create(NativeControl, {

/**
  Description TODO
  @private
*/
    _preventFocus: {
        enumerable: false,
        value: false
    },

/**
        Description TODO
        @type {Function}
        @default {Boolean} false
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
        The Montage converted used to convert or format values displayed by this Button instance.
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
        The label for the button.

        In an `<input>` element this is the value property. On any other element
        (including `<button>`) this is the first child node which is a text node.
        If one isn't found it will be created.

        @type {Property}
        @default {String} element value
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
    True when the button is being interacted with, either through mouse click or
    touch event.
    @private
    */
    _active: {
        enumerable: false,
        value: false
    },

    /**
    Description TODO
    @type {Function}
    @default {Boolean} false
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
            var pressComposer = PressComposer.create();
            this.addComposer(pressComposer);
            pressComposer.addEventListener("pressstart", this, false);
            pressComposer.addEventListener("press", this, false);
            pressComposer.addEventListener("presscancel", this, false);
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
            var o = NativeControl.didSetElement.call(this);

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
