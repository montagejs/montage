/* <copyright>
Copyright (c) 2012, Motorola Mobility LLC.
All Rights Reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

* Redistributions of source code must retain the above copyright notice,
  this list of conditions and the following disclaimer.

* Redistributions in binary form must reproduce the above copyright notice,
  this list of conditions and the following disclaimer in the documentation
  and/or other materials provided with the distribution.

* Neither the name of Motorola Mobility LLC nor the names of its
  contributors may be used to endorse or promote products derived from this
  software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE
LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
POSSIBILITY OF SUCH DAMAGE.
</copyright> */
/**
	@module "montage/ui/bluemoon/button.reel"
    @requires montage/core/core
    @requires montage/ui/component
*/
var Montage = require("montage").Montage,
    Component = require("ui/component").Component;

/**
 @class module:"montage/ui/bluemoon/button.reel".Button
 @classdesc Button component implementation. Turns any div element into a multi-state labeled button.
 @extends module:montage/ui/component.Component
 */
exports.Button = Montage.create(Component,/** @lends module:"montage/ui/bluemoon/button.reel".Button# */ {

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
    _busy: {
        enumerable: false,
        value: false
    },

/**
        Description TODO
        @type {Function}
        @default {Boolean} false
    */
    busy: {
        get: function () {
            return this._busy;
        },
        set: function (value) {
            if ((value === true) && (!this._disabled)) {
                this._busy = true;
            } else {
                this._busy = false;
            }
            this.needsDraw = true;
        }
    },

/**
  Description TODO
  @private
*/
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
                this.busy = false;
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
     * When behavior is toggle, @link http://www.w3.org/TR/wai-aria/states_and_properties#aria-pressed
     * the pressed property contains the equivalent of the aria-pressed attribute: "true"||"false"||"mixed"
     * @private
     */
    _pressed: {
        value: "false",
        enumerable: false
    },
    /**
        Description TODO
        @type {Function}
        @default {Boolean} "false"
    */
    pressed: {
        get: function() {
            return this._pressed;
        },
        set: function(value) {
            if (value !== this._pressed) {
                this._pressed = value;
                this.needsDraw = true;
            }
        }
    },
    /**
     * Used when a button is associated with an input tag. For buttons, the title comes from it's value attribute.
     * If the value property is undefined, it will be initialized from the button's input element if the element is an input type.
     * @private
     */
    _value: {
        enumerable: false,
        value: undefined
    },
    /**
        Description TODO
        @type {Function}
        @default undefined
    */
    value: {
        get: function () {
            return this._value;
        },
        set: function (value) {
            this._value = value;
            this.needsDraw = true;
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
     * @private
     */
    _title: {
        enumerable: false,
        value: undefined
    },
    /**
        Description Text to show in the tooltip displayed by hovering over this button
        @type {Function}
        @default undefined
    */
    title: {
        get: function () {
            return this._title;
        },
        set: function (value) {
            this._title = value;
            this.needsDraw = true;
        }
    },

/**
  Description TODO
  @private
*/
    _valueNode: {value:undefined, enumerable: false},

/**
        Used when a button is associate with an input tag.<br>
        For buttons, the title comes from it's value attribute.<br>
        valueActive, if set, is used when the button is in active state (mousedown / touchstart).
        @type {String}
        @default undefined
    */
    valueActive: {
        value: undefined
    },

 /**
  Description TODO
  @private
*/
    _valueNodeActiveNode: {value:undefined, enumerable: false},


    /**
     Used when a button is associate with an input tag.<br>
     For buttons, the title comes from its value attribute.<br>
     When behavior is toggle, @link http://www.w3.org/TR/wai-aria/states_and_properties#aria-pressed the button has multiple states and may need different titles for that.<br>
     So, pressedValue would contain the value to use when pressed is true.
     @type {String}
     @default undefined
     */
    pressedValue: {
        value: undefined
    },

/**
  Description TODO
  @private
*/
    _pressedValueNode: {value:undefined, enumerable: false},

/**
        Used when a button is associate with an input tag.<br>
        For buttons, the title comes from its <code>value</code> attribute.<br>
        When behavior is toggle, {@link http://www.w3.org/TR/wai-aria/states_and_properties#aria-pressed} the button has multiple states and may need different titles for that.<br>
        So, pressedValue would contain the value to use when pressed is true.
        @type {String}
        @default undefined
    */
    pressedValueActive: {
        value: undefined
    },

/**
  Description TODO
  @private
*/
    _pressedValueActiveNode: {value:undefined, enumerable: false},

/**
        Used when a button is associate with an input tag.<br>
        For buttons, the title comes from it's value attribute.<br>
        When behavior is toggle, {@link http://www.w3.org/TR/wai-aria/states_and_properties#aria-pressed} the button has multiple states and may need different titles for that.<br>
        So, <code>mixedValue</code> would contain the value to use when pressed is mixed.
        @type {String}
        @default undefined
    */
    mixedValue: {
        value: undefined
    },

 /**
  Description TODO
  @private
*/
    _mixedValueNode: {value:undefined, enumerable: false},

/**
        Used when a button is associated with an input tag.<br>
        For buttons, the title comes from its <code>value</code> attribute.<br>
        When behavior is toggle, {@link http://www.w3.org/TR/wai-aria/states_and_properties#aria-pressed} the button has multiple states and may need different titles for that.<br>
        So, <code>mixedValue</code> would contain the value to use when pressed is mixed.
        @type {String}
        @default undefined
    */
    mixedValueActive: {
        value: undefined
    },

/**
  Description TODO
  @private
*/
    _mixedValueActiveNode: {value:undefined, enumerable: false},

/**
  Description TODO
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
    _behavior: {
        value: "transient",
        enumerable: false
    },

    /**
        Behavior describes how the button interprets events:
        <ul>
            <li><b>transient</b> is the default, trigger an action on click</li>
            <li><b>toggle</b> maintains a state from off -> click -> on -> click -> off</li>
            <li><b>mixed</b> maintains a state from off -> click -> on -> click -> mixed -> off</li>
        </ul>
        @type {Function}
        @default {String} "transient"
    */
    behavior: {
        get: function() {
            return this._behavior;
        },
        set: function(value) {
            if (value !== this._behavior) {
                //Sanity check on behavior
                value = ((value === "transient") || (value === "toggle") || (value === "mixed")) ? value : "transient";
                this._behavior = value;
                this.needsDraw = true;
            }
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
            if (!this._disabled && !this._busy) {
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

            if (!this._disabled && !this._busy) {
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
                this.updateState();
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
    @function
    */
    updateState: {
        value: function() {
            var newState;

            if (this._behavior !== "transient") {
                switch (this._pressed) {
                    case "false":
                        newState = "true";
                        break;
                    case "true":
                        newState = (this._behavior === "toggle") ? "false" : "mixed";
                        break;
                    case "mixed":
                        newState = "false";
                        break;
                }
                this.pressed = newState;
            }
            this.needsDraw = true;
        }
    },
/**
  Description TODO
  @private
*/
    _isElementInput: {value: false},
    prepareForDraw: {
        value: function() {

            if(!this._element.tabIndex) {
                this._element.tabIndex = 0;
            }

            this._element.classList.add("montage-Button");
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

            if (this._busy) {
                this._element.setAttribute("aria-busy", true);
                this._element.classList.add("busy");
            } else {
                this._element.setAttribute("aria-busy", false);
                this._element.classList.remove("busy");
            }

            if (this._behavior !== "transient") {

                this._element.setAttribute("aria-pressed", this._pressed);

                if (this._pressed === "true" && this.pressedValue) {
                    if (this._isElementInput) {
                        this._valueNode.value = this._convertValue(this.pressedValue);
                    }
                    else {
                        if (!this._pressedValueNode) {
                            this._pressedValueNode = document.createTextNode("");
                            this._pressedValueNode.data = this._convertValue(this.pressedValue);
                        }
                        //TODO use replace now
                        this._valueNode.data = this._convertValue(this.pressedValue);
                    }
                }
                else if (this._pressed === "mixed" && this.mixedValue) {
                    if (this._isElementInput) {
                        this._element.setAttribute("value", this._convertValue(this.mixedValue));
                    }
                    else {
                        this._element.firstChild.data = this._convertValue(this.mixedValue);
                    }
                }
                else if ((this._pressed === "false") && (typeof this.value !== "undefined")) {
                    if (this._isElementInput) {
                        this._element.setAttribute("value", this._convertValue(this.value));
                    }
                    else {
                        this._element.firstChild.data = this._convertValue(this.value);
                    }
                }
            } else {
                if (this._isElementInput) {
                    this._element.setAttribute("value", this._convertValue(this.value));
                } else {
                    this._element.firstChild.data = this._convertValue(this.value);
                }
            }
            if (this.valueActive) {
                if (this.active) {
                    if (this._behavior === "transient" || this._pressed === "false") {
                        if (this._isElementInput) {
                            this._element.setAttribute("value", this._convertValue(this.valueActive));
                        }
                        else {
                            this._element.firstChild.data = this._convertValue(this.valueActive);
                        }
                    }
                    else if (this._pressed === "true" && this.pressedValueActive) {
                        if (this._isElementInput) {
                            this._element.setAttribute("value", this._convertValue(this.pressedValueActive));
                        }
                        else {
                            this._element.firstChild.data = this._convertValue(this.pressedValueActive);
                        }
                    }
                    else if (this._pressed === "mixed" && this.mixedValueActive) {
                        if (this._isElementInput) {
                            this._element.setAttribute("value", this._convertValue(this.mixedValueActive));
                        }
                        else {
                            this._element.firstChild.data = this._convertValue(this.mixedValueActive);
                        }
                    }
                }
                /* Right now, we don't handle active-pressed */
                else if (this._behavior === "transient") {
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

}, module);
/**
    @class module:"montage/ui/bluemoon/button.reel".ToggleButton
*/
exports.ToggleButton = Montage.create(exports.Button,/** @lends module:"montage/ui/bluemoon/button.reel".ToggleButton# */ {
/**
  Description TODO
  @private
*/
    _behavior: {
        value: "toggle"
    }
});
