/*global Window,Document,Element,Event,Components,Touch */

/**
 * @author Lea Verou
 * @license MIT
 * @see http://leaverou.github.com/chainvas/
 */

/**
 * @module montage/core/event/event-manager
 * @requires montage/core/core
 * @requires montage/core/uuid
 * @requires montage/core/uuid
 * @requires montage/core/event/mutable-event
 * @requires montage/core/serialization
 * @requires montage/core/event/action-event-listener
 */

var Montage = require("../core").Montage,
    UUID = require("../uuid"),
    MutableEvent = require("./mutable-event").MutableEvent,
    Serializer = require("core/serialization/serializer/montage-serializer").MontageSerializer,
    Deserializer = require("core/serialization/deserializer/montage-deserializer").MontageDeserializer,
    defaultEventManager;

// XXX Does not presently function server-side
if (typeof window !== "undefined") { // client-side
    // jshint -W015
    /* This is to handle browsers that have TouchEvents but don't have the global constructor function Touch */
    if (typeof window.Touch === "undefined" && "ontouchstart" in window) {
        window.Touch = function () {};

        (function () {
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

    var EventListenerDescriptor = Montage.specialize({
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

    var _PointerStorageMemoryEntry = Montage.specialize({
        constructor: {
            value: function (identifier) {
                this.data = new Array(32);
                this.velocity = {velocity: (new _PointerVelocity()).initWithIdentifier(identifier)};
                return this;
            }
        },
        data: {
            enumerable: false,
            writable: true,
            value: null
        },
        size: {
            enumerable: false,
            writable: true,
            value: 0
        },
        pos: {
            enumerable: false,
            writable: true,
            value: 0
        },
        velocity: {
            enumerable: false,
            writable: true,
            value: 0
        }

    });

    var _StoredEvent = Montage.specialize({
        constructor: {
            value: function (clientX, clientY, timeStamp) {
                this.clientX = clientX;
                this.clientY = clientY;
                this.timeStamp = timeStamp;
                return this;
            }
        },
        clientX: {
            enumerable: false,
            writable: true,
            value: null
        },
        clientY: {
            enumerable: false,
            writable: true,
            value: 0
        },
        timeStamp: {
            enumerable: false,
            writable: true,
            value: 0
        }
    });

    var _PointerStorage = Montage.specialize({

        memory: {
            value: {}
        },
        add: {
            value: function (identifier, clientX, clientY, timeStamp) {
                var identifierEntry;
                if (!(identifierEntry = this.memory[identifier])) {
                    identifierEntry = this.memory[identifier] = new _PointerStorageMemoryEntry(identifier);
                }
                if (!(data = identifierEntry.data[identifierEntry.pos])) {
                    data = identifierEntry.data[identifierEntry.pos] = new _StoredEvent(clientX, clientY, timeStamp);
                }
                else {
                    data.clientX = clientX;
                    data.clientY = clientY;
                    data.timeStamp = timeStamp;
                }
                if (identifierEntry.size < identifierEntry.data.length) {
                    identifierEntry.size++;
                }
                identifierEntry.pos = (identifierEntry.pos + 1) % identifierEntry.data.length;
            }
        },
        remove: {
            value: function (identifier) {
                delete this.memory[identifier];
            }
        },
        clear: {
            value: function (identifier) {
                if (this.memory[identifier]) {
                    this.memory[identifier].size = 0;
                    this.memory[identifier].velocity.velocity.clearCache();
                }
            }
        },
        getMemory: {
            value: function (identifier) {
                return this.memory[identifier];
            }
        },
        isStored: {
            value: function (identifier) {
                return (this.memory[identifier] && (this.memory[identifier].size > 0));
            }
        },

        /**
         * Created a dedicated type, _PointerVelocity and cached the instance of _PointerVelocity used per identifier,
         * which is typically mouse/touch. This
         */

        pointerVelocity: {
            value: function (identifier) {
                if (this.memory[identifier]) {
                    return this.memory[identifier].velocity;
                }
            }
        },
        storeEvent: {
            value: function (event) {
                var i;
                switch (event.type) {
                    case "mousedown":
                        defaultEventManager._isMouseDragging = true;
                    // roll into mousemove. break omitted intentionally.
                    case "mousemove":
                        if (defaultEventManager._isStoringMouseEventsWhileDraggingOnly) {
                            if (defaultEventManager._isMouseDragging) {
                                this.add("mouse", event.clientX, event.clientY, event.timeStamp);
                                Object.defineProperty(event, "velocity", {
                                    get: function () {
                                        return defaultEventManager.pointerMotion("mouse").velocity;
                                    },
                                    set: function () {
                                    }
                                });
                            }
                        } else {
                            this.add("mouse", event.clientX, event.clientY, event.timeStamp);
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
                        this.add("mouse", event.clientX, event.clientY, event.timeStamp);
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
                            this.add(event.touches[i].identifier, event.touches[i].clientX, event.touches[i].clientY, event.timeStamp);
                        }
                        break;
                    case "touchend":
                        for (i = 0; i < event.changedTouches.length; i++) {
                            this.add(event.changedTouches[i].identifier, event.changedTouches[i].clientX, event.changedTouches[i].clientY, event.timeStamp);
                        }
                        break;
                }
            }
        },
        removeEvent: {
            value: function (event) {
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
    });

    var _PointerVelocity = Montage.specialize({
        _identifier: {
            enumerable: false,
            writable: true,
            value: null
        },
        initWithIdentifier: {
            value: function (identifier) {
                this._identifier = identifier;
                return this;
            }
        },
        clearCache: {
            value: function () {
                this._data = this._x = this._y = this._speed = this._angle = null;
                return this;
            }
        },
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
                        this._data = defaultEventManager._getPointerVelocityData(this._identifier);
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
                        this._data = defaultEventManager._getPointerVelocityData(this._identifier);
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

    /*
     eventTypeRegistration[target.uuid] = {target: target, listeners: {}};
     eventTypeRegistration[target.uuid].listeners[listener.uuid] = {listener: listener, capture: useCapture, bubble: !useCapture};
     */
    var _TargetRegistration = function () {
        this.listeners = {};
        return this;
    };

    _TargetRegistration._pool = [];
    _TargetRegistration.checkoutRegistration = function () {
        return (this._pool.length === 0) ? (new this()) : this._pool.pop();
    };
    _TargetRegistration.checkinRegistration = function (aTargetRegistration) {
        aTargetRegistration.target = null;
        //aTargetRegistration.listeners = {};
        this._pool.push(aTargetRegistration);
    };

    Object.defineProperties(_TargetRegistration.prototype,

        {
            target: {
                enumerable: false,
                writable: true,
                value: null
            },
            listeners: {
                enumerable: false,
                writable: true,
                value: null
            }
        }
    );

    var _TargetListenerRegistration = function () {
        return this;
    };

    _TargetListenerRegistration._pool = [];
    _TargetListenerRegistration.checkoutRegistration = function () {
        return (this._pool.length === 0) ? (new this()) : this._pool.pop();
    };
    _TargetListenerRegistration.checkinRegistration = function (aTargetListenerRegistration) {
        aTargetListenerRegistration.listener = null;
        this._pool.push(aTargetListenerRegistration);
    };

    Object.defineProperties(_TargetListenerRegistration.prototype,

        {
            initWithListener: {
                value: function (listener, capture, bubble) {
                    this.listener = listener;
                    this.capture = capture;
                    this.bubble = bubble;
                    return this;
                }
            },
            listener: {
                enumerable: false,
                writable: true,
                value: null
            },
            capture: {
                enumerable: false,
                writable: true,
                value: true
            },
            bubble: {
                enumerable: false,
                writable: true,
                value: false
            }
        }
    );

    Serializer.defineSerializationUnit("listeners", function (serializer, object) {
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

    Deserializer.defineDeserializationUnit("listeners", function (deserializer, object, listeners) {
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
     * @class EventManager
     * @extends Montage
     */
    var EventManager = exports.EventManager = Montage.specialize(/** @lends EventManager.prototype # */ {
        /**
         * @constructs
         */
        constructor: {
            value: function EventManager () {
                this.super();
            }
        },

        /**
         * Utility
         * @see ClipboardEvent http://dev.w3.org/2006/webapi/clipops/clipops.html#event-types-and-details
         * @see DND http://www.w3.org/TR/2010/WD-html5-20101019/dnd.html
         * @see document.implementation.hasFeature("HTMLEvents", "2.0")
         * @see DOM2 http://www.w3.org/TR/DOM-Level-2-Events/events.html
         * @see DOM3 http://dev.w3.org/2006/webapi/DOM-Level-3-Events/html/DOM3-Events.html
         * @see DOM4 http://dvcs.w3.org/hg/domcore/raw-file/tip/Overview.html#events
         * @see GECKO https://developer.mozilla.org/en/Gecko-Specific_DOM_Events
         * @see MSFT defacto standard
         * @see ProgressEvent http://www.w3.org/TR/progress-events/
         * @see TouchEvent http://dvcs.w3.org/hg/webevents/raw-file/tip/touchevents.html
         * @see INPUT http://dev.w3.org/html5/spec/common-input-element-apis.html#common-event-behaviors
         * @see WEBSOCKETS http://www.w3.org/TR/html5/comms.html
         * @see http://www.quirksmode.org/dom/events/index.html
         * @see https://developer.mozilla.org/en/DOM/DOM_event_reference
         */
        eventDefinitions: {
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
                    bubbles: function (target) {
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
                    bubbles: function (target) {
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

        /**
         * @private
         */
        _DOMPasteboardElement: {
            value: null,
            enumerable: false
        },

        /**
         * @property {string} value
         * @private
         */
        _delegate: {
            value: null,
            enumerable: false
        },

        /**
         * @returns {string}
         * @param {string}
         * @default null
         */
        delegate: {
            enumerable: false,
            get: function () {
                return this._delegate;
            },
            set: function (delegate) {
                this._delegate = delegate;
            }
        },

        /**
         * @property {Application} value
         * @private
         */
        _application: {
            value: null,
            enumerable: false
        },

        /**
         * The application object associated with the event manager.
         * @returns {Application}
         * @param {Application}
         * @default null
         *
         * @todo if this changes...we probably need to unregister all the windows
         * we know about and frankly probably the components too
         */
        application: {
            enumerable: false,
            get: function () {
                return this._application;
            },
            set: function (application) {
                this._application = application;
            }
        },

        // Dictionary keyed by event types with the collection of handlers per event type
        // This dictates why the event manager observes events of a particular type

        /**
         * All windows this event Manager may be listening to
         *
         * @property {Array} value
         * @private
         */
        _registeredWindows: {
            value: null,
            enumerable: false
        },

        /**
         * @property {Object} value
         * @private
         */
        _windowsAwaitingFinalRegistration: {
            value: {},
            enumerable: false
        },

        // Initialization

        /**
         * @function
         * @param {external:window} aWindow
         * @returns {EventManager}
         */
        initWithWindow: {
            enumerable: false,
            value: function (aWindow) {
                if (!!this._registeredWindows) {
                    throw "EventManager has already been initialized";
                }

                // TODO do we also complain if no window is given?
                // Technically we don't need one until we start listening for events
                this.registerWindow(aWindow);
                return this;
            }
        },
        /**
         * @function
         * @param {external:window} aWindow
         */
        registerWindow: {
            enumerable: false,
            value: function (aWindow) {

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

                // Keep a reference to the original listener functions

                // Note I think it may be implementation specific how these are implemented
                // so I'd rather preserve any native optimizations a browser has for
                // adding listeners to the document versus and element etc.
                aWindow.Element.prototype.nativeAddEventListener = aWindow.Element.prototype.addEventListener;
                Object.defineProperty(aWindow, "nativeAddEventListener", {
                    configurable: true,
                    value: aWindow.addEventListener
                });
                Object.getPrototypeOf(aWindow.document).nativeAddEventListener = aWindow.document.addEventListener;
                aWindow.XMLHttpRequest.prototype.nativeAddEventListener = aWindow.XMLHttpRequest.prototype.addEventListener;
                if (aWindow.Worker) {
                    aWindow.Worker.prototype.nativeAddEventListener = aWindow.Worker.prototype.addEventListener;
                }
                if (aWindow.MediaController) {
                    aWindow.MediaController.prototype.nativeAddEventListener = aWindow.MediaController.prototype.addEventListener;
                }

                aWindow.Element.prototype.nativeRemoveEventListener = aWindow.Element.prototype.removeEventListener;
                Object.defineProperty(aWindow, "nativeRemoveEventListener", {
                    configurable: true,
                    value: aWindow.removeEventListener
                });
                Object.getPrototypeOf(aWindow.document).nativeRemoveEventListener = aWindow.document.removeEventListener;
                aWindow.XMLHttpRequest.prototype.nativeRemoveEventListener = aWindow.XMLHttpRequest.prototype.removeEventListener;
                if (aWindow.Worker) {
                    aWindow.Worker.prototype.nativeRemoveEventListener = aWindow.Worker.prototype.removeEventListener;
                }
                if (aWindow.MediaController) {
                    aWindow.MediaController.prototype.nativeRemoveEventListener = aWindow.MediaController.prototype.removeEventListener;
                }

                // Redefine listener functions

                Object.defineProperty(aWindow, "addEventListener", {
                    configurable: true,
                    value: (aWindow.XMLHttpRequest.prototype.addEventListener =
                        aWindow.Element.prototype.addEventListener =
                            Object.getPrototypeOf(aWindow.document).addEventListener =
                                function (eventType, listener, useCapture) {
                                    return aWindow.defaultEventManager.registerEventListener(this, eventType, listener, !!useCapture);
                                })
                });

                if (aWindow.Worker) {
                    aWindow.Worker.prototype.addEventListener = aWindow.addEventListener;
                }
                if (aWindow.MediaController) {
                    aWindow.MediaController.prototype.addEventListener = aWindow.addEventListener;
                }

                Object.defineProperty(aWindow, "removeEventListener", {
                    configurable: true,
                    value: (aWindow.XMLHttpRequest.prototype.removeEventListener =
                        aWindow.Element.prototype.removeEventListener =
                            Object.getPrototypeOf(aWindow.document).removeEventListener =
                                function (eventType, listener, useCapture) {
                                    return aWindow.defaultEventManager.unregisterEventListener(this, eventType, listener, !!useCapture);
                                })
                });

                if (aWindow.Worker) {
                    aWindow.Worker.prototype.removeEventListener = aWindow.removeEventListener;
                }
                if (aWindow.MediaController) {
                    aWindow.MediaController.prototype.removeEventListener = aWindow.removeEventListener;
                }

                // In some browsers (Firefox) each element has their own addEventLister/removeEventListener
                // Methodology to find all elements found in Chainvas (now mostly gone from this)
                if (aWindow.HTMLDivElement.prototype.addEventListener !== aWindow.Element.prototype.nativeAddEventListener) {
                    if (aWindow.HTMLElement &&
                        'addEventListener' in aWindow.HTMLElement.prototype
                    ) {
                        var candidates = Object.getOwnPropertyNames(aWindow),
                            candidate, candidatePrototype,
                            i = 0, candidatesLength = candidates.length;
                        for (i; i < candidatesLength; i++) {
                            candidate = candidates[i];
                            if (candidate.match(/^HTML\w*Element$/) && typeof candidate === "function") {
                                candidatePrototype = candidate.prototype;
                                candidatePrototype.nativeAddEventListener = candidatePrototype.addEventListener;
                                candidatePrototype.addEventListener = aWindow.Element.prototype.addEventListener;
                                candidatePrototype.nativeRemoveEventListener = candidatePrototype.removeEventListener;
                                candidatePrototype.removeEventListener = aWindow.Element.prototype.removeEventListener;
                            }
                        }
                    }
                }

                /**
                 * HTML element event handler UUID
                 *
                 * @member external:Element#eventHandlerUUID
                 */
                Montage.defineProperty(aWindow.Element.prototype, "eventHandlerUUID", {
                    value: undefined,
                    enumerable: false
                });

                /**
                 * The component instance directly associated with the specified element.
                 *
                 * @member external:Element#component
                 */
                Montage.defineProperty(aWindow.Element.prototype, "component", {
                    get: function () {
                        return defaultEventManager._elementEventHandlerByUUID[this.eventHandlerUUID];
                    },
                    enumerable: false
                });

                /**
                 * @namespace EventManager
                 * @instance
                 * @global
                 */
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

        _finalizeWindowRegistration: {
            enumerable: false,
            value: function (aWindow) {

                if (this._windowsAwaitingFinalRegistration[aWindow.uuid] !== aWindow) {
                    throw "EventManager wasn't expecting to register this window";
                }

                delete this._windowsAwaitingFinalRegistration[aWindow.uuid];

                this._listenToWindow(aWindow);
                // TODO uninstall DOMContentLoaded listener if all windows finalized
            }
        },
        /**
         * @function
         * @param {external:window} aWindow
         */
        unregisterWindow: {
            enumerable: false,
            value: function (aWindow) {
                if (this._registeredWindows.indexOf(aWindow) < 0) {
                    throw "EventManager cannot unregister an unregistered window";
                }

                this._registeredWindows = this._registeredWindows.filter(function (element) {
                    return (aWindow !== element);
                });

                delete aWindow.defaultEventManager;

                // Restore existing listener functions

                aWindow.Element.prototype.addEventListener = aWindow.Element.prototype.nativeAddEventListener;
                Object.defineProperty(aWindow, "addEventListener", {
                    configurable: true,
                    value: aWindow.nativeAddEventListener
                });
                Object.getPrototypeOf(aWindow.document).addEventListener = aWindow.document.nativeAddEventListener;
                aWindow.XMLHttpRequest.prototype.addEventListener = aWindow.XMLHttpRequest.prototype.nativeAddEventListener;
                if (aWindow.Worker) {
                    aWindow.Worker.prototype.addEventListener = aWindow.Worker.prototype.nativeAddEventListener;
                }

                aWindow.Element.prototype.removeEventListener = aWindow.Element.prototype.nativeRemoveEventListener;
                Object.defineProperty(aWindow, "removeEventListener", {
                    configurable: true,
                    value: aWindow.nativeRemoveEventListener
                });
                Object.getPrototypeOf(aWindow.document).removeEventListener = aWindow.document.nativeRemoveEventListener;
                aWindow.XMLHttpRequest.prototype.removeEventListener = aWindow.XMLHttpRequest.prototype.nativeRemoveEventListener;
                if (aWindow.Worker) {
                    aWindow.Worker.prototype.removeEventListener = aWindow.Worker.prototype.nativeRemoveEventListener;
                }

                // In some browsers (Firefox) each element has their own addEventLister/removeEventListener
                // Methodology to find all elements found in Chainvas
                if (aWindow.HTMLDivElement.prototype.nativeAddEventListener !== aWindow.Element.prototype.addEventListener) {
                    if (aWindow.HTMLElement &&
                        'addEventListener' in aWindow.HTMLElement.prototype &&
                        aWindow.Components &&
                        aWindow.Components.interfaces
                    ) {
                        var candidate, candidatePrototype;

                        for (candidate in Components.interfaces) {
                            if (candidate.match(/^nsIDOMHTML\w*Element$/)) {
                                candidate = candidate.replace(/^nsIDOM/, '');
                                if (candidate = window[candidate]) {
                                    candidatePrototype = candidate.prototype;
                                    candidatePrototype.addEventListener = candidatePrototype.nativeAddEventListener;
                                    delete candidatePrototype.nativeAddEventListener;
                                    candidatePrototype.removeEventListener = candidatePrototype.nativeRemoveEventListener;
                                    delete candidatePrototype.nativeRemoveEventListener;
                                }
                            }
                        }
                    }
                }

                // Delete our references

                delete aWindow.Element.prototype.nativeAddEventListener;
                delete aWindow.nativeAddEventListener;

                delete Object.getPrototypeOf(aWindow.document).nativeAddEventListener;
                delete aWindow.XMLHttpRequest.prototype.nativeAddEventListener;
                if (aWindow.Worker) {
                    delete aWindow.Worker.prototype.nativeAddEventListener;
                }

                delete aWindow.Element.prototype.nativeRemoveEventListener;
                delete aWindow.nativeRemoveEventListener;

                delete Object.getPrototypeOf(aWindow.document).nativeRemoveEventListener;
                delete aWindow.XMLHttpRequest.prototype.nativeRemoveEventListener;
                if (aWindow.Worker) {
                    delete aWindow.Worker.prototype.nativeRemoveEventListener;
                }

                delete aWindow.Element.prototype.eventHandlerUUID;
                delete aWindow.Element.prototype.component;

                this._stopListeningToWindow(aWindow);
            }
        },

        /**
         * @function
         */
        unregisterWindows: {
            enumerable: false,
            value: function () {
                this._registeredWindows.forEach(this.unregisterWindow);
            }
        },

        // Event Handler Registration

        /**
         * Registered event listeners.
         *
         * @example
         * ```json
         * mousedown: {
         *      target.uuid: {
         *          target: target,
         *          listeners: {
         *            bject1.uuid: {listener: Object1, capture: true, bubble: true},
         *              Object2.uuid: {listener: Object2, capture: true, bubble: false},
         *              Object3.uuid: {listener: Object3, capture: false, bubble: true}}}}
         * ```
         *
         * @property {Listeners} value
         * @default {}
         */
        registeredEventListeners: {
            enumerable: false,
            value: {}
        },

        /**
         * Returns a dictionary of all listeners registered for the specified eventType,
         * regardless of the target being observed.
         *
         * @function
         * @param {Event} eventType The event type.
         * @returns null || listeners
         */
        registeredEventListenersForEventType_: {
            value: function (eventType) {
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
         * Returns the dictionary of all listeners registered for
         * the specified eventType on the specified target.
         *
         * @function
         * @param {Event} eventType - The event type.
         * @param {Event} target - The event target.
         * @returns {?ActionEventListener}
         */
        registeredEventListenersForEventType_onTarget_: {
            enumerable: false,
            value: function (eventType, target, application) {

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
         * Returns the dictionary of all listeners registered on
         * the specified target, keyed by eventType.
         *
         * @function
         * @param {Event} target The event target.
         * @returns observedEventListeners
         */
        registeredEventListenersOnTarget_: {
            value: function (target) {

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

        /**
         * This adds the listener to the definitive collection of
         * what targets are being observed for what eventTypes by whom and in what phases.
         * This collection maintained by the EventManager is used throughout
         * the discovery and distribution steps of the event handling system.
         *
         * @function
         * @param {Event} target - The event target.
         * @param {Event} eventType - The event type.
         * @param {Event} listener - The event listener.
         * @param {Event} useCapture - The event capture.
         * @returns returnResult
         */
        registerEventListener: {
            enumerable: false,
            value: function registerEventListener(target, eventType, listener, useCapture) {

                // console.log("EventManager.registerEventListener", target, eventType, listener, useCapture)

                var eventTypeRegistration = this.registeredEventListeners[eventType],
                    targetRegistration,
                    listenerRegistration,
                    phase,
                    isNewTarget = false,
                    returnResult = false;

                if (typeof target.uuid === "undefined") {
                    throw new Error("EventManager cannot observe a target without a uuid: " + (target.outerHTML || target));
                }

                if (!eventTypeRegistration) {
                    // First time this eventType has been requested
                    eventTypeRegistration = this.registeredEventListeners[eventType] = {};
                    (eventTypeRegistration[target.uuid] = _TargetRegistration.checkoutRegistration()).target = target;

                    eventTypeRegistration[target.uuid].listeners[listener.uuid] = _TargetListenerRegistration.checkoutRegistration().initWithListener(listener, useCapture, !useCapture);

                    isNewTarget = true;
                    returnResult = true;
                } else {

                    // Or, the event type was already observed; install this new listener (or at least any new parts)
                    if (!(targetRegistration = eventTypeRegistration[target.uuid])) {
                        (targetRegistration = (eventTypeRegistration[target.uuid] = _TargetRegistration.checkoutRegistration())).target = target;
                        isNewTarget = true;
                    }

                    listenerRegistration = targetRegistration.listeners[listener.uuid];
                    phase = useCapture ? "capture" : "bubble";

                    if (listenerRegistration) {
                        listenerRegistration[phase] = true;
                        returnResult = true;
                    } else {
                        targetRegistration.listeners[listener.uuid] = _TargetListenerRegistration.checkoutRegistration().initWithListener(listener, useCapture, !useCapture)
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
         * This unregisters the listener.
         *
         * @function
         * @param {Event} target - The event target.
         * @param {Event} eventType - The event type.
         * @param {Event} listener - The event listener.
         * @param {Event} useCapture - The event capture.
         */
        unregisterEventListener: {
            enumerable: false,
            value: function unregisterEventListener (target, eventType, listener, useCapture) {

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
                    _TargetListenerRegistration.checkinRegistration(targetRegistration.listeners[listener.uuid]);
                    delete targetRegistration.listeners[listener.uuid];

                    if (Object.keys(targetRegistration.listeners).length === 0) {
                        // If no listeners for this target given this event type; remove this target
                        delete eventTypeRegistration[target.uuid];
                        //Once we get here, listeners structure of 	targetRegistration is empty
                        _TargetRegistration.checkinRegistration(targetRegistration);
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
         * Determines the actual target to observe given a target and an eventType.
         * This correctly decides whether to observe the element specified or
         * to observe some other element to leverage event delegation.
         * This should be consulted whenever starting or stopping the observation of
         * a target for a given eventType.
         *
         * @function
         * @param {Event} eventType
         * @param {Event} target
         * @returns null || target.screen ? target.document : target.ownerDocument
         */
        actualDOMTargetForEventTypeOnTarget: {
            value: function (eventType, target) {

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
                        return /* isWindow*/target.screen ? target.document : target.ownerDocument;
                    } else {
                        return target;
                    }
                }

            }
        },

        /**
         * @private
         */
        _observedTarget_byEventType_: {value: {}},

        // Individual Event Registration

        /**
         * @private
         */
        _observeTarget_forEventType_: {
            enumerable: false,
            value: function (target, eventType) {

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
         * @private
         */
        _stopObservingTarget_forEventType_: {
            enumerable: false,
            value: function (target, eventType) {

                var listenerTarget;

                listenerTarget = this.actualDOMTargetForEventTypeOnTarget(eventType, target);
                if (listenerTarget) {
                    delete this._observedTarget_byEventType_[eventType][listenerTarget.uuid];
                    listenerTarget.nativeRemoveEventListener(eventType, this, true);
                }
                // console.log("stopped listening: ", eventType, window.uuid)
            }
        },

        /**
         * @private
         */
        _activationHandler: {
            enumerable: true,
            value: null
        },

        // Toggle listening for EventManager

        /**
         * @private
         */
        _listenToWindow: {
            enumerable: false,
            value: function (aWindow) {

                // We use our own function to handle activation events so it's not inadvertently
                // removed as a listener when removing the last listener that may have also been observing
                // the same eventType of an activation event
                if (!this._activationHandler) {
                    var eventManager = this;
                    this._activationHandler = function (evt) {
                        var eventType = evt.type,
                            touchCount;

                        // Prepare any components associated with elements that may receive this event
                        // They need to registered there listeners before the next step, which is to find the components that
                        // observing for this type of event
                        if ("focus" === eventType || "mousedown" === eventType || "touchstart" === eventType) {
                            if (evt.changedTouches) {
                                touchCount = evt.changedTouches.length;
                                for (var i = 0; i < touchCount; i++) {
                                    eventManager._prepareComponentsForActivation(evt.changedTouches[i].target);
                                }
                            } else {
                                eventManager._prepareComponentsForActivation(evt.target);
                            }
                        }

                    };
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
                aWindow.document.nativeAddEventListener("focus", this._activationHandler, true);

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
         * @private
         */
        _stopListeningToWindow: {
            enumerable: false,
            value: function (aWindow) {

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
         * @function
         */
        reset: {
            enumerable: false,
            value: function () {
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
         * @function
         */
        unload: {
            enumerable: false,
            value: function () {
                this._stopListening();
            }
        },

        /**
         * @function
         */
        methodNameForBubblePhaseOfEventType: {
            enumerable: false,
            value: (function (_methodNameForBubblePhaseByEventType_) {
                return function (eventType, identifier) {
                    var eventTypeKey = identifier ? eventType + "+" + identifier : eventType;
                    return _methodNameForBubblePhaseByEventType_[eventTypeKey] || (_methodNameForBubblePhaseByEventType_[eventTypeKey] = ("handle" + (identifier ? identifier.toCapitalized() : "") + eventType.toCapitalized()));
                };
            })({})
        },

        /**
         * @private
         */
        _methodNameForCapturePhaseByEventType_: {
            value: {}
        },

        methodNameForCapturePhaseOfEventType: {
            enumerable: false,
            value: (function (_methodNameForCapturePhaseByEventType_) {
                return function (eventType, identifier) {
                    var eventTypeKey = identifier ? eventType + "+" + identifier : eventType;
                    return _methodNameForCapturePhaseByEventType_[eventTypeKey] || (_methodNameForCapturePhaseByEventType_[eventTypeKey] = "capture" + (identifier ? identifier.toCapitalized() : "") + eventType.toCapitalized());
                };
            })({})
        },

        // Claimed pointer information

        /**
         * @private
         */
        _claimedPointers: {
            enumerable: false,
            distinct: true,
            value: {}
        },

        /**
         * The component claiming the specified pointer component
         *
         * @function
         * @param {string} pointer The pointer identifier in question
         * @returns component
         */
        componentClaimingPointer: {
            value: function (pointer) {
                return this._claimedPointers[pointer];
            }
        },

        /**
         * Whether or not the specified pointer identifier is claimed by the
         * specified component.
         *
         * @function
         * @param {string} pointer The pointer identifier in question
         * @param {string} component The component to interrogate regarding
         * ownership of the specified pointer
         * @returns {boolean}
         */
        isPointerClaimedByComponent: {
            value: function (pointer, component) {

                if (!component) {
                    throw "Must specify a valid component to see if it claims the specified pointer, '" + component + "' is not valid.";
                }

                return this._claimedPointers[pointer] === component;
            }
        },

        /**
         * Claims that a pointer, referred to by the specified pointer identifier,
         * is claimed by the specified component.  This does not give the component
         * exclusive use of the pointer per se, but does indicate that the
         * component is acting in a manner where it expects to be the only one
         * performing major actions in response to this pointer.  Other components
         * should respect the claimant's desire to react to this pointer in order
         * to prevent an entire hierarchy of components from reacting to a pointer
         * in potentially conflicting ways.
         *
         * If the pointer is currently claimed by another component that component
         * is asked to surrender the pointer, which is may or may not agree to do.
         *
         * @function
         * @param {string} pointer The pointer identifier to claim
         * @param {string} component The component that is claiming the specified
         * pointer.
         * @returns {boolean} - Whether or not the pointer was successfully claimed.
         */
        claimPointer: {
            value: function (pointer, component) {

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
         * Forfeits the specified pointer identifier from the specified component.
         * The specified component must be the current claimant.
         *
         * @function
         * @param {string} pointer The pointer identifier in question
         * @param {string} component The component that is trying to forfeit the
         * specified pointer
         */
        forfeitPointer: {
            value: function (pointer, component) {
                if (component === this._claimedPointers[pointer]) {
                    delete this._claimedPointers[pointer];
                } else {
                    throw "Not allowed to forfeit pointer '" + pointer + "' claimed by another component";
                }

            }
        },

        /**
         * Forfeits all pointers from the specified component.
         *
         * @function
         * @param {Component} component
         */
        forfeitAllPointers: {
            value: function (component) {

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
         * @private
         */
        _isStoringPointerEvents: {
            enumerable: false,
            value: false
        },

        /**
         * @returns {boolean}
         * @default false
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
         * @private
         */
        _isStoringMouseEventsWhileDraggingOnly: {
            enumerable: false,
            value: true
        },

        /**
         * @type {Function}
         * @default {boolean} true
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
         * @private
         */
        _isMouseDragging: {
            enumerable: false,
            value: false
        },

        /**
         * @private
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
                storeEvent: function (event) {
                    var i;
                    switch (event.type) {
                        case "mousedown":
                            defaultEventManager._isMouseDragging = true;
                        // roll into mousemove. break omitted intentionally.
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
                removeEvent: function (event) {
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

        domModificationEventHandler: {
            value: Montage.specialize({
                handleEvent: {
                    value: function (event) {
                        throw "DOM Modified";
                    }
                },
                captureDOMSubtreeModified: {
                    value: function (event) {
                        throw "DOMSubtreeModified";
                    }
                },
                captureDOMAttrModified: {
                    value: function (event) {
                        throw "DOMAttrModified";
                    }
                },
                captureDOMCharacterDataModified: {
                    value: function (event) {
                        throw "DOMCharacterDataModified";
                    }
                }
            })
        },

        // Event Handling

        /**
         @function
         @param {Event} event The handled event.
         */
        handleEvent: {
            enumerable: false,
            value: function (event) {

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

                if (Element.isElement(mutableEvent.target) || mutableEvent.target instanceof Document || mutableEvent.target === window) {
                    eventPath = this._eventPathForDomTarget(mutableEvent.target);
                } else {
                    eventPath = this._eventPathForTarget(mutableEvent.target);
                }

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

                        this._invokeTargetListenerForEvent(iTarget, jListener, mutableEvent, identifierSpecificCaptureMethodName, captureMethodName);
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
                                this._invokeTargetListenerForEvent(iTarget, jListener, mutableEvent, identifierSpecificCaptureMethodName, captureMethodName);
                            }

                            if (jListenerEntry.bubble) {
                                this._invokeTargetListenerForEvent(iTarget, jListener, mutableEvent, identifierSpecificBubbleMethodName, bubbleMethodName);
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

                        this._invokeTargetListenerForEvent(iTarget, jListener, mutableEvent, identifierSpecificBubbleMethodName, bubbleMethodName);

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

        /**
         * @private
         */
        _invokeTargetListenerForEvent: {
            value: function (iTarget, jListener, mutableEvent, identifierSpecificPhaseMethodName, phaseMethodName) {
                var listenerFunction;
                if ((identifierSpecificPhaseMethodName && typeof (listenerFunction = jListener[identifierSpecificPhaseMethodName]) === FUNCTION_TYPE)
                    || (typeof (listenerFunction = jListener[phaseMethodName]) === FUNCTION_TYPE)
                    || (typeof (listenerFunction = jListener.handleEvent) === FUNCTION_TYPE)) {
                    listenerFunction.call(jListener, mutableEvent);
                } else if (typeof jListener === FUNCTION_TYPE) {
                    jListener.call(iTarget, mutableEvent);
                }
            }
        },

        /**
         * Ensure that any components associated with DOM elements in the hierarchy between the
         * original activationEvent target and the window are preparedForActionEvents
         *
         * @function
         * @private
         */
        _prepareComponentsForActivation: {
            value: function (eventTarget) {

                var target = eventTarget,
                    previousTarget,
                    targetView = target && target.defaultView ? target.defaultView : window,
                    targetDocument = targetView.document ? targetView.document : document,
                    associatedComponent,
                    lookedForActiveTarget = false,
                    activeTarget = null;

                do {

                    if (target) {
                        associatedComponent = this.eventHandlerForElement(target);
                        if (associatedComponent) {

                            // Once we've found a component starting point,
                            // find the closest Target that accepts focus
                            if (!lookedForActiveTarget) {
                                lookedForActiveTarget = true;
                                activeTarget = this._findActiveTarget(associatedComponent);
                            }

                            if (!associatedComponent._preparedForActivationEvents) {
                                associatedComponent._prepareForActivationEvents();
                                associatedComponent._preparedForActivationEvents = true;
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

                this.activeTarget = activeTarget;
            }
        },

        /**
         * @private
         */
        _findActiveTarget: {
            value: function (target) {

                var foundTarget = null,
                    uuidCheckedTargetMap = {};

                //TODO report if a cycle is detected?
                while (!foundTarget && target && !(target.uuid in uuidCheckedTargetMap)) {

                    //TODO complain if a non-Target-alike is considered

                    uuidCheckedTargetMap[target.uuid] = target;

                    if (target.acceptsActiveTarget) {
                        foundTarget = target;
                    } else {
                        target = target.nextTarget;
                    }
                }

                return foundTarget;
            }
        },

        /**
         * Build the event target chain for the the specified Target
         * @private
         */
        _eventPathForTarget: {
            enumerable: false,
            value: function (target) {

                if (!target) {
                    return [];
                }

                var targetCandidate = target,
                    application = this.application,
                    eventPath = [],
                    discoveredTargets = {};

                // Consider the target "discovered" for less specialized detection of cycles
                discoveredTargets[target.uuid] = target;

                do {
                    if (!(targetCandidate.uuid in discoveredTargets)) {
                        eventPath.push(targetCandidate);
                        discoveredTargets[targetCandidate.uuid] = targetCandidate;
                    }

                    targetCandidate = targetCandidate.nextTarget;

                    if (!targetCandidate || targetCandidate.uuid in discoveredTargets) {
                        targetCandidate = application;
                    }

                    if (targetCandidate && (targetCandidate.uuid in discoveredTargets)) {
                        targetCandidate = null;
                    }
                }
                while (targetCandidate);

                return eventPath;
            }
        },

        /**
         * Build the event target chain for the the specified DOM target
         * @private
         */
        _eventPathForDomTarget: {
            enumerable: false,
            value: function (target) {

                if (!target) {
                    return [];
                }

                var targetCandidate = target,
                    targetView = targetCandidate && targetCandidate.defaultView ? targetCandidate.defaultView : window,
                    targetDocument = targetView.document ? targetView.document : document,
                    targetApplication = this.application,
                    previousBubblingTarget,
                    eventPath = [];

                do {
                    // Don't include the target itself as the root of the event path
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
                            targetCandidate = targetCandidate.parentNode;

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
         * @private
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
            value: function (anElementEventHandler, anElement) {
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
            value: function (anElement) {
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
            value: function (anElement) {
                return this._elementEventHandlerByUUID[anElement.eventHandlerUUID];
            }
        },

        /**
         * @private
         */
        _activeTarget: {
            value: null
        },

        /**
         * The logical component that has focus within the application
         *
         * This can be used as the proximal target for dispatching in
         * situations where it logically makes sense that and event, while
         * created by some other component, should appear to originate from
         * where the user is currently focused.
         *
         * This is particularly useful for things such as keyboard shortcuts or
         * menuAction events.
         *
         * Prior to setting the activeTarget manually the desired target should
         * be checked to see if it `acceptsActiveTarget`. In the course of then
         * setting that target as the activeTarget, the current activeTarget
         * will be instructed to `surrendersActiveTarget`. If the activeTarget
         * refuses to surrender, the change is rejected.
         */
        activeTarget: {
            get: function () {
                return this._activeTarget || this.application;
            },
            set: function (value) {

                if (!value) {
                    value = this.application;
                }

                if (value === this._activeTarget || (this.activeTarget && !this.activeTarget.surrendersActiveTarget(value))) {
                    return;
                }

                value.willBecomeActiveTarget(this.activeTarget);
                this._activeTarget = value;
                value.didBecomeActiveTarget();
            }
        }

    });

} // client-side

