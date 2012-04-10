/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */

var Montage = require("montage").Montage,
    Component = require("ui/component").Component,
    FlowBezierSpline = require("ui/flow-bezier-spline").FlowBezierSpline;

var Flow = exports.Flow = Montage.create(Component, {

    _cameraPosition: {
        enumerable: false,
        value: [0, 0, 800]
    },

    _cameraTargetPoint: {
        enumerable: false,
        value: [0, 0, 0]
    },

    _cameraFov: {
        enumerable: false,
        value: 50
    },

    // TODO: Implement camera roll

    _cameraRoll: {
        enumerable: false,
        value: 0
    },

    cameraPosition: {
        get: function () {
            return this._cameraPosition;
        },
        set: function (value) {
            this._cameraPosition = value;
            this._isCameraUpdated = true;
            this.needsDraw = true;
        }
    },

    cameraTargetPoint: {
        get: function () {
            return this._cameraTargetPoint;
        },
        set: function (value) {
            this._cameraTargetPoint = value;
            this._isCameraUpdated = true;
            this.needsDraw = true;
        }
    },

    cameraFov: {
        get: function () {
            return this._cameraFov;
        },
        set: function (value) {
            this._cameraFov = value;
            this._isCameraUpdated = true;
            this.needsDraw = true;
        }
    },

    cameraRoll: {
        get: function () {
            return this._cameraRoll;
        },
        set: function (value) {
            this._cameraRoll = value;
            this._isCameraUpdated = true;
            this.needsDraw = true;
        }
    },

    _splinePath: {
        enumerable: false,
        value: null
    },

    splinePath: {
        get: function () {
            return this._splinePath;
        },
        set: function (value) {
            this._splinePath = value;
            this.needsDraw = true;
        }
    },

    _isCameraUpdated: {
        enumerable: false,
        value: true
    },

    _width: {
        enumerable: false,
        value: null
    },

    _height: {
        enumerable: false,
        value: null
    },

    _repetitionComponents: {
        enumerable: false,
        value: null
    },

    _elementsBoundingSphereRadius: {
        enumerable: false,
        value: 142
    },

    elementsBoundingSphereRadius: {
        get: function () {
            return this._elementsBoundingSphereRadius;
        },
        set: function (value) {
            if (this._elementsBoundingSphereRadius !== value) {
                this._elementsBoundingSphereRadius = value;
                this.needsDraw = true;
            }
        }
    },

    _computeFrustumNormals: {
        value: function() {
            var angle = ((this.cameraFov * .5) * Math.PI * 2) / 360,
                y = Math.sin(angle),
                z = Math.cos(angle),
                x = (y * this._width) / this._height,
                vX = this.cameraTargetPoint[0] - this.cameraPosition[0],
                vY = this.cameraTargetPoint[1] - this.cameraPosition[1],
                vZ = this.cameraTargetPoint[2] - this.cameraPosition[2],
                yAngle = Math.PI / 2 - Math.atan2(vZ, vX),
                tmpZ = vX * Math.sin(yAngle) + vZ * Math.cos(yAngle),
                rX, rY, rZ,
                rX2, rY2, rZ2,
                xAngle = Math.PI / 2 - Math.atan2(tmpZ, vY),
                invLength,
                vectors = [[z, 0, x], [-z, 0, x], [0, z, y], [0, -z, y]],
                iVector,
                out = [],
                i;

            for (i = 0; i < 4; i++) {
                iVector = vectors[i];
                rX = iVector[0];
                rY = iVector[1] * Math.cos(-xAngle) - iVector[2] * Math.sin(-xAngle);
                rZ = iVector[1] * Math.sin(-xAngle) + iVector[2] * Math.cos(-xAngle);
                rX2 = rX * Math.cos(-yAngle) - rZ * Math.sin(-yAngle);
                rY2 = rY;
                rZ2 = rX * Math.sin(-yAngle) + rZ * Math.cos(-yAngle);
                invLength = 1 / Math.sqrt(rX2 * rX2 + rY2 * rY2 + rZ2 * rZ2);
                out.push([rX2 * invLength, rY2 * invLength, rZ2 * invLength]);
            }
            return out;
        }
    },

    _segmentsIntersection: {
        enumerable: false,
        value: function (segment1, segment2) {
            var n = 0,
                m = 0,
                start,
                end,
                result = [];

            while ((n < segment1.length) && (m < segment2.length)) {
                if (segment1[n][0] >= segment2[m][1]) {
                    m++;
                } else {
                    if (segment1[n][1] <= segment2[m][0]) {
                        n++;
                    } else {
                        if (segment1[n][0] >= segment2[m][0]) {
                            start = segment1[n][0];
                        } else {
                            start = segment2[m][0];
                        }
                        if (segment1[n][1] <= segment2[m][1]) {
                            end = segment1[n][1];
                        } else {
                            end = segment2[m][1];
                        }
                        result.push([start, end]);
                        if (segment1[n][1] < segment2[m][1]) {
                            n++;
                        } else {
                            if (segment1[n][1] > segment2[m][1]) {
                                m++;
                            } else {
                                n++;
                                m++;
                            }
                        }
                    }
                }
            }
            return result;
        }
    },

    _computeVisibleRange: { // TODO: make it a loop, optimize
        enumerable: false,
        value: function () {
            var spline = this._splinePath,
                splineLength = spline.knotsLength - 1,
                planeOrigin = this._cameraPosition,
                normals = this._computeFrustumNormals(),
                mod,
                r, r2, r3 = [], out = [], tmp,
                i, j;

            for (i = 0; i < splineLength; i++) {
                mod = normals[0];
                r = spline.directedPlaneBezierIntersection(
                    [
                        planeOrigin[0] - mod[0] * this._elementsBoundingSphereRadius,
                        planeOrigin[1] - mod[1] * this._elementsBoundingSphereRadius,
                        planeOrigin[2] - mod[2] * this._elementsBoundingSphereRadius
                    ],
                    normals[0],
                    spline._knots[i],
                    spline._nextHandlers[i],
                    spline._previousHandlers[i + 1],
                    spline._knots[i + 1]
                );
                if (r.length) {
                    mod = normals[1];
                    r2 = spline.directedPlaneBezierIntersection(
                        [
                            planeOrigin[0] - mod[0] * this._elementsBoundingSphereRadius,
                            planeOrigin[1] - mod[1] * this._elementsBoundingSphereRadius,
                            planeOrigin[2] - mod[2] * this._elementsBoundingSphereRadius
                        ],
                        normals[1],
                        spline._knots[i],
                        spline._nextHandlers[i],
                        spline._previousHandlers[i + 1],
                        spline._knots[i + 1]
                    );
                    if (r2.length) {
                        tmp = this._segmentsIntersection(r, r2);
                        if (tmp.length) {
                            mod = normals[2];
                            r = spline.directedPlaneBezierIntersection(
                                [
                                    planeOrigin[0] - mod[0] * this._elementsBoundingSphereRadius,
                                    planeOrigin[1] - mod[1] * this._elementsBoundingSphereRadius,
                                    planeOrigin[2] - mod[2] * this._elementsBoundingSphereRadius
                                ],
                                normals[2],
                                spline._knots[i],
                                spline._nextHandlers[i],
                                spline._previousHandlers[i + 1],
                                spline._knots[i + 1]
                            );
                            tmp = this._segmentsIntersection(r, tmp);
                            if (tmp.length) {
                                mod = normals[3];
                                r = spline.directedPlaneBezierIntersection(
                                    [
                                        planeOrigin[0] - mod[0] * this._elementsBoundingSphereRadius,
                                        planeOrigin[1] - mod[1] * this._elementsBoundingSphereRadius,
                                        planeOrigin[2] - mod[2] * this._elementsBoundingSphereRadius
                                    ],
                                    normals[3],
                                    spline._knots[i],
                                    spline._nextHandlers[i],
                                    spline._previousHandlers[i + 1],
                                    spline._knots[i + 1]
                                );
                                tmp = this._segmentsIntersection(r, tmp);
                                for (j = 0; j < tmp.length; j++) {
                                    r3.push([i, tmp[j][0], tmp[j][1]]);
                                }
                            }
                        }
                    }
                }
            }
            var densities = spline._densities, d1, d2, dS, p1, p2, t1, t2;
            for (i = 0; i < r3.length; i++) {
                d1 = densities[r3[i][0]];
                d2 = densities[r3[i][0] + 1];
                dS = r3[i][0] ? spline._densitySummation[r3[i][0]-1] : 0;
                p1 = r3[i][1];
                p2 = r3[i][2];
                t1 = (d2 - d1) * p1 * p1 * .5 + p1 * d1 + dS;
                t2 = (d2 - d1) * p2 * p2 * .5 + p2 * d1 + dS;
                out.push([t1, t2]);
            }
            return out;
        }
    },

    prepareForDraw: {
        enumerable: false,
        value: function () {
            var self = this;

            if (!this._splinePath) {
                this.splinePath = Object.create(FlowBezierSpline);
            }
            this._repetitionComponents = this._repetition._childComponents;
            window.addEventListener("resize", function () {
                self._isCameraUpdated = true;
                self.needsDraw = true;
            }, false);
        }
    },

    _updateIndexMap: {
        enumerable: false,
        value: function (currentIndexMap, newIndexes) {
            var indexMap = currentIndexMap.slice(0, newIndexes.length),
                newIndexesHash = {},
                emptySpaces = [],
                j,
                i;

            for (i = 0; i < newIndexes.length; i++) {
                newIndexesHash[newIndexes[i]] = i;
            }
            for (i = 0; i < indexMap.length; i++) {
                if (newIndexesHash.hasOwnProperty(indexMap[i])) {
                    newIndexes[newIndexesHash[indexMap[i]]] = null;
                } else {
                    emptySpaces.push(i);
                }
            }
            for (i = j = 0; j < emptySpaces.length; i++) {
                if (newIndexes[i] !== null) {
                    indexMap[emptySpaces[j]] = newIndexes[i];
                    j++;
                }
            }
            for (j = indexMap.length; i < newIndexes.length; i++) {
                if (newIndexes[i] !== null) {
                    indexMap[j] = newIndexes[i];
                    j++;
                }
            }
            return indexMap;
        }
    },

    willDraw: {
        enumerable: false,
        value: function () {
            var newIndexMap = [],
                i,
                j,
                intersections = this._computeVisibleRange();

            this._width = this._element.offsetWidth;
            this._height = this._element.offsetHeight;

            for (i = 0; i < intersections.length; i++) {
                for (j = Math.ceil(intersections[i][0] + this._origin/this._scale); j < intersections[i][1] + this._origin/this._scale; j++) {
                    newIndexMap.push(j);
                }
            }
            this._repetition.indexMap = this._updateIndexMap(this._repetition.indexMap, newIndexMap);
        }
    },

    draw: {
        enumerable: false,
        value: function () {
            var i,
                length = this._repetitionComponents.length,
                slide = {},
                transform,
                origin,
                j,
                iOffset,
                iStyle,
                pos;

            if (this.isAnimating) {
                this._animationInterval();
            }
            if (this._isCameraUpdated) {
                var perspective = Math.tan(((90 - this.cameraFov * .5) * Math.PI * 2) / 360) * this._height * .5,
                    vX = this.cameraTargetPoint[0] - this.cameraPosition[0],
                    vY = this.cameraTargetPoint[1] - this.cameraPosition[1],
                    vZ = this.cameraTargetPoint[2] - this.cameraPosition[2],
                    yAngle = Math.atan2(-vX, -vZ),  // TODO: Review this
                    tmpZ,
                    xAngle;

                tmpZ = vX * -Math.sin(-yAngle) + vZ * Math.cos(-yAngle);
                xAngle = Math.atan2(-vY, -tmpZ);
                this._element.style.webkitPerspective = perspective + "px";
                this._repetition._element.style.webkitTransform =
                    "translate3d(" + 0 + "px, " + 0 + "px, " + perspective + "px) rotateX(" + xAngle + "rad) rotateY(" + (-yAngle) + "rad) " +
                    "translate3d(" + (-this.cameraPosition[0]) + "px, " + (-this.cameraPosition[1]) + "px, " + (-this.cameraPosition[2]) + "px)";
                this._isCameraUpdated = false;
            }
            if (this._splinePath) {
                this._splinePath._computeDensitySummation(); // TODO: This should not be done per frame
                for (i = 0; i < length; i++) {
                    iStyle = this._repetitionComponents[i].element.style;
                    iOffset = this._offset.value(this._repetition.indexMap[i]);
                    slide.index = this._repetition.indexMap[i];
                    slide.time = iOffset.time;
                    slide.speed = iOffset.speed;
                    pos = this._splinePath.getPositionAtTime(slide.time / 300);
                    if (pos) {
                        if (iStyle.display !== "block") {
                            iStyle.display = "block";
                        }
                        transform = "translate3d(" + pos[0] + "px," + pos[1] + "px," + pos[2] + "px) ";
                        transform += (typeof pos[3].rotateZ !== "undefined") ? "rotateZ(" + pos[3].rotateZ + ") " : "";
                        transform += (typeof pos[3].rotateY !== "undefined") ? "rotateY(" + pos[3].rotateY + ") " : "";
                        transform += (typeof pos[3].rotateX !== "undefined") ? "rotateX(" + pos[3].rotateX + ") " : "";
                        iStyle.webkitTransform = transform;
                        delete pos[3].rotateX;
                        delete pos[3].rotateY;
                        delete pos[3].rotateZ;
                        for (j in pos[3]) {
                            if ((pos[3].hasOwnProperty(j)) && (iStyle[j] !== pos[3][j])) {
                                iStyle[j] = pos[3][j];
                            }
                        }
                    } else {
                        if (iStyle.display !== "none") {
                            iStyle.display = "none";
                        }
                    }
                }
            }
        }
    },

    /////////////////////////////// Almost Copy/Pasted from List ///////////////////////////

    _orphanedChildren: {
        enumerable: false,
        value: null
    },

    _objectsForRepetition: {
        enumerable: false,
        value: null
    },

    objects: {
        enumerable: false,
        get: function() {
            if (this._repetition) {
                return this._repetition.objects;
            } else {
                return this._objectsForRepetition;
            }
        },
        set: function(value) {
            if (this._repetition) {
                this._repetition.objects = value;
            } else {
                this._objectsForRepetition = value;
            }
        }
    },

    _contentControllerForRepetition: {
        enumerable: false,
        value: null
    },

    contentController: {
        enumerable: false,
        get: function() {
            if (this._repetition) {
                return this._repetition.contentController;
            } else {
                return this._contentControllerForRepetition;
            }
        },
        set: function(value) {
            if (this._repetition) {
                this._repetition.contentController = value;
            } else {
                this._contentControllerForRepetition = value;
            }
        }
    },

    _isSelectionEnabledForRepetition: {
        enumerable: false,
        value: null
    },

    isSelectionEnabled: {
        enumerable: false,
        get: function() {
            if (this._repetition) {
                return this._repetition.isSelectionEnabled;
            } else {
                return this._isSelectionEnabledForRepetition;
            }
        },
        set: function(value) {
            if (this._repetition) {
                this._repetition.isSelectionEnabled = value;
            } else {
                this._isSelectionEnabledForRepetition = value;
            }
        }
    },

    propertyChangeBindingListener: {
        value: function(type, listener, useCapture, atSignIndex, bindingOrigin, bindingPropertyPath, bindingDescriptor) {
            if (bindingDescriptor.boundObjectPropertyPath.match(/objectAtCurrentIteration/)) {
                if (this._repetition) {
                    bindingDescriptor.boundObject = this._repetition;
                    return this._repetition.propertyChangeBindingListener.apply(this._repetition, arguments);
                } else {
                    return null;
                }
            } else {
                return Object.prototype.propertyChangeBindingListener.apply(this, arguments);
            }
        }
    },

    deserializedFromTemplate: {
        value: function() {
            this._orphanedChildren = this.childComponents;
            this.childComponents = null;
            this.offset = true;
        }
    },

    templateDidLoad: {
        value: function() {
            var orphanedFragment,
                currentContentRange = this.element.ownerDocument.createRange();


            currentContentRange.selectNodeContents(this.element);
            orphanedFragment = currentContentRange.extractContents();
            this._repetition.element.appendChild(orphanedFragment);
            this._repetition.indexMap = [];
            this._repetition.childComponents = this._orphanedChildren;
            this._repetition.needsDraw = true;
            if (this._objectsForRepetition !== null) {
                this._repetition.objects = this._objectsForRepetition;
                this._objectsForRepetition = null;
            }
            if (this._contentControllerForRepetition !== null) {
                this._repetition.contentController = this._contentControllerForRepetition;
                this._contentControllerForRepetition = null;
            }
            if (this._isSelectionEnabledForRepetition !== null) {
                this._repetition.isSelectionEnabled = this._isSelectionEnabledForRepetition;
                this._isSelectionEnabledForRepetition = null;
            }
        }
    },

    ////////////////////// offset /////////////////////////

    isAnimating: {
        enumerable: false,
        value: false
    },

    _hasElasticScrolling: {
        enumerable: false,
        value: true
    },

    hasElasticScrolling: {
        get: function () {
            return this._hasElasticScrolling;
        },
        set: function (value) {
            this._hasElasticScrolling = (value === true) ? true : false;
        }
    },

    _elasticScrollingSpeed: {
        enumerable: false,
        value: 1
    },

    elasticScrollingSpeed: {
        get: function () {
            return this._elasticScrollingSpeed;
        },
        set: function (value) {
            this._elasticScrollingSpeed = value;
            if (!value) {
                this.hasElasticScrolling = false;
            }
        }
    },

    _selectedSlideIndex: {
        enumerable: false,
        value: null
    },

    selectedSlideIndex: {
        get: function () {
            return this._selectedSlideIndex;
        },
        set: function (value) {
            this._selectedSlideIndex=value;
            if (typeof this.animatingHash[this._selectedSlideIndex] !== "undefined") {
                var tmp = this.slide[this._selectedSlideIndex].x;

                this.origin += (this._selectedSlideIndex * this._scale) - tmp;
            }
        }
    },

    _animating: {
        enumerable: false,
        value: null
    },

    animating: {
        enumerable: false,
        get: function () {
            if (!this._animating) {
                this._animating = [];
            }
            return this._animating;
        },
        set: function () {
        }
    },

    _animatingHash: {
        enumerable: false,
        value: null
    },

    animatingHash: {
        enumerable: false,
        get: function () {
            if (!this._animatingHash) {
                this._animatingHash = {};
            }
            return this._animatingHash;
        },
        set: function () {
        }
    },

    _slide: {
        enumerable: false,
        value: null
    },

    slide: {
        enumerable: false,
        get: function () {
            if (!this._slide) {
                this._slide = {};
            }
            return this._slide;
        },
        set: function () {
        }
    },

    startAnimating: {
        enumerable: false,
        value: function (index, pos) {
            if (typeof this.animatingHash[index] === "undefined") {
                var length = this.animating.length;

                this.animating[length] = index;
                this.animatingHash[index] = length;
                this.slide[index] = {
                    speed: 0,
                    x: pos
                };
            } else {
                this.slide[index].x = pos;
            }
        }
    },

    stopAnimating: {
        enumerable: false,
        value: function (index) {
            if (typeof this.animatingHash[index] !== "undefined") {
                this.animating[this.animatingHash[index]] = this.animating[this.animating.length - 1];
                this.animatingHash[this.animating[this.animating.length - 1]] = this.animatingHash[index];
                this.animating.pop();
                delete this.animatingHash[index];
                delete this.slide[index];
            }
        }
    },

    _range: {
        value: 15
    },

    lastDrawTime: {
        value: null
    },

    _origin: {
        enumerable: false,
        value: 0
    },

    origin: {
        get: function () {
            return this._origin;
        },
        set: function (value) {
            if ((this._hasElasticScrolling)&&(this._selectedSlideIndex !== null)) {
                var i,
                    n,
                    min = this._selectedSlideIndex - this._range,
                    max = this._selectedSlideIndex + this._range + 1,
                    tmp,
                    j,
                    x,
                    self = this;

                tmp = value - this._origin;
                if (min < 0) {
                    min = 0;
                }

                if (!this.isAnimating) {
                    this.lastDrawTime = Date.now();
                }
                for (i = min; i < max; i++) {
                    if (i != this._selectedSlideIndex) {
                        if (typeof this.animatingHash[i] === "undefined") {
                            x = i * this._scale;
                        } else {
                            x = this.slide[i].x;
                        }
                        x += tmp;
                        if (i < this._selectedSlideIndex) {
                            if (x < i * this._scale) {
                                this.startAnimating(i, x);
                            }
                        } else {
                            if (x > i * this._scale) {
                                this.startAnimating(i, x);
                            }
                        }
                    }
                }
                this.stopAnimating(this._selectedSlideIndex);
                if (!this.isAnimating) {
                    this._animationInterval = function () {
                        var animatingLength = self.animating.length,
                            n, j, i, _iterations = 8,
                            time = Date.now(),
                            interval1 = self.lastDrawTime ? (time - self.lastDrawTime) * 0.015 * this._elasticScrollingSpeed : 0,
                            interval = interval1 / _iterations,
                            mW = self._scale, x,
                            epsilon = .5;

                        for (n = 0; n < _iterations; n++) {
                            for (j = 0; j < animatingLength; j++) {
                                i = self.animating[j];
                                if (i < self._selectedSlideIndex) {
                                    if (typeof self.animatingHash[i + 1] === "undefined") {
                                        x = ((i + 1) * self._scale);
                                    } else {
                                        x = self.slide[i + 1].x;
                                    }
                                    self.slide[i].speed = x - self.slide[i].x - mW;
                                } else {
                                    if (typeof self.animatingHash[i - 1] === "undefined") {
                                        x = ((i - 1) * self._scale);
                                    } else {
                                        x = self.slide[i - 1].x;
                                    }
                                    self.slide[i].speed = x - self.slide[i].x + mW;
                                }
                                self.slide[i].x += (self.slide[i].speed) * interval;
                            }
                        }
                        j = 0;
                        while (j < animatingLength) {
                            i = self.animating[j];
                            if (i < self._selectedSlideIndex) {
                                if (self.slide[i].x > i * self._scale - epsilon) {
                                    self.stopAnimating(i);
                                    animatingLength--;
                                } else {
                                    j++;
                                }
                            } else {
                                if (self.slide[i].x < i * self._scale + epsilon) {
                                    self.stopAnimating(i);
                                    animatingLength--;
                                } else {
                                    j++;
                                }
                            }
                        }
                        self.lastDrawTime = time;
                        if (!animatingLength) {
                            self.isAnimating = false;
                        } else {
                            self.needsDraw = true;
                            if (!self.isAnimating) {
                                self.isAnimating = true;
                            }
                        }
                    }
                }
                if (!this.isAnimating) {
                    this._animationInterval();
                }
            }
            this._origin = value;
            this.needsDraw = true;
        }
    },

    _scale: {
        enumerable: false,
        value: 100
    },

    scale: {
        get: function () {
            return this._scale;
        },
        set: function (value) {
            var oldScale = this._scale;

            this._scale = value;
            this.length = value * (this._numberOfNodes - 1);
            if (!this.isAnimating) {
                this.selectedSlideIndex = null;
                this.origin = this._origin * value / oldScale;
            }
            this.needsDraw = true;
        }
    },

    _length: {
        enumerable: false,
        value: 0
    },

    length: {
        get: function () {
            return this._length;
        },
        set: function (value) {
            if (value < 0) {
                this._length = 0;
            } else {
                this._length = value;
            }
        }
    },

    _offset: {
        enumerable: false,
        value: {
            value: function (nodeNumber) {
                return 0;
            }
        }
    },

    offset: {
        get: function () {
            return this._offset;
        },
        set: function () {
            var self = this;

            this._offset = {
                value: function (nodeNumber) {
                    if (typeof self.animatingHash[nodeNumber] === "undefined") {
                        return {
                            time: (nodeNumber * self._scale) - self._origin,
                            speed: 0
                        }
                    } else {
                        return {
                            time: self.slide[nodeNumber].x - self.origin,
                            speed: self.slide[nodeNumber].speed
                        }
                    }
                    this.needsDraw = true;
                }
            };
        }
    }
});