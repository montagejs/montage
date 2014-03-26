var Montage = require("../../core/core").Montage;

var FlowBezierSpline = exports.FlowBezierSpline = Montage.specialize( {

    constructor: {
        value: function FlowBezierSpline() {
            this._knots = [];
            this._densities = [];
        }
    },

    knots: {
        get: function () {
            return this._knots;
        },
        set: function (value) {
            this._knots = value;
        }
    },

    previousHandlers: {
        get: function () {
            if (!this._previousHandlers) {
                this._previousHandlers = [];
            }
            return this._previousHandlers;
        },
        set: function (value) {
            this._previousHandlers = value;
        }
    },

    nextHandlers: {
        get: function () {
            if (!this._nextHandlers) {
                this._nextHandlers = [];
            }
            return this._nextHandlers;
        },
        set: function (value) {
            this._nextHandlers = value;
        }
    },

    densities: {
        get: function () {
            return this._densities;
        },
        set: function (value) {
            this._densities = value;
            this._densitiesLength = this._densities.length;
            this._maxTime = null;
        }
    },

    _parameters: {
        value: {}
    },

    parameters: {
        get: function () {
            if (!this._parameters) {
                this._parameters = {};
            }
            return this._parameters;
        },
        set: function (value) {
            this._parameters = value;
            this._parametersLength = this._parameters.length;
        }
    },

    _maxTime: {
        enumerable: false,
        value: null
    },

    computeMaxTime: {
        value: function () {
            this._computeDensitySummation();
            if (this._densitySummation.length) {
                this._maxTime = this._densitySummation[this._densitySummation.length - 1];
            } else {
                this._maxTime = 0;
            }
            return this._maxTime;
        }
    },

    _densitySummation: {
        enumerable: false,
        value: null
    },

    _computeDensitySummation: {
        enumerable: false,
        value: function () {
            var densities = this.densities, length = densities.length - 1,
                sum = 0,
                i;

            this._densitySummation = [];
            for (i = 0; i < length; i++) {
                sum += (densities[i] + densities[i + 1]) / 2;
                this._densitySummation[i] = sum;
            }
            this._maxTime = null;
        }
    },

    _convertSplineTimeToBezierIndexTime: {
        enumerable: false,
        value: function (splineTime) {
            if (splineTime < 0) {
                return null;
            }
            if (this._maxTime === null) {
                this.computeMaxTime();
            }
            if (splineTime >= this._maxTime) {
                return null;
            }
            var densitySummation = this._densitySummation,
                length = densitySummation.length,
                index = length - 1,
                add = length >> 1,
                remainder,
                time,
                a, b, c;

            while (add) {
                if (((index - add) >= 0) && (densitySummation[index - add] > splineTime)) {
                    index -= add;
                } else {
                    add >>= 1;
                }
            }
            remainder = splineTime - (index ? densitySummation[index - 1] : 0);
            a = this._densities[index];
            b = this._densities[index + 1];
            c = a - b;
            if ((c < -1e-10) || (c > 1e-10)) {
                time = (a - Math.sqrt(a * a + (b - a) * 2 * remainder)) / c;
            } else {
                time = remainder / a;
            }
            return [index, time];
        }
    },

    getPositionAtIndexTime: {
        value: function (indexTime) {
            var index = indexTime[0],
                time = indexTime[1],
                p0 = this._knots[index],
                p1 = this._nextHandlers[index],
                p2 = this._previousHandlers[index + 1],
                p3 = this._knots[index + 1],
                y = 1 - time,
                coef1 = y * y * y, // cubic bezier coefficients
                coef2 = y * y * time * 3,
                coef3 = y * time * time * 3,
                coef4 = time * time * time;

            return [
                p0[0] * coef1 + p1[0] * coef2 + p2[0] * coef3 + p3[0] * coef4,
                p0[1] * coef1 + p1[1] * coef2 + p2[1] * coef3 + p3[1] * coef4,
                p0[2] * coef1 + p1[2] * coef2 + p2[2] * coef3 + p3[2] * coef4
            ];
        }
    },

    getRotationAtIndexTime: {
        value: function (indexTime) {
            var index = indexTime[0],
                time = indexTime[1],
                rotateX,
                rotateY,
                rotateZ,
                y = 1 - time,
                parameters = this._parameters;

            if (typeof parameters.rotateX !== "undefined") {
                rotateX = parameters.rotateX.data[index] * y + parameters.rotateX.data[index + 1] * time;
            } else {
                rotateX = 0;
            }
            if (typeof parameters.rotateY !== "undefined") {
                rotateY = parameters.rotateY.data[index] * y + parameters.rotateY.data[index + 1] * time;
            } else {
                rotateY = 0;
            }
            if (typeof parameters.rotateZ !== "undefined") {
                rotateZ = parameters.rotateZ.data[index] * y + parameters.rotateZ.data[index + 1] * time;
            } else {
                rotateZ = 0;
            }
            return [rotateX, rotateY, rotateZ];
        }
    },

    getStyleAtIndexTime: {
        value: function (indexTime) {
            var index = indexTime[0],
                time = indexTime[1],
                _parameters = this._parameters,
                y = 1 - time,
                j,
                parameterName,
                style = "",
                parameterKeys,
                parameterKeyCount,
                jParameter,
                jParameterData;

            parameterKeys = Object.keys(_parameters);
            parameterKeyCount = parameterKeys.length;
            for (j = 0; j < parameterKeyCount; j++) {
                parameterName = parameterKeys[j];
                jParameter = _parameters[parameterName];
                jParameterData = jParameter.data;
                if (
                    (parameterName !== "rotateX") &&
                    (parameterName !== "rotateY") &&
                    (parameterName !== "rotateZ") &&
                    (typeof jParameterData[index] !== "undefined") &&
                    (typeof jParameterData[index + 1] !== "undefined")) {
                    style += parameterName + ":" + ((((jParameterData[index] * y + jParameterData[index + 1] * time)  * 100000) >> 0) * .00001) + jParameter.units + ";";
                }
            }
            return style;
        }
    },

    transformVectorArray: {
        value: function (vectors, matrix) {
            var length = vectors.length,
                out = [],
                iVector,
                i;

            for (i = 0; i < length; i++) {
                iVector = vectors[i];
                if (iVector) {
                    out[i] = [
                        iVector[0] * matrix[0] + iVector[1] * matrix[4] + iVector[2] * matrix [8] + matrix[12],
                        iVector[0] * matrix[1] + iVector[1] * matrix[5] + iVector[2] * matrix [9] + matrix[13],
                        iVector[0] * matrix[2] + iVector[1] * matrix[6] + iVector[2] * matrix [10] + matrix[14]
                    ];
                }
            }
            return out;
        }
    },

    transform: {
        value: function (matrix) {
            var spline = new FlowBezierSpline();

            spline._densities = this._densities;
            spline._densitySummation = this._densitySummation;
            spline._knots = this.transformVectorArray(this.knots, matrix);
            spline._previousHandlers = this.transformVectorArray(this.previousHandlers, matrix);
            spline._nextHandlers = this.transformVectorArray(this.nextHandlers, matrix);
            return spline;
        }
    },

    deCasteljau: {
        value: function (b0, b1, b2, b3, t) {
            var t1 = 1 - t,
                p1x = t1 * b0[0] + t * b1[0], p2x = t1 * b1[0] + t * b2[0], p3x = t1 * b2[0] + t * b3[0],
                p4x = t1 * p1x + t * p2x, p5x = t1 * p2x + t * p3x, p6x = t1 * p4x + t * p5x,
                p1y = t1 * b0[1] + t * b1[1], p2y = t1 * b1[1] + t * b2[1], p3y = t1 * b2[1] + t * b3[1],
                p4y = t1 * p1y + t * p2y, p5y = t1 * p2y + t * p3y, p6y = t1 * p4y + t * p5y,
                p1z = t1 * b0[2] + t * b1[2], p2z = t1 * b1[2] + t * b2[2], p3z = t1 * b2[2] + t * b3[2],
                p4z = t1 * p1z + t * p2z, p5z = t1 * p2z + t * p3z, p6z = t1 * p4z + t * p5z;

            return [
                [b0, [p1x, p1y, p1z], [p4x, p4y, p4z], [p6x, p6y, p6z]],
                [[p6x, p6y, p6z], [p5x, p5y, p5z], [p3x, p3y, p3z], b3]
            ];
        }
    },

    cubic: {
        enumerable: false,
        value: function (a, b, c, d, x) {
            return ((a * x + b) * x + c) * x + d;
        }
    },

    cubeRoot: {
        enumerable: false,
        value: function (value) {
            return (value > 0) ? Math.pow(value, 1/3) : -Math.pow(-value, 1/3);
        }
    },

    cubicRealRoots: {
        enumerable: false,
        value: function (a, b, c, d) {
            var epsilon = 1e-100, math = Math;

            if ((a < -epsilon) || (a > epsilon)) {
                var dv = 1 / a,
                    A = b * dv,
                    B = c * dv,
                    Q = (3 * B - A * A) * (1 / 9),
                    R = (4.5 * A * B - 13.5 * d * dv - A * A * A) * (1 / 27),
                    D = Q * Q * Q + R * R;

                if (D > epsilon) {
                    var sqD = math.sqrt(D);

                    return [this.cubeRoot(R + sqD) + this.cubeRoot(R - sqD) + A * (-1 / 3)];
                } else {
                    if (D > -epsilon) {
                        if ((R < -epsilon) || (R > epsilon)) {
                            var S = this.cubeRoot(R),
                                r1 = S * 2 + A * (-1 / 3),
                                r2 = A * (-1 / 3) - S;

                            if (r1 < r2) {
                                return [r1, r2];
                            } else {
                                return [r2, r1];
                            }
                        } else {
                            return [A * (-1 / 3)];
                        }
                    } else {
                        var O = math.acos(R / math.sqrt(-Q * Q * Q)) * (1 / 3),
                            tmp1 = math.sqrt(-Q),
                            sinO = tmp1 * math.sin(O) * 1.7320508075688772,
                            tmp2 = A * (-1 / 3);

                        tmp1 *= math.cos(O);
                        return [tmp2 - tmp1 - sinO, tmp2 - tmp1 + sinO,	tmp2 + tmp1 * 2];
                    }
                }
            } else {
                if ((b < -epsilon) || (b > epsilon)) {
                    var sq = c * c - 4 * b * d;

                    if (sq >= 0) {
                        sq = math.sqrt(sq);
                        return [(-c - sq) / (2 * b), (sq - c) / (2 * b)];
                    } else {
                        return [];
                    }
                } else {
                    if ((c < -epsilon) || (c > epsilon)) {
                        return [-d / c];
                    } else {
                        return [];
                    }
                }
            }
        }
    },

    _halfPI: {
        enumerable: false,
        value: Math.PI * .5
    },

    reflectionMatrix: {
        enumerable: false,
        value: function (planeNormal0,planeNormal1,planeNormal2,reflectionMatrixBuffer) {
            var math = Math, angleZ = this._halfPI - math.atan2(planeNormal1, planeNormal0),
                sinAngleZ = math.sin(angleZ),
                cosAngleZ = math.cos(angleZ),
                angleX = this._halfPI - math.atan2(/*p2*/ planeNormal2, /*p1*/ planeNormal0 * sinAngleZ + planeNormal1 * cosAngleZ),
                sinAngleX = math.sin(angleX);

            reflectionMatrixBuffer[0] = sinAngleX * sinAngleZ;
            reflectionMatrixBuffer[1] = cosAngleZ * sinAngleX;
            reflectionMatrixBuffer[2] = math.cos(angleX);

            return reflectionMatrixBuffer;
        }
    },

    reflectedY: {
        enumerable: false,
        value: function (x, y, z, matrix) {
            return x * matrix[0] + y * matrix[1] + z * matrix[2];
        }
    },

    directedPlaneBezierIntersection: {
        enumerable: false,
        value: function (planeOrigin0, planeOrigin1, planeOrigin2, planeNormal, b0, b1, b2, b3, reflectionMatrixBuffer) {
            var matrix = this.reflectionMatrix(planeNormal[0],planeNormal[1],planeNormal[2],reflectionMatrixBuffer), // TODO: cache for matrix and cache for cubicRealRoots
                d = this.reflectedY(b0[0] - planeOrigin0, b0[1] - planeOrigin1, b0[2] - planeOrigin2, matrix),
                r1 = this.reflectedY(b1[0] - planeOrigin0, b1[1] - planeOrigin1, b1[2] - planeOrigin2, matrix),
                r2 = this.reflectedY(b2[0] - planeOrigin0, b2[1] - planeOrigin1, b2[2] - planeOrigin2, matrix),
                r3 = this.reflectedY(b3[0] - planeOrigin0, b3[1] - planeOrigin1, b3[2] - planeOrigin2, matrix),
                a = (r1 - r2) * 3 + r3 - d,
                b = (d + r2) * 3 - 6 * r1,
                c = (r1 - d) * 3,
                r = this.cubicRealRoots(a, b, c, d),
                min,
                max = 0,
                mid,
                i = 0,
                segments = [];

            while ((i < r.length) && (r[i] <= 0)) {
                i++;
            }
            while ((i < r.length) && (r[i] < 1)) {
                min = max;
                max = r[i];
                mid = (min + max) * .5;
                if (this.cubic(a, b, c, d, mid) >= 0) {
                    segments.push([min, max]);
                }
                i++;
            }
            mid = (max + 1) * .5;
            if (this.cubic(a, b, c, d, mid) >= 0) {
                segments.push([max, 1]);
            }
            return segments;
        }
    }
});
