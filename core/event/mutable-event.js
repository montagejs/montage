/**
 @module montage/core/event/mutable-event
 @requires montage
 */
var Montage = require("../core").Montage;
var wrapPropertyGetter = function (key, storageKey) {
        return function () {
            return this.hasOwnProperty(storageKey) ? this[storageKey] : this._event[key];
        };
    },
    wrapPropertySetter = function (storageKey) {
        return function (value) {
            this[storageKey] = value;
        };
    };


// XXX Does not presently function server-side
if (typeof window !== "undefined") {

    var _eventConstructorsByType = {};

    var wrapProperty = function (obj, key) {
        var storageKey = "_" + key;

        Montage.defineProperty(obj, storageKey, {value: undefined});

        Montage.defineProperty(obj, key, {
            get: wrapPropertyGetter(key, storageKey),
            set: wrapPropertySetter(storageKey)
        });
    };
    /**
        @class MutableEvent
    */
    var MutableEvent = exports.MutableEvent = Montage.specialize(/** @lends MutableEvent# */ {

    /**
      @private
    */
        _initPrototypeWithEvent: {
            value: function (event) {
                var key, proto = this.__proto__ || Object.getPrototypeOf(this);
                for (key in event) {

                    //  Don't overwrite keys we have installed
                    if (key in this || Object.getOwnPropertyDescriptor(proto,key)) {
                        continue;
                    }

                    // Skip methods, the ones we care about have been wrapped
                    // already.
                    // TODO actually wrap all known functions generically
                    //if (typeof this[key] === "function") {
                    // continue;
                    //}

                    // TODO ok, maybe it would be quicker to not make this a
                    // function, but I really hate duplicated code.
                    wrapProperty(this, key);
                }

                wrapProperty(this, "replayed");

                return this;
            }
        },

        _initWithEvent: {
            value: function (event) {
                this._event = event;
                return this;
            }
        },

        /**
         * @function
         */
        preventDefault: {
            value: function () {
                this._event.preventDefault();
            }
        },

        /**
         * @function
         */
        getPreventDefault: {
            value: function () {
                if (this._event.getPreventDefault) {
                    return this._event.getPreventDefault();
                }
                return this._event.defaultPrevented;
            }
        },

        /**
         * @function
         */
        stopImmediatePropagation: {
            value: function () {
                this._event.stopImmediatePropagation();
                // TODO only if the event is cancellable?
                this.propagationStopped = true;
                this.immediatePropagationStopped = true;
            }
        },

        /**
         * @type {Property}
         * @default {boolean} false
         */
        propagationStopped: {
            value: false
        },

        /**
         * @type {Property}
         * @default {boolean} false
         */
        immediatePropagationStopped: {
            value: false
        },

        /**
         * @type {Property}
         * @default {boolean} true
        */
        mutable: {
            value: true
        },

        /**
         * @function
         */
        stopPropagation: {
            value: function () {
                this._event.stopPropagation();
                // TODO only if the event is cancellable?
                this.propagationStopped = true;
            }
        },

        /**
         * @function
         */
        stop: {
            value: function () {
                this.preventDefault();
                this.stopPropagation();
            }
        },

        _eventPhase: {
            value: void 0
        },
        /**
         * @type {Property}
         * @default {Element} null
         */
        eventPhase: {
            get: function () {
                return (this._eventPhase !== void 0) ? this._eventPhase : this._event.eventPhase;
            },
            set: function (value) {
                this._eventPhase = value;
            }
        },
        _target: {
            value: void 0
        },
        /**
         * @type {Property}
         * @default {Element} null
         */
        target: {
            get: function () {
                return (this._target !== void 0) ? this._target : this._event.target;
            },
            set: function (value) {
                this._target = value;
            }
        },
        _currentTarget: {
            value: void 0
        },
        /**
         * @type {Property}
         * @default {Element} null
         */
        currentTarget: {
            get: function () {
                return (this._currentTarget !== void 0) ? this._currentTarget : this._event.currentTarget;
            },
            set: function (value) {
                this._currentTarget = value;
            }
        },
        _type: {
            value: void 0
        },
        /**
         * @type {Property}
         * @default {Element} null
         */
        type: {
            get: function () {
                return (this._type !== void 0) ? this._type : this._event.type;
            },
            set: function (value) {
                this._type = value;
            }
        },
        _bubbles: {
            value: void 0
        },
        /**
         * @type {Property}
         * @default {Element} null
         */
        bubbles: {
            get: function () {
                return (this._bubbles !== void 0) ? this._bubbles : this._event.bubbles;
            },
            set: function (value) {
                this._bubbles = value;
            }
        },
        /**
         * @type {Property}
         * @default {Element} null
         */
        touches: {
            get: function () {
                return this._event.touches;
            }
        },
        /**
         * @type {Property}
         * @default {Element} null
         */
        changedTouches: {
            get: function () {
                return this._event.changedTouches;
            }
        },
        /**
         * @type {Property}
         * @default {Element} null
         */
        targetTouches: {
            get: function () {
                return this._event.targetTouches;
            }
        },
        _defaultPrevented: {
            value: void 0
        },
        /**
         * @type {Property}
         * @default {Element} null
         */
        defaultPrevented: {
            get: function () {
                return (this._defaultPrevented !== void 0) ? this._defaultPrevented : this._event.defaultPrevented;
            },
            set: function (value) {
                this._defaultPrevented = value;
            }
        },
        _timeStamp: {
            value: void 0
        },
        /**
         * @type {Property}
         * @default {Element} null
         */
        timeStamp: {
            get: function () {
                return (this._timeStamp !== void 0) ? this._timeStamp : this._event.timeStamp;
            },
            set: function (value) {
                this._timeStamp = value;
            }
        }

    }, {

        /**
         * @function
         * @param {Event} event The original event.
         * @returns newEvent
         */
        fromEvent: {
            value: function (event) {
                var type = event.type,
                    constructor = _eventConstructorsByType[type],
                    newEvent;
                if (!constructor) {
                    constructor = function MutableEvent() {
                    };
                    constructor.prototype = new exports.MutableEvent()._initPrototypeWithEvent(event);
                    _eventConstructorsByType[type] = constructor;
                }
                newEvent = new constructor();
                newEvent._initWithEvent(event);
                return newEvent;
            }
        },

        //    Same arguments as initEvent & initCustomEvent

        /**
         * @function
         * @param {Event} type TODO
         * @param {Event} canBubbleArg TODO
         * @param {Event} cancelableArg TODO
         * @param {Event} data TODO
         * @returns this.fromEvent(anEvent)
         */
        fromType: {
            value: function (type, canBubbleArg, cancelableArg, detail) {
                return this.fromEvent(new CustomEvent(type, {bubbles: canBubbleArg, cancelable:cancelableArg, detail:detail}));
            }
        }

    });

} // client-side
