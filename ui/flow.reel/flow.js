var Montage = require("montage").Montage,
    Component = require("ui/component").Component,
    FlowBezierSpline = require("ui/flow-bezier-spline").FlowBezierSpline;

var Flow = exports.Flow = Montage.create(Component, {

    _externalUpdate: {
        enumerable: false,
        value: true
    },

    _cameraPosition: {
        enumerable: false,
        value: [0, 0, 800]
    },

    _cameraFocusPoint: {
        enumerable: false,
        value: [0, 0, 0]
    },

    _cameraFov: {
        enumerable: false,
        value: 50
    },

    _cameraRoll: {
        enumerable: false,
        value: 0
    },

    cameraPosition: {
        get: function () {
            return this._cameraPosition;
        },
        set: function (value) {
            this._cameraPosition = value;
            this._isCameraUpdated = true;
            this.needsDraw = true;
        }
    },

    cameraFocusPoint: {
        get: function () {
            return this._cameraFocusPoint;
        },
        set: function (value) {
            this._cameraFocusPoint = value;
            this._isCameraUpdated = true;
            this.needsDraw = true;
        }
    },

    cameraFov: {
        get: function () {
            return this._cameraFov;
        },
        set: function (value) {
            this._cameraFov = value;
            this._isCameraUpdated = true;
            this.needsDraw = true;
        }
    },

    cameraRoll: {
        get: function () {
            return this._cameraRoll;
        },
        set: function (value) {
            this._cameraRoll = value;
            this._isCameraUpdated = true;
            this.needsDraw = true;
        }
    },

    _splinePath: {
        enumerable: false,
        value: null
    },

    splinePath: {
        get: function () {
            return this._splinePath;
        },
        set: function (value) {
            this._splinePath = value;
            this.needsDraw = true;
        }
    },

    _isCameraUpdated: {
        enumerable: false,
        value: true
    },

    _width: {
        enumerable: false,
        value: null
    },

    _height: {
        enumerable: false,
        value: null
    },

    _repetitionComponents: {
        enumerable: false,
        value: null
    },

    elementsBoundingSphereRadius: {
        value: 10
    },

    _computeFrustumNormals: {
        value: function() {
            var angle = ((this.cameraFov * .5) * Math.PI * 2) / 360,
                x = Math.sin(angle),
                z = Math.cos(angle),
                y = x,
                vX = this.cameraFocusPoint[0] - this.cameraPosition[0],
                vY = this.cameraFocusPoint[1] - this.cameraPosition[1],
                vZ = this.cameraFocusPoint[2] - this.cameraPosition[2],
                yAngle = Math.PI/2 - Math.atan2(vZ, vX),
                tmpZ = vX * -Math.sin(-yAngle) + vZ * Math.cos(-yAngle),
                rX, rY, rZ,
                xAngle = Math.PI/2 - Math.atan2(tmpZ, vY),
                iVector,
                out = [],
                i;

            for (i = 0; i < 4; i++) {
                iVector = [[z, 0, x], [-z, 0, x], [0, z, y], [0, -z, y]][i];
                rX = iVector[0];
                rY = iVector[1] * Math.cos(-xAngle) - iVector[2] * Math.sin(-xAngle);
                rZ = iVector[1] * Math.sin(-xAngle) + iVector[2] * Math.cos(-xAngle);
                out.push([
                    rX * Math.cos(-yAngle) - rZ * Math.sin(-yAngle),
                    rY,
                    rX * Math.sin(-yAngle) + rZ * Math.cos(-yAngle)
                ]);
            }

            return out;
        }
    },

    _segmentsIntersection: { // TODO: re-write variable names
        enumerable: false,
        value: function (r, r2) {
            var n = 0,
                m = 0,
                start,
                end,
                r3 = [];

            while ((n < r.length) && (m < r2.length)) {
                if (r[n][0] >= r2[m][1]) {
                    m++;
                } else {
                    if (r[n][1] <= r2[m][0]) {
                        n++;
                    } else {
                        if (r[n][0] >= r2[m][0]) {
                            start = r[n][0];
                        } else {
                            start = r2[m][0];
                        }
                        if (r[n][1] <= r2[m][1]) {
                            end = r[n][1];
                        } else {
                            end = r2[m][1];
                        }
                        r3.push([start, end]);
                        if (r[n][1] < r2[m][1]) {
                            n++;
                        } else {
                            if (r[n][1] > r2[m][1]) {
                                m++;
                            } else {
                                n++;
                                m++;
                            }
                        }
                    }
                }
            }
            return r3;
        }
    },

    _computeVisibleElements: {
        enumerable: false,
        value: function () {
            var spline = this._splinePath,
                splineLength = spline.knotsLength - 1,
                i, j;

            var planeOrigin = this.cameraPosition,
                normals = this._computeFrustumNormals(),
                planeNormal1 = normals[0],
                planeNormal2 = normals[1],
                r, r2, r3 = [], tmp;

            for (i = 0; i < splineLength; i++) {
                r = spline.directedPlaneBezierIntersection(
                    planeOrigin,
                    normals[0],
                    spline.vectors[0 + i * 3],
                    spline.vectors[1 + i * 3],
                    spline.vectors[2 + i * 3],
                    spline.vectors[3 + i * 3]
                );
                if (r.length) {
                    r2 = spline.directedPlaneBezierIntersection(
                        planeOrigin,
                        normals[1],
                        spline.vectors[0 + i * 3],
                        spline.vectors[1 + i * 3],
                        spline.vectors[2 + i * 3],
                        spline.vectors[3 + i * 3]
                    );
                    if (r2.length) {
                        tmp = this._segmentsIntersection(r, r2);
                        if (tmp.length) {
                            r = spline.directedPlaneBezierIntersection(
                                planeOrigin,
                                normals[2],
                                spline.vectors[0 + i * 3],
                                spline.vectors[1 + i * 3],
                                spline.vectors[2 + i * 3],
                                spline.vectors[3 + i * 3]
                            );
                            tmp = this._segmentsIntersection(r, tmp);
                            if (tmp.length) {
                                r = spline.directedPlaneBezierIntersection(
                                    planeOrigin,
                                    normals[3],
                                    spline.vectors[0 + i * 3],
                                    spline.vectors[1 + i * 3],
                                    spline.vectors[2 + i * 3],
                                    spline.vectors[3 + i * 3]
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
            return r3;
        }
    },

    prepareForDraw: {
        enumerable: false,
        value: function () {
            var self = this;

            if (!this._splinePath) {
                this.splinePath = Object.create(FlowBezierSpline);
            }
            this._repetitionComponents = this._repetition._childComponents;
            window.addEventListener("resize", function () {
                self._isCameraUpdated = true;
                self.needsDraw = true;
            }, false);
        }
    },

    willDraw: {
        enumerable: false,
        value: function () {
            this._width = this._element.offsetWidth;
            this._height = this._element.offsetHeight;
        }
    },

    draw: {
        enumerable: false,
        value: function () {
            var i,
                length = this.numberOfNodes,
                slide = {},
                transform,
                origin,
                iPath = {},
                j,
                iOffset,
                iStyle,
                pos;

            if (this.isAnimating) {
                this._animationInterval();
            }
            if (this._isCameraUpdated) {
                var perspective = Math.tan(((90 - this.cameraFov * .5) * Math.PI * 2) / 360) * this._height * .5,
                    vX = this.cameraFocusPoint[0] - this.cameraPosition[0],
                    vY = this.cameraFocusPoint[1] - this.cameraPosition[1],
                    vZ = this.cameraFocusPoint[2] - this.cameraPosition[2],
                    yAngle = Math.atan2(-vX, -vZ),
                    tmpZ,
                    xAngle;

                tmpZ = vX * -Math.sin(-yAngle) + vZ * Math.cos(-yAngle);
                xAngle = Math.atan2(-vY, -tmpZ);
                this._element.style.webkitPerspective = perspective + "px";
                this._repetition._element.style.webkitTransform =
                    "translate3d(" + 0 + "px, " + 0 + "px, " + perspective + "px) rotateX(" + xAngle + "rad) rotateY(" + (-yAngle) + "rad) " +
                    "translate3d(" + (-this.cameraPosition[0]) + "px, " + (-this.cameraPosition[1]) + "px, " + (-this.cameraPosition[2]) + "px)";
                this._isCameraUpdated = false;
            }
            if (this._splinePath) {
                this._splinePath._computeDensitySummation();
                for (i = 0; i < length; i++) {
                    iStyle = this._repetitionComponents[i].element.style;
                    iOffset = this._offset.value(i);
                    slide.index = i;
                    slide.time = iOffset.time;
                    slide.speed = iOffset.speed;
                    iPath = {};
                    iPath.style = {};
                    pos = this._splinePath.getPositionAtTime(slide.time / 300);
                    if (pos) {
                        iPath.translateX = pos[0];
                        iPath.translateY = pos[1];
                        iPath.translateZ = pos[2];
                        if (iStyle.display !== "block") {
                            iStyle.display = "block";
                        }
                        iPath.rotateX = pos[3].rotateX;
                        iPath.rotateY = pos[3].rotateY;
                        iPath.rotateZ = pos[3].rotateZ;
                        iPath.style.opacity = pos[3].opacity;

                        transform = "translate3d(" + iPath.translateX + "px," + iPath.translateY + "px," + iPath.translateZ + "px) ";
                        //transform += (typeof iPath.scale !== "undefined") ? "scale("+iPath.scale+") " : "";
                        transform += (typeof iPath.rotateZ !== "undefined") ? "rotateZ(" + iPath.rotateZ + ") " : "";
                        transform += (typeof iPath.rotateY !== "undefined") ? "rotateY(" + iPath.rotateY + ") " : "";
                        transform += (typeof iPath.rotateX !== "undefined") ? "rotateX(" + iPath.rotateX + ") " : "";
                        iStyle.webkitTransform = transform;
                        if (typeof iPath.style !== "undefined") {
                            for (j in iPath.style) {
                                if ((iPath.style.hasOwnProperty(j)) && (iStyle[j] !== iPath.style[j])) {
                                    iStyle[j] = iPath.style[j];
                                }
                            }
                        }
                    } else {
                        if (iStyle.display !== "none") {
                            iStyle.display = "none";
                        }
                    }
                }
            }
        }
    },

    /////////////////////////////// Almost Copy/Pasted from List ///////////////////////////

    _orphanedChildren: {
        enumerable: false,
        value: null
    },

    _objectsForRepetition: {
        enumerable: false,
        value: null
    },

    objects: {
        enumerable: false,
        get: function() {
            if (this._repetition) {
                return this._repetition.objects;
            } else {
                return this._objectsForRepetition;
            }
        },
        set: function(value) {
            if (this._repetition) {
                this._repetition.objects = value;
            } else {
                this._objectsForRepetition = value;
            }
        }
    },

    _contentControllerForRepetition: {
        enumerable: false,
        value: null
    },

    contentController: {
        enumerable: false,
        get: function() {
            if (this._repetition) {
                return this._repetition.contentController;
            } else {
                return this._contentControllerForRepetition;
            }
        },
        set: function(value) {
            if (this._repetition) {
                this._repetition.contentController = value;
            } else {
                this._contentControllerForRepetition = value;
            }
        }
    },

    _isSelectionEnabledForRepetition: {
        enumerable: false,
        value: null
    },

    isSelectionEnabled: {
        enumerable: false,
        get: function() {
            if (this._repetition) {
                return this._repetition.isSelectionEnabled;
            } else {
                return this._isSelectionEnabledForRepetition;
            }
        },
        set: function(value) {
            if (this._repetition) {
                this._repetition.isSelectionEnabled = value;
            } else {
                this._isSelectionEnabledForRepetition = value;
            }
        }
    },

    propertyChangeBindingListener: {
        value: function(type, listener, useCapture, atSignIndex, bindingOrigin, bindingPropertyPath, bindingDescriptor) {
            if (bindingDescriptor.boundObjectPropertyPath.match(/objectAtCurrentIteration/)) {
                if (this._repetition) {
                    bindingDescriptor.boundObject = this._repetition;
                    return this._repetition.propertyChangeBindingListener.apply(this._repetition, arguments);
                } else {
                    return null;
                }
            } else {
                return Object.prototype.propertyChangeBindingListener.apply(this, arguments);
            }
        }
    },

    deserializedFromTemplate: {
        value: function() {
            this._orphanedChildren = this.childComponents;
            this.childComponents = null;

            //// offset
            this.offset = true;
        }
    },

    _repetitionDraw: {
        enumerable: false,
        value: function () {
            this.numberOfNodes=this._repetition._childComponents.length;
        }
    },

    templateDidLoad: {
        value: function() {
            var orphanedFragment,
                currentContentRange = this.element.ownerDocument.createRange(),
                oldRepetitionDraw = this._repetition.draw,
                self = this;

            this._repetition.draw = function () {
                oldRepetitionDraw.call(self._repetition);
                self._repetitionDraw();
            };
            currentContentRange.selectNodeContents(this.element);
            orphanedFragment = currentContentRange.extractContents();
            this._repetition.element.appendChild(orphanedFragment);
            this._repetition.childComponents = this._orphanedChildren;
            this._repetition.needsDraw = true;
            if (this._objectsForRepetition !== null) {
                this._repetition.objects = this._objectsForRepetition;
                this._objectsForRepetition = null;
            }
            if (this._contentControllerForRepetition !== null) {
                this._repetition.contentController = this._contentControllerForRepetition;
                this._contentControllerForRepetition = null;
            }
            if (this._isSelectionEnabledForRepetition !== null) {
                this._repetition.isSelectionEnabled = this._isSelectionEnabledForRepetition;
                this._isSelectionEnabledForRepetition = null;
            }
        }
    },

    ////////////////////// offset /////////////////////////

    isAnimating: {
        enumerable: false,
        value: false
    },

    _hasElasticScrolling: {
        enumerable: false,
        value: true
    },

    hasElasticScrolling: {
        get: function () {
            return this._hasElasticScrolling;
        },
        set: function (value) {
            this._hasElasticScrolling=(value===true)?true:false;
        }
    },

    _elasticScrollingSpeed: {
        enumerable: false,
        value: 1
    },

    elasticScrollingSpeed: {
        get: function () {
            return this._elasticScrollingSpeed;
        },
        set: function (value) {
            this._elasticScrollingSpeed = value;
            if (!value) {
                this.hasElasticScrolling = false;
            }
        }
    },

    _selectedSlideIndex: {
        enumerable: false,
        value: null
    },

    selectedSlideIndex: {
        get: function () {
            return this._selectedSlideIndex;
        },
        set: function (value) {
            this._selectedSlideIndex=value;
            if (typeof this.animatingHash[this._selectedSlideIndex] !== "undefined") {
                var tmp=this.slide[this._selectedSlideIndex].x;
                this.origin+=(this._selectedSlideIndex*this._scale)-tmp;
            }
        }
    },

    _animating: {
        enumerable: false,
        value: null
    },

    animating: {
        enumerable: false,
        get: function () {
            if (!this._animating) {
                this._animating=[];
            }
            return this._animating;
        },
        set: function () {
        }
    },

    _animatingHash: {
        enumerable: false,
        value: null
    },

    animatingHash: {
        enumerable: false,
        get: function () {
            if (!this._animatingHash) {
                this._animatingHash={};
            }
            return this._animatingHash;
        },
        set: function () {
        }
    },

    _slide: {
        enumerable: false,
        value: null
    },

    slide: {
        enumerable: false,
        get: function () {
            if (!this._slide) {
                this._slide={};
            }
            return this._slide;
        },
        set: function () {
        }
    },

    startAnimating: {
        enumerable: false,
        value: function (index, pos) {
            if (typeof this.animatingHash[index] === "undefined") {
                var length=this.animating.length;

                this.animating[length]=index;
                this.animatingHash[index]=length;
                this.slide[index]={
                    speed: 0,
                    x: pos
                };
            } else {
                this.slide[index].x=pos;
            }
        }
    },

    stopAnimating: {
        enumerable: false,
        value: function (index) {
            if (typeof this.animatingHash[index] !== "undefined") {
                this.animating[this.animatingHash[index]]=this.animating[this.animating.length-1];
                this.animatingHash[this.animating[this.animating.length-1]]=this.animatingHash[index];
                this.animating.pop();
                delete this.animatingHash[index];
                delete this.slide[index];
            }
        }
    },

    _range: {
        value: 15
    },

    lastDrawTime: {
        value: null
    },

    _origin: {
        enumerable: false,
        value: 0
    },

    origin: {
        get: function () {
            return this._origin;
        },
        set: function (value) {
            if ((this._hasElasticScrolling)&&(this._selectedSlideIndex !== null)) {
                var i,
                    n,
                    min=this._selectedSlideIndex-this._range,
                    max=this._selectedSlideIndex+this._range+1,
                    tmp,
                    j,
                    x,
                    self=this;

                tmp=value-this._origin;
                if (min<0) {
                    min=0;
                }

                if (!this.isAnimating) {
                    this.lastDrawTime=Date.now();
                }
                for (i=min; i<max; i++) {
                    if (i!=this._selectedSlideIndex) {
                        if (typeof this.animatingHash[i] === "undefined") {
                            x=i*this._scale;
                        } else {
                            x=this.slide[i].x;
                        }
                        x+=tmp;
                        if (i<this._selectedSlideIndex) {
                            if (x<i*this._scale) {
                                this.startAnimating(i, x);
                            }
                        } else {
                            if (x>i*this._scale) {
                                this.startAnimating(i, x);
                            }
                        }
                    }
                }
                this.stopAnimating(this._selectedSlideIndex);

                if (!this.isAnimating) {
                    this._animationInterval=function () {
                        var animatingLength=self.animating.length,
                            n, j, i, _iterations=8,
                            time=Date.now(),
                            interval1=self.lastDrawTime?(time-self.lastDrawTime)*0.015*this._elasticScrollingSpeed:0,
                            interval=interval1/_iterations,
                            mW=self._scale, x,
                            epsilon=.5;

                        for (n=0; n<_iterations; n++) {
                            for (j=0; j<animatingLength; j++) {
                                i=self.animating[j];
                                if (i<self._selectedSlideIndex) {
                                    if (typeof self.animatingHash[i+1] === "undefined") {
                                        x=((i+1)*self._scale);
                                    } else {
                                        x=self.slide[i+1].x;
                                    }
                                    self.slide[i].speed=x-self.slide[i].x-mW;
                                } else {
                                    if (typeof self.animatingHash[i-1] === "undefined") {
                                        x=((i-1)*self._scale);
                                    } else {
                                        x=self.slide[i-1].x;
                                    }
                                    self.slide[i].speed=x-self.slide[i].x+mW;
                                }
                                self.slide[i].x+=(self.slide[i].speed)*interval;
                            }
                        }
                        j=0;
                        while (j<animatingLength) {
                            i=self.animating[j];
                            if (i<self._selectedSlideIndex) {
                                if (self.slide[i].x>i*self._scale-epsilon) {
                                    self.stopAnimating(i);
                                    animatingLength--;
                                } else {
                                    j++;
                                }
                            } else {
                                if (self.slide[i].x<i*self._scale+epsilon) {
                                    self.stopAnimating(i);
                                    animatingLength--;
                                } else {
                                    j++;
                                }
                            }
                        }
                        self.lastDrawTime=time;
                        if (!animatingLength) {
                            self.isAnimating=false;
                        } else {
                            self.needsDraw=true;
                            if (!self.isAnimating) {
                                self.isAnimating=true;
                            }
                        }
                    }
                }
                if (!this.isAnimating) {
                    this._animationInterval();
                }
            }
            this._origin = value;
            this.needsDraw = true;
        }
    },

    _scale: {
        enumerable: false,
        value: 100
    },

    scale: {
        get: function () {
            return this._scale;
        },
        set: function (value) {
            var oldScale = this._scale;

            this._scale = value;
            this.length = value * (this._numberOfNodes-1);
            if (!this.isAnimating) {
                this.selectedSlideIndex = null;
                this.origin = this._origin * value / oldScale;
            }
            this.needsDraw = true;
        }
    },

    _numberOfNodes: {
        enumerable: false,
        value: 0
    },

    numberOfNodes: {
        get: function () {
            return this._numberOfNodes;
        },
        set: function (value) {
            this._numberOfNodes = value;
            this.length = (value-1) * this._scale;
            this.needsDraw = true;
        }
    },

    _length: {
        enumerable: false,
        value: 0
    },

    length: {
        get: function () {
            return this._length;
        },
        set: function (value) {
            if (value<0) {
                this._length = 0;
            } else {
                this._length = value;
            }
        }
    },

    _offset: {
        enumerable: false,
        value: {
            value: function (nodeNumber) {
                return 0;
            }
        }
    },

    offset: {
        get: function () {
            return this._offset;
        },
        set: function () {
            var self = this;

            this._offset = {
                value: function (nodeNumber) {
                    if (typeof self.animatingHash[nodeNumber] === "undefined") {
                        return {
                            time: (nodeNumber*self._scale)-self._origin,
                            speed: 0
                        }
                    } else {
                        return {
                            time: self.slide[nodeNumber].x-self.origin,
                            speed: self.slide[nodeNumber].speed
                        }
                    }
                    this.needsDraw = true;
                }
            };
        }
    }
});
