var Montage = require("montage").Montage,
    defaultEventManager = require("core/event/event-manager").defaultEventManager;

var Scroll = exports.Scroll = Montage.create(Montage, {

    _externalUpdate: {
        enumerable: false,
        value: true
    },

    isAnimating: {
        enumerable: false,
        value: false
    },

    component: {
        value: {}
    },

    _needsDraw: {
        enumerable: false,
        value: false
    },

    needsDraw: {
        get: function () {
            return this._needsDraw;
        },
        set: function (value) {
            this._needsDraw = value;
            if (this.component) {
                this.component.needsDraw = true;
            }
        }
    },

    draw: {
        value: function () {
            this._needsDraw = false;
            if (this.isAnimating) {
                this._animationInterval();
            }
            this._externalUpdate = false;
        }
    },

    deserializedFromTemplate: {
        value: function () {
            var oldComponentDraw = this.component.draw,
                self = this;

            this.component.draw = function () {
                self.draw();
                oldComponentDraw.call(self.component);
            };
        }
    },

    _pointerSpeedMultiplier: {
        enumerable: false,
        value: 1
    },

    pointerSpeedMultiplier: {
        get: function () {
            return this._pointerSpeedMultiplier;
        },
        set: function (value) {
            this._pointerSpeedMultiplier = value;
        }
    },

    pointerStartEventPosition: {
        value: null
    },

    _isSelfUpdate: {
        enumerable: false,
        value: false
    },

    _scrollX: {
        enumerable: false,
        value: 0
    },

    scrollX: {
        get: function () {
            return this._scrollX;
        },
        set: function (value) {
            if (this._axis==="vertical") {
                this._scrollX=0;
            } else {
                var tmp=isNaN(value)?0:value>>0;

                if ((!this._hasBouncing)||(!this._isSelfUpdate)) {
                    if (tmp<0) {
                        tmp=0;
                    }
                    if (tmp>this._maxScrollX) {
                        tmp=this._maxScrollX;
                    }
                    if (!this._isSelfUpdate) {
                        this.isAnimating = false;
                    }
                }
                this._scrollX=tmp;
            }
        }
    },

    _scrollY: {
        enumerable: false,
        value: 0
    },

    scrollY: {
        get: function () {
            return this._scrollY;
        },
        set: function (value) {
            if (this._axis==="horizontal") {
                this._scrollY=0;
            } else {
                var tmp=isNaN(value)?0:value>>0;

                if ((!this._hasBouncing)||(!this._isSelfUpdate)) {
                    if (tmp<0) {
                        tmp=0;
                    }
                    if (tmp>this._maxScrollY) {
                        tmp=this._maxScrollY;
                    }
                    if (!this._isSelfUpdate) {
                        this.isAnimating = false;
                    }
                }
                this._scrollY=tmp;
            }
        }
    },

    _maxScrollX: {
        enumerable: false,
        value: 0
    },

    maxScrollX: {
        get: function () {
            return this._maxScrollX;
        },
        set: function (value) {
            var tmp=isNaN(value)?0:value>>0;

            if (tmp<0) {
                tmp=0;
            }
            if (this._maxScrollX!=tmp) {
                if (this._scrollX>this._maxScrollX) {
                    this.scrollX=this._maxScrollX;
                }
                this._maxScrollX=tmp;
            }
        }
    },

    _maxScrollY: {
        enumerable: false,
        value: 0
    },

    maxScrollY: {
        get: function () {
            return this._maxScrollY;
        },
        set: function (value) {
            var tmp=isNaN(value)?0:value>>0;

            if (tmp<0) {
                tmp=0;
            }
            if (this._maxScrollY!=tmp) {
                if (this._scrollY>this._maxScrollY) {
                    this.scrollY=this._maxScrollY;
                }
                this._maxScrollY=tmp;
            }
        }
    },

    _element: {
        enumerable: false,
        value: null
    },

    element: {
        get: function () {
            return this._element;
        },
        set: function (element) {
            if (this._element !== element) {
                this._element = element;
                this.prepareForActivationEvents();
            }
        }
    },

    _axis: {
        enumerable: false,
        value: "both"
    },

    axis: {
        get: function () {
            return this._axis;
        },
        set: function (value) {
            switch (value) {
                case "vertical":
                case "horizontal":
                    this._axis=value;
                    break;
                default:
                    this._axis="both";
                    break;
            }
        }
    },

    _hasMomentum: {
        enumerable: false,
        value: true
    },

    hasMomentum: {
        get: function () {
            return this._hasMomentum;
        },
        set: function (value) {
            this._hasMomentum=value?true:false;
        }
    },

    _hasBouncing: {
        enumerable: false,
        value: true
    },

    hasBouncing: {
        get: function () {
            return this._hasBouncing;
        },
        set: function (value) {
            this._hasBouncing=value?true:false;
        }
    },

    _momentumDuration: {
        enumerable: false,
        value: 650
    },

    momentumDuration: {
        get: function () {
            return this._momentumDuration;
        },
        set: function (value) {
            this._momentumDuration=isNaN(value)?1:value>>0;
            if (this._momentumDuration<1) this._momentumDuration=1;
        }
    },

    _bouncingDuration: {
        enumerable: false,
        value: 750
    },

    bouncingDuration: {
        get: function () {
            return this._bouncingDuration;
        },
        set: function (value) {
            this._bouncingDuration=isNaN(value)?1:value>>0;
            if (this._bouncingDuration<1) this._bouncingDuration=1;
        }
    },

    _pointerX: {
        enumerable: false,
        value: null
    },

    _pointerY: {
        enumerable: false,
        value: null
    },

    _touchIdentifier: {
        enumerable: false,
        value: null
    },

    _isFirstMove: {
        enumerable: false,
        value: false
    },

    _start: {
        enumerable: false,
        value: function (x, y, target) {
            this.pointerStartEventPosition = {
                pageX: x,
                pageY: y,
                target: target
            };
            this._pointerX=x;
            this._pointerY=y;
            if (window.Touch) {
                document.addEventListener("touchend", this, true);
                document.addEventListener("touchmove", this, true);
            } else {
                document.addEventListener("mouseup", this, true);
                document.addEventListener("mousemove", this, true);
            }
            this.isAnimating = false;
            this._isFirstMove = true;
        }
    },

    _observedPointer: {
        enumerable: false,
        value: null
    },

    captureMousedown: {
        enumerable: false,
        value: function (event) {

            // TODO this is a bit of a temporary workaround to ensure that we allow input fields
            //to receive the mousedown that gives them focus and sets the cursor a the mousedown coordinates
            if (!(event.target.tagName &&
                ("INPUT" === event.target.tagName || "SELECT" === event.target.tagName || "TEXTAREA" === event.target.tagName)) &&
                    !event.target.isContentEditable) {

                event.preventDefault();
            }

            // Register some interest in the mouse pointer internally, we may end up claiming it but let's see if
            // anybody else cares first
            this._observedPointer = "mouse";

            this._start(event.clientX, event.clientY, event.target);
        }
    },

    handleMousedown: {
        enumerable: false,
        value: function (event) {

            if (!this.eventManager.componentClaimingPointer(this._observedPointer, this)) {
                this.eventManager.claimPointer(this._observedPointer, this);
                this._start(event.clientX, event.clientY, event.target);
            }

        }
    },

    captureMousemove: {
        enumerable: false,
        value: function (event) {

            if (this.eventManager.isPointerClaimedByComponent(this._observedPointer, this)) {
                event.preventDefault();
                this._move(event.clientX, event.clientY);
            } else {
                this._analyzeMovement(event.velocity);
            }

        }
    },

    captureMouseup: {
        enumerable: false,
        value: function (event) {
            this._end(event);
        }
    },

    _releaseInterest: {
        value: function() {

            if (window.Touch) {
                document.removeEventListener("touchend", this, true);
                document.removeEventListener("touchmove", this, true);
            } else {
                document.removeEventListener("mouseup", this, true);
                document.removeEventListener("mousemove", this, true);
            }

            if (this.eventManager.isPointerClaimedByComponent(this._observedPointer, this)) {
                this.eventManager.forfeitPointer(this._observedPointer, this);
            }
            this._observedPointer = null;
        }
    },

    captureTouchstart: {
        enumerable: false,
        value: function (event) {

            event.preventDefault();

            // If already scrolling the scrollview, ignore any new touchstarts
            if (this._observedPointer !== null && this.eventManager.isPointerClaimedByComponent(this._observedPointer, this)) {
                return;
            }

            if (event.targetTouches.length === 1) {
                this._observedPointer = event.targetTouches[0].identifier;
                this._start(event.targetTouches[0].clientX, event.targetTouches[0].clientY, event.targetTouches[0].target);
            }
        }
    },

    handleTouchstart: {
        value: function(event) {
            if (!this.eventManager.componentClaimingPointer(this._observedPointer)) {

                if (event.targetTouches.length === 1) {
                    event.preventDefault();

                    this.eventManager.claimPointer(this._observedPointer, this);
                    this._start(event.targetTouches[0].clientX, event.targetTouches[0].clientY, event.targetTouches[0].target);
                }
            }
        }
    },

    captureTouchmove: {
        enumerable: false,
        value: function (event) {

            var i = 0;
            while (i < event.changedTouches.length && event.changedTouches[i].identifier !== this._observedPointer) {
                i++;
            }

            if (i < event.changedTouches.length) {
                if (this.eventManager.isPointerClaimedByComponent(this._observedPointer, this)) {
                    event.preventDefault();
                    this._move(event.changedTouches[i].clientX, event.changedTouches[i].clientY);
                } else {
                    this._analyzeMovement(event.changedTouches[i].velocity);
                }

            }
        }
    },

    captureTouchend: {
        enumerable: false,
        value: function (event) {
            var i = 0;
            while (i < event.changedTouches.length && !this.eventManager.isPointerClaimedByComponent(event.changedTouches[i].identifier, this)) {
                i++;
            }
            if (i < event.changedTouches.length) {
                this._end(event.changedTouches[i]);
            }
        }
    },

    _analyzeMovement: {
        value: function(velocity) {

            if (!velocity) {
                return;
            }

            var lowerRight = 0.7853981633974483, // pi/4
                lowerLeft = 2.356194490192345, // 3pi/4
                upperLeft = -2.356194490192345, // 5pi/4
                upperRight = -0.7853981633974483, // 7pi/4
                isUp, isDown, isRight, isLeft,
                angle,
                speed;

            speed = velocity.speed;

            if (0 === velocity.speed || isNaN(velocity.speed)) {
                // If there's no speed there's not much we can infer about direction; stop
                return;
            }

            angle = velocity.angle;

            // The motion is with the grain of the scrollview; we may want to see if we should claim the pointer
            if ("horizontal" === this.axis) {

                isRight = (angle <= lowerRight && angle >= upperRight);
                isLeft = (angle >= lowerLeft || angle <= upperLeft);

                if (isRight || isLeft) {
                    this._stealPointer();
                }

            } else if ("vertical" === this.axis) {

                isUp = (angle <= upperRight && angle >= upperLeft);
                isDown = (angle >= lowerRight && angle <= lowerLeft);

                if (isUp || isDown) {
                    this._stealPointer();
                }

            } else if (speed >= 500) {
                // TODO not hardcode this threshold speed
                this._stealPointer();
            }

        }
    },

    _stealPointer: {
        value: function() {
            this.eventManager.claimPointer(this._observedPointer, this);
        }
    },

    _scrollEndTimeout: {
        enumerable: false,
        value: null
    },

    handleMousewheel: {
        enumerable: false,
        value: function (event) {
            var self = this;

            this.scrollY = this._scrollY - (event.wheelDeltaY * 20) / 120;
            this._dispatchScrollStart();
            window.clearTimeout(this._scrollEndTimeout);
            this._scrollEndTimeout = window.setTimeout(function () {
                self._dispatchScrollEnd();
            }, 400);
            event.preventDefault();
        }
    },

    _move: {
        enumerable: false,
        value: function (x, y) {
            var oldX=this._scrollX,
                oldY=this._scrollY;

            this._isSelfUpdate=true;
            if (this._axis!="vertical") {
                if ((this._scrollX<0)||(this._scrollX>this._maxScrollX)) {
                    this.scrollX+=((this._pointerX-x)/2)*this._pointerSpeedMultiplier;
                } else {
                    this.scrollX+=(this._pointerX-x)*this._pointerSpeedMultiplier;
                }
            }
            if (this._axis!="horizontal") {
                if ((this._scrollY<0)||(this._scrollY>this._maxScrollY)) {
                    this.scrollY+=((this._pointerY-y)/2)*this._pointerSpeedMultiplier;
                } else {
                    this.scrollY+=(this._pointerY-y)*this._pointerSpeedMultiplier;
                }
            }
            this._isSelfUpdate=false;
            this._pointerX=x;
            this._pointerY=y;
            if (this._isFirstMove) {
                this._dispatchScrollStart();
                this._isFirstMove = false;
            }
        }
    },

    _animationInterval: {
        enumerable: false,
        value: false
    },

    _bezierTValue: {
        enumerable: false,
        value: function (x, p1x, p1y, p2x, p2y) {
            var a=1-3*p2x+3*p1x,
                b=3*p2x-6*p1x,
                c=3*p1x,
                t=.5,
                der,
                i, k, tmp;

            for (i=0; i<10; i++) {
                tmp=t*t;
                der=3*a*tmp+2*b*t+c;
                k=1-t;
                t-=((3*(k*k*t*p1x+k*tmp*p2x)+tmp*t-x)/der); // der==0
            }
            tmp=t*t;
            k=1-t;
            return 3*(k*k*t*p1y+k*tmp*p2y)+tmp*t;
        }
    },

    _dispatchScrollStart: {
        enumerable: false,
        value: function () {
            var scrollEndEvent = document.createEvent("CustomEvent");

            scrollEndEvent.initCustomEvent("scrollStart", true, true, null);
            scrollEndEvent.type = "scrollStart";
            this.dispatchEvent(scrollEndEvent);
        }
    },

    _dispatchScrollEnd: {
        enumerable: false,
        value: function () {
            var scrollEndEvent = document.createEvent("CustomEvent");

            scrollEndEvent.initCustomEvent("scrollEnd", true, true, null);
            scrollEndEvent.type = "scrollEnd";
            this.dispatchEvent(scrollEndEvent);
        }
    },

    _end: {
        enumerable: false,
        value: function (event) {

            var animateBouncingX=false,
                animateBouncingY=false,
                animateMomentum=false,
                momentumX,
                momentumY,
                startX=this._scrollX,
                startY,
                posX=startX,
                posY,
                endX=startX,
                endY,
                self=this,
                startTimeBounceX=false,
                startTimeBounceY=false,
                startTime=Date.now();

            startY=this._scrollY;
            posY=startY;
            endY=startY;
            if ((this._hasMomentum)&&(event.velocity.speed>40)) {
                if (this._axis!="vertical") {
                    momentumX=event.velocity.x*this._pointerSpeedMultiplier;
                } else {
                    momentumX=0;
                }
                if (this._axis!="horizontal") {
                    momentumY=event.velocity.y*this._pointerSpeedMultiplier;
                } else {
                    momentumY=0;
                }
                endX=startX-(momentumX*this._momentumDuration/2000);
                endY=startY-(momentumY*this._momentumDuration/2000);
                animateMomentum=true;
            }

            this._animationInterval=function () {
                var time=Date.now(), t, tmpX, tmpY;

                if (animateMomentum) {
                    t=time-startTime;
                    if (t<self._momentumDuration) {
                        posX=startX-((momentumX+momentumX*(self._momentumDuration-t)/self._momentumDuration)*t/1000)/2;
                        posY=startY-((momentumY+momentumY*(self._momentumDuration-t)/self._momentumDuration)*t/1000)/2;
                    } else {
                        animateMomentum=false;
                    }
                }

                tmpX=posX;
                tmpY=posY;

                if (self._hasBouncing) {
                    if (endX<0) {
                        if (tmpX<0) {
                            if (!startTimeBounceX) {
                                animateBouncingX=true;
                                startTimeBounceX=time;
                            }
                            t=time-startTimeBounceX;
                            if ((t<self._bouncingDuration)||(animateMomentum)) {
                                if (t>self._bouncingDuration) {
                                    t=self._bouncingDuration;
                                }
                                tmpX=tmpX*(1-self._bezierTValue(t/self._bouncingDuration, .17, .93, .19, 1));
                            } else {
                                tmpX=0;
                                animateBouncingX=false;
                            }
                        } else {
                            animateBouncingX=false;
                        }
                    }

                    if (endY<0) {
                        if (tmpY<0) {
                            if (!startTimeBounceY) {
                                animateBouncingY=true;
                                startTimeBounceY=time;
                            }
                            t=time-startTimeBounceY;
                            if ((t<self._bouncingDuration)||(animateMomentum)) {
                                if (t>self._bouncingDuration) {
                                    t=self._bouncingDuration;
                                }
                                tmpY=tmpY*(1-self._bezierTValue(t/self._bouncingDuration, .17, .93, .19, 1));
                            } else {
                                tmpY=0;
                                animateBouncingY=false;
                            }
                        } else {
                            animateBouncingY=false;
                        }
                    }

                    if (endX>self._maxScrollX) {
                        if (tmpX>self._maxScrollX) {
                            if (!startTimeBounceX) {
                                animateBouncingX=true;
                                startTimeBounceX=time;
                            }
                            t=time-startTimeBounceX;
                            if ((t<self._bouncingDuration)||(animateMomentum)) {
                                if (t>self._bouncingDuration) {
                                    t=self._bouncingDuration;
                                }
                                tmpX=self._maxScrollX+(tmpX-self._maxScrollX)*(1-self._bezierTValue(t/self._bouncingDuration, .17, .93, .19, 1));
                            } else {
                                tmpX=self._maxScrollX;
                                animateBouncingX=false;
                            }
                        } else {
                            animateBouncingX=false;
                        }
                    }

                    if (endY>self._maxScrollY) {
                        if (tmpY>self._maxScrollY) {
                            if (!startTimeBounceY) {
                                animateBouncingY=true;
                                startTimeBounceY=time;
                            }
                            t=time-startTimeBounceY;
                            if ((t<self._bouncingDuration)||(animateMomentum)) {
                                if (t>self._bouncingDuration) {
                                    t=self._bouncingDuration;
                                }
                                tmpY=self._maxScrollY+(tmpY-self._maxScrollY)*(1-self._bezierTValue(t/self._bouncingDuration, .17, .93, .19, 1));
                            } else {
                                tmpY=self._maxScrollY;
                                animateBouncingY=false;
                            }
                        } else {
                            animateBouncingY=false;
                        }
                    }
                }
                self._isSelfUpdate=true;
                self.scrollX=tmpX;
                self.scrollY=tmpY;
                self._isSelfUpdate=false;
                self.isAnimating = animateMomentum||animateBouncingX||animateBouncingY;
                if (self.isAnimating) {
                    self.needsDraw=true;
                } else {
                    this._dispatchScrollEnd();
                }
            };
            this._animationInterval();
            this._releaseInterest();
        }
    },

    surrenderPointer: {
        value: function(pointer, demandingComponent) {
            return true;
        }
    },

    eventManager: {
        get: function() {
            return defaultEventManager;
        }
    },

    prepareForActivationEvents: {
        value: function() {

            if (window.Touch) {
                this._element.addEventListener("touchstart", this, true);
                this._element.addEventListener("touchstart", this, false);
            } else {
                this._element.addEventListener("mousedown", this, true);
                this._element.addEventListener("mousedown", this, false);
                this._element.addEventListener("mousewheel", this, false);
            }

            this.eventManager.isStoringPointerEvents = true;
        }
    }
});
