    /*global require,exports */

/**
 * @module montage/core/localizer
 * @requires montage/core/core
 * @requires montage/core/logger
 * @requires montage/core/deserializer
 * @requires montage/core/promise
 * @requires montage/core/messageformat
 * @requires montage/core/messageformat-locale
 */
var Montage = require("./core").Montage,
    MessageFormat = require("./messageformat"),
    rootComponent = require("../ui/component").__root__,
    logger = require("./logger").logger("localizer"),
    Serializer = require("./serialization/serializer/montage-serializer").MontageSerializer,
    Deserializer = require("./serialization/deserializer/montage-deserializer").MontageDeserializer,
    Promise = require("./promise").Promise,
    Bindings = require("./core").Bindings,
    FrbBindings = require("frb/bindings"),
    stringify = require("frb/stringify"),
    expand = require("frb/expand"),
    Map = require("collections/map"),
    Scope = require("frb/scope");

// Add all locales to MessageFormat object
MessageFormat.locale = require("./messageformat-locale");

var KEY_KEY = "key",
    DEFAULT_MESSAGE_KEY = "default",
    LOCALE_STORAGE_KEY = "montage_locale",

    // directory name that the locales are stored under
    LOCALES_DIRECTORY = "locale",
    // filename (without extension) of the file that contains the messages
    MESSAGES_FILENAME = "messages",
    // filename of the manifest file
    MANIFEST_FILENAME = "manifest.json";

var EMPTY_STRING_FUNCTION = function () { return ""; };

// This is not a strict match for the grammar in
// http://tools.ietf.org/html/rfc5646, but it's good enough for our purposes.
var reLanguageTagValidator = /^[a-zA-Z]+(?:-[a-zA-Z0-9]+)*$/;

var defaultLocalizer;

/**
 * @class Localizer
 * @extends Montage
 */
