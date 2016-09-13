/*global require, exports*/

/**
 * @module montage/composer/press-composer
 * @requires montage/core/core
 * @requires montage/composer/composer
 * @requires montage/core/event/mutable-event
 */
var Montage = require("../core/core").Montage,
    Composer = require("./composer").Composer,
    MutableEvent = require("../core/event/mutable-event").MutableEvent;

/**
 * @class PressComposer
 * @classdesc The `PressComposer` abstracts away handling mouse and touch
 * events that represent presses, allowing generic detection of presses, long
 * presses, and cancelled presses.
 *
 * @extends Composer
 * @fires pressStart
 * @fires press
 * @fires longPress
 * @fires pressCancel
 */
var PressComposer = exports.PressComposer = Composer.specialize(/** @lends PressComposer.prototype # */ {

    /**
     * Dispatched when a press begins. It is ended by either a {@link press} or
     * {@link pressCancel} event.
     *
     * @event pressStart
     * @memberof PressComposer
     * @param {PressEvent} event
     */

    /**
     * Dispatched when a press is complete.
     *
     * @event press
     * @memberof PressComposer
     * @param {PressEvent} event
     */

    /**
     * Dispatched when a press lasts for longer than (@link longPressThreshold}
     * On a long press, the sequence of events will be:
     * - pressStart: as soon as the composer recognizes it is a press.
     * - longPress: `longPressThreshold` after the pressStart, if the press has
     *   not yet ended.
     * - press: when the press ends, if it isn't cancelled.
     *
     * Handlers of the `longPress` event can call `cancelPress` to prevent
     * `press` being triggered.
     *
     * @event longPress
     * @memberof PressComposer
     * @param {PressEvent} event
     */

    /**
     * Dispatched when a press is canceled. This could be because the pointer
     * left the element, was claimed by another component or maybe a phone call
     * came in.
     *
     * @event pressCancel
     * @memberof PressComposer
     * @param {PressEvent} event
     */

    // Load/unload

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


    /**
     * Cancel the current press.
     *
     * Can be used in a "longPress" event handler to prevent the "press" event
     * being fired.
     * @returns boolean true if a press was canceled, false if the composer was
     * already in a unpressed or canceled state.
     */
    cancelPress: {
        value: function () {
            if (this._state === PressComposer.PRESSED) {
                this._cancelPress();
                return true;
            }
            return false;
        }
    },

    _cancelPress: {
        value: function (event) {
            this._dispatchPressCancel(event);
            this._endInteraction();
        }
    },

    // Optimisation so that we don't set a timeout if we do not need to
    addEventListener: {
        value: function (type, listener, useCapture) {
            Composer.prototype.addEventListener.call(this, type, listener, useCapture);
            if (type === "longPress") {
                this._shouldDispatchLongPress = true;
            }
        }
    },

    _state: {
        value: 0
    },
    state: {
        get: function () {
            return this._state;
        }
    },

    _shouldDispatchLongPress: {
        value: false
    },

    _longPressThreshold: {
        value: 1000
    },

    /**
     * How long a press has to last (in milliseconds) for a longPress event to
     * be dispatched
     * @type number
     */
    longPressThreshold: {
        get: function () {
            return this._longPressThreshold;
        },
        set: function (value) {
            if (this._longPressThreshold !== value) {
                this._longPressThreshold = value;
            }
        }
    },

    _needDispatchSafePress: {
        value: false
    },

    _longPressTimeout: {
        value: null
    },

    // Magic

    _observedPointer: {
        value: null
    },

    _initialCenterPositionX: {
        value : 0
    },

    _initialCenterPositionY: {
        value: 0
    },

    _shouldSaveInitialCenterPosition: {
        value: false
    },

    _targetElementOnLastTouchMove: {
        value: null
    },

    /**
     * Remove event listeners after an interaction has finished.
     * @private
     */
    _endInteraction: {
        value: function () {
            if (this._element) {
                this._removeEventListeners();

                if (this.component.eventManager.isPointerClaimedByComponent(this._observedPointer, this)) {
                    this.component.eventManager.forfeitPointer(this._observedPointer, this);
                }

                this._observedPointer = null;
                this._targetElementOnLastTouchMove = null;
                this._state = PressComposer.UNPRESSED;
                this._initialCenterPositionX = 0;
                this._initialCenterPositionY = 0;
                this._shouldSaveInitialCenterPosition = false;
            }
        }
    },

    /**
     * Checks if we are observing one of the changed touches. Returns the index
     * of the changed touch if one matches, otherwise returns false. Make sure
     * to check against `!== false` or `=== false` as the
     * matching index might be 0.
     *
     * @function
     * @returns {number|boolean} The index of the matching touch, or false
     * @private
     */
    _changedTouchisObserved: {
        value: function (changedTouches) {
            if (this._observedPointer === null) {
                return false;
            }

            var i = 0, changedTouchCount = changedTouches.length;

            for (; i < changedTouchCount; i++) {
                if (changedTouches[i].identifier === this._observedPointer) {
                    return i;
                }
            }
            return false;
        }
    },

    // Surrender pointer

    surrenderPointer: {
        value: function (pointer, component) {
            var shouldSurrender = this.callDelegateMethod(
                "shouldComposerSurrenderPointerToComponent", 
                this, 
                pointer, 
                component
            );

            if (typeof shouldSurrender !== "undefined" && shouldSurrender === false) {
                return false;
            }

            this.cancelPress();

            return true;
        }
    },

    _shouldPerformPress: {
        value: function () {
            return !(this.component.disabled || this._observedPointer !== null);
        }
    },

    // Handlers

    capturePointerdown: {
        value: function (event) {
            if (event.pointerType === "touch" || (window.MSPointerEvent && event.pointerType === window.MSPointerEvent.MSPOINTER_TYPE_TOUCH)) {
                this.captureTouchstart(event);

            } else if (event.pointerType === "mouse" || (window.MSPointerEvent && event.pointerType === window.MSPointerEvent.MSPOINTER_TYPE_MOUSE)) {
                this.captureMousedown(event);
            }
        }
    },

    handlePointerup: {
        value: function (event) {
            if (event.pointerType === "touch" || (window.MSPointerEvent && event.pointerType === window.MSPointerEvent.MSPOINTER_TYPE_TOUCH)) {
                this.handleTouchend(event);

            } else if (event.pointerType === "mouse" || (window.MSPointerEvent && event.pointerType === window.MSPointerEvent.MSPOINTER_TYPE_MOUSE)) {
                this.handleMouseup(event);
            }
        }
    },

    handlePointercancel: {
        value: function (event) {
            if (event.pointerType === "touch" || (window.MSPointerEvent && event.pointerType === window.MSPointerEvent.MSPOINTER_TYPE_TOUCH)) {
                this.handleTouchcancel(event);
            }
        }
    },

    captureTouchstart: {
        value: function (event) {
            if (this._shouldPerformPress()) {
                if (event.pointerId !== void 0) { // -> pointer events support.
                    this._observedPointer = event.pointerId;

                } else if (event.changedTouches && event.changedTouches.length === 1) {
                    this._observedPointer = event.changedTouches[0].identifier;
                }

                if (this._observedPointer !== null && this.component.eventManager.claimPointer(this._observedPointer, this)) {
                    this._addPointerDownListener();

                } else {
                    this._observedPointer = null;
                }
            }
        }
    },

    handleTouchend: {
        value: function (event) {
            if (this._observedPointer === null) {
                this._endInteraction(event);
                return;
            }

            var target;

            if (event.pointerId === this._observedPointer)  {
                target = event.target;

            } else if (this._changedTouchisObserved(event.changedTouches) !== false) {
                // We need to keep the last element reached by a touchmove because we can't just rely on the position
                // given by the touchEnd because in some cases, hiding the android keyboard for example, could result
                // to change the press composer's element position between a touchStart and a touchEnd event. Therefore,
                // getting the "wrong" target.
                target = this._targetElementOnLastTouchMove || event.target;
            }

            if (target && this.component.eventManager.isPointerClaimedByComponent(this._observedPointer, this)) {
                if (this.element === target || this.element.contains(target)) {
                    this._dispatchPress(event, typeof event.pointerId === "undefined" ? target : null);

                } else {
                    this._dispatchPressCancel(event);
                }

                this._endInteraction(event);
            }
        }
    },

    // The PressComposer saves the initial center position after the first move or the first wheel event,
    // in order to wait for a possible css transform (translate, scale...) appeared on its element
    // after that the PressStart event has been raised.
    _saveInitialCenterPositionIfNeeded: {
        value: function () {
            if (this._shouldSaveInitialCenterPosition) {
                this._saveInitialCenterPosition();
                this._shouldSaveInitialCenterPosition = false;
            }
        }
    },

    _cancelPressIfCenterPositionChange: {
        value: function (event) {
            this._saveInitialCenterPositionIfNeeded();

            if (this._isPositionChanged(event)) {
                this._cancelPress(event);

                return true;
            }

            return false;
        }
    },

    _handleMove: {
        value: function (event) {
            if (this._observedPointer === null) {
                this._endInteraction(event);
                return;
            }

            this._needDispatchSafePress = false;

            if ((this._observedPointer === "mouse" || event.pointerId === this._observedPointer ||
                (event.changedTouches && this._changedTouchisObserved(event.changedTouches) !== false)) &&
                this.component.eventManager.isPointerClaimedByComponent(this._observedPointer, this)) {

                if (!this._cancelPressIfCenterPositionChange(event) && event.type === "touchmove") {
                    var touch = event.changedTouches[0];
                    this._targetElementOnLastTouchMove = document.elementFromPoint(touch.clientX, touch.clientY);
                }
            }
        }
    },

    captureWheel: {
        value: function (event) {
            if (this._observedPointer === null) {
                this._endInteraction(event);
                return;
            }

            if ((event.target === this.element || event.target === window ||
                (typeof event.target.contains === "function" && event.target.contains(this.element)) || this.element.contains(event.target))) {

                this._cancelPressIfCenterPositionChange(event);
            }
        }
    },

    handleTouchcancel: {
        value: function (event) {
            if (this._observedPointer === null || event.pointerId === this._observedPointer || this._changedTouchisObserved(event.changedTouches) !== false) {
                if (this.component.eventManager.isPointerClaimedByComponent(this._observedPointer, this)) {
                    this._dispatchPressCancel(event);
                }

                this._endInteraction(event);
            }
        }
    },

    captureMousedown: {
        value: function (event) {
            if (event.button === 0 && this._shouldPerformPress()) {
                this._observedPointer = "mouse";
                this.component.eventManager.claimPointer(this._observedPointer, this);

                if (this.component.eventManager.isPointerClaimedByComponent(this._observedPointer, this)) {
                    this._addPointerDownListener();

                } else{
                    this._observedPointer = null;
                }
            }
        }
    },


    /**
     * Handle every kind of interactions (touch, mouse or pointer),
     * in order to check if a press composer still claims the observed pointer in the bubbling phase.
     * @private
     */
    _handlePointerDown: {
        value: function (event) {
            this._removePointerDownListener();

            if (this.component.eventManager.isPointerClaimedByComponent(this._observedPointer, this)) {
                this._needDispatchSafePress = false;

                if (event.type === "touchstart") {
                    var self = this;

                    window.nativeAddEventListener("touchstart", function _touchStartDefaultPrevented (touchStartEvent) {
                        window.nativeRemoveEventListener("touchstart", _touchStartDefaultPrevented, false);
                        self._needDispatchSafePress = !touchStartEvent.defaultPrevented;
                    }, false);
                }

                this._shouldSaveInitialCenterPosition = true;
                this._addEventListeners();
                this._dispatchPressStart(event);

            } else {
                this._observedPointer = null;
            }
        }
    },

    captureScroll: {
        value: function (event) {
            if (event.target === this.element || event.target === window ||
                (typeof event.target.contains === "function" && event.target.contains(this.element)) ||
                this.element.contains(event.target)) {

                this._cancelPressIfCenterPositionChange(event);
            }
        }
    },

    handleMouseup: {
        value: function (event) {
            if (this._observedPointer === null) {
                this._endInteraction(event);
                return;
            }

            if (this.component.eventManager.isPointerClaimedByComponent(this._observedPointer, this)) {
                var target = event.target;

                while (target !== this._element && target && target.parentNode) {
                    target = target.parentNode;
                }

                if (target === this._element) {
                    this._dispatchPress(event);
                    this._endInteraction(event);
                    return;
                }
            }

            this._cancelPress(event);
        }
    },

    handleDragstart: {
        value: function (event) {
            this._cancelPress(event);
        }
    },

    _saveInitialCenterPosition: {
        value: function () {
            // Makes sure we compute the position of a PressComposer’s element only on HTMLElement.
            // Indeed a press composer can be used on other objects such as document, window…
            if (this.element instanceof HTMLElement) {
                var boundingClientRect = this.element.getBoundingClientRect();

                this._initialCenterPositionX = boundingClientRect.left + (boundingClientRect.width / 2);
                this._initialCenterPositionY = boundingClientRect.top + (boundingClientRect.height / 2);
            }
        }
    },

    _isPositionChanged: {
        value: function (event) {
            if (this.element instanceof HTMLElement) {
                var boundingClientRect = this.element.getBoundingClientRect(),
                    newCenterPositionX = boundingClientRect.left + (boundingClientRect.width / 2),
                    newCenterPositionY = boundingClientRect.top + (boundingClientRect.height / 2);

                if (this._initialCenterPositionX !== newCenterPositionX || this._initialCenterPositionY !== newCenterPositionY) {
                    var type = event.type,
                        deltaX = Math.abs(this._initialCenterPositionX - newCenterPositionX),
                        deltaY = Math.abs(this._initialCenterPositionY - newCenterPositionY),
                        radius = this._observedPointer === "mouse" || type === "wheel" || type === "mousewheel" || type === "scroll" ?
                            this._mouseRadiusThreshold : this._touchRadiusThreshold;

                    return Composer.isCoordinateOutsideRadius(deltaX, deltaY, radius);
                }
            }

            return false;
        }
    },

    _mouseRadiusThreshold: {
        value: 2 //px
    },

    _touchRadiusThreshold: {
        value: 4 //px
    },

    _addPointerDownListener: {
        value: function () {
            if (window.PointerEvent) {
                this._element.addEventListener("pointerdown", this, false);

            } else if (window.MSPointerEvent && window.navigator.msPointerEnabled) {
                this._element.addEventListener("MSPointerDown", this, false);

            } else {
                if (this._observedPointer === "mouse") {
                    this._element.addEventListener("mousedown", this, false);

                } else {
                    this._element.addEventListener("touchstart", this, false);
                }
            }
        }
    },

    _removePointerDownListener: {
        value: function () {
            if (window.PointerEvent) {
                this._element.removeEventListener("pointerdown", this, false);

            } else if (window.MSPointerEvent && window.navigator.msPointerEnabled) {
                this._element.removeEventListener("MSPointerDown", this, false);

            } else {
                if (this._observedPointer === "mouse") {
                    this._element.removeEventListener("mousedown", this, false);

                } else {
                    this._element.removeEventListener("touchstart", this, false);
                }
            }
        }
    },

    _addEventListeners: {
        value: function () {
            if (window.PointerEvent) {
                document.addEventListener("pointerup", this, false);
                document.addEventListener("pointermove", this, false);
                document.addEventListener("pointercancel", this, false);

            } else if (window.MSPointerEvent && window.navigator.msPointerEnabled) {
                document.addEventListener("MSPointerUp", this, false);
                document.addEventListener("MSPointerMove", this, false);
                document.addEventListener("MSPointerCancel", this, false);

            } else {
                if (this._observedPointer === "mouse") {
                    document.addEventListener("mouseup", this, false);
                    document.addEventListener("mousemove", this, false);

                    // Needed to cancel the press because once a drag is started
                    // no mouse events are fired
                    // http://www.whatwg.org/specs/web-apps/current-work/multipage/dnd.html#initiate-the-drag-and-drop-operation
                    this._element.addEventListener("dragstart", this, false);

                } else {
                    document.addEventListener("touchend", this, false);
                    document.addEventListener("touchcancel", this, false);
                    document.addEventListener("touchmove", this, false);
                }
            }

            var wheelEventName = typeof window.onwheel !== "undefined" || typeof window.WheelEvent !== "undefined" ?
                "wheel" : "mousewheel";

            document.addEventListener(wheelEventName, this, true);
            document.addEventListener("scroll", this, true);
        }
    },

    _removeEventListeners: {
        value: function () {
            if (window.PointerEvent) {
                document.removeEventListener("pointerup", this, false);
                document.removeEventListener("pointermove", this, false);
                document.removeEventListener("pointercancel", this, false);

            } else if (window.MSPointerEvent && window.navigator.msPointerEnabled) {
                document.removeEventListener("MSPointerUp", this, false);
                document.removeEventListener("MSPointerMove", this, false);
                document.removeEventListener("MSPointerCancel", this, false);

            } else {
                if (this._observedPointer === "mouse") {
                    document.removeEventListener("mouseup", this, false);
                    document.removeEventListener("mousemove", this, false);

                    // Needed to cancel the press because once a drag is started
                    // no mouse events are fired
                    // http://www.whatwg.org/specs/web-apps/current-work/multipage/dnd.html#initiate-the-drag-and-drop-operation
                    this._element.removeEventListener("dragstart", this, false);

                } else {
                    document.removeEventListener("touchend", this, false);
                    document.removeEventListener("touchcancel", this, false);
                    document.removeEventListener("touchmove", this, false);
                }
            }

            var wheelEventName = typeof window.onwheel !== "undefined" || typeof window.WheelEvent !== "undefined" ?
                "wheel" : "mousewheel";

            document.removeEventListener(wheelEventName, this, true);
            document.removeEventListener("scroll", this, true);
        }
    },

    // Event dispatch

    _createPressEvent: {
        enumerable: false,
        value: function (name, event) {
            var contactPoint = event,
                pressEvent, index;

            if (!event) {
                event = document.createEvent("CustomEvent");
                event.initCustomEvent(name, true, true, null);
            }

            pressEvent = new PressEvent();
            pressEvent.event = event;
            pressEvent.type = name;
            pressEvent.pointer = this._observedPointer;
            pressEvent.targetElement = event.target;

            if (event.changedTouches && (index = this._changedTouchisObserved(event.changedTouches)) !== false) {
                contactPoint = pressEvent.touch = event.changedTouches[index];
            }

            if (contactPoint) { // a PressCancel event can be dispatched programtically, so with no event.
                pressEvent.clientX = contactPoint.clientX;
                pressEvent.clientY = contactPoint.clientY;
                pressEvent.pageX = contactPoint.pageX;
                pressEvent.pageY = contactPoint.pageY;
            }

            return pressEvent;
        }
    },

    _dispatchPressStart: {
        enumerable: false,
        value: function (event) {
            this._state = PressComposer.PRESSED;
            this.dispatchEvent(this._createPressEvent("pressStart", event));

            if (this._shouldDispatchLongPress) {
                var self = this;

                this._longPressTimeout = setTimeout(function () {
                    self._dispatchLongPress();
                }, this._longPressThreshold);
            }
        }
    },

    _dispatchPress: {
        enumerable: false,
        value: function (event, touchEndTargetElement) {
            if (this._shouldDispatchLongPress) {
                clearTimeout(this._longPressTimeout);
                this._longPressTimeout = null;
            }

            var pressEvent = this._createPressEvent("press", event);

            // The target of touchend events is actually the same element on which the touch point started.
            // So, we override the property targetElement of the PressEvent with the element on which the touch point has been released.
            if (touchEndTargetElement) {
                pressEvent.targetElement = touchEndTargetElement;

                if (this._needDispatchSafePress || event.defaultPrevented) {// no simulated events when a touchMove has been raised
                    var self = this,
                        eventManager = document.defaultView.defaultEventManager;

                    // Raise a Press event after the simulated mousedown event has been raised,
                    // in order to avoid elements that are not on the same layer  to get the focus.
                    // @example: When a button is pressed in order to hide a overlay that it belong to.
                    // Knowing that, the simulated mouse events are not dispatched by the event manager, but they are still
                    // walking the dom. An issue could happen here when the positioning of elements is changing (z-index)
                    // after the press event has been raised, which could result to giving the focus to a wrong element.
                    // @example: @see press-composer.info
                    //@todo: should be deprecated when browsers will support PointerEvents.
                    var dispatchSafePressCallBack = function (mouseDownEvent) {
                        if (touchEndTargetElement === mouseDownEvent.target ||
                            eventManager._couldEmulatedEventHaveWrongTarget(
                                event.changedTouches[0],
                                mouseDownEvent,
                                eventManager._emulatedEventRadiusThreshold,
                                eventManager._emulatedEventTimestampThreshold
                            )
                        ) {
                            self._dispatchSafePress(pressEvent, dispatchSafePressCallBack);
                        }
                    };

                    window.nativeAddEventListener("mousedown", dispatchSafePressCallBack, true);

                    // -> long press fallBack: no simulated events with long touch press.
                    dispatchSafePressCallBack.timeoutID = setTimeout(function () {
                        self._dispatchSafePress(pressEvent, dispatchSafePressCallBack);
                    }, 300);

                    return void 0;
                }
            }

            this.dispatchEvent(pressEvent);
            this._state = PressComposer.UNPRESSED;
        }
    },

    _dispatchSafePress: {
        value: function (pressEvent, dispatchSafePressCallBack) {
            clearTimeout(dispatchSafePressCallBack.timeoutID);
            dispatchSafePressCallBack.timeoutID = null;
            window.nativeRemoveEventListener("mousedown", dispatchSafePressCallBack, true);
            this.dispatchEvent(pressEvent);
            this._state = PressComposer.UNPRESSED;
        }
    },

    _dispatchLongPress: {
        enumerable: false,
        value: function (event) {
            if (this._shouldDispatchLongPress) {
                this.dispatchEvent(this._createPressEvent("longPress", event));
                this._longPressTimeout = null;
            }
        }
    },

    _dispatchPressCancel: {
        enumerable: false,
        value: function (event) {
            if (this._shouldDispatchLongPress) {
                clearTimeout(this._longPressTimeout);
                this._longPressTimeout = null;
            }

            this._state = PressComposer.CANCELLED;
            this.dispatchEvent(this._createPressEvent("pressCancel", event));
        }
    }

} , {
    UNPRESSED: {
        value: 0
    },
    PRESSED: {
        value: 1
    },
    CANCELLED: {
        value: 2
    }
});

