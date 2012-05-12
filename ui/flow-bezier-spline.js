var Montage = require("montage").Montage,
    FlowBezierSpline = exports.FlowBezierSpline = Montage.create(Montage, {

    knots: {
        get: function () {
            if (!this._knots) {
                this._knots = [];
            }
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
            if (!this._densities) {
                this._densities = [];
            }
            return this._densities;
        },
        set: function (value) {
            this._densities = value;
            this._densitiesLength = this._densities.length;
            this._densitySummation = null;
        }
    },

    _parameters: {
        value: {
            rotateX: {
                data: [0],
                units: "rad"
            },
            rotateY: {
                data: [0],
                units: "rad"
            },
            rotateZ: {
                data: [0],
                units: "rad"
            },
            opacity: {
                data: [1],
                units: ""
            }
        }
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

    knotsLength: {
        get: function () {
            if (!this._knots) {
                return 0;
            }
            return this._knots.length;
        },
        set: function () {}
    },

    getKnot: {
        value: function (index) {
            return this._knots[index];
        }
    },

    getPreviousHandler: {
        value: function (index) {
            return this._previousHandlers[index];
        }
    },

    getNextHandler: {
        value: function (index) {
            return this._nextHandlers[index];
        }
    },

    removeKnot: {
        value: function (index) {
            this._knots.splice(index, 1);
            this._nextHandlers.splice(index, 1);
            this._previousHandlers.splice(index, 1);
            this._densities.splice(index, 1);
        }
    },

    maxTime: {
        get: function () {
            if (!this._densitySummation) {
                this._computeDensitySummation();
            }
            return this._densitySummation[this._densitySummation.length - 1];
        },
        set: function () {}
    },

    _computeDensitySummation: {
        enumerable: false,
        value: function () {
            var length = this.densities.length - 1,
                sum = 0,
                i;

            this._densitySummation = [];
            for (i = 0; i < length; i++) {
                sum += (this._densities[i] + this._densities[i + 1]) / 2;
                this._densitySummation[i] = sum;
            }
        }
    },

    getPositionAtTime: {
        value: function (time, position) {
            var p0, p1, p2, p3,
                a, b, c,
                t, y,
                start,
                parameters = {},
                i, j,
                parameterKeys,
                parameterKeyCount,
                jParameter,
                jParameterData;

            position.length = 0;

            if ((time >= 0) && (time < this.maxTime)) {
                if (this._previousIndex && (time >= this._densitySummation[this._previousIndex - 1])) {
                    i = this._previousIndex;
                } else {
                    i = 0;
                }
                while (time >= this._densitySummation[i]) {
                    i++;
                }
                this._previousIndex = i;
                start = i ? this._densitySummation[i - 1] : 0;
                p0 = this._knots[i],
                p1 = this._nextHandlers[i],
                p2 = this._previousHandlers[i + 1],
                p3 = this._knots[i + 1],
                a = this._densities[i],
                b = this._densities[i + 1],
                c = a - b;
                if ((c < -1e-10) || (c > 1e-10)) {
                    t = (a - Math.sqrt(a * a + (b - a) * 2 * (time - start))) / c;
                } else {
                    t = (time - start) / a;
                }
                y = 1 - t;
                // TODO: Redo this and create getParametersAtTime or getPositionAndParametersAtTime

                parameterKeys = Object.keys(this._parameters);
                parameterKeyCount = parameterKeys.length;

                for (j = 0; j < parameterKeyCount; j++) {
                    jParameter = this._parameters[parameterKeys[j]];
                    jParameterData = jParameter.data;
                    if ((typeof jParameterData[i] !== "undefined") && (typeof jParameterData[i + 1] !== "undefined")) {
                        parameters[parameterKeys[j]] = (jParameterData[i] * y + jParameterData[i + 1] * t).toFixed(3) + jParameter.units;
                    } else {
                        parameters[parameterKeys[j]] = jParameterData[jParameterData.length - 1].toFixed(5) + jParameter.units;
                    }

                }

                position.push(p0[0]*(y*y*y)+p1[0]*(y*y*t*3)+p2[0]*(y*t*t*3)+p3[0]*(t*t*t));
                position.push(p0[1]*(y*y*y)+p1[1]*(y*y*t*3)+p2[1]*(y*t*t*3)+p3[1]*(t*t*t));
                position.push(p0[2]*(y*y*y)+p1[2]*(y*y*t*3)+p2[2]*(y*t*t*3)+p3[2]*(t*t*t));
                position.push(parameters);

            }

            return position;
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
                out[i] = [
                    iVector[0] * matrix[0] + iVector[1] * matrix[4] + iVector[2] * matrix [8] + matrix[12],
                    iVector[0] * matrix[1] + iVector[1] * matrix[5] + iVector[2] * matrix [9] + matrix[13],
                    iVector[0] * matrix[2] + iVector[1] * matrix[6] + iVector[2] * matrix [10] + matrix[14]
                ];
            }
            return out;
        }
    },

    transform: {
        value: function (matrix) {
            var spline = Montage.create(FlowBezierSpline);

            spline._densities = this._densities;
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
            var epsilon = 1e-100;

            if ((a < -epsilon) || (a > epsilon)) {
                var dv = 1 / a,
                    A = b * dv,
                    B = c * dv,
                    Q = (3 * B - A * A) * (1 / 9),
                    R = (4.5 * A * B - 13.5 * d * dv - A * A * A) * (1 / 27),
                    D = Q * Q * Q + R * R;

                if (D > epsilon) {
                    var sqD = Math.sqrt(D);

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
                        var O = Math.acos(R / Math.sqrt(-Q * Q * Q)) * (1 / 3),
                            tmp1 = Math.sqrt(-Q),
                            sinO = tmp1 * Math.sin(O) * 1.7320508075688772,
                            tmp2 = A * (-1 / 3);

                        tmp1 *= Math.cos(O);
                        return [tmp2 - tmp1 - sinO, tmp2 - tmp1 + sinO,	tmp2 + tmp1 * 2];
                    }
                }
            } else {
                if ((b < -epsilon) || (b > epsilon)) {
                    var sq = c * c - 4 * b * d;

                    if (sq >= 0) {
                        sq = Math.sqrt(sq);
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

    reflectionMatrix: {
        enumerable: false,
        value: function (planeNormal) {
            var angleZ = Math.PI/2 - Math.atan2(planeNormal[1], planeNormal[0]),
                p1 = planeNormal[0] * Math.sin(angleZ) + planeNormal[1] * Math.cos(angleZ),
                p2 = planeNormal[2],
                angleX = Math.PI/2 - Math.atan2(p2, p1);

            return [Math.sin(angleX) * Math.sin(angleZ), Math.cos(angleZ) * Math.sin(angleX), Math.cos(angleX)];
        }
    },

    reflectedY: {
        enumerable: false,
        value: function (x, y, z, matrix) {
            return x * matrix[0] + y * matrix[1] + z * matrix[2];
        }
    },

    planeBezierIntersection: {
        enumerable: false,
        value: function (planeOrigin, planeNormal, b0, b1, b2, b3) {
            var matrix = this.reflectionMatrix(planeNormal), // TODO: cache for matrix and cache for cubicRealRoots
                d = this.reflectedY(b0[0] - planeOrigin[0], b0[1] - planeOrigin[1], b0[2] - planeOrigin[2], matrix),
                r1 = this.reflectedY(b1[0] - planeOrigin[0], b1[1] - planeOrigin[1], b1[2] - planeOrigin[2], matrix),
                r2 = this.reflectedY(b2[0] - planeOrigin[0], b2[1] - planeOrigin[1], b2[2] - planeOrigin[2], matrix),
                r3 = this.reflectedY(b3[0] - planeOrigin[0], b3[1] - planeOrigin[1], b3[2] - planeOrigin[2], matrix);

            return this.cubicRealRoots(
                (r1 - r2) * 3 + r3 - d,
                (d + r2) * 3 - 6 * r1,
                (r1 - d) * 3,
                d
            );
        }
    },

    directedPlaneBezierIntersection: {
        enumerable: false,
        value: function (planeOrigin, planeNormal, b0, b1, b2, b3) {
            var matrix = this.reflectionMatrix(planeNormal), // TODO: cache for matrix and cache for cubicRealRoots
                d = this.reflectedY(b0[0] - planeOrigin[0], b0[1] - planeOrigin[1], b0[2] - planeOrigin[2], matrix),
                r1 = this.reflectedY(b1[0] - planeOrigin[0], b1[1] - planeOrigin[1], b1[2] - planeOrigin[2], matrix),
                r2 = this.reflectedY(b2[0] - planeOrigin[0], b2[1] - planeOrigin[1], b2[2] - planeOrigin[2], matrix),
                r3 = this.reflectedY(b3[0] - planeOrigin[0], b3[1] - planeOrigin[1], b3[2] - planeOrigin[2], matrix),
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
