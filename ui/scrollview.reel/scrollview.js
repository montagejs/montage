/* <copyright>
Copyright (c) 2012, Motorola Mobility, Inc

All Rights Reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

  - Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
  - Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
  - Neither the name of Motorola Mobility nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
</copyright> */
/**
	@module "montage/ui/scrollview.reel"
    @requires montage/core/core
    @requires montage/ui/component
*/
var Montage = require("montage").Montage;
var Component = require("ui/component").Component;
/**
 @class module:"montage/ui/scrollview.reel".Scrollview
 @extends module:montage/ui/component.Component
 */
var Scrollview = exports.Scrollview = Montage.create(Component, /** @lends module:"montage/ui/scrollview.reel".Scrollview */ {

    hasTemplate: {
        enumerable: false,
        value: false
    },
/**
  Description TODO
  @private
*/
    _axis: {
        enumerable: false,
        value: "both"
    },
/**
        Description TODO
        @type {Function}
        @default {String} "both"
    */
    axis: {
        get: function () {
            return this._axis;
        },
        set: function (value) {
            switch (value) {
                case "vertical":
                case "horizontal":
                    this._axis = value;
                    break;
                default:
                    this._axis = "both";
                    break;
            }
            this.needsDraw = true;
        }
    },
/**
  Description TODO
  @private
*/
    _displayScrollbars: {
        enumerable: false,
        value: "auto"
    },
/**
        Description TODO
        @type {Function}
        @default {String} "auto"
    */
    displayScrollbars: {
        get: function () {
            return this._displayScrollbars;
        },
        set: function (value) {
            switch (value) {
                case "vertical":
                case "horizontal":
                case "both":
                case "auto":
                    this._displayScrollbars = value;
                    break;
                default:
                    this._displayScrollbars = "none";
                    break;
            }
            this.needsDraw = true;
        }
    },
/**
  Description TODO
  @private
*/
    _content: {
        enumerable: false,
        value: null
    },
/**
  Description TODO
  @private
*/
    _hasMomentum: {
        enumerable: false,
        value: true
    },
/**
        Description TODO
        @type {Function}
        @default {Boolean} true
    */
    hasMomentum: {
        get: function () {
            return this._hasMomentum;
        },
        set: function (value) {
            this._hasMomentum = value ? true : false;
        }
    },
/**
  Description TODO
  @private
*/
    _hasBouncing: {
        enumerable: false,
        value: true
    },
/**
        Description TODO
        @type {Function}
        @default {Boolean} true
        */
    hasBouncing: {
        get: function () {
            return this._hasBouncing;
        },
        set: function (value) {
            this._hasBouncing = value ? true : false;
        }
    },
/**
  Description TODO
  @private
*/
    _momentumDuration: {
        enumerable: false,
        value: 650
    },
/**
        Description TODO
        @type {Function}
        @default {Number} 650
    */
    momentumDuration: {
        get: function () {
            return this._momentumDuration;
        },
        set: function (value) {
            this._momentumDuration = isNaN(parseInt(value, 10)) ? 1 : parseInt(value, 10);
            if (this._momentumDuration < 1) {
                this._momentumDuration = 1;
            }
        }
    },
/**
  Description TODO
  @private
*/
    _bouncingDuration: {
        enumerable: false,
        value: 750
    },
/**
        Description TODO
        @type {Function}
        @default {Number} 750
    */
    bouncingDuration: {
        get: function () {
            return this._bouncingDuration;
        },
        set: function (value) {
            this._bouncingDuration = isNaN(parseInt(value, 10)) ? 1 : parseInt(value, 10);
            if (this._bouncingDuration < 1) {
                this._bouncingDuration = 1;
            }
        }
    },
/**
  Description TODO
  @private
*/
    _translateY: {
        enumerable: false,
        value: 0
    },
/**
  Description TODO
  @private
*/
    _nativeScrollTop: {
        enumerable: false,
        value: 0
    },
/**
  Description TODO
  @private
*/
    _nativeScrollTo: {
        enumerable: false,
        value: function (y) {
            this._nativeScrollTop = y;
            this._element.scrollTop = y;
        }
    },
/**
  Description TODO
  @private
*/
    _scrollX: {
        enumerable: false,
        value: 0
    },
/**
        Description TODO
        @type {Function}
        @default {Number} 0
    */
    scrollX: {
        get: function () {
            return this._scrollX;
        },
        set: function (value) {
            // TODO we repeat this parseInt pattern all over the place in this file
            //var tmp = isNaN(parseInt(value, 10)) ? 0 : parseInt(value, 10);
            // I'd suggest doing it this way to reduce the number of parseInts we do
            var tmp = parseInt(value, 10);
            tmp = isNaN(tmp) ? 0 : tmp;

            if (tmp < 0) {
                tmp = 0;
            }
            if (tmp > this._maxScrollX) {
                tmp = this._maxScrollX;
            }
            if (this._scrollX != tmp) {
                this._scrollX = tmp;
                window.clearInterval(this._animationInterval);
                this._updateScrollbars = false;
                this.needsDraw = true;
            }
        }
    },
/**
  Description TODO
  @private
*/
    _scrollY: {
        enumerable: false,
        value: 0
    },
/**
        Description TODO
        @type {Function}
        @default {Number} 0
    */
    scrollY: {
        get: function () {
            return this._scrollY;
        },
        set: function (value) {
            var tmp = isNaN(parseInt(value, 10)) ? 0 : parseInt(value, 10);

            if (tmp < 0) {
                tmp = 0;
            }
            if (tmp > this._maxScrollY) {
                tmp = this._maxScrollY;
            }
            if (this._scrollY != tmp) {
                this._scrollY = tmp;
                window.clearInterval(this._animationInterval);
                this._updateScrollbars = false;
                this.needsDraw = true;
            }
        }
    },
/**
  Description TODO
  @private
*/
    _addNativeScroll: {
        enumerable: false,
        value: true
    },
/**
  Description TODO
  @private
*/
    _removeNativeScroll: {
        enumerable: false,
        value: false
    },
/**
  Description TODO
  @private
*/
    _pointerX: {
        enumerable: false,
        value: null
    },
/**
  Description TODO
  @private
*/
    _pointerY: {
        enumerable: false,
        value: null
    },
/**
  Description TODO
  @private
*/
    _start: {
        enumerable: false,
        value: function (x, y) {

            this._pointerX = x;
            this._pointerY = y;

            if (window.Touch) {
                document.addEventListener("touchend", this, true);
                document.addEventListener("touchmove", this, true);
            } else {
                document.addEventListener("mouseup", this, true);
                document.addEventListener("mousemove", this, true);
            }

            window.clearInterval(this._animationInterval);

            // TODO the code here seems at odds with what's inside the conditional below
            // It looks like we're always going todraw and set _removeNativeScroll to true
            this._removeNativeScroll = true;
            this.needsDraw = true;

            this._nativeScrollTop = this._element.scrollTop;

            if ((this._nativeScrollTop) && (this._scrollX || this._translateY)) {
                this._removeNativeScroll = true;
                this.needsDraw = true;
            }
            this._scrollY = this._nativeScrollTop - this._translateY;
        }
    },
    // This is the pointer that the scrollview is considering claiming given some user interaction.
    // It may eventually claim it if nobody else does, and it may even try to steal it back if it thinks it should.
 /**
  Description TODO
  @private
*/
    _observedPointer: {
        enumerable: false,
        value: null
    },
/**
    Description TODO
    @function
    @param {Event} event TODO
    */
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

            this._start(event.clientX, event.clientY);
        }
    },

    // Handle the mousedown that bubbled back up from beneath this scrollview
    // If nobody else claimed this pointer, the scrollview should handle it now
 /**
    Description TODO
    @function
    @param {Event} event TODO
    */
    handleMousedown: {
        enumerable: false,
        value: function (event) {

            if (!this.eventManager.componentClaimingPointer(this._observedPointer, this)) {
                this.eventManager.claimPointer(this._observedPointer, this);
                this._start(event.clientX, event.clientY);
            }

        }
    },
