var Montage = require("montage").Montage,
    TranslateComposer = require("composer/translate-composer").TranslateComposer,
    defaultEventManager = require("core/event/event-manager").defaultEventManager,
    Point = require("core/geometry/point").Point,
    convertPointFromPageToNode = require("core/dom").convertPointFromPageToNode;

// TODO doc
/**
 */
var FlowTranslateComposer = exports.FlowTranslateComposer = TranslateComposer.specialize( {

    constructor: {
        value: function FlowTranslateComposer() {
            this.super();
        }
    },

    _scrollingMode: {
        value: "linear"
    },

    /**
     * One of "linear" or "drag".
     *
     * Bound to the eponymous property of the Flow that owns it.
     *
     * Drag mode is an experiment to preserve the dragged slide's
     * position relative to the gesture pointer.  Since this feature is
     * not yet ready, "linear" is the default.
     */
    scrollingMode: {
        get: function () {
            return this._scrollingMode;
        },
        set: function (value) {
            switch (value) {
                case "linear":
                case "drag":
                    this._scrollingMode = value;
                    break;
            }
        }
    },

    _linearScrollingVector: {
        value: [-300, 0]
    },

    /**
     * A constant 2d vector used to transform a drag vector into a
     * scroll vector, applicable only in the "linear"
     * <code>scrollingMode</code>.
     *
     * Bound to the eponymous property of the Flow that owns it.
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

    // TODO doc
    /**
     */
    _start: {
        value: function(x, y) {
            TranslateComposer._start.apply(this, arguments);
            //if (this._scrollingMode === "drag") {
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
                // TODO @romancortes, should this be here? @kriskowal
                this._computePointedElement();
            //}
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
        value: function(event) {
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
        value: function(x, y) {
            var translateStartEvent = document.createEvent("CustomEvent");

            translateStartEvent.initCustomEvent("translateStart", true, true, null);
            translateStartEvent.scroll = this._scroll;
            translateStartEvent.translateX = 0;
            translateStartEvent.translateY = 0;
            this.dispatchEvent(translateStartEvent);
        }
    },

    // TODO doc
    /**
     */
    _dispatchTranslateEnd: {
        value: function() {
            var translateEndEvent = document.createEvent("CustomEvent");

            translateEndEvent.initCustomEvent("translateEnd", true, true, null);
            translateEndEvent.scroll = this._scroll;
            translateEndEvent.translateX = 0;
            translateEndEvent.translateY = 0;
            this.dispatchEvent(translateEndEvent);
        }
    },

    // TODO doc
    /**
     */
    _dispatchTranslate: {
        value: function() {
            var translateEvent = document.createEvent("CustomEvent");
            translateEvent.initCustomEvent("translate", true, true, null);
            translateEvent.scroll = this._scroll;
            translateEvent.translateX = 0;
            translateEvent.translateY = 0;
            this.dispatchEvent(translateEvent);
        }
    },

    // TODO doc
    /**
     */
    _move: {
        value: function(x, y) {
            var pointerDelta;

            if (this._isFirstMove) {
                this._dispatchTranslateStart();
                this._isFirstMove = false;
            }
            this._pageX = x;
            this._pageY = y;
            if (this._scrollingMode === "drag") {
                this._pointerX = x - this._contentOffsetX;
                this._pointerY = y - this._contentOffsetY;
                this._updateDragScroll();
            } else {
                this._updateLinearScroll();
            }
            if (this._closerIndex !== null) {

            }
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
    handleMousewheel: {
        value: function(event) {
            var self = this;

            // If this composers' component is claiming the "wheel" pointer then handle the event
            if (this.eventManager.isPointerClaimedByComponent(this._WHEEL_POINTER, this.component)) {
                var oldPageY = this._pageY;

                if (this.translateStrideX) {
                    window.clearTimeout(this._mousewheelStrideTimeout);
                    if ((this._mousewheelStrideTimeout === null) || (Math.abs(event.wheelDeltaY) > Math.abs(this._previousDeltaY * (this._mousewheelStrideTimeout === null ? 2 : 4)))) {
                        if (event.wheelDeltaY > 1) {
                            this.callDelegateMethod("previousStride", this);
                        } else {
                            if (event.wheelDeltaY < -1) {
                                this.callDelegateMethod("nextStride", this);
                            }
                        }
                    }
                    this._mousewheelStrideTimeout = window.setTimeout(function() {
                        self._mousewheelStrideTimeout = null;
                        self._previousDeltaY = 0;
                    }, 70);
                    self._previousDeltaY = event.wheelDeltaY;
                    if (this._shouldPreventDefault(event)) {
                        event.preventDefault();
                    }
                } else {
                    if (this._translateEndTimeout === null) {
                        this._dispatchTranslateStart();
                    }
                    this._pageY = this._pageY + ((event.wheelDeltaY * 20) / 100);
                    this._updateScroll();
                    this._dispatchTranslate();
                    window.clearTimeout(this._translateEndTimeout);
                    this._translateEndTimeout = window.setTimeout(function() {
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
            if (this._scrollingMode === "linear") {
                this._updateLinearScroll();
            } else {
                this._updateDragScroll();
            }
        }
    },

    // TODO doc
    /**
     */
    _updateLinearScroll: {
        value: function () {
            var ratio = 500 / this._flow._height,
                x = (this._pageX - this._startPageX) * this._linearScrollingVector[0] * ratio,
                y = (this._pageY - this._startPageY) * this._linearScrollingVector[1] * ratio,
                squaredMagnitude = this._linearScrollingVector[0] * this._linearScrollingVector[0] + this._linearScrollingVector[1] * this._linearScrollingVector[1],
                scroll = (x + y) / squaredMagnitude;

            this.scroll += scroll - this._previousScrollDelta;
            this._previousScrollDelta = scroll;
        }
    },

    // TODO doc
    /**
     */
    _updateDragScroll: {
        value: function () {
            var x = (this._pointerX - this._pointerStartX) * this._lineVectorX,
                y = (this._pointerY - this._pointerStartY) * this._lineVectorY,
                squaredMagnitude = this._lineVectorX * this._lineVectorX + this._lineVectorY * this._lineVectorY,
                scroll = (x + y) / squaredMagnitude;

            this.scroll += scroll - this._previousScrollDelta;
            this._previousScrollDelta = scroll;

            var flow = this._flow,
                cameraPosition = flow._cameraPosition,
                splinePaths = flow._splinePaths,
                pathsLength = splinePaths.length,
                pathIndex = this._closerIndex % pathsLength,
                spline = this.flow._splinePaths[pathIndex],
                slideTime = Math.floor(this._closerIndex / pathsLength) - this._scroll + this._flow._paths[pathIndex].headOffset,
                position,
                x2, y2, z2, y3, z3,
                minL, minR,
                bestL = null,
                bestR = null,
                best = 0,
                dist,
                indexTime,
                width = this._element.clientWidth * .5,
                height = this._element.clientHeight * .5,
                x = width - this._pointerX,
                y = height - this._pointerY,
                vX = flow.cameraTargetPoint[0] - cameraPosition[0],
                vY = flow.cameraTargetPoint[1] - cameraPosition[1],
                vZ = flow.cameraTargetPoint[2] - cameraPosition[2],
                yAngle = -Math.atan2(vX, vZ),
                tmpZ,
                xAngle,
                intersection = this._pointerIntersectionPosition,
                point,
                perspective, invZ,
                sinY, cosY, sinX, cosX,
                i;

            tmpZ = vZ * Math.cos(yAngle) - vX * Math.sin(yAngle);
            xAngle = -Math.atan2(vY, tmpZ);
            sinY = Math.sin(yAngle);
            cosY = Math.cos(yAngle);
            sinX = Math.sin(xAngle);
            cosX = Math.cos(xAngle);
            perspective = height / Math.tan(flow.cameraFov * .008726646259972); // pi / 360

            i = 0;
            minL = 1e100;
            do {
                indexTime = spline._convertSplineTimeToBezierIndexTime(slideTime + i);
                if (indexTime !== null) {
                    position = spline.getPositionAtIndexTime(indexTime);
                    rotation = splinePaths[pathIndex].getRotationAtIndexTime(indexTime);
                    point = this._rotateXYZ(intersection, rotation);
                    x2 = (cameraPosition[2] - position[2] - point[2]) * sinY - (position[0] - cameraPosition[0] + point[0]) * cosY;
                    y2 = position[1] - cameraPosition[1] + point[1];
                    z2 = (position[2] - cameraPosition[2] + point[2]) * cosY - (position[0] - cameraPosition[0] + point[0]) * sinY;
                    y3 = z2 * sinX + y2 * cosX;
                    z3 = z2 * cosX - y2 * sinX;
                    invZ = perspective / z3; // division by zero ?
                    x2 =  x + x2 * invZ;
                    y2 =  y + y3 * invZ;
                    dist = x2 * x2 + y2 * y2;
                    if (dist < minL) {
                        minL = dist;
                        bestL = i;
                    }
                }
                i -= .025;
            } while (i > -6);
            if (bestL + .025 > 0) {
                bestL = -.025;
            }
            i = bestL + .025;
            minL = 1e100;
            do {
                indexTime = spline._convertSplineTimeToBezierIndexTime(slideTime + i);
                if (indexTime !== null) {
                    position = spline.getPositionAtIndexTime(indexTime);
                    rotation = splinePaths[pathIndex].getRotationAtIndexTime(indexTime);
                    point = this._rotateXYZ(intersection, rotation);
                    x2 = (cameraPosition[2] - position[2] - point[2]) * sinY - (position[0] - cameraPosition[0] + point[0]) * cosY;
                    y2 = position[1] - cameraPosition[1] + point[1];
                    z2 = (position[2] - cameraPosition[2] + point[2]) * cosY - (position[0] - cameraPosition[0] + point[0]) * sinY;
                    y3 = z2 * sinX + y2 * cosX;
                    z3 = z2 * cosX - y2 * sinX;
                    invZ = perspective / z3; // division by zero ?
                    x2 =  x + x2 * invZ;
                    y2 =  y + y3 * invZ;
                    dist = x2 * x2 + y2 * y2;
                    if (dist < minL) {
                        minL = dist;
                        bestL = i;
                    }
                }
                i -= .0002;
            } while (i > bestL - .05);
            i = 0;
            minR = 1e100;
            do {
                indexTime = spline._convertSplineTimeToBezierIndexTime(slideTime + i);
                if (indexTime !== null) {
                    position = spline.getPositionAtIndexTime(indexTime);
                    rotation = splinePaths[pathIndex].getRotationAtIndexTime(indexTime);
                    point = this._rotateXYZ(intersection, rotation);
                    x2 = (cameraPosition[2] - position[2] - point[2]) * sinY - (position[0] - cameraPosition[0] + point[0]) * cosY;
                    y2 = position[1] - cameraPosition[1] + point[1];
                    z2 = (position[2] - cameraPosition[2] + point[2]) * cosY - (position[0] - cameraPosition[0] + point[0]) * sinY;
                    y3 = z2 * sinX + y2 * cosX;
                    z3 = z2 * cosX - y2 * sinX;
                    invZ = perspective / z3; // division by zero ?
                    x2 =  x + x2 * invZ;
                    y2 =  y + y3 * invZ;
                    dist = x2 * x2 + y2 * y2;
                    if (dist < minR) {
                        minR = dist;
                        bestR = i;
                    }
                }
                i += .025;
            } while (i < 6);
            if (bestR - .025 < 0) {
                bestR = .025;
            }
            i = bestR - .025;
            minR = 1e100;
            do {
                indexTime = spline._convertSplineTimeToBezierIndexTime(slideTime + i);
                if (indexTime !== null) {
                    position = spline.getPositionAtIndexTime(indexTime);
                    rotation = splinePaths[pathIndex].getRotationAtIndexTime(indexTime);
                    point = this._rotateXYZ(intersection, rotation);
                    x2 = (cameraPosition[2] - position[2] - point[2]) * sinY - (position[0] - cameraPosition[0] + point[0]) * cosY;
                    y2 = position[1] - cameraPosition[1] + point[1];
                    z2 = (position[2] - cameraPosition[2] + point[2]) * cosY - (position[0] - cameraPosition[0] + point[0]) * sinY;
                    y3 = z2 * sinX + y2 * cosX;
                    z3 = z2 * cosX - y2 * sinX;
                    invZ = perspective / z3; // division by zero ?
                    x2 =  x + x2 * invZ;
                    y2 =  y + y3 * invZ;
                    dist = x2 * x2 + y2 * y2;
                    if (dist < minR) {
                        minR = dist;
                        bestR = i;
                    }
                }
                i += .0002;
            } while (i < bestR + .05);
            if (bestL) {
                if (bestR) {
                    if (bestL * bestL < bestR * bestR) {
                        best = bestL;
                    } else {
                        best = bestR;
                    }
                } else {
                    best = bestL;
                }
            } else {
                if (bestR) {
                    best = bestR;
                }
            }
            if (best > 0) {
                if (best <= .05) {
                    this.scroll = this._scroll - best;
                }
            } else {
                if (best >= -.05) {
                    this.scroll = this._scroll - best;
                }
            }
        }
    },

    // TODO doc
    /**
     */
    frame: {
        value: function(timestamp) {
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

    /**
     * Intersects a ray with origin at (0, 0, 0) and its given direction
     * vector with a parallelogram/rectangle defined by a corner vertex
     * and two edge vectors.  It returns false if there is no
     * intersection in front of the ray, or the distance to the
     * intersection as rayVector units/multiplier (a normalized
     * rayVector will return euclidean distance).
     *
     * The code has been speed optimized by inlining cross and dot
     * product functions.
    */
    _rayRectangleIntersection: {
        value: function (rayVector, rectangleCornerVertex, rectangleVector1, rectangleVector2) {
            var pX = rayVector[1] * rectangleVector2[2] - rayVector[2] * rectangleVector2[1], // p = cross(rayVector, rectangleVector2)
                pY = rayVector[2] * rectangleVector2[0] - rayVector[0] * rectangleVector2[2],
                pZ = rayVector[0] * rectangleVector2[1] - rayVector[1] * rectangleVector2[0],
                determinant = rectangleVector1[0] * pX + rectangleVector1[1] * pY + rectangleVector1[2] * pZ, // dot(rectangleVector1, p)
                epsilon = 1e-10,
                u, v, t = false,
                qX, qY, qZ;

            if (determinant < -epsilon) {

                // u = -cross(rectangleCornerVertex, p)
                u = -rectangleCornerVertex[0] * pX - rectangleCornerVertex[1] * pY - rectangleCornerVertex[2] * pZ;

                if ((u < 0) && (u > determinant)) {

                    // q = cross(rectangleVector1, rectangleCornerVertex)
                    qX = rectangleVector1[1] * rectangleCornerVertex[2] - rectangleVector1[2] * rectangleCornerVertex[1];
                    qY = rectangleVector1[2] * rectangleCornerVertex[0] - rectangleVector1[0] * rectangleCornerVertex[2];
                    qZ = rectangleVector1[0] * rectangleCornerVertex[1] - rectangleVector1[1] * rectangleCornerVertex[0];

                    // v = dot(rayVector, q)
                    v = rayVector[0] * qX + rayVector[1] * qY + rayVector[2] * qZ;

                    if ((v < 0) && (v > determinant)) {

                        // t = dot(rectangleVector2, q)
                        t = (rectangleVector2[0] * qX + rectangleVector2[1] * qY + rectangleVector2[2] * qZ) / determinant;

                        if (t < 0) { // Discard rectangles intersected behind the ray
                            t = false;
                        }
                    }
                }
            } else {
                if (determinant > epsilon) {
                    u = -rectangleCornerVertex[0] * pX - rectangleCornerVertex[1] * pY - rectangleCornerVertex[2] * pZ;
                    if ((u > 0) && (u < determinant)) {
                        qX = rectangleVector1[1] * rectangleCornerVertex[2] - rectangleVector1[2] * rectangleCornerVertex[1];
                        qY = rectangleVector1[2] * rectangleCornerVertex[0] - rectangleVector1[0] * rectangleCornerVertex[2];
                        qZ = rectangleVector1[0] * rectangleCornerVertex[1] - rectangleVector1[1] * rectangleCornerVertex[0];
                        v = rayVector[0] * qX + rayVector[1] * qY + rayVector[2] * qZ;
                        if ((v > 0) && (v < determinant)) {
                            t = (rectangleVector2[0] * qX + rectangleVector2[1] * qY + rectangleVector2[2] * qZ) / determinant;
                            if (t < 0) {
                                t = false;
                            }
                        }
                    }
                }
            }
            return t;
        }
    },

    /**
     * Same as _rayRectangleIntersection but returns the intersection
     * position relative to the rectangle It assumes intersection was
     * found previously with _rayRectangleIntersection and so several
     * checkings have been removed for speed reasons
     */
    _rayRectangleIntersectionPosition: {
        enumerable: false,
        value: function (rayVector, rectangleCornerVertex, rectangleVector1, rectangleVector2) {
            var pX = rayVector[1] * rectangleVector2[2] - rayVector[2] * rectangleVector2[1],
                pY = rayVector[2] * rectangleVector2[0] - rayVector[0] * rectangleVector2[2],
                pZ = rayVector[0] * rectangleVector2[1] - rayVector[1] * rectangleVector2[0],
                determinant = rectangleVector1[0] * pX + rectangleVector1[1] * pY + rectangleVector1[2] * pZ,
                boundingBox = this._flow._boundingBoxSize,
                u, v, qX, qY, qZ;

            u = -rectangleCornerVertex[0] * pX - rectangleCornerVertex[1] * pY - rectangleCornerVertex[2] * pZ;
            qX = rectangleVector1[1] * rectangleCornerVertex[2] - rectangleVector1[2] * rectangleCornerVertex[1];
            qY = rectangleVector1[2] * rectangleCornerVertex[0] - rectangleVector1[0] * rectangleCornerVertex[2];
            qZ = rectangleVector1[0] * rectangleCornerVertex[1] - rectangleVector1[1] * rectangleCornerVertex[0];
            v = rayVector[0] * qX + rayVector[1] * qY + rayVector[2] * qZ;
            return [u * boundingBox[0] / determinant - boundingBox[0] * .5, v * boundingBox[1] / determinant - boundingBox[1] * .5, 0];
        }
    },

    // TODO doc
    /**
     */
    _rotateXYZ: {
        enumerable: false,
        value: function (vector, angles) {
            var cosX = Math.cos(angles[0]),
                sinX = Math.sin(angles[0]),
                cosY = Math.cos(angles[1]),
                sinY = Math.sin(angles[1]),
                cosZ = Math.cos(angles[2]),
                sinZ = Math.sin(angles[2]),
                x, y, z,
                x2;

            y = cosX * vector[1] - sinX * vector[2];
            z = sinX * vector[1] + cosX * vector[2];
            x2 = cosY * vector[0] + sinY * z;
            z = -sinY * vector[0] + cosY * z;
            x = cosZ * x2 - sinZ * y;
            y = sinZ * x2 + cosZ * y;
            return [x, y, z];
        }
    },

    // TODO doc
    /**
     */
    _pointerIntersectionPosition: {
        enumerable: false,
        value: null
    },

    // TODO doc
    /**
     */
    _closerIndex: {
        enumerable: false,
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
                    vX = flow.cameraTargetPoint[0] - flow.cameraPosition[0],
                    vZ = flow.cameraTargetPoint[2] - flow.cameraPosition[2],
                    yAngle = Math.atan2(vX, vZ),
                    tmpZ = vZ * Math.cos(-yAngle) - vX * Math.sin(-yAngle),
                    xAngle = Math.atan2(flow.cameraTargetPoint[1] - flow.cameraPosition[1], tmpZ),
                    x2 = this._element.clientWidth * .5 - this._pointerX,
                    y2 = this._pointerY - this._element.clientHeight * .5,
                    perspective = (this._element.offsetHeight * .5) / Math.tan((flow.cameraFov * flow._doublePI) * (1 / 720)),
                    z2, tmp,
                    splines = [],
                    visibleIndexes = flow._visibleIndexes,
                    length = visibleIndexes.length,
                    pathIndex,
                    slideIndex,
                    slideTime,
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
                    splines[i] = splinePaths[i].transform([
                        1, 0, 0, 0,
                        0, 1, 0, 0,
                        0, 0, 1, 0,
                        -flow.cameraPosition[0], -flow.cameraPosition[1], -flow.cameraPosition[2], 1
                    ]);
                }
                for (i = 0; i < length; i++) {
                    offset = this._flow.offset(visibleIndexes[i]);
                    pathIndex = offset.pathIndex;
                    slideTime = offset.slideTime;
                    indexTime = splines[pathIndex]._convertSplineTimeToBezierIndexTime(slideTime);
                    if (indexTime !== null) {
                        pos = splines[pathIndex].getPositionAtIndexTime(indexTime);
                        rotation = splinePaths[pathIndex].getRotationAtIndexTime(indexTime);
                        edge1 = this._rotateXYZ([flow.boundingBoxSize[0], 0, 0], rotation);
                        edge2 = this._rotateXYZ([0, flow.boundingBoxSize[1], 0], rotation);
                        corner = [
                            pos[0] - (edge1[0] + edge2[0]) * .5,
                            pos[1] - (edge1[1] + edge2[1]) * .5,
                            pos[2] - (edge1[2] + edge2[2]) * .5
                        ];
                        if (distance = this._rayRectangleIntersection(rayVector, corner, edge1, edge2)) {
                            if (distance < minDistance) {
                                minDistance = distance;
                                closerIndex = visibleIndexes[i];
                                this._pointerIntersectionPosition = this._rayRectangleIntersectionPosition(rayVector, corner, edge1, edge2);
                            }
                        }
                    }
                }
                this._closerIndex = closerIndex;
                if (closerIndex !== null) {
                    //this.test();
                }
            }
        }
    },

    // TODO This test function is from a previous iteration of Flow.  I
    // need to re-read and analyze it before removing it, as I don't
    // remember what it is doing. - @romancortes
    /**
     * @private
     */
    test: {
        enumerable: false,
        value: function () {
            var flow = this._flow,
                bezierValue = this._bezierValue,
                vX = flow.cameraTargetPoint[0] - flow.cameraPosition[0],
                vY = flow.cameraTargetPoint[1] - flow.cameraPosition[1],
                vZ = flow.cameraTargetPoint[2] - flow.cameraPosition[2],
                yAngle = Math.atan2(vX, vZ),
                tmpZ,
                xAngle,
                t,
                x2, y2, z2, x3, y3, z3, perspective,
                x = this._pointerX,
                y = this._pointerY;

            tmpZ = vZ * Math.cos(-yAngle) - vX * Math.sin(-yAngle);
            xAngle = Math.atan2(vY, tmpZ);
            x2 = this._element.clientWidth * .5 - x;
            y2 = y - this._element.clientHeight * .5;
            perspective = z2 = (this._element.offsetHeight * .5) / Math.tan((flow.cameraFov * flow._doublePI) * (1 / 720));
            z3 = z2 * Math.cos(xAngle) - y2 * Math.sin(xAngle);
            y3 = z2 * Math.sin(xAngle) + y2 * Math.cos(xAngle);
            x3 = x2;
            z2 = z3 * Math.cos(yAngle) - x3 * Math.sin(yAngle);
            x2 = z3 * Math.sin(yAngle) + x3 * Math.cos(yAngle);
            y2 = y3;
            this.t = t = this._raycastBezierTubes( // review
                flow._cameraPosition[0],
                flow._cameraPosition[1],
                flow._cameraPosition[2],
                this._computeRotationValuesToXAxis(
                    x2,
                    y2,
                    z2
                )
            );
            if (t[0] !== null) {
                var bz = [
                        flow._splinePaths[t[0]]._knots[t[1]][0] - flow._cameraPosition[0],
                        flow._splinePaths[t[0]]._knots[t[1]][1] - flow._cameraPosition[1],
                        flow._splinePaths[t[0]]._knots[t[1]][2] - flow._cameraPosition[2],
                        flow._splinePaths[t[0]]._nextHandlers[t[1]][0] - flow._cameraPosition[0],
                        flow._splinePaths[t[0]]._nextHandlers[t[1]][1] - flow._cameraPosition[1],
                        flow._splinePaths[t[0]]._nextHandlers[t[1]][2] - flow._cameraPosition[2],
                        flow._splinePaths[t[0]]._previousHandlers[t[1] + 1][0] - flow._cameraPosition[0],
                        flow._splinePaths[t[0]]._previousHandlers[t[1] + 1][1] - flow._cameraPosition[1],
                        flow._splinePaths[t[0]]._previousHandlers[t[1] + 1][2] - flow._cameraPosition[2],
                        flow._splinePaths[t[0]]._knots[t[1] + 1][0] - flow._cameraPosition[0],
                        flow._splinePaths[t[0]]._knots[t[1] + 1][1] - flow._cameraPosition[1],
                        flow._splinePaths[t[0]]._knots[t[1] + 1][2] - flow._cameraPosition[2]
                    ],
                    bz2 = [],
                    x2, y2, z2,
                    x3, y3, z3,
                    dx, md, c,
                    density,
                    i;

                // Optimize Math.sin/cos
                for (i = 0; i < 12; i += 3) {
                    bz2[0] = bz[i + 2] * Math.sin(-yAngle) + bz[i] * Math.cos(-yAngle);
                    bz2[1] = bz[i + 1];
                    bz2[2] = bz[i + 2] * Math.cos(-yAngle) - bz[i] * Math.sin(-yAngle);
                    bz[i] = bz2[0];
                    bz[i + 1] = bz2[2] * Math.sin(-xAngle) + bz2[1] * Math.cos(-xAngle);
                    bz[i + 2] = bz2[2] * Math.cos(-xAngle) - bz2[1] * Math.sin(-xAngle);
                }
                z2 = bezierValue(bz[2], bz[5], bz[8], bz[11], t[2]);
                z3 = bezierValue(bz[2], bz[5], bz[8], bz[11], t[2] + .00000001);
                x2 = bezierValue(bz[0], bz[3], bz[6], bz[9], t[2]) / z2; // division by zero
                x3 = bezierValue(bz[0], bz[3], bz[6], bz[9], t[2] + .00000001) / z3;
                dx = ((x3 - x2) * perspective) / .00000001,
                y2 = bezierValue(bz[1], bz[4], bz[7], bz[10], t[2]) / z2,
                y3 = bezierValue(bz[1], bz[4], bz[7], bz[10], t[2] + .00000001) / z3,
                dy = ((y3 - y2) * perspective) / .00000001,
                md = Math.sqrt(dx*dx+dy*dy),
                c = Math.atan2(dy, dx);
                density =
                    flow._splinePaths[t[0]]._densities[t[1]] * (1 - t[2]) +
                    flow._splinePaths[t[0]]._densities[t[1] + 1] * t[2];
                this._lineVectorX = Math.cos(-c) * md / density; // division by zero;
                this._lineVectorY = Math.sin(-c) * md / density;
            }
        }
    },

    // TODO
    /**
     */
    _lineVectorX: {
        enumerable: false,
        value: Math.cos(Math.PI - .6) * 80
    },

    // TODO
    /**
     */
    _lineVectorY: {
        enumerable: false,
        value: Math.sin(Math.PI - .6) * 80
    },

    // TODO
    /**
     */
    _startX: {
        enumerable: false,
        value: 0
    },

    // TODO
    /**
     */
    _startY: {
        enumerable: false,
        value: 0
    },

    // TODO
    /**
     */
    _currentX: {
        enumerable: false,
        value: 0
    },

    // TODO
    /**
     */
    _currentY: {
        enumerable: false,
        value: 0
    },

    // TODO
    /**
     */
    _previousScrollDelta: {
        enumerable: false,
        value: 0
    },

    // TODO
    /**
     */
    _startScroll: {
        enumerable: false,
        value: 0
    },

    // TODO
    /**
     */
    _bezierValue: {
        enumerable: false,
        value: function (b0, b1, b2, b3, t) {
            var k = 1 - t;

            return b0 * k * k * k + b1 * 3 * k * k * t + b2 * 3 * k * t * t + b3 * t * t * t;
        }
    },

    /**
     * Computes the rotation values that would rotate the given vector
     * first around Z axis and then around Y axis, ending in the X axis.
     * These rotation values can be understood as a subset of a full
     * rotation matrix, optimized for lower memory usage and less amount
     * of computations than storing and using the full matrix.
     */
    _computeRotationValuesToXAxis: {
        enumerable: false,
        value: function (vectorX, vectorY, vectorZ) {
            var squaredMagnitude,
                magnitude,
                invMagnitude,
                sinZ,
                cosZ;

            if (vectorX * vectorX < 1e-100) {
                vectorX = 1e-50;
            }
            squaredMagnitude = vectorX * vectorX + vectorY * vectorY;
            magnitude = Math.sqrt(squaredMagnitude);
            invMagnitude = 1 / magnitude; // division by zero?
            cosZ = vectorX * invMagnitude;
            sinZ = -vectorY * invMagnitude;
            invMagnitude = 1 / Math.sqrt(squaredMagnitude + vectorZ * vectorZ); // division by zero?
            return [sinZ, cosZ, -vectorZ * invMagnitude, magnitude * invMagnitude];
        }
    },

    // TODO doc
    /**
     */
    _infinite: {
        enumerable: false,
        value: 1e100
    },

    /**
     * Raycasts a given sphere [x, y, z, radius] with a ray with origin
     * at (0, 0, 0) and rotationValuesToXAxis given by the ray vector.
     */
    _sphereIntersection: {
        enumerable: false,
        value: function (sphere, rotationValuesToXAxis) {
            var x2 = sphere[0] * rotationValuesToXAxis[1] - sphere[1] * rotationValuesToXAxis[0],
                y2 = sphere[0] * rotationValuesToXAxis[0] + sphere[1] * rotationValuesToXAxis[1],
                z2 = x2 * rotationValuesToXAxis[2] + sphere[2] * rotationValuesToXAxis[3],
                squaredRadius = sphere[3] * sphere[3],
                x3, tmp, x;

            if (y2 * y2 + z2 * z2 <= squaredRadius) {
                x3 = x2 * rotationValuesToXAxis[3] - sphere[2] * rotationValuesToXAxis[2],
                tmp = Math.sqrt(squaredRadius - y2 * y2 - z2 * z2),
                x = x3 - tmp;
                if (x < 0) {
                    if (x3 + tmp < 0) {
                        // The sphere is in the back of the ray
                        return this._infinite;
                    } else {
                        // The ray origin is inside the sphere
                        return 0;
                    }
                } else {
                    // Return closer intersection distance
                    return x;
                }
            } else {
                // The sphere is not intersected
                return this._infinite;
            }
        }
    },

    /**
     * Computes a loose bounding sphere for a given bezier tube.
     * A tube is defined by the distance_to_a_bezier_curve <= tubeRadius.
     * The bezier curve is expected to be an array with 12 values:
     * 4 points in space, with interleaved x, y and z.
     */
    _bezierTubeBoundingSphere: {
        enumerable: false,
        value: function (bezier, tubeRadius) {
            var minX = bezier[0],
                minY = bezier[1],
                minZ = bezier[2],
                maxX = bezier[0],
                maxY = bezier[1],
                maxZ = bezier[2],
                dX, dY, dZ,
                radius,
                tmp;

            // Unrolled for speed optimization
            tmp = bezier[3];
            if (tmp < minX) {
                minX = tmp;
            } else if (tmp > maxX) {
                maxX = tmp;
            }
            tmp = bezier[4];
            if (tmp < minY) {
                minY = tmp;
            } else if (tmp > maxY) {
                maxY = tmp;
            }
            tmp = bezier[5];
            if (tmp < minZ) {
                minZ = tmp;
            } else if (tmp > maxZ) {
                maxZ = tmp;
            }
            tmp = bezier[6];
            if (tmp < minX) {
                minX = tmp;
            } else if (tmp > maxX) {
                maxX = tmp;
            }
            tmp = bezier[7];
            if (tmp < minY) {
                minY = tmp;
            } else if (tmp > maxY) {
                maxY = tmp;
            }
            tmp = bezier[8];
            if (tmp < minZ) {
                minZ = tmp;
            } else if (tmp > maxZ) {
                maxZ = tmp;
            }
            tmp = bezier[9];
            if (tmp < minX) {
                minX = tmp;
            } else if (tmp > maxX) {
                maxX = tmp;
            }
            tmp = bezier[10];
            if (tmp < minY) {
                minY = tmp;
            } else if (tmp > maxY) {
                maxY = tmp;
            }
            tmp = bezier[11];
            if (tmp < minZ) {
                minZ = tmp;
            } else if (tmp > maxZ) {
                maxZ = tmp;
            }
            dX = (maxX - minX) * .5;
            dY = (maxY - minY) * .5;
            dZ = (maxZ - minZ) * .5;
            radius = Math.sqrt(dX * dX + dY * dY + dZ * dZ) + tubeRadius;
            return [minX + dX, minY + dY, minZ + dZ, radius];
        }
    },

    // TODO doc
    /**
     */
    _raycastBezierTubes: {
        enumerable: false,
        value: function (px, py, pz, ang) {
            var sphere,
                sphere2,
                stack = [],
                min = this._infinite,
                bestI = null,
                bestT = 0,
                bestJ = null,
                b1, b2, v1, v2, b, d,
                p1x, p2x, p3x, p4x, p5x, p6x, p1y, p2y, p3y, p4y, p5y, p6y, p1z, p2z, p3z, p4z, p5z, p6z,
                size, i, j, total = 0,
                splinePaths = this._flow._splinePaths;

            for (j = 0; j < splinePaths.length; j++) {
                for (i = 0; i < splinePaths[j]._knots.length - 1; i++) {
                    stack[total] = [
                        splinePaths[j]._knots[i][0] - px,
                        splinePaths[j]._knots[i][1] - py,
                        splinePaths[j]._knots[i][2] - pz,
                        splinePaths[j]._nextHandlers[i][0] - px,
                        splinePaths[j]._nextHandlers[i][1] - py,
                        splinePaths[j]._nextHandlers[i][2] - pz,
                        splinePaths[j]._previousHandlers[i + 1][0] - px,
                        splinePaths[j]._previousHandlers[i + 1][1] - py,
                        splinePaths[j]._previousHandlers[i + 1][2] - pz,
                        splinePaths[j]._knots[i + 1][0] - px,
                        splinePaths[j]._knots[i + 1][1] - py,
                        splinePaths[j]._knots[i + 1][2] - pz,
                        0,
                        1048576,
                        i,
                        j
                    ];
                    total++;
                }
            }
            i = total - 1;
            while (i >= 0) {
                b = stack[i];
                // deCasteljau algorithm divides bezier in two
                p1x = (b[0] + b[3]) * .5;
                p2x = (b[3] + b[6]) * .5;
                p3x = (b[6] + b[9]) * .5;
                p1y = (b[1] + b[4]) * .5;
                p2y = (b[4] + b[7]) * .5;
                p3y = (b[7] + b[10]) * .5;
                p1z = (b[2] + b[5]) * .5;
                p2z = (b[5] + b[8]) * .5;
                p3z = (b[8] + b[11]) * .5;
                p4x = (p1x + p2x) * .5;
                p5x = (p2x + p3x) * .5;
                p6x = (p4x + p5x) * .5;
                p4y = (p1y + p2y) * .5;
                p5y = (p2y + p3y) * .5;
                p6y = (p4y + p5y) * .5;
                p4z = (p1z + p2z) * .5;
                p5z = (p2z + p3z) * .5;
                p6z = (p4z + p5z) * .5;
                size = b[13] >> 1;
                b1 = [b[0], b[1], b[2], p1x, p1y, p1z, p4x, p4y, p4z, p6x, p6y, p6z, b[12], size, b[14], b[15]];
                sphere = this._bezierTubeBoundingSphere(b1, this._flow._elementsBoundingSphereRadius);
                b2 = [p6x, p6y, p6z, p5x, p5y, p5z, p3x, p3y, p3z, b[9], b[10], b[11], b[12] + size, size, b[14], b[15]];
                sphere2 = this._bezierTubeBoundingSphere(b2, this._flow._elementsBoundingSphereRadius);
                v1 = this._sphereIntersection(sphere, ang);
                v2 = this._sphereIntersection(sphere2, ang);
                if (v1 < min) {
                    if (v2 < min) {
                        if (v1 < v2) {
                            if (!size) {
                                min = v1 - .00001;
                                bestT = b[12];
                                bestI = b[14];
                                bestJ = b[15];
                                i--;
                            } else {
                                stack[i++] = b2;
                                stack[i] = b1;
                            }
                        } else {
                            if (!size) {
                                min = v2 - .00001;
                                bestT = b[12];
                                bestI = b[14];
                                bestJ = b[15];
                                i--;
                            } else {
                                stack[i++] = b1;
                                stack[i] = b2;
                            }
                        }
                    } else {
                        if (!size) {
                            min = v1 - .00001;
                            bestT = b[12];
                            bestI = b[14];
                            bestJ = b[15];
                            i--;
                        } else {
                            stack[i] = b1;
                        }
                    }
                } else {
                    if (v2 < min) {
                        if (!size) {
                            min = v2 - .00001;
                            bestT = b[12];
                            bestI = b[14];
                            bestJ = b[15];
                            i--;
                        } else {
                            stack[i] = b2;
                        }
                    } else {
                        i--;
                    }
                }
            }
            return [bestJ, bestI, bestT * (1 / 1048576)];
        }
    },

    // TODO doc
    /**
     */
    _translateStride: {
        enumerable: false,
        value: null
    },

    // TODO doc
    /**
     */
    translateStride: {
        serializable: true,
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
    startStrideTime: {
        enumerable: false,
        value: null
    },

    // TODO doc
    /**
     */
    _scrollEnd: {
        enumerable: false,
        value: null
    },

    // TODO doc
    /**
     */
    _scrollStart: {
        enumerable: false,
        value: null
    },

    // TODO doc
    /**
     */
    _hasMomentum: {
        enumerable: false,
        value: true
    },

    isLimitedToSingleStride: {
        value: false
    },

    // TODO doc
    /**
     */
    _animationInterval: {
        enumerable: false,
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

