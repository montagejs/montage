/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2012 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
/*global require,exports */
/**
    @module montage/core/localizer
    @requires montage/core/core
    @requires montage/core/messageformat
    @requires montage/core/logger
    @requires montage/core/deserializer
*/
var Montage = require("montage").Montage,
    MessageFormat = require("core/messageformat"),
    logger = require("core/logger").logger("localizer"),
    Deserializer = require("core/deserializer").Deserializer,
    Promise = require("core/promise").Promise;

// Add all locales to MessageFormat object
MessageFormat.locale = require("core/messageformat-locale");

var KEY_KEY = "_",
    DEFAULT_MESSAGE_KEY = "_default",
    LOCALE_STORAGE_KEY = "montage_locale",

    // directory name that the locales are stored under
    LOCALES_DIRECTORY = "locale",
    // filename (without extension) on the file that contains the messages
    MESSAGES_FILENAME = "messages";

// This is not a strict match for the grammar in http://tools.ietf.org/html/rfc5646,
// but it's good enough for our purposes.
var reLanguageTagValidator = /^[a-zA-Z]+(?:-[a-zA-Z0-9]+)*$/;

/**
    @class module:montage/core/localizer.Localizer
    @extends module:montage/core/core.Montage
*/
var Localizer = exports.Localizer = Montage.create(Montage, /** @lends module:montage/core/localizer.Localizer# */ {

    /**
        Initialize the localizer.

        @function
        @param {String} [locale] The RFC-5646 language tag this localizer should use. Defaults to defaultLocalizer.locale
        @returns {Localizer} The Localizer object it was called on.
    */
    init: {
        value: function(locale) {
            this.locale = locale || defaultLocalizer.locale;

            return this;
        }
    },

    /**
        Initialize the object

        @function
        @param {String} locale The RFC-5646 language tag this localizer should use.
        @param {Object} messages A map from keys to messages. Each message should either be a string or an object with a "message" property.
        @returns {Localizer} The Localizer object it was called on.
    */

    initWithMessages: {
        value: function(locale, messages) {
            this.locale = locale;
            this.messages = messages;

            return this;
        }
    },

    /**
        The MessageFormat object to use.

        @type {MessageFormat}
        @default null
    */
    messageFormat: {
        value: null
    },

    /**
        <p>Whether there are messages available to be used by {@link localize}.</p>

        <p>Initially this is false. If messages is set or loadMessages completes
        it is set to true. If the locale is changed or messages is set to null
        it is set back to false.</p>

        @type {Boolean}
        @default false
    */
    hasMessages: {
        value: false
    },

    _messages: {
        enumerable: false,
        value: null
    },
    /**
        A map from keys to messages.
        @type Object
        @default null
    */
    messages: {
        get: function() {
            return this._messages;
        },
        set: function(value) {
            if (this._messages !== value) {
                // != ok checking for undefined as well
                if (value != null && typeof value !== "object") {
                    throw new TypeError(value, " is not an object");
                }

                this._messages = value;
                this.hasMessages = !!value;
            }
        }
    },
    /**
        A promise for the messages property
        @type Promise
        @default null
    */
    messagesPromise: {
        value: null
    },

    _locale: {
        enumerable: false,
        value: null
    },
    /**
        A RFC-5646 language-tag specifying the locale of this localizer.

        Setting the locale will create a new {@link messageFormat} object
        with the new locale.

        @type {String}
        @default null
    */
    locale: {
        get: function() {
            return this._locale;
        },
        set: function(value) {
            if (!reLanguageTagValidator.test(value)) {
                throw new TypeError("Language tag '" + value + "' is not valid. It must match http://tools.ietf.org/html/rfc5646 (alphanumeric characters separated by hyphens)");
            }
            if (this._locale !== value) {
                this._locale = value;
                this.messageFormat = new MessageFormat(value);
            }
        }
    },

    /**
        <p>The require function to use in {@link loadMessages}</p>

        <p>By default this is set to the global require, meaning that messages
        will be loaded from the root of the application. To load messages
        from the root of your package set this to the require function from
        any class in the package.</p>

        @type {Function}
        @default global require | null
    */
    require: {
        value: (typeof global !== "undefined") ? global.require : (typeof window !== "undefined") ? window.require : null
    },

    /**
        Load messages for the locale
        @function
        @param {Number|Boolean} [timeout=5000] Number of milliseconds to wait before failing. Set to false for no timeout.
        @param {Function} [callback] Called on successful loading of messages. Using the returned promise is recomended.
        @returns {Promise} A promise for the messages.
    */
    loadMessages: {
        value: function(timeout, callback) {
            if (!this.require) {
                throw new Error("Cannot load messages as", this, "require is not set");
            }

            if (timeout === null) {
                timeout = 5000;
            }
            this.messages = null;

            var self = this;
            var messageRequire = this.require;
            var promise;

            if (messageRequire.packageDescription.manifest === true) {
                promise = messageRequire.async("manifest.json");
            } else {
                promise = Promise.reject("Package has no manifest. "+messageRequire.location+"package.json must contain \"manifest\": true and "+messageRequire.location+"manifest.json must exist");
            }

            if (timeout) {
                promise = promise.timeout(timeout);
            }

            return this.messagesPromise = promise.get("files").then(function(files) {
                return self._loadMessageFiles(files);

            }).then(function(localesMessages) {
                return self._collapseMessages(localesMessages);

            }, function(reason, error, rejection) {
                console.error("Could not load messages for '" + self.locale + "': " + reason);
                return rejection;

            }).then(function(messages) {
                if (typeof callback === "function") {
                    callback(messages);
                }
                return messages;

            });
        }
    },

    /**
        Load the locale appropriate message files from the given manifest
        structure.
        @private
        @function
        @param {Object} files An object mapping directory (locale) names to
        @returns {Promise} A promise that will be resolved with an array
        containing the content of message files appropriate to this locale.
        Suitable for passing into {@link _collapseMessages}.
    */
    _loadMessageFiles: {
        value: function(files) {
            var messageRequire = this.require;

            if (!files) {
                return Promise.reject(messageRequire.location+"manifest.json does not contain a 'files' property");
            }

            var availableLocales, localesMessagesP = [], fallbackLocale, localeFiles, filename;

            if (!(LOCALES_DIRECTORY in files)) {
                return Promise.reject("Package does not contain a '" + LOCALES_DIRECTORY + "' directory");
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
                    if ((filename = MESSAGES_FILENAME + ".js") in localeFiles) {}
                    else if ((filename = MESSAGES_FILENAME + ".json") in localeFiles) {}
                    else {
                        // missing messages file
                        if(logger.isDebug) {
                            logger.debug("Warning: '" + LOCALES_DIRECTORY + "/" + fallbackLocale + "/' does not contain '" + MESSAGES_FILENAME + ".json' or '" + MESSAGES_FILENAME + ".js'");
                        }
                        continue;
                    }

                    // Require the message file
                    localesMessagesP.push(messageRequire.async(LOCALES_DIRECTORY + "/" + fallbackLocale + "/" + filename));
                }
                // Strip the last language tag off of the locale
                fallbackLocale = fallbackLocale.substring(0, fallbackLocale.lastIndexOf("-"));
            }

            return Promise.all(localesMessagesP);
        }
    },

    /**
        Collapse an array of message objects into one, earlier elements taking
        precedence over later ones.
        @private
        @function
        @param {Array[Object]} localesMessages
        @returns {Object} An object mapping messages keys to the messages
        @example <code>[{hi: "Good-day"}, {hi: "Hello", bye: "Bye"}]</code>
        results in <code>{hi: "Good-day", bye: "Bye"}</code>
    */
    _collapseMessages: {
        value: function(localesMessages) {
            var messages = {};

            // Go through each set of messages, adding any keys that haven't
            // already been set
            for (var i = 0, len = localesMessages.length; i < len; i++) {
                var localeMessages = localesMessages[i];
                for (var key in localeMessages) {
                    if (!(key in messages)) {
                        messages[key] = localeMessages[key];
                    }
                }
            }
            this.messages = messages;
            return messages;
        }
    },

    // Caches the compiled functions from strings
    _compiledMessageCache: {
        value: {}
    },

    /**
        <p>Localize a key and return a message function.</p>

        <p>If the message is a precompiled function then this is returned
        directly. Otherwise the message string is compiled to a function with
        <a href="https://github.com/SlexAxton/messageformat.js#readme">
        messageformat.js</a>. The resulting function takes an object mapping
        from variables in the message to their values. Example:</p>

        <pre><code>
var hi = defaultLocalizer.localize("hello_name", "Hello, {name}!");
console.log(hi({name: "World"})); // => "Hello, World!""
console.log(hi()); // => Error: MessageFormat: No data passed to function.
        </code></pre>

        <p>If the message for the key is "simple", i.e. it does not contain any
        variables, then the function will implement a custom <code>toString</code>
        function that also returns the message. This means that you can use
        the function like a string. Example:</p>
        <pre><code>
var hi = defaultLocalizer.localize("hello", "Hello");
// Concatenating an object to a string calls its toString
myObject.hello = "" + hi;
var y = "The greeting '" + hi + "' is used in this locale";
// textContent only accepts strings and so calls toString
button.textContent = hi;
// and use as a function also works.
var z = hi();
        </code></pre>

        @function
        @param {String} key The key to the string in the {@link messages} object.
        @param {String} defaultMessage The value to use if key does not exist.
        @returns {Function} A function that accepts an object mapping variables
                            in the message string to values.
    */
    localize: {
        value: function(key, defaultMessage) {
            var message, type, compiled;

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
                console.error("No message or default message for key '"+ key +"'");
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
                compiled = function() { return message; };
                compiled.toString = compiled;
            } else {
                compiled = (new Function('MessageFormat', 'return ' + this.messageFormat.precompile(ast))(MessageFormat));
            }

            this._compiledMessageCache[message] = compiled;
            return compiled;
        }
    },

    /**
        <p>Async version of {@link localize}.</p>

        <p>Waits for the localizer to get messages before localizing the key.
        Use either the callback or the promise.</p>

        @function
        @param {String} key The key to the string in the {@link messages} object.
        @param {String} defaultMessage The value to use if key does not exist.
        @param {String} [defaultOnFail=true] Whether to use the default messages if the messages fail to load.
        @param {Function} [callback] Passed the message function.
        @returns {Promise} A promise that is resolved with the message function.
    */
    localizeAsync: {
        value: function(key, defaultMessage, defaultOnFail, callback) {
            var listener, deferred, promise, self = this;
            defaultOnFail = (defaultOnFail === null) ? true : defaultOnFail;

            if (!this.messagesPromise) {
                promise = Promise.resolve(this.localize(key, defaultMessage));
                promise.then(callback);
                return promise;
            }

            var l = function() {
                var messageFn = self.localize(key, defaultMessage);
                if (typeof callback === "function") {
                    callback(messageFn);
                }
                return messageFn;
            };

            if (defaultOnFail) {
                // Try and localize the message, no matter what the outcome
                return this.messagesPromise.then(l, l);
            } else {
                return this.messagesPromise.then(l);
            }
        }
    }

});

