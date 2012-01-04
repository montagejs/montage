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
 @module montage/core/event/mutable-event
 @requires montage
 @requires montage/core/enum
 */
var Montage = require("montage").Montage,
    Enum = require("core/enum").Enum;

var ChangeTypes = exports.ChangeTypes = Enum.create().initWithMembers("MODIFICATION", "ADDITION", "REMOVAL");

var _eventConstructorsByType = {};
var _changeEventConstructor = null;
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
        value: function(type, canBubbleArg, cancelableArg, data) {
            var anEvent = document.createEvent("CustomEvent");
            anEvent.initEvent(type, canBubbleArg, cancelableArg, data);
            return this.fromEvent(anEvent);
        }
    },

   /**
    @function
    @returns new _changeEventConstructor()
    */
    changeEvent: {
        value: function() {
            return new _changeEventConstructor();
        }
    },

/**
    @function
    @param {Event} key TODO
    @param {Event} minus TODO
    @returns changeEvent
    */
    changeEventForKeyAndValue: {
        value: function(key, minus) {
            var changeEvent = new _changeEventConstructor();
            changeEvent.type = "change@" + key;
            changeEvent.minus = minus;
            changeEvent.propertyChange = ChangeTypes.MODIFICATION;
            return changeEvent;
        }
    },

    /**
      @function
     @param {String} plus TODO
     @returns itself
     */
    withPlusValue: {
        value: function(plus) {
            this.plus = plus;
            return this;
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
/**
  @private
*/
_changeEventConstructor = function() {
};
/**
  @private
*/
_changeEventConstructor.prototype = MutableEvent.create()._initPrototypeWithEvent(document.createEvent("CustomEvent").initCustomEvent("change", true, false, null));
// TODO this shouldn't be necessary; initWithCustomEvent should be setting the type to "change" but that doesn't seem to be the case
// TODO should file a bug on this with some test reduction
/**
  @private
*/
_changeEventConstructor.prototype.type = "change";
exports._Change = _changeEventConstructor;
