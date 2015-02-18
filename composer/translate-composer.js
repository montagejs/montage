/*global require,exports */
/**
 * @module montage/composer/translate-composer
 * @requires montage/core/core
 * @requires montage/composer/composer
 * @requires montage/core/event/event-manager
 */
var Composer = require("./composer").Composer,
    defaultEventManager = require("../core/event/event-manager").defaultEventManager;

/**
 * Abstracts listening for touch and mouse events representing a drag. The
 * emitted events provide translateX and translateY properties that are updated
 * when the user drags on the given element. Should be used wherever a user
 * interacts with an element by dragging.
 *
 * @class TranslateComposer
 * @extends Composer
 * @fires translate
 * @fires translateStart
 * @fires translateEnd
 * @classdesc A composer that elevates touch and mouse events into drag events.
 */
var TranslateComposer = exports.TranslateComposer = Composer.specialize(/** @lends TranslateComposer# */ {

    constructor: {
        value: function TranslateComposer() {
            this.super();
        }
    },

    /**
     * These elements perform some native action when clicked/touched and so we
     * should not preventDefault when a mousedown/touchstart happens on them.
     * @private
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

    // When set to true, do not respond to events, claim pointers, or prevent default
    enabled: {
        value: true
    },

    _externalUpdate: {
        value: true
    },

    isAnimating: {
        value: false
    },

    isMoving: {
        value: false
    },

    /**
     * When stealChildrenPointer is set to true the translate composer is able
     * to claim the pointer in place of its children when the time difference
     * between touchstart and the first touchmove is within the
     * stealChildrenPointerThreshold.
     *
     * This property should be set to true on translate composers that act as
     * scrollers so that they can capture the pointer instead of its children
     * when the user intends to scroll instead of interacting with one of the
     * children.
     * The intention of the user is deduced by the time difference between
     * touchstart and the first touchmove.
     *
     * @type {boolean}
     */
    stealChildrenPointer: {
        value: false
    },

    /**
     * Time, in ms, between touchstart and touchmove to consider when stealing
     * the pointer from its children.
     * The default value is based on the values we got when measuring on different
     * devices
     * iPad: 127.5
     * Nexus 10 (4.2.2): 153.5
     *
     * @type {number}
     */
    stealChildrenPointerThreshold: {
        value: 130
    },

    frame: {
        value: function () {
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
     * How many pixels to translate by for each pixel of cursor movement.
     * @type {number}
     * @default 1
     */
    pointerSpeedMultiplier: {
        get: function () {
            return this._pointerSpeedMultiplier;
        },
        set: function (value) {
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
     * Allow (@link translateX} and {@link translateY} to be floats?
     * @type {boolean}
     * @default false
     */
    allowFloats: {
        get: function () {
            return this._allowFloats;
        },
        set: function (value) {
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
     * Amount of translation in the X (left/right) direction. Can be inverted with
     * {@link invertXAxis}, and restricted to a range with
     * {@link minTranslateX} and {@link maxTranslateX}.
     * @type {number}
     * @default 0
     */
    translateX: {
        get: function () {
            return this._translateX;
        },
        set: function (value) {
            if (this._axis === "vertical") {
                this._translateX = this._minTranslateX || 0;
            } else {
                //jshint -W016
                var tmp = isNaN(value) ? 0 : this._allowFloats ? parseFloat(value) : value >> 0;
                //jshint +W016

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
     * Amount of translation in the Y (up/down) direction. Can be inverted with
     * {@link invertYAxis}, and restricted to a range with
     * {@link minTranslateY} and {@link maxTranslateY}.
     * @type {number}
     * @default 0
     */
    translateY: {
        get: function () {
            return this._translateY;
        },
        set: function (value) {
            if (this._axis === "horizontal") {
                this._translateY = this._minTranslateY || 0;
            } else {
                //jshint -W016
                var tmp = isNaN(value) ? 0 : this._allowFloats ? parseFloat(value) : value >> 0;
                //jshint +W016

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
     * The minimum value {@link translateX} can take. If set to null then
     * there is no minimum.
     * @type {?number}
     * @default null
    */
    minTranslateX: {
        get: function () {
            return this._minTranslateX;
        },
        set: function (value) {
            if (value !== null) {
                value = parseFloat(value);
            }

            if (this._minTranslateX !== value) {
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
     * The maximum value {@link translateX} can take. If set to null then
     * there is no maximum.
     * @type {?number}
     * @default null
     */
    maxTranslateX: {
        get: function () {
            return this._maxTranslateX;
        },
        set: function (value) {
            if (value !== null) {
                value = parseFloat(value);
            }

            if (this._maxTranslateX !== value) {
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
     * The minimum value {@link translateY} can take. If set to null then
     * there is no minimum.
     * @type {?number}
     * @default null
     */
    minTranslateY: {
        get: function () {
            return this._minTranslateY;
        },
        set: function (value) {
            if (value !== null) {
                value = parseFloat(value);
            }

            if (this._minTranslateY !== value) {
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
     * The maximum value {@link translateY} can take. If set to null then
     * there is no maximum.
     * @type {?number}
     * @default null
     */
    maxTranslateY: {
        get: function () {
            return this._maxTranslateY;
        },
        set: function (value) {
            if (value !== null) {
                value = parseFloat(value);
            }

            if (this._maxTranslateY !== value) {
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
     * Which axis translation is restricted to.
     *
     * Can be "vertical", "horizontal" or "both".
     * @type {string}
     * @default "both"
     */
    axis: {
        get: function () {
            return this._axis;
        },
        set: function (value) {
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
     * Invert direction of translation on both axes.
     *
     * This inverts the effect of cursor motion on both axes. For example
     * if set to true moving the mouse up will increase the value of
     * translateY instead of decreasing it.
     *
     * Depends on invertXAxis and invertYAxis.
     * @type {boolean}
     * @default false
    */
    invertAxis: {
        depends: ["invertXAxis", "invertYAxis"],
        get: function () {
            return (this._invertXAxis === this._invertYAxis) ? this._invertXAxis : null;
        },
        set: function (value) {
            this.invertXAxis = value;
            this.invertYAxis = value;
        }
    },

    _invertXAxis: {
        value: false
    },

    /**
     * Invert direction of translation along the X axis.
     *
     * This inverts the effect of left/right cursor motion on translateX.
     * @type {boolean}
     * @default false
     */
    invertXAxis: {
        get: function () {
            return this._invertXAxis;
        },
        set: function (value) {
            this._invertXAxis = !!value;
        }
    },

    _invertYAxis: {
        value: false
    },

    /**
     * Invert direction of translation along the Y axis.
     *
     * This inverts the effect of up/down cursor motion on translateX.
     * @type {boolean}
     * @default false
     */
    invertYAxis: {
        get: function () {
            return this._invertYAxis;
        },
        set: function (value) {
            this._invertYAxis = !!value;
        }
    },

    /**
     *  How fast the cursor has to be moving before translating starts. Only
     *  applied when another component has claimed the pointer.
     *  @type {number}
     *  @default 500
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
     * Whether to keep translating after the user has releases the cursor.
     * @type {boolean}
     * @default true
     */
    hasMomentum: {
        get: function () {
            return this._hasMomentum;
        },
        set: function (value) {
            this._hasMomentum = value ? true : false;
        }
    },

    __momentumDuration: {
        value: 650
    },

    _momentumDuration: {
        get: function () {
            return this.__momentumDuration;
        },
        set: function (value) {
            //jshint -W016
            this.__momentumDuration = isNaN(value) ? 1 : value >> 0;
            //jshint +W016
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
        value: function (x, y, target, timeStamp) {
            this.pointerStartEventPosition = {
                pageX: x,
                pageY: y,
                target: target,
                timeStamp: timeStamp
            };
            this._pointerX = x;
            this._pointerY = y;
            if (window.Touch) {
                this._element.addEventListener("touchend", this, true);
                this._element.addEventListener("touchcancel", this, true);
                this._element.addEventListener("touchmove", this, true);
                this._element.addEventListener("touchmove", this, false);
            } else {
                document.addEventListener("mouseup", this, true);
                this._element.addEventListener("mousemove", this, true);
            }
            if (this.isAnimating) {
                this.isAnimating = false;
                this._dispatchTranslateEnd();
            }
            this._isFirstMove = true;
        }
    },

    _observedPointer: {
        value: null
    },

    /**
     * Determines if the composer will call `preventDefault` on the DOM events it interprets.
     * @param {Event} The event
     * @returns {boolean} whether preventDefault should be called
     * @private
     **/
    _shouldPreventDefault: {
        value: function (event) {
            return !!event.target.tagName && TranslateComposer._NATIVE_ELEMENTS.indexOf(event.target.tagName) === -1 && !event.target.isContentEditable;
        }
    },

    /**
     * Handle the mousedown that bubbled back up from beneath the element
     * If nobody else claimed this pointer, we should handle it now
     * @function
     * @param {Event} event
     * @private
     */
    handleMousedown: {
        value: function (event) {
            if (!this.enabled) return;

            this._observedPointer = "mouse";

            if (event.button === 0 && !this.eventManager.componentClaimingPointer(this._observedPointer)) {
                this._start(event.clientX, event.clientY, event.target, event.timeStamp);
                this.eventManager.claimPointer(this._observedPointer, this);
            }
        }
    },

    captureMousemove: {
        value: function (event) {
            if (!this.enabled) return;

            if (this.eventManager.isPointerClaimedByComponent(this._observedPointer, this)) {
                event.preventDefault();
                if (this._isFirstMove) {
                    this._firstMove();
                } else {
                    this._move(event.clientX, event.clientY);
                }
            }
        }
    },

    captureMouseup: {
        value: function (event) {
            if (!this.enabled) return;

            this._end(event);
        }
    },

    _releaseInterest: { // unload??
        value: function () {

            if (window.Touch) {
                this._element.removeEventListener("touchend", this, true);
                this._element.removeEventListener("touchcancel", this, true);
                if (this._isFirstMove) {
                    //if we receive an end without ever getting a move
                    this._element.removeEventListener("touchmove", this, true);
                }
                this._element.removeEventListener("touchmove", this, false);
            } else {
                document.removeEventListener("mouseup", this, true);
                if (this._isFirstMove) {
                    this._element.removeEventListener("mousemove", this, true);
                } else {
                    document.removeEventListener("mousemove", this, true);
                }
            }

            if (this.eventManager.isPointerClaimedByComponent(this._observedPointer, this)) {
                this.eventManager.forfeitPointer(this._observedPointer, this);
            }
            this._observedPointer = null;
        }
    },

    captureTouchstart: {
        value: function (event) {
            if (!this.enabled) return;

            if (this._shouldPreventDefault(event)) {
                event.preventDefault();
            }

            // If already scrolling, ignore any new touchstarts
            if (this._observedPointer !== null && this.eventManager.isPointerClaimedByComponent(this._observedPointer, this)) {
                return;
            }

            if (event.targetTouches && event.targetTouches.length === 1) {
                this._observedPointer = event.targetTouches[0].identifier;
                this._start(event.targetTouches[0].clientX, event.targetTouches[0].clientY, event.targetTouches[0].target, event.timeStamp);
            }
        }
    },

    captureTouchmove: {
        value: function (event) {
            var timeToMove;
            if (!this.enabled) return;
            if (this.stealChildrenPointer && this._isAxisMovement(event.targetTouches[0])) {
                timeToMove = event.timeStamp - this.pointerStartEventPosition.timeStamp;
                if (timeToMove < this.stealChildrenPointerThreshold) {
                    this.eventManager.claimPointer(this._observedPointer, this);
                }
            }
        }
    },

    handleTouchmove: {
        value: function (event) {
            if (!this.enabled) return;

            var i = 0, len = event.changedTouches.length;
            while (i < len && event.changedTouches[i].identifier !== this._observedPointer) {
                i++;
            }

            if (i < len) {
                if (this._isFirstMove) {
                    // The first inner component in the hierarchy will
                    // claim the pointer if it wasn't claimed during
                    // capture phase.
                    if (!this.eventManager.componentClaimingPointer(this._observedPointer)) {
                        this.eventManager.claimPointer(this._observedPointer, this);
                    }
                }

                if (this.eventManager.isPointerClaimedByComponent(this._observedPointer, this)) {
                    event.preventDefault();
                    if (this._isFirstMove) {
                        this._firstMove();
                    } else {
                        this._move(event.changedTouches[i].clientX, event.changedTouches[i].clientY);
                    }
                } else {
                    // This component didn't claim the pointer so we stop
                    // listening for further movement.
                    this._releaseInterest();
                }
            }
        }
    },

    captureTouchend: {
        value: function (event) {
            if (!this.enabled) return;

            var i = 0, len = event.changedTouches.length;
            while (i < len && event.changedTouches[i].identifier !== this._observedPointer) {
                i++;
            }
            if (i < len) {
                this._end(event.changedTouches[i]);
            }
        }
    },

    captureTouchcancel: {
        value: function (event) {
            var i = 0, len = event.changedTouches.length;
            while (i < len && event.changedTouches[i].identifier !== this._observedPointer) {
                i++;
            }
            if (i < len) {
                this._cancel(event.changedTouches[i]);
            }
        }
    },

    _isAxisMovement: {
        value: function (event) {
            var velocity = event.velocity,
                lowerRight = 0.7853981633974483, // pi/4
                lowerLeft = 2.356194490192345, // 3pi/4
                upperLeft = -2.356194490192345, // 5pi/4
                upperRight = -0.7853981633974483, // 7pi/4
                isUp, isDown, isRight, isLeft,
                angle,
                dX, dY;

            if (this.axis === "both") {
                return true;
            }

            if (!velocity || 0 === velocity.speed || isNaN(velocity.speed)) {
                // If there's no speed then we calculate a vector from the
                // initial position to the current position.
                dX = this.pointerStartEventPosition.pageX - event.clientX;
                dY = this.pointerStartEventPosition.pageY - event.clientY;
                angle = Math.atan2(dY, dX);
            } else {
                angle = velocity.angle;
            }

            // The motion is with the grain of the element; we may want to see if we should claim the pointer
            if ("horizontal" === this.axis) {

                isRight = (angle <= lowerRight && angle >= upperRight);
                isLeft = (angle >= lowerLeft || angle <= upperLeft);

                if (isRight || isLeft) {
                    return true;
                }

            } else if ("vertical" === this.axis) {

                isUp = (angle <= upperRight && angle >= upperLeft);
                isDown = (angle >= lowerRight && angle <= lowerLeft);

                if (isUp || isDown) {
                    return true;
                }

            }

            return false;
        }
    },

    _translateEndTimeout: {
        value: null
    },

    captureWheel: {
        value: function () {
            if (!this.eventManager.componentClaimingPointer(this._WHEEL_POINTER)) {
                this.eventManager.claimPointer(this._WHEEL_POINTER, this.component);
            }
        }
    },

    handleWheel: {
        value: function (event) {
            if (!this.enabled) return;

            var self = this;

            // If this composers' component is claiming the "wheel" pointer then handle the event
            if (this.eventManager.isPointerClaimedByComponent(this._WHEEL_POINTER, this.component)) {
                var oldTranslateY = this._translateY;
                var deltaY = event.wheelDeltaY || -event.deltaY || 0;
                this._dispatchTranslateStart();
                this.translateY = this._translateY - ((deltaY * 20) / 120);
                this._dispatchTranslate();
                window.clearTimeout(this._translateEndTimeout);
                this._translateEndTimeout = window.setTimeout(function () {
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

    _firstMove: {
        value: function () {
            if (this._isFirstMove) {
                this._dispatchTranslateStart(this._translateX, this._translateY);
                this._isFirstMove = false;
                this.isMoving = true;
                //listen to the document for the rest of the move events
                if (window.Touch) {
                    this._element.removeEventListener("touchmove", this, true);
                } else {
                    document.addEventListener("mousemove", this, true);
                    this._element.removeEventListener("mousemove", this, true);
                }

            }
        }
    },

    _move: {
        value: function (x, y) {
            var pointerDelta;

            this._isSelfUpdate = true;
            if (this._axis !== "vertical") {
                pointerDelta = this._invertXAxis ? (this._pointerX - x) : (x - this._pointerX);
                this.translateX += pointerDelta * this._pointerSpeedMultiplier;
            }
            if (this._axis !== "horizontal") {
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
        value: function (x, p1x, p1y, p2x, p2y) {
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
        value: function (x, y) {
            var translateStartEvent = document.createEvent("CustomEvent");

            translateStartEvent.initCustomEvent("translateStart", true, true, null);
            translateStartEvent.translateX = x;
            translateStartEvent.translateY = y;
            // Event needs to be the same shape as the one in flow-translate-composer
            translateStartEvent.scroll = 0;
            translateStartEvent.pointer = this._observedPointer;
            this.dispatchEvent(translateStartEvent);
        }
    },

    _dispatchTranslateEnd: {
        value: function () {
            var translateEndEvent = document.createEvent("CustomEvent");

            translateEndEvent.initCustomEvent("translateEnd", true, true, null);
            translateEndEvent.translateX = this._translateX;
            translateEndEvent.translateY = this._translateY;
            // Event needs to be the same shape as the one in flow-translate-composer
            translateEndEvent.scroll = 0;
            this.dispatchEvent(translateEndEvent);
        }
    },

    _dispatchTranslateCancel: {
        value: function () {
            var translateCancelEvent = document.createEvent("CustomEvent");

            translateCancelEvent.initCustomEvent("translateCancel", true, true, null);
            translateCancelEvent.translateX = this._translateX;
            translateCancelEvent.translateY = this._translateY;
            // Event needs to be the same shape as the one in flow-translate-composer
            translateCancelEvent.scroll = 0;
            this.dispatchEvent(translateCancelEvent);
        }
    },

    _dispatchTranslate: {
        value: function () {
            var translateEvent = document.createEvent("CustomEvent");
            translateEvent.initCustomEvent("translate", true, true, null);
            translateEvent.translateX = this._translateX;
            translateEvent.translateY = this._translateY;
            // Event needs to be the same shape as the one in flow-translate-composer
            translateEvent.scroll = 0;
            translateEvent.pointer = this._observedPointer;
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
                    if (this.translateStrideX && (this.startStrideXTime === null) && ((this.__momentumDuration - t < this.translateStrideDuration) || (Math.abs(this.posX - this.endX) < this.translateStrideX * 0.75))) {
                        this.startStrideXTime = time;
                    }
                    if (this.translateStrideY && (this.startStrideYTime === null) && ((this.__momentumDuration - t < this.translateStrideDuration) || (Math.abs(this.posY - this.endY) < this.translateStrideY * 0.75))) {
                        this.startStrideYTime = time;
                    }
                } else {
                    this.animateMomentum = false;
                }
            }
            tmp = Math.round(this.endX / this.translateStrideX);
            if (this.startStrideXTime && (time - this.startStrideXTime > 0)) {
                if (time - this.startStrideXTime < this.translateStrideDuration) {
                    t = this._bezierTValue((time - this.startStrideXTime) / this.translateStrideDuration, 0.275, 0, 0.275, 1);
                    this.posX = this.posX * (1 - t) + (tmp *  this.translateStrideX) * t;
                    animateStride = true;
                } else {
                    this.posX = tmp * this.translateStrideX;
                }
            }
            tmp = Math.round(this.endY / this.translateStrideY);
            if (this.startStrideYTime && (time - this.startStrideYTime > 0)) {
                if (time - this.startStrideYTime < this.translateStrideDuration) {
                    t = this._bezierTValue((time - this.startStrideYTime) / this.translateStrideDuration, 0.275, 0, 0.275, 1);
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
            if (this._shouldDispatchTranslate) {
                this._dispatchTranslate();
            }
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
                if (this._axis !== "vertical") {
                    this.momentumX = event.velocity.x * this._pointerSpeedMultiplier * (this._invertXAxis ? 1 : -1);
                } else {
                    this.momentumX = 0;
                }
                if (this._axis !== "horizontal") {
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
                this.isMoving = false;
                // Only dispatch a translateEnd if a translate start has occured
                this._dispatchTranslateEnd();
            }
            this._releaseInterest();
        }
    },

    _cancel: {
        value: function (event) {

            this.startTime=Date.now();

            this.endX = this.posX = this.startX=this._translateX;
            this.endY=this.posY=this.startY=this._translateY;
            this.animateMomentum = false;

            if (!this._isFirstMove) {
                this.isMoving = false;
                // Only dispatch a translateCancel if a translate start has
                // occurred.
                this._dispatchTranslateCancel();
            }
            this._releaseInterest();
        }
    },

    surrenderPointer: {
        value: function (pointer, demandingComponent) {
            return ! this.isMoving &&
                demandingComponent.stealChildrenPointer &&
                // assuming that demanding component is a (great)*child
                demandingComponent.stealChildrenPointerThreshold <= this.stealChildrenPointerThreshold;
        }
    },

    eventManager: {
        get: function () {
            return defaultEventManager;
        }
    },

    load: {
        value: function () {
            if (window.Touch) {
                this._element.addEventListener("touchstart", this, true);
                this._element.addEventListener("touchstart", this, false);
            } else {
                this._element.addEventListener("mousedown", this, false);

                var wheelEventName;
                if (typeof window.onwheel !== "undefined" || typeof window.WheelEvent !== "undefined" ){
                    wheelEventName = "wheel";
                } else {
                    wheelEventName = "mousewheel";
                }
                this._element.addEventListener(wheelEventName, this, false);
                this._element.addEventListener(wheelEventName, this, true);
            }

            this.eventManager.isStoringPointerEvents = true;
        }
    },

    /*
     * Add an event listener to receive events generated by the
    * `TranslateComposer`.
     * @param {string} event type
     * @param {object|function} listener object or function
     * @param {boolean} use capture instead of bubble
     */
    addEventListener: {
        value: function (type, listener, useCapture) {
            Composer.addEventListener.call(this, type, listener, useCapture);
            if (type === "translate") {
                this._shouldDispatchTranslate = true;
            }
        }
    }

});

TranslateComposer.prototype.handleMousewheel = TranslateComposer.prototype.handleWheel;
TranslateComposer.prototype.captureMousewheel = TranslateComposer.prototype.captureWheel;