var DefaultLocalizer = Montage.create(Localizer, {
    init: {
        value: function() {
            var defaultLocale;
            if (typeof window !== "undefined") {
                if (window.localStorage) {
                    defaultLocale = window.localStorage.getItem(LOCALE_STORAGE_KEY);
                }
                defaultLocale = defaultLocale || window.navigator.userLanguage || window.navigator.language;
            }
            defaultLocale = defaultLocale || "en";
            this.locale = defaultLocale;

            return this;
        }
    },

    locale: {
        get: function() {
            return this._locale;
        },
        set: function(value) {
            Object.getPropertyDescriptor(Localizer, "locale").set.call(this, value);

            // If possible, save locale
            if (typeof window !== "undefined" && window.localStorage) {
                window.localStorage.setItem(LOCALE_STORAGE_KEY, value);
            }
        }
    },

    // Resets the saved locale of the defaultLocalizer.
    reset: {
        value: function() {
            if (typeof window !== "undefined" && window.localStorage) {
                window.localStorage.removeItem(LOCALE_STORAGE_KEY);
            }
            this.init();
        }
    }
});

/**
    <p>The default localizer.</p>

    <p>The default locale is determined by following these steps:</p>

    <ol>
        <li>If localStorage exists, use the value stored in "montage_locale" (LOCALE_STORAGE_KEY)</li>
        <li>Otherwise use the value of navigator.userLanguage (Internet Explorer)</li>
        <li>Otherwise use the value of navigator.language (other browsers)</li>
        <li>Otherwise fall back to "en"</li>
    </ol>

    <p>This can be set and the locale of {@link defaultLocalizer} will be
    updated to match. If localStorage exists then the value will be saved in
    "montage_locale" (LOCALE_STORAGE_KEY).</p>

    @property {Function} reset Reset the saved locale back to default by using the steps above.

    @type {Localizer}
*/
var defaultLocalizer = exports.defaultLocalizer = DefaultLocalizer.create().init();
defaultLocalizer.loadMessages();