PressComposer.prototype.captureMSPointerDown = PressComposer.prototype.capturePointerdown;
PressComposer.prototype.handleMSPointerUp = PressComposer.prototype.handlePointerup;
PressComposer.prototype.handleMSPointerCancel = PressComposer.prototype.handlePointercancel;
PressComposer.prototype.handleMSPointerMove = PressComposer.prototype._handleMove;
PressComposer.prototype.handlePointermove = PressComposer.prototype._handleMove;
PressComposer.prototype.handleTouchmove = PressComposer.prototype._handleMove;
PressComposer.prototype.handleMousemove = PressComposer.prototype._handleMove;
PressComposer.prototype.handleMousewheel = PressComposer.prototype.handleWheel;
PressComposer.prototype.handleMSPointerDown = PressComposer.prototype._handlePointerDown;
PressComposer.prototype.handlePointerdown = PressComposer.prototype._handlePointerDown;
PressComposer.prototype.handleMousedown = PressComposer.prototype._handlePointerDown;
PressComposer.prototype.handleTouchstart = PressComposer.prototype._handlePointerDown;

/*
 * @class PressEvent
 * @inherits MutableEvent
 * @classdesc The event dispatched by the `PressComposer`, providing access to
 * the raw DOM event and proxying its properties.
 */
