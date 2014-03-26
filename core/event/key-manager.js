/**
 * @module montage/core/event/key-manager
 * @requires montage/core/core
 */

var Montage = require("../core").Montage,
    defaultEventManager = require("./event-manager").defaultEventManager,
    MutableEvent = require("./mutable-event").MutableEvent;

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

    // W3C Optional Key Code (mostly for US keyboard layout)
    semicolon:              186,
    colon:                  186,
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

OPERAMAC_KEYNAMES_TO_KEYCODES = {
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
    semicolon:              ";",
    colon:                  ":",
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

NORMALIZED_CHARS = null;    // Will be generated from the NORMALIZED_KEYS


/* Event type dispatched by KeyComposer */
var KEYPRESS_EVENT_TYPE = "keyPress",
    LONGKEYPRESS_EVENT_TYPE = "longKeyPress",
    KEYRELEASE_EVENT_TYPE = "keyRelease";


/**
 * The KeyManager dispatches KeyComposer events when it detects a keyComposer
 * has been pressed or released.  Do not create a KeyManager directly but
 * instead require for the defaultKeyManager:
 *
 * ```js
 * require("./key-manager").defaultKeyManager
 * ```
 *
 * @class KeyManager
 * @classdesc Dispatches events to a key composer. There can only be one.
 * @extends Montage
*/
var KeyManager = exports.KeyManager = Montage.specialize(/** @lends KeyManager# */ {

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
    _cleanupThreshold: {
        value: 2000
    },

    /**
      @private
    */
    _longPressThreshold: {
        value: 1000
    },

    /**
     * The number of milliseconds a key must be pressed in order to dispatch a
     * longKeyPress event.
     * @type {number}
     * @default 1000
     */
    longPressThreshold: {
        get: function() {
            return this._longPressThreshold;
        },
        set: function(value) {
            if (value > 0 && value !== this._longPressThreshold) {
                this._longPressThreshold = value;
                if (this._longPressThreshold > this._cleanupThreshold - 100) {
                    this._cleanupThreshold = this._longPressThreshold + 100;
                } else {
                    this._cleanupThreshold = 2000;
                }
            }
        }
    },

    /**
     * Register a composerKey.
     * @method
     * @param {Object} keyComposer. The key to register.
     */
    registerKey: {
        value: function(keyComposer) {
                // validates the keys:
            var normalizedKeys = this._normalizeKeySequence(keyComposer.keys),
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

                this._registerListeners();
            }
        }
    },

    /**
     * Unregister a composerKey. if a key has been registered multiple time,
     * unregister must be called the same amount of time before the key is
     * actually unregistered.
     * @method
     * @param {Object} keyComposer The key to unregister.
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

    constructor: {
        value: function() {
            var userAgent = navigator.userAgent,
                code;

            if (_defaultKeyManager) {
                console.warn("Rather than creating a new KeyManager object, you might want to use the default key manager");
            }

            // Browser detection
            if (userAgent.match(/ firefox\//i)) {
                this._firefox = true;
            } else if (userAgent.match(/ appleWebkit\//i)) {
                this._webkit = true;
                if (userAgent.match(/ chrome\//i)) {
                    this._chrome = true;
                }
            } else if (userAgent.match(/^opera\//i)) {
                this._opera = true;
            }

            // Platform Detection
            if (userAgent.match(/macintosh/i)) {
                this._mac = true;
                if (this._opera) {
                    this._operaMac = true;
                }
            }

            // Handle the platform specific COMMAND modifier
            if (this._mac) {
                MODIFIERS.command = MODIFIERS.meta;
            } else {
                MODIFIERS.command = MODIFIERS.control;
            }

            // Patch the KeyCode dictionary for Opera or Firefox
            if (this._operaMac) {
                for (code in OPERAMAC_KEYNAMES_TO_KEYCODES) {
                    KEYNAMES_TO_KEYCODES[code] = OPERAMAC_KEYNAMES_TO_KEYCODES[code];
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
                    if (identifierCode && identifierCode !== keyCode && submap[identifierCode]) {
                        this._dispatchComposerKeyMatches(submap[identifierCode], event);
                    }
                }
            }

            this._setupCleanupTimer();
        }
    },

    captureKeypress: {
        value: function(event) {
            var charCode = event.charCode,
                keyCode,
                identifierCode,
                submap,
                stopped = false;

            // console.log("  captureKeypress:", event.keyCode, event.charCode, event.keyIdentifier, this._modifiers);
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
                if (!stopped && charCode && charCode !== keyCode && submap[charCode]) {
                    stopped = this._dispatchComposerKeyMatches(submap[charCode], event);
                }

                // Check the keyIdentifier for a match
                if (!stopped && event.keyIdentifier) {
                    identifierCode = KEYNAMES_TO_KEYCODES[event.keyIdentifier.toLowerCase()] ||
                        this._decodeKeyIdentifier(event.keyIdentifier);
                    if (identifierCode && identifierCode !== keyCode && submap[identifierCode]) {
                        this._dispatchComposerKeyMatches(submap[identifierCode], event);
                    }
                }
            }

            this._setupCleanupTimer();
        }
    },

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
                if (!stopped && event.keyIdentifier) {
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

            this._cleanup();
        }
    },

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

    _preprocessKeyEvent: {
        value: function(event) {
            var thisRef = this,
                eventType = event.type,
                keyCode = event.keyCode,
                modifiers,
                value;

            if (this._operaMac) {
                if (this._operaModifierTimeout) {
                    clearTimeout(this._operaModifierTimeout);
                    this._operaModifierTimeout = null;
                }
            }

            if (eventType == "keydown" || eventType == "keyup") {
                if (this._operaMac) {
                    // Opera Mac is not very good at keeping track of which modifiers are pressed or not!
                    value = (eventType == "keydown");
                    if (keyCode == KEYNAMES_TO_KEYCODES.shift) {
                        this._shiftKey = value;
                    } else if (keyCode == KEYNAMES_TO_KEYCODES.alt) {
                        this._altKey = value;
                    } else if (keyCode == KEYNAMES_TO_KEYCODES.meta) {
                        if (this._mac) {
                            this._metaKey = value;
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
                        }, this._cleanupThreshold + 1000);
                    }
                } else {
                    this._shiftKey = event.shiftKey;
                    this._altKey = event.altKey;
                    this._metaKey = event.metaKey;
                    this._ctrlKey = event.ctrlKey;
                }
            }

            if (this._mac && this._webkit && keyCode == KEYNAMES_TO_KEYCODES.contextmenu) {
                // Webkit browsers will interpret the right command key as the window context-menu but will keep the
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

    _registerListeners: {
        value: function() {
            if (!this._keyEventsListenerInstalled) {
                window.addEventListener("keydown", this, true);
                window.addEventListener("keypress", this, true);
                window.addEventListener("keyup", this, true);
                this._keyEventsListenerInstalled = true;
            }
        }
    },

    _unregisterListeners: {
        value: function() {
            if (this._keyEventsListenerInstalled) {
                window.removeEventListener("keydown", this, true);
                window.removeEventListener("keypress", this, true);
                window.removeEventListener("keyup", this, true);
                this._keyEventsListenerInstalled = false;
            }
        }
    },

    _dispatchComposerKeyMatches: {
        value: function(matches, event) {
            var thisRef = this,
                stopped = false,
                keyUp = event.type == "keyup",
                keyDown = event.type == "keydown",
                eventType = keyUp ? KEYRELEASE_EVENT_TYPE : KEYPRESS_EVENT_TYPE,
                nbrMatches = matches.length,
                keyComposer,
                keyComposerEvent,
                triggeredKeys,
                i;

            // matches could be either an array of matches or an array of keyComposers
            for (i = 0; i < nbrMatches && !stopped; i ++) {
                keyComposer = matches[i].object || matches[i];

                // Make sure keyboard event's target is a descendant of the keyComposer's element
                var target = event.target,
                    element = keyComposer.element,
                    onTarget = (keyComposer.element === window);

                while (!onTarget) {
                    onTarget = (target === element);

                    if (target == document) {
                        break;
                    } else {
                        target = target.parentElement;
                        if (!target) {
                            target = document;
                        }
                    }
                }

                // Most components can't receive key events directly: the events target the window,
                // but we should also fire them on composers of the activeTarget component
                if (!onTarget && defaultEventManager.activeTarget != keyComposer.component) {
                    continue;
                }

                if (keyUp) {
                    triggeredKeys = Object.keys(this._triggeredKeys);
                    if (triggeredKeys.indexOf(keyComposer.uuid) == -1) {
                        // Do not generate a keyup event if the composerKey has not been triggered on keydown or keypress
                        continue;
                    }

                    if (keyComposer._longPressTimeout) {
                        clearTimeout(keyComposer._longPressTimeout);
                        keyComposer._longPressTimeout = null;
                        delete this._longPressKeys[keyComposer.uuid];
                    }
                } else {
                    if (keyDown) {
                        // Reset trigger
                        delete this._triggeredKeys[keyComposer.uuid];
                        event.preventDefault();
                    } else if (this._triggeredKeys[keyComposer.uuid]) {
                        // that key has already been triggered, let's ignore it...
                        continue;
                    }
                    if (keyComposer._shouldDispatchLongPress && !keyComposer._longPressTimeout) {
                        keyComposer._longPressTimeout = setTimeout(function() {
                            var longPressEvent;

                            keyComposer._longPressTimeout = null;

                            longPressEvent = document.createEvent("CustomEvent");
                            longPressEvent.initCustomEvent(LONGKEYPRESS_EVENT_TYPE, true, true, null);
                            longPressEvent.activeElement = event.target;
                            longPressEvent.identifier = keyComposer.identifier;
                            longPressEvent = MutableEvent.fromEvent(longPressEvent);
                            keyComposer.dispatchEvent(longPressEvent);
                            delete thisRef._longPressKeys[keyComposer.uuid];
                        }, this._longPressThreshold);

                        // Let's remember any longKeyPress key waiting for timeout
                        this._longPressKeys[keyComposer.uuid] = keyComposer;
                    }
                }

                keyComposerEvent = document.createEvent("CustomEvent");
                keyComposerEvent.initCustomEvent(eventType, true, true, null);
                keyComposerEvent.activeElement = event.target;
                keyComposerEvent.identifier = keyComposer.identifier;
                keyComposerEvent.keyComposer = keyComposer;
                keyComposerEvent = MutableEvent.fromEvent(keyComposerEvent);
                if (this._opera) {
                    keyComposerEvent.type = eventType; // Opera modifes the capitalization of custom event's type when that one is similar to a native event's type
                }
                keyComposer.dispatchEvent(keyComposerEvent);

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

    _cleanup: {
        value: function() {
            var keyComposer,
                i;

            if (this._cleanupTimeout) {
                clearTimeout(this._cleanupTimeout);
            }

            for (i in this._triggeredKeys) {
                if (this._triggeredKeys.hasOwnProperty(i)) {
                    delete this._triggeredKeys[i];
                }
            }

            for (i in this._longPressKeys) {
                if (this._longPressKeys.hasOwnProperty(i)) {
                    keyComposer = this._longPressKeys[i];
                    clearTimeout(keyComposer._longPressTimeout);
                    keyComposer._longPressTimeout = null;
                    delete this._longPressKeys[i];
                }
            }

            this._cleanupTimeout = null;
        }
    },

    _setupCleanupTimer: {
        value: function() {
            var thisRef = this;

            // When a keydown event is stopped, we will not received the corresponding keyup event.
            // If we haven't detected any key events for 2 seconds, let's presume the user is done using the keyboard
            // and do some internal cleanup in case we missed some keyup events.

            if (this._cleanupTimeout) {
                clearTimeout(this._cleanupTimeout);
            }
            this._cleanupTimeout = setTimeout(function() {
                thisRef._cleanup();
            }, this._cleanupThreshold);
        }
    },

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
            key = NORMALIZED_KEYS[key] || key;  // This is needed for browsers that don't use W3C Optional Key Codes

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
            _defaultKeyManager = new KeyManager();
        }
        return _defaultKeyManager;
    }
});

