/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
/**
	@module montage/ui/composer/long-press-composer
    @requires montage
    @requires montage/ui/composer/composer
*/
var Montage = require("montage").Montage,
    Composer = require("ui/composer/composer").Composer,
    defaultEventManager = require("core/event/event-manager").defaultEventManager;
/**
    @class module:montage/ui/composer/translate-composer.TranslateComposer
    @extends module:montage/ui/composer/composer.Composer
*/
exports.TranslateComposer = Montage.create(Composer,/** @lends module:montage/ui/event/composer/translate-composer.TranslateComposer# */ {

    _externalUpdate: {
        enumerable: false,
        value: true
    },

    isAnimating: {
        enumerable: false,
        value: false
    },

    frame: {
        value: function(timestamp) {
            if (this.isAnimating) {
                this._animationInterval();
            }
            this._externalUpdate = false;
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

    _translateX: {
        enumerable: false,
        value: 0
    },

    translateX: {
        get: function () {
            return this._translateX;
        },
        set: function (value) {
            if (this._axis==="vertical") {
                this._translateX=0;
            } else {
                var tmp=isNaN(value)?0:value>>0;

                if ((!this._hasBouncing)||(!this._isSelfUpdate)) {
                    if (tmp<0) {
                        tmp=0;
                    }
                    if (tmp>this._maxTranslateX) {
                        tmp=this._maxTranslateX;
                    }
                    if (!this._isSelfUpdate) {
                        this.isAnimating = false;
                    }
                }
                this._translateX=tmp;
            }
        }
    },

    _translateY: {
        enumerable: false,
        value: 0
    },

    translateY: {
        get: function () {
            return this._translateY;
        },
        set: function (value) {
            if (this._axis==="horizontal") {
                this._translateY=0;
            } else {
                var tmp=isNaN(value)?0:value>>0;

                if ((!this._hasBouncing)||(!this._isSelfUpdate)) {
                    if (tmp<0) {
                        tmp=0;
                    }
                    if (tmp>this._maxTranslateY) {
                        tmp=this._maxTranslateY;
                    }
                    if (!this._isSelfUpdate) {
                        this.isAnimating = false;
                    }
                }
                this._translateY=tmp;
            }
        }
    },

    _maxTranslateX: {
        enumerable: false,
        value: 0
    },

    maxTranslateX: {
        get: function () {
            return this._maxTranslateX;
        },
        set: function (value) {
            var tmp=isNaN(value)?0:value>>0;

            if (tmp<0) {
                tmp=0;
            }
            if (this._maxTranslateX!=tmp) {
                if (this._translateX>this._maxTranslateX) {
                    this.translateX=this._maxTranslateX;
                }
                this._maxTranslateX=tmp;
            }
        }
    },

    _maxTranslateY: {
        enumerable: false,
        value: 0
    },

    maxTranslateY: {
        get: function () {
            return this._maxTranslateY;
        },
        set: function (value) {
            var tmp=isNaN(value)?0:value>>0;

            if (tmp<0) {
                tmp=0;
            }
            if (this._maxTranslateY!=tmp) {
                if (this._translateY>this._maxTranslateY) {
                    this.translateY=this._maxTranslateY;
                }
                this._maxTranslateY=tmp;
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

    _releaseInterest: { // unload??
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

            var i = 0, len = event.changedTouches.length;
            while (i < len && event.changedTouches[i].identifier !== this._observedPointer) {
                i++;
            }

            if (i < len) {
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
            var i = 0, len = event.changedTouches.length;
            while (i < len && !this.eventManager.isPointerClaimedByComponent(event.changedTouches[i].identifier, this)) {
                i++;
            }
            if (i < len) {
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

    _translateEndTimeout: {
        enumerable: false,
        value: null
    },

    handleMousewheel: {
        enumerable: false,
        value: function (event) {
            var self = this;

            this.translateY = this._translateY - (event.wheelDeltaY * 20) / 120;
            this._dispatchTranslateStart();
            window.clearTimeout(this._translateEndTimeout);
            this._translateEndTimeout = window.setTimeout(function () {
                self._dispatchTranslateEnd();
            }, 400);
            event.preventDefault();
        }
    },

    _move: {
        enumerable: false,
        value: function (x, y) {

            this._isSelfUpdate=true;
            if (this._axis!="vertical") {
                if ((this._translateX<0)||(this._translateX>this._maxTranslateX)) {
                    this.translateX+=((this._pointerX-x)/2)*this._pointerSpeedMultiplier;
                } else {
                    this.translateX+=(this._pointerX-x)*this._pointerSpeedMultiplier;
                }
            }
            if (this._axis!="horizontal") {
                if ((this._translateY<0)||(this._translateY>this._maxTranslateY)) {
                    this.translateY+=((this._pointerY-y)/2)*this._pointerSpeedMultiplier;
                } else {
                    this.translateY+=(this._pointerY-y)*this._pointerSpeedMultiplier;
                }
            }
            this._isSelfUpdate=false;
            this._pointerX=x;
            this._pointerY=y;
            if (this._isFirstMove) {
                this._dispatchTranslateStart();
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

    _dispatchTranslateStart: {
        enumerable: false,
        value: function () {
            var translateStartEvent = document.createEvent("CustomEvent");

            translateStartEvent.initCustomEvent("translateStart", true, true, null);
            translateStartEvent.type = "translateStart";
            this.dispatchEvent(translateStartEvent);
        }
    },

    _dispatchTranslateEnd: {
        enumerable: false,
        value: function () {
            var translateEndEvent = document.createEvent("CustomEvent");

            translateEndEvent.initCustomEvent("translateEnd", true, true, null);
            translateEndEvent.type = "translateEnd";
            this.dispatchEvent(translateEndEvent);
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
                startX=this._translateX,
                startY,
                posX=startX,
                posY,
                endX=startX,
                endY,
                self=this,
                startTimeBounceX=false,
                startTimeBounceY=false,
                startTime=Date.now();

            startY=this._translateY;
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

                    if (endX>self._maxTranslateX) {
                        if (tmpX>self._maxTranslateX) {
                            if (!startTimeBounceX) {
                                animateBouncingX=true;
                                startTimeBounceX=time;
                            }
                            t=time-startTimeBounceX;
                            if ((t<self._bouncingDuration)||(animateMomentum)) {
                                if (t>self._bouncingDuration) {
                                    t=self._bouncingDuration;
                                }
                                tmpX=self._maxTranslateX+(tmpX-self._maxTranslateX)*(1-self._bezierTValue(t/self._bouncingDuration, .17, .93, .19, 1));
                            } else {
                                tmpX=self._maxTranslateX;
                                animateBouncingX=false;
                            }
                        } else {
                            animateBouncingX=false;
                        }
                    }

                    if (endY>self._maxTranslateY) {
                        if (tmpY>self._maxTranslateY) {
                            if (!startTimeBounceY) {
                                animateBouncingY=true;
                                startTimeBounceY=time;
                            }
                            t=time-startTimeBounceY;
                            if ((t<self._bouncingDuration)||(animateMomentum)) {
                                if (t>self._bouncingDuration) {
                                    t=self._bouncingDuration;
                                }
                                tmpY=self._maxTranslateY+(tmpY-self._maxTranslateY)*(1-self._bezierTValue(t/self._bouncingDuration, .17, .93, .19, 1));
                            } else {
                                tmpY=self._maxTranslateY;
                                animateBouncingY=false;
                            }
                        } else {
                            animateBouncingY=false;
                        }
                    }
                }
                self._isSelfUpdate=true;
                self.translateX=tmpX;
                self.translateY=tmpY;
                self._isSelfUpdate=false;
                self.isAnimating = animateMomentum||animateBouncingX||animateBouncingY;
                if (self.isAnimating) {
                    self.needsFrame=true;
                } else {
                    this._dispatchTranslateEnd();
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

    load: {
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
