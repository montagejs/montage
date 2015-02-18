var Montage = require("../../core/core").Montage,
    TranslateComposer = require("../../composer/translate-composer").TranslateComposer,
    defaultEventManager = require("../../core/event/event-manager").defaultEventManager,
    Point = require("../../core/geometry/point").Point,
    convertPointFromPageToNode = require("../../core/dom").convertPointFromPageToNode;

/**
 * @class FlowTranslateComposer
 * @extends TranslateComposer
 */
var FlowTranslateComposer = exports.FlowTranslateComposer = TranslateComposer.specialize( /** @lends FlowTranslateComposer# */ {

    constructor: {
        value: function FlowTranslateComposer() {
            this.super();
            this.handleMousewheel = this.handleWheel;
        }
    },

    stealChildrenPointer: {
        value: true
    },

    _linearScrollingVector: {
        value: [-300, 0]
    },

    /**
     * A constant 2d vector used to transform a drag vector into a scroll vector
     */
    linearScrollingVector: {
        get: function () {
            return this._linearScrollingVector;
        },
        set: function (value) {
            this._linearScrollingVector = value;
        }
    },

    // TODO doc
    /**
     */
    _startPageX: {
        value: null
    },

    // TODO doc
    /**
     */
    _startPageY: {
        value: null
    },

    // TODO doc
    /**
     */
    _pageX: {
        value: null
    },

    // TODO doc
    /**
     */
    _pageY: {
        value: null
    },

    // TODO doc
    /**
     */
    _pointerStartX: {
        value: null
    },

    // TODO doc
    /**
     */
    _pointerStartY: {
        value: null
    },

    // TODO doc
    /**
     */
    _contentOffsetX: {
        value: null
    },

    // TODO doc
    /**
     */
    _contentOffsetY: {
        value: null
    },

    _superStart: {
        value: TranslateComposer.prototype._start
    },

    // TODO doc
    /**
     */
    _start: {
        value: function (x, y, target, timeStamp) {
            this._superStart(x, y, target, timeStamp);

            // TODO: Review using getComputedStyle outside draw cycle
            var computedStyle = window.getComputedStyle(this._element, null),
                borderLeft = this.convertCssPixelsPropertyStringToNumber(computedStyle.getPropertyValue("border-left-width")),
                borderTop = this.convertCssPixelsPropertyStringToNumber(computedStyle.getPropertyValue("border-top-width")),
                paddingLeft = this.convertCssPixelsPropertyStringToNumber(computedStyle.getPropertyValue("padding-left")),
                paddingTop = this.convertCssPixelsPropertyStringToNumber(computedStyle.getPropertyValue("padding-top")),
                point = convertPointFromPageToNode(this._element, new Point().init(x, y));

            this._pointerStartX = this._pointerX = point.x - borderLeft - paddingLeft;
            this._pointerStartY = this._pointerY = point.y - borderTop - paddingTop;
            this._contentOffsetX = this._startPageX - this._pointerStartX;
            this._contentOffsetY = this._startPageY - this._pointerStartY;
            this._computePointedElement();
            this._startPageX = this._pageX = x;
            this._startPageY = this._pageY = y;
            this._startScroll = this._scroll;
            this._previousScrollDelta = 0;
            this._scrollEnd = null;
        }
    },

    // TODO doc
    /**
     */
    _analyzeMovement: {
        value: function (event) {
            var velocity = event.velocity,
                speed, dX, dY;

            if (!velocity) {
                return;
            }
            speed = velocity.speed;
            if (speed >= this.startTranslateSpeed) {
                this._stealPointer();
            } else {
                dX = this.startPageX - event.pageX;
                dY = this.startPageY - event.pageY;
                if (dX * dX + dY * dY > this.startTranslateRadius * this.startTranslateRadius) {
                    this._stealPointer();
                }
            }
        }
    },

    // TODO doc
    /**
     */
    _dispatchTranslateStart: {
        value: function (x, y) {
            var translateStartEvent = document.createEvent("CustomEvent");

            translateStartEvent.initCustomEvent("translateStart", true, true, null);
            translateStartEvent.scroll = this._scroll;
            translateStartEvent.translateX = 0;
            translateStartEvent.translateY = 0;
            translateStartEvent.pointer = this._observedPointer;
            this.dispatchEvent(translateStartEvent);
        }
    },

    // TODO doc
    /**
     */
    _dispatchTranslateEnd: {
        value: function () {
            var translateEndEvent = document.createEvent("CustomEvent");

            translateEndEvent.initCustomEvent("translateEnd", true, true, null);
            translateEndEvent.scroll = this._scroll;
            translateEndEvent.translateX = 0;
            translateEndEvent.translateY = 0;
            translateEndEvent.pointer = this._observedPointer;
            this.dispatchEvent(translateEndEvent);
        }
    },

    _dispatchTranslateCancel: {
        value: function () {
            var translateCancelEvent = document.createEvent("CustomEvent");

            translateCancelEvent.initCustomEvent("translateCancel", true, true, null);
            translateCancelEvent.scroll = this._scroll;
            translateCancelEvent.translateX = 0;
            translateCancelEvent.translateY = 0;
            translateCancelEvent.pointer = this._observedPointer;
            this.dispatchEvent(translateCancelEvent);
        }
    },

    // TODO doc
    /**
     */
    _dispatchTranslate: {
        value: function () {
            var translateEvent = document.createEvent("CustomEvent");
            translateEvent.initCustomEvent("translate", true, true, null);
            translateEvent.scroll = this._scroll;
            translateEvent.translateX = 0;
            translateEvent.translateY = 0;
            translateEvent.pointer = this._observedPointer;
            this.dispatchEvent(translateEvent);
        }
    },

    // TODO doc
    /**
     */
    _move: {
        value: function (x, y) {
            var pointerDelta;

            if (this._isFirstMove) {
                this._dispatchTranslateStart();
                this._isFirstMove = false;
            }
            this._pageX = x;
            this._pageY = y;
            this._updateLinearScroll();
            if (this._shouldDispatchTranslate) {
                this._dispatchTranslate();
            }
        }
    },

    // TODO doc
    /**
     */
    _end: {
        value: function (event) {
            /*this.startTime = Date.now();
            if (!this._isFirstMove) {
                this._dispatchTranslateEnd();
            }
            this._releaseInterest();*/
            if (this.eventManager.isPointerClaimedByComponent(this._observedPointer, this)) {
                this.startTime = Date.now();
                this.endX = this.startX = this._pageX;
                this.endY = this.startY = this._pageY;

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
                    this.endX = this.startX + (this.momentumX * this.__momentumDuration / 2000);
                    this.endY = this.startY + (this.momentumY * this.__momentumDuration / 2000);
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
            }
            this._releaseInterest();
        }
    },

    _translateEndTimeout: {
        value: null
    },

    _mousewheelStrideTimeout: {
        value: null
    },

    _previousDeltaY: {
        value: 0
    },

    // TODO Add wheel event listener for Firefox
    // TODO doc
    /**
     */
    handleWheel: {
        value: function (event) {
            var self = this;

            // If this composers' component is claiming the "wheel" pointer then handle the event
            if (this.eventManager.isPointerClaimedByComponent(this._WHEEL_POINTER, this.component)) {
                var oldPageY = this._pageY,
                    deltaY = event.wheelDeltaY || -event.deltaY || 0;

                if (this.translateStrideX) {
                    window.clearTimeout(this._mousewheelStrideTimeout);
                    if ((this._mousewheelStrideTimeout === null) || (Math.abs(deltaY) > Math.abs(this._previousDeltaY * (this._mousewheelStrideTimeout === null ? 2 : 4)))) {
                        if (deltaY > 1) {
                            this.callDelegateMethod("previousStride", this);
                        } else {
                            if (deltaY < -1) {
                                this.callDelegateMethod("nextStride", this);
                            }
                        }
                    }
                    this._mousewheelStrideTimeout = window.setTimeout(function () {
                        self._mousewheelStrideTimeout = null;
                        self._previousDeltaY = 0;
                    }, 70);
                    self._previousDeltaY = deltaY;
                    if (this._shouldPreventDefault(event)) {
                        event.preventDefault();
                    }
                } else {
                    if (this._translateEndTimeout === null) {
                        this._dispatchTranslateStart();
                    }
                    this._pageY = this._pageY + ((deltaY * 20) / 100);
                    this._updateScroll();
                    this._dispatchTranslate();
                    window.clearTimeout(this._translateEndTimeout);
                    this._translateEndTimeout = window.setTimeout(function () {
                        self._dispatchTranslateEnd();
                        self._translateEndTimeout = null;
                    }, 400);

                    // If we're not at one of the extremes (i.e. the scroll actually
                    // changed the translate) then we want to preventDefault to stop
                    // the page scrolling.
                    if (oldPageY !== this._pageY && this._shouldPreventDefault(event)) {
                        event.preventDefault();
                    }
                }
                this.eventManager.forfeitPointer(this._WHEEL_POINTER, this.component);
            }
        }
    },

    // TODO doc
    /**
     */
    _scroll: {
        value: 0
    },

    // TODO doc
    /**
     */
    scroll: {
        get: function () {
            return this._scroll;
        },
        set: function (value) {
            if ((this.minScroll !== null) && (value < this.minScroll)) {
                value = this.minScroll;
            }
            if ((this.maxScroll !== null) && (value > this.maxScroll)) {
                value = this.maxScroll;
            }
            this._scroll = value;
        }
    },

    // TODO doc
    /**
     */
    minScroll: {
        value: null
    },

    // TODO doc
    /**
     */
    maxScroll: {
        value: null
    },

    // TODO doc
    /**
     */
    _flow: {
        value: null
    },

    // TODO doc
    /**
     */
    flow: {
        get: function () {
            return this._flow;
        },
        set: function (value) {
            this._flow = value;
            this.component = value;
        }
    },

    // TODO doc
    /**
     */
    _updateScroll: {
        value: function () {
            this._updateLinearScroll();
        }
    },

    // TODO doc
    /**
     */
    _updateLinearScroll: {
        value: function () {
            var flow = this._flow,
                ratio = flow.isCameraEnabled ? 500 / flow._height : 1,
                x = ((this._pageX - this._startPageX) * this._linearScrollingVector[0] * ratio * flow._sceneScaleX.denominator) / flow._sceneScaleX.numerator,
                y = ((this._pageY - this._startPageY) * this._linearScrollingVector[1] * ratio * flow._sceneScaleY.denominator) / flow._sceneScaleY.numerator,
                squaredMagnitude = this._linearScrollingVector[0] * this._linearScrollingVector[0] + this._linearScrollingVector[1] * this._linearScrollingVector[1],
                scroll = (x + y) / squaredMagnitude;

            this.scroll += scroll - this._previousScrollDelta;
            this._previousScrollDelta = scroll;
        }
    },

    // TODO doc
    /**
     */
    frame: {
        value: function (timestamp) {
            if (this.isAnimating) {
                this._animationInterval();
            }
        }
    },

    // TODO doc
    /**
     */
    convertCssPixelsPropertyStringToNumber: {
        value: function (property) {
            if (typeof property === "string") {
                if (property.substr(-2) === "px") {
                    return property.substr(0, property.length - 2) * 1;
                } else {
                    return 0;
                }
            } else {
                return 0;
            }
        }
    },

    _rayPointDistance: {
        value: function (rayVector, point) {
            var dotProduct,
                magnitude,
                x, y, z;

            dotProduct = rayVector[0] * point[0] + rayVector[1] * point[1] + rayVector[2] * point[2];
            if (dotProduct >= 0) {
                magnitude = rayVector[0] * rayVector[0] + rayVector[1] * rayVector[1] + rayVector[2] * rayVector[2];
                dotProduct /= magnitude;
                x = rayVector[0] * dotProduct - point[0];
                y = rayVector[1] * dotProduct - point[1];
                z = rayVector[2] * dotProduct - point[2];
                return Math.sqrt(x * x + y * y + z * z);
            } else {
                // behind ray
                return false;
            }
        }
    },

    // TODO doc
    /**
     */
    _closerIndex: {
        value: null
    },

    // TODO doc
    /**
     */
    _computePointedElement: {
        value: function () {
            var splinePaths = this._flow._splinePaths,
                pathsLength = splinePaths.length;

            if (pathsLength) {
                var flow = this._flow,
                    vX = flow._viewpointTargetPoint[0] - flow._viewpointPosition[0],
                    vZ = flow._viewpointTargetPoint[2] - flow._viewpointPosition[2],
                    yAngle = Math.atan2(vX, vZ),
                    tmpZ = vZ * Math.cos(-yAngle) - vX * Math.sin(-yAngle),
                    xAngle = Math.atan2(flow._viewpointTargetPoint[1] - flow._viewpointPosition[1], tmpZ),
                    x2 = this._element.clientWidth * .5 - this._pointerX,
                    y2 = this._pointerY - this._element.clientHeight * .5,
                    perspective = (this._element.offsetHeight * .5) / Math.tan((flow._viewpointFov * flow._doublePI) * (1 / 720)),
                    z2, tmp,
                    splines = [],
                    visibleIndexes = flow._visibleIndexes,
                    length = visibleIndexes.length,
                    pathIndex,
                    slideIndex,
                    slideTime,
                    scale = flow._sceneScale,
                    closerIndex = null,
                    closerTime = null,
                    minDistance = 1e100,
                    distance,
                    indexTime,
                    rotation,
                    corner,
                    edge1,
                    edge2,
                    rayVector,
                    offset,
                    i;

                tmp = perspective * Math.cos(xAngle) - y2 * Math.sin(xAngle);
                y2 = perspective * Math.sin(xAngle) + y2 * Math.cos(xAngle);
                z2 = tmp * Math.cos(yAngle) - x2 * Math.sin(yAngle);
                x2 = tmp * Math.sin(yAngle) + x2 * Math.cos(yAngle);
                rayVector = [x2, y2, z2];
                for (i = 0; i < splinePaths.length; i++) {
                    for (i = 0; i < splinePaths.length; i++) {
                        splines[i] = splinePaths[i].transform([
                            scale.x.numerator / scale.x.denominator, 0, 0, 0,
                            0, scale.y.numerator / scale.y.denominator, 0, 0,
                            0, 0, scale.z.numerator / scale.z.denominator, 0,
                            -flow._viewpointPosition[0] + flow._firstIterationWidth * .5 + flow._firstIterationOffsetLeft,
                            -flow._viewpointPosition[1] + flow._firstIterationHeight * .5 + flow._firstIterationOffsetTop,
                            -flow._viewpointPosition[2],
                            1
                        ]);
                    }
                }
                for (i = 0; i < length; i++) {
                    offset = this._flow.offset(visibleIndexes[i]);
                    pathIndex = offset.pathIndex;
                    slideTime = offset.slideTime;
                    indexTime = splines[pathIndex]._convertSplineTimeToBezierIndexTime(slideTime);
                    if (indexTime !== null) {
                        pos = splines[pathIndex].getPositionAtIndexTime(indexTime);
                        distance = this._rayPointDistance(rayVector, pos);
                        if (distance !== false) {
                            if (distance < minDistance) {
                                minDistance = distance;
                                closerIndex = visibleIndexes[i];
                            }
                        }
                    }
                }
                this._closerIndex = closerIndex;
            }
        }
    },

    // TODO
    /**
     */
    _previousScrollDelta: {
        value: 0
    },

    // TODO
    /**
     */
    _startScroll: {
        value: 0
    },

    // TODO doc
    /**
     */
    _translateStride: {
        value: null
    },

    // TODO doc
    /**
     */
    translateStride: {
        get: function () {
            return this._translateStride;
        },
        set: function (value) {
            this._translateStride = value;
            this.translateStrideX = value;
        }
    },

    // TODO doc
    /**
     */
    _scrollEnd: {
        value: null
    },

    // TODO doc
    /**
     */
    _scrollStart: {
        value: null
    },

    // TODO doc
    /**
     */
    _hasMomentum: {
        value: true
    },

    isLimitedToSingleStride: {
        value: false
    },

    // TODO doc
    /**
     */
    _animationInterval: {
        value: function () {
            var time = Date.now(), t, t2, tmp, tmpX, tmpY, animateStride = false, scroll, min, max;

            min = this.minScroll;
            max = this.maxScroll;
            this.minScroll = null;
            this.maxScroll = null;
            if (this._scrollEnd === null) {
                this._scrollStart = this.scroll;
                this._pageX = this.endX;
                this._pageY = this.endY;
                this._updateScroll();
                this._scrollEnd = this.scroll;
                if (this.isLimitedToSingleStride && this.translateStrideX) {
                    if (this._scrollEnd > Math.floor(this._scrollStart) + this.translateStrideX) {
                        this._scrollEnd = Math.floor(this._scrollStart) + this.translateStrideX;
                    }
                    if (this._scrollEnd < Math.ceil(this._scrollStart) - this.translateStrideX) {
                        this._scrollEnd = Math.ceil(this._scrollStart) - this.translateStrideX;
                    }
                }
                this._pageX = this.startX;
                this._pageY = this.startY;
                this._updateScroll();
            }
            if (this.animateMomentum) {
                t = time - this.startTime;
                if (t < this.__momentumDuration) {
                    this._pageX = this.startX + ((this.momentumX+this.momentumX*(this.__momentumDuration-t)/this.__momentumDuration)*t/1000)/2;
                    this._pageY = this.startY + ((this.momentumY+this.momentumY*(this.__momentumDuration-t)/this.__momentumDuration)*t/1000)/2;
                    this._updateScroll();
                    if (this.translateStrideX && (this.startStrideXTime === null) && ((this.__momentumDuration - t < this.translateStrideDuration) || (Math.abs(this.scroll - this._scrollEnd) < this.translateStrideX * .75))) {
                        this.startStrideXTime = time;
                        this._strideStartScroll = this._scroll;
                    }
                } else {
                    this.animateMomentum = false;
                }
            } else {
                if (this.startStrideXTime === null) {
                    this.startStrideXTime = this.startTime;
                    this._strideStartScroll = this._scrollStart;
                }
            }
            scroll = this.scroll;
            if (this.startStrideXTime && (time - this.startStrideXTime > 0)) {
                tmp = Math.round(this._scrollEnd / this.translateStrideX);
                if (time - this.startStrideXTime < this.translateStrideDuration) {
                    t = this._bezierTValue((time - this.startStrideXTime) / this.translateStrideDuration, .275, 0, .275, 1);
                    t2 = (time - this.startStrideXTime) / this.translateStrideDuration;
                    scroll = scroll * (1 - t2) + ((tmp *  this.translateStrideX) * t + (this._strideStartScroll) * (1 - t)) * t2;
                    animateStride = true;
                } else {
                    scroll = tmp * this.translateStrideX;
                    this.animateMomentum = false;
                }
            }
            this.minScroll = min;
            this.maxScroll = max;
            if (scroll < min) {
                scroll = min;
                this.animateMomentum = false;
                animateStride = false;
            }
            if (scroll > max) {
                scroll = max;
                this.animateMomentum = false;
                animateStride = false;
            }
            this.scroll = scroll;
            this.isAnimating = this.animateMomentum || animateStride;
            if (this.isAnimating) {
                this.needsFrame=true;
            } else {
                this._dispatchTranslateEnd();
                this._scrollEnd = null;
            }
        }
    }

});