/**
    Description TODO
    @function
    @param {Event} event TODO
    */
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
/**
    Description TODO
    @function
    @param {Event} event TODO
    */
    captureMouseup: {
        enumerable: false,
        value: function (event) {
            this._end(event);
        }
    },
/**
  Description TODO
  @private
*/
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
/**
    Description TODO
    @function
    @param {Event} event TODO
    */
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
                this._start(event.targetTouches[0].clientX, event.targetTouches[0].clientY);
            }
        }
    },
/**
    Description TODO
    @function
    @param {Event} event TODO
    */
    handleTouchstart: {
        value: function(event) {
            if (!this.eventManager.componentClaimingPointer(this._observedPointer)) {

                if (event.targetTouches.length === 1) {
                    event.preventDefault();

                    this.eventManager.claimPointer(this._observedPointer, this);
                    this._start(event.targetTouches[0].clientX, event.targetTouches[0].clientY);
                }
            }
        }
    },
/**
    Description TODO
    @function
    @param {Event} event TODO
    */
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
/**
    Description TODO
    @function
    @param {Event} event TODO
    */
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
/**
  Description TODO
  @private
*/
    _move: {
        enumerable: false,
        value: function (x, y) {
            var oldX = this._scrollX,
                oldY = this._scrollY;

            if (this._axis != "vertical") {
                if ((this._scrollX < 0) || (this._scrollX > this._maxScrollX)) {
                    this._scrollX += (this._pointerX - x) / 2;
                } else {
                    this._scrollX += this._pointerX - x;
                }
            }
            if (this._axis != "horizontal") {
                if ((this._scrollY < 0) || (this._scrollY > this._maxScrollY)) {
                    this._scrollY += (this._pointerY - y) / 2;
                } else {
                    this._scrollY += this._pointerY - y;
                }
            }
            this._pointerX = x;
            this._pointerY = y;
            if (!((this._scrollX === oldX) && (this._scrollY === oldY))) {
                this._updateScrollbars = true;
                this.needsDraw = true;
            }
        }
    },
