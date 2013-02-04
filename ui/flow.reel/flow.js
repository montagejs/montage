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

var Montage = require("montage").Montage,
    Component = require("ui/component").Component,
    FlowBezierSpline = require("ui/flow-bezier-spline").FlowBezierSpline;

var Flow = exports.Flow = Montage.create(Component, {

    didCreate: {
        value: function () {
            this._slideOffsets = {};
        }
    },

    slotContent: {
        serializable: true,
        value: null
    },

    _flowTranslateComposer: {
        value: null
    },

    _scrollingMode: {
        value: "linear"
    },

    /**
        Drag mode is an experimental feature in development
    */
    scrollingMode: {
        serializable: true,
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
        Only applicable if linear scrollingMode is selected
    */
    linearScrollingVector: {
        seriazable: true,
        get: function () {
            return this._linearScrollingVector;
        },
        set: function (value) {
            this._linearScrollingVector = value;
        }
    },

    _repetition: {
        value: null
    },

    /**
        In miliseconds
    */
    momentumDuration: {
        serializable: true,
        value: 650
    },

    _splinePaths: {
        value: null
    },

    /**
        An array of FlowBezierSpline objects
    */
    splinePaths: {
        enumerable: false,
        get: function () {
            if (!this._splinePaths) {
                this._splinePaths = [];
            }
            return this._splinePaths;
        },
        set: function (value) {
            this._splinePaths = value;
        }
    },

    /**
        Creates a FlowBezierSpline with data from a path in the serialization and appends it to splinePaths array
    */
    appendPath: {
        value: function (path) {
            var splinePath = FlowBezierSpline.create(),
                pathKnots = path.knots,
                length = path.knots.length,
                knots = [],
                nextHandlers = [],
                previousHandlers = [],
                densities = [],
                i, j;

            splinePath.parameters = {};
            for (i in path.units) {
                splinePath.parameters[i] = {
                    data: [],
                    units: path.units[i]
                };
            }
            for (i = 0; i < length; i++) {
                knots[i] = pathKnots[i].knotPosition;
                previousHandlers[i] = pathKnots[i].previousHandlerPosition;
                nextHandlers[i] = pathKnots[i].nextHandlerPosition;
                densities[i] = pathKnots[i].previousDensity; // TODO: implement previous/next density
                for (j in path.units) {
                    splinePath.parameters[j].data.push(pathKnots[i][j]);
                }
            }
            splinePath.knots = knots;
            splinePath.previousHandlers = previousHandlers;
            splinePath.nextHandlers = nextHandlers;
            splinePath.densities = densities;
            splinePath._computeDensitySummation();
            this.splinePaths.push(splinePath);
            if (!path.hasOwnProperty("headOffset")) {
                path.headOffset = 0;
            }
            if (!path.hasOwnProperty("tailOffset")) {
                path.tailOffset = 0;
            }
            this._paths.push(path);
            this._updateLength();
        }
    },

    _paths: {
        value: null
    },

    paths: { // TODO: listen for changes?
        get: function () {
            var length = this.splinePaths.length,
                paths = [],
                path,
                pathLength,
                parametersLength,
                knot,
                i, j, k;

            for (i = 0; i < length; i++) {
                pathLength = this.splinePaths[i].knots.length;
                path = {
                    knots: [],
                    units: {}
                };
                for (j = 0; j < pathLength; j++) {
                    knot = {
                        knotPosition: this.splinePaths[i].knots[j]
                    };
                    if (this.splinePaths[i].nextHandlers && this.splinePaths[i].nextHandlers[j]) {
                        knot.nextHandlerPosition = this.splinePaths[i].nextHandlers[j];
                    }
                    if (this.splinePaths[i].previousHandlers && this.splinePaths[i].previousHandlers[j]) {
                        knot.previousHandlerPosition = this.splinePaths[i].previousHandlers[j];
                    }
                    // TODO implememnt previous/next densities
                    if (this.splinePaths[i].densities && this.splinePaths[i].densities[j]) {
                        knot.previousDensity = this.splinePaths[i].densities[j];
                        knot.nextDensity = this.splinePaths[i].densities[j];
                    }
                    path.knots.push(knot);
                }
                for (j in this.splinePaths[i].parameters) {
                    path.units[j] = this.splinePaths[i].parameters[j].units;
                    parametersLength = this.splinePaths[i].parameters[j].data.length;
                    for (k = 0; k < parametersLength; k++) {
                        path.knots[k][j] = this.splinePaths[i].parameters[j].data[k];
                    }
                }
                if (this._paths[i].hasOwnProperty("headOffset")) {
                    path.headOffset = this._paths[i].headOffset;
                } else {
                    path.headOffset = 0;
                }
                if (this._paths[i].hasOwnProperty("tailOffset")) {
                    path.tailOffset = this._paths[i].tailOffset;
                } else {
                    path.tailOffset = 0;
                }
                paths.push(path);
            }
            return paths;
        },
        set: function (value) {
            var length = value.length,
                i;

            this._splinePaths = [];
            this._paths = [];
            for (i = 0; i < length; i++) {
                this.appendPath(value[i]);
            }
            this.needsDraw = true;
        }
    },

    _cameraElement: {
        value: null
    },

    _cameraPosition: {
        value: [0, 0, 800]
    },

    _cameraTargetPoint: {
        value: [0, 0, 0]
    },

    _cameraFov: {
        value: 50
    },

    // TODO: Implement camera roll

    _cameraRoll: {
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

    _stride: {
        value: 0
    },

    stride: {
        get: function () {
            return this._stride;
        },
        set: function (value) {
            this._stride = value;
        }
    },

    _scrollingTransitionDurationMiliseconds: {
        value: 500
    },

    _scrollingTransitionDuration: {
        value: "500ms"
    },

    scrollingTransitionDuration: { // TODO: think about using the Date Converter
        get: function () {
            return this._scrollingTransitionDuration;
        },
        set: function (duration) {
            var durationString = duration + "",
                length = durationString.length,
                value;

            if ((length >= 2) && (durationString[length - 1] === "s")) {
                if ((length >= 3) && (durationString[length - 2] === "m")) {
                    value = durationString.substr(0, length - 2) - 0;
                } else {
                    value = durationString.substr(0, length - 1) * 1000;
                }
            } else {
                value = durationString - 0;
                durationString += "ms";
            }
            if (!isNaN(value) && (this._scrollingTransitionDurationMiliseconds !== value)) {
                this._scrollingTransitionDurationMiliseconds = value;
                this._scrollingTransitionDuration = durationString;
            }
        }
    },

    _scrollingTransitionTimingFunctionBezier: {
        value: [.25, .1, .25, 1]
    },

    _scrollingTransitionTimingFunction: {
        value: "ease"
    },

    hasSelectedIndexScrolling: {
        value: false
    },

    selectedIndexScrollingOffset: {
        value: 0
    },

    _handleSelectedIndexesChange: {
        value: function (event) {
            if (this.hasSelectedIndexScrolling && event.plus) {
                this.startScrollingIndexToOffset(event.plus[0], this.selectedIndexScrollingOffset);
            }
        }
    },

    _timingFunctions: {
        value: {
            "ease": [.25, .1, .25, 1],
            "linear": [0, 0, 1, 1],
            "ease-in": [.42, 0, 1, 1],
            "ease-out": [0, 0, .58, 1],
            "ease-in-out": [.42, 0, .58, 1]
        }
    },

    scrollingTransitionTimingFunction: {
        get: function () {
            return this._scrollingTransitionTimingFunction;
        },
        set: function (timingFunction) {
            var string = timingFunction + "",
                bezier,
                i;

            if (this._timingFunctions.hasOwnProperty(string)) {
                this._scrollingTransitionTimingFunction = string;
                this._scrollingTransitionTimingFunctionBezier = this._timingFunctions[string];
            } else {
                if ((string.substr(0, 13) === "cubic-bezier(") && (string.substr(string.length - 1, 1) === ")")) {
                    bezier = string.substr(13, string.length - 14).split(",");
                    if (bezier.length === 4) {
                        for (i = 0; i < 4; i++) {
                            bezier[i] -= 0;
                            if (isNaN(bezier[i])) {
                                return;
                            }
                        }
                        if (bezier[0] < 0) {
                            bezier[0] = 0;
                        } else {
                            if (bezier[0] > 1) {
                                bezier[0] = 1;
                            }
                        }
                        if (bezier[2] < 0) {
                            bezier[2] = 0;
                        } else {
                            if (bezier[2] > 1) {
                                bezier[2] = 1;
                            }
                        }
                        // TODO: check it is not the same bezier
                        this._scrollingTransitionTimingFunction = "cubic-bezier(" + bezier + ")";
                        this._scrollingTransitionTimingFunctionBezier = bezier;
                    }
                }
            }
        }
    },

    _computeCssCubicBezierValue: {
        value: function (x, bezier) {
            var t = .5,
                step = .25,
                t2,
                k,
                i;

            for (i = 0; i < 20; i++) { // TODO: optimize with Newton's method or similar
                t2 = t * t;
                k = 1 - t;
                if ((3 * (k * k * t * bezier[0] + k * t2 * bezier[2]) + t2 * t) > x) {
                    t -= step;
                } else {
                    t += step;
                }
                step *= .5;
            }
            t2 = t * t;
            k = 1 - t;
            return 3 * (k * k * t * bezier[1] + k * t2 * bezier[3]) + t2 * t;
        }
    },

    _isTransitioningScroll: {
        value: false
    },

    stopScrolling: {
        value: function () {
            this._isTransitioningScroll = false;
            // TODO: Fire scrollingTransitionCancel event
        }
    },

    startScrollingIndexToOffset: { // TODO: Fire scrollingTransitionStart event
        value: function (index, offset) {
            this._scrollingOrigin = this.scroll;
            this._scrollingDestination = index - offset;
            if (this._scrollingDestination > this._length) {
                this._scrollingDestination = this._length;
            } else {
                if (this._scrollingDestination < 0) {
                    this._scrollingDestination = 0;
                }
            }
            this._isScrolling = true;
            this._scrollingStartTime = Date.now();
            this._isTransitioningScroll = true;
            this.needsDraw = true;
        }
    },

    _isCameraUpdated: {
        value: true
    },

    _width: {
        value: null
    },

    _height: {
        value: null
    },

    _repetitionComponents: {
        value: null
    },

    // TODO: bounding box is working as bounding rectangle only. Update it to work with boxes
    _boundingBoxSize: {
        value: [200, 200, 0]
    },

    boundingBoxSize: {
        serializable: true,
        get: function () {
            return this._boundingBoxSize;
        },
        set: function (value) {
            this._boundingBoxSize = value;
            this.elementsBoundingSphereRadius = Math.sqrt(value[0] * value[0] + value[1] * value[1] + value[2] * value[2]) * .5;
        }
    },

    _elementsBoundingSphereRadius: {
        value: 283
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

    _halfPI: {
        value: Math.PI * .5
    },

    _doublePI: {
        value: Math.PI * 2
    },

    _computeFrustumNormals: {
        value: function () {
            var angle = ((this.cameraFov * .5) * this._doublePI) / 360,
                y = Math.sin(angle),
                z = Math.cos(angle),
                x = (y * this._width) / this._height,
                vX = this.cameraTargetPoint[0] - this.cameraPosition[0],
                vY = this.cameraTargetPoint[1] - this.cameraPosition[1],
                vZ = this.cameraTargetPoint[2] - this.cameraPosition[2],
                yAngle = this._halfPI - Math.atan2(vZ, vX),
                tmpZ = vX * Math.sin(yAngle) + vZ * Math.cos(yAngle),
                rX, rY, rZ,
                rX2, rY2, rZ2,
                xAngle = this._halfPI - Math.atan2(tmpZ, vY),
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
        value: function (spline) {
            var splineLength = spline._knots.length - 1,
                planeOrigin0 = this._cameraPosition[0],
                planeOrigin1 = this._cameraPosition[1],
                planeOrigin2 = this._cameraPosition[2],
                normals = this._computeFrustumNormals(),
                mod,
                r = [], r2 = [], r3 = [], tmp,
                i, j,
                elementsBoundingSphereRadius = this._elementsBoundingSphereRadius,
                splineKnots = spline._knots,
                splineNextHandlers = spline._nextHandlers,
                splinePreviousHandlers = spline._previousHandlers,
                reflectionMatrixBuffer = [],
                out = [];

            for (i = 0; i < splineLength; i++) {
                mod = normals[0];
                r = spline.directedPlaneBezierIntersection(
                        planeOrigin0 - mod[0] * elementsBoundingSphereRadius,
                        planeOrigin1 - mod[1] * elementsBoundingSphereRadius,
                        planeOrigin2 - mod[2] * elementsBoundingSphereRadius,
                    normals[0],
                    splineKnots[i],
                    splineNextHandlers[i],
                    splinePreviousHandlers[i + 1],
                    splineKnots[i + 1],
                    reflectionMatrixBuffer
                );
                if (r.length) {
                    mod = normals[1];
                    r2 = spline.directedPlaneBezierIntersection(
                            planeOrigin0 - mod[0] * elementsBoundingSphereRadius,
                            planeOrigin1 - mod[1] * elementsBoundingSphereRadius,
                            planeOrigin2 - mod[2] * elementsBoundingSphereRadius,
                        normals[1],
                        splineKnots[i],
                        splineNextHandlers[i],
                        splinePreviousHandlers[i + 1],
                        splineKnots[i + 1],
                        reflectionMatrixBuffer
                    );
                    if (r2.length) {
                        tmp = this._segmentsIntersection(r, r2);
                        if (tmp.length) {
                            mod = normals[2];
                            r = spline.directedPlaneBezierIntersection(
                                    planeOrigin0 - mod[0] * elementsBoundingSphereRadius,
                                    planeOrigin1 - mod[1] * elementsBoundingSphereRadius,
                                    planeOrigin2 - mod[2] * elementsBoundingSphereRadius,
                                normals[2],
                                splineKnots[i],
                                splineNextHandlers[i],
                                splinePreviousHandlers[i + 1],
                                splineKnots[i + 1],
                                reflectionMatrixBuffer
                            );
                            tmp = this._segmentsIntersection(r, tmp);
                            if (tmp.length) {
                                mod = normals[3];
                                r = spline.directedPlaneBezierIntersection(
                                        planeOrigin0 - mod[0] * elementsBoundingSphereRadius,
                                        planeOrigin1 - mod[1] * elementsBoundingSphereRadius,
                                        planeOrigin2 - mod[2] * elementsBoundingSphereRadius,
                                    normals[3],
                                    splineKnots[i],
                                    splineNextHandlers[i],
                                    splinePreviousHandlers[i + 1],
                                    splineKnots[i + 1],
                                    reflectionMatrixBuffer
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
        value: function () {
            var self = this,
                i;

            this._repetitionComponents = this._repetition._childComponents;
            window.addEventListener("resize", function () {
                self._isCameraUpdated = true;
                self.needsDraw = true;
            }, false);
        }
    },

    _updateIndexMap: {
        value: function (newIndexes, newIndexesHash) {
            var currentIndexMap = this._repetition.indexMap,
                emptySpaces = [],
                j,
                i,
                currentIndexCount = currentIndexMap && !isNaN(currentIndexMap.length) ? currentIndexMap.length : 0;

            for (i = 0; i < currentIndexCount; i++) {
                //The likelyhood that newIndexesHash had a number-turned-to-string property that wasn't his own is pretty slim as it's provided internally.
                //if (newIndexesHash.hasOwnProperty(currentIndexMap[i])) {
                if (typeof newIndexesHash[currentIndexMap[i]] === "number") {
                    newIndexes[newIndexesHash[currentIndexMap[i]]] = null;
                } else {
                    emptySpaces.push(i);
                }
            }
            for (i = j = 0; (j < emptySpaces.length) && (i < newIndexes.length); i++) {
                if (newIndexes[i] !== null) {
                    this._repetition.mapIndexToIndex(emptySpaces[j], newIndexes[i], false);
                    j++;
                }
            }
            for (j = currentIndexCount; i < newIndexes.length; i++) {
                if (newIndexes[i] !== null) {
                    this._repetition.mapIndexToIndex(j,newIndexes[i], false);
                    j++;
                }
            }
            this._repetition.refreshIndexMap();
        }
    },

    willDraw: {
        value: function () {
            var intersections,
                index,
                i,
                j,
                k,
                offset,
                startIndex,
                endIndex,
                mod,
                div,
                iterations,
                newIndexMap = [],
                time,
                interpolant,
                newIndexesHash = {},
                paths = this._paths,
                pathsLength = paths.length,
                splinePaths = this.splinePaths;

            if (this._isTransitioningScroll) {
                time = (Date.now() - this._scrollingStartTime) / this._scrollingTransitionDurationMiliseconds; // TODO: division by zero
                interpolant = this._computeCssCubicBezierValue(time, this._scrollingTransitionTimingFunctionBezier);
                if (time < 1) {
                    this.scroll = this._scrollingOrigin + (this._scrollingDestination - this._scrollingOrigin) * interpolant;
                } else {
                    this.scroll = this._scrollingDestination;
                    this._isTransitioningScroll = false;
                }
            }
            this._width = this._element.clientWidth;
            this._height = this._element.clientHeight;
            if (splinePaths.length) {
                mod = this._numberOfIterations % pathsLength;
                div = (this._numberOfIterations - mod) / pathsLength;
                for (k = 0; k < pathsLength; k++) {
                    iterations = div + ((k < mod) ? 1 : 0);
                    intersections = this._computeVisibleRange(splinePaths[k]);
                    splinePaths[k]._computeDensitySummation();
                    offset =  this._scroll - paths[k].headOffset;
                    for (i = 0; i < intersections.length; i++) {
                        startIndex = Math.ceil(intersections[i][0] + offset);
                        endIndex = Math.ceil(intersections[i][1] + offset);
                        if (startIndex < 0) {
                            startIndex = 0;
                        }
                        if (endIndex > iterations) {
                            endIndex = iterations;
                        }
                        for (j = startIndex; j < endIndex; j++) {
                            index = j * pathsLength + k;
                            if (typeof newIndexesHash[index] === "undefined") {
                                newIndexesHash[index] = newIndexMap.length;
                                newIndexMap.push(index);
                            }
                        }
                    }
                }
            }
            this._updateIndexMap(newIndexMap, newIndexesHash);
        }
    },

    draw: {
        value: function () {
            var i,
                length = this._repetitionComponents.length,
                slideIndex, slideTime,
                style,
                j,
                iElement,
                pathsLength = this._paths.length,
                pathIndex,
                pos,
                pos3,
                positionKeys,
                positionKeyCount,
                jPositionKey,
                indexMap = this._repetition._indexMap,
                iRepetitionComponentElement,
                indexTime,
                rotation,
                offset,
                epsilon = .00001;

            var time = Date.now(),
                iterations = 6,
                interval1 = this.lastDrawTime ? (time - this.lastDrawTime) * .018 * this._elasticScrollingSpeed : 0,
                interval = 1 - (interval1 / iterations),
                offset1, offset2, resultOffset,
                min = this._minSlideOffsetIndex,
                max = this._maxSlideOffsetIndex;

            this.lastDrawTime = time;
            for (j = 0; j < iterations; j++) {
                for (i = this._draggedSlideIndex - 1; i >= min; i--) {
                    offset1 = this._getSlideOffset(i);
                    offset2 = this._getSlideOffset(i + 1);
                    resultOffset = (offset1 - offset2) * interval + offset2;
                    if (resultOffset > 0) {
                        resultOffset = 0;
                    }
                    this._updateSlideOffset(i, resultOffset);
                }
                for (i = this._draggedSlideIndex + 1; i <= max; i++) {
                    offset1 = this._getSlideOffset(i);
                    offset2 = this._getSlideOffset(i - 1);
                    resultOffset = (offset1 - offset2) * interval + offset2;
                    if (resultOffset < 0) {
                        resultOffset = 0;
                    }
                    this._updateSlideOffset(i, resultOffset);
                }
            }
            if (this._isTransitioningScroll) {
                this.needsDraw = true;
            }
            if (this._isCameraUpdated) {
                var perspective = Math.tan(((90 - this.cameraFov * .5) * this._doublePI) / 360) * this._height * .5,
                    vX = this.cameraTargetPoint[0] - this.cameraPosition[0],
                    vY = this.cameraTargetPoint[1] - this.cameraPosition[1],
                    vZ = this.cameraTargetPoint[2] - this.cameraPosition[2],
                    yAngle = Math.atan2(-vX, -vZ),  // TODO: Review this
                    tmpZ,
                    xAngle;

                tmpZ = vX * -Math.sin(-yAngle) + vZ * Math.cos(-yAngle);
                xAngle = Math.atan2(-vY, -tmpZ);
                this._element.style.webkitPerspective = perspective + "px";
                this._cameraElement.style.webkitTransform =
                    "translate3d(0,0," + perspective + "px)rotateX(" + xAngle + "rad)rotateY(" + (-yAngle) + "rad)" +
                    "translate3d(" + (-this.cameraPosition[0]) + "px," + (-this.cameraPosition[1]) + "px," + (-this.cameraPosition[2]) + "px)";
                this._isCameraUpdated = false;
            }
            if (this.splinePaths.length) {
                for (i = 0; i < length; i++) {
                    offset = this.offset(indexMap[i]);
                    pathIndex = offset.pathIndex;
                    slideTime = offset.slideTime;
                    indexTime = this._splinePaths[pathIndex]._convertSplineTimeToBezierIndexTime(slideTime);
                    iElement = this._repetitionComponents[i].element.parentNode;
                    if (indexTime !== null) {
                        pos = this._splinePaths[pathIndex].getPositionAtIndexTime(indexTime);
                        rotation = this._splinePaths[pathIndex].getRotationAtIndexTime(indexTime);
                        style =
                            "-webkit-transform:translate3d(" + (((pos[0] * 100000) >> 0) * .00001) + "px," + (((pos[1] * 100000) >> 0) * .00001) + "px," + (((pos[2] * 100000) >> 0) * .00001) + "px)" +
                            (rotation[2] ? "rotateZ(" + (((rotation[2] * 100000) >> 0) * .00001) + "rad)" : "") +
                            (rotation[1] ? "rotateY(" + (((rotation[1] * 100000) >> 0) * .00001) + "rad)" : "") +
                            (rotation[0] ? "rotateX(" + (((rotation[0] * 100000) >> 0) * .00001) + "rad)" : "") + ";" +
                            this._splinePaths[pathIndex].getStyleAtIndexTime(indexTime);
                        iElement.setAttribute("style", style);
                    } else {
                        iElement.setAttribute("style", "-webkit-transform:scale3d(0,0,0);opacity:0");
                    }
                }
            } else {
                for (i = 0; i < length; i++) {
                    iElement = this._repetitionComponents[i].element.parentNode;
                    iElement.setAttribute("style", "-webkit-transform:scale3d(0,0,0);opacity:0");
                }
            }
            this.needsDraw = true;
        }
    },

    _updateLength: {
        value: function () {
            if (this._paths) {
                var iPath,
                    pathsLength = this._paths.length,
                    iterations,
                    iLength,
                    maxLength = 0,
                    div, mod,
                    i;

                if (pathsLength > 0) {
                    mod = this._numberOfIterations % pathsLength;
                    div = (this._numberOfIterations - mod) / pathsLength;
                    for (i = 0; i < pathsLength; i++) {
                        iPath = this._paths[i];
                        iterations = div + ((i < mod) ? 1 : 0);
                        iLength = iterations - iPath.tailOffset + iPath.headOffset - 1;
                        if (iLength > maxLength) {
                            maxLength = iLength;
                        }
                    }
                    this.length = maxLength;
                }
                this.needsDraw = true;
            }
        }
    },

    _numberOfIterations: {
        value: 0
    },

    numberOfIterations: {
        get: function () {
            return this._numberOfIterations;
        },
        set: function (value) {
            if (this._numberOfIterations !== value) {
                this._numberOfIterations = value;
                this._updateLength();
            }
        }
    },

    _objects: {
        value: null
    },

    objects: {
        get: function() {
            return this._objects;
        },
        set: function(value) {
            this._objects = value;
            this.needsDraw = true;
        }
    },

    contentController: {
        value: null
    },

    isSelectionEnabled: {
        value: null
    },

    selectedIndexes: {
        serializable: false,
        value: null
    },

    activeIndexes: {
        serializable: false,
        value: null
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

    _orphanedChildren: {
        value: null
    },

    deserializedFromTemplate: {
        value: function() {
            this._orphanedChildren = this.childComponents;
            this.childComponents = null;
        }
    },

    templateDidLoad: {
        value: function() {
            var orphanedFragment,
                currentContentRange = this.element.ownerDocument.createRange(),
                wrapper,
                self = this;

            currentContentRange.selectNodeContents(this.element);
            orphanedFragment = currentContentRange.extractContents();
            wrapper = this._repetition.element.appendChild(document.createElement("div"));
            wrapper.appendChild(orphanedFragment);
            wrapper.setAttribute("data-montage-id","wrapper");
            this._repetition.indexMapEnabled = true;
            this._repetition.childComponents = this._orphanedChildren;
            this._repetition.willDraw = function () {
                self.needsDraw = true;
            }
            Object.defineBinding(this, "numberOfIterations", {
                boundObject: this._repetition,
                boundObjectPropertyPath: "_objects.count()",
                oneway: "true"
            });
        }
    },

    _length: {
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

    _scroll: {
        value: 0
    },

    _range: {
        value: 20
    },

    _hasElasticScrolling: {
        value: false
    },

    hasElasticScrolling: {
        get: function () {
            return this._hasElasticScrolling;
        },
        set: function (value) {
            if (value) {
                this._hasElasticScrolling = true;
            } else {
                this._hasElasticScrolling = false;
            }
        }
    },

    _slideOffsets: {
        value: null
    },

    _slideOffsetsLength: {
        value: 0
    },

    _maxSlideOffsetIndex: {
        value: -1
    },

    _minSlideOffsetIndex: {
        value: 2e9
    },

    _updateSlideOffset: {
        value: function (index, value) {
            var epsilon = 1e-4;

            if (index >= 0) {
                if ((value < -epsilon) || (value > epsilon)) {
                    if (typeof this._slideOffsets[index] === "undefined") {
                        this._slideOffsetsLength++;
                        if (index < this._minSlideOffsetIndex) {
                            this._minSlideOffsetIndex = index;
                        }
                        if (index > this._maxSlideOffsetIndex) {
                            this._maxSlideOffsetIndex = index;
                        }
                    }
                    this._slideOffsets[index] = value;
                } else {
                    this._removeSlideOffset(index);
                }
            }
        }
    },

    _incrementSlideOffset: {
        value: function (index, value) {
            this._updateSlideOffset(index, this._getSlideOffset(index) + value);
        }
    },

    _removeSlideOffset: {
        value: function (index) {
            if (typeof this._slideOffsets[index] !== "undefined") {
                var keys, i, integerKey;

                delete this._slideOffsets[index];
                this._slideOffsetsLength--;
                if (index === this._minSlideOffsetIndex) {
                    keys = Object.keys(this._slideOffsets);
                    this._minSlideOffsetIndex = 2e9;
                    for (i = 0; i < keys.length; i++) {
                        integerKey = keys[i] | 0;
                        if (integerKey < this._minSlideOffsetIndex) {
                            this._minSlideOffsetIndex = integerKey;
                        }
                    }
                }
                if (index === this._maxSlideOffsetIndex) {
                    if (typeof keys === "undefined") {
                        keys = Object.keys(this._slideOffsets);
                    }
                    this._maxSlideOffsetIndex = -1;
                    for (i = 0; i < keys.length; i++) {
                        integerKey = keys[i] | 0;
                        if (integerKey > this._maxSlideOffsetIndex) {
                            this._maxSlideOffsetIndex = integerKey;
                        }
                    }
                }
            }
        }
    },

    _getSlideOffset: {
        value: function (index) {
            if (index < this._minSlideOffsetIndex) {
                if (this._minSlideOffsetIndex > this._draggedSlideIndex) {
                    index = this._draggedSlideIndex;
                } else {
                    index = this._minSlideOffsetIndex;
                }
            } else {
                if (index > this._maxSlideOffsetIndex) {
                    if (this._maxSlideOffsetIndex < this._draggedSlideIndex) {
                        index = this._draggedSlideIndex;
                    } else {
                        index = this._maxSlideOffsetIndex;
                    }
                }
            }
            if (typeof this._slideOffsets[index] !== "undefined") {
                return this._slideOffsets[index];
            } else {
                return 0;
            }
        }
    },

    scroll: {
        get: function () {
            return this._scroll;
        },
        set: function (value) {
            if (value < 0) {
                value = 0;
            }
            if (value > this.length) {
                value = this.length;
            }
            if (this._hasElasticScrolling && (this._draggedSlideIndex !== null)) {
                var i,
                    n,
                    min = this._draggedSlideIndex - this._range,
                    max = this._draggedSlideIndex + this._range,
                    tmp,
                    j,
                    x;

                if (min > this._minSlideOffsetIndex) {
                    min = this._minSlideOffsetIndex;
                }
                if (max < this._maxSlideOffsetIndex) {
                    max = this._maxSlideOffsetIndex;
                }
                tmp = value - this._scroll;
                if (min < 0) {
                    min = 0;
                }
                for (i = min; i <= max; i++) {
                    if (i !== this._draggedSlideIndex) {
                        this._incrementSlideOffset(i, tmp);
                    } else {
                        this._removeSlideOffset(i);
                    }
                }
                this._scroll = value;
            } else {
                this._scroll = value;
            }

            this.needsDraw = true;
        }
    },

    _isInputEnabled: { // TODO: Replace by pointerBehavior
        value: true
    },

    isInputEnabled: {
        get: function () {
            return this._isInputEnabled;
        },
        set: function (value) {
            if (value) {
                this._isInputEnabled = true;
            } else {
                this._isInputEnabled = false;
            }
        }
    },

    _draggedSlideIndex: {
        value: 0
    },

    draggedSlideIndex: {
        get: function () {
            return this._draggedSlideIndex;
        },
        set: function (value) {
            if (value !== this._draggedSlideIndex) {
                if (value !== null) {
                    var offset = this._getSlideOffset(value),
                        min = this._minSlideOffsetIndex,
                        max = this._maxSlideOffsetIndex,
                        i;

                    this._incrementSlideOffset(this._draggedSlideIndex, -offset);
                    for (i = min; i <= max; i++) {
                        if (i !== this._draggedSlideIndex) {
                            this._incrementSlideOffset(i, -offset);
                        }
                    }
                    this._removeSlideOffset(value);
                    this._scroll -= offset;
                    this._flowTranslateComposer._scroll = this._scroll;
                }
                this._draggedSlideIndex = value;
                this.needsDraw = true;
            }
        }
    },

    _elasticScrollingSpeed: {
        value: 1
    },

    lastDrawTime: {
        value: null
    },

    offset: {
        enumerable: false,
        value: function (slideIndex) {
            var pathsLength = this._paths.length,
                pathIndex = slideIndex % pathsLength,
                slideTime = Math.floor(slideIndex / pathsLength) - this._scroll + this._paths[pathIndex].headOffset;

            return {
                pathIndex: pathIndex,
                slideTime: slideTime + this._getSlideOffset(slideIndex)
            };
        }
    },

    serializeSelf: {
        value: function(serializer) {
            serializer.setProperties();

            // TODO: we need a way to add nodes to the serialization... we only
            // have methods to serialize components.

            // HACK: we're only going to serialize components if their DOM
            // element is a direct child of the flow, since we don't have a way
            // to add elements to the serialization there's really no point in
            // doing anyelse reliably.
            var originalContent = this.originalContent;
            for (var i = 0, node; node = originalContent[i]; i++) {
                if (node.controller) {
                    serializer.addObject(node.controller);
                }
            }
        }
    }

});
