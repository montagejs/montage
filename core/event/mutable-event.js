/**
 @module montage/core/event/mutable-event
 @requires montage
 */
var Montage = require("../core").Montage;

// XXX Does not presently function server-side
if (typeof window !== "undefined") {

    var _eventConstructorsByType = {};

    var wrapProperty = function (obj, key) {

        var storageKey = "_" + key;

        Montage.defineProperty(obj, storageKey, {value: undefined});

        Montage.defineProperty(obj, key, {
            get:(function (key, storageKey) {
                return function () {
                    return this.hasOwnProperty(storageKey) ? this[storageKey] : (this._event ? this._event[key] : undefined);
                };
            })(key, storageKey),

            set: (function (storageKey) {
                return function (value) {
                    this[storageKey] = value;
                };
            })(storageKey)
        });
    };

    /**
     * Workaround for IE 11, it doesn't set defaultPrevented for custom events when preventDefault is called.
     * https://code.google.com/p/dart/issues/detail?id=20350
     */
    var EventPrototype = window.Event.prototype,
        preventDefault = EventPrototype.preventDefault;

    Object.defineProperty(EventPrototype, "_isDefaultPrevented", {
        enumerable: false,
        configurable: false,
        writable: true,
        value: false
    });

    EventPrototype.preventDefault = function () {
        preventDefault.apply(this, arguments);

        if (this.cancelable) {
            this._isDefaultPrevented = true;
        }
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
                var key;

                for (key in event) {


                    //  Don't overwrite keys we have installed
                    // fixme the property target is set to null but it needs to be wrapped
                    if (typeof this[key] !== "undefined" && key !== "target") {
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

        defaultPrevented: {
            value: function () {
                return this._event ? this.getPreventDefault() : false;
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
                return this._event._isDefaultPrevented;
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
         * @type {Property}
         * @default {Element} null
         */
        target: {
            value: null
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
                var anEvent = document.createEvent("CustomEvent");
                anEvent.initCustomEvent(type, canBubbleArg, cancelableArg, detail);
                return this.fromEvent(anEvent);
            }
        }

    });

} // client-side