/**
  Description TODO
  @private
*/
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
/**
  Description TODO
  @private
*/
    _stealPointer: {
        value: function() {
            this.eventManager.claimPointer(this._observedPointer, this);
        }
    },
/**
  Description TODO
  @private
*/
    _animationInterval: {
        enumerable: false,
        value: false
    },
/**
  Description TODO
  @private
*/
    _bezierTValue: {
        enumerable: false,
        value: function (x, p1x, p1y, p2x, p2y) {
            var a = 1 - 3 * p2x + 3 * p1x,
                b = 3 * p2x - 6 * p1x,
                c = 3 * p1x,
                t = 0.5,
                der,
                i, k, tmp;

            for (i = 0; i < 10; i++) {
                tmp = t * t;
                der = 3 * a * tmp + 2 * b * t + c;
                k = 1 - t;
                t -= ((3 * (k * k * t * p1x + k * tmp * p2x) + tmp * t - x) / der); // der==0
            }
            tmp = t * t;
            k = 1 - t;
            return 3 * (k * k * t * p1y + k * tmp * p2y) + tmp * t;
        }
    },
/**
  Description TODO
  @private
*/
    _bounce: {
        enumerable: false,
        value: function () {
            if (this._hasBouncing) {
                var startTime = new Date().getTime(),
                    momentum, startX = this._scrollX, startY = this._scrollY,
                    self = this;

                if (startX < 0) {
                    this._animationInterval = window.setInterval(function () {
                        var time = new Date().getTime() - startTime;
                        if (time < self._bouncingDuration) {
                            var tmp = time / self._bouncingDuration;

                            tmp = self._bezierTValue(tmp, 0.17, 0.93, 0.19, 1);
                            self._scrollX = startX * (1 - tmp);
                        } else {
                            self._scrollX = 0;
                            window.clearInterval(self._animationInterval);
                        }
                    }, 16);
                }
            }
        }
    },
