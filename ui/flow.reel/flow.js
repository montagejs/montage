var Montage = require("montage").Montage,
    Component = require("ui/component").Component;

var Flow = exports.Flow = Montage.create(Component, {

    // TODO: Review _externalUpdate

    _externalUpdate: {
        enumerable: false,
        value: true
    },

    _isCameraUpdated: {
        enumerable: false,
        value: false
    },

    // Camera rotation based in CSS3 rotate3D axis/angle system

    _cameraRotationAxisX: {
        enumerable: false,
        value: 0
    },

    _cameraRotationAxisY: {
        enumerable: false,
        value: 0
    },

    _cameraRotationAxisZ: {
        enumerable: false,
        value: 1
    },

    _cameraRotationAngle: {
        enumerable: false,
        value: 0
    },

    cameraRotationAxisX: {
        get: function () {
            return this._cameraRotationAxisX;
        },
        set: function (value) {
            this._cameraRotationAxisX = value;
            this._isCameraUpdated = true;
            this.needsDraw = true;
        }
    },

    cameraRotationAxisY: {
        get: function () {
            return this._cameraRotationAxisY;
        },
        set: function (value) {
            this._cameraRotationAxisY = value;
            this._isCameraUpdated = true;
            this.needsDraw = true;
        }
    },

    cameraRotationAxisZ: {
        get: function () {
            return this._cameraRotationAxisZ;
        },
        set: function (value) {
            this._cameraRotationAxisZ = value;
            this._isCameraUpdated = true;
            this.needsDraw = true;
        }
    },

    cameraRotationAngle: {
        get: function () {
            return this._cameraRotationAngle;
        },
        set: function (value) {
            this._cameraRotationAngle = value;
            this._isCameraUpdated = true;
            this.needsDraw = true;
        }
    },

    _path: {
        enumerable: false,
        value: {
            value: function (slide) {
                return {
                    translateX: slide.time,
                    translateY: 0,
                    translateZ: 0,
                    scale: 1,
                    rotateX: 0,
                    rotateY: 0,
                    rotateZ: 0,
                    transformOriginX: 0,
                    transformOriginY: 0,
                    transformOriginZ: 0,
                    style: {}
                };
            }
        }
    },

    path: {
        get: function () {
            return this._path;
        },
        set: function (value) {
            this._path = value;
            this.needsDraw = true;
        }
    },

    _rotationOrder: {
        enumerable: false,
        value: "xyz"
    },

    rotationOrder: {
        get: function () {
            return this._rotationOrder;
        },
        set: function (value) {
            switch (value) {
                case "xzy":
                case "yxz":
                case "yzx":
                case "zxy":
                case "zyx":
                    this._rotationOrder=value;
                    break;
                default:
                    this._rotationOrder="xyz";
                    break;
            }
            this.needsDraw = true;
        }
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

    prepareForDraw: {
        enumerable: false,
        value: function () {
            this._repetitionComponents = this._repetition._childComponents;
        }
    },

    draw: {
        enumerable: false,
        value: function () {
            var i,
                length = this.numberOfNodes,
                slide={
                    index: null,
                    time: null,
                    speed: null
                },
                transform,
                origin,
                iPath,
                j,
                jPath,
                iOffset,
                iStyle;

            if (this.isAnimating) {
                this._animationInterval();
            }
            if (this._isCameraUpdated) {
                this._repetition._element.style.webkitTransform = "rotate3d("+this._cameraRotationAxisX+","+this._cameraRotationAxisY+","+this._cameraRotationAxisZ+","+this._cameraRotationAngle+"rad)";
                this._isCameraUpdated = false;
            }
            //if (this._externalUpdate) {
                for (i=0; i<length; i++) {
                    iStyle=this._repetitionComponents[i].element.style;
                    iOffset=this._offset.value(i);
                    slide.index=i;
                    slide.time=iOffset.time;
                    slide.speed=iOffset.speed;
                    iPath=this._path.value(slide);
                    if (typeof iPath.translateX==="undefined") {
                        iPath.translateX=0;
                    }
                    if (typeof iPath.translateY==="undefined") {
                        iPath.translateY=0;
                    }
                    if (typeof iPath.translateZ==="undefined") {
                        iPath.translateZ=0;
                    }
                    transform="translate3d(";
                    transform+=(typeof iPath.translateX==="number")?iPath.translateX+"px,":iPath.translateX+",";
                    transform+=(typeof iPath.translateY==="number")?iPath.translateY+"px,":iPath.translateY+",";
                    transform+=(typeof iPath.translateZ==="number")?iPath.translateZ+"px) ":iPath.translateZ+") ";
                    transform+=(typeof iPath.scale!=="undefined")?"scale("+iPath.scale+") ":"";
                    switch (this._rotationOrder) {
                        case "xyz":
                            transform+=(typeof iPath.rotateZ!=="undefined")?"rotateZ("+iPath.rotateZ+"rad) ":"";
                            transform+=(typeof iPath.rotateY!=="undefined")?"rotateY("+iPath.rotateY+"rad) ":"";
                            transform+=(typeof iPath.rotateX!=="undefined")?"rotateX("+iPath.rotateX+"rad) ":"";
                            break;
                        case "xzy":
                            transform+=(typeof iPath.rotateY!=="undefined")?"rotateY("+iPath.rotateY+"rad) ":"";
                            transform+=(typeof iPath.rotateZ!=="undefined")?"rotateZ("+iPath.rotateZ+"rad) ":"";
                            transform+=(typeof iPath.rotateX!=="undefined")?"rotateX("+iPath.rotateX+"rad) ":"";
                            break;
                        case "yxz":
                            transform+=(typeof iPath.rotateZ!=="undefined")?"rotateZ("+iPath.rotateZ+"rad) ":"";
                            transform+=(typeof iPath.rotateX!=="undefined")?"rotateX("+iPath.rotateX+"rad) ":"";
                            transform+=(typeof iPath.rotateY!=="undefined")?"rotateY("+iPath.rotateY+"rad) ":"";
                            break;
                        case "yzx":
                            transform+=(typeof iPath.rotateX!=="undefined")?"rotateX("+iPath.rotateX+"rad) ":"";
                            transform+=(typeof iPath.rotateZ!=="undefined")?"rotateZ("+iPath.rotateZ+"rad) ":"";
                            transform+=(typeof iPath.rotateY!=="undefined")?"rotateY("+iPath.rotateY+"rad) ":"";
                            break;
                        case "zxy":
                            transform+=(typeof iPath.rotateY!=="undefined")?"rotateY("+iPath.rotateY+"rad) ":"";
                            transform+=(typeof iPath.rotateX!=="undefined")?"rotateX("+iPath.rotateX+"rad) ":"";
                            transform+=(typeof iPath.rotateZ!=="undefined")?"rotateZ("+iPath.rotateZ+"rad) ":"";
                            break;
                        case "zyx":
                            transform+=(typeof iPath.rotateX!=="undefined")?"rotateX("+iPath.rotateX+"rad) ":"";
                            transform+=(typeof iPath.rotateY!=="undefined")?"rotateY("+iPath.rotateY+"rad) ":"";
                            transform+=(typeof iPath.rotateZ!=="undefined")?"rotateZ("+iPath.rotateZ+"rad) ":"";
                            break;
                    }
                    iStyle.webkitTransform=transform;
                    if (typeof iPath.transformOriginX==="undefined") {
                        iPath.transformOriginX="50%";
                    }
                    if (typeof iPath.transformOriginY==="undefined") {
                        iPath.transformOriginY="50%";
                    }
                    if (typeof iPath.transformOriginZ==="undefined") {
                        iPath.transformOriginZ=0;
                    }
                    origin=(typeof iPath.transformOriginX==="number")?iPath.transformOriginX+"px ":iPath.transformOriginX+" ";
                    origin+=(typeof iPath.transformOriginY==="number")?iPath.transformOriginY+"px ":iPath.transformOriginY+" ";
                    origin+=(typeof iPath.transformOriginZ==="number")?iPath.transformOriginZ+"px":iPath.transformOriginZ;
                    iStyle.webkitTransformOrigin=origin;
                    if (typeof iPath.style!=="undefined") {
                        for (j in iPath.style) {
                            if ((iPath.style.hasOwnProperty(j))&&(iStyle[j]!==iPath.style[j])) {
                                iStyle[j]=iPath.style[j];
                            }
                        }
                    }
                }
            //}
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
