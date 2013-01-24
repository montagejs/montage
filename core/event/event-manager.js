/* <copyright>
Copyright (c) 2012, Motorola Mobility LLC.
All Rights Reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

* Redistributions of source code must retain the above copyright notice,
  this list of conditions and the following disclaimer.

* Redistributions in binary form must reproduce the above copyright notice,
  this list of conditions and the following disclaimer in the documentation
  and/or other materials provided with the distribution.

* Neither the name of Motorola Mobility LLC nor the names of its
  contributors may be used to endorse or promote products derived from this
  software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE
LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
POSSIBILITY OF SUCH DAMAGE.
</copyright> */
/*global Element,Components,Touch */
/**
 *
 * @author: Lea Verou
 * @license: Licensed under The MIT License. See license.txt and http://www.opensource.org/licenses/mit-license.php.
 * @website: http://leaverou.github.com/chainvas/
 */

/**
 @module montage/core/event/event-manager
 @requires montage/core/core
 @requires montage/core/event/mutable-event
 @requires montage/core/event/action-event-listener
 */

var Montage = require("montage").Montage,
    UUID = require("core/uuid"),
    MutableEvent = require("core/event/mutable-event").MutableEvent,
    Serializer = require("core/serializer").Serializer,
    Deserializer = require("core/deserializer").Deserializer,
    defaultEventManager;