/**
  Description TODO
  @private
*/
    _end: {
        enumerable: false,
        value: function (event) {

            var animateBouncingX = false,
                animateBouncingY = false,
                animateMomentum = false,
                momentumX,
                momentumY,
                startX = this._scrollX,
                startY,
                posX = startX,
                posY,
                endX = startX,
                endY,
                self = this,
                startTimeBounceX = false,
                startTimeBounceY = false,
                startTime = new Date().getTime();

            this._nativeScrollTop = this._element.scrollTop;
            this._scrollY = this._nativeScrollTop - this._translateY;
            startY = this._scrollY;
            posY = startY;
            endY = startY;
            if ((this._hasMomentum) && (event.velocity.speed > 40)) {
                if (this._axis != "vertical") {
                    momentumX = event.velocity.x;
                } else {
                    momentumX = 0;
                }
                if (this._axis != "horizontal") {
                    momentumY = event.velocity.y;
                } else {
                    momentumY = 0;
                }
                endX = startX - (momentumX * this._momentumDuration / 2000);
                endY = startY - (momentumY * this._momentumDuration / 2000);
                animateMomentum = true;
            }

            this._animationInterval = window.setInterval(function () {
                var time = new Date().getTime(), t;

                if (animateMomentum) {
                    t = time - startTime;
                    if (t < self._momentumDuration) {
                        posX = startX - ((momentumX + momentumX * (self._momentumDuration - t) / self._momentumDuration) * t / 1000) / 2;
                        posY = startY - ((momentumY + momentumY * (self._momentumDuration - t) / self._momentumDuration) * t / 1000) / 2;
                    } else {
                        animateMomentum = false;
                    }
                }

                self._scrollX = posX;
                self._scrollY = posY;

                if (self._hasBouncing) {
                    if (endX < 0) {
                        if (self._scrollX < 0) {
                            if (!startTimeBounceX) {
                                animateBouncingX = true;
                                startTimeBounceX = time;
                            }
                            t = time - startTimeBounceX;
                            if ((t < self._bouncingDuration) || (animateMomentum)) {
                                if (t > self._bouncingDuration) {
                                    t = self._bouncingDuration;
                                }
                                self._scrollX = self._scrollX * (1 - self._bezierTValue(t / self._bouncingDuration, 0.17, 0.93, 0.19, 1));
                            } else {
                                self._scrollX = 0;
                                animateBouncingX = false;
                            }
                        } else {
                            animateBouncingX = false;
                        }
                    }

                    if (endY < 0) {
                        if (self._scrollY < 0) {
                            if (!startTimeBounceY) {
                                animateBouncingY = true;
                                startTimeBounceY = time;
                            }
                            t = time - startTimeBounceY;
                            if ((t < self._bouncingDuration) || (animateMomentum)) {
                                if (t > self._bouncingDuration) {
                                    t = self._bouncingDuration;
                                }
                                self._scrollY = self._scrollY * (1 - self._bezierTValue(t / self._bouncingDuration, 0.17, 0.93, 0.19, 1));
                            } else {
                                self._scrollY = 0;
                                animateBouncingY = false;
                            }
                        } else {
                            animateBouncingY = false;
                        }
                    }

                    if (endX > self._maxScrollX) {
                        if (self._scrollX > self._maxScrollX) {
                            if (!startTimeBounceX) {
                                animateBouncingX = true;
                                startTimeBounceX = time;
                            }
                            t = time - startTimeBounceX;
                            if ((t < self._bouncingDuration) || (animateMomentum)) {
                                if (t > self._bouncingDuration) {
                                    t = self._bouncingDuration;
                                }
                                self._scrollX = self._maxScrollX + (self._scrollX - self._maxScrollX) * (1 - self._bezierTValue(t / self._bouncingDuration, 0.17, 0.93, 0.19, 1));
                            } else {
                                self._scrollX = self._maxScrollX;
                                animateBouncingX = false;
                            }
                        } else {
                            animateBouncingX = false;
                        }
                    }

                    if (endY > self._maxScrollY) {
                        if (self._scrollY > self._maxScrollY) {
                            if (!startTimeBounceY) {
                                animateBouncingY = true;
                                startTimeBounceY = time;
                            }
                            t = time - startTimeBounceY;
                            if ((t < self._bouncingDuration) || (animateMomentum)) {
                                if (t > self._bouncingDuration) {
                                    t = self._bouncingDuration;
                                }
                                self._scrollY = self._maxScrollY + (self._scrollY - self._maxScrollY) * (1 - self._bezierTValue(t / self._bouncingDuration, 0.17, 0.93, 0.19, 1));
                            } else {
                                self._scrollY = self._maxScrollY;
                                animateBouncingY = false;
                            }
                        } else {
                            animateBouncingY = false;
                        }
                    }
                }

                if (!(animateMomentum || animateBouncingX || animateBouncingY)) {
                    window.clearInterval(self._animationInterval);
                    self._updateScrollbars = false;
                    self._addNativeScroll = true;
                }
                self.needsDraw = true;
            }, 16);

            this._releaseInterest();
        }
    },
