var Montage = require("montage").Montage,
    CubicBezierSpline = exports.CubicBezierSpline = Montage.create(Montage, {

    vectors: {
        get: function () {
            if (!this._vectors) {
                this._vectors = [];
            }
            return this._vectors;
        },
        set: function (value) {
            this._vectors = value;
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

    knotsLength: {
        get: function () {
            return Math.floor((this._vectors.length + 2) / 3);
        },
        set: function () {}
    },

    getKnot: {
        value: function (index) {
            return this._vectors[index * 3];
        }
    },

    getPreviousHandler: {
        value: function (index) {
            return this._vectors[index * 3 - 1];
        }
    },

    getNextHandler: {
        value: function (index) {
            return this._vectors[index * 3 + 1];
        }
    },

    removeKnot: {
        value: function (index) {
            if (index) {
                this._vectors.splice(index * 3 - 1, 3);
            } else {
                this._vectors.splice(0, 3);
            }
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
        value: function (time) {
            var p0, p1, p2, p3,
                a, b, c,
                t, y,
                start,
                i;
            
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
                p0 = this._vectors[i * 3],
                p1 = this._vectors[i * 3 + 1],
                p2 = this._vectors[i * 3 + 2],
                p3 = this._vectors[i * 3 + 3],
                a = this._densities[i],
                b = this._densities[i + 1],
                c = a - b;
                if ((c < -1e-10) || (c > 1e-10)) {
                    t = (a - Math.sqrt(a * a + (b - a) * 2 * (time - start))) / c;
                } else {
                    t = (time - start) / a;
                }
                y = 1 - t;
                return [
                    p0[0]*(y*y*y)+p1[0]*(y*y*t*3)+p2[0]*(y*t*t*3)+p3[0]*(t*t*t),
                    p0[1]*(y*y*y)+p1[1]*(y*y*t*3)+p2[1]*(y*t*t*3)+p3[1]*(t*t*t),
                    p0[2]*(y*y*y)+p1[2]*(y*y*t*3)+p2[2]*(y*t*t*3)+p3[2]*(t*t*t)
                ];
            } else {
                return null;
            }
        }
    },

    transform: {
        value: function (matrix) {
            var spline = Montage.create(CubicBezierSpline),
                vectors = this.vectors,
                length = vectors.length,
                iVector,
                i;

            spline._densities = this._densities;
            spline._vectors = [];
            for (i = 0; i < length; i++) {
                iVector = vectors[i];
                spline._vectors[i] = [
                    iVector[0] * matrix[0] + iVector[1] * matrix[4] + iVector[2] * matrix [8] + matrix[12],
                    iVector[0] * matrix[1] + iVector[1] * matrix[5] + iVector[2] * matrix [9] + matrix[13],
                    iVector[0] * matrix[2] + iVector[1] * matrix[6] + iVector[2] * matrix [10] + matrix[14]
                ];
            }
            return spline;
        }
    }

});