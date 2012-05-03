/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2012 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
/*global require,exports */
/**
    @module montage/core/localizer
    @requires montage/core/core
    TODO
*/
var Montage = require("montage").Montage,
    MessageFormat = require("core/messageformat"),
    logger = require("core/logger").logger("localizer"),
    Deserializer = require("core/deserializer").Deserializer;

var KEY_KEY = "_",
    DEFAULT_MESSAGE_KEY = "_default";

// TODO create with the correct locale
var messageFormat = exports.messageFormat = new MessageFormat("en");

/**
    @class module:montage/core/localizer.Localizer
    @extends module:montage/core/core.Montage
*/
var Localizer = exports.Localizer = Montage.create(Montage, /** @lends module:montage/core/localizer.Localizer# */ {

});

/**
    Stores variables needed for {@link MessageLocalizer}.

    When any of the properties in this object are set using setProperty (and
    hence through a binding) {@link render} will be called.

    @class module:montage/core/localizer.MessageVariables
    @extends module:montage/core/core.Montage
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
var MessageLocalizer = Montage.create(Montage, /** @lends module:montage/core/localizer.MessageLocalizer# */ {
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

        // TODO look up key
        var message = defaultMessage || key;

        // only set variables here once KEY_KEY and DEFAULT_MESSAGE_KEY have been removed
        variables = Object.keys(desc);
        var messageLocalizer = MessageLocalizer.create().init(messageFormat, message, variables);

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