/**
  Description TODO
  @private
*/
    _hideScrollbarsTimeout: {
        enumerable: false,
        value: null
    },
/**
    Description TODO
    @function
    @param {Event} event TODO
    */
    handleMousewheel: {
        enumerable: false,
        value: function (event) {
            this.scrollY = this._scrollY - (event.wheelDeltaY * 20) / 120;
            if (this._displayScrollbars !== "none") {
                var self = this;

                this._updateScrollbars = true;
                window.clearTimeout(this._hideScrollbarsTimeout);
                this._hideScrollbarsTimeout = window.setTimeout(function () {
                    self._updateScrollbars = false;
                    self.needsDraw = true;
                }, 400);
            }
            event.preventDefault();
        }
    },
/**
  Description TODO
  @private
*/
    _maxScrollX: {
        enumerable: false,
        value: null
    },
/**
  Description TODO
  @private
*/
    _maxScrollY: {
        enumerable: false,
        value: null
    },
/**
  Description TODO
  @private
*/
    _width: {
        enumerable: false,
        value: null
    },
/**
  Description TODO
  @private
*/
    _height: {
        enumerable: false,
        value: null
    },
/**
  Description TODO
  @private
*/
    _left: {
        enumerable: false,
        value: null
    },
/**
  Description TODO
  @private
*/
    _top: {
        enumerable: false,
        value: null
    },
/**
  Description TODO
  @private
*/
    _verticalScrollbar: {
        enumerable: false,
        value: null
    },
/**
  Description TODO
  @private
*/
    _horizontalScrollbar: {
        enumerable: false,
        value: null
    },
/**
  Description TODO
  @private
*/
    _updateScrollbar: {
        enumerable: false,
        value: false
    },
/**
  Description TODO
  @private
*/
    _createDefaultHorizontalScrollbar: {
        enumerable: false,
        value: function () {
            if (!this._horizontalScrollbar) {
                var style, padding, white, black;
                this._horizontalScrollbar = document.createElement("div");
                padding = this._horizontalScrollbar.appendChild(document.createElement("div"));
                white = padding.appendChild(document.createElement("div"));
                black = white.appendChild(document.createElement("div"));
                this._horizontalScrollbar.style.width = "9px";
                this._horizontalScrollbar.style.height = "9px";
                this._horizontalScrollbar.style.position = "absolute";
                this._horizontalScrollbar.style.opacity = "0";
                this._horizontalScrollbar.style.zIndex = "1";
                padding.style.padding = "1px";
                white.style.padding = "1px";
                white.style.height = "5px";
                white.style.backgroundColor = "rgba(255, 255, 255, .29)";
                white.style.borderRadius = "4px";
                black.style.height = "5px";
                black.style.backgroundColor = "black";
                black.style.borderRadius = "3px";
                this._element.parentNode.insertBefore(this._horizontalScrollbar, this._element);
            }
        }
    },
