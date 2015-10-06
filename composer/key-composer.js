/**
 * @module montage/composer/key-composer
 * @requires montage/core/core
 * @requires montage/composer/composer
 */
var Montage = require("../core/core").Montage,
    Composer = require("./composer").Composer;

// Event types dispatched by KeyComposer
var KEYPRESS_EVENT_TYPE = "keyPress",
    LONGKEYPRESS_EVENT_TYPE = "longKeyPress",
    KEYRELEASE_EVENT_TYPE = "keyRelease";

/**
 * @class KeyComposer
 * @classdesc A `Composer` that makes it easy to listen for specific key
 * combinations and react to them.
 * @extends Composer
 * @fires keyPress
 * @fires longKeyPress
 * @fires keyRelease
 * @example
 * keyComposer = KeyComposer.createKey(textComponent, "command+z", "undo");
 * keyComposer.addEventListener("keyPress", undoManager);
 * // when command+z is pressed inside textComponent,
 * // undoManager.handleUndoKeyPress() will be called.
 */
var KeyComposer = exports.KeyComposer = Composer.specialize( /** @lends KeyComposer# */ {

    _isLoaded: {
        value: false
    },

    _shouldDispatchEvent: {
        value: false
    },

    shouldDispatchLongPress: {
        value: false
    },

    _longPressTimeout: {
        value: null
    },

    _keyRegistered: {
        value: false
    },

    _keys:{
        value: null
    },

    /**
     * The keyboard shortcut to listen to. One alphanumeric character or named
     * non-alphanumeric key, possibly with modifiers connected by '+'. The full
     * list of normalized keys and modifiers is in `KeyManager`.  @example "j",
     * "shift+j", "command+shift+j", "backspace", "win+pipe"
     * @type {string}
     * @default null
     */
    keys: {
        get: function () {
            return this._keys;
        },
        set: function (keys) {
            if (this._keyRegistered) {
                KeyManagerProxy.defaultKeyManager.unregisterKey(this);
                this._keys = keys;
                KeyManagerProxy.defaultKeyManager.registerKey(this);
            } else {
                this._keys = keys;
            }
        }
    },

    load: {
        value: function () {
            // Only register the key if somebody is listening for, else let do
            // it later.
            // console.log("--- load", this.identifier);
            if (this._shouldDispatchEvent && !this._keyRegistered) {
                KeyManagerProxy.defaultKeyManager.registerKey(this);
                this._keyRegistered = true;
            }
        }
    },

    unload: {
        value: function () {
            KeyManagerProxy.defaultKeyManager.unregisterKey(this);
            this._keyRegistered = false;
        }
    },

    /**
     * Listen to find out when this `KeyComposer` detects a matching key press.
     * @function
     * @param {string} type Any of the following types: keyPress, longKeyPress
     * and keyRelease.
     * @param {Object|function} listener The listener object or function to
     * call when dispatching the event.
     * @param {boolean} useCapture Specify if the listener want to be called
     * during the capture phase of the event.
     */
    addEventListener: {
        value: function (type, listener, useCapture) {
            // Optimisation so that we don't dispatch an event if we do not need to
            // console.log("--- addEventListener", this.identifier);
            var component = this.component;

            Composer.addEventListener.call(this, type, listener, useCapture);

            if (type == KEYPRESS_EVENT_TYPE || type == LONGKEYPRESS_EVENT_TYPE || type == KEYRELEASE_EVENT_TYPE) {
                this._shouldDispatchEvent = true;
                if (type == LONGKEYPRESS_EVENT_TYPE) {
                    this._shouldDispatchLongPress = true;
                }

                if (this._isLoaded) {
                    if (!this._keyRegistered) {
                        KeyManagerProxy.defaultKeyManager.registerKey(this);
                        this._keyRegistered = true;
                    }
                } else if (component && typeof component.addComposer !== "function") {
                    // this keyComposer is not associated with an element,
                    // let's make it a global key
                    if (!this.element) {
                        this.element = window;
                    }
                    // this keyComposer is not attached to a UI Component,
                    // let's load it manually
                    this.component.loadComposer(this);
                }
            }
        }
    },

    constructor: {
        value: function () {
            // console.log("KEY CREATED")
            Composer.constructor.call(this);
        }
    },

    /**
     * Called when a composer is part of a template serialization. Responsible
     * for calling `addComposer` on the component or calling `load` on the
     * composer.
     * @private
     */
    deserializedFromTemplate: {
        value: function () {
            var component = this.component;

            if (this.identifier === null) {
                this.identifier = Montage.getInfoForObject(this).label;
            }

            if (component) {
                if (typeof component.addComposer == "function") {
                    component.addComposer(this);
                } else if (!this._isLoaded) {
                    // this keyComposer is not associated with an element,
                    // let's make it a global key
                    if (!this.element) {
                        this.element = window;
                    }
                    // this keyComposer is not attached to a UI Component,
                    // let's load it manually
                    this.component.loadComposer(this);
                }
            }
        }
    }
}, {

    /**
     * Constructs a `KeyComposer` to listen for a key combination on a
     * component.
     *
     * The composer will only respond to key events triggered by the DOM
     * elements inside its component or when its component is set as the
     * `activeTarget`.
     *
     * @param {Object} component The component to attach the `KeyComposer` to.
     * @param {Object} keys The key combination, possibly including modifier
     * keys.
     * @param {Object} identifier The identifier for events triggered by this
     * composer.
     * @returns {Object} the newly created `KeyComposer` Object
     */
    createKey: {
        value: function (component, keys, identifier) {
            var key = this;

            if (this === KeyComposer) {
                // This function has been called without creating a new
                // instance of KeyComposer first.
                key = new KeyComposer();
            }

            if (!identifier) {
                if (component.identifier) {
                    identifier = component.identifier + keys.toLowerCase().replace(/[ +]/g).toCapitalized();
                } else {
                    identifier = keys.toLowerCase().replace(/[ +]/g);
                }
            }
            key.keys = keys;
            key.identifier = identifier;

            // console.log("CREATING KEY:", component, key, key.identifier);

            component.addComposer(key);

            return key;
        }
    },

    /**
     * Constructs a `KeyComposer` listening for a key combination anywhere on
     * the page.
     *
     * The composer will respond to key events that bubble up to the `window`.
     *
     * @function
     * @param {Object} component. The component to attach the keyComposer to.
     * @param {Object} keys. The key sequence.
     * @param {Object} identifier. The identifier.
     * @returns {Object} the newly created KeyComposer Object
     */
    createGlobalKey: {
        value: function (component, keys, identifier) {
            var key = this;

            if (this === KeyComposer) {
                // This function has been called without creating a new
                // instance of KeyComposer first
                key = new KeyComposer();
            }

            key.keys = keys;
            key.identifier = identifier;
            // console.log("CREATING GLOBAL KEY:", component, key);

            component.addComposerForElement(key, window);

            return key;
        }
    }

});


