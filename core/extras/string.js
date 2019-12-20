var Map = require("collections/map");


/**
 * Defines extensions to the intrinsic `String` object.
 * @see {external:String}
 * @module montage/core/extras/string
 */

/**
 * Returns true if the two strings are equal, otherwise returns false.
 *
 * @function external:String#equals
 * @param {Object} that The object to compare to the string.
 * @returns {boolean} Returns true if the string is equal to
 * `that`.
 */
Object.defineProperty(String.prototype, "equals", {
    value: function (that) {
        return this.valueOf() === Object.getValueOf(that);
    },
    writable: true,
    configurable: true
});

/**
 * Determines whether a substring exists within this string.
 *
 * @function external:String#contains
 * @param {string} content
 * @returns {boolean} whether this string contains the given content
 */
Object.defineProperty(String.prototype, "contains", {
    value: function (substring) {
        return this.indexOf(substring) !== -1;
    },
    writable: true,
    configurable: true
});

/**
 * Capitalizes the first letter in the string.
 *
 * @function external:String#toCapitalized
 * @returns {string} The original string with its first letter capitalized.
 * @example
 * var fname = "abe";
 * var lname = "lincoln";
 * var name = fname.toCapitalized() + " " + lname.toCapitalized();
 * // name == "Abe Lincoln"
 */
Object.defineProperty(String.prototype, "toCapitalized", {
    value: function toCapitalized() {
        var value;
        return toCapitalized.cache.get(String(this)) || (toCapitalized.cache.set(String(this),(value = this[0].toUpperCase() + this.slice(1))) ? value : null);
    },
    writable: true,
    configurable: true
});
String.prototype.toCapitalized.cache = new Map();



if (!String.prototype.toCamelCase) {
    function _toCamelCase (sring, cache, isLower) {
        var trimmed = sring.trim(),
            camelCase = cache[trimmed] || '';

        if (!camelCase && trimmed.length) {
            if ((!isLower && /[^A-Z]/.test(trimmed[0])) || /\.|_|-|\s/.test(trimmed)) {
                var data = trimmed.split(/\.|_|-|\s/),
                    str;

                for (var i = 0, length = data.length; i < length; i++) {
                    str = data[i];

                    if (str) {
                        if (isLower && i === 0) {
                            camelCase += str;
                        } else {
                            camelCase += str.toCapitalized();
                        }
                    }
                }

                cache[trimmed] = camelCase;

            } else { // already camelCase
                camelCase = cache[trimmed] = trimmed;
            }
        }

        return camelCase;
    }


    Object.defineProperty(String.prototype, 'toCamelCase', {
        value: function toCamelCase() {
            return _toCamelCase(this, toCamelCase.cache);
        },
        writable: true,
        configurable: true
    });

    String.prototype.toCamelCase.cache = Object.create(null);


    Object.defineProperty(String.prototype, 'toLowerCamelCase', {
        value: function toLowerCamelCase () {
            return _toCamelCase(this, toLowerCamelCase.cache, true);
        },
        writable: true,
        configurable: true
    });

    String.prototype.toLowerCamelCase.cache = Object.create(null);
}
