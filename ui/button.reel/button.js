/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
var Montage = require("montage").Montage,
    Component = require("ui/component").Component,
    NativeControl = require("ui/native-control").NativeControl;
/**
 * The Text input
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

    // Low-level event listeners

    /**
    Description TODO
    @function
    @param {Event} event The handleMousedown event
    */
    handleMousedown: {
        value: function(event) {
            if (this._observedPointer !== null) {
                return;
            }
            if (!this._disabled) {
                this._startInteraction(event);
            }

            event.preventDefault();

            if (!this._preventFocus) {
                this._element.focus();
            }
        }
    },

    /**
    Description TODO
    @function
    @param {Event} event The handleTouchstart event
    */
    handleTouchstart: {
        value: function(event) {
            if (this._observedPointer !== null) {
                return;
            }
            if (!this._disabled) {
                this._startInteraction(event);
            }

            // NOTE preventingDefault disables the magnifying class
            // sadly it also disables double tapping on the button to zoom...
            event.preventDefault();

            if (!this._preventFocus) {
                this._element.focus();
            }
        }
    },

    // Internal state management

    /**
    Stores the pointer that pressed down the button. Needed for multitouch.
    @private
    */
    _observedPointer: {
        enumerable: true,
        value: null
    },

    /**
    Called when the user starts interacting with the component. Adds release
    (touch and mouse) listeners.
    @private
    */
    _startInteraction: {
        value: function(event) {
            Object.getPrototypeOf(Button)._startInteraction.call(this, event);
            this.active = true;
        }
    },

    /**
    Called when the user has interacted with the button. Decides whether to
    dispatch an action event.
    @private
    */
    _interpretInteraction: {
        value: function(event) {
            var isTarget = Object.getPrototypeOf(Button)._interpretInteraction.call(this, event, false);
            if (isTarget) {
                if (
                    this.active &&
                    (event.type === "mouseup" || event.type === "touchend") &&
                    this.eventManager.isPointerClaimedByComponent(this._observedPointer, this)
                ) {
                    this._dispatchActionEvent();
                }

                // Don't end interaction when mouseup on element as we need to
                // prevent default on the click event if we've lost the pointer,
                // which comes after mouseup
                if (event.type !== "mouseup") {
                    this._endInteraction(event);
                }
            } else {
                this._endInteraction(event);
            }

            return isTarget;
        },
        enumerable: false
    },
    /**
    Called when all interaction is over. Removes listeners.
    @private
    */
    _endInteraction: {
        value: function(event) {
            Object.getPrototypeOf(Button)._endInteraction.call(this, event);
            this.active = false;
        }
    },

    /**
    If we have to surrender the pointer we are no longer active. This will
    stop the action event being dispatched.
    */
    surrenderPointer: {
        value: function(pointer, component) {
            this.active = false;
            return true;
        }
    },

    /**
    Description TODO
    @private
    */
    _isInputElement: {value: false},

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
