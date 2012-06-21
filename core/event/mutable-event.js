/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2012 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
/**
 @module montage/core/event/mutable-event
 @requires montage
 */
var Montage = require("montage").Montage;

// XXX Does not presently function server-side
if (typeof window !== "undefined") {

var _eventConstructorsByType = {};
var nullDescriptor = {value: null};

var wrapProperty = function(obj, key) {

    var storageKey = "_" + key;

    Montage.defineProperty(obj, storageKey, {value: undefined});

    Montage.defineProperty(obj, key, {
        get:(function(key, storageKey) {
            return function() {
                return this.hasOwnProperty(storageKey) ? this[storageKey] : (this._event ? this._event[key] : undefined);
            };
        })(key, storageKey),

        set: (function(storageKey) {
            return function(value) {
                this[storageKey] = value;
            };
        })(storageKey)
    });
};
/**
    @class module:montage/core/event/mutable-event.MutableEvent
*/
var MutableEvent = exports.MutableEvent = Montage.create(Montage,/** @lends module:montage/core/event/mutable-event.MutableEvent# */ {
    /**
     @function
     @param {Event} event The original event.
     @returns newEvent
     */
    fromEvent: {
        value: function(event) {
            var type = event.type,
                constructor = _eventConstructorsByType[type],
                newEvent;
            if (!constructor) {
                constructor = function() {
                };
                constructor.prototype = MutableEvent.create()._initPrototypeWithEvent(event);
                _eventConstructorsByType[type] = constructor;
            }
            newEvent = new constructor();
            newEvent._initWithEvent(event);
            return newEvent;
        }
    },

    //    Same arguments as initEvent & initCustomEvent

    /**
    @function
    @param {Event} type TODO
    @param {Event} canBubbleArg TODO
    @param {Event} cancelableArg TODO
    @param {Event} data TODO
    @returns this.fromEvent(anEvent)
    */
    fromType: {
        value: function(type, canBubbleArg, cancelableArg, detail) {
            var anEvent = document.createEvent("CustomEvent");
            anEvent.initCustomEvent(type, canBubbleArg, cancelableArg, detail);
            return this.fromEvent(anEvent);
        }
    },

/**
  @private
*/
    _initPrototypeWithEvent: {
        value: function(event) {
            var key;

            for (key in event) {

                //  Don't overwrite keys we have installed
                if (this[key]) {
                    continue;
                }

                // Skip methods, the ones we care about have been wrapped already
                // TODO actually wrap all known functions generically
                //if (typeof this[key] === "function") {
                // continue;
                //}

                // TODO ok, maybe it would be quicker to not make this a function, but I really hate duplicated code
                wrapProperty(this, key);
            }

            wrapProperty(this, "replayed");

            return this;
        }
    },
/**
  @private
*/
    _initWithEvent: {
        value: function(event) {
            this._event = event;
            return this;
        }
    },
/**
    @function
    */
    preventDefault: {
        value: function() {
            this._event.preventDefault();
        }
    },
/**
    @function
    */
    stopImmediatePropagation: {
        value: function() {
            this._event.stopImmediatePropagation();
            // TODO only if the event is cancellable?
            this.propagationStopped = true;
        }
    },
/**
            @type {Property}
        @default {Boolean} false
    */
    propagationStopped: {
        value: false
    },
/**
            @type {Property}
        @default {Boolean} true
    */
    mutable: {
        value: true
    },
/**
            @type {Property}
        @default {Element} null
    */
    target: {
        value: null
    },
/**
    @function
    */
    stopPropagation: {
        value: function() {
            this._event.stopPropagation();
            // TODO only if the event is cancellable?
            this.propagationStopped = true;
        }
    },
/**
    @function
    */
    stop: {
        value: function() {
            this.preventDefault();
            this.stopPropagation();
        }
    }

});

} // client-side
