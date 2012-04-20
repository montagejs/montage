/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
/**
 @module montage/core/event/key-manager
 @requires montage/core/core
 */

var Montage = require("montage").Montage,
    defaultEventManager = require("core/event/event-manager").defaultEventManager,
    MutableEvent = require("core/event/mutable-event").MutableEvent;

var KEYNAMES_TO_KEYCODES = {
    // W3C Key Code
    backspace:              8,
    tab:                    9,
    enter:                  13,
    shift:                  16,
    control:                17,
    alt:                    18,
    capslock:               20,
    escape:                 27,
    space:                  32,
    pageup:                 33,
    pagedown:               34,
    end:                    35,
    home:                   36,
    left:                   37,
    up:                     38,
    right:                  39,
    down:                   40,
    delete:                 46,

    // W3C Optional Key Code (mostly for US keyboard layout
    semicolumn:             186,
    column:                 186,
    equal:                  187,
    plus:                   187,
    comma:                  188,
    less:                   188,
    minus:                  189,
    underscore:             189,
    period:                 190,
    greater:                190,
    slash:                  191,
    questionmark:           191,
    backtick:               192,
    tilde:                  192,
    openingsquarebracket:   219,
    openingcurlybracket:    219,
    backslash:              220,
    pipe:                   220,
    closingsquarebracket:   221,
    closingcurlybracket:    221,
    singlequote:            222,
    doublequote:            222,


    // Non standard Virtal key code but commonly used
    clear:                  12,
    meta:                   91,
    contextmenu:            93,
    numpad0:                96,
    numpad1:                97,
    numpad2:                98,
    numpad3:                99,
    numpad4:                100,
    numpad5:                101,
    numpad6:                102,
    numpad7:                103,
    numpad8:                104,
    numpad9:                105,
    multiply:               106,
    add:                    107,
    subtract:               109,
    decimal:                110,
    divide:                 111,
    f1:                     112,
    f2:                     113,
    f3:                     114,
    f4:                     115,
    f5:                     116,
    f6:                     117,
    f7:                     118,
    f8:                     119,
    f9:                     120,
    f10:                    121,
    f11:                    122,
    f12:                    123,
    f13:                    124,
    f14:                    125,
    f15:                    126,
    f16:                    127,
    f17:                    128,
    f18:                    129,
    f19:                    130,
    f20:                    131,
    f21:                    132,
    f22:                    133,
    f23:                    134,
    f24:                    135
},

KEYCODES_TO_KEYNAMES = null,    // Will be build from the KEYNAMES_TO_KEYCODES dictionary

OPERA_KEYNAMES_TO_KEYCODES = {
    meta:                   17,
    control:                57392,
    f17:                    63252,
    f18:                    63253,
    f19:                    63254,
    f20:                    63255,
    f21:                    63256,
    f22:                    63257,
    f23:                    63258,
    f24:                    63259
},

FIREFOX_KEYNAMES_TO_KEYCODES = {
    f13:                    44,
    f14:                    145,
    f15:                    19,
    f16:                    63251,
    f17:                    63252,
    f18:                    63253,
    f19:                    63254,
    f20:                    63255,
    f21:                    63256,
    f22:                    63257,
    f23:                    63258,
    f24:                    63259,
    meta:                   224
},

KEYNAMES_ALIASES = {
    cmd:        "command",
    ctl:        "control",
    ctrl:       "control",
    win:        "meta",
    windows:    "meta",
    opt:        "alt",
    option:     "alt"
},

MODIFIERS = {
    meta:       {name:"meta",    value:1},
    alt:        {name:"alt",     value:2},
    control:    {name:"control", value:4},
    shift:      {name:"shift",   value:8}
},

NORMALIZED_KEYS = {
    semicolumn:             ";",
    column:                 ":",
    equal:                  "=",
    plus:                   "+",
    comma:                  ",",
    less:                   "<",
    minus:                  "-",
    underscore:             "_",
    period:                 ".",
    greater:                ">",
    slash:                  "/",
    questionmark:           "?",
    backtick:               "`",
    tilde:                  "~",
    openingsquarebracket:   "[",
    openingcurlybracket:    "{",
    backslash:              "\\",
    pipe:                   "|",
    closingsquarebracket:   "]",
    closingcurlybracket:    "}",
    singlequote:            "'",
    doublequote:            "\"",
    multiply:               "*",
    add:                    "+",
    subtract:               "-",
    decimal:                ".",
    divide:                 "/"
},

NORMALIZED_CHARS = null;    // Will generate from the NORMALIZED_KEYS


