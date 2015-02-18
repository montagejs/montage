/**
 * @module montage/composer/swipe-composer
 * @requires montage
 * @requires montage/composer/composer
 */
var Montage = require("../core/core").Montage,
    Composer = require("./composer").Composer;

/**
 * @class SwipeComposer
 * @classdesc `Composer` for detecting swipe gestures.
 * @extends Composer
 */
exports.SwipeComposer = Composer.specialize( /** @lends SwipeComposer# */ {

    load: {
        value: function () {
            document.addEventListener("touchstart", this, true);
        }
    },

    unload: {
        value: function () {
            document.removeEventListener("touchstart", this, true);
        }
    },

    _startX: {
        enumerable: false,
        value: 0
    },

    _startY: {
        enumerable: false,
        value: 0
    },

    _deltaX: {
        enumerable: false,
        value: 0
    },

    _deltaY: {
        enumerable: false,
        value: 0
    },

    /**
     * The number of pixels a gesture must continue to be recognized as a
     * swipe.
     * @type {number}
     */
    _threshold: {
        enumerable: false,
        value: 50
    },

    /**
     * The maximum angle (in degrees) away from horizontal or vertical
     * for a gesture to be recognized as a swipe.
     * @type {number}
     */
    _thresholdSwipeAngle: {
        enumerable: false,
        value: 20
    },

    _startTimestamp: {
        enumerable: false,
        value: 0
    },

    captureTouchstart: {
        value: function (event) {
            this._reset();
            var touches = event.touches,
                touch = touches[0];
            this._startX = touch.clientX;
            this._startY = touch.clientY;
            this._startTimestamp = event.timeStamp;
            document.addEventListener("touchmove", this, true);
            document.addEventListener("touchend", this, true);
            document.addEventListener("touchcancel", this, true);
        }
    },

    _reset: {
        enumerable: false,
        value: function () {
            this._startX = 0;
            this._startY = 0;
            this._deltaX = 0;
            this._deltaY = 0;
            this._startSwipeAngle = null;
        }
    },

    _startSwipeAngle: {
        enumerable: false,
        value: null
    },

    captureTouchcancel: {
        value: function (event) {
            document.removeEventListener("touchmove", this, true);
            document.removeEventListener("touchend", this, true);
            document.removeEventListener("touchcancel", this, true);
        }
    },

    captureTouchmove: {
        value: function (event) {
            event.preventDefault();
            var touches = event.changedTouches[0], swipeEvent, direction;

            this._deltaX = touches.clientX - this._startX;
            this._deltaY = touches.clientY - this._startY;

            var dX = this._deltaX,
                dY = this._deltaY,
                threshold = this._threshold,
                swipeAngle = this._findSwipeAngle(dX, dY);

            if (this._startSwipeAngle != null && Math.abs(this._startSwipeAngle - swipeAngle) > this._thresholdSwipeAngle) {
                //Direction changed; Abort touch
                //this.captureTouchcancel();
                this._startSwipeAngle = null;
            }

            if (this._startSwipeAngle == null) {
                this._startSwipeAngle = swipeAngle;
                this._startX = touches.clientX;
                this._startY = touches.clientY;
                this._deltaX = 0;
                this._deltaY = 0;
            }

            if (dX > threshold && dY > threshold) {
                direction = "DIAGONAL";
            } else if (dX > threshold && dY < threshold) {
                if (this._deltaX > 0) {
                    direction = "RIGHT";
                } else {
                    direction = "LEFT";
                }
            } else if (dX < threshold && dY > threshold) {
                if (this._deltaY > 0) {
                    direction = "DOWN";
                } else {
                    direction = "UP";
                }
            }

            if (dX != 0 || dY != 0) {
                swipeEvent = document.createEvent("CustomEvent");
                swipeEvent.initCustomEvent("swipemove", true, false, null);
                swipeEvent.direction = direction;
                swipeEvent.angle = this._startSwipeAngle;
                swipeEvent.velocity = this._findVelocity((event.timeStamp - this._startTimestamp));
                swipeEvent.startX = this._startX;
                swipeEvent.startY = this._startY;
                swipeEvent.dX = this._deltaX;
                swipeEvent.dY = this._deltaY;

                this.dispatchEvent(swipeEvent);
            }
        }
    },

    _findSwipeAngle: {
        enumerable: false,
        value: function (dX, dY) {
            var swipeAngle = -1 * (Math.atan2(dY, dX) * 180 / 3.14);
            return swipeAngle.toFixed(2);
        }
    },

    captureTouchend: {
        value: function (event) {

            if (event == null) {
                return;
            }

            var deltaX = Math.abs(this._deltaX),
                deltaY = Math.abs(this._deltaY),
                threshold = this._threshold,
                direction,
                swipeEvent;

            if (deltaX < threshold && deltaY < threshold) {
                this.captureTouchcancel();
                return;
            }

            document.removeEventListener("touchmove", this, true);

            if (deltaX > threshold && deltaY > threshold) {
                direction = "DIAGONAL";
            } else if (deltaX > threshold && deltaY < threshold) {
                if (this._deltaX > 0) {
                    direction = "RIGHT";
                } else {
                    direction = "LEFT";
                }
            } else if (deltaX < threshold && deltaY > threshold) {
                if (this._deltaY > 0) {
                    direction = "DOWN";
                } else {
                    direction = "UP";
                }
            }

            swipeEvent = document.createEvent("CustomEvent");
            swipeEvent.initCustomEvent("swipe", true, false, null);
            swipeEvent.direction = direction;
            swipeEvent.angle = this._startSwipeAngle;
            swipeEvent.velocity = this._findVelocity((event.timeStamp - this._startTimestamp));
            swipeEvent.startX = this._startX;
            swipeEvent.startY = this._startY;
            swipeEvent.dX = this._deltaX;
            swipeEvent.dY = this._deltaY;

            this.dispatchEvent(swipeEvent);
        }
    },

    _findVelocity: {
        enumerable: false,
        value: function (deltaTime) {
            return (Math.sqrt(/*xSquare*/(this._deltaX * this._deltaX) + /*ySquare*/(this._deltaY * this._deltaY)) / /*deltaTime*/(deltaTime));

        }
    }

});