// XXX Does not presently function server-side
if (typeof window !== "undefined") { // client-side

/* This is to handle browsers that have TouchEvents but don't have the global constructor function Touch */
if (typeof window.Touch === "undefined" && "ontouchstart" in window) {
    window.Touch = function() {
    };
    (function() {
        var onFirstTouchstart;

        document.addEventListener("touchstart", onFirstTouchstart = function (event) {
            window.Touch = event.touches[0].constructor;
            if (document.nativeRemoveEventListener) {
                document.nativeRemoveEventListener("touchstart", onFirstTouchstart, true);
            } else {
                document.removeEventListener("touchstart", onFirstTouchstart, true);
            }
            if (defaultEventManager && defaultEventManager.isStoringPointerEvents) {
                defaultEventManager.isStoringPointerEvents = false;
                defaultEventManager.isStoringPointerEvents = true;
            }
        }, true);
    })();
}

/**
 @external Element
 */

/**
 HTML element event handler UUID
 @member external:Element#eventHandlerUUID
 */
Montage.defineProperty(Element.prototype, "eventHandlerUUID", /** @lends module:montage/core/event/event-manager.defineProperty */ {
    value: undefined,
    enumerable: false
});


/**
 The controller (Montage component) for the element.
 @member external:Element#controller
 */
Montage.defineProperty(Element.prototype, "controller", {
    get: function() {
        return defaultEventManager._elementEventHandlerByUUID[this.eventHandlerUUID];
    },
    enumerable: false
});

/**
    Adds an event listener to the object.
    @function external:Object#addEventListener
    @param {string} type The event type to listen for.
    @param {object | function} listener The listener object or function.
    @param {boolean} useCapture Specifies whether to listen for the event during the bubble or capture phases.
*/
Montage.defineProperty(Object.prototype, "addEventListener", {
    value: function addEventListener(type, listener, useCapture) {
        if (listener) {
            defaultEventManager.registerEventListener(this, type, listener, useCapture);
        }
    }
});

/**
    Removes an event listener from the object.
    @function external:Object#removeEventListener
    @param {string} type The event type.
    @param {object | function} listener The listener object or function.
    @param {boolean} useCapture The phase of the event listener.
*/
Montage.defineProperty(Object.prototype, "removeEventListener", {
    value: function removeEventListener(type, listener, useCapture) {
        if (listener) {
            defaultEventManager.unregisterEventListener(this, type, listener, useCapture);
        }
    }
});

/**
 @function external:Object#dispatchEvent
 */
Montage.defineProperty(Object.prototype, "dispatchEvent", {
    value: function(event) {
        var targettedEvent = event;

        if (!MutableEvent.isPrototypeOf(event)) {
             targettedEvent = MutableEvent.fromEvent(event);
        }

        targettedEvent.target = this;
        defaultEventManager.handleEvent(targettedEvent);
    },
    enumerable: false
});

/**
 @function external:Object#dispatchEventNamed
 */
Montage.defineProperty(Object.prototype, "dispatchEventNamed", {
    value: function(type, canBubble, cancelable, detail) {
        var event = MutableEvent.fromType(type, canBubble, cancelable, detail);
        event.target = this;
        defaultEventManager.handleEvent(event);
    }
});

var EventListenerDescriptor = Montage.create(Montage, {
    type: {
        value: null
    },

    listener: {
        value: null
    },

    capture: {
        value: null
    }
});

Serializer.defineSerializationUnit("listeners", function(object, serializer) {
    var eventManager = defaultEventManager,
        uuid = object.uuid,
        eventListenerDescriptors = [],
        descriptors,
        descriptor,
        listener;

    for (var type in eventManager.registeredEventListeners) {
        descriptors = eventManager.registeredEventListeners[type];
        descriptor = descriptors && descriptors[uuid];
        if (descriptor) {
            for (var listenerUuid in descriptor.listeners) {
                listener = descriptor.listeners[listenerUuid];

                eventListenerDescriptors.push({
                    type: type,
                    listener: serializer.addObjectReference(listener.listener),
                    capture: listener.capture
                });
            }
        }
    }

    if (eventListenerDescriptors.length > 0) {
        return eventListenerDescriptors;
    }
});

Deserializer.defineDeserializationUnit("listeners", function(object, listeners) {
    for (var i = 0, listener; (listener = listeners[i]); i++) {
        object.addEventListener(listener.type, listener.listener, listener.capture);
    }
});

var NONE = Event.NONE,
    CAPTURING_PHASE = Event.CAPTURING_PHASE,
    AT_TARGET = Event.AT_TARGET,
    BUBBLING_PHASE = Event.BUBBLING_PHASE,
    FUNCTION_TYPE = "function";

/**
 @class module:montage/core/event/event-manager.EventManager
 */
var EventManager = exports.EventManager = Montage.create(Montage,/** @lends module:montage/core/event/event-manager.EventManager# */ {

    // Utility
    eventDefinitions: {
        // ClipboardEvent http://dev.w3.org/2006/webapi/clipops/clipops.html#event-types-and-details
        // DND http://www.w3.org/TR/2010/WD-html5-20101019/dnd.html
        // document.implementation.hasFeature("HTMLEvents", "2.0")
        // DOM2 http://www.w3.org/TR/DOM-Level-2-Events/events.html
        // DOM3 http://dev.w3.org/2006/webapi/DOM-Level-3-Events/html/DOM3-Events.html
        // DOM4 http://dvcs.w3.org/hg/domcore/raw-file/tip/Overview.html#events
        // GECKO https://developer.mozilla.org/en/Gecko-Specific_DOM_Events
        // MSFT defacto standard
        // ProgressEvent http://www.w3.org/TR/progress-events/
        // TouchEvent http://dvcs.w3.org/hg/webevents/raw-file/tip/touchevents.html
        // INPUT http://dev.w3.org/html5/spec/common-input-element-apis.html#common-event-behaviors
        // WEBSOCKETS http://www.w3.org/TR/html5/comms.html

        // Other info:
        // http://www.quirksmode.org/dom/events/index.html
        // https://developer.mozilla.org/en/DOM/DOM_event_reference
        value: {
            abort: {bubbles: false, cancelable: false}, //ProgressEvent, DOM3, //DOM2 does bubble
            beforeunload: {bubbles: false}, //MSFT
            blur: {bubbles: false, cancelable: false}, //DOM2, DOM3
            change: {bubbles: true, cancelable: false}, //DOM2, INPUT
            click: {bubbles: true, cancelable: true}, //DOM3
            close: {bubbles: false, cancelable: false}, //WEBSOCKETS
            compositionend: {bubbles: true, cancelable: false}, //DOM3
            compositionstart: {bubbles: true, cancelable: true}, //DOM3
            compositionupdate: {bubbles: true, cancelable: false}, //DOM3
            contextmenu: {bubbles: true, cancelable: true}, //MSFT
            copy: {bubbles: true, cancelable: true}, //ClipboardEvent
            cut: {bubbles: true, cancelable: true}, //ClipboardEvent
            dblclick: {bubbles: true, cancelable: false}, //DOM3
            DOMActivate: {bubbles: true, cancelable: true, deprecated: true}, //DOM2, DOM3 deprecated
            DOMMouseScroll: {bubbles: true}, //GECKO
            drag: {bubbles: true, cancelable: true}, //DND
            dragend: {bubbles: true, cancelable: false}, //DND
            dragenter: {bubbles: true, cancelable: true}, //DND
            dragleave: {bubbles: true, cancelable: false}, //DND
            dragover: {bubbles: true, cancelable: true}, //DND
            dragstart: {bubbles: true, cancelable: true}, //DND
            drop: {bubbles: true, cancelable: true}, //DND
            error: {
                bubbles: function(target) {
                    // error does not bubble when used as a ProgressEvent
                    return !(XMLHttpRequest.prototype.isPrototypeOf(target) ||
                           target.tagName && "VIDEO" === target.tagName.toUpperCase() ||
                           target.tagName && "AUDIO" === target.tagName.toUpperCase());
                },
                cancelable: false
            }, //DOM2, DOM3, ProgressEvent
            focus: {bubbles: false, cancelable: false}, //DOM2, DOM3
            focusin: {bubbles: true, cancelable: false}, //DOM3
            focusout: {bubbles: true, cancelable: false}, //DOM3
            input: {bubbles: true, cancelable: false}, // INPUT
            keydown: {bubbles: true, cancelable: false}, //DOM3
            keypress: {bubbles: true, cancelable: false}, //DOM3
            keyup: {bubbles: true, cancelable: false}, //DOM3
            load: {bubbles: false, cancelable: false}, //ProgressEvent, DOM2, DOM3
            loadend: {bubbles: false, cancelable: false}, //ProgressEvent
            loadstart: {bubbles: false, cancelable: false}, //ProgressEvent
            message: {bubbles: false, cancelable: false}, //WEBSOCKETS
            mousedown: {bubbles: true, cancelable: true}, //DOM3
            mouseenter: {bubbles: false, cancelable: false}, //DOM3
            mouseleave: {bubbles: false, cancelable: false}, //DOM3
            mousemove: {bubbles: true, cancelable: true}, //DOM3
            mouseout: {bubbles: true, cancelable: true}, //DOM3
            mouseover: {bubbles: true, cancelable: true}, //DOM3
            mouseup: {bubbles: true, cancelable: true}, //DOM3
            mousewheel: {bubbles: true},
            orientationchange: {bubbles: false},
            paste: {bubbles: true, cancelable: true}, //ClipboardEvent
            progress: {bubbles: false, cancelable: false}, //ProgressEvent
            reset: {bubbles: true, cancelable: false}, //DOM2
            resize: {bubbles: false, cancelable: false}, //DOM2 bubbles, DOM3

            scroll: {
                bubbles: function(target) {
                    return /*isDocument*/!!target.defaultView;
                },
                cancelable: false
            }, //DOM2, DOM3 When dispatched on Document element must bubble to defaultView object

            select: {bubbles: true, cancelable: false}, //DOM2, DOM3

            submit: {bubbles: true, cancelable: true}, //DOM2
            touchcancel: {bubbles: true, cancelable: false}, //TouchEvent
            touchend: {bubbles: true, cancelable: true}, //TouchEvent
            touchmove: {bubbles: true, cancelable: true}, //TouchEvent
            touchstart: {bubbles: true, cancelable: true}, //TouchEvent
            unload: {bubbles: false, cancelable: false}, //DOM2, DOM3
            wheel: {bubbles: true, cancelable: true} //DOM3
        }
    },

    _DOMPasteboardElement: {
        value: null,
        enumerable: false
    },

    _delegate: {
        value: null,
        enumerable: false
    },
/**
        @type {String}
        @default null
    */
    delegate: {
        enumerable: false,
        get: function() {
            return this._delegate;
        },
        set: function(delegate) {
            this._delegate = delegate;
        }
    },
/**
  @private
*/
    _application: {
        value: null,
        enumerable: false
    },
/**
    The application object associated with the event manager.
    @type {String}
    @default null
    */
    application: {
        enumerable: false,
        get: function() {
            return this._application;
        },
        set: function(application) {
            // TODO if this changes...we probably need to unregister all the windows
            // we know about and frankly probably the components too
            // Really maybe this should be possible.
            this._application = application;
        }
    },

    // Dictionary keyed by event types with the collection of handlers per event type
    // This dictates why the event manager observes events of a particular type

    // Simple array of all windows this event Manager may be listening to

 /**
  @private
*/
    _registeredWindows: {
        value: null,
        enumerable: false
    },
/**
  @private
*/
    _windowsAwaitingFinalRegistration: {
        value: {},
        enumerable: false
    },

    // Initialization
/**
    @function
    @param {Window} aWindow
    @returns this registerWindow(aWindow)
    */
    initWithWindow: {
        enumerable: false,
        value: function(aWindow) {
            if (!!this._registeredWindows) {
                throw "EventManager has already been initialized";
            }

            // TODO do we also complain if no window is given? Technically
            // we don't need one until we start listening for events
            this.registerWindow(aWindow);
            return this;
        }
    },
/**
    @function
    @param {Window} aWindow
    */
    registerWindow: {
        enumerable: false,
        value: function(aWindow) {

            if (aWindow.defaultEventManager && aWindow.defaultEventManager !== this) {
                throw "EventManager cannot register a window already registered to another EventManager";
            }

            if (this._registeredWindows && this._registeredWindows.indexOf(aWindow) >= 0) {
                throw "EventManager cannot register a window more than once";
            }

            if (!this._registeredWindows) {
                this._registeredWindows = [];
            }

            if (!aWindow.uuid || aWindow.uuid.length === 0) {
                aWindow.uuid = UUID.generate();
            }

            if (this._windowsAwaitingFinalRegistration[aWindow.uuid] === aWindow) {
                return;
            }

            // Setup the window as much as possible now without knowing whether
            // the DOM is ready or not

            // Note I think it may be implementation specific how these are implemented
            // so I'd rather preserve any native optimizations a browser has for
            // adding listeners to the document versus and element etc.
            aWindow.Element.prototype.nativeAddEventListener = aWindow.Element.prototype.addEventListener;
            Object.defineProperty(aWindow, "nativeAddEventListener", {
                enumerable: false,
                value: aWindow.addEventListener
            });
            Object.getPrototypeOf(aWindow.document).nativeAddEventListener = aWindow.document.addEventListener;
            aWindow.XMLHttpRequest.prototype.nativeAddEventListener = aWindow.XMLHttpRequest.prototype.addEventListener;
            if (aWindow.Worker) {
                aWindow.Worker.prototype.nativeAddEventListener = aWindow.Worker.prototype.addEventListener;
            }

            aWindow.Element.prototype.nativeRemoveEventListener = aWindow.Element.prototype.removeEventListener;
            Object.defineProperty(aWindow, "nativeRemoveEventListener", {
                enumerable: false,
                value: aWindow.removeEventListener
            });
            Object.getPrototypeOf(aWindow.document).nativeRemoveEventListener = aWindow.document.removeEventListener;
            aWindow.XMLHttpRequest.prototype.nativeRemoveEventListener = aWindow.XMLHttpRequest.prototype.removeEventListener;
            if (aWindow.Worker) {
                aWindow.Worker.prototype.nativeRemoveEventListener = aWindow.Worker.prototype.removeEventListener;
            }

            Object.defineProperty(aWindow, "addEventListener", {
                enumerable: false,
                value: (aWindow.XMLHttpRequest.prototype.addEventListener =
                        aWindow.Element.prototype.addEventListener =
                            Object.getPrototypeOf(aWindow.document).addEventListener =
                                function(eventType, listener, useCapture) {
                                    return aWindow.defaultEventManager.registerEventListener(this, eventType, listener, !!useCapture);
                                })
            });

            if (aWindow.Worker) {
                aWindow.Worker.prototype.addEventListener = aWindow.addEventListener;
            }

            Object.defineProperty(aWindow, "removeEventListener", {
                enumerable: false,
                value: (aWindow.XMLHttpRequest.prototype.removeEventListener =
                        aWindow.Element.prototype.removeEventListener =
                            Object.getPrototypeOf(aWindow.document).removeEventListener =
                                function(eventType, listener, useCapture) {
                                    return aWindow.defaultEventManager.unregisterEventListener(this, eventType, listener, !!useCapture);
                                })
            });

            if (aWindow.Worker) {
                aWindow.Worker.prototype.removeEventListener = aWindow.removeEventListener;
            }

            // In some browsers each element has their own addEventLister/removeEventListener
            // Methodology to find all elements found in Chainvas
            if(aWindow.HTMLDivElement.prototype.addEventListener !== aWindow.Element.prototype.nativeAddEventListener) {
                if (aWindow.HTMLElement &&
                    'addEventListener' in aWindow.HTMLElement.prototype &&
                    aWindow.Components &&
                    aWindow.Components.interfaces
                ) {
                    var candidate, candidatePrototype;

                    for(candidate in Components.interfaces) {
                        if(candidate.match(/^nsIDOMHTML\w*Element$/)) {
                            candidate = candidate.replace(/^nsIDOM/, '');
                            if(candidate = window[candidate]) {
                                candidatePrototype = candidate.prototype;
                                candidatePrototype.nativeAddEventListener = candidatePrototype.addEventListener;
                                candidatePrototype.addEventListener = aWindow.Element.prototype.addEventListener;
                                candidatePrototype.nativeRemoveEventListener = candidatePrototype.removeEventListener;
                                candidatePrototype.removeEventListener = aWindow.Element.prototype.removeEventListener;
                            }
                        }
                    }
                }
            }

            defaultEventManager = aWindow.defaultEventManager = exports.defaultEventManager = this;
            this._registeredWindows.push(aWindow);

            this._windowsAwaitingFinalRegistration[aWindow.uuid] = aWindow;

            // Some registration demands the window's dom be accessible
            // only finalize registration when that's true
            if (/loaded|complete|interactive/.test(aWindow.document.readyState)) {
                this._finalizeWindowRegistration(aWindow);
            } else {
                aWindow.document.addEventListener("DOMContentLoaded", this, true);
            }
        }
    },
/**
  @private
*/
    _finalizeWindowRegistration: {
        enumerable: false,
        value: function(aWindow) {

            if (this._windowsAwaitingFinalRegistration[aWindow.uuid] !== aWindow) {
                throw "EventManager wasn't expecting to register this window";
            }

            delete this._windowsAwaitingFinalRegistration[aWindow.uuid];

            this._listenToWindow(aWindow);
            // TODO uninstall DOMContentLoaded listener if all windows finalized
        }
    },
/**
    @function
    @param {Window} aWindow
    */
    unregisterWindow: {
        enumerable: false,
        value: function(aWindow) {

            if (this._registeredWindows.indexOf(aWindow) < 0) {
                throw "EventManager cannot unregister an unregistered window";
            }

            var removeWindow = function(element) {
                return (aWindow !== element);
            };
            this._registeredWindows = this._registeredWindows.filter(removeWindow);

            this._stopListeningToWindow(aWindow);
        }
    },
/**
    @function
    */
    unregisterWindows: {
        enumerable: false,
        value: function() {
            this._registeredWindows.forEach(this.unregisterWindow);
        }
    },

    // Event Handler Registration

    // e.g.
    // mousedown: {
    //      target.uuid: {
    //          target: target,
    //          listeners: {
    //              Object1.uuid: {listener: Object1, capture: true, bubble: true},
    //              Object2.uuid: {listener: Object2, capture: true, bubble: false},
    //              Object3.uuid: {listener: Object3, capture: false, bubble: true}}}}


   /**
        Registered event listeners.
        @type {Listeners}
        @default {}
    */
    registeredEventListeners: {
        enumerable: false,
        value: {}
    },

  /**
    Returns a dictionary of all listeners registered for the specified eventType, regardless of the target being observed.
    @function
    @param {Event} eventType The event type.
    @returns null || listeners
    */
    registeredEventListenersForEventType_: {
        value: function(eventType) {
            var eventTypeEntry = this.registeredEventListeners[eventType],
                targetUid,
                listenerEntries,
                listenerUid,
                listeners;

            if (!eventTypeEntry) {
                return null;
            }

            listeners = {};

            for (targetUid in eventTypeEntry) {
                listenerEntries = eventTypeEntry[targetUid].listeners;

                for (listenerUid in listenerEntries) {
                    listeners[listenerUid] = listenerEntries[listenerUid];
                }
            }

            return listeners;
        }
    },

    /**
    Returns the dictionary of all listeners registered for the specified eventType, on the specified target.
    @function
    @param {Event} eventType The event type.
    @param {Event} target The event target.
    @returns targetRegistration ? targetRegistration.listeners : null
    */
    registeredEventListenersForEventType_onTarget_: {
        enumerable: false,
        value: function(eventType, target, application) {

            var eventRegistration,
                targetRegistration;

            if (target === application) {
                eventRegistration = application.eventManager.registeredEventListeners[eventType];
            } else {
                eventRegistration = this.registeredEventListeners[eventType];
            }

            if (!eventRegistration) {
                return null;
            } else {
                targetRegistration = eventRegistration[target.uuid];

                return targetRegistration ? targetRegistration.listeners : null;
            }
        }
    },


    /**
    Returns the dictionary of all listeners registered on the specified target, keyed by eventType.
    @function
    @param {Event} target The event target.
    @returns observedEventListeners
    */
    registeredEventListenersOnTarget_: {
        value: function(target) {

            var eventType,
                eventRegistration,
                observedEventListeners = [];

            for (eventType in this.registeredEventListeners) {
                eventRegistration = this.registeredEventListeners[eventType];
                if (target.uuid in eventRegistration) {
                    observedEventListeners.push(eventRegistration);
                }
            }

            return observedEventListeners;
        }
    },

    // NOTE this adds the listener to the definitive collection of what
    // targets are being observed for what eventTypes by whom and in what phases
    // This collection maintained by the EventManager is used throughout the
    // discovery and distribution steps of the event handling system

   /**
    This adds the listener to the definitive collection of what targets are being observed for what eventTypes by whom and in what phases. This collection maintained by the EventManager is used throughout the discovery and distribution steps of the event handling system.
    @function
    @param {Event} target The event target.
    @param {Event} eventType The event type.
    @param {Event} listener The event listener.
    @param {Event} useCapture The event capture.
    @returns returnResult
    */

    registerEventListener: {
        enumerable: false,
        value: function(target, eventType, listener, useCapture) {

            // console.log("EventManager.registerEventListener", target, eventType, listener, useCapture)

            var eventTypeRegistration = this.registeredEventListeners[eventType],
                targetRegistration,
                listenerRegistration,
                phase,
                isNewTarget = false,
                returnResult = false;

            if (typeof target.uuid === "undefined") {
                // TODO WebKit's CanvasPixelArray has a null prototype
                // and never receives a uuid. It's not really observable anyway so if you get to this
                // point just, stop. Arguably we could stop even earlier.
                if (Array.isCanvasPixelArray(target)) {
                    return;
                }
                throw "EventManager cannot observe a target without a uuid";
            }

            if (!eventTypeRegistration) {
                // First time this eventType has been requested
                eventTypeRegistration = this.registeredEventListeners[eventType] = {};
                eventTypeRegistration[target.uuid] = {target: target, listeners: {}};
                eventTypeRegistration[target.uuid].listeners[listener.uuid] = {listener: listener, capture: useCapture, bubble: !useCapture};

                isNewTarget = true;
                returnResult = true;
            } else {

                // Or, the event type was already observed; install this new listener (or at least any new parts)
                if (!(targetRegistration = eventTypeRegistration[target.uuid])) {
                    targetRegistration = eventTypeRegistration[target.uuid] = {target: target, listeners: {}};
                    isNewTarget = true;
                }

                listenerRegistration = targetRegistration.listeners[listener.uuid];
                phase = useCapture ? "capture" : "bubble";

                if (listenerRegistration) {
                    listenerRegistration[phase] = true;
                    returnResult = true;
                } else {
                    listenerRegistration = {listener: listener, capture: useCapture, bubble: !useCapture};
                    targetRegistration.listeners[listener.uuid] = listenerRegistration;
                    returnResult = true;
                }

            }

            if (isNewTarget && typeof target.nativeAddEventListener === "function") {
                this._observeTarget_forEventType_(target, eventType);
            }

            // console.log("EventManager.registeredEventListeners", this.registeredEventListeners)

            return returnResult;
        }
    },
/**
    This unregisters the listener.
    @function
    @param {Event} target The event target.
    @param {Event} eventType The event type.
    @param {Event} listener The event listener.
    @param {Event} useCapture The event capture.
    */
    unregisterEventListener: {
        enumerable: false,
        value: function(target, eventType, listener, useCapture) {

            // console.log("EventManager.unregisterEventListener", target, eventType, listener, useCapture)

            var eventTypeRegistration = this.registeredEventListeners[eventType],
                targetRegistration,
                listenerRegistration,
                phase,
                listenerUUID,
                installedListener;

            if (!eventTypeRegistration) {
                // this eventType wasn't being observed at all
                return;
            }

            // the event type was observed; see if the target was registered
            targetRegistration = eventTypeRegistration[target.uuid];
            if (!targetRegistration) {
                return;
            }

            // the target was being observed for this eventType; see if the specified listener was registered
            listenerRegistration = targetRegistration.listeners[listener.uuid];

            if (!listenerRegistration) {

                for (listenerUUID in targetRegistration.listeners) {
                    installedListener = targetRegistration.listeners[listenerUUID].listener;

                    if (installedListener.originalListener && installedListener.originalListener.uuid === listener.uuid) {
                        listenerRegistration = targetRegistration.listeners[listenerUUID];
                        listener = installedListener;
                        break;
                    }
                }


                if (!listenerRegistration) {
                    return;
                }
            }

            phase = useCapture ? "capture" : "bubble";
            // console.log("unregistering listener from phase:", phase)

            listenerRegistration[phase] = false;

            // Done unregistering the listener for the specified phase
            // Now see if we need to remove any registrations as a result of that

            if (!listenerRegistration.bubble && !listenerRegistration.capture) {
                // this listener isn't listening in any phase; remove it
                delete targetRegistration.listeners[listener.uuid];

                if (Object.keys(targetRegistration.listeners).length === 0) {
                    // If no listeners for this target given this event type; remove this target
                    delete eventTypeRegistration[target.uuid];

                    if (Object.keys(eventTypeRegistration).length === 0) {
                        // If no targets for this eventType; stop observing this event
                        delete this.registeredEventListeners[eventType];
                        this._stopObservingTarget_forEventType_(target, eventType);
                    }

                }

            }
            // console.log("EventManager.unregisteredEventListener", this.registeredEventListeners)
        }
    },

   /**
    Determines the actual target to observe given a target and an eventType. This correctly decides whether to observe the element specified or to observe some other element to leverage event delegation. This should be consulted whenever starting or stopping the observation of a target for a given eventType.
    @function
    @param {Event} eventType
    @param {Event} target
    @returns null || target.screen ? target.document : target.ownerDocument
    */

    actualDOMTargetForEventTypeOnTarget: {
        value: function(eventType, target) {

            if (!target.nativeAddEventListener) {
                return null;
            } else {

                if (/*isDocument*/!!target.defaultView) {
                    return target;
                }

                var entry = this.eventDefinitions[eventType],
                    bubbles;

                // For events we know we can safely delegate to handling at a higher level, listen on the document
                // otherwise, be less surprising and listen on the specified target

                if (!entry) {
                    return target;
                }

                // TODO allow eventTypes to describe a preferred delegation target window|document|none etc.
                bubbles = (typeof entry.bubbles === FUNCTION_TYPE) ? entry.bubbles(target) : entry.bubbles;

                if (bubbles) {
                    // TODO why on the document and not the window?
                    return /* isWindow*/target.screen ? target.document : target.ownerDocument;;
                } else {
                    return target;
                }
            }

        }
    },
  /**
  @private
*/
   _observedTarget_byEventType_: {value:{}},

    // Individual Event Registration
/**
  @private
*/
    _observeTarget_forEventType_: {
        enumerable: false,
        value: function(target, eventType) {

            var listenerTarget;

            if ((listenerTarget = this.actualDOMTargetForEventTypeOnTarget(eventType, target)) && (!this._observedTarget_byEventType_[eventType] || !this._observedTarget_byEventType_[eventType][listenerTarget.uuid])) {
                if (!this._observedTarget_byEventType_[eventType]) {
                    this._observedTarget_byEventType_[eventType] = {};
                }
                this._observedTarget_byEventType_[eventType][listenerTarget.uuid] = this;

                listenerTarget.nativeAddEventListener(eventType, this, true);
            }
            // console.log("started listening: ", eventType, listenerTarget)
        }
    },
/**
  @private
*/
    _stopObservingTarget_forEventType_: {
        enumerable: false,
        value: function(target, eventType) {

            var listenerTarget;

            listenerTarget = this.actualDOMTargetForEventTypeOnTarget(eventType, target);
            if (listenerTarget) {
                delete this._observedTarget_byEventType_[eventType][listenerTarget.uuid];
                listenerTarget.nativeRemoveEventListener(eventType, this, true);
            }
            // console.log("stopped listening: ", eventType, window.uuid)
        }
    },

    _activationHandler: {
        enumerable: true,
        value: null
    },

    // Toggle listening for EventManager
/**
  @private
*/
    _listenToWindow: {
        enumerable: false,
        value: function(aWindow) {

            // We use our own function to handle activation events so it's not inadvertently
            // removed as a listener when removing the last listener that may have also been observing
            // the same eventType of an activation event
            if (!this._activationHandler) {
                var eventManager = this;
                this._activationHandler = function(evt) {
                    var eventType = evt.type;

                    // Don't double call handleEvent if we're already handling it becasue we have a registered listener
                    if (!eventManager.registeredEventListeners[eventType]) {
                        eventManager.handleEvent(evt);
                    }
                }
            }

            // The EventManager needs to handle "gateway/pointer/activation events" that we
            // haven't let children listen for yet
            // when the EM handles them eventually it will need to allow
            // all components from the event target to the window to prepareForPointerEvents
            // before finding event handlers that were registered for these events
            if (aWindow.Touch) {
                // TODO on iOS the touch doesn't capture up at the window, just the document; interesting
                aWindow.document.nativeAddEventListener("touchstart", this._activationHandler, true);
            } else {
                aWindow.document.nativeAddEventListener("mousedown", this._activationHandler, true);
                //TODO also should accommodate mouseenter/mouseover possibly
            }

            if (this.application) {

                var applicationLevelEvents = this.registeredEventListenersOnTarget_(this.application),
                    eventType;

                for (eventType in applicationLevelEvents) {
                    this._observeTarget_forEventType_(aWindow, eventType);
                }
            }

        }
    },
/**
  @private
*/
    _stopListeningToWindow: {
        enumerable: false,
        value: function(aWindow) {

            var applicationLevelEvents = this.registeredEventListenersOnTarget_(this.application),
                windowLevelEvents = this.registeredEventListenersOnTarget_(aWindow),
                eventType;

            for (eventType in applicationLevelEvents) {
                this._stopObservingTarget_forEventType_(aWindow, eventType);
            }

            for (eventType in windowLevelEvents) {
                this._stopObservingTarget_forEventType_(aWindow, eventType);
            }
        }
    },
/**
    @function
    */
    reset: {
        enumerable: false,
        value: function() {
            var eventType,
                eventRegistration,
                targetUUID,
                targetRegistration;

            for (eventType in this.registeredEventListeners) {
                eventRegistration = this.registeredEventListeners[eventType];
                for (targetUUID in eventRegistration.targets) {
                    targetRegistration = eventRegistration.targets[targetUUID];
                    this._stopObservingTarget_forEventType_(targetRegistration.target, eventType);
                }
            }

            this.registeredEventListeners = {};

            // TODO for each component claiming a pointer, force them to surrender the pointer?
            this._claimedPointers = {};
        }
    },
/**
    @function
    */
    unload: {
        enumerable: false,
        value: function() {
            this._stopListening();
        }
    },
/**
    @function
    */
    methodNameForBubblePhaseOfEventType: {
        enumerable: false,
        value: (function(_methodNameForBubblePhaseByEventType_) {
            return function(eventType, identifier) {
                var eventTypeKey = identifier ? eventType + "+" + identifier : eventType;
                return _methodNameForBubblePhaseByEventType_[eventTypeKey] || (_methodNameForBubblePhaseByEventType_[eventTypeKey] = ("handle" + (identifier ? identifier.toCapitalized() : "") + eventType.toCapitalized()));
            };
        })({})
    },

    _methodNameForCapturePhaseByEventType_: {
        value:{}
    },
    methodNameForCapturePhaseOfEventType: {
        enumerable: false,
        value: (function(_methodNameForCapturePhaseByEventType_) {
            return function(eventType, identifier) {
                var eventTypeKey = identifier ? eventType + "+" + identifier : eventType;
                return _methodNameForCapturePhaseByEventType_[eventTypeKey] || (_methodNameForCapturePhaseByEventType_[eventTypeKey] = "capture" + (identifier ? identifier.toCapitalized() : "") + eventType.toCapitalized());
            };
        })({})
    },

    // Claimed pointer information
/**
  @private
*/
    _claimedPointers: {
        enumerable: false,
        distinct: true,
        value: {}
    },
/**
    The component claiming the specified pointer component
    @function
    @param {String} pointer The pointer identifier in question
    @returns component
    */
    componentClaimingPointer: {
        value: function(pointer) {
            return this._claimedPointers[pointer];
        }
    },
/**
    Whether or not the specified pointer identifier is claimed by the specified component.
    @function
    @param {String} pointer The pointer identifier in question
    @param {String} component The component to interrogate regarding ownership of the specified pointer
    @returns boolean
    */
    isPointerClaimedByComponent: {
        value: function(pointer, component) {

            if (!component) {
                throw "Must specify a valid component to see if it claims the specified pointer, '" + component + "' is not valid.";
            }

            return this._claimedPointers[pointer] === component;
        }
    },
/**
    Claims that a pointer, referred to by the specified pointer identifier, is claimed by the specified component.
    This does not give the component exclusive use of the pointer per se, but does indicate that the component
    is acting in a manner where it expects to be the only one performing major actions in response to this pointer.
    Other components should respect the claimant's desire to react to this pointer in order to prevent an entire
    hierarchy of components from reacting to a pointer in potentially conflicting ways.

    If the pointer is currently claimed by another component that component is asked to surrender the pointer,
    which is may or may not agree to do.

    @function
    @param {String} pointer The pointer identifier to claim
    @param {String} component The component that is claiming the specified pointer
    @returns boolean Whether or not the pointer was successfully claimed.
    */
    claimPointer: {
        value: function(pointer, component) {

            // if null, undefined, false: complain
            if (!pointer && pointer !== 0) {
                throw "Must specify a valid pointer to claim, '" + pointer + "' is not valid.";
            }

            if (!component) {
                throw "Must specify a valid component to claim a pointer, '" + component + "' is not valid.";
            }

            var claimant = this._claimedPointers[pointer];

            if (claimant === component) {
                // Already claimed this pointer ourselves
                return true;

            } else if (!claimant) {
                //Nobody has claimed it; go for it
                this._claimedPointers[pointer] = component;
                return true;

            } else {
                //Somebody else has claimed it; ask them to surrender
                if (claimant.surrenderPointer(pointer, component)) {
                    this._claimedPointers[pointer] = component;
                    return true;
                } else {
                    return false;
                }
            }

        }
    },
/**
    Forfeits the specified pointer identifier from the specified component.
    The specified component must be the current claimant.
    @function
    @param {String} pointer The pointer identifier in question
    @param {String} component The component that is trying to forfeit the specified pointer
    */
    forfeitPointer: {
        value: function(pointer, component) {
            if (component === this._claimedPointers[pointer]) {
                delete this._claimedPointers[pointer];
            } else {
                throw "Not allowed to forfeit pointer '" + pointer + "' claimed by another component";
            }

        }
    },
/**
    Forfeits all pointers from the specified component.
    @function
    @param {Component} component
    */
    forfeitAllPointers: {
        value: function(component) {

            var pointerKey,
                claimant;

            for (pointerKey in this._claimedPointers) {
                claimant = this._claimedPointers[pointerKey];
                if (component === claimant) {
                    // NOTE basically doing the work ofr freePointerFromComponent
                    delete this._claimedPointers[pointerKey];
                }
            }

        }
    },

    // Pointer Storage for calculating velocities
/**
  @private
*/
    _isStoringPointerEvents: {
        enumerable: false,
        value: false
    },
 /**
        @type {Function}
        @default {Boolean} false
    */
    isStoringPointerEvents: {
        enumerable: true,
        get: function () {
            return this._isStoringPointerEvents;
        },
        set: function (value) {
            if (value === true) {
                if (!this._isStoringPointerEvents) {
                    this._isStoringPointerEvents = true;
                    if (window.Touch) {
                        Object.defineProperty(Touch.prototype, "velocity", {
                            get: function () {
                                return defaultEventManager.pointerMotion(this.identifier).velocity;
                            },
                            set: function () {
                            }
                        });
                    }
                }
            } else {
                this._isStoringPointerEvents = false;
                this._pointerStorage.memory = {};
                this._isMouseDragging = false;
            }
        }
    },
/**
  @private
*/
    _isStoringMouseEventsWhileDraggingOnly: {
        enumerable: false,
        value: true
    },

/**
        @type {Function}
        @default {Boolean} true
    */
    isStoringMouseEventsWhileDraggingOnly: {
        enumerable: true,
        get: function () {
            return this._isStoringMouseEventsWhileDraggingOnly;
        },
        set: function (value) {
            this._isStoringMouseEventsWhileDraggingOnly = (value === true) ? true : false;
        }
    },
/**
  @private
*/
    _isMouseDragging: {
        enumerable: false,
        value: false
    },
/**
  @private
*/
    _pointerStorage: {
        enumerable: false,
        value: {
            memory: {},
            add: function (identifier, data) {
                if (!this.memory[identifier]) {
                    this.memory[identifier] = {
                        data: new Array(32),
                        size: 0,
                        pos: 0
                    };
                }
                this.memory[identifier].data[this.memory[identifier].pos] = data;
                if (this.memory[identifier].size < this.memory[identifier].data.length) {
                    this.memory[identifier].size++;
                }
                this.memory[identifier].pos = (this.memory[identifier].pos + 1) % this.memory[identifier].data.length;
            },
            remove: function (identifier) {
                delete this.memory[identifier];
            },
            clear: function (identifier) {
                if (this.memory[identifier]) {
                    this.memory[identifier].size = 0;
                }
            },
            getMemory: function (identifier) {
                return this.memory[identifier];
            },
            isStored: function (identifier) {
                return (this.memory[identifier] && (this.memory[identifier].size > 0));
            },
            storeEvent: function(event) {
                var i;
                switch (event.type) {
                    case "mousedown":
                        defaultEventManager._isMouseDragging = true;
                        // TODO not sure if we are supposed to gave a break here or not. There wasn't
                        // but I'd like a comment to assuage my fears that it was omitted by mistake
                    case "mousemove":
                        if (defaultEventManager._isStoringMouseEventsWhileDraggingOnly) {
                            if (defaultEventManager._isMouseDragging) {
                                this.add("mouse", {
                                    clientX: event.clientX,
                                    clientY: event.clientY,
                                    timeStamp: event.timeStamp
                                });
                                Object.defineProperty(event, "velocity", {
                                    get: function () {
                                        return defaultEventManager.pointerMotion("mouse").velocity;
                                    },
                                    set: function () {
                                    }
                                });
                            }
                        } else {
                            this.add("mouse", {
                                clientX: event.clientX,
                                clientY: event.clientY,
                                timeStamp: event.timeStamp
                            });
                            Object.defineProperty(event, "velocity", {
                                get: function () {
                                    return defaultEventManager.pointerMotion("mouse").velocity;
                                },
                                set: function () {
                                }
                            });
                        }
                        break;
                    case "mouseup":
                        this.add("mouse", {
                            clientX: event.clientX,
                            clientY: event.clientY,
                            timeStamp: event.timeStamp
                        });
                        Object.defineProperty(event, "velocity", {
                            get: function () {
                                return defaultEventManager.pointerMotion("mouse").velocity;
                            },
                            set: function () {
                            }
                        });
                        break;
                    case "touchstart":
                    case "touchmove":
                        for (i = 0; i < event.touches.length; i++) {
                            this.add(event.touches[i].identifier, {
                                clientX: event.touches[i].clientX,
                                clientY: event.touches[i].clientY,
                                timeStamp: event.timeStamp
                            });
                        }
                        break;
                    case "touchend":
                        for (i = 0; i < event.changedTouches.length; i++) {
                            this.add(event.changedTouches[i].identifier, {
                                clientX: event.changedTouches[i].clientX,
                                clientY: event.changedTouches[i].clientY,
                                timeStamp: event.timeStamp
                            });
                        }
                        break;
                }
            },
            removeEvent: function(event) {
                var i;
                switch (event.type) {
                    case "mouseup":
                        defaultEventManager._isMouseDragging = false;
                        if (defaultEventManager._isStoringMouseEventsWhileDraggingOnly) {
                            this.clear("mouse");
                        }
                        break;
                    case "touchend":
                        for (i = 0; i < event.changedTouches.length; i++) {
                            this.remove(event.changedTouches[i].identifier);
                        }
                        break;
                }
            }
        }
    },
/**
  @private
*/
    _getPointerVelocityData: {
        enumerable: false,
        value: function (identifier) {
            var i = 0,
                memory,
                memoryLength,
                evt,
                startTime,
                iTime,
                oldTime, oldX, oldY, squaredModule,
                difTime = 0,
                addData = true,
                data = {
                    x: [],
                    y: [],
                    time: []
                };

            memory = defaultEventManager._pointerStorage.getMemory(identifier);
            memoryLength = memory.data.length;
            evt = memory.data[((memory.pos - 1) + memoryLength) % memoryLength];
            startTime = iTime = oldTime = evt.timeStamp;
            oldX = evt.clientX;
            oldY = evt.clientY;
            while (addData && (iTime > startTime - 350) && (i < memory.size)) {
                evt = memory.data[((memory.pos - i - 1) + memoryLength) % memoryLength];
                iTime = evt.timeStamp;
                squaredModule = oldX * oldX + oldY * oldY;
                if ((squaredModule > 2) && ((oldTime - iTime) <= 50)) {
                    data.x.push(evt.clientX);
                    data.y.push(evt.clientY);
                    data.time.push(iTime);
                    oldTime = iTime;
                    oldX = evt.clientX;
                    oldY = evt.clientY;
                    i++;
                } else {
                    addData = false;
                }
            }
            return data;
        }
    },
/**
  @private
*/
    _fitPointerCurve: {
        enumerable: false,
        value: function (bezier, data) {
            var pos, a, b, c, d, epsilon = 0.0001,
                dl = data.length, e, t, v, t2, t3, i,
                f0, c0, d0, b0, a0, s0, e0,
                f1, c1, d1, b1, a1, s1, e1,
                f2, c2, d2, b2, a2, s2, e2,
                f3, c3, d3, b3, a3, s3, e3;
            do {
                f0 = 0;
                c0 = 0;
                d0 = 0;
                b0 = 0;
                a0 = 0;
                s0 = 0;
                f1 = 0;
                c1 = 0;
                d1 = 0;
                b1 = 0;
                a1 = 0;
                s1 = 0;
                f2 = 0;
                c2 = 0;
                d2 = 0;
                b2 = 0;
                a2 = 0;
                s2 = 0;
                f3 = 0;
                c3 = 0;
                d3 = 0;
                b3 = 0;
                a3 = 0;
                s3 = 0;
                for (i = 0; i < dl; i++) {
                    e = data[i];
                    t = e.t;
                    t2 = t * t;
                    t3 = t2 * t;
                    v = e.v;
                    e0 = epsilon * (6 * (t2 - t) - t3 + 2);
                    e1 = epsilon * 6 * (t3 - 2 * t2 + t);
                    e2 = epsilon * 6 * (t2 - t3);
                    e3 = epsilon * 2 * t3;
                    s0 += e0 * e0;
                    s1 += e1 * e1;
                    s2 += e2 * e2;
                    s3 += e3 * e3;
                    f0 += v * e0;
                    f1 += v * e1;
                    f2 += v * e2;
                    f3 += v * e3;
                    d0 -= e0;
                    d1 -= e1;
                    d2 -= e2;
                    d3 -= e3;
                    c0 -= e0 * t;
                    c1 -= e1 * t;
                    c2 -= e2 * t;
                    c3 -= e3 * t;
                    b0 -= e0 * t2;
                    b1 -= e1 * t2;
                    b2 -= e2 * t2;
                    b3 -= e3 * t2;
                    a0 -= e0 * t3;
                    a1 -= e1 * t3;
                    a2 -= e2 * t3;
                    a3 -= e3 * t3;
                }
                epsilon *= 2;
            } while (s0 === 0 || s1 === 0 || s2 === 0 || s3 === 0);
            t = epsilon / s0;
            f0 *= t;
            c0 *= t * 3;
            d0 *= t;
            b0 *= t * 3;
            a0 *= t;
            t = epsilon / s1;
            f1 *= t;
            c1 *= t * 3;
            d1 *= t;
            b1 *= t * 3;
            a1 *= t;
            t = epsilon / s2;
            f2 *= t;
            c2 *= t * 3;
            d2 *= t;
            b2 *= t * 3;
            a2 *= t;
            t = epsilon / s3;
            f3 *= t;
            c3 *= t * 3;
            d3 *= t;
            b3 *= t * 3;
            a3 *= t;
            s0 = bezier[0];
            s1 = bezier[1];
            s2 = bezier[2];
            s3 = bezier[3];
            a = (s1 - s2) * 3 + s3 - s0;
            b = s0 + s2 - 2 * s1;
            c = s1 - s0;
            d = s0;
            for (i = 0; i < 20; i++) {
                t = f0 + d * d0 + c * c0 + b * b0 + a * a0;
                s0 += t;
                d += t;
                a -= t;
                b += t;
                c -= t;
                t = f1 + d * d1 + c * c1 + b * b1 + a * a1;
                s1 += t;
                a += t * 3;
                b -= t + t;
                c += t;
                t = f2 + d * d2 + c * c2 + b * b2 + a * a2;
                s2 += t;
                a -= t * 3;
                b += t;
                t = f3 + d * d3 + c * c3 + b * b3 + a * a3;
                s3 += t;
                a += t;
            }
            bezier[0] = s0;
            bezier[1] = s1;
            bezier[2] = s2;
            bezier[3] = s3;
        }
    },
/**
  @private
*/
    _pointerBezierValue: {
        enumerable: false,
        value: function (t, bezier) {
            var it = 1 - t;
            return it * it * it * bezier[0] + 3 * it * it * t * bezier[1] + 3 * it * t * t * bezier[2] + t * t * t * bezier[3];
        }
    },
/**
  @private
*/
    _calculatePointerVelocity: {
        enumerable: false,
        value: function (time, position) {
            var length = time.length,
                timeMin = time[0],
                timeMax = time[0],
                timeInterval,
                iMin = 0, i;
            for (i = 1; i < length; i++) {
                if (time[i] < timeMin) {
                    timeMin = time[i];
                    iMin = i;
                }
            }
            timeInterval = timeMax - timeMin;
            if (timeInterval) {
                if (length > 5) {
                    var s, e, bezier, data = [];
                    for (i = 0; i < length; i++) {
                        data[i] = {
                            v: position[i],
                            t: (time[i] - timeMin) / timeInterval
                        };
                    }
                    s = data[iMin].v;
                    e = data[0].v;
                    bezier = [s, (s * 2 + e) / 3, (s + e * 2) / 3, e];
                    this._fitPointerCurve(bezier, data);
                    return (this._pointerBezierValue(0.8, bezier) - this._pointerBezierValue(0.6, bezier)) * 5000 / timeInterval;
                } else if (length > 1) {
                    return (position[0] - position[iMin]) * 1000 / timeInterval;
                } else {
                    return 0;
                }
            } else {
                return 0;
            }
        }
    },
/**
    @function
    @param {attribute} identifier
    */
    pointerMotion: {
        value: function (identifier) {
            if (defaultEventManager._pointerStorage.isStored(identifier)) {
                var velocity = {};
                Object.defineProperties(velocity, {
                    _data: {
                        enumerable: false,
                        writable: true,
                        value: null
                    },
                    _x: {
                        enumerable: false,
                        writable: true,
                        value: null
                    },
                    _y: {
                        enumerable: false,
                        writable: true,
                        value: null
                    },
                    _speed: {
                        enumerable: false,
                        writable: true,
                        value: null
                    },
                    _angle: {
                        enumerable: false,
                        writable: true,
                        value: null
                    },
                    x: {
                        get: function () {
                            if (this._x === null) {
                                if (this._data === null) {
                                    this._data = defaultEventManager._getPointerVelocityData(identifier);
                                }
                                this._x = defaultEventManager._calculatePointerVelocity(this._data.time, this._data.x);
                            }
                            return this._x;
                        },
                        set: function () {
                        }
                    },
                    y: {
                        get: function () {
                            if (this._y === null) {
                                if (this._data === null) {
                                    this._data = defaultEventManager._getPointerVelocityData(identifier);
                                }
                                this._y = defaultEventManager._calculatePointerVelocity(this._data.time, this._data.y);
                            }
                            return this._y;
                        },
                        set: function () {
                        }
                    },
                    speed: {
                        get: function () {
                            if (this._speed === null) {
                                this._speed = Math.sqrt(this.x * this.x + this.y * this.y);
                            }
                            return this._speed;
                        },
                        set: function () {
                        }
                    },
                    angle: {
                        get: function () {
                            if (this._angle === null) {
                                this._angle = Math.atan2(this.y, this.x);
                            }
                            return this._angle;
                        },
                        set: function () {
                        }
                    }
                });
                return {
                    velocity: velocity
                };
            } else {
                return undefined;
            }
        }
    },
    monitorDOMModificationInEventHandling: {value: false},
    domModificationEventHandler: { value: Montage.create(Montage, {
        handleEvent: {value : function(event) {
            throw "DOM Modified";
        }},
        captureDOMSubtreeModified: {value: function(event) {
            throw "DOMSubtreeModified";
        }},
        captureDOMAttrModified: {value: function(event) {
            throw "DOMAttrModified";
        }},
        captureDOMCharacterDataModified: { value: function(event) {
            throw "DOMCharacterDataModified";
        }}})
    },
    // Event Handling
    /**
    @function
    @param {Event} event The handled event.
    */
    handleEvent: {
        enumerable: false,
        value: function(event) {

            if (this.monitorDOMModificationInEventHandling) {
                document.body.addEventListener("DOMSubtreeModified", this.domModificationEventHandler, true);
                document.body.addEventListener("DOMAttrModified", this.domModificationEventHandler, true);
                document.body.addEventListener("DOMCharacterDataModified", this.domModificationEventHandler, true);
            }


            var loadedWindow,
                i,
                iTarget,
                listenerEntries,
                j,
                jListenerEntry,
                listenerEntryKeys,
                listenerEntryKeyCount,
                jListener,
                eventPath,
                eventType = event.type,
                eventBubbles = event.bubbles,
                captureMethodName,
                bubbleMethodName,
                identifierSpecificCaptureMethodName,
                identifierSpecificBubbleMethodName,
                mutableEvent,
                touchCount;

            if ("DOMContentLoaded" === eventType) {
                loadedWindow = event.target.defaultView;
                if (loadedWindow && this._windowsAwaitingFinalRegistration[loadedWindow.uuid]) {
                    this._finalizeWindowRegistration(loadedWindow);
                    // Stop listening for DOMContentLoaded on this target
                    // Otherwise the eventManager's handleEvent will be called
                    // again from within here when the eventManager is found
                    // to be a listener for this event when we find the listeners
                    event.target.removeEventListener("DOMContentLoaded", this, true);
                }
            }

            if (typeof event.propagationStopped !== "boolean") {
                mutableEvent = MutableEvent.fromEvent(event);
            } else {
                mutableEvent = event;
            }

            // Prepare any components associated with elements that may receive this event
            // They need to registered there listeners before the next step, which is to find the components that
            // observing for this type of event
            if ("mousedown" === eventType || "touchstart" === eventType) {
                if (mutableEvent.changedTouches) {
                    touchCount = mutableEvent.changedTouches.length;
                    for (i = 0; i < touchCount; i++) {
                        this._prepareComponentsForActivationEventTarget(mutableEvent.changedTouches[i].target);
                    }
                } else {
                    this._prepareComponentsForActivationEventTarget(mutableEvent.target);
                }
            }

            eventPath = this._eventPathForTarget(mutableEvent.target);

            // use most specific handler method available, possibly based upon the identifier of the event target
            if (mutableEvent.target.identifier) {
                identifierSpecificCaptureMethodName = this.methodNameForCapturePhaseOfEventType(eventType, mutableEvent.target.identifier);
            } else {
                identifierSpecificCaptureMethodName = null;
            }

            if (mutableEvent.target.identifier) {
                identifierSpecificBubbleMethodName = this.methodNameForBubblePhaseOfEventType(eventType, mutableEvent.target.identifier);
            } else {
                identifierSpecificBubbleMethodName = null;
            }

            captureMethodName = this.methodNameForCapturePhaseOfEventType(eventType);
            bubbleMethodName = this.methodNameForBubblePhaseOfEventType(eventType);

            // Let the delegate handle the event first
            if (this.delegate && typeof this.delegate.willDistributeEvent === FUNCTION_TYPE) {
                this.delegate.willDistributeEvent(mutableEvent);
            }

            if (this._isStoringPointerEvents) {
                this._pointerStorage.storeEvent(mutableEvent);
            }

            // Capture Phase Distribution
            mutableEvent.eventPhase = CAPTURING_PHASE;
            // The event path we generate is from bottom to top, capture needs to traverse this backwards
            for (i = eventPath.length - 1; !mutableEvent.propagationStopped && (iTarget = eventPath[i]); i--) {
                mutableEvent.currentTarget = iTarget;

                listenerEntries = this.registeredEventListenersForEventType_onTarget_(eventType, iTarget);
                if (!listenerEntries) {
                    continue;
                }
                listenerEntryKeys = Object.keys(listenerEntries);

                for (j = 0; listenerEntries && !mutableEvent.immediatePropagationStopped && (jListenerEntry = listenerEntries[listenerEntryKeys[j]]); j++) {

                    if (!jListenerEntry.capture) {
                        continue;
                    }

                    jListener = jListenerEntry.listener;

                    if (identifierSpecificCaptureMethodName && typeof jListener[identifierSpecificCaptureMethodName] === FUNCTION_TYPE) {
                        jListener[identifierSpecificCaptureMethodName](mutableEvent);
                    } else if (typeof jListener[captureMethodName] === FUNCTION_TYPE) {
                        jListener[captureMethodName](mutableEvent);
                    } else if (typeof jListener.handleEvent === FUNCTION_TYPE) {
                        jListener.handleEvent(mutableEvent);
                    } else if (typeof jListener === FUNCTION_TYPE) {
                        jListener.call(iTarget, mutableEvent);
                    }
                }
            }

            // At Target Distribution
            if (!mutableEvent.propagationStopped) {
                mutableEvent.eventPhase = AT_TARGET;
                mutableEvent.currentTarget = iTarget = mutableEvent.target;

                listenerEntries = this.registeredEventListenersForEventType_onTarget_(eventType, iTarget);
                if (listenerEntries) {
                    listenerEntryKeys = Object.keys(listenerEntries);

                    for (j = 0; listenerEntries && !mutableEvent.immediatePropagationStopped && (jListenerEntry = listenerEntries[listenerEntryKeys[j]]); j++) {

                        jListener = jListenerEntry.listener;

                        if (jListenerEntry.capture) {
                            if (identifierSpecificCaptureMethodName && typeof jListener[identifierSpecificCaptureMethodName] === FUNCTION_TYPE) {
                                jListener[identifierSpecificCaptureMethodName](mutableEvent);
                            } else if (typeof jListener[captureMethodName] === FUNCTION_TYPE) {
                                jListener[captureMethodName](mutableEvent);
                            } else if (typeof jListener.handleEvent === FUNCTION_TYPE) {
                                jListener.handleEvent(mutableEvent);
                            } else if (typeof jListener === FUNCTION_TYPE) {
                                jListener.call(iTarget, mutableEvent);
                            }
                        }

                        if (jListenerEntry.bubble) {
                            if (identifierSpecificBubbleMethodName && typeof jListener[identifierSpecificBubbleMethodName] === FUNCTION_TYPE) {
                                jListener[identifierSpecificBubbleMethodName](mutableEvent);
                            } else if (typeof jListener[bubbleMethodName] === FUNCTION_TYPE) {
                                jListener[bubbleMethodName](mutableEvent);
                            } else if (typeof jListener.handleEvent === FUNCTION_TYPE) {
                                jListener.handleEvent(mutableEvent);
                            } else if (typeof jListener === FUNCTION_TYPE) {
                                jListener.call(iTarget, mutableEvent);
                            }
                        }

                    }
                }
            }

            // Bubble Phase Distribution
            mutableEvent.eventPhase = BUBBLING_PHASE;
            for (i = 0; eventBubbles && !mutableEvent.propagationStopped && (iTarget = eventPath[i]); i++) {
                mutableEvent.currentTarget = iTarget;

                listenerEntries = this.registeredEventListenersForEventType_onTarget_(eventType, iTarget);
                if (!listenerEntries) {
                    continue;
                }
                listenerEntryKeys = Object.keys(listenerEntries);

                for (j = 0; listenerEntries && !mutableEvent.immediatePropagationStopped && (jListenerEntry = listenerEntries[listenerEntryKeys[j]]); j++) {

                    if (!jListenerEntry.bubble) {
                        continue;
                    }

                    jListener = jListenerEntry.listener;

                    if (identifierSpecificBubbleMethodName && typeof jListener[identifierSpecificBubbleMethodName] === FUNCTION_TYPE) {
                        jListener[identifierSpecificBubbleMethodName](mutableEvent);
                    } else if (typeof jListener[bubbleMethodName] === FUNCTION_TYPE) {
                        jListener[bubbleMethodName](mutableEvent);
                    } else if (typeof jListener.handleEvent === FUNCTION_TYPE) {
                        jListener.handleEvent(mutableEvent);
                    } else if (typeof jListener === FUNCTION_TYPE) {
                        jListener.call(iTarget, mutableEvent);
                    }
                }
            }

            mutableEvent.eventPhase = NONE;
            mutableEvent.currentTarget = null;

            if (this._isStoringPointerEvents) {
                this._pointerStorage.removeEvent(event);
            }

            if (this.monitorDOMModificationInEventHandling) {
                document.body.removeEventListener("DOMSubtreeModified", this.domModificationEventHandler, true);
                document.body.removeEventListener("DOMAttrModified", this.domModificationEventHandler, true);
                document.body.removeEventListener("DOMCharacterDataModified", this.domModificationEventHandler, true);
            }
        }
    },

    // Ensure that any components associated with DOM elements in the hierarchy between the
    // original activationEvent target and the window are preparedForActionEvents

 /**
  @private
*/
    _prepareComponentsForActivationEventTarget: {
        value: function(eventTarget) {

            var target = eventTarget,
                previousTarget,
                targetView = target && target.defaultView ? target.defaultView : window,
                targetDocument = targetView.document ? targetView.document : document,
                associatedComponent;

            do {

                if (target) {
                    associatedComponent = this.eventHandlerForElement(target);
                    if (associatedComponent) {
                        if (!associatedComponent._preparedForActivationEvents) {

                            associatedComponent._prepareForActivationEvents();
                            associatedComponent._preparedForActivationEvents = true;

                        } else if (associatedComponent._preparedForActivationEvents) {
                            //TODO can we safely stop if we find the currentTarget has already been activated?
                            // I want to say no as the tree above may have changed, but I'm going to give it a try
                            return;
                        }
                    }
                }

                previousTarget = target;

                // We only need to go up to the window, and even that's debateable as the activationEvent system really
                // only pertains to components, which are only ever associated with elements. The root element being the
                // exception which is associated with the document.
                switch (target) {
                    case targetView:
                        target = null;
                        break;
                    case targetDocument:
                        target = targetView;
                        break;
                    case targetDocument.documentElement:
                        target = targetDocument;
                        break;
                    default:
                        target = target.parentNode;
                        break;
                }

            } while (target && previousTarget !== target);

        }
    },
/**
  @private
*/
    _eventPathForTarget: {
        enumerable: false,
        value: function(target) {

            if (!target) {
                return [];
            }

            var targetCandidate  = target,
                targetView = targetCandidate && targetCandidate.defaultView ? targetCandidate.defaultView : window,
                targetDocument = targetView.document ? targetView.document : document,
                targetApplication = this.application,
                previousBubblingTarget,
                eventPath = [];

            do {
                // Don't include the target itself in the event path
                if (targetCandidate !== target) {
                    eventPath.push(targetCandidate);
                }

                previousBubblingTarget = targetCandidate;
                // use the structural DOM hierarchy until we run out of that and need
                // to give listeners on document, window, and application a chance to respond
                switch (targetCandidate) {
                    case targetApplication:
                        targetCandidate = targetCandidate.parentApplication;
                        if (targetCandidate) {
                            targetApplication = targetCandidate;
                        }
                        break;
                    case targetView:
                        targetCandidate = targetApplication;
                        break;
                    case targetDocument:
                        targetCandidate = targetView;
                        break;
                    case targetDocument.documentElement:
                        targetCandidate = targetDocument;
                        break;
                    default:
                        targetCandidate = targetCandidate.parentProperty ? targetCandidate[targetCandidate.parentProperty] : targetCandidate.parentNode;

                        // Run out of hierarchy candidates? go up to the application
                        if (!targetCandidate) {
                            targetCandidate = targetApplication;
                        }

                        break;
                }
            }
            while (targetCandidate && previousBubblingTarget !== targetCandidate);

            return eventPath;
        }
    },
/**
  @private
*/
    _elementEventHandlerByUUID: {
        enumerable: false,
        value: {}
    },
/**
    @function
    @param {Event} anElementEventHandler
    @param {Element} anElement
    */
    registerEventHandlerForElement: {
        enumerable: false,
        value: function(anElementEventHandler, anElement) {
            // console.log("registerEventHandlerForElement",anElementEventHandler,anElementEventHandler.uuid,anElement)
            var oldEventHandler = this.eventHandlerForElement(anElement);
            // unreference unused event handlers
            if (oldEventHandler) {
                this.unregisterEventHandlerForElement(anElement);
            }
            this._elementEventHandlerByUUID[(anElement.eventHandlerUUID = anElementEventHandler.uuid)] = anElementEventHandler;
        }
    },
/**
    @function
    @param {Element} anElement
    */
    unregisterEventHandlerForElement: {
        enumerable: false,
        value: function(anElement) {
            delete this._elementEventHandlerByUUID[anElement.eventHandlerUUID];
            delete anElement.eventHandlerUUID;
        }
    },
/**
    @function
    @param {Element} anElement
    @returns this._elementEventHandlerByUUID[anElement.eventHandlerUUID]
    */
    eventHandlerForElement: {
        enumerable: false,
        value: function(anElement) {
            return this._elementEventHandlerByUUID[anElement.eventHandlerUUID];
        }
    }

});

} // client-side