var Localizer = exports.Localizer = Montage.specialize( /** @lends Localizer.prototype # */ {

    /**
     * @function
     * @param {string} [locale] The RFC-5646 language tag this localizer should use. Defaults to defaultLocalizer.locale
     * @returns {Localizer} The Localizer object it was called on.
     */
    initWithLocale: {
        value: function (locale) {
            var defaultLocaleStored;

            if (this.storesLocale && typeof window !== "undefined" && window.localStorage) {
                defaultLocaleStored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
            }

            var locateCandidate = locale || defaultLocaleStored || window.navigator.userLanguage || window.navigator.language || Localizer.defaultLocale,
                defaultLocale = this.callDelegateMethod("localizerWillUseLocale", this, locateCandidate);

            this.locale = defaultLocale || locateCandidate;
            this._isInitialized = true;

            this.loadMessages();

            return this;
        }
    },


    initWithLocaleAndDelegate: {
        value: function (locale, delegate) {
            this.delegate = delegate;

            return this.initWithLocale(locale);
        }
    },


    storesLocale: {
        value: false
    },


    component: {
        value: null
    },


    _delegate: {
        value: null
    },

    /**
     * Delegate to get the default locale or the locale messages.
     * Should implement a `getDefaultLocale` method that returns
     * a language-tag string that can be passed to {@link locale}
     * Should implement a `localizerWillLoadMessages` method that returns
     * a Promise that will return a "messages" object with a combination of keys/messages.
     *
     * @example
     * myDelegate.localizerWillLoadMessages = function () {
     *     return Promise(function (resolve, reject){
     *          return {
     *              language_key: "English",
     *              hello_key: "Hello"
     *          };
     *     });
     * }
     *
     * @type Object
     * @default null
     */
    delegate: {
        set: function (delegate) {
            if (!this._delegate && delegate && typeof delegate === "object") {
                this._delegate = delegate;
            }
        },
        get: function () {
            return this._delegate;
        }
    },

    _isInitialized: {
        value: false
    },

    isInitialized: {
        get: function () {
            return this._isInitialized;
        }
    },

    /**
     * The MessageFormat object to use.
     * @type {MessageFormat}
     * @default null
     */
    messageFormat: {
        serializable: false,
        value: null
    },

    _messages: {
        value: null
    },

    /**
     * A map from keys to messages.
     * @type Object
     * @default null
     */
    messages: {
        get: function () {
            return this._messages;
        },
        set: function (value) {
            if (this._messages !== value) {
                if (value !== undefined && value !== null && typeof value !== "object") {
                    throw new TypeError(value, " is not an object");
                }

                this._messages = value;
            }
        }
    },

    /**
     * A promise for the messages property
     * @type Promise
     * @default null
     */
    messagesPromise: {
        serializable: false,
        value: null
    },

    _locale: {
        value: null
    },

    /**
     * A RFC-5646 language-tag specifying the locale of this localizer.
     * Setting the locale will create a new {@link MessageFormat} object with
     * the new locale.
     * @type {string}
     * @default null
     */
    locale: {
        get: function () {
            return this._locale;
        },
        set: function (value) {
            if (!reLanguageTagValidator.test(value)) {
                throw new TypeError("Language tag '" + value + "' is not valid. It must match http://tools.ietf.org/html/rfc5646 (alphanumeric characters separated by hyphens)");
            }

            if (this._locale !== value) {
                var previousLocale = this._locale;

                this._locale = value;
                this.messageFormat = new MessageFormat(value);

                if (previousLocale && previousLocale !== this._locale) {
                    var self = this;

                    this.loadMessages().then(function () {
                        self._dispatchLocaleChange(previousLocale);
                    });
                }

                if (this.storesLocale && typeof window !== "undefined" && window.localStorage) {
                    // If possible, save locale
                    try {
                        window.localStorage.setItem(LOCALE_STORAGE_KEY, value);
                    } catch (e) {
                        // LocalStorage quota might have been exceeded
                        // iOS Safari emits a quota exceeded error from private mode always
                    }
                }
            }
        }
    },

    _availableLocales: {
        value: null
    },

    /**
     * A promise for the locales available in this package. Resolves to an
     * array of strings, each containing a locale tag.
     * @type Promise
     * @default null
     *
     * @returns {Promise.<Array.<String>>}
     */
    availableLocales: {
        get: function () {
            if (this._availableLocales) {
                return this._availableLocales;
            }

            this._availableLocales = this.callDelegateMethod("localizerWillPromiseAvailableLocales", this);

            if (!this._availableLocales) {
                this._availableLocales = this._manifest.get("files").get(LOCALES_DIRECTORY).get("files").then(function (locales) {
                    return Object.keys(locales);
                });
            }

            return this._availableLocales;
        }
    },

    _require: {
        value: global.mr
    },

    /**
     * The require function to use in {@link loadMessages}.
     * By default this is set to the global require, meaning that messages
     * will be loaded from the root of the application. To load messages
     * from the root of your package set this to the require function from
     * any class in the package.
     * @type Function
     * @default global require | null
     */
    require: {
        serializable: false,
        get: function () {
            return this._require;
        },
        set: function (value) {
            if (this._require !== value) {
                this.__manifest = null;
                this._require = value;
            }
        }
    },

    __manifest: {
        value: null
    },

    /**
     * Promise for the manifest
     * @private
     * @type Promise
     * @default null
     */
    _manifest: {
        depends: ["require"],
        get: function () {
            var messageRequire = this.require;

            if (messageRequire.packageDescription.manifest === true) {
                if (!this.__manifest) {
                    this.__manifest = messageRequire.async(MANIFEST_FILENAME);
                }
                return this.__manifest;
            } else {
                return Promise.reject(new Error(
                    "Package has no manifest. " + messageRequire.location +
                    "package.json must contain \"manifest\": true and " +
                    messageRequire.location+MANIFEST_FILENAME+" must exist"
                ));
            }
        }
    },

    loadMessagesTimeout: {
        value: 5000
    },

    /**
     * Load messages for the locale
     * @function
     * @param {?number|boolean} [timeout=5000] Number of milliseconds to wait
     * before failing. Set to false for no timeout.
     * @param {Function} [callback] Called on successful loading of messages.
     * Using the returned promise is recomended.
     * @returns {Promise} A promise for the messages.
     */
    loadMessages: {
        value: function (timeout, callback) {
            if (!this.require) {
                throw new Error("Cannot load messages as", this, "require is not set");
            }

            if (typeof timeout !== "number") {
                timeout = this.loadMessagesTimeout;
            }

            this.messages = null;

            var self = this,
                promise = this.callDelegateMethod("localizerWillLoadMessages",this);

            //A delegate may have set a different timeout:
            if(this.hasOwnProperty("loadMessagesTimeout")) {
                timeout = this.loadMessagesTimeout;
            }

            if (promise) {
                promise = promise.timeout(timeout);

            } else {
                promise = this._manifest.timeout(timeout).then(function (manifest) {
                    return self._loadMessageFiles(manifest.files);
                });
            }

            this.messagesPromise = promise.then(function (localesMessages) {
                return self._collapseMessages(localesMessages);
            },function(error) {
                console.error("Could not load messages for '" + self.locale + "': " + error);
                throw error;
            }).then(function (messages) {
                if (typeof callback === "function") {
                    callback(messages);
                }

                return messages;
            });

            return this.messagesPromise;
        }
    },

    /**
     * Load the locale appropriate message files from the given manifest
     * structure.
     * @function
     * @param {Object} files An object mapping directory (locale) names to
     * @returns {Promise} A promise that will be resolved with an array
     * containing the content of message files appropriate to this locale.
     * Suitable for passing into {@link _collapseMessages}.
     * @private
     */
    _loadMessageFiles: {
        value: function (files) {
            var messageRequire = this.require;

            if (!files) {
                return Promise.reject(new Error(
                    messageRequire.location + MANIFEST_FILENAME +
                    " does not contain a 'files' property"
                ));
            }

            var availableLocales, localesMessagesP = [], fallbackLocale, localeFiles, filename;

            if (!(LOCALES_DIRECTORY in files)) {
                return Promise.reject(new Error(
                    "Package does not contain a '" + LOCALES_DIRECTORY + "' directory"
                ));
            }

            availableLocales = files[LOCALES_DIRECTORY].files;
            fallbackLocale = this._locale;

            // Fallback through the language tags, loading any available
            // message files
            while (fallbackLocale !== "") {
                if (availableLocales.hasOwnProperty(fallbackLocale)) {
                    localeFiles = availableLocales[fallbackLocale].files;

                    // Look for Javascript or JSON message files, with the
                    // compiled JS files taking precedence
                    if ((filename = MESSAGES_FILENAME + ".js") in localeFiles ||
                        (filename = MESSAGES_FILENAME + ".json") in localeFiles
                    ) {
                        // Require the message file
                        localesMessagesP.push(messageRequire.async(LOCALES_DIRECTORY + "/" + fallbackLocale + "/" + filename));
                    } else if(logger.isDebug) {
                        logger.debug(this, "Warning: '" + LOCALES_DIRECTORY + "/" + fallbackLocale +
                            "/' does not contain '" + MESSAGES_FILENAME + ".json' or '" + MESSAGES_FILENAME + ".js'");
                    }

                }
                // Strip the last language tag off of the locale
                fallbackLocale = fallbackLocale.substring(0, fallbackLocale.lastIndexOf("-"));
            }

            if (!localesMessagesP.length) {
                return Promise.reject(new Error("Could not find any " + MESSAGES_FILENAME + ".json or " + MESSAGES_FILENAME + ".js files"));
            }

            var promise = Promise.all(localesMessagesP);
            if (logger.isDebug) {
                var self = this;
                promise = promise.then(function (localesMessages) {
                    logger.debug(self, "loaded " + localesMessages.length + " message files");
                    return localesMessages;
                });
            }
            return promise;
        }
    },

    /**
     * Collapse an array of message objects into one, earlier elements taking
     * precedence over later ones.
     * @function
     * @param {Array<Object>} localesMessages
     * @returns {Object} An object mapping messages keys to the messages
     * @example
     * [{hi: "Good-day"}, {hi: "Hello", bye: "Bye"}]
     * // results in
     * {hi: "Good-day", bye: "Bye"}
     * @private
     */
    _collapseMessages: {
        value: function (localesMessages) {
            var messages = {};

            // Go through each set of messages, adding any keys that haven't
            // already been set
            for (var i = 0, l = localesMessages.length; i < l; i++) {
                var localeMessages = localesMessages[i];
                for (var key in localeMessages) {
                    if (localeMessages.hasOwnProperty(key)) {
                        if (!(key in messages)) {
                            messages[key] = localeMessages[key];
                        }
                    }
                }
            }
            this.messages = messages;
            return messages;
        }
    },

    // Caches the compiled functions from strings
    _compiledMessageCache: {
        value: Object.create(null)
    },

    /**
     * Localize a key and return a message function.
     *
     * If the message is a precompiled function then this is returned
     * directly. Otherwise the message string is compiled to a function with
     * <a href="https://github.com/SlexAxton/messageformat.js#readme">
     * messageformat.js</a>. The resulting function takes an object mapping
     * from variables in the message to their values.
     *
     * Be aware that if the messages have not loaded yet this method
     * will not return the localized string. See `localize` for
     * method that works whether the messages have loaded or not.
     *
     * @function
     * @param {string} key The key to the string in the {@link messages} object.
     * @param {string} defaultMessage The value to use if key does not exist.
     * @returns {Function} A function that accepts an object mapping variables
     * in the message string to values.
     */
    localizeSync: {
        value: function (key, defaultMessage) {
            var message, type, compiled;

            if (!key && !defaultMessage) {
                throw new Error("Key or default message must be truthy, not " + key + " and " + defaultMessage);
            }

            if (this._messages && key in this._messages) {
                message = this._messages[key];
                type = typeof message;

                if (type === "function") {
                    return message;
                } else if (type === "object") {
                    if (!("message" in message)) {
                        throw new Error(message, "does not contain a 'message' property");
                    }

                    message = message.message;
                }
            } else {
                message = defaultMessage;
            }

            if (!message) {
                console.warn("No message or default message for key '"+ key +"'");
                // Give back something so there's at least something for the UI
                message = key;
            }

            if (message in this._compiledMessageCache) {
                return this._compiledMessageCache[message];
            }

            var ast = this.messageFormat.parse(message);
            // if we have a simple string then create a very simple function,
            // and set it as its own toString so that it behaves a bit like
            // a string
            if (ast.program && ast.program.statements && ast.program.statements.length === 1 && ast.program.statements[0].type === "string") {
                compiled = function () { return message; };
                compiled.toString = compiled;
            } else {
                /* jshint evil:true */
                compiled = (new Function('MessageFormat', 'return ' + this.messageFormat.precompile(ast))(MessageFormat));
                /* jshint evil:false */
            }

            this._compiledMessageCache[message] = compiled;
            return compiled;
        }
    },

    /**
     * Async version of {@link localize}.
     *
     * Waits for the localizer to get messages before localizing the key.
     * Use either the callback or the promise.
     *
     * ```js
     * defaultLocalizer.localize("hello_name", "Hello, {name}!").then(function (hi) {
     *     console.log(hi({name: "World"})); // => "Hello, World!""
     *     console.log(hi()); // => Error: MessageFormat: No data passed to function.
     * });
     * ```
     *
     * If the message for the key is "simple", i.e. it does not contain any
     * variables, then the function will implement a custom `toString`
     * function that also returns the message. This means that you can use
     * the function like a string. Example:
     *
     * ```js
     * defaultLocalizer.localize("hello", "Hello").then(function (hi) {
     *     // Concatenating an object to a string calls its toString
     *     myObject.hello = "" + hi;
     *     var y = "The greeting '" + hi + "' is used in this locale";
     *     // textContent only accepts strings and so calls toString
     *     button.textContent = hi;
     *     // and use as a function also works.
     *     var z = hi();
     * });
     * ```
     *
     * @function
     * @param {string} key The key to the string in the {@link messages}
     * object.
     * @param {string} defaultMessage The value to use if key does not exist.
     * @param {string} [defaultOnFail=true] Whether to use the default messages
     * if the messages fail to load.
     * @param {Function} [callback] Passed the message function.
     * @returns {Promise} A promise that is resolved with the message function.
    */
    localize: {
        value: function (key, defaultMessage, defaultOnFail, callback) {
            defaultOnFail = (typeof defaultOnFail === "undefined") ? true : defaultOnFail;

            var self = this,
                promise;

            if (!this._isInitialized) {
                this.initWithLocale();

                promise = this.messagesPromise.then(function () {
                    return (self.localize(key, defaultMessage, defaultOnFail, callback));
                });

            } else if (!this.messagesPromise) {
                promise = Promise.resolve(this.localizeSync(key, defaultMessage));
                promise.then(callback);

            } else {
                var l = function () {
                    var messageFn = self.localizeSync(key, defaultMessage);

                    if (typeof callback === "function") {
                        callback(messageFn);
                    }

                    return messageFn;
                };

                if (defaultOnFail) {
                    // Try and localize the message, no matter what the outcome
                    promise = this.messagesPromise.then(l, l);

                } else {
                    promise = this.messagesPromise.then(l);
                }
            }

            return promise;
        }
    },

    /**
     * Reset the saved locale back to default by using the steps above.
     * @function
     * @returns {string} the reset locale
     */
    reset: {
        value: function () {
            if (this.storesLocale && typeof window !== "undefined" && window.localStorage) {
                window.localStorage.removeItem(LOCALE_STORAGE_KEY);
            }

            this.initWithLocale();

            return this._locale;
        }
    },

    _dispatchLocaleChangeAsNeeded: {
        value: function (previousLocale, component) {
            if (component && (component.localizer === null || component.localizer === void 0 || component.localizer === this)) {
                if (typeof component.localizerDidChangeLocale === "function") {
                    component.localizerDidChangeLocale(this, previousLocale, this._locale);
                }

                return true;
            }

            return false;
        }
    },


    _dispatchLocaleChange: {
        value: function (previousLocale, _component) {
            if (!_component) {
                _component = this.component || rootComponent;

                if (!this._dispatchLocaleChangeAsNeeded(previousLocale, _component)) {
                    return;
                }
            }

            // Get the private `_childComponents` in order to avoid to create an empty array,
            // indeed childComponents is set lazily.
            var childComponents = _component._childComponents;

            if (childComponents) {
                var child;

                for (var i = 0; i < childComponents.length; i++) {
                    child = childComponents[i];

                    if (this._dispatchLocaleChangeAsNeeded(previousLocale, child)) {
                        if (child._childComponents) {
                            this._dispatchLocaleChange(previousLocale, child);
                        }
                    }
                }
            }
        }
    }

}, {

    defaultLocalizer: {
        value: function () {
            if (!defaultLocalizer) {
                defaultLocalizer = new Localizer();
                defaultLocalizer.storesLocale = true;
            }

            return defaultLocalizer;
        }
    },

    defaultLocalizerWithDelegate: {
        value: function (delegate) {
            this.defaultLocalizer();
            defaultLocalizer.delegate = delegate;

            return defaultLocalizer;
        }
    },

    defaultLocale: {
        value: "en"
    }

});

