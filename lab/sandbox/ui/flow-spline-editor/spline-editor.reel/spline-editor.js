var Montage = require("montage").Montage,
    Component = require("montage/ui/component").Component,
    CubicBezierSpline = require("montage/ui/flow-bezier-spline").CubicBezierSpline;

exports.SplineEditor = Montage.create(Component, {

    _cameraPosition: {
        enumerable: false,
        value: null
    },

    _cameraFocusPoint: {
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
            this._hasSplineUpdated = true;
        }
    },

    cameraFocusPoint: {
        get: function () {
            return this._cameraFocusPoint;
        },
        set: function (value) {
            this._cameraFocusPoint = value;
            this._hasSplineUpdated = true;
        }
    },

    cameraFov: {
        get: function () {
            return this._cameraFov;
        },
        set: function (value) {
            this._cameraFov = value;
            this._hasSplineUpdated = true;
        }
    },

    cameraRoll: {
        get: function () {
            return this._cameraRoll;
        },
        set: function (value) {
            this._cameraRoll = value;
            this._hasSplineUpdated = true;
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
            // TODO: use proper listeners
            this[value + "ButtonAction"]();
        }
    },

    addButtonAction: {
        value: function () {
            var self = this,
                sX,
                sY;

            this.topView.isDrawingHandlers = this.frontView.isDrawingHandlers = true;
            this.topView.mousedownDelegate = function (x, y, knot, handler, isScrolling) {
                if (self.spline.vectors.length) {
                    self.spline.vectors.push([x, 0, y]);
                }
                self.spline.vectors.push([x, 0, y]);
                self.spline.vectors.push([x, 0, y]);
                self.spline.densities.push(3);
                self.frontView.updateSpline();
                self.topView.updateSpline();
                self.hasSplineUpdated = true;
                sX = x;
                sY = y;
                return false;
            };
            this.frontView.mousedownDelegate = function (x, y, knot, handler, isScrolling) {
                if (self.spline.vectors.length) {
                    self.spline.vectors.push([x, y, 0]);
                }
                self.spline.vectors.push([x, y, 0]);
                self.spline.vectors.push([x, y, 0]);
                self.spline.densities.push(3);
                self.frontView.updateSpline();
                self.topView.updateSpline();
                self.hasSplineUpdated = true;
                sX = x;
                sY = y;
                return false;
            };
            this.topView.mousemoveDelegate = function (x, y, knot, handler, isScrolling) {
                sX -= x;
                sY -= y;
                if ((this._spline.vectors.length - 3) > 0) {
                    var tmp = self.spline.vectors[self.spline.vectors.length - 2];

                    self.spline.vectors[self.spline.vectors.length - 3] = [tmp[0] * 2 - sX, 0, tmp[2] * 2 - sY];
                }
                self.spline.vectors[self.spline.vectors.length - 1] = [sX, 0, sY];
                self.frontView.updateSpline();
                self.topView.updateSpline();
                self.hasSplineUpdated = true;
                return false;
            };
            this.frontView.mousemoveDelegate = function (x, y, knot, handler, isScrolling) {
                sX -= x;
                sY -= y;
                if ((this._spline.vectors.length - 3) > 0) {
                    var tmp = self.spline.vectors[self.spline.vectors.length - 2];

                    self.spline.vectors[self.spline.vectors.length - 3] = [tmp[0] * 2 - sX, tmp[1] * 2 - sY, 0];
                }
                self.spline.vectors[self.spline.vectors.length - 1] = [sX, sY, 0];
                self.frontView.updateSpline();
                self.topView.updateSpline();
                self.hasSplineUpdated = true;
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
                    if (knot > 0) {
                        self.spline.vectors[knot * 3 - 1][0] -= x;
                        self.spline.vectors[knot * 3 - 1][2] -= y;
                    }
                    self.spline.vectors[knot * 3][0] -= x;
                    self.spline.vectors[knot * 3][2] -= y;
                    if (this.spline.vectors.length > knot * 3 + 1) {
                        self.spline.vectors[knot * 3 + 1][0] -= x;
                        self.spline.vectors[knot * 3 + 1][2] -= y;
                    }
                    self.frontView.updateSpline(true);
                    self.topView.updateSpline(true);
                    self.hasSplineUpdated = true;
                }
            };
            this.frontView.mousemoveDelegate = function (x, y, knot, handler, isScrolling) {
                if (self._selectedKnot !== null) {
                    if (knot > 0) {
                        self.spline.vectors[knot * 3 - 1][0] -= x;
                        self.spline.vectors[knot * 3 - 1][1] -= y;
                    }
                    self.spline.vectors[knot * 3][0] -= x;
                    self.spline.vectors[knot * 3][1] -= y;
                    if (this.spline.vectors.length > knot * 3 + 1) {
                        self.spline.vectors[knot * 3 + 1][0] -= x;
                        self.spline.vectors[knot * 3 + 1][1] -= y;
                    }
                    self.frontView.updateSpline(true);
                    self.topView.updateSpline(true);
                    self.hasSplineUpdated = true;
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
                    var sX = self.spline.vectors[handler][0] - x,
                        sY = self.spline.vectors[handler][2] - y,
                        tmp;

                    if ((self._selectedHandler % 3) === 1) {
                        if ((self._selectedHandler - 2) > 0) {
                            tmp = self.spline.vectors[self._selectedHandler - 1];
                            self.spline.vectors[self._selectedHandler - 2][0] = tmp[0] * 2 - sX;
                            self.spline.vectors[self._selectedHandler - 2][2] = tmp[2] * 2 - sY;
                        }
                        self.spline.vectors[self._selectedHandler][0] = sX
                        self.spline.vectors[self._selectedHandler][2] = sY;
                    } else {
                        tmp = self.spline.vectors[self._selectedHandler + 1];
                        self.spline.vectors[self._selectedHandler + 2][0] = tmp[0] * 2 - sX;
                        self.spline.vectors[self._selectedHandler + 2][2] = tmp[2] * 2 - sY;
                        self.spline.vectors[self._selectedHandler][0] = sX;
                        self.spline.vectors[self._selectedHandler][2] = sY;
                    }
                    self.frontView.updateSpline(true);
                    self.topView.updateSpline(true);
                    self.hasSplineUpdated = true;
                }
            };
            this.frontView.mousemoveDelegate = function (x, y, knot, handler, isScrolling) {
                if (self._selectedHandler !== null) {
                    var sX = self.spline.vectors[handler][0] - x,
                        sY = self.spline.vectors[handler][1] - y,
                        tmp;

                    if ((self._selectedHandler % 3) === 1) {
                        if ((self._selectedHandler - 2) > 0) {
                            tmp = self.spline.vectors[self._selectedHandler - 1];
                            self.spline.vectors[self._selectedHandler - 2][0] = tmp[0] * 2 - sX;
                            self.spline.vectors[self._selectedHandler - 2][1] = tmp[1] * 2 - sY;
                        }
                        self.spline.vectors[self._selectedHandler][0] = sX
                        self.spline.vectors[self._selectedHandler][1] = sY;
                    } else {
                        tmp = self.spline.vectors[self._selectedHandler + 1];
                        self.spline.vectors[self._selectedHandler + 2][0] = tmp[0] * 2 - sX;
                        self.spline.vectors[self._selectedHandler + 2][1] = tmp[1] * 2 - sY;
                        self.spline.vectors[self._selectedHandler][0] = sX;
                        self.spline.vectors[self._selectedHandler][1] = sY;
                    }
                    self.frontView.updateSpline(true);
                    self.topView.updateSpline(true);
                    self.hasSplineUpdated = true;
                }
            };
        }
    },

    zoomExtentsButtonAction: {
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
                    self.spline.densities[knot] += y * self.frontView._scale / 20;
                    if (self.spline.densities[knot] < 0.05) {
                        self.spline.densities[knot] = 0.05;
                    }
                    self.frontView.updateSpline(true);
                    self.topView.updateSpline(true);
                    self.hasSplineUpdated = true;
                }
            };
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
            this.spline = Object.create(CubicBezierSpline);
            window.addEventListener("resize", this, false);
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

