/**
 * @module montage/composer/swipe-composer
 * @requires montage
 * @requires montage/composer/composer
 */
var Montage = require("../core/core").Montage,
    Composer = require("./composer").Composer,
    MutableEvent = require("../core/event/mutable-event").MutableEvent,
    TranslateComposer = require("./translate-composer").TranslateComposer;

var DIRECTION_LEFT = 'left',
    DIRECTION_RIGHT = 'right',
    DIRECTION_UP = 'up',
    DIRECTION_DOWN = 'down',
    SWIPE = 'swipe';

var SwipeEvent = exports.SwipeEvent = MutableEvent.specialize({

    /**
     * @public
     * @type {String}
     * @default "swipe"
     * @description Name of the swipe event.
     * 
     * Possible values: 
     * - "swipe"
     * - "swipeUp"
     * - "swipeRight"
     * - "swipeDown"
     * - "swipeLeft"
     */
    type: {
        value: SWIPE
    },

    _event: {
        enumerable: false,
        value: null
    },

    event: {
        get: function () {
            return this._event;
        },
        set: function (value) {
            this._event = value;
        }
    },

    bubbles: {
        value: true
    },

     /**
     * @public
     * @type {String}
     * @default null
     * @description The direction of a swipe gesture.
     * Possible values:
     * - "up"
     * - "right"
     * - "down"
     * - "left"
     */
    direction: {
        value: null
    },

     /**
     * @public
     * @type {Number}
     * @default null
     * @description The angle of a swipe gesture.
     */
    angle: {
        value: null
    },

     /**
     * @public
     * @type {Number}
     * @default null
     * @description The distance traveled of a swipe gesture.
     */
    distance: {
        value: null
    },

     /**
     * @public
     * @type {Number}
     * @default null
     * @description The velocity of a swipe gesture.
     */
    velocity: {
        value: null
    },

     /**
     * @public
     * @type {Number}
     * @default null
     * @description Start x coordinate of a swipe gesture.
     */
    startPositionX: {
        value: null
    },

     /**
     * @public
     * @type {Number}
     * @default null
     * @description Start y coordinate of a swipe gesture.
     */
    startPositionY: {
        value: null
    },

     /**
     * @public
     * @type {Number}
     * @default null
     * @description End x coordinate of a swipe gesture.
     */
    endPositionX: {
        value: null
    },

    /**
     * @public
     * @type {Number}
     * @default null
     * @description End y coordinate of a swipe gesture.
     */
    endPositionY: {
        value: null
    },

    constructor: {
        value: function (type, eventInit) {
            this._event = new CustomEvent(type, eventInit);
            this.type = type;
        }
    }

});

/**
 * @class SwipeComposer
 * @classdesc `Composer` for detecting swipe gestures.
 * @extends Composer
 */
