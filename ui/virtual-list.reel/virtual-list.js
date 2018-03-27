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
            
            // initialize scroll bars
            this._scrollBars.opacity = 0;
        }
    },

    enterDocument: {
        value: function (firstTime) {
            this.super(firstTime);
            this.flow._flowTranslateComposer.addEventListener("translateStart", this, false);
            this.flow._flowTranslateComposer.addEventListener("translateEnd", this, false);
            window.addEventListener("resize", this, false);
        }
    },

    exitDocument: {
        value: function () {
            this.super();
            this.flow._flowTranslateComposer.removeEventListener("translateStart", this, false);
            this.flow._flowTranslateComposer.removeEventListener("translateEnd", this, false);
            window.removeEventListener("resize", this, false);
        }
    },

    __scroll: {
        value: 0
    },

    _scroll: {
        get: function () {
            return this.__scroll;
        },
        set: function (value) {
            this.__scroll = value;
            this._scrollBars.verticalScroll = this._calculateScrollBarsVerticalScroll(
                value, this._height, this._rowHeight, this.flow._numberOfIterations, this._scrollBars.verticalLength
            );
        }
    },
    
    handleResize: {
        value: function () {
            this.needsDraw = true;
        }
    },

    handleTranslateStart: {
        value: function () {
            if (this._scrollBars.verticalLength < 1) {
                this._scrollBars.opacity = 0.5;
            }
        }
    },

    handleTranslateEnd: {
        value: function () {
            this._scrollBars.opacity = 0;
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

    _calculateScrollBarsVerticalLength: {
        value: function (height, rowHeight, numberOfIterations) {
            var length = (height / rowHeight) / numberOfIterations;
            return length > 1 ? 1 : length;
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
    },

    _calculateScrollBarsVerticalScroll: {
        value: function (value, height, rowHeight, numberOfIterations, verticalLength) {
            if (verticalLength === 1) {
                return 0;
            }
            return (value * (1 - verticalLength)) / (numberOfIterations - (height / rowHeight));
        }
    },

    willDraw: {
        value: function () {
            this.super();

            if (this.flow._repetition._drawnIterations[0]) {
                if ((this._rowHeight = this._measureRowHeight()) === 0) {
                    return;
                }
                
                this._width = this._measureWidth();
                this._height = this._measureHeight();
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
                this._scrollBars.displayHorizontal = false;
                this._scrollBars.displayVertical = true;
                this._scrollBars.verticalLength = this._calculateScrollBarsVerticalLength(
                    this._height, this._rowHeight, this.flow._numberOfIterations
                );
            }
        }
    },

    draw: {
        value: function () {
            if (this._rowHeight === 0) {
                this.needsDraw = true;
            }
        }
    }

});