/**
 * @class KeyManagerProxy
 * @classdesc Provide a proxy for lazy load of KeyManager.
 * @extends Montage
 * @private
 */
var _keyManagerProxy= null;

var KeyManagerProxy = Montage.specialize(  {

    /**
     * @private
     */
    _defaultKeyManager: {
        value: null
    },

    /**
     * @private
     */
    _loadingDefaultKeyManager: {
        value: false
    },

    /**
     * @private
     */
    _keysToRegister : {
        value: []
    },

    /**
     * @private
     */
    constructor: {
        value: function () {
            // console.log("PROXY CREATED")
        }
    },

    /**
     * Register a `KeyComposer` with the default `KeyManager`.
     * @function
     * @param {Object} keyComposer. A key composer object.
     */
    registerKey: {
        value: function (keyComposer) {
            var thisRef = this;

            if (!this._defaultKeyManager) {
                this._keysToRegister.push(keyComposer);
                if (!this._loadingDefaultKeyManager) {
                    this._loadingDefaultKeyManager = true;

                    require.async("core/event/key-manager")
                    .then(function (module) {
                        var keyManager = thisRef._defaultKeyManager = module.defaultKeyManager;
                        thisRef._keysToRegister.forEach(function (keyComposer) {
                            keyManager.registerKey(keyComposer);
                        });
                        thisRef._keysToRegister.length = 0;
                    });
                }
            } else {
                // This will happend only if somebody uses a cached return
                // value from KeyManagerProxy.defaultKeyManager
                this._defaultKeyManager.registerKey(keyComposer);
            }
        }
    },

    /**
     * Unregister a `KeyComposer` with the default `KeyManager`.
     * @function
     * @param {Object} keyComposer. A key composer object.
     */
    unregisterKey: {
        value: function (keyComposer) {
            if (this._defaultKeyManager) {
                this._defaultKeyManager.unregisterKey(keyComposer);
            }
        }
    }

}, {

    /**
     * Return either the default `KeyManager` or its `KeyManagerProxy`.
     * @function
     * @returns {Object} `KeyManager` or `KeyManagerProxy`.
     */
    defaultKeyManager: {
        get: function () {
            if (!_keyManagerProxy) {
                _keyManagerProxy = new KeyManagerProxy();
            }
            if (this._defaultKeyManager) {
                return this._defaultKeyManager;
            } else {
                return _keyManagerProxy;
            }
        }
    }

});
