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
	@module "montage/ui/bluemoon/checkbox.reel"
    @requires montage/core/core
    @requires montage/ui/component
*/
var Montage = require("montage").Montage,
    Component = require("ui/component").Component;
/**
    @class module:"montage/ui/bluemoon/checkbox.reel".Checkbox
    @extends module:montage/ui/component.Component
*/
exports.Checkbox = Montage.create(Component,/** @lends "module:montage/ui/bluemoon/checkbox.reel".Checkbox# */ {
    // Configuration
    /**
        The distance (squared) beyond which a touch will be considered.
        @type {Number}
        @default 256
    */
    touchMovementThreshold: {
        enumerable: false,
        value: 256
    },
    // Elements
/**
  Description TODO
  @private
*/
    _nativeCheckbox: {
        enumerable: false,
        value: null
    },
/**
  Description TODO
  @private
*/
    _background: {
        enumerable: false,
        value: null
    },
/**
  Description TODO
  @private
*/
    _button: {
        enumerable: false,
        value: null
    },
/**
  Description TODO
  @private
*/
    _checkmark: {
        enumerable: false,
        value: null
    },
    // Event Handling APIs
/**
    Description TODO
    @function
    @param {Event Handler} event handleMousedown
    */
    handleMousedown: {
        enumerable: false,
        value: function (event) {
            event.preventDefault();

            if (!this._disabled) {
                this._acknowledgeIntent("mouse");
            }
        }
    },
/**
    Description TODO
    @function
    @param {Event Handler} event handleMouseup
    */
    handleMouseup: {
        value: function(event) {
            this._interpretInteraction(event);
        }
    },
/**
  Description TODO
  @private
*/
    _touchX: {
        enumerable: false,
        value: null
    },
/**
  Description TODO
  @private
*/
    _touchY: {
        enumerable: false,
        value: null
    },
/**
    Description TODO
    @function
    @param {Event Handler} event handleTouchstart
    */
    handleTouchstart: {
        enumerable: false,
        value: function (event) {

            if (this._disabled || this._observedPointer !== null) {
                return;
            }

            event.preventDefault();

            this._acknowledgeIntent(event.targetTouches[0].identifier);
            this._touchX = event.targetTouches[0].clientX;
            this._touchY = event.targetTouches[0].clientY;
        }
    },
/**
    Description TODO
    @function
    @param {Event Handler} event handleTouchmove
    */
    handleTouchmove: {
        enumerable: false,
        value: function (event) {
            var i = 0, length = event.touches.length, xDistance, yDistance;

            while ((i < length) && (event.touches[i].identifier !== this._observedPointer)) {
                i++;
            }

            if (i < length) {
                xDistance = this._touchX - event.touches[i].clientX;
                yDistance = this._touchY - event.touches[i].clientY;

                var squaredDist = (xDistance * xDistance) + (yDistance * yDistance);

                if (squaredDist > this.touchMovementThreshold) {
                    event.preventDefault();

                    this._releaseInterest();

                    this.active = false;
                    this.needsDraw = true;
                }
            }
        }
    },
/**
    Description TODO
    @function
    @param {Event Handler} event handleTouchend
    */
    handleTouchend: {
        enumerable: false,
        value: function (event) {
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
    @param {Event Handler} event handleTouchcancel
    */
    handleTouchcancel: {
        value: function(event) {

            var i = 0,
                changedTouchCount = event.changedTouches.length;

            for (; i < changedTouchCount; i++) {
                if (event.changedTouches[i].identifier === this._observedPointer) {
                    this._releaseInterest();

                    this.active = false;
                    this.needsDraw = true;

                    return;
                }
            }

        }
    },

    // Internal state management
/**
  Description TODO
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
            if (value === this._active) {
                return;
            }

            this._active = value;
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
        get: function() {
            return this._disabled;
        },
        set: function(value) {
            if (value === this._disabled) {
                return;
            }

            this._disabled = value;
            this.needsDraw = true;
        }
    },
/**
  Description TODO
  @private
*/
    _checked: {
        enumerable: false,
        value: false
    },
/**
        Description TODO
        @type {Function}
        @default {Boolean} false
    */
    checked: {
        get: function () {
            return this._checked;
        },
        set: function (value) {
            if (value === this._checked) {
                return;
            }

            this._checked = value;
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
/**
    Description TODO
    @function
    @param {Pointer} pointer TODO
    @param {Component} demandingComponent TODO
    @returns {Boolean} true
    */
    surrenderPointer: {
        value: function(pointer, demandingComponent) {

            this._releaseInterest();

            this.active = false;
            return true;
        }
    },
/**
  Description TODO
  @private
*/
    _acknowledgeIntent: {
        value: function(pointer) {

            if (!this.eventManager.claimPointer(pointer, this)) {
                return;
            }

            this._observedPointer = pointer;


            if (window.Touch) {
                document.addEventListener("touchmove", this);
                document.addEventListener("touchend", this);
                document.addEventListener("touchcancel", this);
            } else {
                document.addEventListener("mouseup", this, false);
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
                this.checked = !this.checked;
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
    prepareForActivationEvents: {
        enumerable: false,
        value: function() {
            if (window.Touch) {
                this.element.addEventListener("touchstart", this, false);
            } else {
                this.element.addEventListener("mousedown", this, false);
            }
        }
    },
/**
    Description TODO
    @function
    */
    prepareForDraw: {
        enumerable: false,
        value: function () {
            this.element.type = "checkbox";

            var checkbox = document.createElement("span");
            checkbox.className = this.element.className;
            checkbox.classList.add("montage-Checkbox");

            this._background = document.createElement("span");
            this._background.classList.add("background");

            this._button = document.createElement("span");
            this._button.classList.add("button");

            this._checkmark = document.createElement("span");
            this._checkmark.classList.add("checkmark");

            this.element.parentNode.insertBefore(checkbox, this.element.nextSibling);

            var checkboxFragment = document.createDocumentFragment();
            checkboxFragment.appendChild(this._background);
            checkboxFragment.appendChild(this._button);
            checkboxFragment.appendChild(this._checkmark);
            checkboxFragment.appendChild(this.element);

            checkbox.appendChild(checkboxFragment);

            // Make sure this.element refers to the logical parent element of this component
            this._nativeCheckbox = this.element;
            this.element = checkbox;
        }
    },
/**
    Description TODO
    @function
    */
    draw: {
        enumerable: false,
        value: function() {
            this._nativeCheckbox.disabled = this._disabled;

            var element = this.element;

            if (this.disabled) {
                element.classList.add("disabled");
            } else {
                element.classList.remove("disabled");
            }

            if (this.active) {
                element.classList.add("active");
            } else {
                element.classList.remove("active");
            }

            this._nativeCheckbox.checked = this.checked;
            if (this.checked) {
                element.classList.add("checked");
            } else {
                element.classList.remove("checked");
            }
        }
    }
});
