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
    
    drawSegmentIntersections: {
        value: function (intersections, p0, p1, p2, p3) {
            var spline = this.flow.splineTranslatePath,
                tmp,
                i;

            for (i = 0; i < intersections.length; i++) {
                tmp = spline.deCasteljau(p0, p1, p2, p3, intersections[i][0])[1];
                tmp = spline.deCasteljau(
                    tmp[0], tmp[1], tmp[2], tmp[3],
                    (intersections[i][1] - intersections[i][0]) / (1 - intersections[i][0])
                )[0];
                this._context.beginPath();
                this._context.moveTo(tmp[0][0], tmp[0][1]);
                this._context.bezierCurveTo(tmp[1][0], tmp[1][1], tmp[2][0], tmp[2][1], tmp[3][0], tmp[3][1]);
                this._context.stroke();
            }
        }
    },

    draw: {
        value: function () {
            var time = new Date().getTime() * .0007,
                planeOrigin = [250, 250, 250],
                planeNormal = [Math.cos(time), Math.sin(time), 0],
                r, j,
                spline = this.flow.splineTranslatePath,
                self = this;

            this._context.clearRect(0, 0, 500, 500);
            this.drawSpline(this.flow.splineTranslatePath);
            this._context.beginPath();
            this._context.moveTo(planeOrigin[0] - planeNormal[1] * 1000 + .5, planeOrigin[1] + planeNormal[0] * 1000 + .5);
            this._context.lineTo(planeOrigin[0] + planeNormal[1] * 1000 + .5, planeOrigin[1] - planeNormal[0] * 1000 + .5);
            this._context.stroke();
            for (j = 0; j < spline.knotsLength - 1; j++) {
                r = spline.directedPlaneBezierIntersection(
                    planeOrigin,
                    planeNormal,
                    spline.vectors[0 + j * 3],
                    spline.vectors[1 + j * 3],
                    spline.vectors[2 + j * 3],
                    spline.vectors[3 + j * 3]
                );
                this.drawSegmentIntersections(
                    r,
                    spline.vectors[0 + j * 3],
                    spline.vectors[1 + j * 3],
                    spline.vectors[2 + j * 3],
                    spline.vectors[3 + j * 3]
                );
            }
            window.setTimeout(function () {
                    self.draw();
            }, 16);
        }
    },

    start: {
        value: function () {
            if (this.flow.splineTranslatePath) {
                var vectors = [],
                    i;

                this._context = this.view.getContext("2d");
                for (i = 0; i < 3 * 30 + 1; i++) {
                    vectors[i] = [
                        Math.random() * 500,
                        Math.random() * 500,
                        Math.random() * 500
                    ];
                }
                this.flow.splineTranslatePath.vectors = vectors;
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