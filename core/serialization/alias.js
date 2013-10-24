/*global require, exports */

var Montage = require("core/core").Montage;

/**
 * Represents a alias to a template property.
 * An alias can only point to another template property and can be optionally
 * followed by a path.
 *
 * Examples: @repetition:iteration
 *           @table:cell.index
 *
 * @class Alias
 * @extends Montage
 */
exports.Alias = Montage.specialize({ /** @lends Alias# */
    _value: {
        value: null
    },

    _aliasRegExp: {
        // $1: component name
        // $2: property name
        // $3: path (starts with a dot or colon)
        // alias = @$1:$2$3
        value: /@([_a-zA-Z$][0-9_a-zA-Z$]*):([_a-zA-Z$][0-9_a-zA-Z$]*)([\.:].*$)?/
    },
    /**
     * The alias string as found in the serialization.
     *
     * @type {String}
     */
    value: {
        get: function() {
            return this._value;
        },

        set: function(value) {
            var split = this._aliasRegExp.exec(value);

            if (!split) {
                throw new Error("Invalid alias syntax: " + value);
            }

            this._value = value;

            this._componentName = split[1];
            this._propertyName = split[2];
            this._path = split[3];
        }
    },

    _componentName: {
        value: null
    },

    /**
     * The component name part of the alias, this is the component where the
     * template property is located.
     * Derived from the alias.
     *
     * @type {String}
     * @readonly
     */
    componentName: {
        get: function() {
            return this._componentName;
        }
    },

    _propertyName: {
        value: null
    },

    /**
     * The property name of the template property. It's up to the component
     * template to define this property.
     * Derived from the alias.
     *
     * @type {String}
     * @readonly
     */
    propertyName: {
        get: function() {
            return this._propertyName;
        }
    },

    _path: {
        value: null
    },

    /**
     * The path that follows the property name reference.
     * Derived from the alias.
     *
     * @type {String}
     * @readonly
     */
    path: {
        get: function() {
            return this._path;
        }
    },

    init: {
        value: function(value) {
            this.value = value;

            return this;
        }
    }
});