var PressEvent = (function (){
    var value, eventProps, typeProps, eventPropDescriptor, typePropDescriptor, i;

    value = MutableEvent.specialize({
        type: {
            value: "press"
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
        _touch: {
            enumerable: false,
            value: null
        },
        touch: {
            get: function () {
                return this._touch;
            },
            set: function (value) {
                this._touch = value;
            }
        }
    });

    // These properties are available directly on the event
    eventProps = ["altKey", "ctrlKey", "metaKey", "shiftKey",
    "cancelBubble", "currentTarget", "defaultPrevented",
    "eventPhase", "timeStamp", "preventDefault",
    "stopImmediatePropagation", "stopPropagation"];
    // These properties are available on the event in the case of mouse, and
    // on the _touch in the case of touch
    typeProps = ["clientX", "clientY", "pageX", "pageY", "screenX", "screenY", "target"];

    eventPropDescriptor = function (prop) {
        return {
            get: function () {
                return this._event[prop];
            }
        };
    };
    typePropDescriptor = function (prop) {
        return {
            get: function () {
                return (this._touch) ? this._touch[prop] : this._event[prop];
            }
        };
    };

    for (i = eventProps.length - 1; i >= 0; i--) {
        Montage.defineProperty(value, eventProps[i], eventPropDescriptor(eventProps[i]));
    }
    for (i = typeProps.length - 1; i >= 0; i--) {
        Montage.defineProperty(value, typeProps[i], typePropDescriptor(typeProps[i]));
    }

    return value;
}());
