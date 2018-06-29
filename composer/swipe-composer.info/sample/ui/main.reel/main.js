var Component = require("montage/ui/component").Component,
    SwipeComposer = require("montage/composer/swipe-composer").SwipeComposer;

exports.Main = Component.specialize({

    _x1: {
        value: 0
    },

    _y1: {
        value: 0
    },

    _x2: {
        value: 0
    },

    _y2: {
        value: 0
    },

    __swipeComposer: {
        value: null
    },

    _swipeComposer: {
        get: function () {
            if (!this.__swipeComposer) {
                this.__swipeComposer = new SwipeComposer();
                this.addComposerForElement(this.__swipeComposer, this._hitBox);
            }

            return this.__swipeComposer;
        }
    },

    _translateComposer: {
        get: function () {
            return this._swipeComposer._translateComposer;
        }
    },

    enterDocument: {
        value: function (firstTime) {
            if (firstTime) {
                this._translateComposer.addEventListener("translateStart", this);
                this._swipeComposer.addEventListener("swipe", this);
            }
        }
    },

    handleTranslateStart: {
        value: function () {
            this._x1 = (
                this._translateComposer.pointerStartEventPosition.pageX -
                this._hitBoxRect.left
            );

            this._y1 = (
                this._translateComposer.pointerStartEventPosition.pageY -
                this._hitBoxRect.top
            );

            this._translateComposer.addEventListener("translate", this);
            this._translateComposer.addEventListener("translateEnd", this);
            this._translateComposer.addEventListener("translateCancel", this);
        }
    },

    handleTranslate: {
        value: function (event) {
            this._x2 = this._x1 + event.translateX;
            this._y2 = this._y1 + event.translateY;
            this.needsDraw = true;
        }
    },

    handleTranslateEnd: {
        value: function () {
            this._reset();
        }
    },

    handleTranslateCancel: {
        value: function () {
            this._reset();
        }
    },

    handleSwipe: {
        value: function (event) {
            this.swipeDirection = event.direction;
            this.swipeVelocity = event.velocity.toFixed(2);
            this.swipeAngle = event.angle.toFixed(2);
            this.swipeDistance = event.distance.toFixed(2);
        }
    },

    _reset: {
        value: function () {
            this._translateComposer.removeEventListener("translate", this);
            this._translateComposer.removeEventListener("translateEnd", this);
            this._translateComposer.removeEventListener("translateCancel", this);

            this._x1 = 0;
            this._x2 = 0;
            this._y1 = 0;
            this._y2 = 0;

            this.needsDraw = true;
        }
    },

    willDraw: {
        value: function () {
            if (!this._hitBoxRect && this._hitBox) {
                this._hitBoxRect = this._hitBox.getBoundingClientRect();
            }
        }
    },

    draw: {
        value: function () {
            if (this._hitBoxRect && this._hitBox) {
                this._line.setAttribute("x1", this._x1);
                this._line.setAttribute("y1", this._y1);
                this._line.setAttribute("x2", this._x2);
                this._line.setAttribute("y2", this._y2);
            }
        }
    }

});
