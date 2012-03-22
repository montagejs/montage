var Montage = require("montage").Montage;

exports.FlowFrustumCulling = Montage.create(Montage, {

    templateDidLoad: {
        value: function () {
            this.start();
        }
    },

    splineColor: {
        value: "rgba(0, 0, 0, .3)"
    },

    drawSpline: {
        value: function (spline) {
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

    drawSegment: {
        value: function (intersection) {
            var spline = this.flow.splinePath,
                vectorIndex = intersection[0] * 3,
                p0 = spline._knots[vectorIndex],
                p1 = spline._nextHandlers[vectorIndex],
                p2 = spline._previousHandlers[vectorIndex + 1],
                p3 = spline._knots[vectorIndex + 1],
                tmp;

            tmp = spline.deCasteljau(p0, p1, p2, p3, intersection[1])[1];
            tmp = spline.deCasteljau(
                tmp[0], tmp[1], tmp[2], tmp[3],
                (intersection[2] - intersection[1]) / (1 - intersection[1])
            )[0];
            this._context.beginPath();
            this._context.moveTo(tmp[0][0], tmp[0][1]);
            this._context.bezierCurveTo(tmp[1][0], tmp[1][1], tmp[2][0], tmp[2][1], tmp[3][0], tmp[3][1]);
            this._context.stroke();
        }
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
    
    _scale: {
        enumerable: false,
        value: 1
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
        enumerable: false,
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
    
    cameraColor: {
        value: "red"
    },

    transformVector: {
        value: function(vector) {
            var matrix = this._transformMatrix;

            return [
                (vector[0] * matrix[0] + vector[1] * matrix[4] + vector[2] * matrix [8]) * this._scale + matrix[12] + this._halfWidth - this._centralX * this._scale,
                (vector[0] * matrix[1] + vector[1] * matrix[5] + vector[2] * matrix [9]) * this._scale + matrix[13] + this._halfHeight - this._centralY * this._scale,
                (vector[0] * matrix[3] + vector[1] * matrix[6] + vector[2] * matrix [10]) * this._scale + matrix[14] + this._halfHeight - this._centralY * this._scale                
            ];
        }
    },

    rotateVector: {
        value: function(vector) {
            var vX = this.cameraTargetPoint[0] - this.cameraPosition[0],
                vY = this.cameraTargetPoint[1] - this.cameraPosition[1],
                vZ = this.cameraTargetPoint[2] - this.cameraPosition[2],
                yAngle = Math.PI/2 - Math.atan2(vZ, vX),
                tmpZ,
                rX, rY, rZ,
                xAngle;

//            tmpZ = vX * -Math.sin(-yAngle) + vZ * Math.cos(-yAngle);
            tmpZ = vX * Math.sin(yAngle) + vZ * Math.cos(yAngle);
            xAngle = Math.PI/2 - Math.atan2(tmpZ, vY);
            rX = vector[0];
            rY = vector[1] * Math.cos(-xAngle) - vector[2] * Math.sin(-xAngle);
            rZ = vector[1] * Math.sin(-xAngle) + vector[2] * Math.cos(-xAngle);
            return [
                rX * Math.cos(-yAngle) - rZ * Math.sin(-yAngle),
                rY,
                rX * Math.sin(-yAngle) + rZ * Math.cos(-yAngle)
            ];
        }
    },

    drawCamera: {
        value: function () {
            this.cameraPosition = this.flow.cameraPosition;
            this.cameraTargetPoint = this.flow.cameraTargetPoint;
            this.cameraFov = this.flow.cameraFov;
            this.cameraRoll = this.flow.cameraRoll;            

            if (this.cameraPosition) {
                var tPos = this.transformVector(this.cameraPosition),
                    tFocus = this.transformVector(this.cameraTargetPoint),
                    angle = ((this.cameraFov * .5) * Math.PI * 2) / 360,
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
    
    draw: {
        value: function () {
            var spline = this.flow.splinePath,
                self = this,
                intersections,
                time = new Date().getTime() / 3000,
                x = 250+ Math.cos(time*1.71) * 100,
                y = 250+ Math.sin(time*1.71) * 100,
                i,
                j;

            this.width = this.flow.width = 500;
            this.height = this.flow.height = 500;
            this.centralX = 250;
            this.centralY = 250;
            this.flow.cameraFov = 80;
            this.flow.cameraPosition = [x, y, 250];
            this.flow.cameraTargetPoint = [x + Math.cos(time) * 100, y + Math.sin(time*1.71)*100, 250];
            this._context.clearRect(0, 0, 500, 500);            
            this.drawSpline(spline);
            intersections = this.flow._computeVisibleRange();
            for (i = 0; i < intersections.length; i++) {
                for (j = Math.ceil(intersections[i][0]); j < intersections[i][1]; j++) {
                    var tmp = spline.getPositionAtTime(j);
                    this._context.beginPath();
                    this._context.arc(tmp[0] + .5, tmp[1] + .5, this.flow.elementsBoundingSphereRadius, 0, Math.PI*2, true); 
                    this._context.stroke();
                }
            }
            this.drawCamera();
            window.setTimeout(function () {
                    self.draw();
            }, 16);
        }
    },

    start: {
        value: function () {
            if (this.flow.splinePath) {
                var knots = [],
                    next = [],
                    previous = [],
                    densities = [],
                    i;

                this._context = this.view.getContext("2d");
                for (i = 0; i < 30; i++) {
                    knots[i] = [
                        Math.random() * 500,
                        Math.random() * 500,
                        250
                    ];
                    next[i] = [
                        Math.random() * 500,
                        Math.random() * 500,
                        250
                    ];
                    previous[i] = [
                        Math.random() * 500,
                        Math.random() * 500,
                        250
                    ];
                }
                for (i = 0; i < 30; i++) {
                    densities[i] = 5;
                }
                this.flow.splinePath.knots = knots;
                this.flow.splinePath.previousHandlers = previous;
                this.flow.splinePath.nextHandlers = next;
                this.flow.splinePath.densities = densities;
                this.flow.splinePath._computeDensitySummation();
                this.draw();
            } else {
                var self = this;

                window.setTimeout(function () {
                    self.start();
                }, 9);
            }
        }
    }
});