var Montage = require("montage").Montage,
    Component = require("montage/ui/component").Component,
    FlowBezierSpline = require("montage/ui/flow-bezier-spline").FlowBezierSpline;

exports.SplineEditor = Montage.create(Component, {

    flow: {
        value: null
    },

    topView: {
        value: null
    },

    frontView: {
        value: null
    },

    toolbar: {
        value: null
    },

    parametersEditor: {
        value: null
    },

    _cameraPosition: {
        value: null
    },

    _cameraTargetPoint: {
        value: null
    },

    _cameraFov: {
        value: null
    },

    _cameraRoll: {
        value: null
    },

    cameraPosition: {
        get: function () {
            return this._cameraPosition;
        },
        set: function (value) {
            this._cameraPosition = value;
            this._hasSplineUpdated = true;
            this.flow._updateLength.call(this.flow);
        }
    },

    cameraTargetPoint: {
        get: function () {
            return this._cameraTargetPoint;
        },
        set: function (value) {
            this._cameraTargetPoint = value;
            this._hasSplineUpdated = true;
            this.flow._updateLength.call(this.flow);
        }
    },

    cameraFov: {
        get: function () {
            return this._cameraFov;
        },
        set: function (value) {
            this._cameraFov = value;
            this._hasSplineUpdated = true;
            this.flow._updateLength.call(this.flow);
        }
    },

    cameraRoll: {
        get: function () {
            return this._cameraRoll;
        },
        set: function (value) {
            this._cameraRoll = value;
            this._hasSplineUpdated = true;
            this.flow._updateLength.call(this.flow);
        }
    },

    hasSplineUpdated: {
        value: true
    },

    _selectedTool: {
        enumerable: false,
        value: "add"
    },

    selectedTool: {
        get: function () {
            return this._selectedTool;
        },
        set: function (value) {
            this._selectedTool = value;
            this.topView.mousedownDelegate =
            this.frontView.mousedownDelegate =
            this.topView.mousemoveDelegate =
            this.frontView.mousemoveDelegate = null;
            this.topView.isDrawingHandlers =
            this.frontView.isDrawingHandlers =
            this.topView.isDrawingDensities =
            this.frontView.isDrawingDensities =
            this.topView.isHighlightingCloserKnot =
            this.frontView.isHighlightingCloserKnot =
            this.topView.isHighlightingCloserHandler =
            this.frontView.isHighlightingCloserHandler = false;

            // TODO move this to draw
            this.frontView.element.style.display =
            this.topView.element.style.display = "block";
            this.parametersEditor.style.display = "none";
            this[value + "ButtonAction"]();
        }
    },

    addButtonAction: {
        value: function () {
            var self = this,
                sX,
                sY,
                tmp;

            this.topView.isDrawingHandlers = this.frontView.isDrawingHandlers = true;
            this.topView.mousedownDelegate = function (x, y, knot, handler, isScrolling) {
                self.spline.previousHandlers.push([x, 0, y]);
                self.spline.knots.push([x, 0, y]);
                self.spline.nextHandlers.push([x, 0, y]);
                self.spline.densities.push(3);
                self.spline._computeDensitySummation.call(self.spline);
                self.frontView.updateSpline();
                self.topView.updateSpline();
                self.hasSplineUpdated = true;
                self.flow._updateLength.call(self.flow);
                sX = x;
                sY = y;
                return false;
            };
            this.frontView.mousedownDelegate = function (x, y, knot, handler, isScrolling) {
                self.spline.previousHandlers.push([x, y, 0]);
                self.spline.knots.push([x, y, 0]);
                self.spline.nextHandlers.push([x, y, 0]);
                self.spline.densities.push(3);
                self.spline._computeDensitySummation.call(self.spline);
                self.frontView.updateSpline();
                self.topView.updateSpline();
                self.hasSplineUpdated = true;
                self.flow._updateLength.call(self.flow);
                sX = x;
                sY = y;
                return false;
            };
            this.topView.mousemoveDelegate = function (x, y, knot, handler, isScrolling) {
                sX -= x;
                sY -= y;
                tmp = self.spline.knots[self.spline.knots.length - 1];
                self.spline.previousHandlers[self.spline.previousHandlers.length - 1] = [tmp[0] * 2 - sX, 0, tmp[2] * 2 - sY];
                self.spline.nextHandlers[self.spline.nextHandlers.length - 1] = [sX, 0, sY];
                self.frontView.updateSpline();
                self.topView.updateSpline();
                self.hasSplineUpdated = true;
                self.flow._updateLength.call(self.flow);
                return false;
            };
            this.frontView.mousemoveDelegate = function (x, y, knot, handler, isScrolling) {
                sX -= x;
                sY -= y;
                tmp = self.spline.knots[self.spline.knots.length - 1];
                self.spline.previousHandlers[self.spline.previousHandlers.length - 1] = [tmp[0] * 2 - sX, tmp[1] * 2 - sY, 0];
                self.spline.nextHandlers[self.spline.nextHandlers.length - 1] = [sX, sY, 0];
                self.frontView.updateSpline();
                self.topView.updateSpline();
                self.hasSplineUpdated = true;
                self.flow._updateLength.call(self.flow);
                return false;
            };
        }
    },

    removeButtonAction: {
        value: function () {
            var self = this;

            this.topView.isDrawingHandlers = this.frontView.isDrawingHandlers = false;
            this.topView.isDrawingDensities = this.frontView.isDrawingDensities = false;
            this.topView.isHighlightingCloserKnot = this.frontView.isHighlightingCloserKnot = true;
            this.topView.mousedownDelegate = this.frontView.mousedownDelegate = function (x, y, knot, handler, isScrolling) {
                if (knot !== null) {
                    self.spline.removeKnot(knot);
                    self.frontView.updateSpline();
                    self.topView.updateSpline();
                    self.hasSplineUpdated = true;
                    self.spline._computeDensitySummation.call(self.spline);
                    self.flow._updateLength.call(self.flow);
                    return false;
                } else {
                    return true;
                }
            };
        }
    },

    moveKnotButtonAction: {
        value: function () {
            var self = this;

            this.topView.isHighlightingCloserKnot = this.frontView.isHighlightingCloserKnot = true;
            this.topView.mousedownDelegate =
            this.frontView.mousedownDelegate = function (x, y, knot, handler, isScrolling) {
                if (knot !== null) {
                    self._selectedKnot = knot;
                    return false;
                } else {
                    self._selectedKnot = null;
                    return true;
                }
            };
            this.topView.mousemoveDelegate = function (x, y, knot, handler, isScrolling) {
                if (self._selectedKnot !== null) {
                    self.spline.knots[self._selectedKnot][0] -= x;
                    self.spline.knots[self._selectedKnot][2] -= y;
                    self.spline.nextHandlers[self._selectedKnot][0] -= x;
                    self.spline.nextHandlers[self._selectedKnot][2] -= y;
                    self.spline.previousHandlers[self._selectedKnot][0] -= x;
                    self.spline.previousHandlers[self._selectedKnot][2] -= y;
                    self.frontView.updateSpline(true);
                    self.topView.updateSpline(true);
                    self.hasSplineUpdated = true;
                    self.flow._updateLength.call(self.flow);
                }
            };
            this.frontView.mousemoveDelegate = function (x, y, knot, handler, isScrolling) {
                if (self._selectedKnot !== null) {
                    self.spline.knots[self._selectedKnot][0] -= x;
                    self.spline.knots[self._selectedKnot][1] -= y;
                    self.spline.nextHandlers[self._selectedKnot][0] -= x;
                    self.spline.nextHandlers[self._selectedKnot][1] -= y;
                    self.spline.previousHandlers[self._selectedKnot][0] -= x;
                    self.spline.previousHandlers[self._selectedKnot][1] -= y;
                    self.frontView.updateSpline(true);
                    self.topView.updateSpline(true);
                    self.hasSplineUpdated = true;
                    self.flow._updateLength.call(self.flow);
                }
            };
        }
    },

    moveHandlerButtonAction: {
        value: function () {
            var self = this;

            this.topView.isDrawingHandlers = this.frontView.isDrawingHandlers = true;
            this.topView.isHighlightingCloserHandler = this.frontView.isHighlightingCloserHandler = true;
            this.topView.mousedownDelegate =
            this.frontView.mousedownDelegate = function (x, y, knot, handler, isScrolling) {
                if (handler !== null) {
                    self._selectedHandler = handler;
                    return false;
                } else {
                    self._selectedHandler = null;
                    return true;
                }
            };
            this.topView.mousemoveDelegate = function (x, y, knot, handler, isScrolling) {
                if (self._selectedHandler !== null) {
                    var sX = self.spline.nextHandlers[self._selectedHandler][0] - x,
                        sY = self.spline.nextHandlers[self._selectedHandler][2] - y,
                        tmp;

                    // TODO: add previousHandlers

                    tmp = self.spline.knots[self._selectedHandler];
                    self.spline.previousHandlers[self._selectedHandler][0] = tmp[0] * 2 - sX;
                    self.spline.previousHandlers[self._selectedHandler][2] = tmp[2] * 2 - sY;
                    self.spline.nextHandlers[self._selectedHandler][0] = sX
                    self.spline.nextHandlers[self._selectedHandler][2] = sY;
                    self.frontView.updateSpline(true);
                    self.topView.updateSpline(true);
                    self.hasSplineUpdated = true;
                    self.flow._updateLength.call(self.flow);
                }
            };
            this.frontView.mousemoveDelegate = function (x, y, knot, handler, isScrolling) {
                if (self._selectedHandler !== null) {
                    var sX = self.spline.nextHandlers[self._selectedHandler][0] - x,
                        sY = self.spline.nextHandlers[self._selectedHandler][1] - y,
                        tmp;

                    // TODO: add previousHandlers

                    tmp = self.spline.knots[self._selectedHandler];
                    self.spline.previousHandlers[self._selectedHandler][0] = tmp[0] * 2 - sX;
                    self.spline.previousHandlers[self._selectedHandler][1] = tmp[1] * 2 - sY;
                    self.spline.nextHandlers[self._selectedHandler][0] = sX
                    self.spline.nextHandlers[self._selectedHandler][1] = sY;
                    self.frontView.updateSpline(true);
                    self.topView.updateSpline(true);
                    self.hasSplineUpdated = true;
                    self.flow._updateLength.call(self.flow);
                }
            };
        }
    },

    cameraButtonAction: {
        value: function () {
            var self = this;

            this.topView.mousedownDelegate =
            this.frontView.mousedownDelegate = function (x, y, knot, handler, isScrolling) {
                return false;
            };
            this.topView.mousemoveDelegate = function (x, y, knot, handler, isScrolling) {
                self.cameraPosition = [
                    self.cameraPosition[0] - x,
                    self.cameraPosition[1],
                    self.cameraPosition[2] - y
                ];
            };
            this.frontView.mousemoveDelegate = function (x, y, knot, handler, isScrolling) {
                self.cameraPosition = [
                    self.cameraPosition[0] - x,
                    self.cameraPosition[1] - y,
                    self.cameraPosition[2]
                ];
            };
        }
    },

    weightButtonAction: {
        value: function () {
            var self = this;

            this.topView.isDrawingDensities = this.frontView.isDrawingDensities = true;
            this.topView.isHighlightingCloserKnot = this.frontView.isHighlightingCloserKnot = true;
            this.topView.mousedownDelegate =
            this.frontView.mousedownDelegate = function (x, y, knot, handler, isScrolling) {
                if (knot !== null) {
                    self._selectedKnot = knot;
                    return false;
                } else {
                    self._selectedKnot = null;
                    return true;
                }
            };
            this.frontView.mousemoveDelegate =
            this.topView.mousemoveDelegate = function (x, y, knot, handler, isScrolling) {
                if (self._selectedKnot !== null) {
                    self.spline.densities[self._selectedKnot] += y * self.frontView._scale / 20;
                    if (self.spline.densities[self._selectedKnot] < 0.05) {
                        self.spline.densities[self._selectedKnot] = 0.05;
                    }
                    self.frontView.updateSpline(true);
                    self.topView.updateSpline(true);
                    self.hasSplineUpdated = true;
                    self.flow._updateLength.call(self.flow);
                }
            };
        }
    },

    parametersButtonAction: {
        value: function () {
            this.parametersEditor.style.display = "block";
            this.frontView.element.style.display =
            this.topView.element.style.display = "none";
        }
    },

    spline: {
        value: null
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
        }
    },

    _centralZ: {
        enumerable: false,
        value: 0
    },

    centralZ: {
        get: function () {
            return this._centralZ;
        },
        set: function (value) {
            this._centralZ = value;
        }
    },

    scale: {
        get: function () {
            return this._scale;
        },
        set: function (value) {
            this._scale = value;
        }
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
        }
    },

    handleResize: {
        enumerable: false,
        value: function () {
            this.needsDraw = true;
        }
    },

    prepareForDraw: {
        enumerable: false,
        value: function () {
            var self = this;

            this.spline = Object.create(FlowBezierSpline).init();
            this.flow._paths = [];
            this.flow._paths.push({
                headOffset: 0,
                tailOffset: 0
            });
            this.flow.splinePaths.push(this.spline);
            window.addEventListener("resize", this, false);
            this.parametersEditor.textContent = JSON.stringify(this.spline.parameters);
            this.parametersEditor.addEventListener("keyup", function () {
                try {
                    self.spline.parameters = JSON.parse(self.parametersEditor.value);
                } catch (e) {
                }
                self.flow.needsDraw = true;
            }, false);
        }
    },

    willDraw: {
        enumerable: false,
        value: function () {
            this.frontView.width = this._element.offsetWidth;
            this.frontView.height = (this._element.offsetHeight - this.toolbar.element.offsetHeight - 1) >> 1;
            this.topView.width = this._element.offsetWidth;
            this.topView.height = this._element.offsetHeight - this.toolbar.element.offsetHeight - this.frontView.height - 1;
        }
    },

    draw: {
        enumerable: false,
        value: function () {
            this.frontView.element.style.top = (this.topView.height + 1) + "px";
            /*this.removeClass(this._addButton, "selected");
            this.removeClass(this._moveButton, "selected");
            this.removeClass(this._weightButton, "selected");
            this.removeClass(this._zoomExtentsButton, "selected");
            this.addClass(this._selectedTool, "selected");*/

            /*this._frontViewContext.clearRect(0, 0, this._frontViewWidth, this._frontViewHeight);
            this._topViewContext.clearRect(0, 0, this._topViewWidth, this._topViewHeight);

            this._drawGrid(this._topViewContext, this._topViewWidth, this._topViewHeight, this._centerX, this._centerZ, this._scale, true);
            this._drawGrid(this._frontViewContext, this._frontViewWidth, this._frontViewHeight, this._centerX, this._centerY, this._scale, true);
            this._spline.transformMatrix = [
                this._scale, 0, 0, 0,
                0, 0, this._scale, 0,
                0, this._scale, 0, 0,
                this._topViewWidth / 2 - this.centerX * this._scale, this._topViewHeight / 2 - this.centerZ * this._scale, 0, 1
            ];
            this._spline.drawSpline(this._topViewContext);
            this._spline.drawKnots(this._topViewContext);
            if (this._selectedTool === this._weightButton) {
                this._spline.drawDensities(this._topViewContext);
            }
            if (this._drawHandlers) {
                this._spline.drawHandlers(this._topViewContext, [this._selectedKnot - 1, this._selectedKnot]);
            }
            this._spline.transformMatrix = [
                this._scale, 0, 0, 0,
                0, this._scale, 0, 0,
                0, 0, this._scale, 0,
                this._topViewWidth / 2 - this.centerX * this._scale, this._topViewHeight / 2 - this.centerY * this._scale, 0, 1
            ];
            this._spline.drawSpline(this._frontViewContext);
            this._spline.drawKnots(this._frontViewContext);
            if (this._selectedTool === this._weightButton) {
                this._spline.drawDensities(this._frontViewContext);
            }
            if (this._drawHandlers) {
                this._spline.drawHandlers(this._frontViewContext, [this._selectedKnot - 1, this._selectedKnot]);
            }*/
        }
    }

});