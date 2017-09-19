/**
 * @module ./rotation-composer.reel
 * @requires montage/composer/composer
 */
var Composer = require("./composer").Composer,
    TranslateComposer = require("./translate-composer").TranslateComposer;

/**
 * @class RotationComposer
 * @extends Composer
 */
exports.RotationComposer = Composer.specialize(/** @lends RotationComposer# */ {

    /**
        Dispatched when a rotation is started

        @event rotationStart
        @memberof RotationComposer
        @param {RotationEvent} event
    */

    /**
        Dispatched when a rotation changes

        @event rotation
        @memberof RotationComposer
        @param {RotationEvent} event
    */


    /**
        Unit for dispatched angles. Options: radians and degrees
        Radians are the default as it is the standard in angular measures
        To think about: should it accept "deg" as degrees to be equivalent to CSS notation?
    */
    _unit: {
        value: "radians"
    },

    unit: {
        get: function () {
            return this._unit;
        },
        set: function (value) {
            if (value === "degrees") {
                this._unit = "degrees";
            } else {
                this._unit = "radians";
            }
        }
    },

    constructor: {
        value: function RotationComposer() {
            this.super();
            this._translateComposer = new TranslateComposer();
            this._translateComposer.hasMomentum = false;
            this._translateComposer.hasBouncing = false;
        }
    },

    // Load/unload

    load: {
        value: function() {
            this.component.addComposerForElement(this._translateComposer, this.element);
            this._translateComposer.load();
            this._translateComposer.addEventListener("translateStart", this, false);
            this._translateComposer.addEventListener("translateEnd", this, false);
            this._translateComposer.addEventListener("translate", this, false);
        }
    },

    unload: {
        value: function() {
        }
    },

    handleTranslateStart: {
        value: function() {
            var start = this._translateComposer.pointerStartEventPosition,
                deltaX = start.pageX - this.center.pageX,
                deltaY = start.pageY - this.center.pageY;

            this._translateComposer.translateX = start.pageX;
            this._translateComposer.translateY = start.pageY;
            this._previousAngle = Math.atan2(deltaY, deltaX);
            this._deltaAngle = 0;
            this._dispatchRotateStart();
        }
    },

    handleTranslateEnd: {
        value: function() {
            this._dispatchRotateEnd();
        }
    },

    handleTranslate: {
        value: function(event) {
            var deltaX = event.translateX - this.center.pageX,
                deltaY = event.translateY - this.center.pageY,
                currentAngle = Math.atan2(deltaY, deltaX),
                deltaAngle = currentAngle - this._previousAngle;

            if (deltaAngle > Math.PI) {
                deltaAngle -= Math.PI * 2;
            } else {
                if (deltaAngle < -Math.PI) {
                    deltaAngle += Math.PI * 2;
                }
            }
            this.angleInRadians += deltaAngle;
            this._deltaAngle = deltaAngle;
            this._previousAngle = currentAngle;
            this._dispatchRotate();
        }
    },

    angleInRadians: {
        value: 0
    },

    _deltaAngle: {
        value: 0
    },

    _dispatchRotateStart: {
        value: function() {
            var event = document.createEvent("CustomEvent");

            event.initCustomEvent("rotateStart", true, true, null);
            event.unit = this._unit;
            if (this._unit === "radians") {
                event.rotation = this.angleInRadians;
                event.deltaRotation = this._deltaAngle;
            } else {
                event.rotation = (this.angleInRadians * 180) / Math.PI;
                event.deltaRotation = (this._deltaAngle * 180) / Math.PI;
            }
            this.dispatchEvent(event);
        }
    },

    _dispatchRotate: {
        value: function() {
            var event = document.createEvent("CustomEvent");

            event.initCustomEvent("rotate", true, true, null);
            event.unit = this._unit;
            if (this._unit === "radians") {
                event.rotation = this.angleInRadians;
                event.deltaRotation = this._deltaAngle;
            } else {
                event.rotation = (this.angleInRadians * 180) / Math.PI;
                event.deltaRotation = (this._deltaAngle * 180) / Math.PI;
            }
            this.dispatchEvent(event);
        }
    },

    _dispatchRotateEnd: {
        value: function() {
            var event = document.createEvent("CustomEvent");

            event.initCustomEvent("rotateEnd", true, true, null);
            event.unit = this._unit;
            event.deltaRotation = 0;
            if (this._unit === "radians") {
                event.rotation = this.angleInRadians;
            } else {
                event.rotation = (this.angleInRadians * 180) / Math.PI;
            }
            this.dispatchEvent(event);
        }
    },

    // To review: I would call this axisCoordinates or similar
    center: {
        value: null
    },

    _start: {
        value: null
    },

    _translateComposer: {
        value: null
    },

    animateMomentum: {
        get: function () {
            return this._translateComposer.animateMomentum;
        },
        set: function (value) {
            this._translateComposer.animateMomentum = !!value;
        }
    },

    /**
     * Whether to keep translating after the user has releases the cursor.
     * @type {boolean}
     * @default true
     */
    hasMomentum: {
        get: function () {
            return this._translateComposer.hasMomentum;
        },
        set: function (value) {
            this._translateComposer.hasMomentum = !!value;
        }
    }

});
