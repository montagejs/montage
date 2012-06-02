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
    Deserializer = require("core/deserializer").Deserializer;

var KEY_KEY = "_",
    DEFAULT_MESSAGE_KEY = "_default",
    LOCALE_STORAGE_KEY = "montage_locale";

// This is not a strict match for the grammar in http://tools.ietf.org/html/rfc5646,
// but it's good enough for our purposes.
var reLanguageTagValidator = /^[a-zA-Z]+(?:-[a-zA-Z0-9]+)*$/;

/**
    @class module:montage/core/localizer.Localizer
    @extends module:montage/core/core.Montage
*/
var Localizer = exports.Localizer = Montage.create(Montage, /** @lends module:montage/core/localizer.Localizer# */ {

    /**
        Initialize the object

        @function
        @param {String} locale The RFC-5646 language tag this localizer should use.
        @returns {Localizer} The Localizer object it was called on.
    */
    init: {
        value: function(locale) {
            this.locale = locale;

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

    _messages: {
        enumerable: false,
        value: {}
    },
    /**

        @type {Object} A map from keys to messages.
        @default {}
    */
    messages: {
        get: function() {
            return this._messages;
        },
        set: function(value) {
            if (this._messages !== value) {
                if (typeof value !== "object") {
                    throw new TypeError(value, " is not an object");
                }
                this._messages = value;
            }
        }
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

    getMessageFromKey: {
        value: function(key) {
            var message, type;
            var messages = this._messages;
            if (messages.hasOwnProperty(key)) {
                message = messages[key];
                type = typeof message;
                if (type === "string") {
                    return message;
                } else if (type === "object" && message.hasOwnProperty("message")) {
                    return message.message;
                } else {
                    console.warn("Key '" + key + "' in ", messages, " is not a string or an object with a 'message' property.");
                }
            }
            return null;
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
        @param {MessageFormat} messageFormat  The message format object to use
        for compiling and localizing the message.
        @param {String} message The ICU formated message to localize.
        @param {Array[String]} variables  Array of variable names that are
        needed for the message. These properties must then be bound to.
        @returns {MessageLocalizer} the MessageLocalizer it was called on
    */
    init: {
        value: function(messageFormat, message, variables) {
            this._messageFormat = messageFormat;
            if (variables && variables.length !== 0) {
                this.variables = MessageVariables.create().init(this);
                for (var i = 0, len = variables.length; i < len; i++) {
                    this.variables[variables[i]] = null;
                }
            }
            this.message = message;
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

    _message: {
        enumerable: false,
        value: null
    },
    /**
        The ICU formated message to localize.
        @type {String}
        @default null
    */
    message: {
        get: function() {
            return this._message;
        },
        set: function(value) {
            if (this._message !== value) {
                this._message = value;
                this._messageFn = this._messageFormat.compile(value);
                this.render();
            }
        }
    },

    // compiled message function
    _messageFn: {
        value: null
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

    // The MessageFormat object we are using to render
    _messageFormat: {
        value: null
    },

    /**
        Renders the {@link message} and {@link variables} to {@link value}.
        @function
    */
    render: {
        value: function() {
            try {
                // TODO maybe optimise this if there are no variables
                this.value = this._messageFn(this.variables);
            } catch(e) {
                console.error(e.message, this._message);
            }
        }
    }
});

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

        var message = defaultLocalizer.getMessageFromKey(key) || defaultMessage || key;

        // only set variables here once KEY_KEY and DEFAULT_MESSAGE_KEY have been removed
        variables = Object.keys(desc);
        var messageLocalizer = MessageLocalizer.create().init(defaultLocalizer.messageFormat, message, variables);

        for (var i = 0, len = variables.length; i < len; i++) {
            var variable = variables[i];

            var targetPath = desc[variable];
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