/**
 * The default localizer.
 * The locale of the defaultLocalizer is determined by following these steps:
 *
 * - If localStorage exists, use the value stored in "montage_locale"
 *   (LOCALE_STORAGE_KEY)
 * - Otherwise use the value of navigator.userLanguage (Internet Explorer)
 * - Otherwise use the value of navigator.language (other browsers)
 * - Otherwise fall back to "en"
 *
 * `defaultLocalizer.locale` can be set and if localStorage exists then the
 * value will be saved in
 *
 * "montage_locale" (LOCALE_STORAGE_KEY).
 */

Object.defineProperty(exports, "defaultLocalizer", {
    get: function () {
        return Localizer.defaultLocalizer();
    }
});


/** The localize function from {@link defaultLocalizer} provided for
 * convenience.
 *
 * @function
 * @see Localizer#localize
 */
var _localize;

Object.defineProperty(exports, "localize", {
    get: function () {
        if (!_localize) {
            var _defaultLocalizer = Localizer.defaultLocalizer();

            _localize = _defaultLocalizer.bind(_defaultLocalizer);
        }

        return _localize;
    }
});

/**
 * Tracks a message function and its data for changes in order to generate a
 * localized message.
 *
 * @class Message
 * @extends Montage
 */
var Message = exports.Message = Montage.specialize( /** @lends Message.prototype # */ {
    /**
     * @constructs Message
     */
    constructor: {
        value: function () {
            //todo: optimisation? set a flag on the localizer to listen when the locale change?
            this.addPathChangeListener("localizer.locale", this, "handleLocaleChange");
        }
    },

    /**
     * @function
     * @param {string|function} keyOrFunction A messageformat string or a
     * function that takes an object argument mapping variables to values and
     * returns a string. Usually the output of Localizer#localize.
     * @param {Object} data  Value for this data property.
     * @returns {Message} this.
     */
    init: {
        value: function (key, defaultMessage, data) {
            if (key) {
                this.key = key;
            }

            if (defaultMessage) {
                this.defaultMessage = defaultMessage;
            }

            if (data) {
                this.data = data;
            }

            return this;
        }
    },

    _localizer: {
        value: null
    },

    localizer: {
        get: function () {
            if (!this._localizer) {
                this._localizer = Localizer.defaultLocalizer();
            }

            return this._localizer;
        },
        set: function (value) {
            if (this._localizer === value) {
                return;
            }
            this._localizer = value;
            this._localize();
        }
    },

    _key: {
        value: null
    },

    /**
     * A key for the default localizer to get the message function from.
     * @type {string}
     * @default null
     */
    key: {
        get: function () {
            return this._key;
        },
        set: function (value) {
            if (this._key === value) {
                return;
            }

            this._key = value;
            this._localize();
        }
    },

    _defaultMessage: {
        value: null
    },

    defaultMessage: {
        get: function () {
            return this._defaultMessage;
        },
        set: function (value) {
            if (this._defaultMessage === value) {
                return;
            }

            this._defaultMessage = value;
            this._localize();
        }
    },

    handleLocaleChange: {
        value: function () {
            if (this._key && this._localizer && this._localizer.isInitialized) {
                this._localize();
            }
        }
    },

    _isLocalizeQueued: {
        value: false
    },

    _localize: {
        value: function () {
            if (this._isLocalizeQueued) {
                return;
            }
            this._isLocalizeQueued = true;

            var self = this;

            // Replace the _messageFunction promise with the real one.
            this._messageFunction = new Promise(function (resolve, reject) {
                // Set up a new promise now, so anyone accessing it in this tick
                // won't get the old one.
                setTimeout(function () {
                    self._isLocalizeQueued = false;

                        if (!self._key && !self._defaultMessage) {
                            // TODO: Revisit when components inside repetitions aren't uselessly instatiated.
                            // While it might seem like we should reject here, when
                            resolve(EMPTY_STRING_FUNCTION);
                            return;
                        }

                        resolve(self._localizer.localize(
                            self._key,
                            self._defaultMessage
                        ));
                    }, 0);
                });

            // Don't use fcall, so that if the `data` object is completely
            // changed we have the latest version.
            this.localized = this._messageFunction.then(function (fn) {
                return self._optimizedMessageCallBack(fn);
            });
        }
    },

    __messageFunction: {
        value: null
    },

    _messageFunction: {
        set: function (messageFunction) {
            this.__messageFunction = messageFunction;
        },
        get: function () {
            if (!this.__messageFunction) {
                this.__messageFunction = Promise.resolve(EMPTY_STRING_FUNCTION);
            }

            return this.__messageFunction;
        }
    },

    _data: {
        value: null
    },

    // Receives an object literal and creates a Map that tracks it.
    data: {
        get: function () {
            if (!this._data) {
                this._data = new Map();
                this._data.addMapChangeListener(this, "data");
            }

            return this._data;
        },
        set: function (data) {
            if (this._data === data) {
                return;
            }

            if (data) {
                // optimisation avoid to call the getter and remove/add listeners
                if (!this._data) {
                    this._data = new Map();

                } else {
                    this.data.removeMapChangeListener(this, "data");

                    if (this._data.length) {
                        this._data.clear();
                    }
                }

                for (var d in data) {
                    if (data.hasOwnProperty(d)) {
                        this.data.set(d, data[d]);
                    }
                }

                this._data.addMapChangeListener(this, "data");
                this.handleDataMapChange();
            }
        }
    },

    // TODO: Remove when possible to bind to promises
    __localizedResolved: {
        value: ""
    },

    _localizedDeferred: {
        value: Promise.resolve()
    },
    /**
        The message localized with all variables replaced.
        @type {string}
        @default ""
    */
    localized: {
        get: function() {
            this._localize();
            return this._localizedDeferred;
        },
        set: function (value) {
            if (value === this._localized) {
                return;
            }
            var self = this;

            // We create our own deferred so that if localized gets set in
            // succession without being resolved, we can replace the old
            // promises with the new one transparently.
            if(this._localizedDeferred) {
                value = Promise.resolve(value);
            }
            //this._localizedDeferred.resolve(deferred.promise);
            //value.then(deferred.resolve, deferred.reject);

            // TODO: Remove when possible to bind to promises
            value.then(function (message) {
                return (self.__localizedResolved = message);
            });

            this._localizedDeferred = value;
        }
    },

    /**
     * Whenever there is a change set the localized property.
     * @type {Function}
     * @private
     */
    handleDataMapChange: {
        value: function (event) {
            if (this._key) {
                var self = this;

                this.localized = this._messageFunction.then(function (fn) {
                    return self._optimizedMessageCallBack(fn);
                });
            }
        }
    },

    // Optimisation: avoid to create garbage and useless Map objects.
    _optimizedMessageCallBack: {
        value: function (fn) {
            if (this._data) {
                return fn(this.data.toObject());
            }

            return fn();
        }
    },

    serializeSelf: {
        value: function (serializer) {
            var result = {
                _bindingDescriptors: this._bindingDescriptors
            };

            // don't serialize the message function
            result.key = this._key;
            result.defaultMessage = this._defaultMessage;

            // only serialize localizer if it isn't the default one
            if (this._localizer !== Localizer.defaultLocalizer()) {
                result.localizer = this._localizer;
            }

            return result;
        }
    },

    serializeForLocalizations: {
        value: function (serializer) {
            var result = {},
                data,
                bindings;

            bindings = FrbBindings.getBindings(this);

            if (bindings && bindings.get("key")) {
                result[KEY_KEY] = {};
                this._serializeBinding(this, result[KEY_KEY], bindings.get("key"), serializer);
            } else {
                result[KEY_KEY] = this._key;
            }

            if (bindings && bindings.defaultMessage) {
                result[DEFAULT_MESSAGE_KEY] = {};
                this._serializeBinding(this, result[DEFAULT_MESSAGE_KEY], bindings.defaultMessage, serializer);
            } else {
                result[DEFAULT_MESSAGE_KEY] = this._defaultMessage;
            }

            var dataBindings = FrbBindings.getBindings(this.data);

            // NOTE: Can't use `Montage.getSerializablePropertyNames(this._data)`
            // because the properties we want to serialize are not defined
            // using `Montage.defineProperty`, and so don't have
            // `serializable: true` as part of the property descriptor.
            data = this.data.toObject();

            for (var p in data) {
                if (data.hasOwnProperty(p) &&
                    (!dataBindings || !dataBindings[".get('"+ p + "')"])
                ) {
                    result.data = result.data || {};
                    result.data[p] = data[p];
                }
            }

            var key, b,
                mapIter = dataBindings.keys();

            // Loop through bindings seperately in case the bound properties
            // haven't been set on the data object yet.
            while ((b = mapIter.next().value)) {
                // binding is in the form of "get('key')" because it's a map
                // but we want to serialize into an object literal instead.
                key = /\.get\('([^']+)'\)/.exec(b)[1];

                result.data = result.data || {};
                result.data[key] = {};
                this._serializeBinding(this.data, result.data[key], dataBindings.get(b), serializer);
            }


            // Loop through bindings seperately in case the bound properties
            // haven't been set on the data object yet.
            // for (b in dataBindings) {
            //     // binding is in the form of "get('key')" because it's a map
            //     // but we want to serialize into an object literal instead.
            //     var key = /\.get\('([^']+)'\)/.exec(b)[1];

            //     result.data = result.data || {};
            //     result.data[key] = {};
            //     this._serializeBinding(this.data, result.data[key], dataBindings[b], serializer);
            // }

            return result;
        }
    },

    _serializeBinding: {
        value: function (object, output, input, serializer) {
            //bindingsParameters = ["<-", "<->", "source", "revert", "convert", "trace", "serializable"];
            //
            //bindingsParameters.forEach(function (key) {
            //    if (key in binding) {
            //        data[key] = binding[key];
            //    }
            //});

            if (("serializable" in input) && !input.serializable) {
                return;
            }

            var scope,
                syntax = input.sourceSyntax;
                
            if (input.source !== object) {
                var reference = serializer.addObjectReference(input.source);
                scope = new Scope({
                    type: "component",
                    label: reference["@"]
                });
                scope.components = serializer;
                syntax = expand(syntax, scope);
            }

            scope = new Scope();
            scope.components = serializer;
            var sourcePath = stringify(syntax, scope);

            if (input.twoWay) {
                output["<->"] = sourcePath;
            } else {
                output["<-"] = sourcePath;
            }

            if (input.converter) {
                output.converter = input.converter;
            } else {
                output.convert = input.convert;
                output.revert = input.revert;
            }

            if (input.trace) {
                output.trace = true;
            }
        }
    }
});