/**
    Stores variables needed for {@link MessageLocalizer}.

    When any of the properties in this object are set using setProperty (and
    hence through a binding) {@link render} will be called.

    @class module:montage/core/localizer.MessageVariables
    @extends module:montage/core/core.Montage
    @private
*/
var MessageVariables = Montage.create(Montage, /** @lends module:montage/core/localizer.MessageVariables# */{
    /**
        Initialize the object.

        @function
        @param {MessageLocalizer} messageLocalizer
        @returns {MessageVariables} The MessageVariables object it was called on
    */
    init: {
        value: function(messageLocalizer) {
            this._localizer = messageLocalizer;
            return this;
        }
    },

    /**
        The MessageLocalizer this object belongs to.
        @type {MessageLocalizer}
        @default null
        @private
    */
    _localizer: {
        value: null
    },

    /**
        Handles all the message variable bindings.

        If a property is set that looks like a variable for the message then
        set it internally and re-render the message.
        @function
        @private
    */
    setProperty: {
        enumerable: false,
        value: function(path, value) {
            Object.setProperty.call(this, path, value);
            this._localizer.render();
        }
    }
});
/**
    <p>Provides an easy way to use bindings to localize a message.</p>

    <p></p>

    @class module:montage/core/localizer.MessageLocalizer
    @extends module:montage/core/core.Montage
*/
var MessageLocalizer = exports.MessageLocalizer = Montage.create(Montage, /** @lends module:montage/core/localizer.MessageLocalizer# */ {
    /**
        Initialize the object.

        @function
        @param {Function} messageFunction A function that takes an object argument
                        mapping variables to values and returns a string. Usually
                        the output of Localizer#localize.
        @param {Array[String]} variables  Array of variable names that are
        needed for the message. These properties must then be bound to.
        @returns {MessageLocalizer} the MessageLocalizer it was called on
    */
    init: {
        value: function(messageFunction, variables) {
            if (variables && variables.length !== 0) {
                this.variables = MessageVariables.create().init(this);
                for (var i = 0, len = variables.length; i < len; i++) {
                    this.variables[variables[i]] = null;
                }
            }
            this.messageFunction = messageFunction;
            return this;
        }
    },

    toString: {
        value: function() {
            return this._value;
        }
    },

    /**
        The message localized with all variables replaced.
        @type {String}
        @default null
    */
    value: {
        value: null,
    },

    _messageFunction: {
        enumerable: false,
        value: null
    },
    /**
        A function that takes an object argument mapping variables to values
        and returns a string. Usually the output of Localizer#localize.

        @type {Function}
        @default null
    */
    messageFunction: {
        get: function() {
            return this._messageFunction;
        },
        set: function(value) {
            if (this._messageFunction !== value) {
                this._messageFunction = value;
                this.render();
            }
        }
    },

    /**
        The variables needed for the {@link message}. When any of
        the properties in this object are set using setProperty (and hence
        through a binding) {@link render} will be called

        @type {MessageVariables}
        @default null
    */
    variables: {
        value: null
    },

    /**
        Renders the {@link messageFunction} and {@link variables} to {@link value}.
        @function
    */
    render: {
        value: function() {
            try {
                this.value = this._messageFunction(this.variables);
            } catch(e) {
                console.error(e.message, this.variables, this._messageFunction.toString());
            }
        }
    }
});

