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

/**
  Description TODO
  @private
*/
// TODO: this does more stuff than the addProperties version
    _disabled: {
        enumerable: false,
        value: false
    },

/**
        Description TODO
        @type {Function}
        @default {Boolean} false
    */
    disabled: {
        get: function () {
            return this._disabled;
        },
        set: function (value) {
            if (value === true) {
                this._disabled = true;
            } else {
                this._disabled = false;
            }
            this.needsDraw = true;
        }
    },

    //TODO we should prefer positive properties like enabled vs disabled, get rid of disabled

    enabled: {
        dependencies: ["disabled"],
        get: function () {
            return !!this._disabled;
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
  Stores the node that contains this button's value.
  For INPUTs this is the value attribute. Fot BUTTONs this is the firstChild (text)
  @private
*/
    _valueNode: {value:undefined, enumerable: false},

/**
        Used when a button is associate with an input tag.<br>
        For buttons, the title comes from it's value attribute.<br>
        activeValue, if set, is used when the button is in active state (mousedown / touchstart).
        @type {String}
        @default undefined
    */
    activeValue: {
        serializable: true,
        value: undefined
    },

 /**
  Description TODO
  @private
*/
    _valueNodeActiveNode: {value:undefined, enumerable: false},


/**
  True when the button is being interacted with, either through mouse click or
  touch event.
  @private
*/
    _active: {
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

/**
  Description TODO
  @private
*/
    _observedPointer: {
        enumerable: true,
        value: null
    },

    // Low-level event listeners
 /**
    Description TODO
    @function
    @param {Event} event The handleMousedown event
    */
    handleMousedown: {
        value: function(event) {
            if (!this._disabled) {
                this._acknowledgeIntent("mouse");
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
    @param {Event} event The handleMouseup event
    */
    handleMouseup: {
        value: function(event) {
            this._interpretInteraction(event);
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
                this._acknowledgeIntent(event.changedTouches[0].identifier);
            }

            // NOTE preventingDefault disables the magnifying class
            // sadly it also disables double tapping on the button to zoom...
            event.preventDefault();

            if (!this._preventFocus) {
                this._element.focus();
            }
        }
    },
/**
    Description TODO
    @function
    @param {Event} event The handleTouchend event
    */
    handleTouchend: {
        value: function(event) {

            var i = 0,
                changedTouchCount = event.changedTouches.length;

            for (; i < changedTouchCount; i++) {
                if (event.changedTouches[i].identifier === this._observedPointer) {
                    this._interpretInteraction(event);
                    return;
                }
            }

        }
    },
/**
    Description TODO
    @function
    @param {Event} event The handleTouchcancel event
    */
    handleTouchcancel: {
        value: function(event) {

            var i = 0,
                changedTouchCount = event.changedTouches.length;

            for (; i < changedTouchCount; i++) {
                if (event.changedTouches[i].identifier === this._observedPointer) {
                    this._releaseInterest();

                    this.active = false;
                    return;
                }
            }

        }
    },
/**
    Description TODO
    @function
    @param {String} pointer TODO
    @param {Component} demandingComponent TODO
    @returns {Boolean} true TODO
    */
    surrenderPointer: {
        value: function(pointer, demandingComponent) {

            this._releaseInterest();

            this.active = false;
            return true;
        }
    },

    // Internal state management
/**
  Description TODO
  @private
*/
    _acknowledgeIntent: {
        value: function(pointer) {

            this._observedPointer = pointer;
            this.eventManager.claimPointer(pointer, this);

            if (window.Touch) {
                document.addEventListener("touchend", this);
                document.addEventListener("touchcancel", this);
            } else {
                document.addEventListener("mouseup", this);
            }

            this.active = true;
        },
        enumerable: false
    },
/**
  Description TODO
  @private
*/
    _interpretInteraction: {
        value: function(event) {

            if (!this.active) {
                return;
            }

            var target = event.target;
            while (target !== this.element && target && target.parentNode) {
                target = target.parentNode;
            }

            if (this.element === target) {
                this._shouldDispatchActionEvent = true;
                this._dispatchActionEvent();
            }

            this._releaseInterest();

            this.active = false;
        },
        enumerable: false
    },
/**
  Description TODO
  @private
*/
    _releaseInterest: {
        value: function() {
            if (window.Touch) {
                document.removeEventListener("touchend", this);
                document.removeEventListener("touchcancel", this);
            } else {
                document.removeEventListener("mouseup", this);
            }

            this.eventManager.forfeitPointer(this._observedPointer, this);
            this._observedPointer = null;
        }
    },

/**
  Description TODO
  @private
*/
    _dispatchActionEvent: {
        value: function() {
            if (typeof this.action === "function") {

                var actionPropertyBinding = this._bindingDescriptors["action"],
                    context = this,
                    boundObjectPropertyPath,
                    functionOwnerPath,
                    lastDotIndex;

                if (actionPropertyBinding) {
                    boundObjectPropertyPath = actionPropertyBinding.boundObjectPropertyPath;
                    lastDotIndex = boundObjectPropertyPath.lastIndexOf(".");

                    if (lastDotIndex >= 0) {
                        functionOwnerPath = boundObjectPropertyPath.substring(0, lastDotIndex);
                        context = actionPropertyBinding.boundObject.getProperty(functionOwnerPath);
                    } else {
                        context = actionPropertyBinding.boundObject;
                    }


                }

                this.action.call(context, this);

            } else {
                var actionEvent = document.createEvent("CustomEvent");
                actionEvent.initCustomEvent("action", true, true, null);
                actionEvent.type = "action";
                this.dispatchEvent(actionEvent);
                this._shouldDispatchActionEvent = false;
            }
        },
        enumerable: false
    },

    action: {
        enumerable: false,
        value: null
    },

/**
  Description TODO
  @private
*/
    _isElementInput: {value: false},
    prepareForDraw: {
        value: function() {

            this._element.tabIndex = 0;

            this._element.classList.add("montage-button");
            this._element.setAttribute("aria-role", "button");

            if (!!(this._isElementInput = (this._element.tagName === "INPUT")) && this.value === undefined) {
                this._valueNode = this._element.getAttributeNode("value");
                this.value = this._element.value;
            }
            else {
                if (!this._element.firstChild) {
                    this._element.appendChild(document.createTextNode(""));

                }
                this._valueNode = this._element.firstChild;
                if (this.value === undefined) {
                    this.value = this._valueNode.data;
                }
            }
        }
    },
/**
    Description TODO
    @function
    */
    prepareForActivationEvents: {
        value: function() {

            if (window.Touch) {
                this._element.addEventListener("touchstart", this);
            } else {
                this.element.addEventListener("mousedown", this);
            }

        }
    },

    /**
      Retrieves the display value for the button, running it through a converter if needed
      @private
    */
    _convertValue: {
        value: function(value) {
            if (this.converter) {
                return this.converter.convert(value);
            }
            return value;
        }
    },
/**
    Description TODO
    @function
    */
    draw: {
        value: function() {

            if (this._disabled) {
                this._element.classList.add("disabled");
            } else {
                this._element.classList.remove("disabled");
            }

            if (this._isElementInput) {
                this._element.setAttribute("value", this._convertValue(this.value));
            } else {
                this._element.firstChild.data = this._convertValue(this.value);
            }

            if (this.activeValue) {
                if (this.active) {
                    if (this._isElementInput) {
                        this._element.setAttribute("value", this._convertValue(this.activeValue));
                    }
                    else {
                        this._element.firstChild.data = this._convertValue(this.activeValue);
                    }
                } else {
                    if (this._isElementInput) {
                        this._element.setAttribute("value", this._convertValue(this.value));
                    }
                    else {
                        this._element.firstChild.data = this._convertValue(this.value);
                    }
                }
            }

            this._element.setAttribute("title", this.title || "");
        }
    }
});

Button.addProperties({
        autocomplete: null,
        autofocus: null,
        disabled: {dataType: 'boolean'},
        form: null,
        formaction: null,
        formenctype: null,
        formmethod: null,
        formnovalidate: null,
        formtarget: null,
        name: null,
        title: null
});
