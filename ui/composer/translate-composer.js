/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
 /*global require,exports */
/**
    @module montage/ui/composer/translate-composer
    @requires montage
    @requires montage/ui/composer/composer
*/
var Montage = require("montage").Montage,
    Composer = require("ui/composer/composer").Composer,
    defaultEventManager = require("core/event/event-manager").defaultEventManager;
/**
    @class module:montage/ui/composer/translate-composer.TranslateComposer
    @extends module:montage/ui/composer/composer.Composer
*/
var TranslateComposer = exports.TranslateComposer = Montage.create(Composer,/** @lends module:montage/ui/event/composer/translate-composer.TranslateComposer# */ {

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

    _externalUpdate: {
        enumerable: false,
        value: true
    },

    isAnimating: {
        enumerable: false,
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
        enumerable: false,
        value: 1
    },

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
        value: false,
        enumerable: false
    },

    _isSelfUpdate: {
        enumerable: false,
        value: false
    },

    _translateX: {
        enumerable: false,
        value: 0
    },
    translateX: {
        get: function() {
            return this._translateX;
        },
        set: function(value) {
            if (this._axis === "vertical") {
                this._translateX = this._minTranslateX || 0;
            } else {
                var tmp = isNaN(value) ? 0 : value >> 0;

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
        enumerable: false,
        value: 0
    },
    translateY: {
        get: function() {
            return this._translateY;
        },
        set: function(value) {
            if (this._axis === "horizontal") {
                this._translateY = this._minTranslateY || 0;
            } else {
                var tmp = isNaN(value) ? 0 : value >> 0;

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
        enumerable: false,
        value: null
    },
    minTranslateX: {
        get: function() {
            return this._minTranslateX;
        },
        set: function(value) {
            if (value !== null) {
                value = value >> 0;
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
        enumerable: false,
        value: null
    },
    maxTranslateX: {
        get: function() {
            return this._maxTranslateX;
        },
        set: function(value) {
            if (value !== null) {
                value = value >> 0;
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
        enumerable: false,
        value: null
    },
    minTranslateY: {
        get: function() {
            return this._minTranslateY;
        },
        set: function(value) {
            if (value !== null) {
                value = value >> 0;
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
        enumerable: false,
        value: null
    },
    maxTranslateY: {
        get: function() {
            return this._maxTranslateY;
        },
        set: function(value) {
            if (value !== null) {
                value = value >> 0;
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
        enumerable: false,
        value: "both"
    },

    axis: {
        get: function() {
            return this._axis;
        },
        set: function(value) {
            switch (value) {
            case "vertical":
            case "horizontal":
                this._axis = value;
                break;
            default:
                this._axis = "both";
                break;
            }
        }
    },

    _invertAxis: {
        value: false,
        enumerable: false
    },

    invertAxis: {
        get: function() {
            return this._invertAxis;
        },
        set: function(value) {
            this._invertAxis = value ? true : false;
        }
    },

    _hasMomentum: {
        enumerable: false,
        value: true
    },

    hasMomentum: {
        get: function() {
            return this._hasMomentum;
        },
        set: function(value) {
            this._hasMomentum = value ? true : false;
        }
    },

    __momentumDuration: {
        enumerable: false,
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
        },
        enumerable: false
    },

    _pointerX: {
        enumerable: false,
        value: null
    },

    _pointerY: {
        enumerable: false,
        value: null
    },

    _touchIdentifier: {
        enumerable: false,
        value: null
    },

    _isFirstMove: {
        enumerable: false,
        value: false
    },

    _start: {
        enumerable: false,
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
        enumerable: false,
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

    /**
    Description TODO
    @function
    @param {Event} event TODO
    */
    captureMousedown: {
        enumerable: false,
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
    */
    handleMousedown: {
        enumerable: false,
        value: function(event) {
            if (event.button === 0 && !this.eventManager.componentClaimingPointer(this._observedPointer, this)) {
                this.eventManager.claimPointer(this._observedPointer, this);
                this._start(event.clientX, event.clientY, event.target);
            }

        }
    },

    captureMousemove: {
        enumerable: false,
        value: function(event) {

            if (this.eventManager.isPointerClaimedByComponent(this._observedPointer, this)) {
                event.preventDefault();
                this._move(event.clientX, event.clientY);
            } else {
                this._analyzeMovement(event.velocity);
            }

        }
    },

    captureMouseup: {
        enumerable: false,
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
        enumerable: false,
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
                    this._start(event.targetTouches[0].clientX, event.targetTouches[0].clientY, event.targetTouches[0].target);
                }
            }
        }
    },

    captureTouchmove: {
        enumerable: false,
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
                    this._analyzeMovement(event.changedTouches[i].velocity);
                }

            }
        }
    },

    captureTouchend: {
        enumerable: false,
        value: function(event) {
            var i = 0, len = event.changedTouches.length;
            while (i < len && !this.eventManager.isPointerClaimedByComponent(event.changedTouches[i].identifier, this)) {
                i++;
            }
            if (i < len) {
                this._end(event.changedTouches[i]);
            }
        }
    },

    _analyzeMovement: {
        value: function(velocity) {

            if (!velocity) {
                return;
            }

            var lowerRight = 0.7853981633974483, // pi/4
                lowerLeft = 2.356194490192345, // 3pi/4
                upperLeft = -2.356194490192345, // 5pi/4
                upperRight = -0.7853981633974483, // 7pi/4
                isUp, isDown, isRight, isLeft,
                angle,
                speed;

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

            } else if (speed >= 500) {
                // TODO not hardcode this threshold speed
                this._stealPointer();
            }

        }
    },

    _stealPointer: {
        value: function() {
            this.eventManager.claimPointer(this._observedPointer, this);
        }
    },

    _translateEndTimeout: {
        enumerable: false,
        value: null
    },

    handleMousewheel: {
        enumerable: false,
        value: function(event) {
            var self = this;

            var oldTranslateY = this._translateY;
            this.translateY = this._translateY - (event.wheelDeltaY * 20) / 120;
            this._dispatchTranslateStart();
            window.clearTimeout(this._translateEndTimeout);
            this._translateEndTimeout = window.setTimeout(function() {
                self._dispatchTranslateEnd();
            }, 400);

            // If we're not at one of the extremes (i.e. the scroll actully
            // changed the translate) then we want to preventDefault to stop
            // the page scrolling.
            if (oldTranslateY !== this._translateY) {
                event.preventDefault();
            }
        }
    },

    _move: {
        enumerable: false,
        value: function(x, y) {
            var pointerDelta;
            this._isSelfUpdate = true;
            if (this._axis != "vertical") {
                pointerDelta = this._invertAxis ? (this._pointerX - x) : (x - this._pointerX);
                this.translateX += pointerDelta * this._pointerSpeedMultiplier;
            }
            if (this._axis != "horizontal") {
                pointerDelta = this._invertAxis ? (this._pointerY - y) : (y - this._pointerY);
                this.translateY += pointerDelta * this._pointerSpeedMultiplier;
            }
            this._isSelfUpdate = false;
            this._pointerX = x;
            this._pointerY = y;
            if (this._isFirstMove) {
                this._dispatchTranslateStart();
                this._isFirstMove = false;
            }
            if (this._shouldDispatchTranslate) {
                this._dispatchTranslate();
            }
        }
    },

    _animationInterval: {
        enumerable: false,
        value: false
    },

    _bezierTValue: {
        enumerable: false,
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
        enumerable: false,
        value: function() {
            var translateStartEvent = document.createEvent("CustomEvent");

            translateStartEvent.initCustomEvent("translateStart", true, true, null);
            this.dispatchEvent(translateStartEvent);
        }
    },

    _dispatchTranslateEnd: {
        enumerable: false,
        value: function() {
            var translateEndEvent = document.createEvent("CustomEvent");

            translateEndEvent.initCustomEvent("translateEnd", true, true, null);
            this.dispatchEvent(translateEndEvent);
        }
    },

    _dispatchTranslate: {
        enumerable: false,
        value: function() {
            var translateEvent = document.createEvent("CustomEvent");
            translateEvent.initCustomEvent("translate", true, true, null);
            translateEvent.translateX = this._translateX;
            translateEvent.translateY = this._translateY;
            this.dispatchEvent(translateEvent);
        }
    },


    _end: {
        enumerable: false,
        value: function(event) {

            var animateMomentum=false,
                momentumX,
                momentumY,
                startX=this._translateX,
                startY,
                posX=startX,
                posY,
                endX=startX,
                endY,
                self=this,
                startTime=Date.now();

            startY = this._translateY;
            posY = startY;
            endY = startY;
            if ((this._hasMomentum) && (event.velocity.speed > 40)) {
                if (this._axis != "vertical") {
                    momentumX = event.velocity.x * this._pointerSpeedMultiplier * (this._invertAxis ? 1 : -1);
                } else {
                    momentumX = 0;
                }
                if (this._axis != "horizontal") {
                    momentumY = event.velocity.y * this._pointerSpeedMultiplier * (this._invertAxis ? 1 : -1);
                } else {
                    momentumY = 0;
                }
                endX = startX - (momentumX * this.__momentumDuration / 2000);
                endY = startY - (momentumY * this.__momentumDuration / 2000);
                animateMomentum = true;
            }

            this._animationInterval = function() {
                var time = Date.now(),
                    t, tmpX, tmpY;

                if (animateMomentum) {
                    t = time - startTime;
                    if (t < self.__momentumDuration) {
                        posX = startX - ((momentumX + momentumX * (self.__momentumDuration - t) / self.__momentumDuration) * t / 1000) / 2;
                        posY = startY - ((momentumY + momentumY * (self.__momentumDuration - t) / self.__momentumDuration) * t / 1000) / 2;
                    } else {
                        animateMomentum = false;
                    }
                }

                tmpX = posX;
                tmpY = posY;

                self._isSelfUpdate = true;
                self.translateX = tmpX;
                self.translateY = tmpY;
                self._isSelfUpdate = false;
                self.isAnimating = animateMomentum;
                if (self.isAnimating) {
                    self.needsFrame = true;
                } else {
                    this._dispatchTranslateEnd();
                }
            };
            this._animationInterval();
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