var createMessageBinding = function(object, prop, variables, deserializer, messageFunction) {
    if (!messageFunction) {
        throw new Error("messageFunction required");
    }

    // if the messageFunction has its own toString property, then it is a
    // simple string and there's no point creating and bindings
    if (messageFunction.hasOwnProperty("toString")) {
        object[prop] = messageFunction();
        return;
    }

    var messageLocalizer = MessageLocalizer.create().init(messageFunction, variables);

    for (var variable in variables) {
        var targetPath = variables[variable];
        var binding = {};
        var dotIndex = targetPath.indexOf(".");
        binding.boundObject = deserializer.getObjectByLabel(targetPath.slice(1, dotIndex));
        binding.boundObjectPropertyPath = targetPath.slice(dotIndex+1);
        binding.oneway = true;
        Object.defineBinding(messageLocalizer.variables, variable, binding);
    }

    Object.defineBinding(object, prop, {
        boundObject: messageLocalizer,
        boundObjectPropertyPath: "value",
        oneway: true
    });
};

Deserializer.defineDeserializationUnit("localizations", function(object, properties, deserializer) {
    for (var prop in properties) {
        var desc = properties[prop],
            key,
            defaultMessage,
            variables;

        if (!(KEY_KEY in desc)) {
            console.error("localized property '" + prop + "' must contain a key property (" + KEY_KEY + "), in ", properties[prop]);
            continue;
        }
        if(logger.isDebug && !(DEFAULT_MESSAGE_KEY in desc)) {
            logger.debug("Warning: localized property '" + prop + "' does not contain a default message property (" + DEFAULT_MESSAGE_KEY + "), in ", object);
        }

        key = desc[KEY_KEY];
        delete desc[KEY_KEY];
        defaultMessage = desc[DEFAULT_MESSAGE_KEY];
        delete desc[DEFAULT_MESSAGE_KEY];

        (function(prop, variables, key) {
            defaultLocalizer.localizeAsync(key, defaultMessage).then(function(messageFunction) {
                createMessageBinding(object, prop, variables, deserializer, messageFunction);
            });
        }(prop, desc, key));
    }
});

Deserializer.defineDeserializationUnit("localizeObjects", function(object, descriptors, deserializer) {
    var info = Montage.getInfoForObject(object);
    if (info.module !== "core/localizer" || info.property !== "Localizer") {
        return;
    }

    for (var i = 0, len = descriptors.length; i < len; i++) {
        var obj = descriptors[i].object;
        var props = descriptors[i].properties;

        for (var prop in props) {
            var key = props[prop];

            // setting the property true means we use the property's current
            // value as the key
            if (key === true) {
                key = obj[prop];
            }

            // TODO look up key
            var message = key;
            obj[prop] = message;
        }
    }
});