/**
  Description TODO
  @private
*/
    _createDefaultVerticalScrollbar: {
        enumerable: false,
        value: function () {
            if (!this._verticalScrollbar) {
                var style, padding, white, black;
                this._verticalScrollbar = document.createElement("div");
                padding = this._verticalScrollbar.appendChild(document.createElement("div"));
                white = padding.appendChild(document.createElement("div"));
                black = white.appendChild(document.createElement("div"));
                this._verticalScrollbar.style.width = "9px";
                this._verticalScrollbar.style.height = "9px";
                this._verticalScrollbar.style.position = "absolute";
                this._verticalScrollbar.style.opacity = "0";
                this._verticalScrollbar.style.zIndex = "1";
                padding.style.padding = "1px";
                white.style.padding = "1px";
                white.style.width = "5px";
                white.style.backgroundColor = "rgba(255, 255, 255, .29)";
                white.style.borderRadius = "4px";
                black.style.width = "5px";
                black.style.backgroundColor = "black";
                black.style.borderRadius = "3px";
                this._element.parentNode.insertBefore(this._verticalScrollbar, this._element);
            }
        }
    },
/**
    Description TODO
    @function
    */
    prepareForDraw: {
        enumerable: false,
        value: function() {
            this._content = this._element.getElementsByTagName("*")[0];
            this._element.style.display = "block";
            this._element.style.overflow = "hidden";
            if (!window.Touch) {
                this._element.addEventListener("mousewheel", this, false);
            }
            this.needsDraw = true;
        }
    },
/**
        Description TODO
        @type {Property}
        @default {Boolean} false
    */
    done: {
        value: false
    },
/**
    Description TODO
    @function
    */
    willDraw: {
        enumerable: false,
        value: function () {
                this._left = this._element.offsetLeft;
                this._top = this._element.offsetTop;
                this._width = this._element.offsetWidth;
                this._height = this._element.offsetHeight;
                this._maxScrollX = this._content.scrollWidth - this._width;
                if (this._maxScrollX < 0) {
                    this._maxScrollX = 0;
                }
                this._maxScrollY = this._content.offsetHeight - this._height;
                if (this._maxScrollY < 0) {
                    this._maxScrollY = 0;
                }
                var delegateValue = this.callDelegateMethod("didSetMaxScroll", {x: this._maxScrollX, y: this._maxScrollY});
                if (delegateValue) {
                    this._maxScrollX = delegateValue.x;
                    this._maxScrollY = delegateValue.y;
                }
                if (!this._hasBouncing) {
                    if (this._scrollX < 0) {
                        this._scrollX = 0;
                    }
                    if (this._scrollY < 0) {
                        this._scrollY = 0;
                    }
                    if (this._scrollX > this._maxScrollX) {
                        this._scrollX = this._maxScrollX;
                    }
                    if (this._scrollY > this._maxScrollY) {
                        this._scrollY = this._maxScrollY;
                    }
                }
                if (this._axis === "vertical") {
                    this._scrollX = 0;
                } else if (this._axis === "horizontal") {
                    this._scrollY = 0;
                }
//                this.done = true;

        }
    },