/* Event type dispatched by KeyComposer */
var KEYPRESS_EVENT_TYPE = "keyPress",
    KEYLONGPRESS_EVENT_TYPE = "keyLongPress",
    KEYRELEASE_EVENT_TYPE = "keyRelease";


/**
 @class module:montage/core/event/key-manager.KeyManager
 @classdesc The KeyManager dispatches KeyComposer events when it detects a keyComposer has been pressed or released.
 Do not create a KeyManager directly but instead require for the defaultKeyManager: require("core/event/key-manager").defaultKeyManager
 @extends module:montage/core/core.Montage
*/
var KeyManager = exports.KeyManager = Montage.create(Montage,/** @lends module:montage/core/event/key-manager.KeyManager# */ {

    /**
      @private
    */
    _keyEventsListenerInstalled: {
        value: false
    },

    /**
      @private
    */
    _composerKeyMap: {
        value: {}
    },

    /**
      @private
    */
    _triggeredKeys: {
        value: {}
    },

    /**
      @private
    */
    _longPressKeys: {
        value: {}
    },

    /**
      @private
    */
    _cleanupTimeout: {
        value: null
    },

    /**
      @private
    */
    _cleanupDuration: {
        value: 2000
    },

    /**
      @private
    */
    _longPressDuration: {
        value: 1000
    },

    /**
      The number of milliseconds a key must be pressed in order to dispatch a keyLongPress event.
      @type {number}
      @default 1000
    */
    longPressDuration: {
        get: function() {
            return this._longPressDuration;
        },
        set: function(value) {
            if (value > 0 && value !== this._longPressDuration) {
                this._longPressDuration = value;
                if (this._longPressDuration > this._cleanupDuration - 100) {
                    this._cleanupDuration = this._longPressDuration + 100;
                } else {
                    this._cleanupDuration = 2000;
                }
            }
        }
    },

    /**
      Register a composerKey.
      @function
      @param {Object} keyComposer. The key to register.
    */
    registerKey: {
        value: function(keyComposer) {
            var normalizedKeys = this._normalizeKeySequence(keyComposer.keys),     // validates the keys
                modifiersAndKey,
                map = this._composerKeyMap,
                mapModifiersEntry,
                mapKeyEntry,
                keyAlreadyRegistered = false,
                entry,
                i;

            if (normalizedKeys) {
                modifiersAndKey = this._convertKeysToModifiersAndKeyCode(normalizedKeys);

                mapModifiersEntry = map[modifiersAndKey.modifiers];
                if (!mapModifiersEntry) {
                    mapModifiersEntry = map[modifiersAndKey.modifiers] = {};
               }
                mapKeyEntry = mapModifiersEntry[modifiersAndKey.keyCode];
                if (mapKeyEntry) {
                    for (i in mapKeyEntry) {
                        entry = mapKeyEntry[i];
                        if (entry.object === keyComposer) {
                            entry.refCount ++;
                            keyAlreadyRegistered = true;
                            break;
                        }
                    }
                    if (!keyAlreadyRegistered) {
                        mapKeyEntry.push({object: keyComposer, refCount: 1});
                    }
                } else {
                    mapModifiersEntry[modifiersAndKey.keyCode] = [{object: keyComposer, refCount: 1}];
                }

                keyComposer._modifiers = modifiersAndKey.modifiers;
                keyComposer._keyCode = modifiersAndKey.keyCode;

                // console.log("KEY REGISTERED:", keyComposer.identifier, normalizedKeys ,map);
                this._registerListeners();
            }
        }
    },

    /**
      Unregister a composerKey. if a key has been registered multiple time, unregister must be called the same amount of time before the key is actually unregistered.
      @function
      @param {Object} keyComposer. The key to unregister.
    */
    unregisterKey: {
        value: function(keyComposer) {
            var map = this._composerKeyMap,
                mapModifiersEntry,
                mapKeyEntry,
                entry,
                i;

            mapModifiersEntry = map[keyComposer._modifiers];
            if (mapModifiersEntry) {
                mapKeyEntry = mapModifiersEntry[keyComposer._keyCode];
                for (i in mapKeyEntry) {
                    entry = mapKeyEntry[i];
                    if (entry.object === keyComposer) {
                        entry.refCount --;
                        if (entry.refCount <= 0) {
                            // console.log("UNREGISTERING KEY:", keyComposer, entry);
                            mapKeyEntry.splice(i, 1);
                            if (mapKeyEntry.length === 0) {
                                delete mapModifiersEntry[keyComposer._keyCode];
                                if (Object.keys(mapModifiersEntry).length === 0) {
                                    delete map[keyComposer._modifiers];
                                    if (Object.keys(map).length === 0) {
                                        this._unregisterListeners();
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    },

    /**
      didCreate method
      @function
      @private
    */
    didCreate: {
        value: function() {
            var userAgent = navigator.userAgent,
                code;

            if (_defaultKeyManager) {
                console.warn("Rather than creating a new KeyManager object, you might want to use the default key manager");
            }

            // console.log("KEYBOARD MANAGER CREATED");

            // Browser detection
            if (userAgent.match(/ firefox\//i)) {
                this._firefox = true;
            } else if (userAgent.match(/ chrome\//i)) {
                this._chrome = true;
            } else if (userAgent.match(/ safari\//i)) {
                this._safari = true;
            } else if (userAgent.match(/^opera\//i)) {
                this._opera = true;
            }

            // Platform Detection
            if (userAgent.match(/macintosh/i)) {
                this._mac = true;
            } else if (userAgent.match(/windows\//i)) {
                this._windows = true;
            } else if (userAgent.match(/android\//i)) {
                this._android = true;
            } else if (userAgent.match(/unix\//i)) {
                this._unix = true;
            }

            // Handle the platform specific COMMAND modifier
            if (this._mac) {
                MODIFIERS.command = MODIFIERS.meta;
            } else {
                MODIFIERS.command = MODIFIERS.control;
            }

            // Patch the KeyCode dictionary for Opera or Firefox
            if (this._opera) {
                for (code in OPERA_KEYNAMES_TO_KEYCODES) {
                    KEYNAMES_TO_KEYCODES[code] = OPERA_KEYNAMES_TO_KEYCODES[code];
                }
            }
            if (this._firefox) {
                for (code in FIREFOX_KEYNAMES_TO_KEYCODES) {
                    KEYNAMES_TO_KEYCODES[code] = FIREFOX_KEYNAMES_TO_KEYCODES[code];
                }
            }

            // Generate the KEYNAMES dictionary
            KEYCODES_TO_KEYNAMES = {};
            for (var keyName in KEYNAMES_TO_KEYCODES) {
                var code = KEYNAMES_TO_KEYCODES[keyName];
                if (KEYCODES_TO_KEYNAMES[code] === undefined) {
                    // If we have more than one name for a keycode, use only the first one
                    KEYCODES_TO_KEYNAMES[code] = keyName;
                }
            }

            // Generate the NORMALIZED_CHARS dictionary
            NORMALIZED_CHARS = {};
            for (var keyName in NORMALIZED_KEYS) {
                var code = NORMALIZED_KEYS[keyName];
                if (NORMALIZED_CHARS[code] === undefined) {
                    // If we have more than one name for a char, use only the first one
                    NORMALIZED_CHARS[code] = keyName;
                }
            }

            this._shiftKey = false;
            this._altKey = false;
            this._metaKey = false;
            this._ctrlKey = false;
        }
    },

    /**
      captureKeydown handler
      @function
      @private
    */
    captureKeydown: {
        value: function(event) {
            var keyCode,
                identifierCode,
                submap,
                stopped = false;

            // console.log("  captureKeydown:", event.keyCode, event.charCode, event.keyIdentifier);

            this._preprocessKeyEvent(event);
            // console.log("KEYDOWN MODIFIERS:", this._modifiers, "KEYCODE:", this._keyCode);

            submap = this._submap;
            if (submap) {
                keyCode = this._keyCode;

                // Check the keyCode for a match...
                if (keyCode && submap[keyCode]) {
                    stopped = this._dispatchComposerKeyMatches(submap[keyCode], event);
                }

                // Check the keyIdentifier for a match
                if (!stopped && event.keyIdentifier) {
                    identifierCode = KEYNAMES_TO_KEYCODES[event.keyIdentifier.toLowerCase()] ||
                        this._decodeKeyIdentifier(event.keyIdentifier);
                    if (identifierCode && submap[identifierCode]) {
                        this._dispatchComposerKeyMatches(submap[identifierCode], event);
                    }
                }
            }

            this._setupCleanupTimer();
        }
    },

    /**
      captureKeypress handler
      @function
      @private
    */
    captureKeypress: {
        value: function(event) {
            var charCode = event.charCode,
                keyCode,
                identifierCode,
                submap,
                stopped = false;

            // console.log("***  captureKeypress:", keyCode, event.charCode, event.keyIdentifier, event);
            this._preprocessKeyEvent(event);

            submap = this._submap;
            // console.log("KEYPRESS MODIFIERS:", this._modifiers, this._keyCode, event.charCode);

            if (submap) {
                keyCode = this._keyCode;

                // Check the keyCode for a match...
                if (keyCode && submap[keyCode]) {
                    stopped = this._dispatchComposerKeyMatches(submap[keyCode], event);
                }

                // Check the charCode for a match...
                if (!stopped && charCode && submap[charCode]) {
                    stopped = this._dispatchComposerKeyMatches(submap[charCode], event);
                }

                // Check the keyIdentifier for a match
                if (!stopped && event.keyIdentifier) {
                    identifierCode = KEYNAMES_TO_KEYCODES[event.keyIdentifier.toLowerCase()] ||
                        this._decodeKeyIdentifier(event.keyIdentifier);
                    if (identifierCode && submap[identifierCode]) {
                        this._dispatchComposerKeyMatches(submap[identifierCode], event);
                    }
                }
            }

            this._setupCleanupTimer();
        }
    },

    /**
      captureKeyup handler
      @function
      @private
    */
    captureKeyup: {
        value: function(event) {
            var keyCode = event.keyCode,
                identifierCode,
                submap,
                dispatchedKeyCode = 0,
                triggeredKey,
                uuid,
                stopped = false;

            // Dispatch a keyup event for all composerKey triggered during the keydown/keypress phase
            // and for the current match

            // console.log("  captureKeyup:", event.keyCode, event.charCode, event.keyIdentifier);
            this._preprocessKeyEvent(event);
            submap = this._submap;

            // console.log("KEYUP MODIFIERS:", this._modifiers, this._keyCode);
            if (submap) {
                keyCode = this._keyCode;

                // Check the keyCode for a match...
                if (keyCode && submap[keyCode]) {
                    stopped = this._dispatchComposerKeyMatches(submap[keyCode], event);
                    dispatchedKeyCode = keyCode;
                }

                // Check the keyIdentifier for a match
                if (stopped && event.keyIdentifier) {
                    identifierCode = KEYNAMES_TO_KEYCODES[event.keyIdentifier.toLowerCase()] ||
                        this._decodeKeyIdentifier(event.keyIdentifier);
                    if (identifierCode && identifierCode !== dispatchedKeyCode && submap[identifierCode]) {
                        stopped = this._dispatchComposerKeyMatches(submap[identifierCode], event);
                    }
                }
            }

            // In case the user release the modifier key before releasing the main key, we still need to fire a keyup event
            if (!stopped) {
                for (uuid in this._triggeredKeys) {
                    triggeredKey = this._triggeredKeys[uuid];
                    if (triggeredKey._keyCode == keyCode || triggeredKey._keyCode == identifierCode) {
                        this._dispatchComposerKeyMatches([triggeredKey], event);
                    }
                }
            }

            this._setupCleanupTimer();
        }
    },

    /**
      @private
    */
    _normalizeKeySequence: {
        value: function(keySequence) {
            var modifiersOrder = [MODIFIERS.meta.name, MODIFIERS.alt.name, MODIFIERS.control.name, MODIFIERS.shift.name],
                keys = keySequence.toLowerCase().replace(/ /g, "").replace(/\+\+/g, "+add").split("+"),
                nbrKeys = keys.length,
                key,
                normalizedKeys = [],
                i;

            for (i = 0; i < nbrKeys - 1; i ++) {
                // convert alias
                key = keys[i];
                key = KEYNAMES_ALIASES[key] || key;

                // make sure it's a modifier
                key = MODIFIERS[key];
                if (key) {
                    normalizedKeys.push(key.name);
                } else {
                    console.warn("Invalid key sequence (modifier):", keySequence);
                    return null;
                }
            }

            normalizedKeys.sort(function(a, b) {
                return modifiersOrder.indexOf(a) - modifiersOrder.indexOf(b);
            });

            key = keys[nbrKeys - 1];
            if (key.length > 1 && !KEYNAMES_TO_KEYCODES[key]) {
                console.warn("Invalid key sequence (key):", keySequence, key);
                return null;
            }

            if (normalizedKeys.length) {
                return normalizedKeys.join("+") + "+" + key;
            } else {
                return key;
            }
        }
    },

    /**
      @private
    */
    _preprocessKeyEvent: {
        value: function(event) {
            var thisRef = this,
                eventType = event.type,
                keyCode = event.keyCode,
                modifiers,
                value;

            if (this._opera) {
                if (this._operaModifierTimeout) {
                    clearTimeout(this._operaModifierTimeout);
                    this._operaModifierTimeout = null;
                }
            }

            if (eventType == "keydown" || eventType == "keyup") {
                if (this._opera) {
                    // Opera is not very good at keeping track of which modifiers are pressed!
                    value = (eventType == "keydown");
                    if (keyCode == KEYNAMES_TO_KEYCODES.shift) {
                        this._shiftKey = value;
                    } else if (keyCode == KEYNAMES_TO_KEYCODES.alt) {
                        this._altKey = value;
                    } else if (keyCode == KEYNAMES_TO_KEYCODES.meta) {
                        if (this._mac) {
                            this._metaKey = value;
                        } else {
                            this._ctrlKey = value;           // TODO: Needs to be tested on Unix and Windows
                        }
                    } else if (keyCode == KEYNAMES_TO_KEYCODES.control) {
                        this._ctrlKey = value;
                    }

                    if (eventType == "keyup") {
                        // Setup a timeout to force reset the modifier state ~3 seconds after the last key up
                        // This is to recover when we miss a keyup event which seems to occurs once in a while with Opera
                        this._operaModifierTimeout = setTimeout(function(){
                            thisRef._shiftKey = false;
                            thisRef._altKey = false;
                            thisRef._metaKey = false;
                            thisRef._ctrlKey = false;
                            thisRef._operaModifierTimeout = null;
                        }, this._cleanupDuration + 1000);
                    }
                } else {
                    this._shiftKey = event.shiftKey;
                    this._altKey = event.altKey;
                    this._metaKey = event.metaKey;
                    this._ctrlKey = event.ctrlKey;
                }
            }

            if (this._mac && keyCode == KEYNAMES_TO_KEYCODES.contextmenu) {
                // Safari and Chrome will interpret the right command key as the window context-menu but will keep the
                // meta modifier on preventing us from having a "context-menu" shortcut. We need to clear the meta flag
                // (the limitation is that we wont be able to support a "META+CONTEXT-MENU" shortcut
                this._metaKey = false;
            }

            if (this._chrome) {
                // Chrome (at least on Mac) generate the same keycode for the NumKeyPad = and NumKeyPad +
                if (!this._shiftKey && keyCode == KEYNAMES_TO_KEYCODES.plus && event.keyIdentifier == "U+002B") {
                    event.keyCode = KEYNAMES_TO_KEYCODES.add;
                }
            }

            this._modifiers = modifiers = (this._shiftKey ? MODIFIERS.shift.value : 0) +
                (this._altKey ? MODIFIERS.alt.value : 0) +
                (this._metaKey ? MODIFIERS.meta.value : 0) +
                (this._ctrlKey ? MODIFIERS.control.value : 0);

            this._submap = this._composerKeyMap[modifiers];
            this._keyCode = event.keyCode;
            this._keyIdentifier = event.keyIdentifier;
        }
    },

    /**
      @private
    */
    _registerListeners: {
        value: function() {
            if (!this._keyEventsListenerInstalled) {
                // console.log("ADDING KEY EVENTS LISTENER TO KEYBOARD MANAGER");
                window.addEventListener("keydown", this, true);
                window.addEventListener("keypress", this, true);
                window.addEventListener("keyup", this, true);
                this._keyEventsListenerInstalled = true;
            }
        }
    },

    /**
      @private
    */
    _unregisterListeners: {
        value: function() {
            if (this._keyEventsListenerInstalled) {
                // console.log("REMOVING KEY EVENTS LISTENER FROM KEYBOARD MANAGER");
                window.removeEventListener("keydown", this, true);
                window.removeEventListener("keypress", this, true);
                window.removeEventListener("keyup", this, true);
                this._keyEventsListenerInstalled = false;
            }
        }
    },

    /**
      @private
    */
    _dispatchComposerKeyMatches: {
        value: function(matches, event) {
            var thisRef = this,
                stopped = false,
                keyUp = event.type == "keyup",
                eventType = keyUp ? KEYRELEASE_EVENT_TYPE : KEYPRESS_EVENT_TYPE,
                nbrMatches = matches.length,
                keyComposer,
                target = event.target,
                keyComposerEvent,
                triggeredKeys,
                i;

            // matches could be either an array of matches or an array of keyComposers
            for (i = 0; i < nbrMatches && !stopped; i ++) {
                keyComposer = matches[i].object || matches[i];

                if (keyUp) {
                    triggeredKeys = Object.keys(this._triggeredKeys);
                    if (triggeredKeys.indexOf(keyComposer.uuid) == -1) {
                        // Do not generate a keyup event if the composerKey has not been triggered on keydow or keypress
                        continue;
                    }

                    if (keyComposer._longPressTimeout) {
                        clearTimeout(keyComposer._longPressTimeout);
                        keyComposer._longPressTimeout = null;
                        delete this._longPressKeys[keyComposer.uuid];
                    }
                } else {
                    if (this._triggeredKeys[keyComposer.uuid]) {
                        // Ignore repeat keydown
                        continue;
                    }
                    if (keyComposer._shouldDispatchLongPress) {
                        if (keyComposer._longPressTimeout) {
                            clearTimeout(keyComposer._longPressTimeout);
                        }
                        keyComposer._longPressTimeout = setTimeout(function() {
                            var longPressEvent;

                            keyComposer._longPressTimeout = null;

                            longPressEvent = document.createEvent("CustomEvent");
                            longPressEvent.initCustomEvent(KEYLONGPRESS_EVENT_TYPE, true, true, keyComposer);
                            thisRef._keyComposerDispatch(keyComposer, target, longPressEvent);
                            delete thisRef._longPressKeys[keyComposer.uuid];
                        }, this._longPressDuration);

                        // Let's remember any longKeyPress key waiting for timeout
                        this._longPressKeys[keyComposer.uuid] = keyComposer;
                    }
                }

                keyComposerEvent = document.createEvent("CustomEvent");
                keyComposerEvent.initCustomEvent(eventType, true, true, keyComposer);
                keyComposerEvent = this._keyComposerDispatch(keyComposer, target, keyComposerEvent);

                // console.log("keyComposer Event DISPATCHED:", keyComposerEvent, event.target, keyComposer);
                if (keyComposerEvent.defaultPrevented) {
                    event.preventDefault();
                }
                if (keyComposerEvent.propagationStopped) {
                    event.stopPropagation();
                    stopped = true;
                }
                if (keyUp) {
                    // We already dispatched a keyup event for this key, let's remove it
                    delete this._triggeredKeys[keyComposer.uuid];
                } else {
                    // We need to remember any composerKey triggered during the keydown phase in order to generate an equivalent keyup
                    this._triggeredKeys[keyComposer.uuid] = keyComposer;
                }
            }

            // if the composer key even has been stopped, we need clean the list of triggered keys as we wont get a keyup event anymore.
            // We need also stop pending longPress key
            if (stopped) {
                for (i = (keyUp ? i : 0); i < nbrMatches; i ++) {
                    keyComposer = matches[i].object || matches[i];
                    delete this._triggeredKeys[keyComposer.uuid];

                    if (keyComposer._longPressTimeout) {
                        clearTimeout(keyComposer._longPressTimeout);
                        keyComposer._longPressTimeout = null;
                        delete this._longPressKeys[keyComposer.uuid];
                    }
                }
            }

            return stopped;
        }
    },

    /**
      @private
    */
    _keyComposerDispatch: {
        value: function(keyComposer, target, event) {
            var mutableEvent,
                eventType = event.type,
                currentEventHandlers,
                identifierSpecificCaptureMethodName,
                identifierSpecificBubbleMethodName,
                captureMethodName,
                bubbleMethodName,
                iEventHandlerEntry,
                iEventHandler,
                functionType = "function",
                i;

            var CAPTURING_PHASE = 1,
                AT_TARGET = 2,
                BUBBLING_PHASE = 3;

            if (typeof event.propagationStopped !== "boolean") {
                mutableEvent = MutableEvent.fromEvent(event);
            } else {
                mutableEvent = event;
            }
            mutableEvent.target = target;
            mutableEvent.eventPhase = CAPTURING_PHASE;
            if (event.type == "keypress") {
                // Fix for Opera who think KeyPress is a typo and therefore change it on its own to keypress.
                mutableEvent.type = KEYPRESS_EVENT_TYPE;
                eventType = KEYPRESS_EVENT_TYPE;
            }

            // Figure out who to distribute the event to
            currentEventHandlers = this._eventListenersForComposerKeyEvent(keyComposer, mutableEvent);

            // console.log("--- keyComposer Event DISTRIBUTION: ", mutableEvent.type, "from:", mutableEvent.target, "to: ", currentEventHandlers, "---")
            if (!currentEventHandlers) {
                return mutableEvent;
            }

            // use most specific handler method available, possibly based upon the identifier of the composerKey
            if (keyComposer.identifier) {
                identifierSpecificCaptureMethodName = defaultEventManager.methodNameForCapturePhaseOfEventType_(eventType, keyComposer.identifier);
            } else {
                identifierSpecificCaptureMethodName = null;
            }

            if (keyComposer.identifier) {
                identifierSpecificBubbleMethodName = defaultEventManager.methodNameForBubblePhaseOfEventType_(eventType, keyComposer.identifier);
            } else {
                identifierSpecificBubbleMethodName = null;
            }

            captureMethodName = defaultEventManager.methodNameForCapturePhaseOfEventType_(eventType);
            bubbleMethodName = defaultEventManager.methodNameForBubblePhaseOfEventType_(eventType);

            // Let the event manager delegate handle the event first
            // TODO do we care about phase at all?
            if (defaultEventManager.delegate && defaultEventManager.delegate.willDistributeEvent) {
                defaultEventManager.delegate.willDistributeEvent(mutableEvent);
            }

            // Capture Phase Distribution
            for (i = currentEventHandlers.capture.length - 1; !mutableEvent.propagationStopped && (iEventHandlerEntry = currentEventHandlers.capture[i]); i--) {
                mutableEvent.currentTarget = iEventHandlerEntry.currentTarget;

                if (mutableEvent.currentTarget === mutableEvent.target) {
                    mutableEvent.eventPhase = AT_TARGET;
                }

                iEventHandler = iEventHandlerEntry.listener;

                if (identifierSpecificCaptureMethodName && typeof iEventHandler[identifierSpecificCaptureMethodName] === functionType) {
                    iEventHandler[identifierSpecificCaptureMethodName](mutableEvent);
                } else if (typeof iEventHandler[captureMethodName] === functionType) {
                    iEventHandler[captureMethodName](mutableEvent);
                } else if (typeof iEventHandler.handleEvent === functionType) {
                    iEventHandler.handleEvent(mutableEvent);
                } else if (typeof iEventHandler === functionType) {
                    iEventHandler.call(event.target, mutableEvent);
                }
            }

            mutableEvent.eventPhase = AT_TARGET;

            // Bubble Phase Distribution
            for (i = 0; !mutableEvent.propagationStopped && (iEventHandlerEntry = currentEventHandlers.bubble[i]); i++) {
                mutableEvent.currentTarget = iEventHandlerEntry.currentTarget;

                if (AT_TARGET === mutableEvent.eventPhase && mutableEvent.currentTarget !== mutableEvent.target) {
                    mutableEvent.eventPhase = BUBBLING_PHASE;
                }

                iEventHandler = iEventHandlerEntry.listener;

                if (identifierSpecificBubbleMethodName && typeof iEventHandler[identifierSpecificBubbleMethodName] === functionType) {
                    iEventHandler[identifierSpecificBubbleMethodName](mutableEvent);
                } else if (typeof iEventHandler[bubbleMethodName] === functionType) {
                    iEventHandler[bubbleMethodName](mutableEvent);
                } else if (typeof iEventHandler.handleEvent === functionType) {
                    iEventHandler.handleEvent(mutableEvent);
                } else if (typeof iEventHandler === functionType) {
                    iEventHandler.call(event.target, mutableEvent);
                }
            }

            return mutableEvent;
        }
    },

    /**
      @private
    */
    _eventListenersForComposerKeyEvent: {
        enumerable: false,
        value: function(composerKey, event) {
            var eventType = event.type,
                bubblingTarget = event.target,
                targetView = bubblingTarget && bubblingTarget.defaultView ? bubblingTarget.defaultView : window,
                targetDocument = targetView.document ? targetView.document : document,
                previousBubblingTarget,
                currentEventListener,
                currentEventListenerEntry,
                currentEventListenerHash,
                listenersForEventType,
                keyComposerListenersForEventType,
                affectedListeners = {capture: [], bubble: []};

            if (!bubblingTarget) {
                // TODO complain about events with no target? in debug?
                return;
            }
            // console.log("--- DISCOVERY: ", eventType, "---")
            keyComposerListenersForEventType = defaultEventManager.registeredEventListeners[eventType];
            keyComposerListenersForEventType = keyComposerListenersForEventType ? keyComposerListenersForEventType[composerKey.uuid] : null;
            if (keyComposerListenersForEventType) {
                do {
                    if (keyComposerListenersForEventType.target.element === bubblingTarget) {
                        listenersForEventType = keyComposerListenersForEventType.listeners;
                        for (currentEventListenerHash in listenersForEventType) {
                            currentEventListenerEntry = listenersForEventType[currentEventListenerHash];
                            currentEventListener = currentEventListenerEntry.listener;

                            // TODO pass along the entry here maybe? we may already have a perfectly good object to use here
                            if (currentEventListenerEntry.capture) {
                                affectedListeners.capture.push({listener: currentEventListener, currentTarget: bubblingTarget});
                            }

                            if (currentEventListenerEntry.bubble) {
                                affectedListeners.bubble.push({listener: currentEventListener, currentTarget: bubblingTarget});
                            }
                        }

                        // No need to go farther as a composerKey has only one target
                        break;
                    }

                    previousBubblingTarget = bubblingTarget;

                    // use the structural DOM hierarchy until we run out of that and need
                    // to give listeners on document, window, and application a chance to respond
                    switch (bubblingTarget) {
                        case defaultEventManager.application:
                            bubblingTarget = null;
                            break;
                        case targetView:
                            bubblingTarget = defaultEventManager.application;
                            break;
                        case targetDocument:
                            bubblingTarget = targetView;
                            break;
                        case targetDocument.documentElement:
                            bubblingTarget = targetDocument;
                            break;
                        default:
                            bubblingTarget = bubblingTarget.parentProperty ? bubblingTarget[bubblingTarget.parentProperty] : bubblingTarget.parentNode;
                            break;
                    }
                } while (bubblingTarget && previousBubblingTarget !== bubblingTarget);
            }

            //Add Application as the first capture handler (and the last bubble handler)
            if (defaultEventManager.application) {
                affectedListeners.capture.push({listener: defaultEventManager.application, currentTarget: defaultEventManager.application});
                affectedListeners.bubble.push({listener: defaultEventManager.application, currentTarget: defaultEventManager.application});
            }

            return affectedListeners;
        }
    },

    /**
      @private
    */
    _setupCleanupTimer: {
        value: function() {
            var thisRef = this;

            // When a keydown event is stopped, we will not received the corresponding keyup event.
            // If we haven't detected any key events for 2 seconds, let's presume the user is done using teh keyboard
            // and do some internal cleanup in case we missed some keyup events.

            if (this._cleanupTimeout) {
                clearTimeout(this._cleanupTimeout);
            }
            this._cleanupTimeout = setTimeout(function() {
                var keyComposer;

                for (i in thisRef._triggeredKeys) {
                    if (thisRef._triggeredKeys.hasOwnProperty(i)) {
                        delete thisRef._triggeredKeys[i];
                    }
                }

                for (i in thisRef._longPressKeys) {
                    if (thisRef._longPressKeys.hasOwnProperty(i)) {
                        keyComposer = thisRef._longPressKeys[i];
                        clearTimeout(keyComposer._longPressTimeout);
                        keyComposer._longPressTimeout = null;
                        delete thisRef._longPressKeys[i];
                    }
                }

                thisRef._cleanupTimeout = null;
            }, this._cleanupDuration);
        }
    },

    /**
      @private
    */
    _convertKeysToModifiersAndKeyCode: {
        value: function(keys) {
            var nbrKeys,
                key,
                i,
                keyCode = 0,
                modifiers = 0;

            keys = keys.toLowerCase().replace(/ /g, "").replace(/\+\+/g, "+add").split("+");
            nbrKeys = keys.length;

            // Convert the keys into a modifiers mask
            for (i = 0; i < nbrKeys - 1; i ++) {
                // convert alias
                key = keys[i];
                key = KEYNAMES_ALIASES[key] || key;

                // make sure it's a modifier
                key = MODIFIERS[key];
                if (key) {
                    modifiers |= key.value;
                } else {
                    console.warn("Invalid Key sequence:", keys);
                    return null;
                }
            }

            // Extract the final key
            key = keys[nbrKeys - 1];
            key = NORMALIZED_CHARS[key] || key;
//            key = NORMALIZED_KEYS[key] || key;

            if (key.length > 1) {
                keyCode = KEYNAMES_TO_KEYCODES[key];

                // If the key append to be a modifier, we need adjust modifiers accordingly
                key = MODIFIERS[KEYNAMES_ALIASES[key] || key];
                if (key) {
                    modifiers |= key.value;
                }
            } else {
                keyCode = key.toUpperCase().charCodeAt(0);
            }

            return {modifiers: modifiers, keyCode: keyCode};
        }
    },

    /**
      @private
    */
    _decodeKeyIdentifier: {
        value: function(identifier) {
            if (identifier.match(/U\+/)) {
                return parseInt(identifier.substring(2), 16);
            }
        }
    }
});

var _defaultKeyManager = null;
Montage.defineProperty(exports, "defaultKeyManager", {
    get: function() {
        if (!_defaultKeyManager) {
            _defaultKeyManager = KeyManager.create();
        }
        return _defaultKeyManager;
    }
});