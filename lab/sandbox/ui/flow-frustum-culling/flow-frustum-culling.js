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

    drawIntersections: {
        value: function (intersections, p0, p1, p2, p3) {
            var i, ax, bx, cx, dx, ay, by, cy, dy;

            this._context.fillStyle = "red";
            ax = (p1[0] - p2[0]) * 3 + p3[0] - p0[0];
            bx = (p0[0] + p2[0]) * 3 - 6 * p1[0];
            cx = (p1[0] - p0[0]) * 3;
            dx = p0[0];
            ay = (p1[1] - p2[1]) * 3 + p3[1] - p0[1];
            by = (p0[1] + p2[1]) * 3 - 6 * p1[1];
            cy = (p1[1] - p0[1]) * 3;
            dy = p0[1];
            for (i = 0; i < intersections.length; i++) {
               if ((intersections[i] >= 0) && (intersections[i] < 1)) {
                    this._context.fillRect(
                        this.flow.splineTranslatePath.cubic(ax, bx, cx, dx, intersections[i]) - 1,
                        this.flow.splineTranslatePath.cubic(ay, by, cy, dy, intersections[i]) - 1,
                        3,
                        3
                    );
                }
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
                r = spline.planeBezierIntersection(
                    planeOrigin,
                    planeNormal,
                    spline.vectors[0 + j * 3],
                    spline.vectors[1 + j * 3],
                    spline.vectors[2 + j * 3],
                    spline.vectors[3 + j * 3]
                );
                this.drawIntersections(
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