var createMessageBinding = function (object, prop, key, defaultMessage, data, deserializer) {
    var message = new Message();

    if (data) {
        // optimisation
        var dataMap = message._data = new Map();

        var d, property, typeOfProperty;

        for (d in data) {
            if (data.hasOwnProperty(d)) {
                property = data[d];
                typeOfProperty = typeof property;

                if (typeOfProperty === "string") {
                    dataMap.set(d, property);

                } else if (typeOfProperty === "object") {
                    Bindings.defineBinding(dataMap, ".get('" + d + "')", property, {
                        components: deserializer
                    });
                }   
            }
        }

        dataMap.addMapChangeListener(message, "data");
    }

    if (typeof key === "object") {
        Bindings.defineBinding(message, "key", key, {
            components: deserializer
        });
    } else {
        message.key = key;
    }

    if (typeof defaultMessage === "object") {
        Bindings.defineBinding(message, "defaultMessage", defaultMessage, {
            components: deserializer
        });
    } else if (typeof defaultMessage === "string") {
        message.defaultMessage = defaultMessage;
    }

    Bindings.defineBinding(object, prop, {
        // TODO: Remove when possible to bind to promises and replace with
        // binding to "localized"
        "<-": "__localizedResolved",
        source: message,
        serializable: false
    });
};

