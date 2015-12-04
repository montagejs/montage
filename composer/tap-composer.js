
/**
 * @module montage/composer/tap-composer
 * @requires montage/composer/composer
 */
var Composer = require("./composer").Composer;

/**
 * @class TapComposer
 * @extends Composer
 *
 * @fires tap
 *
 * @description
 *
 * The `TapComposer` abstracts away handling mouse and touch events for tag gestures.
 * It handles the following pattern: [n]-touches-[n]-tap
 *
 * @example:
 * - one-touch-single-tap
 * - one-touch-double-tap
 * - two-touches-single-tap
 * - two-touches-double-tap
 * - three-touches-double-tap
 * - ...
 *
 * @notes
 * In order to provide a good user experience, the TapComposer has a "window" of time where fingers can touch and
 * leave the touch surface. (property: maximumPressTime)
 *
 * For example, if four fingers are in contact with the touch surface, that doesn't mean they are going to reach
 * the touch surface at the same exact time, so several events would be raised. Plus, PointerEvents come one by one.
 * (Note it's also have the same behavior when fingers are released from the touch surface)
 *
 * Maximum interval of time between events measured on these following devices:
 * - iPad 2: 180ms.
 * - iPhone 6: 145ms.
 *
 */
var TapComposer = exports.TapComposer = Composer.specialize(/** @lends TapComposer.prototype # */ {

    load: {
        value: function () {
            if (window.PointerEvent) {
                this._element.addEventListener("pointerdown", this, true);

            } else if (window.MSPointerEvent && window.navigator.msPointerEnabled) {
                this._element.addEventListener("MSPointerDown", this, true);

            } else {
                this._element.addEventListener("touchstart", this, true);
                this._element.addEventListener("mousedown", this, true);
            }
        }
    },

    unload: {
        value: function () {
            if (window.PointerEvent) {
                this._element.removeEventListener("pointerdown", this, true);

            } else if (window.MSPointerEvent && window.navigator.msPointerEnabled) {
                this._element.removeEventListener("MSPointerDown", this, true);

            } else {
                this._element.removeEventListener("touchstart", this, true);
                this._element.removeEventListener("mousedown", this, true);
            }
        }
    },

    /**
     * Delegate that implements `surrenderPointer`. See Component for
     * explanation of what this method should do.
     *
     * @type {Object}
     * @default null
     */
    delegate: {
        value: null
    },

    _state: {
        value: null
    },

    state: {
        get: function () {
            if (!this._state) {
                this._state = TapComposer.INITIAL;
            }

            return this._state;
        }
    },

    _maximumPressTime: {
        value: 250
    },

    maximumPressTime: {
        set: function (_value) {
            _value = +_value;

            if (!isNaN(_value)) {
                this._maximumPressTime = Math.floor(_value);
            }
        },
        get: function () {
            return this._maximumPressTime;
        }
    },

    _maximumIntervalTime: {
        value: 300
    },

    maximumIntervalTime: {
        set: function (_value) {
            if (this.state === TapComposer.LISTENING) {
                throw new Error("Cannot modify the maximum interval of time when taps are occurring");
            }

            _value = +_value;

            if (!isNaN(_value)) {
                this._maximumIntervalTime = Math.floor(_value);
            }
        },
        get: function () {
            return this._maximumIntervalTime;
        }
    },

    _numberTapsRequired: {
        value: 1
    },

    numberTapsRequired: {
        set: function (_value) {
            if (this.state === TapComposer.LISTENING) {
                throw new Error("Cannot modify the number of required taps when taps are occurring");
            }

            _value = +_value;

            if (!isNaN(_value)) {
                this._numberTapsRequired = Math.floor(_value);
            }
        },
        get: function () {
            return this._numberTapsRequired;
        }
    },

    _numberTouchesRequired: {
        value: 1
    },

    numberTouchesRequired: {
        set: function (_value) {
            _value = +_value;

            if (!isNaN(_value)) {
                this._numberTouchesRequired = Math.floor(_value);
            }
        },
        get: function () {
            return this._numberTouchesRequired;
        }
    },

    _observedTouchesStartLengthCache: {
        value: 0
    },

    _tapCount: {
        value: 0
    },

    _observedPointer: {
        value: null
    },

    _observedTouchesStart: {
        value: []
    },

    _observedTouchesEnd: {
        value: []
    },

    surrenderPointer: {
        value: function (pointer, component) {
            var shouldSurrender = this.callDelegateMethod("surrenderPointer", pointer, component);

            if (shouldSurrender === false) {
                return false;
            }

            this._endInteraction();

            return true;
        }
    },

    _isPointerEventTouch: {
        value: function (event) {
            return event.pointerType === "touch" || (window.MSPointerEvent && event.pointerType === window.MSPointerEvent.MSPOINTER_TYPE_TOUCH);
        }
    },

    _isPointerEventMouse: {
        value: function (event) {
            return event.pointerType === "mouse" || (window.MSPointerEvent && event.pointerType === window.MSPointerEvent.MSPOINTER_TYPE_MOUSE);
        }
    },

    // Handlers

    capturePointerdown: {
        value: function (event) {
            if (this._isPointerEventTouch(event)) {
                this.captureTouchstart(event);

            } else if (this._isPointerEventMouse(event)) {
                this.captureMousedown(event);
            }
        }
    },

    handlePointerup: {
        value: function (event) {
            if (this._isPointerEventTouch(event)) {
                this.handleTouchend(event);

            } else if (this._isPointerEventMouse(event)) {
                this.handleMouseup(event);
            }
        }
    },

    handlePointercancel: {
        value: function (event) {
            if (this._isPointerEventTouch(event)) {
                this.handleTouchcancel(event);
            }
        }
    },

    captureTouchstart: {
        value: function (event) {
            /**
             * Needs to check if we are observing a mouse pointer
             * for devices with multiple pointer types.
             */
            if (this._observedPointer === "mouse") {
                return;
            }

            var observedToucheStart = this._observedTouchesStart,
                changedTouches = event.changedTouches,
                touchesLength = changedTouches ? changedTouches.length : 1; // 1 -> PointerEvents come one by one.

            if (touchesLength + observedToucheStart.length <= this.numberTouchesRequired) {
                var eventManager = this.component.eventManager,
                    identifier;

                if (changedTouches) { // -> TouchEvents
                    for (var i = 0; i < touchesLength; i++) {
                        identifier = changedTouches[i].identifier;

                        if (observedToucheStart.indexOf(identifier) === -1 && eventManager.claimPointer(identifier, this)) {
                            observedToucheStart.push(identifier);
                        }
                    }
                } else { // -> PointerEvents
                    identifier = event.pointerId;

                    if (eventManager.claimPointer(identifier, this)) {
                        observedToucheStart.push(identifier);
                    }
                }

                if (this._isObservedTouchesClaimedByComponent(observedToucheStart)) {
                    this._handleClaimedPointerDown();
                } else {
                    this._endInteraction();
                }
            } else {
                this._endInteraction();
            }
        }
    },

    /**
     * @function
     *
     * @descritpion
     *
     * Some explanation are needed here, given that there is "window" of time where fingers can touch the touch surface.
     *
     * 1. We need to keep in cache the number of touches that have ben in contact with the touch surface
     * because the events could come one by one.
     *
     * 2. We need to keep tracks of Touch Objects in two separate arrays, because under Safari the property identifier
     * of a Touch Object is an incremented number. Which means if an user touch four times the touch surface
     * with the same finger, the Touch Object will have a different identifier. But given that there is this "window",
     * the TapComposer would see it like four different touches if we won't remove each finger that leave the touch surface
     * from the observedToucheStart array.
     *
     */
    handleTouchend: {
        value: function (event) {
            var changedTouches = event.changedTouches,
                observedTouchesEnd = this._observedTouchesEnd,
                observedToucheStart = this._observedTouchesStart,
                identifier, index;

            if (!this._observedTouchesStartLengthCache) {
                this._observedTouchesStartLengthCache = observedToucheStart.length;
            }

            if (changedTouches) { // -> TouchEvents
                for (var i = 0, length = changedTouches.length; i < length; i++) {
                    identifier = changedTouches[i].identifier;

                    if ((index = observedToucheStart.indexOf(identifier)) > -1 && observedTouchesEnd.indexOf(identifier) === -1) {
                        observedTouchesEnd.push(identifier);
                        observedToucheStart.splice(index, 1);
                    }
                }
            } else { // -> PointerEvents
                identifier = event.pointerId;

                if ((index = observedToucheStart.indexOf(identifier)) > -1 && observedTouchesEnd.indexOf(identifier) === -1) {
                    observedTouchesEnd.push(identifier);
                    observedToucheStart.splice(index, 1);
                }
            }

            var observedTouchesEndLength = observedTouchesEnd.length;

            if (observedTouchesEndLength === this._observedTouchesStartLengthCache) {
                if (this.numberTouchesRequired === observedTouchesEndLength && this._isObservedTouchesClaimedByComponent(observedTouchesEnd)) {
                    this._incrementTapCount();
                } else {
                    this._endInteraction();
                }
            }
        }
    },

    captureMousedown: {
        value: function () {
            /**
             * Needs to check if we are observing touch pointer
             * for devices with multiple pointer types.
             */
            if (this._observedTouchesStart.length) {
                return;
            }

            this._observedPointer = "mouse";
            this.component.eventManager.claimPointer(this._observedPointer, this);

            if (this.component.eventManager.isPointerClaimedByComponent(this._observedPointer, this)) {
                this._handleClaimedPointerDown();
            } else {
                this._observedPointer = null;
            }
        }
    },

    handleMouseup: {
        value: function () {
            if (this.component.eventManager.isPointerClaimedByComponent(this._observedPointer, this)) {
                this._incrementTapCount();

            } else {
                this._endInteraction();
            }
        }
    },

    _handleClaimedPointerDown: {
        value: function () {
            // When first pointer down appears we need to add the listeners.
            if (this.state === TapComposer.INITIAL) {
                this._addEventListeners();
                this._state = TapComposer.LISTENING;
            }

            this._clearIntervalTimeout();
            this._triggerMaximumPressTime();
        }
    },

    _addEventListeners: {
        value: function () {
            if (window.PointerEvent) {
                this._element.addEventListener("pointerup", this, false);
                this._element.addEventListener("pointercancel", this, false);

            } else if (window.MSPointerEvent && window.navigator.msPointerEnabled) {
                this._element.addEventListener("MSPointerUp", this, false);
                this._element.addEventListener("MSPointerCancel", this, false);

            } else {
                this._element.addEventListener("mouseup", this, false);
                this._element.addEventListener("touchend", this, false);
                this._element.addEventListener("touchcancel", this, false);
            }
        }
    },

    _removeEventListeners: {
        value: function () {
            if (window.PointerEvent) {
                this._element.removeEventListener("pointerup", this, false);
                this._element.removeEventListener("pointercancel", this, false);

            } else if (window.MSPointerEvent && window.navigator.msPointerEnabled) {
                this._element.removeEventListener("MSPointerUp", this, false);
                this._element.removeEventListener("MSPointerCancel", this, false);

            } else {
                this._element.removeEventListener("touchend", this, false);
                this._element.removeEventListener("touchcancel", this, false);
                this._element.removeEventListener("mouseup", this, false);
            }
        }
    },

    _incrementTapCount: {
        value: function () {
            this._clearLongPressTimeout();
            this._resetObservedPointers();

            if (++this._tapCount === this.numberTapsRequired)  {
                this._dispatchTap();

            } else {
                this._triggerMaximumIntervalTime();
            }
        }
    },

    _clearLongPressTimeout: {
        value: function () {
            if (this._longPressTimeoutID) {
                clearTimeout(this._longPressTimeoutID);
                this._longPressTimeoutID = null;
            }
        }
    },

    _triggerMaximumPressTime: {
        value: function () {
            this._clearLongPressTimeout();

            var self = this;

            this._longPressTimeoutID = setTimeout(function () {
                self._endInteraction();

            }, this.maximumPressTime);
        }
    },

    _clearIntervalTimeout: {
        value: function () {
            if (this._intervalTimeoutID) {
                clearTimeout(this._intervalTimeoutID);
                this._intervalTimeoutID = null;
            }
        }
    },

    _triggerMaximumIntervalTime: {
        value: function () {
            this._clearIntervalTimeout();

            var self = this;

            this._intervalTimeoutID = setTimeout(function () {
                self._endInteraction();

            }, this.maximumIntervalTime);
        }
    },

    _isObservedTouchesClaimedByComponent: {
        value: function (observedTouches) {
            var eventManager = this.component.eventManager,
                response = true;

            for (var i = 0, length = observedTouches.length; i < length || response === false; i++) {
                response = eventManager.isPointerClaimedByComponent(observedTouches[i], this);
            }

            return response;
        }
    },

    /**
     * Remove event listeners after an interaction has finished.
     * @private
     */
    _endInteraction: {
        value: function () {
            this._clearLongPressTimeout();
            this._clearIntervalTimeout();
            this._removeEventListeners();
            this._resetObservedPointers();

            this._tapCount = 0;
            this._observedTouchesStartLengthCache = 0;
            this._state = TapComposer.INITIAL;
        }
    },

    _resetObservedPointers: {
        value: function () {
            var eventManager = this.component.eventManager;

            if (this._observedPointer && eventManager.isPointerClaimedByComponent(this._observedPointer, this)) {
                eventManager.forfeitPointer(this._observedPointer, this);

            } else if (this._isObservedTouchesClaimedByComponent(this._observedTouchesEnd)) {
                var observedTouches = this._observedTouchesEnd;

                for (var i = 0, length = observedTouches.length; i < length; i++) {
                    eventManager.forfeitPointer(observedTouches[i], this);
                }
            }

            this._observedPointer = null;
            this._observedTouchesStart.length = 0;
            this._observedTouchesEnd.length = 0;
        }
    },

    _dispatchTap: {
        value: function () {
            this._endInteraction();
            this.dispatchEventNamed("tap", true, true, null);
        }
    }

}, {

    INITIAL: {
        value: 0
    },

    LISTENING: {
        value: 1
    }
});

TapComposer.prototype.handleMSPointerCancel = TapComposer.prototype.handlePointercancel;
TapComposer.prototype.captureMSPointerDown = TapComposer.prototype.capturePointerdown;
TapComposer.prototype.handleMSPointerUp = TapComposer.prototype.handlePointerup;
TapComposer.prototype.handleTouchcancel = TapComposer.prototype._endInteraction;
