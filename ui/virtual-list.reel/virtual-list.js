var List = require("../list.reel").List;

exports.VirtualList = List.specialize({

    templateDidLoad: {
        value: function () {
            this.super();

            var self = this,
                oldDidDraw = this.flow.didDraw;

            this.flow.didDraw = function () {
                if (self.flow._repetition._drawnIterations[0]) {
                    self.needsDraw = true;
                    self.flow.didDraw = oldDidDraw;
                }
            };
        }
    },

    enterDocument: {
        value: function (firstTime) {
            this.super(firstTime);
            window.addEventListener("resize", this, false);
        }
    },

    exitDocument: {
        value: function () {
            this.super();
            window.removeEventListener("resize", this, false);
        }
    },

    handleResize: {
        value: function () {
            this.needsDraw = true;
        }
    },

    willDraw: {
        value: function () {
            this.super();

            if (this.flow._repetition._drawnIterations[0]) {
                this._width = this._measureWidth();
                this._height = this._measureHeight();
                this._rowHeight = this._measureRowHeight();
                this.flow.linearScrollingVector = this._calculateLinearScrollingVector(
                    this._height, this._rowHeight
                );
                this.flow.paths = this._calculateFlowPath(
                    this._height, this._rowHeight
                );
                this.flow.cameraTargetPoint = this._calculateCameraTargetPoint(
                    this._width, this._height, this._rowHeight
                );
                this.flow.cameraPosition = this._calculateCameraPosition(
                    this._width, this._height, this._rowHeight
                );
                this.flow.cameraFov = 90;
            }
        }
    },

    _measureHeight: {
        value: function () {
            return this.element.clientHeight;
        }
    },

    _measureWidth: {
        value: function () {
            return this.element.clientWidth;
        }
    },

    _measureRowHeight: {
        value: function () {
            return this.flow._repetition._drawnIterations[0].firstElement.scrollHeight;
        }
    },

    _calculateLinearScrollingVector: {
        value: function (height, rowHeight) {
            return [0, (-500 * rowHeight) / height, 0];
        }
    },

    _calculateFlowPath: {
        value: function (height, rowHeight) {
            return [
                {
                    "knots": [
                        {
                            "knotPosition": [
                                0,
                                0,
                                0
                            ],
                            "nextHandlerPosition": [
                                0,
                                rowHeight * 1000,
                                0
                            ],
                            "nextDensity": 3000,
                            "previousDensity": 3000
                        },
                        {
                            "knotPosition": [
                                0,
                                rowHeight * 3000,
                                0
                            ],
                            "previousHandlerPosition": [
                                0,
                                rowHeight * 2000,
                                0
                            ],
                            "nextDensity": 3000,
                            "previousDensity": 3000
                        }
                    ],
                    "units": {},
                    "headOffset": 1,
                    "tailOffset": height / rowHeight
                }
            ];
        }
    },

    _calculateCameraPosition: {
        value: function (width, height, rowHeight) {
            return [
                width / 2,
                height / 2 + rowHeight,
                height / 2
            ];
        }
    },

    _calculateCameraTargetPoint: {
        value: function (width, height, rowHeight) {
            return [
                width / 2,
                height / 2 + rowHeight,
                0
            ];
        }
    }

});
