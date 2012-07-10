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
    Component = require("montage/ui/component").Component;

exports.Viewport = Montage.create(Component, {

    _cameraPosition: {
        enumerable: false,
        value: null
    },

    _cameraTargetPoint: {
        enumerable: false,
        value: null
    },

    _cameraFov: {
        enumerable: false,
        value: null
    },

    _cameraRoll: {
        enumerable: false,
        value: null
    },

    cameraPosition: {
        get: function () {
            return this._cameraPosition;
        },
        set: function (value) {
            this._cameraPosition = value;
            this.needsDraw = true;
        }
    },

    cameraTargetPoint: {
        get: function () {
            return this._cameraTargetPoint;
        },
        set: function (value) {
            this._cameraTargetPoint = value;
            this.needsDraw = true;
        }
    },

    cameraFov: {
        get: function () {
            return this._cameraFov;
        },
        set: function (value) {
            this._cameraFov = value;
            this.needsDraw = true;
        }
    },

    cameraRoll: {
        get: function () {
            return this._cameraRoll;
        },
        set: function (value) {
            this._cameraRoll = value;
            this.needsDraw = true;
        }
    },

    _isDrawingHandlers: {
        enumerable: false,
        value: true
    },

    isDrawingHandlers: {
        get: function () {
            return this._isDrawingHandlers;
        },
        set: function (value) {
            this._isDrawingHandlers = value;
            this.needsDraw = true;
        }
    },

    _isDrawingDensities: {
        enumerable: false,
        value: false
    },

    isDrawingDensities: {
        get: function () {
            return this._isDrawingDensities;
        },
        set: function (value) {
            this._isDrawingDensities = value;
            this.needsDraw = true;
        }
    },

    _isHighlightingCloserKnot: {
        enumerable: false,
        value: false
    },

    isHighlightingCloserKnot: {
        get: function () {
            return this._isHighlightingCloserKnot;
        },
        set: function (value) {
            this._isHighlightingCloserKnot = value;
            this.needsDraw = true;
        }
    },

    _isHighlightingCloserHandler: {
        enumerable: false,
        value: false
    },

    isHighlightingCloserHandler: {
        get: function () {
            return this._isHighlightingCloserHandler;
        },
        set: function (value) {
            this._isHighlightingCloserHandler = value;
            this.needsDraw = true;
        }
    },

    spline: {
        value: null
    },

    _width: {
        enumerable: false,
        value: 300
    },

    _halfWidth: {
        enumerable: false,
        value: 150
    },

    width: {
        get: function () {
            return this._width;
        },
        set: function (value) {
            this._width = value;
            this._halfWidth = value / 2;
            this._transformSpline();
            this.needsDraw = true;
        }
    },

    _height: {
        enumerable: false,
        value: 150
    },

    _halfHeight: {
        enumerable: false,
        value: 75
    },

    height: {
        get: function () {
            return this._height;
        },
        set: function (value) {
            this._height = value;
            this._halfHeight = value / 2;
            this._transformSpline();
            this.needsDraw = true;
        }
    },

    _needsResize: {
        enumerable: false,
        value: false
    },

    _scale: {
        enumerable: false,
        value: .2
    },

    scale: {
        get: function () {
            return this._scale;
        },
        set: function (value) {
            this._scale = value;
            this._transformSpline();
            this.needsDraw = true;
        }
    },

    _centralX: {
        enumerable: false,
        value: 0
    },

    centralX: {
        get: function () {
            return this._centralX;
        },
        set: function (value) {
            this._centralX = value;
            this._transformSpline();
            this.needsDraw = true;
        }
    },

    _centralY: {
        enumerable: false,
        value: 0
    },

    centralY: {
        get: function () {
            return this._centralY;
        },
        set: function (value) {
            this._centralY = value;
            this._transformSpline();
            this.needsDraw = true;
        }
    },

    _transformedSpline: {
        enumerable: false,
        value: null
    },

    _transformSpline: {
        enumerable: false,
        value: function () {
            if (this.spline) {
                var matrix = [],
                    i;

                for (i = 0; i<12; i++) {
                    matrix[i] = this._transformMatrix[i] * this._scale;
                }
                matrix[12] = this._transformMatrix[12] + this._halfWidth - this._centralX * this._scale;
                matrix[13] = this._transformMatrix[13] + this._halfHeight - this._centralY * this._scale;
                matrix[14] = this._transformMatrix[14];
                matrix[15] = this._transformMatrix[15];
                this._transformedSpline = this.spline.transform(matrix);
            }
        }
    },

    _transformMatrix: {
        value: [
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
        ]
    },

    transformMatrix: {
        get: function () {
            return this._transformMatrix;
        },
        set: function (value) {
            this._transformMatrix = value;
            this._transformSpline();
            this.needsDraw = true;
        }
    },

    _drawGrid: {
        enumerable: false,
        value: function () {
            var offsetX = this._halfWidth - this._centralX * this._scale,
                offsetY = this._halfHeight - this._centralY * this._scale,
                x,
                xStart,
                sEnd,
                y,
                yStart,
                yEnd;

            this._context.save();
            if (this._scale >= .02) {
                if (this._scale < .06) {
                    var color = Math.floor(68 - (this._scale - .02) * 150);

                    this._context.fillStyle = "rgb(" + color + ", " + color + ", " + color + ")";
                } else {
                    this._context.fillStyle = "rgb(62, 62, 62)";
                }
                xStart = ((-offsetX / (this._scale * 5)) >> 1) * 100;
                xEnd = (((this._width - offsetX) / (this._scale * 5)) >> 1) * 100;
                for (x = xStart; x <= xEnd; x += 100) {
                    this._context.fillRect(Math.floor(offsetX + x * this._scale), 0, 1,  this._height);
                }
                yStart = ((-offsetY / (this._scale * 5)) >> 1) * 100;
                yEnd = (((this._height - offsetY) / (this._scale * 5)) >> 1) * 100;
                for (y = yStart; y <= yEnd; y += 100) {
                    this._context.fillRect(0, Math.floor(offsetY + y * this._scale), this._width, 1);
                }
            }
            this._context.fillStyle = "#2e2e2e";
            this._context.fillRect(0, Math.floor(offsetY), this._width, 1);
            this._context.fillRect(Math.floor(offsetX), 0, 1,  this._height);
            this._context.restore();
        }
    },

    splineColor: {
        value: "rgba(255, 255, 255, .7)"
    },

    knotColor: {
        value: "rgba(255, 255, 255, .7)"
    },

    handlerColor: {
        value: "rgba(17, 189, 251, .6)"
    },

    drawKnots: {
        value: function (spline) {
            var length = spline.knotsLength,
                i;

            this._context.save();
            for (i = 0; i < length; i++) {
                this._context.fillStyle = this.knotColor;
                this._context.fillRect((spline.getKnot(i)[0] >> 0) - 2, (spline.getKnot(i)[1] >> 0) - 2, 5, 5);
            }
            this._context.restore();
        }
    },

    drawHandler: {
        value: function(start, end) {
            if (end) {
                this._context.beginPath();
                this._context.moveTo(start[0] + .5, start[1] + .5);
                this._context.lineTo(end[0] + .5, end[1] + .5);
                this._context.stroke();
                this._context.fillRect(end[0] - 1, end[1] - 1, 3, 3);
            }
        }
    },

    drawDensities: {
        value: function(spline) {
            var maxTime = spline.maxTime,
                b,
                i;

            this._context.save();
            this._context.fillStyle= "rgba(231, 255, 87, .45)";
            for (i = 0; i<maxTime; i++) {
                b = spline.getPositionAtTime(i, [], []);
                this._context.fillRect(b[0]-2, b[1]-2, 5, 5);
            }
            this._context.restore();
        }
    },

    drawHandlers: {
        value: function(spline, indexes) {
            var length = spline.knotsLength,
                i;

            this._context.save();
            this._context.beginPath();
            this._context.strokeStyle = this.handlerColor;
            this._context.fillStyle = this.handlerColor;
            if (!indexes) {
                for (i = 0; i < length; i++) {
                    this.drawHandler(spline.getKnot(i), spline.getPreviousHandler(i));
                    this.drawHandler(spline.getKnot(i), spline.getNextHandler(i));
                }
            } else {
                for (i = 0; i < indexes.length; i++) {
                    this.drawHandler(spline.getKnot(indexes[i]), spline.getPreviousHandler(indexes[i]));
                    this.drawHandler(spline.getKnot(indexes[i]), spline.getNextHandler(indexes[i]));
                }
            }
            this._context.restore();
        }
    },

    drawSpline: {
        value: function(spline) {
            var length = spline.knotsLength - 1,
                i;

            this._context.save();
            this._context.strokeStyle = this.splineColor;
            this._context.beginPath();
            for (i = 0; i < length; i++) {
                if (spline.getNextHandler(i) && spline.getPreviousHandler(i + 1)) {
                    this._context.moveTo(spline.getKnot(i)[0] + .5, spline.getKnot(i)[1] + .5);
                    this._context.bezierCurveTo(
                        spline.getNextHandler(i)[0] + .5,
                        spline.getNextHandler(i)[1] + .5,
                        spline.getPreviousHandler(i + 1)[0] + .5,
                        spline.getPreviousHandler(i + 1)[1] + .5,
                        spline.getKnot(i + 1)[0] + .5,
                        spline.getKnot(i + 1)[1] + .5
                    );
                }
            }
            this._context.stroke();
            this._context.restore();
        }
    },

    cameraColor: {
        value: "rgba(255, 110, 30, .5)"
    },

    transformVector: {
        value: function(vector) {
            var matrix = this._transformMatrix;

            return [
                (vector[0] * matrix[0] + vector[1] * matrix[4] + vector[2] * matrix [8]) * this._scale + matrix[12] + this._halfWidth - this._centralX * this._scale,
                (vector[0] * matrix[1] + vector[1] * matrix[5] + vector[2] * matrix [9]) * this._scale + matrix[13] + this._halfHeight - this._centralY * this._scale
            ];
        }
    },

    rotateVector: {
        value: function(vector) {
            var vX = this.cameraTargetPoint[0] - this.cameraPosition[0],
                vY = this.cameraTargetPoint[1] - this.cameraPosition[1],
                vZ = this.cameraTargetPoint[2] - this.cameraPosition[2],
                yAngle = Math.atan2(vX, vZ),
                tmpZ,
                rX, rY, rZ,
                xAngle;

            tmpZ = vX * -Math.sin(-yAngle) + vZ * Math.cos(-yAngle);
            xAngle = Math.atan2(vY, tmpZ);
            rX = vector[0];
            rY = vector[1] * Math.cos(-xAngle) - vector[2] * Math.sin(-xAngle);
            rZ = vector[1] * Math.sin(-xAngle) + vector[2] * Math.cos(-xAngle);
            return [
                rX * Math.cos(yAngle) + rZ * Math.sin(yAngle),
                rY,
                rX * -Math.sin(yAngle) + rZ * Math.cos(yAngle)
            ];
        }
    },

    drawCamera: {
        value: function () {
            if (this.cameraPosition) {
                var tPos = this.transformVector(this.cameraPosition),
                    tFocus = this.transformVector(this.cameraTargetPoint),
                    angle = ((this.cameraFov * .5) * Math.PI * 2) / 360,
                    //yAngle = Math.atan2(this.cameraTargetPoint[0] - this.cameraPosition[0], this.cameraTargetPoint[2] - this.cameraPosition[2]),
                    x = Math.sin(angle) * 60 / this.scale,
                    y = Math.cos(angle) * 60 / this.scale,
                    z = y,
                    line = [],
                    i,
                    tmp;

                for (i = 0; i < 4; i++) {
                    tmp = this.rotateVector([[x, -x, z], [-x, -x, z], [-x, x, z], [x, x, z]][i]);
                    line[i] = [this.cameraPosition[0] + tmp[0], this.cameraPosition[1] + tmp[1], this.cameraPosition[2] + tmp[2]];
                    line[i + 4] = [this.cameraPosition[0] + tmp[0] * 100000, this.cameraPosition[1] + tmp[1] * 100000, this.cameraPosition[2] + tmp[2] * 100000];
                }
                /*tmp = this.rotateVector([-x, -x, z]);
                line[1] = [this.cameraPosition[0] + tmp[0], this.cameraPosition[1] + tmp[1], this.cameraPosition[2] + tmp[2]];
                tmp = this.rotateVector([-x, x, z]);
                line[2] = [this.cameraPosition[0] + tmp[0], this.cameraPosition[1] + tmp[1], this.cameraPosition[2] + tmp[2]];
                tmp = this.rotateVector([x, x, z]);
                line[3] = [this.cameraPosition[0] + tmp[0], this.cameraPosition[1] + tmp[1], this.cameraPosition[2] + tmp[2]];*/
                this._context.save();
                this._context.fillStyle = this._context.strokeStyle = this.cameraColor;
                this._context.fillRect((tPos[0] >> 0) - 3, (tPos[1] >> 0) - 3, 7, 7);
                this._context.fillRect((tFocus[0] >> 0) - 2, (tFocus[1] >> 0) - 2, 5, 5);
                this._context.beginPath();
                this._context.lineWidth = .5;
                for (i = 0; i < 8; i++) {
                    line[i] = this.transformVector(line[i]);
                    this._context.moveTo(tPos[0] + .5, tPos[1] + .5);
                    this._context.lineTo(line[i][0] + .5, line[i][1] + .5);
                }
                this._context.stroke();
                this._context.beginPath();
                this._context.lineWidth = 1;
                this._context.moveTo(tPos[0] + .5, tPos[1] + .5);
                this._context.lineTo(tFocus[0] + .5, tFocus[1] + .5);
                for (i = 0; i < 4; i++) {
                    this._context.moveTo(tPos[0] + .5, tPos[1] + .5);
                    this._context.lineTo(line[i][0] + .5, line[i][1] + .5);
                    this._context.lineTo(line[(i + 1) % 4][0] + .5, line[(i + 1) % 4][1] + .5);
                }
                this._context.stroke();
                this._context.restore();
            }
        }
    },

    _closerKnot: {
        enumerable: false,
        value: null
    },

    closerKnot: {
        get: function () {
            return this._closerKnot;
        },
        set: function (value) {
            if (this._closerKnot !== value) {
                this._closerKnot = value;
                this.needsDraw = true;
            }
        }
    },

    _computeCloserKnot: {
        value: function (spline, x, y) {
            if (this.spline) {
                var minDist = null,
                    minIndex = null,
                    distance,
                    length = spline.knotsLength,
                    iKnot,
                    i;

                for (i = 0; i < length; i++) {
                    iKnot = this._transformedSpline.getKnot(i);
                    distance = (iKnot[0] - x) * (iKnot[0] - x) + (iKnot[1] - y) * (iKnot[1] - y);
                    if ((minDist === null) || (distance < minDist)) {
                        minIndex = i;
                        minDist = distance;
                    }
                }
                if ((minIndex !== null) && (minDist < 100)) {
                    this.closerKnot = minIndex;
                } else {
                    this.closerKnot = null;
                }
            } else {
                this.closerKnot = null
            }
        }
    },

    _closerHandler: {
        enumerable: false,
        value: null
    },

    closerHandler: {
        get: function () {
            return this._closerHandler;
        },
        set: function (value) {
            if (this._closerHandler !== value) {
                this._closerHandler = value;
                this.needsDraw = true;
            }
        }
    },

    _squaredCloserMinimumDistance: {
        enumerable: false,
        value: 100
    },

    _computeCloserVector: {
        value: function (vectorsArray, x, y) {
            var minDist = null,
                minIndex = null,
                distance,
                length = vectorsArray.length,
                iVector,
                i;

            for (i = 0; i < length; i++) {
                iVector = vectorsArray[i];
                distance = (iVector[0] - x) * (iVector[0] - x) + (iVector[1] - y) * (iVector[1] - y);
                if ((minDist === null) || (distance < minDist)) {
                    minIndex = i;
                    minDist = distance;
                }
            }
            if ((minIndex !== null) && (minDist < this._squaredCloserMinimumDistance)) {
                return minIndex;
            } else {
                return null;
            }
        }
    },

    _computeCloserHandler: {
        value: function (spline, x, y) {
            // TODO: Add previousHandlers
            this.closerHandler = this._computeCloserVector(this._transformedSpline.nextHandlers, x, y);
        }
    },

    handleMousewheel: {
        enumerable: false,
        value: function (event) {
            var offsetX = this._halfWidth - this._centralX * this._scale,
                offsetZ = this._halfHeight - this._centralY * this._scale;

            if (event.wheelDelta > 0) {
                this.centralX += ((event.offsetX - offsetX) / this._scale - this._centralX) * .05;
                this.centralY += ((event.offsetY - offsetZ) / this._scale - this._centralY) * .05;
                this.scale *= 1.05;
            } else {
                this.centralX -= ((event.offsetX - offsetX) / this._scale - this._centralX) * .05;
                this.centralY -= ((event.offsetY - offsetZ) / this._scale - this._centralY) * .05;
                this.scale /= 1.05;
            }
            this._computeCloserKnot(this.spline, event.offsetX, event.offsetY);
            this._computeCloserHandler(this.spline, event.offsetX, event.offsetY);
        }
    },

    handleMouseover: {
        enumerable: false,
        value: function (event) {
            this._element.addEventListener("mousemove", this, false);
            this._element.removeEventListener("mouseover", this, false);
            this._element.addEventListener("mouseout", this, false);
        }
    },

    handleMouseout: {
        enumerable: false,
        value: function () {
            this._element.removeEventListener("mousemove", this, false);
            this._element.addEventListener("mouseover", this, false);
            this._element.removeEventListener("mouseout", this, false);
        }
    },

    handleMousemove: {
        enumerable: false,
        value: function (event) {
            var deltaX = (this._pointerPageX - event.pageX) / this._scale,
                deltaY = (this._pointerPageY - event.pageY) / this._scale;

            if (this._isDragging && !this._isScrolling && this.mousemoveDelegate) {
                this.mousemoveDelegate(deltaX, deltaY, this._closerKnot, this._closerHandler, this._isScrolling);
            }
            if (!this._isDragging) {
                if (this._isHighlightingCloserKnot) {
                    this._computeCloserKnot(this.spline, event.offsetX, event.offsetY);
                }
                if (this._isHighlightingCloserHandler) {
                    this._computeCloserHandler(this.spline, event.offsetX, event.offsetY);
                }
            } else {
                if (this._isScrolling) {
                    this.centralX += deltaX;
                    this.centralY += deltaY;
                }
            }
            this._pointerPageX = event.pageX;
            this._pointerPageY = event.pageY;
        }
    },

    handleMouseup: {
        enumerable: false,
        value: function (event) {
            this._isDragging = false;
            this._isScrolling = false;
            this._element.addEventListener("mousemove", this, false);
            document.removeEventListener("mousemove", this, false);
            document.removeEventListener("mouseup", this, false);
            if (this._isHighlightingCloserKnot) {
                this._computeCloserKnot(this.spline, event.offsetX, event.offsetY);
                this._computeCloserHandler(this.spline, event.offsetX, event.offsetY);
            }
        }
    },

    _isDragging: {
        value: false
    },

    _isScrolling: {
        value: false
    },

    updateSpline: {
        value: function (blockCloserKnot) {
            this._transformSpline();
            if (!blockCloserKnot) {
                this._computeCloserKnot(this.spline, event.offsetX, event.offsetY);
                this._computeCloserHandler(this.spline, event.offsetX, event.offsetY);
            }
            this.needsDraw = true;
        }
    },

    handleMousedown: {
        enumerable: false,
        value: function (event) {
            this._pointerOffsetX = event.offsetX;
            this._pointerOffsetY = event.offsetY;
            this._pointerPageX = event.pageX;
            this._pointerPageY = event.pageY;
            this._isDragging = true;
            this._isScrolling = true;
            if (this.mousedownDelegate) {
                this._isScrolling = this.mousedownDelegate(
                    (this._pointerOffsetX - this._halfWidth) / this.scale + this._centralX,
                    (this._pointerOffsetY - this._halfHeight) / this.scale + this._centralY,
                    this._closerKnot,
                    this._closerHandler,
                    this._isScrolling
                );
            }
            this._element.removeEventListener("mousemove", this, false);
            document.addEventListener("mousemove", this, false);
            document.addEventListener("mouseup", this, false);
            event.preventDefault();
        }
    },

    prepareForDraw: {
        enumerable: false,
        value: function () {
            this._context = this._element.getContext("2d");
            this._element.addEventListener("mousewheel", this, false);
            this._element.addEventListener("mousedown", this, false);
            this._element.addEventListener("mouseover", this, false);
        }
    },

    willDraw: {
        enumerable: false,
        value: function () {
            if ((this._element.width !== this._width) || (this._element.height !== this._height)) {
                this._needsResize = true;
            }
        }
    },

    draw: {
        enumerable: false,
        value: function () {
            if (this._needsResize) {
                this._element.width = this._width;
                this._element.height = this._height;
                this._needsResize = false;
            } else {
                this._context.clearRect(0, 0, this._width, this._height);
            }
            this._drawGrid();
            this.drawCamera();
            if (this.spline) {
                if (this._isHighlightingCloserKnot && (this.closerKnot !== null)) {
                    this._context.save();
                    this._context.fillStyle = this.knotColor;
                    this._context.fillRect((this._transformedSpline.getKnot(this.closerKnot)[0] >> 0) - 5, (this._transformedSpline.getKnot(this.closerKnot)[1] >> 0) - 5, 11, 11);
                    this._context.fillStyle = "black";
                    this._context.fillRect((this._transformedSpline.getKnot(this.closerKnot)[0] >> 0) - 4, (this._transformedSpline.getKnot(this.closerKnot)[1] >> 0) - 4, 9, 9);
                    this._context.restore();
                }
                if (this._isHighlightingCloserHandler && (this.closerHandler !== null)) {
                    this._context.save();
                    this._context.fillStyle = this.handlerColor;
                    this._context.fillRect((this._transformedSpline._nextHandlers[this.closerHandler][0] >> 0) - 4, (this._transformedSpline._nextHandlers[this.closerHandler][1] >> 0) - 4, 9, 9);
                    this._context.restore();
                }
                this.drawSpline(this._transformedSpline);
                this.drawKnots(this._transformedSpline);
                if (this._isDrawingHandlers) {
                    this.drawHandlers(this._transformedSpline);
                }
                if (this._isDrawingDensities) {
                    this.drawDensities(this._transformedSpline);
                }
            }
        }
    }

});