Serializer.defineSerializationUnit("localizations", function (serializer, object) {
    var bindingDescriptors = FrbBindings.getBindings(object);

    if (bindingDescriptors) {
        var result;
        for (var prop in bindingDescriptors) {
            if (bindingDescriptors.hasOwnProperty(prop)) {
                var desc = bindingDescriptors[prop];
                if (Message.prototype.isPrototypeOf(desc.source)) {
                    if (!result) {
                        result = {};
                    }
                    var message = desc.source;
                    result[prop] = message.serializeForLocalizations(serializer);
                }
            }
        }
        return result;
    }
});

Deserializer.defineDeserializationUnit("localizations", function (deserializer, object, properties) {

    var desc,
        key,
        defaultMessage;

    for (var prop in properties) {
        if (properties.hasOwnProperty(prop)) {

            desc = properties[prop];
            if (!(KEY_KEY in desc)) {
                console.error("localized property '" + prop + "' must contain a key property (" + KEY_KEY + "), in ", properties[prop]);
                continue;
            }
            if(logger.isDebug && !(DEFAULT_MESSAGE_KEY in desc)) {
                logger.debug(this, "Warning: localized property '" + prop + "' does not contain a default message property (" + DEFAULT_MESSAGE_KEY + "), in ", object);
            }

            key = desc[KEY_KEY];
            defaultMessage = desc[DEFAULT_MESSAGE_KEY];

            createMessageBinding(object, prop, key, defaultMessage, desc.data, deserializer);
        }
    }
});
