/**
 * @module "montage/ui/flow.reel"
 */
var Component = require("../component").Component,
    observeProperty = require("frb/observers").observeProperty,
    FlowBezierSpline = require("./flow-bezier-spline").FlowBezierSpline,
    RangeController = require("../../core/range-controller").RangeController;

/**
 * @class Flow
 * @extends Component
 */
var Flow = exports.Flow = Component.specialize( /** @lends Flow.prototype # */ {
    /**
     * @constructs Flow
     */
    constructor: {
        value: function Flow() {
            // The template has a binding from these visibleIndexes to
            // the frustum controller's visibleIndexes.  We manage the
            // array within the flow and use it also in the flow
            // translate composer.
            this._paths = [];
            this._visibleIndexes = [];
            this._needsClearVisibleIndexes = true;
            // Tracks the elastic scrolling offsets relative to their
            // corresponding non-elastic scrolling positions on their
            // FlowBezierSpline.
            this._slideOffsets = {};
            this.defineBinding("_numberOfIterations", {
                "<-": "contentController.content.length"
            });
            // dispatches handle_numberOfIterationsChange
            this.addOwnPropertyChangeListener("_numberOfIterations", this);
            window.addEventListener("resize", this, false);

            this._newVisibleIndexes =  [];
        }
    },

    /**
     * An optional component or element to place inside the camera's
     * perspective shared by the slides.
     *
     * This will likely be replaced with a template parameter in a future
     * version.
     */
    slotContent: {
        serializable: true,
        value: null
    },

    __flowTranslateComposer: {
        value: null
    },

    _flowTranslateComposer: {
        get: function () {
            return this.__flowTranslateComposer;
        },
        set: function (value) {
            if (this.__flowTranslateComposer) {
                this.__flowTranslateComposer.removeEventListener("translateStart", this, false);
                this.__flowTranslateComposer.removeEventListener("translateEnd", this, false);
            }
            this.__flowTranslateComposer = value;
            this.__flowTranslateComposer.addEventListener("translateStart", this, false);
            this.__flowTranslateComposer.addEventListener("translateEnd", this, false);
        }

    },

    __firstIteration: {
        value: null
    },

    _firstIteration: {
        get: function () {
            return this.__firstIteration;
        },
        set: function (value) {
            this.__firstIteration = value;
            this.needsDraw = true;
        }
    },

    handleTranslateStart: {
        value: function () {
            this.callDelegateMethod("didTranslateStart", this);
        }
    },

    handleTranslateEnd: {
        value: function () {
            this.callDelegateMethod("didTranslateEnd", this);
        }
    },

    _scrollingMode: {
        value: "linear"
    },

    _transform: {
        value: null
    },

    _transformCss: {
        value: null
    },

    _transformPerspective: {
        value: null
    },

    /**
     * One of "linear" or "drag".
     *
     * Drag mode is an experiment to preserve the dragged slide's
     * position relative to the gesture pointer.  Since this feature is
     * not yet ready, "linear" is the default.
     *
     * Used by the corresponding `FlowTranslateComposer` and
     * communicated by way of a binding to the property of the same
     * name.
     */
    scrollingMode: {
        serializable: true,
        get: function () {
            return this._scrollingMode;
        },
        set: function (value) {
            switch (value) {
                case "linear":
                case "drag":
                    this._scrollingMode = value;
                    break;
            }
        }
    },

    _linearScrollingVector: {
        value: [-300, 0]
    },

    /**
     * A constant 2d vector used to transform a drag vector into a
     * scroll vector, applicable only in the "linear"
     * `scrollingMode`.
     *
     * Used by the corresponding `FlowTranslateComposer` and
     * communicated by way of a binding to the property of the same
     * name.
     */
    linearScrollingVector: {
        seriazable: true,
        get: function () {
            return this._linearScrollingVector;
        },
        set: function (value) {
            this._linearScrollingVector = value;
        }
    },

    /**
     * The repetition that manages the slides.  The repetition is
     * instantiated and bound by the template.
     */
    _repetition: {
        value: null
    },

    /**
     * The amount of time in miliseconds after a gesture has ended until
     * the flow's scroll inertia disipates.
     */
    momentumDuration: {
        serializable: true,
        value: 650
    },

    _splinePaths: {
        value: null
    },

    // TODO doc
    /**
     * An internal representation of the paths that slides will follow.
     * The paths are taken from the serialization, transformed, and
     * stored here.  Each path is a `FlowBezierSpline`.
     * @private
     */
    splinePaths: {
        enumerable: false,
        get: function () {
            if (!this._splinePaths) {
                this._splinePaths = [];
            }
            return this._splinePaths;
        },
        set: function (value) {
            this._splinePaths = value;
        }
    },

    /**
     * Creates a `FlowBezierSpline` with data from a path in
     * the serialization and appends it to `splinePaths`
     * array.
     *
     * The public interface for modifying the paths of a
     * `Flow` is to set the `paths` propery.
     *
     * @private
     */
    _appendPath: {
        value: function (path) {
            var splinePath = new FlowBezierSpline(),
                pathKnots = path.knots,
                length = path.knots.length,
                knots = [],
                nextHandlers = [],
                previousHandlers = [],
                densities = [],
                i, j,
                splinePathParameters,
                pathUnits = path.units,
                units = pathUnits ? Object.keys(pathUnits) : void 0,
                unit,
                iPathKnot;

            splinePath._parameterKeys = units;
            splinePathParameters = splinePath.parameters = {};
            if(units) {
                for (i=0;(unit = units[i]);i++) {
                    splinePathParameters[unit] = {
                        data: [],
                        units: pathUnits[unit]
                    };
                }
            }
            for (i = 0; i < length; i++) {
                iPathKnot = pathKnots[i];
                knots[i] = iPathKnot.knotPosition;
                previousHandlers[i] = iPathKnot.previousHandlerPosition;
                nextHandlers[i] = iPathKnot.nextHandlerPosition;
                densities[i] = iPathKnot.previousDensity; // TODO: implement previous/next density
                for (j in pathUnits) {
                    splinePathParameters[j].data.push(iPathKnot[j]);
                }
            }
            splinePath.knots = knots;
            splinePath.previousHandlers = previousHandlers;
            splinePath.nextHandlers = nextHandlers;
            splinePath.densities = densities;
            splinePath._computeDensitySummation();
            this.splinePaths.push(splinePath);
            if (!path.hasOwnProperty("headOffset")) {
                path.headOffset = 0;
            }
            if (!path.hasOwnProperty("tailOffset")) {
                path.tailOffset = 0;
            }
            this._paths.push(path);
            this._updateLength();
        }
    },

    _paths: {
        value: null
    },

    /**
     * The paths that slides will follow in the flow, as represented in
     * the serialization of a Flow.  Each path is an object with a
     * "knots" array, "headOffset", "tailOffset", and "units"
     * descriptor.  Each "knot" has "knotPosition",
     * "previousHandlerPosition", "previousDensity", and "nextDensity"
     * properties.  The positions are 3d vectors represented as arrays.
     * Densities are describe slide gravitation relative to other knots,
     * where equal densities represent linear distribution of slides
     * from knot to knot.
     *
     * The paths property is a getter and setter.  The Flow converts the
     * paths to and from an internal `splinePaths`
     * representation.
     */
    // TODO document the meaning of offsets
    paths: { // TODO: listen for changes?
        get: function () {
            var length = this.splinePaths.length,
                paths = [],
                path,
                pathLength,
                parametersLength,
                knot,
                i, j, k,
                iSplinePath;

            for (i = 0; (iSplinePath = this.splinePaths[i]); i++) {
                pathLength = iSplinePath.knots.length;
                path = {
                    knots: [],
                    units: {}
                };
                for (j = 0; j < pathLength; j++) {
                    knot = {
                        knotPosition: iSplinePath.knots[j]
                    };
                    if (iSplinePath.nextHandlers && iSplinePath.nextHandlers[j]) {
                        knot.nextHandlerPosition = iSplinePath.nextHandlers[j];
                    }
                    if (iSplinePath.previousHandlers && iSplinePath.previousHandlers[j]) {
                        knot.previousHandlerPosition = iSplinePath.previousHandlers[j];
                    }
                    // TODO implememnt previous/next densities
                    if (iSplinePath.densities && iSplinePath.densities[j]) {
                        knot.previousDensity = iSplinePath.densities[j];
                        knot.nextDensity = iSplinePath.densities[j];
                    }
                    path.knots.push(knot);
                }
                for (j in iSplinePath.parameters) {
                    path.units[j] = iSplinePath.parameters[j].units;
                    parametersLength = iSplinePath.parameters[j].data.length;
                    for (k = 0; k < parametersLength; k++) {
                        path.knots[k][j] = iSplinePath.parameters[j].data[k];
                    }
                }
                if (this._paths[i].hasOwnProperty("headOffset")) {
                    path.headOffset = this._paths[i].headOffset;
                } else {
                    path.headOffset = 0;
                }
                if (this._paths[i].hasOwnProperty("tailOffset")) {
                    path.tailOffset = this._paths[i].tailOffset;
                } else {
                    path.tailOffset = 0;
                }
                paths.push(path);
            }
            return paths;
        },
        set: function (value) {
            var length = value.length,
                i;

            this._splinePaths = [];
            this._paths = [];
            for (i = 0; i < length; i++) {
                this._appendPath(value[i]);
            }
            this.needsDraw = true;
            this._needsComputeVisibleRange = true;
        }
    },

    _isCameraEnabled: {
        value: true
    },

    isCameraEnabled: {
        get: function () {
            return this._isCameraEnabled;
        },
        set: function (value) {
            var enabled = !!value;

            if (this._isCameraEnabled !== enabled) {
                this._isCameraEnabled = enabled;
                this._isCameraUpdated = true;
                this._needsComputeVisibleRange = true;
                this.needsDraw = true;
            }
        }
    },

    /**
     * CSS perspective value in pixels used when camera is disabled
     */
    _perspective: {
        value: 500
    },

    perspective: {
        get: function () {
            return this._perspective;
        },
        set: function (value) {
            var perspective = parseFloat(value);

            if (!isNaN(perspective) && (this._perspective !== perspective)) {
                this._perspective = perspective;
                this._isCameraUpdated = true;
                this._needsComputeVisibleRange = true;
                this.needsDraw = true;
            }
        }
    },

    /**
     * The camera elements is the DOM element that contains the
     * repetition and on which the flow applies 3d transforms.
     */
    _cameraElement: {
        value: null
    },

    _cameraPosition: {
        value: [0, 0, 800]
    },

    /**
     * An [x, y, z] array representing the 3d vector describing the
     * position of the virtual camera.
     */
    cameraPosition: {
        get: function () {
            return this._cameraPosition;
        },
        set: function (value) {
            this._cameraPosition = value;
            this._isCameraUpdated = true;
            this.needsDraw = true;
            this._needsComputeVisibleRange = true;
        }
    },

    _viewpointPosition: {
        get: function () {
            if (this._isCameraEnabled) {
                return this.cameraPosition;
            } else {
                return [
                     (50 - this._sceneOffsetLeft) * 0.01 * this._width,
                     (50 - this._sceneOffsetTop) * 0.01 * this._height,
                     this._perspective
                ];
            }
        }
    },

    _cameraTargetPoint: {
        value: [0, 0, 0]
    },

    /**
     * An [x, y, z] array representing the 3d vector describing the
     * position of one of the points in the center of the camera's view.
     */
    cameraTargetPoint: {
        get: function () {
            return this._cameraTargetPoint;
        },
        set: function (value) {
            this._cameraTargetPoint = value;
            this._isCameraUpdated = true;
            this.needsDraw = true;
            this._needsComputeVisibleRange = true;
        }
    },

    _viewpointTargetPoint: {
        get: function () {
            if (this._isCameraEnabled) {
                return this.cameraTargetPoint;
            } else {
                return [
                    (50 - this._sceneOffsetLeft) * 0.01 * this._width,
                    (50 - this._sceneOffsetTop) * 0.01 * this._height,
                    0
                ];
            }
        }
    },

    _cameraFov: {
        value: 50
    },

    /**
     * The "field of view" of the camera, measured in degrees away from
     * the ray from the camera position to the camera target point.
     */
    cameraFov: {
        get: function () {
            return this._cameraFov;
        },
        set: function (value) {
            this._cameraFov = value;
            this._isCameraUpdated = true;
            this.needsDraw = true;
            this._needsComputeVisibleRange = true;
        }
    },

    _viewpointFov: {
        get: function () {
            if (this._isCameraEnabled) {
                return this.cameraFov;
            } else {
                return ((Math.PI / 2) - Math.atan2(this._perspective, this._height / 2)) * 360 / Math.PI;
            }
        }
    },

    // TODO: Implement camera roll

    _cameraRoll: {
        value: 0
    },

    /**
     * The angle that the camera is rotated about the ray from the
     * camera position to the camera target point, away from vertical.
     *
     * This feature is not presently implemented.
     */
    cameraRoll: {
        get: function () {
            return this._cameraRoll;
        },
        set: function (value) {
            this._cameraRoll = value;
            this._isCameraUpdated = true;
            this.needsDraw = true;
            this._needsComputeVisibleRange = true;
        }
    },

    /**
     * Scene's vertical offset relative to the viewport.
     * Expressed as a percentage of the viewport's height.
     * Only in use when camera is disabled.
     */
    _sceneOffsetTop: {
        value: 50
    },

    sceneOffsetTop: {
        get: function () {
            return this._sceneOffsetTop;
        },
        set: function (value) {
            this._sceneOffsetTop = value;
            this._isCameraUpdated = true;
            this.needsDraw = true;
            this._needsComputeVisibleRange = true;
        }
    },

    /**
     * Scene's horizontal offset relative to the viewport.
     * Expressed as a percentage of the viewport's width.
     * Only in use when camera is disabled.
     */
    _sceneOffsetLeft: {
        value: 50
    },

    sceneOffsetLeft: {
        get: function () {
            return this._sceneOffsetLeft;
        },
        set: function (value) {
            this._sceneOffsetLeft = value;
            this._isCameraUpdated = true;
            this.needsDraw = true;
            this._needsComputeVisibleRange = true;
        }
    },

    /**
     * Scene's scale for each axis x/y/z
     * Expressed as an object representing a fraction with numerator and denominator properties
     * Defaults as 1:1, original size
     */
    _sceneScaleX: {
        value: {
            numerator: 1,
            denominator: 1
        }
    },

    _sceneScaleY: {
        value: {
            numerator: 1,
            denominator: 1
        }
    },

    _sceneScaleZ: {
        value: {
            numerator: 1,
            denominator: 1
        }
    },

    _sceneScale: {
        value: {
            x: {numerator: 1, denominator: 1},
            y: {numerator: 1, denominator: 1},
            z: {numerator: 1, denominator: 1}
        },
    },

    _updateSceneScale: {
        value: function () {
            this._sceneScale = {
                x: this._sceneScaleX,
                y: this._sceneScaleY,
                z: this._sceneScaleZ
            };
        }
    },

    sceneScaleX: {
        get: function () {
            return this._sceneScaleX;
        },
        set: function (value) {
            if ((typeof value === "object") &&
                (typeof value.numerator !== "undefined") &&
                (typeof value.denominator !== "undefined") &&
                (!isNaN(value.numerator)) &&
                (!isNaN(value.denominator)) &&
                (value.denominator != 0)) {
                this._sceneScaleX = value;
                this._updateSceneScale();
                this.needsDraw = true;
                this._needsComputeVisibleRange = true;
            }
        }
    },

    sceneScaleY: {
        get: function () {
            return this._sceneScaleY;
        },
        set: function (value) {
            if ((typeof value === "object") &&
                (typeof value.numerator !== "undefined") &&
                (typeof value.denominator !== "undefined") &&
                (!isNaN(value.numerator)) &&
                (!isNaN(value.denominator)) &&
                (value.denominator != 0)) {
                this._sceneScaleY = value;
                this._updateSceneScale();
                this.needsDraw = true;
                this._needsComputeVisibleRange = true;
            }
        }
    },

    sceneScaleZ: {
        get: function () {
            return this._sceneScaleZ;
        },
        set: function (value) {
            if ((typeof value === "object") &&
                (typeof value.numerator !== "undefined") &&
                (typeof value.denominator !== "undefined") &&
                (!isNaN(value.numerator)) &&
                (!isNaN(value.denominator)) &&
                (value.denominator != 0)) {
                this._sceneScaleZ = value;
                this._updateSceneScale();
                this.needsDraw = true;
                this._needsComputeVisibleRange = true;
            }
        }
    },

    _stride: {
        value: 0
    },

    /**
     * The interval between snap points along the paths, to which slides
     * wil gravitate.  The default value of "0" disables this feature.
     */
    stride: {
        get: function () {
            return this._stride;
        },
        set: function (value) {
            this._stride = value;
        }
    },

    /**
     * An internal cache of `scrollingTransitionDuration` in
     * units of miliseconds.
     */
    _scrollingTransitionDurationMiliseconds: {
        value: 500
    },

    /**
     * An internal cache of `scrollingTransitionDuration` as
     * a string suitable for CSS.
     */
    _scrollingTransitionDuration: {
        value: "500ms"
    },

    /**
     * The configurable duration of scrolling animation in miliseconds.
     * It may be set to a number, or a CSS duration like "1s" or
     * "500ms".  Getting the property always reports the number.  The
     * default is 500.
     */
    scrollingTransitionDuration: { // TODO: think about using the Date Converter
        get: function () {
            return this._scrollingTransitionDuration;
        },
        set: function (duration) {
            var durationString = duration + "",
                length = durationString.length,
                value,
                match;

            if (match = /^(\d+)ms$/.exec(durationString)) {
                value = +match[1];
            } else if (match = /^(\d+)s$/.exec(durationString)) {
                value = +match[1] * 1000;
            } else {
                value = +durationString;
                durationString += "ms";
            }
            if (!isNaN(value) && (this._scrollingTransitionDurationMiliseconds !== value)) {
                this._scrollingTransitionDurationMiliseconds = value;
                this._scrollingTransitionDuration = durationString;
            }
        }
    },

    // TODO doc
    /**
     */
    hasSelectedIndexScrolling: {
        value: false
    },

    // TODO doc
    /**
     */
    selectedIndexScrollingOffset: {
        value: 0
    },

    // TODO doc
    /**
     */
    _handleSelectedIndexesChange: {
        value: function (plus, minus, index) {
            if (this.hasSelectedIndexScrolling && plus[0]) {
                this.startScrollingIndexToOffset(
                    Math.floor(this.contentController.content.indexOf(plus[0].object) / this._paths.length),
                    this.selectedIndexScrollingOffset
                );
            }
        }
    },

    /**
     * Internal lookup table of CSS timing functions to their
     * corresponding cubic bezier parameters.  This is used by the
     * `scrollingTransitionTimingFunction` setter to
     * translate <em>named</em> transitions like "ease" to their
     * corresponding cubic bezier internal representation.
     */
    _timingFunctions: {
        value: {
            "ease": [.25, .1, .25, 1],
            "linear": [0, 0, 1, 1],
            "ease-in": [.42, 0, 1, 1],
            "ease-out": [0, 0, .58, 1],
            "ease-in-out": [.42, 0, .58, 1]
        }
    },

    /**
     * Internal representation of the CSS timing function as an array of
     * numbers for scroll transitions, the format of CSS timing
     * functions.
     *
     * This is produced by setting
     * `scrollingTransitionTimingFunction`. Note the absence
     * of the `Bezier` qualifier.
     */
    _scrollingTransitionTimingFunctionBezier: {
        value: [.25, .1, .25, 1]
    },

    /**
     * Internal cache of the transition timing function.
     */
    _scrollingTransitionTimingFunction: {
        value: "ease"
    },

    /**
     * The CSS timing function, "ease" by default, used for smooth
     * scroll transitions.  Supports named timing functions "ease",
     * "linear", "ease-in", "ease-out", "ease-in-out", and the tuple
     * `cubic-bezier(0, 0, 1, 1)` format as well.
     */
    scrollingTransitionTimingFunction: {
        get: function () {
            return this._scrollingTransitionTimingFunction;
        },
        set: function (timingFunction) {
            var string = timingFunction + "",
                bezier,
                i;

            if (this._timingFunctions.hasOwnProperty(string)) {
                this._scrollingTransitionTimingFunction = string;
                this._scrollingTransitionTimingFunctionBezier = this._timingFunctions[string];
            } else {
                if ((string.substr(0, 13) === "cubic-bezier(") && (string.substr(string.length - 1, 1) === ")")) {
                    bezier = string.substr(13, string.length - 14).split(",");
                    if (bezier.length === 4) {
                        for (i = 0; i < 4; i++) {
                            bezier[i] -= 0;
                            if (isNaN(bezier[i])) {
                                return;
                            }
                        }
                        if (bezier[0] < 0) {
                            bezier[0] = 0;
                        } else {
                            if (bezier[0] > 1) {
                                bezier[0] = 1;
                            }
                        }
                        if (bezier[2] < 0) {
                            bezier[2] = 0;
                        } else {
                            if (bezier[2] > 1) {
                                bezier[2] = 1;
                            }
                        }
                        // TODO: check it is not the same bezier
                        this._scrollingTransitionTimingFunction = "cubic-bezier(" + bezier + ")";
                        this._scrollingTransitionTimingFunctionBezier = bezier;
                    }
                }
            }
        }
    },

    /**
     * Used in scrolling transitions to compute the interpolation values
     * in a cubic bezier curve in the same way as CSS transitions.
     */
    _computeCssCubicBezierValue: {
        value: function (x, bezier) {
            var t = .5,
                step = .25,
                t2,
                k,
                i;

            for (i = 0; i < 20; i++) { // TODO: optimize with Newton's method or similar
                t2 = t * t;
                k = 1 - t;
                if ((3 * (k * k * t * bezier[0] + k * t2 * bezier[2]) + t2 * t) > x) {
                    t -= step;
                } else {
                    t += step;
                }
                step *= .5;
            }
            t2 = t * t;
            k = 1 - t;
            return 3 * (k * k * t * bezier[1] + k * t2 * bezier[3]) + t2 * t;
        }
    },

    /**
     * A flag that indicates that scrolling animation is in progress.
     */
    _isTransitioningScroll: {
        value: false
    },

    /**
     * Stops scrolling animation.
     */
    stopScrolling: {
        value: function () {
            this._isTransitioningScroll = false;
            // TODO: Fire scrollingTransitionCancel event
        }
    },

    /**
     * Starts an scrolling animation from the given slide index to the
     * given offset position.
     */
    // TODO document the range of slide indexes and what they correspond
    // to, relative to the actual content, organized content, visible
    // content, or order on the document
    // TODO document the units of the offset position
    startScrollingIndexToOffset: { // TODO: Fire scrollingTransitionStart event
        value: function (index, offset) {
            this._scrollingOrigin = this.scroll;
            this._scrollingDestination = index - offset;
            if (this._scrollingDestination > this._length) {
                this._scrollingDestination = this._length;
            } else {
                if (this._scrollingDestination < 0) {
                    this._scrollingDestination = 0;
                }
            }
            this._isScrolling = true;
            this._scrollingStartTime = Date.now();
            this._isTransitioningScroll = true;
            this.needsDraw = true;
            this.callDelegateMethod("didTranslateStart", this);
        }
    },

    /**
     * A flag that informs the `draw` method that the camera
     * properties were changed.
     */
    _isCameraUpdated: {
        value: true
    },

    // TODO doc
    /**
     */
    _width: {
        value: 0
    },

    // TODO doc
    /**
     */
    _height: {
        value: 0
    },

    // TODO: bounding box is working as bounding rectangle only. Update it to work with boxes
    // TODO doc
    /**
     */
    _boundingBoxSize: {
        value: null
    },

    // TODO doc
    /**
     */
    boundingBoxSize: {
        serializable: true,
        get: function () {
            return this._boundingBoxSize;
        },
        set: function (value) {
            this._boundingBoxSize = value;
            this.elementsBoundingSphereRadius = Math.sqrt(value[0] * value[0] + value[1] * value[1] + value[2] * value[2]) * .5;
            this._needsComputeVisibleRange = true;
        }
    },

    // TODO doc
    /**
     */
    _elementsBoundingSphereRadius: {
        value: 1
    },

    // TODO doc
    /**
     */
    elementsBoundingSphereRadius: {
        get: function () {
            return this._elementsBoundingSphereRadius;
        },
        set: function (value) {
            if (this._elementsBoundingSphereRadius !== value) {
                this._elementsBoundingSphereRadius = value;
                this.needsDraw = true;
                this._needsComputeVisibleRange = true;
            }
        }
    },

    _halfPI: {
        value: Math.PI * .5
    },

    _doublePI: {
        value: Math.PI * 2
    },

    // TODO doc
    /**
     */
    _computeFrustumNormals: {
        value: function () {
            var angle = ((this._viewpointFov * .5) * this._doublePI) / 360,
                y = Math.sin(angle),
                z = Math.cos(angle),
                x = (y * this._width) / this._height,
                viewpointPosition = this._viewpointPosition,
                viewpointTargetPoint = this._viewpointTargetPoint,
                vX = viewpointTargetPoint[0] - viewpointPosition[0],
                vY = viewpointTargetPoint[1] - viewpointPosition[1],
                vZ = viewpointTargetPoint[2] - viewpointPosition[2],
                yAngle = this._halfPI - Math.atan2(vZ, vX),
                tmpZ = vX * Math.sin(yAngle) + vZ * Math.cos(yAngle),
                rX, rY, rZ,
                rX2, rY2, rZ2,
                xAngle = this._halfPI - Math.atan2(tmpZ, vY),
                invLength,
                vectors = [[z, 0, x], [-z, 0, x], [0, z, y], [0, -z, y]],
                iVector,
                out = [],
                i;

            for (i = 0; i < 4; i++) {
                iVector = vectors[i];
                rX = iVector[0];
                rY = iVector[1] * Math.cos(-xAngle) - iVector[2] * Math.sin(-xAngle);
                rZ = iVector[1] * Math.sin(-xAngle) + iVector[2] * Math.cos(-xAngle);
                rX2 = rX * Math.cos(-yAngle) - rZ * Math.sin(-yAngle);
                rY2 = rY;
                rZ2 = rX * Math.sin(-yAngle) + rZ * Math.cos(-yAngle);
                invLength = 1 / Math.sqrt(rX2 * rX2 + rY2 * rY2 + rZ2 * rZ2);
                out.push([rX2 * invLength, rY2 * invLength, rZ2 * invLength]);
            }
            return out;
        }
    },

    // TODO doc
    /**
     */
    _segmentsIntersection: {
        value: function (segment1, segment2) {
            var n = 0,
                m = 0,
                start,
                end,
                result = [];

            while ((n < segment1.length) && (m < segment2.length)) {
                if (segment1[n][0] >= segment2[m][1]) {
                    m++;
                } else {
                    if (segment1[n][1] <= segment2[m][0]) {
                        n++;
                    } else {
                        if (segment1[n][0] >= segment2[m][0]) {
                            start = segment1[n][0];
                        } else {
                            start = segment2[m][0];
                        }
                        if (segment1[n][1] <= segment2[m][1]) {
                            end = segment1[n][1];
                        } else {
                            end = segment2[m][1];
                        }
                        result.push([start, end]);
                        if (segment1[n][1] < segment2[m][1]) {
                            n++;
                        } else {
                            if (segment1[n][1] > segment2[m][1]) {
                                m++;
                            } else {
                                n++;
                                m++;
                            }
                        }
                    }
                }
            }
            return result;
        }
    },

    // TODO doc
    /**
     */
    _computeVisibleRange: { // TODO: make it a loop, optimize
        value: function (spline) {
            var splineLength = spline._knots.length - 1,
                viewpointPosition = this._viewpointPosition,
                planeOrigin0 = viewpointPosition[0],
                planeOrigin1 = viewpointPosition[1],
                planeOrigin2 = viewpointPosition[2],
                normals = this._computeFrustumNormals(),
                mod,
                r = [], r2 = [], r3 = [], tmp,
                i, j,
                elementsBoundingSphereRadius = this._elementsBoundingSphereRadius,
                splineKnots = spline.getScaledKnots(this._sceneScale),
                splineNextHandlers = spline.getScaledNextHandlers(this._sceneScale),
                splinePreviousHandlers = spline.getScaledPreviousHandlers(this._sceneScale),
                out = [];

            for (i = 0; i < splineLength; i++) {
                mod = normals[0];
                r = spline.directedPlaneBezierIntersection(
                        planeOrigin0 - mod[0] * elementsBoundingSphereRadius,
                        planeOrigin1 - mod[1] * elementsBoundingSphereRadius,
                        planeOrigin2 - mod[2] * elementsBoundingSphereRadius,
                    normals[0],
                    splineKnots[i],
                    splineNextHandlers[i],
                    splinePreviousHandlers[i + 1],
                    splineKnots[i + 1]
                );
                if (r.length) {
                    mod = normals[1];
                    r2 = spline.directedPlaneBezierIntersection(
                            planeOrigin0 - mod[0] * elementsBoundingSphereRadius,
                            planeOrigin1 - mod[1] * elementsBoundingSphereRadius,
                            planeOrigin2 - mod[2] * elementsBoundingSphereRadius,
                        normals[1],
                        splineKnots[i],
                        splineNextHandlers[i],
                        splinePreviousHandlers[i + 1],
                        splineKnots[i + 1]
                    );
                    if (r2.length) {
                        tmp = this._segmentsIntersection(r, r2);
                        if (tmp.length) {
                            mod = normals[2];
                            r = spline.directedPlaneBezierIntersection(
                                    planeOrigin0 - mod[0] * elementsBoundingSphereRadius,
                                    planeOrigin1 - mod[1] * elementsBoundingSphereRadius,
                                    planeOrigin2 - mod[2] * elementsBoundingSphereRadius,
                                normals[2],
                                splineKnots[i],
                                splineNextHandlers[i],
                                splinePreviousHandlers[i + 1],
                                splineKnots[i + 1]
                            );
                            tmp = this._segmentsIntersection(r, tmp);
                            if (tmp.length) {
                                mod = normals[3];
                                r = spline.directedPlaneBezierIntersection(
                                        planeOrigin0 - mod[0] * elementsBoundingSphereRadius,
                                        planeOrigin1 - mod[1] * elementsBoundingSphereRadius,
                                        planeOrigin2 - mod[2] * elementsBoundingSphereRadius,
                                    normals[3],
                                    splineKnots[i],
                                    splineNextHandlers[i],
                                    splinePreviousHandlers[i + 1],
                                    splineKnots[i + 1]
                                );
                                tmp = this._segmentsIntersection(r, tmp);
                                for (j = 0; j < tmp.length; j++) {
                                    r3.push([i, tmp[j][0], tmp[j][1]]);
                                }

                            }
                        }
                    }
                }
            }
            var densities = spline._densities, d1, d2, dS, p1, p2, t1, t2;
            for (i = 0; i < r3.length; i++) {
                d1 = densities[r3[i][0]];
                d2 = densities[r3[i][0] + 1];
                dS = r3[i][0] ? spline._densitySummation[r3[i][0]-1] : 0;
                p1 = r3[i][1];
                p2 = r3[i][2];
                t1 = (d2 - d1) * p1 * p1 * .5 + p1 * d1 + dS;
                t2 = (d2 - d1) * p2 * p2 * .5 + p2 * d1 + dS;
                out.push([t1, t2]);
            }
            return out;
        }
    },

    _determineCssPrefixedProperties: {
        value: function () {
            if("webkitTransform" in this.element.style) {
                this._transform = "webkitTransform";
                this._transformCss = "-webkit-transform";
                this._transformPerspective = "webkitPerspective";
            } else if("MozTransform" in this.element.style) {
                this._transform = "MozTransform";
                this._transformCss = "-moz-transform";
                this._transformPerspective = "MozPerspective";
            } else if("msTransform" in this.element.style) {
                this._transform = "msTransform";
                this._transformCss = "-ms-transform";
                this._transformPerspective = "msPerspective";
            } else {
                this._transform = "transform";
                this._transformPerspective = "perspective";
            }
        }
    },

    _isListeningToResize: {
        value: true
    },

    isListeningToResize: {
        get: function () {
            return this._isListeningToResize;
        },
        set: function (value) {
            var _value = !!value;

            if (this._isListeningToResize !== _value) {
                this._isListeningToResize = _value;
                if (this._isListeningToResize) {
                    window.addEventListener("resize", this, false);
                } else {
                    window.removeEventListener("resize", this, false);
                }
            }
        }
    },

    _needsClearVisibleIndexes: {
        value: false
    },

    handleResize: {
        value: function () {
            this._isCameraUpdated = true;
            this._needsComputeVisibleRange = true;
            this.needsDraw = true;
            this._needsClearVisibleIndexes = true;
        }
    },

    enterDocument: {
        value: function (firstTime) {
            if (firstTime) {
                var self = this;
                this._determineCssPrefixedProperties();
                this._repetition.addRangeAtPathChangeListener("selectedIterations", this, "_handleSelectedIndexesChange");
                // TODO remove event listener
            }
        }
    },

    /**
     * In order to prevent jitter and minimize thrashing on the DOM, the Flow
     * attempts to reuse every iteration, favoring moving them around with CSS
     * transforms over moving them around on the document, and favoring
     * rebinding over removing an iteration that is leaving and injecting an
     * iteration for content entering.
     *
     * To those ends, this algorithm takes the idealized array of new visible
     * indexes, as computed by willDraw, and transforms the current visible
     * indexes array without moving any content that is in both
     * the old and new arrays.  Instead, it finds all of the positions that
     * have content that is leaving the Flow, and fills those "holes" with
     * content entering the Flow.
     *
     * To accomplish this, the algorithm takes as input the
     * `newVisibleIndexes` and its inverse-lookup table,
     * `newContentIndexes`.  It uses the content indexes so that it
     * can triangulate whether the content at any particular visible index will
     * be retained in the new visible indexes at any position.  Otherwise,
     * there will be a hole at that index.
     *
     * Conceptually there are two domains of indexes: content indexes and
     * visible indexes.  The visible indexes correspond to positions within the
     * repetition.  The content indexes correspond to where the content exists
     * within the backing organized content array.  There are both new and old
     * forms of both indexes.  We use the <em>new, visible</em> indexes, the
     * <em>new, content</em> indexes, and the <em>old, content` indexes
     * to triangulate.
     *
     * <pre>
     * OVI -> OCI
     *  ^      v  ?
     * NVI    NCI
     * </pre>
     */
    _updateVisibleIndexes: {
        value: function (newVisibleIndexes, newContentIndexes) {
            var oldVisibleIndexes = this._visibleIndexes,
                oldIndexesLength = oldVisibleIndexes && !isNaN(oldVisibleIndexes.length) ? oldVisibleIndexes.length : 0,
                holes,
                j,
                i;

            if (this._needsClearVisibleIndexes) {
                this._visibleIndexes.splice(newVisibleIndexes.length, Infinity);
                this._needsClearVisibleIndexes = false;
            }

            // Search for viable holes, leave content at the same visible index
            // whenever possible.
            for (i = 0; i < oldIndexesLength; i++) {
                // # Legend
                // _: the previously defined expression in this legend
                // oldVisibleIndexes[i]: the index of the content that was at
                // visible index "i".
                // newContentIndexes[_]: the position that the content should
                // be in now, or undefined if the content is no longer visible.
                // newVisibleIndexes[_]: knowing that the content index that
                // was at visible index "i" in oldVisibleIndexes is now at
                // index "_" in newVisibleIndexes, set this to null as a
                // sentinel indicating "no change in position"

                // The likelyhood that newContentIndexes had a
                // number-turned-to-string property that wasn't his own is
                // pretty slim as it's provided internally.
                // if (newContentIndexes.hasOwnProperty(oldVisibleIndexes[i])) {
                if (typeof newContentIndexes[oldVisibleIndexes[i]] === "number") {
                    newVisibleIndexes[newContentIndexes[oldVisibleIndexes[i]]] = null;
                } else {
                    (holes || (holes = [])).push(i);
                }
            }

            // Fill the holes
            if(holes) {
                for (i = j = 0; (j < holes.length) && (i < newVisibleIndexes.length); i++) {
                    if (newVisibleIndexes[i] !== null) {
                        oldVisibleIndexes.set(holes[j], newVisibleIndexes[i]);
                        j++;
                    }
                }
            }
            // Add new values to the end if the visible indexes have grown
            for (j = oldIndexesLength; i < newVisibleIndexes.length; i++) {
                if (newVisibleIndexes[i] !== null) {
                    oldVisibleIndexes.set(j, newVisibleIndexes[i]);
                    j++;
                }
            }
            // Don't bother triming the excess. We just make them invisible and
            // leave them on the origin.
        }
    },

    _needsComputeVisibleRange: {
        value: true
    },

    _previousVisibleRanges: {
        value: null
    },

    viewportWidth: {
        get: function () {
            return this._width;
        },
        set: function (value) {
            if (this._width !== value) {
                this._width = value;
                this._needsComputeVisibleRange = true;
            }
        }
    },

    viewportHeight: {
        get: function () {
            return this._height;
        },
        set: function (value) {
            if (this._height !== value) {
                this._height = value;
                this._needsComputeVisibleRange = true;
            }
        }
    },

    _firstIterationWidth: {
        value: 1
    },

    _firstIterationHeight: {
        value: 1
    },

    firstIterationWidth: {
        get: function () {
            return this._firstIterationWidth;
        },
        set: function (value) {
            if (value !== this._firstIterationWidth) {
                this._firstIterationWidth = value;
                this._needsComputeVisibleRange = true;
                this._needsClearVisibleIndexes = true;
            }
        }
    },

    firstIterationHeight: {
        get: function () {
            return this._firstIterationHeight;
        },
        set: function (value) {
            if (value !== this._firstIterationHeight) {
                this._firstIterationHeight = value;
                this._needsComputeVisibleRange = true;
                this._needsClearVisibleIndexes = true;
            }
        }
    },

    _firstIterationOffsetLeft: {
        value: 0
    },

    _firstIterationOffsetTop: {
        value: 0
    },

    willDraw: {
        value: function Flow_willDraw(timestamp) {
            var intersections,
                index,
                i,
                countI,
                j,
                k,
                offset,
                startIndex,
                endIndex,
                mod,
                div,
                iterations,
                newVisibleIndexes = this._newVisibleIndexes,
                // newContentIndexes is a reverse-lookup hash of
                // newVisibleIndexes, which we keep in sync manually.
                newContentIndexes = {},
                time,
                interpolant,
                paths = this._paths,
                pathsLength = paths.length,
                splinePaths = this.splinePaths;

            this.viewportWidth = this._element.clientWidth;
            this.viewportHeight = this._element.clientHeight;
            if (this.__firstIteration) {
                var element = this.__firstIteration.firstElement.children[0];

                if ((element.offsetWidth !== 0) && (element.offsetHeight !== 0)) {
                    this.firstIterationWidth = element.offsetWidth;
                    this.firstIterationHeight = element.offsetHeight;
                    this._firstIterationOffsetLeft = element.offsetLeft;
                    this._firstIterationOffsetTop = element.offsetTop;
                    if (!this._boundingBoxSize) {
                        var x = Math.max(
                                Math.abs(this._firstIterationWidth + this._firstIterationOffsetLeft),
                                Math.abs(this._firstIterationOffsetLeft)
                            ),
                            y = Math.max(
                                Math.abs(this._firstIterationHeight + this._firstIterationOffsetTop),
                                Math.abs(this._firstIterationOffsetTop)
                            );

                        this._elementsBoundingSphereRadius = Math.sqrt(x * x + y * y);
                    }
                }
            }
            // Manage scroll animation
            if (this._isTransitioningScroll) {
                time = (Date.now() - this._scrollingStartTime) / this._scrollingTransitionDurationMiliseconds; // TODO: division by zero
                interpolant = this._computeCssCubicBezierValue(time, this._scrollingTransitionTimingFunctionBezier);
                if (time < 1) {
                    this.scroll = this._scrollingOrigin + (this._scrollingDestination - this._scrollingOrigin) * interpolant;
                } else {
                    this.scroll = this._scrollingDestination;
                    this._isTransitioningScroll = false;
                    this._needsToCallDidTranslateEndDelegate = true;
                }
            }

            var time = timestamp,
                // "iterations" is the number of iterations for the numerical methods
                // integration of elastic scrolling. The higher the iterations, the more
                // precise it is, but slower to compute. Setting it to 6 provides
                // a good balance between precision and performance.
                iterations = 6,
                interval1 = this.lastDrawTime ? (time - this.lastDrawTime) * .018 * this._elasticScrollingSpeed : 0,
                interval = 1 - (interval1 / iterations),
                offset1, offset2, resultOffset,
                min = this._minSlideOffsetIndex,
                max = this._maxSlideOffsetIndex,
                position,
                step;

            this.lastDrawTime = time;
            if (this._hasElasticScrolling) {
                for (j = 0; j < iterations; j++) {
                    for (i = this._draggedSlideIndex - 1; i >= min; i--) {
                        offset1 = this._getSlideOffset(i);
                        offset2 = this._getSlideOffset(i + 1);
                        resultOffset = (offset1 - offset2) * interval + offset2;
                        if (resultOffset > 0) {
                            resultOffset = 0;
                        }
                        this._updateSlideOffset(i, resultOffset);
                    }
                    for (i = this._draggedSlideIndex + 1; i <= max; i++) {
                        offset1 = this._getSlideOffset(i);
                        offset2 = this._getSlideOffset(i - 1);
                        resultOffset = (offset1 - offset2) * interval + offset2;
                        if (resultOffset < 0) {
                            resultOffset = 0;
                        }
                        this._updateSlideOffset(i, resultOffset);
                    }
                }
            }

            // Compute which slides are in view
            if (splinePaths.length) {
                mod = this._numberOfIterations % pathsLength;
                div = (this._numberOfIterations - mod) / pathsLength;
                if (this._needsComputeVisibleRange) {
                    this._previousVisibleRanges = [];
                }
                for (k = 0; k < pathsLength; k++) {
                    iterations = div + ((k < mod) ? 1 : 0);
                    if (this._needsComputeVisibleRange) {
                        intersections = this._computeVisibleRange(splinePaths[k]);
                        this._previousVisibleRanges[k] = intersections;
                        splinePaths[k]._computeDensitySummation();
                    } else {
                        intersections = this._previousVisibleRanges[k];
                    }
                    offset =  this._scroll - paths[k].headOffset;
                    for (i = 0, countI = intersections.length; i < countI; i++) {
                        step = iterations / 2;
                        j = step;
                        while (step >= 1) {
                            index = (j|0) * pathsLength + k;
                            position = (j|0) + this._getSlideOffset(index) - offset;
                            step /= 2;
                            if (position >= intersections[i][0]) {
                                j -= step;
                            } else {
                                j += step;
                            }
                        }
                        j = (j - 1) | 0;
                        if (j < 0) {
                            j = 0;
                        }
                        do {
                            index = j * pathsLength + k;
                            position = j + this._getSlideOffset(index) - offset;
                            if ((position >= intersections[i][0]) && (position <= intersections[i][1]) && ( newContentIndexes[index] === void 0)) {
                                newContentIndexes[index] = newVisibleIndexes.length;
                                newVisibleIndexes[newVisibleIndexes.length] = index;
                            }
                            j++;
                        } while ((position <= intersections[i][1]) && (j < iterations));
                    }
                }
                this._needsComputeVisibleRange = false;
            }
            this._updateVisibleIndexes(newVisibleIndexes, newContentIndexes);
            newVisibleIndexes.length = 0;
        }
    },

    draw: {
        value: function Flow_draw(timestamp) {
            var i,
                length = this._repetition._drawnIterations.length,
                iteration,
                element,
                elementChildren,
                pos,
                perspective,
                visibleIndexes = this._visibleIndexes,
                viewpointPosition = this._viewpointPosition,
                viewpointTargetPoint = this._viewpointTargetPoint,
                indexTime,
                rotation,
                offset,
                _splinePaths = this._splinePaths,
                iSplinePath,
                cssText;

            if (this._isTransitioningScroll) {
                this.needsDraw = true;
            }
            if (this._isCameraUpdated) {
                if (this._isCameraEnabled) {
                    var perspective = Math.tan(((90 - this._viewpointFov * .5) * this._doublePI) / 360) * this._height * .5,
                        vX = viewpointTargetPoint[0] - viewpointPosition[0],
                        vY = viewpointTargetPoint[1] - viewpointPosition[1],
                        vZ = viewpointTargetPoint[2] - viewpointPosition[2],
                        yAngle = Math.atan2(-vX, -vZ),  // TODO: Review this
                        tmpZ,
                        xAngle;

                    tmpZ = vX * -Math.sin(-yAngle) + vZ * Math.cos(-yAngle);
                    xAngle = Math.atan2(-vY, -tmpZ);
                    this._element.style[this._transformPerspective]= perspective + "px";
                    cssText = "translate3d(0,0,";
                    cssText += perspective;
                    cssText += "px)rotateX(";
                    cssText += xAngle;
                    cssText += "rad)rotateY(";
                    cssText += (-yAngle);
                    cssText += "rad)";
                    cssText += "translate3d(";
                    cssText += (-viewpointPosition[0]);
                    cssText += "px,";
                    cssText += (-viewpointPosition[1]);
                    cssText += "px,";
                    cssText += (-viewpointPosition[2]);
                    cssText += "px)";

                    this._cameraElement.style[this._transform] = cssText;
                    this._element.classList.remove("camera-disabled");
                } else {
                    this._element.style[this._transformPerspective]= this._perspective + "px";
                    cssText = "translate3d(" ;
                    cssText += (.5 * this._width - viewpointPosition[0]);
                    cssText += "px, ";
                    cssText += (.5 * this._height - viewpointPosition[1]);
                    cssText += "px,0)";
                    this._cameraElement.style[this._transform] = cssText;
                    this._element.classList.add("camera-disabled");
                }
                this._isCameraUpdated = false;
            }
            if (_splinePaths.length) {
                for (i = 0; i < length; i++) {
                    offset = this.offset(visibleIndexes[i]);
                    iSplinePath = _splinePaths[offset.pathIndex];
                    indexTime = iSplinePath._convertSplineTimeToBezierIndexTime(offset.slideTime);
                    iteration = this._repetition._drawnIterations[i];
                    element = iteration.cachedFirstElement || iteration.firstElement;
                    if (indexTime !== null) {
                        if (elementChildren = element.children[0]) {
                            if (element.classList.contains("selected")) {
                                elementChildren.classList.add("selected");
                            } else {
                                elementChildren.classList.remove("selected");
                            }
                            if (element.classList.contains("active")) {
                                elementChildren.classList.add("active");
                            } else {
                                elementChildren.classList.remove("active");
                            }
                        }
                        pos = iSplinePath.getPositionAtIndexTime(indexTime, this._sceneScale);
                        rotation = iSplinePath.getRotationAtIndexTime(indexTime);
                        cssText = this._transformCss;
                        cssText += ":translate3d(";
                        cssText += (((pos[0] * 100000) >> 0) * .00001);
                        cssText += "px,";
                        cssText += (((pos[1] * 100000) >> 0) * .00001);
                        cssText += "px,";
                        cssText += (((pos[2] * 100000) >> 0) * .00001) ;
                        cssText += "px)";
                        cssText += (rotation[2] ? "rotateZ(" + (((rotation[2] * 100000) >> 0) * .00001) + "rad)" : "");
                        cssText += (rotation[1] ? "rotateY(" + (((rotation[1] * 100000) >> 0) * .00001) + "rad)" : "");
                        cssText += (rotation[0] ? "rotateX(" + (((rotation[0] * 100000) >> 0) * .00001) + "rad)" : "");
                        cssText += ";";
                        cssText += iSplinePath.getStyleAtIndexTime(indexTime);

                        element.setAttribute("style",cssText);

                    } else {
                        element.setAttribute("style", "display:none");
                    }
                }
            } else {
                for (i = 0; i < length; i++) {
                    iteration = this._repetition._drawnIterations[i];
                    element = iteration.cachedFirstElement || iteration.firstElement;
                    element.setAttribute("style", "display:none");
                }
            }
            // Continue animation during elastic scrolling
            if (this._slideOffsetsLength) {
                this.needsDraw = true;
            }
            if (this._needsToCallDidTranslateEndDelegate) {
                this._needsToCallDidTranslateEndDelegate = false;
                this.callDelegateMethod("didTranslateEnd", this);
            }
        }
    },

    // TODO doc
    /**
     */
    _updateLength: {
        value: function _updateLength() {
            if (this._paths) {
                var iPath,
                    pathsLength = this._paths.length,
                    iterations,
                    iLength,
                    maxLength = 0,
                    div, mod,
                    i;

                if (pathsLength > 0) {
                    mod = this._numberOfIterations % pathsLength;
                    div = (this._numberOfIterations - mod) / pathsLength;
                    for (i = 0; i < pathsLength; i++) {
                        iPath = this._paths[i];
                        iterations = div + ((i < mod) ? 1 : 0);
                        iLength = iterations - iPath.tailOffset + iPath.headOffset - 1;
                        if (iLength > maxLength) {
                            maxLength = iLength;
                        }
                    }
                    this.length = maxLength;
                }
                this.needsDraw = true;
            }
        }
    },

    /**
     * `numberOfIterations` represents the number of iterations that
     * would be visible without culling the ones that are outside the field of
     * view.  It is the same as the number of values from the content after
     * filters are applied by the content controller.
     *
     * The content length is managed by the flow.  Do not set this property.
     * It is however safe to read and  observe changes to the property.
     */
    _numberOfIterations: {
        value: 0
    },

    handle_numberOfIterationsChange: {
        value: function () {
            this._updateLength();
        }
    },

    content: {
        get: function () {
            return this.getPath("contentController.content");
        },
        set: function (content) {
            this.contentController = new RangeController().initWithContent(content);
        }
    },

    // TODO doc
    /**
     */
    contentController: {
        value: null
    },

    // TODO doc
    /**
     */
    isSelectionEnabled: {
        value: null
    },

    // TODO doc
    /**
     */
    selectedIndexes: {
        serializable: false,
        value: null
    },

    // TODO doc
    /**
     */
    activeIndexes: {
        serializable: false,
        value: null
    },

    observeProperty: {
        value: function (key, emit, scope) {
            return observeProperty(this, key, emit, scope);
        }
    },

    // TODO remove, will be obsoleted by inner template, provided we have a way
    // to redraft the innter template with a wrapper node.
    templateDidLoad: {
        value: function () {
            var self = this;
            // TODO consider a two-way binding on needsDraw
            this._repetition.willDraw = function () {
                self.needsDraw = true;
            };
        }
    },

    _length: {
        value: 0
    },

    /**
     * The number of visible iterations after frustum culling, which is
     * subject to variation depending on the scroll offset.
     *
     * <pre>
     * +----+ +----+ +----+ +----+ +----+
     * |    | |    | |    | |    | |    | length = 5
     * +----+ +----+ +----+ +----+ +----+
     * --+ +----+ +----+ +----+ +----+ +-
     *   | |    | |    | |    | |    | |  length = 6
     * --+ +----+ +----+ +----+ +----+ +-
     * </pre>
     */
    length: {
        get: function () {
            return this._length;
        },
        set: function (value) {
            if (value < 0) {
                this._length = 0;
            } else {
                this._length = value;
            }
        }
    },

    // TODO doc
    /*
     */
    _scroll: {
        value: 0
    },

    // TODO doc
    /*
     */
    _elasticScrollingRange: {
        value: 20
    },

    _hasElasticScrolling: {
        value: false
    },

    // TODO doc
    /**
     */
    hasElasticScrolling: {
        get: function () {
            return this._hasElasticScrolling;
        },
        set: function (value) {
            if (value) {
                this._hasElasticScrolling = true;
            } else {
                this._hasElasticScrolling = false;
            }
        }
    },

    // TODO doc
    /**
     */
    _slideOffsets: {
        value: null
    },

    // TODO doc
    /*
     */
    _slideOffsetsLength: {
        value: 0
    },

    // TODO doc
    /*
     */
    _maxSlideOffsetIndex: {
        value: -1
    },

    // TODO doc
    /*
     */
    _minSlideOffsetIndex: {
        value: 2e9
    },

    // TODO doc
    /*
     */
    _updateSlideOffset: {
        value: function (index, value) {
            var epsilon = 1e-4;

            if (index >= 0) {
                if ((value < -epsilon) || (value > epsilon)) {
                    if (typeof this._slideOffsets[index] === "undefined") {
                        this._slideOffsetsLength++;
                        if (index < this._minSlideOffsetIndex) {
                            this._minSlideOffsetIndex = index;
                        }
                        if (index > this._maxSlideOffsetIndex) {
                            this._maxSlideOffsetIndex = index;
                        }
                    }
                    this._slideOffsets[index] = value;
                } else {
                    this._removeSlideOffset(index);
                }
            }
        }
    },

    // TODO doc
    /*
     */
    _incrementSlideOffset: {
        value: function (index, value) {
            this._updateSlideOffset(index, this._getSlideOffset(index) + value);
        }
    },

    // TODO doc
    /*
     */
    _removeSlideOffset: {
        value: function (index) {
            if (typeof this._slideOffsets[index] !== "undefined") {
                var keys, i, integerKey, keysLength;

                delete this._slideOffsets[index];
                this._slideOffsetsLength--;
                if (index === this._minSlideOffsetIndex) {
                    keys = Object.keys(this._slideOffsets);
                    this._minSlideOffsetIndex = 2e9;
                    for (i = 0, keysLength = keys.length; i < keysLength; i++) {
                        integerKey = keys[i] | 0;
                        if (integerKey < this._minSlideOffsetIndex) {
                            this._minSlideOffsetIndex = integerKey;
                        }
                    }
                }
                if (index === this._maxSlideOffsetIndex) {
                    if (typeof keys === "undefined") {
                        keys = Object.keys(this._slideOffsets);
                        keysLength = keys.length;
                    }
                    this._maxSlideOffsetIndex = -1;
                    for (i = 0; i < keysLength; i++) {
                        integerKey = keys[i] | 0;
                        if (integerKey > this._maxSlideOffsetIndex) {
                            this._maxSlideOffsetIndex = integerKey;
                        }
                    }
                }
            }
        }
    },

    // TODO doc
    /*
     */
    _getSlideOffset: {
        value: function (index) {
            if (index < this._minSlideOffsetIndex) {
                if (this._minSlideOffsetIndex > this._draggedSlideIndex) {
                    index = this._draggedSlideIndex;
                } else {
                    index = this._minSlideOffsetIndex;
                }
            } else {
                if (index > this._maxSlideOffsetIndex) {
                    if (this._maxSlideOffsetIndex < this._draggedSlideIndex) {
                        index = this._draggedSlideIndex;
                    } else {
                        index = this._maxSlideOffsetIndex;
                    }
                }
            }
            if (typeof this._slideOffsets[index] !== "undefined") {
                return this._slideOffsets[index];
            } else {
                return 0;
            }
        }
    },

    // TODO doc
    /**
     */
    scroll: {
        get: function () {
            return this._scroll;
        },
        set: function (value) {
            if (value < 0) {
                value = 0;
            }
            if (value > this.length) {
                value = this.length;
            }
            if (this._hasElasticScrolling && (this._draggedSlideIndex !== null)) {
                var i,
                    n,
                    min = this._draggedSlideIndex - this._elasticScrollingRange,
                    max = this._draggedSlideIndex + this._elasticScrollingRange,
                    tmp,
                    j,
                    x;

                if (min > this._minSlideOffsetIndex) {
                    min = this._minSlideOffsetIndex;
                }
                if (max < this._maxSlideOffsetIndex) {
                    max = this._maxSlideOffsetIndex;
                }
                tmp = value - this._scroll;
                if (min < 0) {
                    min = 0;
                }
                for (i = min; i <= max; i++) {
                    if (i !== this._draggedSlideIndex) {
                        this._incrementSlideOffset(i, tmp);
                    } else {
                        this._removeSlideOffset(i);
                    }
                }
                this._scroll = value;
            } else {
                this._scroll = value;
            }

            this.needsDraw = true;
        }
    },

    previousStride: {
        value: function () {
            var currentPosition = Math.round(this.scroll / this.stride),
                moveTo = (currentPosition - 1) * this.stride;

            this.startScrollingIndexToOffset(0, -moveTo);
        }
    },

    nextStride: {
        value: function () {
            var currentPosition = Math.round(this.scroll / this.stride),
                moveTo = (currentPosition + 1) * this.stride;

            this.startScrollingIndexToOffset(0, -moveTo);
        }
    },

    _isInputEnabled: { // TODO: Replace by pointerBehavior
        value: true
    },

    // TODO doc
    /**
     */
    isInputEnabled: {
        get: function () {
            return this._isInputEnabled;
        },
        set: function (value) {
            if (value) {
                this._isInputEnabled = true;
            } else {
                this._isInputEnabled = false;
            }
        }
    },

    // TODO doc
    /**
     */
    _draggedSlideIndex: {
        value: 0
    },

    // TODO doc
    /**
     */
    draggedSlideIndex: {
        get: function () {
            return this._draggedSlideIndex;
        },
        set: function (value) {
            if (value !== this._draggedSlideIndex) {
                if (value !== null) {
                    var offset = this._getSlideOffset(value),
                        min = this._minSlideOffsetIndex,
                        max = this._maxSlideOffsetIndex,
                        i;

                    this._incrementSlideOffset(this._draggedSlideIndex, -offset);
                    for (i = min; i <= max; i++) {
                        if (i !== this._draggedSlideIndex) {
                            this._incrementSlideOffset(i, -offset);
                        }
                    }
                    this._removeSlideOffset(value);
                    this._scroll -= offset;
                    this._flowTranslateComposer._scroll = this._scroll;
                }
                this._draggedSlideIndex = value;
                this.needsDraw = true;
            }
        }
    },

    // TODO doc
    /**
     */
    _elasticScrollingSpeed: {
        value: 1
    },

    elasticScrollingSpeed: {
        get: function () {
            return this._elasticScrollingSpeed;
        },
        set: function (value) {
            this._elasticScrollingSpeed = parseFloat(value);
        }
    },

    // TODO doc
    /**
     */
    lastDrawTime: {
        value: null
    },

    // TODO doc
    /**
     */
    offset: {
        enumerable: false,
        value: function (slideIndex) {
            var pathsLength = this._paths.length,
                pathIndex = slideIndex % pathsLength,
                slideTime = Math.floor(slideIndex / pathsLength) - this._scroll + this._paths[pathIndex].headOffset;

            return {
                pathIndex: pathIndex,
                slideTime: slideTime + this._getSlideOffset(slideIndex)
            };
        }
    },

    serializeSelf: {
        value: function (serializer) {
            serializer.setAllValues();

            // TODO: we need a way to add nodes to the serialization... we only
            // have methods to serialize components.

            // HACK: we're only going to serialize components if their DOM
            // element is a direct child of the flow, since we don't have a way
            // to add elements to the serialization there's really no point in
            // doing anyelse reliably.
            var originalContent = this.originalContent;
            for (var i = 0, node; node = originalContent[i]; i++) {
                if (node.component) {
                    serializer.addObject(node.component);
                }
            }
        }
    }

});
