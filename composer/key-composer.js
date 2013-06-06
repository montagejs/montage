/**
    @module montage/composer/key-composer
    @requires montage/core/core
    @requires montage/composer/composer
*/
var Montage = require("montage").Montage,
    Composer = require("composer/composer").Composer;


/**
 * @module montage/composer/key-composer
 */
// Event type dispatched by KeyComposer
var KEYPRESS_EVENT_TYPE = "keyPress",
    LONGKEYPRESS_EVENT_TYPE = "longKeyPress",
    KEYRELEASE_EVENT_TYPE = "keyRelease";


/**
 * @class KeyComposer
 * @classdesc Create a virtual key composed of none or several key modifiers (shift, control, alt and meta) and one native key.
 * @extends Composer
 */
var KeyComposer = exports.KeyComposer = Composer.specialize( /** @lends KeyComposer# */ {

    /**
    * @private
    */
    _isLoaded: {
        value: false
    },

    /**
    * @private
    */
    _shouldDispatchEvent: {
        value: false
    },

    /**
    * @private
    */
    shouldDispatchLongPress: {
        value: false
    },

    /**
      @private
    */
    _longPressTimeout: {
        value: null
    },

    /**
    * @private
    */
    _keyRegistered: {
        value: false
    },

    /**
    * @private
    */
    _keys:{
        value: null
    },

    /**
      The sequence of keys to compose.
      @type {string}
      @default null
    */
    keys: {
        get: function() {
            return this._keys;
        },
        set: function(keys) {
            if (this._keyRegistered) {
                KeyManagerProxy.defaultKeyManager.unregisterKey(this);
                this._keys = keys;
                KeyManagerProxy.defaultKeyManager.registerKey(this);
            } else {
                this._keys = keys;
            }
        }
    },

    /**
    * @private
    */
    _identifier: { value: null },

    /**
      The keyComposer's identifier.
      @type {string}
      @default null
    */
    identifier: {
       get: function() {
           return this._identifier;
       },
        set: function(identifier) {
            this._identifier = identifier;
        }
    },

    /**
      load method
      @private
    */
    load: {
        value: function() {
            // Only register the key if somebody is listening for, else let do it later
            // console.log("--- load", this.identifier);
            this._isLoaded = true;
            if (this._shouldDispatchEvent && !this._keyRegistered) {
                KeyManagerProxy.defaultKeyManager.registerKey(this);
                this._keyRegistered = true;
            }
        }
    },

    /**
      unload method
      @private
    */
    unload: {
        value: function() {
            this._isLoaded = false;
            KeyManagerProxy.defaultKeyManager.unregisterKey(this);
            this._keyRegistered = false;
        }
    },

    /**
      Add an event listener to the composerKey.
      @function
      @param {string} type. Any of the following types: keyPress, longKeyPress and keyRelease.
      @param {Object|function} listener. The listener object or function to call when dispatching the event.
      @param {boolean} useCapture. Specify if the listener want to be called during the capture phase of the event.
    */
    addEventListener: {
        value: function(type, listener, useCapture) {
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
                    // this keyComposer is not associated with an element, let's make it a global key
                    if (!this.element) {
                        this.element = window;
                    }
                    // this keyComposer is not attached to a UI Component, let's load it manually
                    this.load();
                }
            }
        }
    },

    /**
      constructor method
      @private
    */
    constructor: {
        value: function() {
            // console.log("KEY CREATED")
            Composer.constructor.call(this);
        }
    },

    /**
      Called when a composer is part of a template serialization.  It's responsible for calling addComposer on
      the component or call load on the composer.
      @private
    */
    deserializedFromTemplate: {
        value: function() {
            var component = this.component;

            if (this.identifier === null) {
                this.identifier = Montage.getInfoForObject(this).label;
            }

            if (component) {
                if (typeof component.addComposer == "function") {
                    component.addComposer(this);
                } else if (!this._isLoaded) {
                    // this keyComposer is not associated with an element, let's make it a global key
                    if (!this.element) {
                        this.element = window;
                    }
                    // this keyComposer is not attached to a UI Component, let's load it manually
                    this.load();
                }
            }
        }
    }
}, {

    /**
      Create a ComposerKey.
      The key will only dispatch events when the component's element is in the native key event target path.
      If no identifier is provided, the keys and component's identifier will be used to generate an identifier.
      Note: You do not have to call new KeyComposer() before calling this method.
      @function
      @param {Object} component. The component to attach the keyComposer to.
      @param {Object} keys. The key sequence.
      @param {Object} identifier. The identifier.
      @returns {Object} the newly created KeyComposer Object
    */
    createKey: {
        value: function(component, keys, identifier) {
            var key = this;

            if (this === KeyComposer) {
                // This function has been called without creating a new instance of KeyComposer first
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
      Create a global composerKey.
      A global key will dispatch events without requiring the component's element be in the native key event target path
      If no identifier is provided, the keys and component's identifier will be used to generate an identifier.
      Note: You do not have to call new KeyComposer() before calling this method.
      @function
      @param {Object} component. The component to attach the keyComposer to.
      @param {Object} keys. The key sequence.
      @param {Object} identifier. The identifier.
      @returns {Object} the newly created KeyComposer Object
    */
    createGlobalKey: {
        value: function(component, keys, identifier) {
            var key = this;

            if (this === KeyComposer) {
                // This function has been called without creating a new instance of KeyComposer first
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
      @private
    */
    _defaultKeyManager: {
        value: null
    },

    /**
      @private
    */
    _loadingDefaultKeyManager: {
        value: false
    },

    /**
      constructor method
      @private
    */
    _keysToRegister : {
        value: []
    },

    /**
      constructor method
      @private
    */
    constructor: {
        value: function() {
            // console.log("PROXY CREATED")
        }
    },

    /**
      Register a composerKey with the default KeyManager.
      @function
      @param {Object} keyComposer. A key composer object.
    */
    registerKey: {
        value: function(keyComposer) {
            var thisRef = this;

            if (!this._defaultKeyManager) {
                this._keysToRegister.push(keyComposer);
                if (!this._loadingDefaultKeyManager) {
                    this._loadingDefaultKeyManager = true;

                    require.async("core/event/key-manager")
                    .then(function(module) {
                        var keyManager = thisRef._defaultKeyManager = module.defaultKeyManager;
                        thisRef._keysToRegister.forEach(function(keyComposer) {
                            keyManager.registerKey(keyComposer);
                        });
                        thisRef._keysToRegister.length = 0;
                    })
                    .done();
                }
            } else {
                // This will happend only if somebody uses a cached return value from KeyManagerProxy.defaultKeyManager
                this._defaultKeyManager.registerKey(keyComposer);
            }
        }
    },

    /**
      Unregister a composerKey with the default KeyManager.
      @function
      @param {Object} keyComposer. A key composer object.
    */
    unregisterKey: {
        value: function(keyComposer) {
            if (this._defaultKeyManager) {
                this._defaultKeyManager.unregisterKey(keyComposer);
            }
        }
    }
    
}, {

    /**
      Return either the default KeyManager or its KeyManagerProxy.
      @function
      @returns {Object} KeyManager or KeyManagerProxy.
    */
    defaultKeyManager: {
       get: function() {
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