/**
    Description TODO
    @function
    */
    draw: {
        enumerable: false,
        value: function () {
            var size, pos, l,
                drawVerticalScrollbar = false, drawHorizontalScrollbar = false;
            if (this._updateScrollbars) {
                switch (this._displayScrollbars) {
                    case "horizontal":
                        drawHorizontalScrollbar = true;
                        break;
                    case "vertical":
                        drawVerticalScrollbar = true;
                        break;
                    case "both":
                        drawVerticalScrollbar = true;
                        drawHorizontalScrollbar = true;
                        break;
                    case "auto":
                        if (this._maxScrollX) {
                            drawHorizontalScrollbar = true;
                        }
                        if (this._maxScrollY) {
                            drawVerticalScrollbar = true;
                        }
                        break;
                }
                if (drawHorizontalScrollbar) {
                    l = this._width - (drawVerticalScrollbar ? 6 : 0);
                    size = parseInt((l * l) / (l + this._maxScrollX), 10);
                    pos = parseInt(((l - size) * this._scrollX) / this._maxScrollX, 10);

                    if (pos < 0) {
                        size += pos;
                        if (size < 9) {
                            size = 9;
                        }
                        pos = 0;
                    }
                    if (pos > (l - size)) {
                        size += (l - size) - pos;
                        if (size < 9) {
                            size = 9;
                        }
                        pos = l - size;
                    }

                    this._createDefaultHorizontalScrollbar();
                    this._horizontalScrollbar.style.width = size + "px";
                    this._horizontalScrollbar.firstChild.style.width = (size - 2) + "px";
                    this._horizontalScrollbar.firstChild.firstChild.style.width = (size - 4) + "px";
                    this._horizontalScrollbar.firstChild.firstChild.firstChild.style.width = (size - 4) + "px";
                    this._horizontalScrollbar.style.left = this._left + "px";
                    this._horizontalScrollbar.style.top = this._top + "px";
                    this._horizontalScrollbar.style.marginLeft = pos + "px";
                    this._horizontalScrollbar.style.marginTop = (this._height - 9) + "px";
                    this._horizontalScrollbar.style.webkitTransition = "none";
                    this._horizontalScrollbar.style.opacity = ".5";
                }
                if (drawVerticalScrollbar) {
                    l = this._height - (drawHorizontalScrollbar ? 6 : 0);
                    size = parseInt((l * l) / (l + this._maxScrollY), 10);
                    pos = parseInt(((l - size) * this._scrollY) / this._maxScrollY, 10);

                    if (pos < 0) {
                        size += pos;
                        if (size < 9) {
                            size = 9;
                        }
                        pos = 0;
                    }
                    if (pos > (l - size)) {
                        size += (l - size) - pos;
                        if (size < 9) {
                            size = 9;
                        }
                        pos = l - size;
                    }

                    this._createDefaultVerticalScrollbar();
                    this._verticalScrollbar.style.height = size + "px";
                    this._verticalScrollbar.firstChild.style.height = (size - 2) + "px";
                    this._verticalScrollbar.firstChild.firstChild.style.height = (size - 4) + "px";
                    this._verticalScrollbar.firstChild.firstChild.firstChild.style.height = (size - 4) + "px";
                    this._verticalScrollbar.style.left = this._left + "px";
                    this._verticalScrollbar.style.top = this._top + "px";
                    this._verticalScrollbar.style.marginTop = pos + "px";
                    this._verticalScrollbar.style.marginLeft = (this._width - 9) + "px";
                    this._verticalScrollbar.style.webkitTransition = "none";
                    this._verticalScrollbar.style.opacity = ".5";
                }
            } else {
                if (this._horizontalScrollbar) {
                    this._horizontalScrollbar.style.webkitTransition = "300ms opacity";
                    this._horizontalScrollbar.style.opacity = "0";
                }
                if (this._verticalScrollbar) {
                    this._verticalScrollbar.style.webkitTransition = "300ms opacity";
                    this._verticalScrollbar.style.opacity = "0";
                }
            }
            if (this._addNativeScroll) {
//                document.body.style.display = "block";
                // The following code needs to be in willDraw because it is not possible
                // to set scrollTop/Left in the draw/display:none stage
                this._nativeScrollTo(this._scrollY);
                this._addNativeScroll = false;
//                document.body.style.display = "none";
            }
            if (this._removeNativeScroll) {
//                document.body.style.display = "block";
                this._nativeScrollTo(0);
                this._removeNativeScroll = false;
//                document.body.style.display = "none";
            }
            this._translateY = (this._nativeScrollTop - this._scrollY) | 0;
            var x = (-this._scrollX | 0),
                y = -this._translateY,
                scrollDelegateValue = this.callDelegateMethod("willScroll", {x: x, y: y});
            if (scrollDelegateValue) {
                x = scrollDelegateValue.x;
                y = scrollDelegateValue.y;
            }
            this._content.style.webkitTransform = "translate3d(" + x + "px, " + -y + "px, 0)";
        }
    },
/**
    Description TODO
    @function
    */
    prepareForActivationEvents: {
        value: function() {

            if (window.Touch) {
                this.element.addEventListener("touchstart", this, true);
                this.element.addEventListener("touchstart", this, false);
            } else {
                this.element.addEventListener("mousedown", this, true);
                this._element.addEventListener("mousedown", this, false);
            }

            this.eventManager.isStoringPointerEvents = true;
        }
    }
});
