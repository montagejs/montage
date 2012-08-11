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
 /*global require,exports */
/**
    @module montage/ui/composer/translate-composer
    @requires montage/core/core
    @requires montage/ui/composer/composer
    @requires montage/core/event/event-manager
*/
var Montage = require("montage").Montage,
    Composer = require("ui/composer/composer").Composer,
    defaultEventManager = require("core/event/event-manager").defaultEventManager;
/**
    Provides translateX and translateY properties that are updated when the
    user clicks/touches and drags on the given element. Should be used wherever
    a user interacts with an element by dragging it.

    @class module:montage/ui/composer/translate-composer.TranslateComposer
    @extends module:montage/ui/composer/composer.Composer
*/
var TranslateComposer = exports.TranslateComposer = Montage.create(Composer,/** @lends module:montage/ui/composer/translate-composer.TranslateComposer# */ {

    /**
    These elements perform some native action when clicked/touched and so we
    should not preventDefault when a mousedown/touchstart happens on them.
    @private
    */
    _NATIVE_ELEMENTS: {
        value: ["A", "IFRAME", "EMBED", "OBJECT", "VIDEO", "AUDIO", "CANVAS",
            "LABEL", "INPUT", "BUTTON", "SELECT", "TEXTAREA", "KEYGEN",
            "DETAILS", "COMMAND"
        ]
    },

    _WHEEL_POINTER: {
        value: "wheel",
        writable: false
    },

    _externalUpdate: {
        value: true
    },

    isAnimating: {
        value: false
    },

    frame: {
        value: function(timestamp) {
            if (this.isAnimating) {
                this._animationInterval();
            }
            this._externalUpdate = false;
        }
    },

    _pointerSpeedMultiplier: {
        value: 1
    },

    /**
        How many pixels to translate by for each pixel of cursor movement.
        @type {Number}
        @default 1
    */
    pointerSpeedMultiplier: {
        get: function() {
            return this._pointerSpeedMultiplier;
        },
        set: function(value) {
            this._pointerSpeedMultiplier = value;
        }
    },

    pointerStartEventPosition: {
        value: null
    },

    _shouldDispatchTranslate: {
        value: false
    },

    _isSelfUpdate: {
        value: false
    },

    _allowFloats: {
        value: false
    },
    /**
        Allow (@link translateX} and {@link translateY} to be floats.
        @type {Boolean}
        @default false
    */
    allowFloats: {
        get: function() {
            return this._allowFloats;
        },
        set: function(value) {
            if (this._allowFloats !== value) {
                this._allowFloats = value;
                this.translateX = this._translateX;
                this.translateY = this._translateY;
            }
        }
    },

    _translateX: {
        value: 0
    },
    /**
        Amount of translation in the X (left/right) direction. Can be inverted with
        {@link invertXAxis}, and restricted to a range with
        {@link minTranslateX} and {@link maxTranslateX}.
        @type {Number}
        @default 0
    */
    translateX: {
        get: function() {
            return this._translateX;
        },
        set: function(value) {
            if (this._axis === "vertical") {
                this._translateX = this._minTranslateX || 0;
            } else {
                var tmp = isNaN(value) ? 0 : this._allowFloats ? parseFloat(value) : value >> 0;

                if (this._minTranslateX !== null && tmp < this._minTranslateX) {
                    tmp = this._minTranslateX;
                }
                if (this._maxTranslateX !== null && tmp > this._maxTranslateX) {
                    tmp = this._maxTranslateX;
                }
                if (!this._isSelfUpdate) {
                    this.isAnimating = false;
                }
                this._translateX = tmp;
            }
        }
    },

    _translateY: {
        value: 0
    },
    /**
        Amount of translation in the Y (up/down) direction. Can be inverted with
        {@link invertYAxis}, and restricted to a range with
        {@link minTranslateY} and {@link maxTranslateY}.
        @type {Number}
        @default 0
    */
    translateY: {
        get: function() {
            return this._translateY;
        },
        set: function(value) {
            if (this._axis === "horizontal") {
                this._translateY = this._minTranslateY || 0;
            } else {
                var tmp = isNaN(value) ? 0 : this._allowFloats ? parseFloat(value) : value >> 0;

                if (this._minTranslateY !== null && tmp < this._minTranslateY) {
                    tmp = this._minTranslateY;
                }
                if (this._maxTranslateY !== null && tmp > this._maxTranslateY) {
                    tmp = this._maxTranslateY;
                }
                if (!this._isSelfUpdate) {
                    this.isAnimating = false;
                }
                this._translateY = tmp;
            }
        }
    },

    _minTranslateX: {
        value: null
    },
    /**
        The minimum value {@link translateX} can take. If set to null then
        there is no minimum.
        @type {number|null}
        @default null
    */
    minTranslateX: {
        get: function() {
            return this._minTranslateX;
        },
        set: function(value) {
            if (value !== null) {
                value = parseFloat(value);
            }

            if (this._minTranslateX != value) {
                if (value !== null && this._translateX < value) {
                    this.translateX = value;
                }
                this._minTranslateX = value;
            }
        }
    },
    _maxTranslateX: {
        value: null
    },
    /**
        The maximum value {@link translateX} can take. If set to null then
        there is no maximum.
        @type {number|null}
        @default null
    */
    maxTranslateX: {
        get: function() {
            return this._maxTranslateX;
        },
        set: function(value) {
            if (value !== null) {
                value = parseFloat(value);
            }

            if (this._maxTranslateX != value) {
                if (value !== null && this._translateX > value) {
                    this.translateX = value;
                }
                this._maxTranslateX = value;
            }
        }
    },

    _minTranslateY: {
        value: null
    },
    /**
        The minimum value {@link translateY} can take. If set to null then
        there is no minimum.
        @type {number|null}
        @default null
    */
    minTranslateY: {
        get: function() {
            return this._minTranslateY;
        },
        set: function(value) {
            if (value !== null) {
                value = parseFloat(value);
            }

            if (this._minTranslateY != value) {
                if (value !== null && this._translateY < value) {
                    this.translateY = value;
                }
                this._minTranslateY = value;
            }
        }
    },
    _maxTranslateY: {
        value: null
    },
    /**
        The maximum value {@link translateY} can take. If set to null then
        there is no maximum.
        @type {number|null}
        @default null
    */
    maxTranslateY: {
        get: function() {
            return this._maxTranslateY;
        },
        set: function(value) {
            if (value !== null) {
                value = parseFloat(value);
            }

            if (this._maxTranslateY != value) {
                if (value !== null && this._translateY > value) {
                    this.translateY = value;
                }
                this._maxTranslateY = value;
            }
        }
    },

    _axis: {
        value: "both"
    },
    /**
        Which axis translation is restricted to.

        Can be "vertical", "horizontal" or "both".
        @type {String}
        @default "both"
    */
    axis: {
        get: function() {
            return this._axis;
        },
        set: function(value) {
            switch (value) {
            case "vertical":
            case "horizontal":
                this._axis = value;
                this.translateX = this._translateX;
                this.translateY = this._translateY;
                break;
            default:
                this._axis = "both";
                break;
            }
        }
    },

    /**
        Invert direction of translation on both axes.

        This inverts the effect of cursor motion on both axes. For example
        if set to true moving the mouse up will increase the value of
        translateY instead of decreasing it.

        Depends on invertXAxis and invertYAxis.
        @type {Boolean}
        @default false
    */
    invertAxis: {
        depends: ["invertXAxis", "invertYAxis"],
        get: function() {
            return (this._invertXAxis === this._invertYAxis) ? this._invertXAxis : null;
        },
        set: function(value) {
            this.invertXAxis = value;
            this.invertYAxis = value;
        }
    },
    _invertXAxis: {
        value: false
    },
    /**
        Invert direction of translation along the X axis.

        This inverts the effect of left/right cursor motion on translateX.
        @type {Boolean}
        @default false
    */
    invertXAxis: {
        get: function() {
            return this._invertXAxis;
        },
        set: function(value) {
            this._invertXAxis = !!value;
        }
    },
    _invertYAxis: {
        value: false
    },
    /**
        Invert direction of translation along the Y axis.

        This inverts the effect of up/down cursor motion on translateX.
        @type {Boolean}
        @default false
    */
    invertYAxis: {
        get: function() {
            return this._invertYAxis;
        },
        set: function(value) {
            this._invertYAxis = !!value;
        }
    },

    /**
        How fast the cursor has to be moving before translating starts. Only
        applied when another component has claimed the pointer.
        @type {Number}
        @default 500
    */
    startTranslateSpeed: {
        value: 500
    },

    startTranslateRadius: {
        value: 8
    },

    _hasMomentum: {
        value: true
    },

    /**
        Whether to keep translating after the user has releases the cursor.
        @type {Boolean}
        @default true
    */
    hasMomentum: {
        get: function() {
            return this._hasMomentum;
        },
        set: function(value) {
            this._hasMomentum = value ? true : false;
        }
    },

    __momentumDuration: {
        value: 650
    },

    _momentumDuration: {
        get: function() {
            return this.__momentumDuration;
        },
        set: function(value) {
            this.__momentumDuration = isNaN(value) ? 1 : value >> 0;
            if (this.__momentumDuration < 1) {
                this.__momentumDuration = 1;
            }
        }
    },

    _pointerX: {
        value: null
    },

    _pointerY: {
        value: null
    },

    _touchIdentifier: {
        value: null
    },

    _isFirstMove: {
        value: false
    },

    _start: {
        value: function(x, y, target) {
            this.pointerStartEventPosition = {
                pageX: x,
                pageY: y,
                target: target
            };
            this._pointerX = x;
            this._pointerY = y;
            if (window.Touch) {
                document.addEventListener("touchend", this, true);
                document.addEventListener("touchmove", this, true);
            } else {
                document.addEventListener("mouseup", this, true);
                document.addEventListener("mousemove", this, true);
            }
            this.isAnimating = false;
            this._isFirstMove = true;
        }
    },

    _observedPointer: {
        value: null
    },

    /**
    Returns if we should preventDefault on a touchstart/mousedown event.
    @param {Event} The event
    @returns {Boolean} Whether preventDefault should be called
    @private
    */
    _shouldPreventDefault: {
        value: function(event) {
            return !!event.target.tagName && TranslateComposer._NATIVE_ELEMENTS.indexOf(event.target.tagName) === -1 && !event.target.isContentEditable;
        }
    },

    captureMousedown: {
        value: function(event) {
            if (event.button !== 0) {
                return;
            }

            if (this._shouldPreventDefault(event)) {
                event.preventDefault();
            }

            // Register some interest in the mouse pointer internally, we may end up claiming it but let's see if
            // anybody else cares first
            this._observedPointer = "mouse";

            this._start(event.clientX, event.clientY, event.target);
        }
    },

    /**
    Handle the mousedown that bubbled back up from beneath the element
    If nobody else claimed this pointer, we should handle it now
    @function
    @param {Event} event TODO
    @private
    */
    handleMousedown: {
        value: function(event) {
            if (event.button === 0 && !this.eventManager.componentClaimingPointer(this._observedPointer)) {
                this.eventManager.claimPointer(this._observedPointer, this);
            }

        }
    },

    captureMousemove: {
        value: function(event) {

            if (this.eventManager.isPointerClaimedByComponent(this._observedPointer, this)) {
                event.preventDefault();
                this._move(event.clientX, event.clientY);
            } else {
                if (this.axis !== "both") {
                    this._analyzeMovement(event);
                } else {
                    if (this._stealPointer()) {
                        event.preventDefault();
                        this._move(event.clientX, event.clientY);
                    }
                }
            }

        }
    },

    captureMouseup: {
        value: function(event) {
            this._end(event);
        }
    },

    _releaseInterest: { // unload??
        value: function() {

            if (window.Touch) {
                document.removeEventListener("touchend", this, true);
                document.removeEventListener("touchmove", this, true);
            } else {
                document.removeEventListener("mouseup", this, true);
                document.removeEventListener("mousemove", this, true);
            }

            if (this.eventManager.isPointerClaimedByComponent(this._observedPointer, this)) {
                this.eventManager.forfeitPointer(this._observedPointer, this);
            }
            this._observedPointer = null;
        }
    },

    captureTouchstart: {
        value: function(event) {
            if (this._shouldPreventDefault(event)) {
                event.preventDefault();
            }

            // If already scrolling, ignore any new touchstarts
            if (this._observedPointer !== null && this.eventManager.isPointerClaimedByComponent(this._observedPointer, this)) {
                return;
            }

            if (event.targetTouches.length === 1) {
                this._observedPointer = event.targetTouches[0].identifier;
                this._start(event.targetTouches[0].clientX, event.targetTouches[0].clientY, event.targetTouches[0].target);
            }
        }
    },

    handleTouchstart: {
        value: function(event) {
            if (!this.eventManager.componentClaimingPointer(this._observedPointer)) {

                if (event.targetTouches.length === 1) {
                    if (this._shouldPreventDefault(event)) {
                        event.preventDefault();
                    }

                    this.eventManager.claimPointer(this._observedPointer, this);
                }
            }
        }
    },

    captureTouchmove: {
        value: function(event) {

            var i = 0, len = event.changedTouches.length;
            while (i < len && event.changedTouches[i].identifier !== this._observedPointer) {
                i++;
            }

            if (i < len) {
                if (this.eventManager.isPointerClaimedByComponent(this._observedPointer, this)) {
                    event.preventDefault();
                    this._move(event.changedTouches[i].clientX, event.changedTouches[i].clientY);
                } else {
                    this._analyzeMovement(event.changedTouches[i]);
                }

            }
        }
    },

    captureTouchend: {
        value: function(event) {
            var i = 0, len = event.changedTouches.length;
            while (i < len && event.changedTouches[i].identifier !== this._observedPointer) {
                i++;
            }
            if (i < len) {
                this._end(event.changedTouches[i]);
            }
        }
    },

    _analyzeMovement: {
        value: function(event) {
            var velocity = event.velocity;

            if (!velocity) {
                return;
            }

            var lowerRight = 0.7853981633974483, // pi/4
                lowerLeft = 2.356194490192345, // 3pi/4
                upperLeft = -2.356194490192345, // 5pi/4
                upperRight = -0.7853981633974483, // 7pi/4
                isUp, isDown, isRight, isLeft,
                angle,
                speed,
                dX, dY;

            speed = velocity.speed;

            if (0 === velocity.speed || isNaN(velocity.speed)) {
                // If there's no speed there's not much we can infer about direction; stop
                return;
            }

            angle = velocity.angle;

            // The motion is with the grain of the element; we may want to see if we should claim the pointer
            if ("horizontal" === this.axis) {

                isRight = (angle <= lowerRight && angle >= upperRight);
                isLeft = (angle >= lowerLeft || angle <= upperLeft);

                if (isRight || isLeft) {
                    this._stealPointer();
                }

            } else if ("vertical" === this.axis) {

                isUp = (angle <= upperRight && angle >= upperLeft);
                isDown = (angle >= lowerRight && angle <= lowerLeft);

                if (isUp || isDown) {
                    this._stealPointer();
                }

            } else if (speed >= this.startTranslateSpeed) {
                this._stealPointer();
            } else {
                dX = this.pointerStartEventPosition.pageX - event.pageX;
                dY = this.pointerStartEventPosition.pageY - event.pageY;
                if (dX * dX + dY * dY > this.startTranslateRadius * this.startTranslateRadius) {
                    this._stealPointer();
                }
            }

        }
    },

    _stealPointer: {
        value: function() {
            return this.eventManager.claimPointer(this._observedPointer, this);
        }
    },

    _translateEndTimeout: {
        value: null
    },

    captureMousewheel: {
        value: function(event) {
            if (!this.eventManager.componentClaimingPointer(this._WHEEL_POINTER)) {
                this.eventManager.claimPointer(this._WHEEL_POINTER, this.component);
            }
        }
    },

    handleMousewheel: {
        value: function(event) {
            var self = this;

            // If this composers' component is claiming the "wheel" pointer then handle the event
            if (this.eventManager.isPointerClaimedByComponent(this._WHEEL_POINTER, this.component)) {
                var oldTranslateY = this._translateY;
                this._dispatchTranslateStart();
                this.translateY = this._translateY - ((event.wheelDeltaY * 20) / 120);
                this._dispatchTranslate();
                window.clearTimeout(this._translateEndTimeout);
                this._translateEndTimeout = window.setTimeout(function() {
                    self._dispatchTranslateEnd();
                }, 400);

                // If we're not at one of the extremes (i.e. the scroll actually
                // changed the translate) then we want to preventDefault to stop
                // the page scrolling.
                if (oldTranslateY !== this._translateY && this._shouldPreventDefault(event)) {
                    event.preventDefault();
                }
                this.eventManager.forfeitPointer(this._WHEEL_POINTER, this.component);
            }
        }
    },

    _move: {
        value: function(x, y) {
            var pointerDelta;

            if (this._isFirstMove) {
                this._dispatchTranslateStart(this._translateX, this._translateY);
                this._isFirstMove = false;
            }

            this._isSelfUpdate = true;
            if (this._axis != "vertical") {
                pointerDelta = this._invertXAxis ? (this._pointerX - x) : (x - this._pointerX);
                this.translateX += pointerDelta * this._pointerSpeedMultiplier;
            }
            if (this._axis != "horizontal") {
                pointerDelta = this._invertYAxis ? (this._pointerY - y) : (y - this._pointerY);
                this.translateY += pointerDelta * this._pointerSpeedMultiplier;
            }
            this._isSelfUpdate = false;

            this._pointerX = x;
            this._pointerY = y;

            if (this._shouldDispatchTranslate) {
                this._dispatchTranslate();
            }
        }
    },

    _bezierTValue: {
        value: function(x, p1x, p1y, p2x, p2y) {
            var a = 1 - 3 * p2x + 3 * p1x,
                b = 3 * p2x - 6 * p1x,
                c = 3 * p1x,
                t = 0.5,
                der, i, k, tmp;

            for (i = 0; i < 10; i++) {
                tmp = t * t;
                der = 3 * a * tmp + 2 * b * t + c;
                k = 1 - t;
                t -= ((3 * (k * k * t * p1x + k * tmp * p2x) + tmp * t - x) / der); // der==0
            }
            tmp = t * t;
            k = 1 - t;
            return 3 * (k * k * t * p1y + k * tmp * p2y) + tmp * t;
        }
    },

    _dispatchTranslateStart: {
        value: function(x, y) {
            var translateStartEvent = document.createEvent("CustomEvent");

            translateStartEvent.initCustomEvent("translateStart", true, true, null);
            translateStartEvent.translateX = x;
            translateStartEvent.translateY = y;
            this.dispatchEvent(translateStartEvent);
        }
    },

    _dispatchTranslateEnd: {
        value: function() {
            var translateEndEvent = document.createEvent("CustomEvent");

            translateEndEvent.initCustomEvent("translateEnd", true, true, null);
            translateEndEvent.translateX = this._translateX;
            translateEndEvent.translateY = this._translateY;
            this.dispatchEvent(translateEndEvent);
        }
    },

    _dispatchTranslate: {
        value: function() {
            var translateEvent = document.createEvent("CustomEvent");
            translateEvent.initCustomEvent("translate", true, true, null);
            translateEvent.translateX = this._translateX;
            translateEvent.translateY = this._translateY;
            this.dispatchEvent(translateEvent);
        }
    },

    animateBouncingX: {value: false, enumerable: false},
    startTimeBounceX: {value: false, enumerable: false},
    animateBouncingY: {value: false, enumerable: false},
    startTimeBounceY: {value: false, enumerable: false},
    animateMomentum: {value: false, enumerable: false},
    startTime: {value: null, enumerable: false},
    startX: {value: null, enumerable: false},
    posX: {value: null, enumerable: false},
    endX: {value: null, enumerable: false},
    startY: {value: null, enumerable: false},
    posY: {value: null, enumerable: false},
    endY: {value: null, enumerable: false},

    translateStrideX: {
        value: null
    },

    translateStrideY: {
        value: null
    },

    translateStrideDuration: {
        value: 330
    },

    _animationInterval: {
        value: function () {
            var time = Date.now(), t, tmp, tmpX, tmpY, animateStride = false;

            if (this.animateMomentum) {
                t=time-this.startTime;
                if (t<this.__momentumDuration) {
                    this.posX=this.startX-((this.momentumX+this.momentumX*(this.__momentumDuration-t)/this.__momentumDuration)*t/1000)/2;
                    this.posY=this.startY-((this.momentumY+this.momentumY*(this.__momentumDuration-t)/this.__momentumDuration)*t/1000)/2;
                    if (this.translateStrideX && (this.startStrideXTime === null) && ((this.__momentumDuration - t < this.translateStrideDuration) || (Math.abs(this.posX - this.endX) < this.translateStrideX * .75))) {
                        this.startStrideXTime = time;
                    }
                    if (this.translateStrideY && (this.startStrideYTime === null) && ((this.__momentumDuration - t < this.translateStrideDuration) || (Math.abs(this.posY - this.endY) < this.translateStrideY * .75))) {
                        this.startStrideYTime = time;
                    }
                } else {
                    this.animateMomentum = false;
                }
            }
            tmp = Math.round(this.endX / this.translateStrideX);
            if (this.startStrideXTime && (time - this.startStrideXTime > 0)) {
                if (time - this.startStrideXTime < this.translateStrideDuration) {
                    t = this._bezierTValue((time - this.startStrideXTime) / this.translateStrideDuration, .275, 0, .275, 1);
                    this.posX = this.posX * (1 - t) + (tmp *  this.translateStrideX) * t;
                    animateStride = true;
                } else {
                    this.posX = tmp * this.translateStrideX;
                }
            }
            tmp = Math.round(this.endY / this.translateStrideY);
            if (this.startStrideYTime && (time - this.startStrideYTime > 0)) {
                if (time - this.startStrideYTime < this.translateStrideDuration) {
                    t = this._bezierTValue((time - this.startStrideYTime) / this.translateStrideDuration, .275, 0, .275, 1);
                    this.posY = this.posY * (1 - t) + (tmp *  this.translateStrideY) * t;
                    animateStride = true;
                } else {
                    this.posY = tmp * this.translateStrideY;
                }
            }
            tmpX = this.posX;
            tmpY = this.posY;
            this._isSelfUpdate=true;
            this.translateX=tmpX;
            this.translateY=tmpY;
            this._isSelfUpdate=false;
            this.isAnimating = this.animateMomentum || animateStride;
            if (this.isAnimating) {
                this.needsFrame=true;
            } else {
                this._dispatchTranslateEnd();
            }
        }
    },


    _end: {
        value: function (event) {

            this.startTime=Date.now();

            this.endX = this.posX = this.startX=this._translateX;
            this.endY=this.posY=this.startY=this._translateY;

            if ((this._hasMomentum) && ((event.velocity.speed>40) || this.translateStrideX || this.translateStrideY)) {
                if (this._axis != "vertical") {
                    this.momentumX = event.velocity.x * this._pointerSpeedMultiplier * (this._invertXAxis ? 1 : -1);
                } else {
                    this.momentumX = 0;
                }
                if (this._axis != "horizontal") {
                    this.momentumY = event.velocity.y * this._pointerSpeedMultiplier * (this._invertYAxis ? 1 : -1);
                } else {
                    this.momentumY=0;
                }
                this.endX = this.startX - (this.momentumX * this.__momentumDuration / 2000);
                this.endY = this.startY - (this.momentumY * this.__momentumDuration / 2000);
                this.startStrideXTime = null;
                this.startStrideYTime = null;
                this.animateMomentum = true;
            } else {
                this.animateMomentum = false;
            }

            if (this.animateMomentum) {
                this._animationInterval();
            } else if (!this._isFirstMove) {
                // Only dispatch a translateEnd if a translate start has occured
                this._dispatchTranslateEnd();
            }
            this._releaseInterest();
        }
    },

    surrenderPointer: {
        value: function(pointer, demandingComponent) {
            return true;
        }
    },

    eventManager: {
        get: function() {
            return defaultEventManager;
        }
    },

    load: {
        value: function() {
            if (window.Touch) {
                this._element.addEventListener("touchstart", this, true);
                this._element.addEventListener("touchstart", this, false);
            } else {
                this._element.addEventListener("mousedown", this, true);
                this._element.addEventListener("mousedown", this, false);
                this._element.addEventListener("mousewheel", this, false);
                this._element.addEventListener("mousewheel", this, true);
            }

            this.eventManager.isStoringPointerEvents = true;
        }
    },

    addEventListener: {
        value: function(type, listener, useCapture) {
            Composer.addEventListener.call(this, type, listener, useCapture);
            if (type === "translate") {
                this._shouldDispatchTranslate = true;
            }
        }
    }

});