exports.SwipeComposer = Composer.specialize( /** @lends SwipeComposer# */ {

    /**
     * @private
     * @type {Number}
     * @default null
     * @description Start x coordinate of a swipe gesture.
     */
    _startPositionX: {
        value: null
    },

    /**
     * @private
     * @type {Number}
     * @default null
     * @description Start y coordinate of a swipe gesture.
     */
    _startPositionY: {
        value: null
    },

    /**
     * @private
     * @type {Number}
     * @default null
     * @description Start Timestamp of a swipe gesture.
     */
    _startTimestamp: {
        value: null
    },

    __translateComposer: {
        value: null
    },

    /**
     * @private
     * @typedef {Object} TranslateComposer
     * @readOnly
     * @default null
     * @description SwipeComposer's translate composer.
     */
    _translateComposer: {
        get: function () {
            if (!this.__translateComposer) {
                this.__translateComposer = new TranslateComposer();
                this.__translateComposer.hasMomentum = false;
            }

            return this.__translateComposer;
        }
    },

    /**
     * @public
     * @type {Number}
     * @default 10
     * @description Minimal distance required before recognizing. (px)
     */
    minDistance: {
        value: 10
    },

    /**
     * @public
     * @type {Number}
     * @default 0.3
     * @description Minimal velocity required before recognizing.(px per ms)
     */
    minVelocity: {
        value: 0.3
    },

    /**
     * @public
     * @function load
     * @description load the swipe composer.
     */
    load: {
        value: function () {
            this.component.addComposerForElement(
                this._translateComposer, this.element
            );
            this._translateComposer.load();
            this._translateComposer.addEventListener(
                "translateStart", this, false
            );
        }
    },

    /**
     * @public
     * @function unload
     * @description unload the swipe composer.
     */
    unload: {
        value: function () {
            this.component.unloadComposer(this._translateComposer);
            this._translateComposer.unload();
            this._translateComposer.removeEventListener(
                "translateStart", this, false
            );
        }
    },

    handleTranslateStart: {
        value: function (event) {
            this._startPositionX = this._translateComposer.pointerStartEventPosition.pageX;
            this._startPositionY = this._translateComposer.pointerStartEventPosition.pageY;
            this._startTimestamp = event.timeStamp;
            this._addTranslateEventListeners();
        }
    },

    handleTranslateEnd: {
        value: function (event) {
            var distance = this._findDistance(
                event.translateX, event.translateY
            );

            if (distance >= this.minDistance) {
                var velocity = this._findVelocity(
                    distance,
                    event.timeStamp - this._startTimestamp
                );

                if (velocity > this.minVelocity) {
                    var angle = this._findAngle(
                        0, 0, event.translateX, event.translateY
                    ), direction;

                    if (
                        angle >= 0 && angle <= 45 || 
                        angle >= 315 && angle <= 360
                    ) {
                        direction = DIRECTION_RIGHT;
                    } else if (angle > 45 && angle < 165) {
                        direction = DIRECTION_UP;
                    } else if (angle > 165 && angle < 225) {
                        direction = DIRECTION_LEFT;
                    } else {
                        direction = DIRECTION_DOWN;
                    }

                    this._dispatchSwipeEvent(
                        distance, velocity, angle, direction
                    );
                }
            }

            this._resetComposerState();
        }
    },

    handleTranslateCancel: {
        value: function () {
            this._resetComposerState();
        }
    },

     /**
     * @private
     * @function _findAngle
     * @param p1x - start x coordinate
     * @param p1y - start y coordinate
     * @param p2x - end x coordinate
     * @param p2y - end y coordinate
     * @description Find the angle of a swipe gesture
     * @returns Number
     */
    _findAngle: {
        value: function (p1x, p1y, p2x, p2y) {
            var arctangent = (
                (Math.atan2(p2y - p1y, p2x - p1x) * -180) / Math.PI
            );
                
            if (arctangent < 0) {
                arctangent = 360 + arctangent;
            }

            return arctangent;
        }
    },

    /**
     * @private
     * @function _findVelocity
     * @param distance - distance traveled by the swipe gesture.
     * @param deltaTime - the time difference between the begining and 
     * the end of the translate gesture.
     * @description Find the velocity of a swipe gesture.
     * @returns Number
     */
    _findVelocity: {
        value: function (distance, deltaTime) {
            if (deltaTime > 300) {
                return 0;
            }

            return distance / deltaTime;
        }
    },

     /**
     * @private
     * @function _findDistance
     * @param deltaX - the difference between the two x coordinates.
     * @param deltaY - the difference between the two y coordinates.
     * @description Find the distance of a swipe gesture.
     * @returns Number
     */
    _findDistance: {
        value: function (deltaX, deltaY) {
            return Math.sqrt(
                (deltaX * deltaX) +
                (deltaY * deltaY)
            );
        }
    },

    /**
     * @private
     * @function _dispatchSwipeEvent
     * @param distance - the distance of a swipe gesture.
     * @param velocity - the velocity of a swipe gesture.
     * @param angle - the angle of a swipe gesture.
     * @param direction - the direction of a swipe gesture.
     * @description Dispatch two swipe events.
     */
    _dispatchSwipeEvent: {
        value: function (distance, velocity, angle, direction, endPositionX, endPositionY) {
            var swipeEvent = new SwipeEvent(SWIPE);

            swipeEvent.distance = distance;
            swipeEvent.velocity = velocity;
            swipeEvent.angle = angle;
            swipeEvent.direction = direction;
            swipeEvent.startPositionX = this._startPositionX;
            swipeEvent.startPositionY = this._startPositionY;
            swipeEvent.endPositionX = endPositionX;
            swipeEvent.endPositionY = endPositionY;

            this.dispatchEvent(swipeEvent);
        }
    },

     /**
     * @private
     * @function _addTranslateEventListeners
     * @description add the translate event listeners
     */
    _addTranslateEventListeners: {
        value: function () {
            this._translateComposer.addEventListener(
                "translateCancel", this
            );
            this._translateComposer.addEventListener(
                "translateEnd", this
            );
        }
    },

     /**
     * @private
     * @function _removeTranslateEventListeners
     * @description remove the translate event listeners
     */
    _removeTranslateEventListeners: {
        value: function () {
            this._translateComposer.removeEventListener(
                "translateCancel", this
            );
            this._translateComposer.removeEventListener(
                "translateEnd", this
            );
        }
    },

    /**
     * @private
     * @function _resetComposerState
     * @description Reset the swipe composer state.
     */
    _resetComposerState: {
        value: function () {
            this._startPositionX = 0;
            this._startPositionY = 0;
            this._direction = null;
            this.__translateComposer.translateX = 0;
            this.__translateComposer.translateY = 0;
            this._removeTranslateEventListeners();
        }
    }

});