/*function SplineEditor() {}
Object.defineProperties(SplineEditor.prototype, {

	_drawGrid: {
		value: function (ctx, width, height, centerX, centerY, scale, isTop) {
			var halfWidth = width / 2,
				halfHeight = height / 2,
				offsetX = halfWidth - centerX * scale,
				offsetY = halfHeight - centerY * scale,
				x,
				xStart,
				sEnd,
				y,
				yStart,
				yEnd;

			ctx.save();
			if (scale >= .2) {
				if (scale < .6) {
					var color = Math.floor(68 - (scale - .2) * 15);

					ctx.fillStyle = "rgb(" + color + ", " + color + ", " + color + ")";
				} else {
					ctx.fillStyle = "rgb(62, 62, 62)";
				}
				xStart = ((-offsetX / (scale * 5)) >> 1) * 10;
				xEnd = (((width - offsetX) / (scale * 5)) >> 1) * 10;
				for (x = xStart; x <= xEnd; x += 10) {
					ctx.fillRect(Math.floor(offsetX + x * scale), 0, 1,  height);
				}
				yStart = ((-offsetY / (scale * 5)) >> 1) * 10;
				yEnd = (((height - offsetY) / (scale * 5)) >> 1) * 10;
				for (y = yStart; y <= yEnd; y += 10) {
					ctx.fillRect(0, Math.floor(offsetY + y * scale), width, 1);
				}
			}
			ctx.fillStyle = "#2e2e2e"; //3E3E3E
			ctx.fillRect(0, Math.floor(offsetY), width, 1);
			ctx.fillRect(Math.floor(offsetX), 0, 1,  height);
			ctx.restore();
		}
	},

	_centerX: {
		_enumerable: false,
		value: 0
	},

	centerX: {
		get: function () {
			return this._centerX;
		},
		set: function (value) {
			this._centerX = value;
			this.needsDraw = true;
		}
	},

	_centerY: {
		_enumerable: false,
		value: 0
	},

	centerY: {
		get: function () {
			return this._centerY;
		},
		set: function (value) {
			this._centerY = value;
			this.needsDraw = true;
		}
	},

	_centerZ: {
		_enumerable: false,
		value: 0
	},

	centerZ: {
		get: function () {
			return this._centerZ;
		},
		set: function (value) {
			this._centerZ = value;
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
			// TODO min zoom, max zoom
			this._scale = value;
			this.needsDraw = true;
		}
	},

	handleMousewheel: {
		value: function (event) {
			if (event.target === this._topView) {
				var halfWidth = this._topViewWidth / 2,
					halfHeight = this._topViewHeight / 2,
					offsetX = halfWidth - this._centerX * this._scale,
					offsetZ = halfHeight - this._centerZ * this._scale;
				
				if (event.wheelDelta > 0) {
					this.centerX += ((event.offsetX - offsetX) / this.scale - this.centerX) * .05;
					this.centerZ += ((event.offsetY - offsetZ) / this.scale - this.centerZ) * .05;
					this.scale *= 1.05;
				} else {
					this.centerX -= ((event.offsetX - offsetX) / this.scale - this.centerX) * .05;
					this.centerZ -= ((event.offsetY - offsetZ) / this.scale - this.centerZ) * .05;
					this.scale /= 1.05;
				}
			} else {
				var halfWidth = this._frontViewWidth / 2,
					halfHeight = this._frontViewHeight / 2,
					offsetX = halfWidth - this._centerX * this._scale,
					offsetY = halfHeight - this._centerY * this._scale;
				
				if (event.wheelDelta > 0) {
					this.centerX += ((event.offsetX - offsetX) / this.scale - this.centerX) * .05;
					this.centerY += ((event.offsetY - offsetY) / this.scale - this.centerY) * .05;
					this.scale *= 1.05;
				} else {
					this.centerX -= ((event.offsetX - offsetX) / this.scale - this.centerX) * .05;
					this.centerY -= ((event.offsetY - offsetY) / this.scale - this.centerY) * .05;
					this.scale /= 1.05;
				}
			}
		}
	},

	addClass: {
		value: function (element, name) {
			var classNames = element.className.split(" "),
				index = classNames.indexOf(name);

			if (index === -1) {
				classNames.push(name);
				element.className = classNames.join(" ");
			}
		}
	},

	removeClass: {
		value: function (element, name) {
			var classNames = element.className.split(" "),
				index = classNames.indexOf(name);

			if (index !== -1) {
				classNames.splice(index, 1);
				element.className = classNames.join(" ");
			}
		}
	},

	selectedTool: {
		get: function () {
			return this._selectedTool;
		},
		set: function (value) {
			this._selectedTool = value;
			this.needsDraw = true;
		}
	},

	_target: {
		enumerable: false,
		value: null
	},	

	_selectedKnot: {
		enumerable: false,
		value: 0
	},

	selectedKnot: {
		get: function () {
			return this._selectedKnot;
		},
		set: function (value) {
			this._selectedKnow = value;
			this.needsDraw = true;
		}
	},

	_drawHandlers: {
		enumerable: true,
		value: true
	},

	drawHandlers: {
		get: function () {
			return this._drawHandlers;
		},
		set: function (value) {
			this._drawHandlers = value;
			this.needsDraw = true;
		}
	},

	handleMouseup: {
		value: function (event) {
			switch (this._target) {
				case this._weightButton:
					this.drawHandlers = false;
					this.removeClass(this._target, "active");
					this.selectedTool = this._target;
					break;
				case this._addButton:
					this.drawHandlers = true;
					this.removeClass(this._target, "active");
					this.selectedTool = this._target;
					break;
				case this._moveButton:
				case this._zoomExtentsButton:
					this.removeClass(this._target, "active");
					this.selectedTool = this._target;
					break;
			}			
			event.preventDefault();
		}
	},

	handleMousemove: {
		value: function (event) {
			switch (this._target) {
				case this._topView:
					var halfWidth = this._topViewWidth / 2,
						halfHeight = this._topViewHeight / 2,
						offsetX = halfWidth - this._centerX * this._scale,
						offsetZ = halfHeight - this._centerZ * this._scale,
						x = ((this._pointerOffsetX + event.pageX - this._mousedownX) - offsetX) / this.scale,
						z = ((this._pointerOffsetY + event.pageY - this._mousedownY) - offsetZ) / this.scale;
					
					if (this._selectedTool !== this._addButton) {
						if ((this._selectedTool === this._weightButton) && (this._selectedKnot !== null)) {
							this._spline.densities[this._selectedKnot] -= (this._pointerY - event.pageY) / 10;
							if (this._spline.densities[this._selectedKnot] < 0.3) {
								this._spline.densities[this._selectedKnot] = 0.3;
							}
							this._spline._computeDensitySummation();
							this.needsDraw = true;
						} else {
							this.centerX += (this._pointerX - event.pageX) / this._scale;
							this.centerZ += (this._pointerY - event.pageY) / this._scale;
						}
					} else {
						if ((this._spline.vectors.length - 3) > 0) {
							var tmp = this._spline.vectors[this._spline.vectors.length - 2];

							this._spline.vectors[this._spline.vectors.length - 3] = [tmp[0] * 2 - x, 0, tmp[2] * 2 - z];
						}
						this._spline.vectors[this._spline.vectors.length - 1] = [x, 0, z];
						this.needsDraw = true;
					}
					break;
				case this._frontView:
					if (this._selectedTool !== this._addButton) {
						this.centerX += (this._pointerX - event.pageX) / this._scale;
						this.centerY += (this._pointerY - event.pageY) / this._scale;
					}
					break;
			}
			this._pointerX = event.pageX;
			this._pointerY = event.pageY;

			event.preventDefault();
		}
	},

	handleMousedown: {
		value: function (event) {
			var self = this, mouseupHandler, mousemoveHandler;

			switch (event.target) {
				case this._topView:
					switch (this._selectedTool) {
						case this._addButton:
							var halfWidth = this._topViewWidth / 2,
								halfHeight = this._topViewHeight / 2,
								offsetX = halfWidth - this._centerX * this._scale,
								offsetZ = halfHeight - this._centerZ * this._scale,
								x = (event.offsetX - offsetX) / this.scale,
								z = (event.offsetY - offsetZ) / this.scale;

							if (this._spline.vectors.length) {
								this._spline.vectors.push([x, 0, z]);
							}
							this._spline.vectors.push([x, 0, z]);
							this._spline.vectors.push([x, 0, z]);
							this._spline.densities.push(3);
							this._spline._computeDensitySummation();
							this._selectedKnot = this._spline.knotsLength - 1;
							this.needsDraw = true;
							break;
						case this._weightButton:
							var halfWidth = this._topViewWidth / 2,
								halfHeight = this._topViewHeight / 2,
								offsetX = halfWidth - this._centerX * this._scale,
								offsetZ = halfHeight - this._centerZ * this._scale,
								x = (event.offsetX - offsetX) / this.scale,
								z = (event.offsetY - offsetZ) / this.scale,
								closerKnot;
							
							this._spline.transformMatrix = [
								1, 0, 0, 0,
								0, 0, 1, 0,
								0, 1, 0, 0,
								0, 0, 0, 1
							];
							closerKnot = this._spline.getCloserKnot(x, z);
							if (closerKnot[1] <= 30) {
								this._selectedKnot = closerKnot[0];
							} else {
								this._selectedKnot = null;
							}
							console.log(this._selectedKnot);
							break;
					}
					break;
				case this._addButton:
				case this._moveButton:
				case this._weightButton:
				case this._zoomExtentsButton:
						this.addClass(event.target, "active");
						this.needsDraw = true;
					break;
			}
			this._target = event.target;
			this._pointerOffsetX = event.offsetX;
			this._pointerOffsetY = event.offsetY;
			this._pointerX = this._mousedownX = event.pageX;
			this._pointerY = this._mousedownY = event.pageY;
			document.addEventListener("mousemove", mousemoveHandler = function (event) {
				self.handleMousemove(event);
			}, false);
			document.addEventListener("mouseup", mouseupHandler = function (event) {
				self.handleMouseup(event);
				document.removeEventListener("mousemove", mousemoveHandler, false);
				document.removeEventListener("mouseup", mouseupHandler, false);
			}, false);

			event.preventDefault();
		}
	},

	needsDraw: {
		get: function () {
			return false;
		},
		set: function (value) {
			if (value) {
				this.willDraw();
			}
		}
	},

	prepareForDraw: {
		enumerable: false,
		value: function () {
			var self = this,
				i;

			this._element = document.getElementById("spline-editor");
			this._topView = document.getElementById("top-view");
			this._frontView = document.getElementById("front-view");
			this._toolbar = document.getElementById("toolbar");
			this._addButton = document.getElementById("add");
			this._moveButton = document.getElementById("move");
			this._weightButton = document.getElementById("weight");
			this._zoomExtentsButton = document.getElementById("zoom-extents");
			this._topViewContext = this._topView.getContext("2d");
			this._frontViewContext = this._frontView.getContext("2d");
			this._selectedTool = this._addButton;
			
			this._spline = new CubicBezierSpline();
			this._spline.vectors = [];

			window.addEventListener("resize", function () {
				self.willDraw();
			}, false);
			this._topView.addEventListener("mousewheel", function (event) {
				self.handleMousewheel(event);
			}, false);
			this._frontView.addEventListener("mousewheel", function (event) {
				self.handleMousewheel(event);
			}, false);
			this._topView.addEventListener("mousedown", function (event) {
				self.handleMousedown(event);
			}, false);
			this._frontView.addEventListener("mousedown", function (event) {
				self.handleMousedown(event);
			}, false);
			this._addButton.addEventListener("mousedown", function (event) {
				self.handleMousedown(event);
			}, false);
			this._moveButton.addEventListener("mousedown", function (event) {
				self.handleMousedown(event);
			}, false);
			this._weightButton.addEventListener("mousedown", function (event) {
				self.handleMousedown(event);
			}, false);
			this._zoomExtentsButton.addEventListener("mousedown", function (event) {
				self.handleMousedown(event);
			}, false);
			this.willDraw();
		}
	},

	willDraw: {
		enumerable: false,
		value: function () {
			this._frontViewWidth = this._topViewWidth = this._element.offsetWidth;
			this._frontViewHeight = Math.floor((this._element.offsetHeight - this._toolbar.offsetHeight - 1) / 2);
			this._topViewHeight = this._element.offsetHeight - this._toolbar.offsetHeight - this._frontViewHeight - 1;
			this.draw();
		}
	},

	draw: {
		enumerable: false,
		value: function () {
			this.removeClass(this._addButton, "selected");
			this.removeClass(this._moveButton, "selected");
			this.removeClass(this._weightButton, "selected");
			this.removeClass(this._zoomExtentsButton, "selected");
			this.addClass(this._selectedTool, "selected");
			if (this._frontView.width !== this._frontViewWidth) {
				this._frontView.width = this._frontViewWidth;
			}
			if (this._frontView.height !== this._frontViewHeight) {
				this._frontView.height = this._frontViewHeight;
			}
			if (this._topView.width !== this._topViewWidth) {
				this._topView.width = this._topViewWidth;
			}
			if (this._topView.height !== this._topViewHeight) {
				this._topView.height = this._topViewHeight;
			}
			this._frontViewContext.clearRect(0, 0, this._frontViewWidth, this._frontViewHeight);
			this._topViewContext.clearRect(0, 0, this._topViewWidth, this._topViewHeight);
			this._frontView.style.top = (this._topViewHeight + 1) + "px";
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
			}
		}
	}

});

var test = new SplineEditor();
window.addEventListener("load", function () {
	test.prepareForDraw();
}, false);*/